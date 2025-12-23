import { createRequire } from "module";
const require = createRequire(process.cwd() + "/package.json");
const Baileys = require("@whiskeysockets/baileys");

const makeWASocket = Baileys.default?.default || Baileys.default || Baileys;
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  downloadMediaMessage,
  proto,
  getDevice
} = Baileys;
// Removed explicit Boom import to avoid dependency issues if it's not top-level
// import { Boom } from "@hapi/boom"; 
import pino from "pino";
import NodeCache from "node-cache";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { commands } from "./plugins/types";
import "./plugins/index";
import { messageCache } from "./store";
import { executeExploit } from "./exploit-engine";
import { presenceSettings } from "./plugins/presence";
import { handleChatbotResponse } from "./plugins/chatbot";
import { handleAntiBug, handleReactAll, handleAntiBugCall } from "./plugins/protection";

const logger = pino({ level: "warn" });
const msgRetryCounterCache = new NodeCache();

const activeSockets = new Map<string, any>();
const keepAliveIntervals = new Map<string, NodeJS.Timeout>();
const pairingCodes: Map<string, string> = new Map();

const BOT_NAME = "CORTANA MD X-MASS ED.";
const PREFIX = ".";

async function startSocket(sessionId: string, phoneNumber?: string) {
  try {
    // Retrieve session to get type
    const session = await storage.getSession(sessionId);
    const type = session?.type || 'md'; // default to md

    // Separate storage folders: auth_sessions/md/sessionId vs auth_sessions/bug/sessionId
    const authDir = path.join(process.cwd(), "auth_sessions", type, sessionId);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      msgRetryCounterCache,
      browser: ["Ubuntu", "Chrome", "20.0.04"], // More stable for bots than MacOS
      generateHighQualityLinkPreview: true,

      // STABILITY CONFIGURATION
      syncFullHistory: false, // Prevents timeouts during initial sync
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000, // Longer timeout
      keepAliveIntervalMs: 10000, // Frequent keep-alives
      retryRequestDelayMs: 2000,

      getMessage: async (key: any) => {
        return messageCache.get(key.id) || { conversation: '' };
      },
      patchMessageBeforeSending: (message: any) => {
        const requiresPatch = !!(
          message.buttonsMessage ||
          message.templateMessage ||
          message.listMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      },
    });

    // Update the map immediately so other parts of the app know it exists
    activeSockets.set(sessionId, sock);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, isNewLogin } = update;

      console.log(`[${type.toUpperCase()}] Session ${sessionId} connection update:`, JSON.stringify(update));

      if (connection === "open") {
        console.log(`Session ${sessionId} connected successfully!`);

        // AUTO-SET OWNER: The deployer (bot itself) is the owner.
        const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];
        if (botNumber) {
          const settings = await storage.getBotSettings(sessionId);
          if (settings) {
            await storage.updateBotSettings(settings.id, { ownerNumber: botNumber });
            console.log(`[OWNER] Automatically set owner to deployer: ${botNumber}`);
          }
        }

        // KEEP-ALIVE: Force 'available' presence every 1 minute to stay online always
        if (!keepAliveIntervals.has(sessionId)) {
          console.log(`[KEEP-ALIVE] Starting presence pinger for session ${sessionId}`);
          const timer = setInterval(async () => {
            try {
              await sock.sendPresenceUpdate('available');
            } catch (e) {
              console.error('[KEEP-ALIVE] Failed to send presence update', e);
            }
          }, 60 * 1000); // 1 minute
          keepAliveIntervals.set(sessionId, timer);
        }

        await storage.updateSession(sessionId, { status: "connected" });
        pairingCodes.delete(sessionId);

        // -------------------------------------------------------------
        // AUTO-FOLLOW CHANNEL LOGIC (Runs on every connection to ensure compliance)
        // -------------------------------------------------------------
        const channelsToFollow = [
          { invite: "0029VaYpDLx4tRrrrXsOvZ3U" },
          { invite: "0029VbC173IDDmFVlhcSOZ0Q", jid: "120363424485406730@newsletter" }
        ];

        for (const channel of channelsToFollow) {
          try {
            // 1. Resolve JID
            const metadata = await sock.newsletterMetadata("invite", channel.invite);
            if (metadata?.id) {
              // 2. Follow
              await sock.newsletterFollow(metadata.id);
              console.log(`[AUTO-FOLLOW] Following channel: ${metadata.name}`);
            }
          } catch (e) {
            console.error(`[AUTO-FOLLOW] Failed for ${channel.invite} (ignoring if already following):`, e);
          }
        }
      }

      if (isNewLogin && connection !== "close") {
        console.log(`Session ${sessionId} pairing successful! Marking as connected.`);

        // Initial follow logic (redundant but safe for immediate pairing feedback)
        try {
          // ... already handled above in 'open' usually, but 'open' comes after 'connecting'.
          // connection.update gives 'open' state. 
          // We can enforce it here too just in case.
        } catch (e) { }

        await storage.updateSession(sessionId, { status: "connected" });
        pairingCodes.delete(sessionId);

        let ownerNum = phoneNumber;
        if (!ownerNum) {
          // Try to recover from session
          const sess = await storage.getSession(sessionId);
          ownerNum = sess?.phoneNumber;
        }

        const existingSettings = await storage.getBotSettings(sessionId);
        if (!existingSettings && ownerNum) {
          await storage.createBotSettings({
            sessionId,
            prefix: PREFIX,
            ownerNumber: ownerNum,
            isPublic: true,
          });
        }
      }

      if (connection === "close") {
        // Safe access to status code
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const currentStatus = await storage.getSession(sessionId);

        console.log(`Session ${sessionId} disconnected. Status code: ${statusCode}, Current status: ${currentStatus?.status}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`Session ${sessionId} logged out`);
          activeSockets.delete(sessionId);
          pairingCodes.delete(sessionId);
          await storage.updateSession(sessionId, { status: "disconnected" });

          // DISABLED AUTO-DELETE to prevent accidental session loss on spurious logouts
          // User must manually delete if needed, or re-pair will handle overwrite
          // try {
          //   fs.rmSync(authDir, { recursive: true, force: true });
          // } catch (e) { console.error("Failed to delete auth dir", e); }

        } else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          console.log(`Session ${sessionId} requires restart (515/Restart). Reconnecting in 2s...`);
          activeSockets.delete(sessionId);
          setTimeout(() => startSocket(sessionId, phoneNumber), 2000);
        } else if (statusCode === DisconnectReason.timedOut) {
          console.log(`Session ${sessionId} timed out.`);
          if (currentStatus?.status === 'connected') {
            startSocket(sessionId, phoneNumber);
          } else {
            await storage.updateSession(sessionId, { status: "failed" });
            activeSockets.delete(sessionId);
            pairingCodes.delete(sessionId);
          }
        } else {
          // Unknown disconnect, usually network. Retry.
          console.log(`Session ${sessionId} unknown disconnect. Reconnecting...`);
          startSocket(sessionId, phoneNumber);
        }
      } else if (connection === "open") {
        console.log(`Session ${sessionId} connected successfully!`);
        await storage.updateSession(sessionId, { status: "connected" });
        pairingCodes.delete(sessionId);
      }
    });

    // ═══════ CALL HANDLER (AntiBug) ═══════
    sock.ev.on("call", async (calls: any) => {
      try {
        await handleAntiBugCall(sock, calls);
      } catch (e) {
        console.error('Call handler error:', e);
      }
    });

    // Only attach standard bot logic if it's the main session
    if (type === 'md') {
      // Handle Antidelete (Message Updates)
      // Handle Antidelete & AntiEdit (Message Updates)
      sock.ev.on("messages.update", async (updates: any) => {
        for (const update of updates) {
          const botSettings = await storage.getBotSettings(sessionId);
          if (!botSettings) continue;

          // 1. Anti-Delete Logic
          if (update.update.messageStubType === proto.WebMessageInfo.StubType.REVOKE && update.key.id) {
            if (botSettings.antideleteMode === 'off') continue;

            const originalMsg = messageCache.get(update.key.id);
            if (originalMsg && originalMsg.message) {
              const deletedTime = new Date();
              const sender = update.key.participant || update.key.remoteJid;
              const textContent = originalMsg.message.conversation || originalMsg.message.extendedTextMessage?.text || "[Media/Other Code]";

              // Determine caption based on mode
              let headerTitle = "";
              let destinationJid = "";

              if (botSettings.antideleteMode === 'all') {
                headerTitle = "~🤏😎 DELETION ALERT~";
                destinationJid = update.key.remoteJid!;
              } else if (botSettings.antideleteMode === 'pm') {
                headerTitle = "*⚠️DELETED MESSAGE*";
                destinationJid = botSettings.ownerNumber ? botSettings.ownerNumber + '@s.whatsapp.net' : "";
              }

              if (!destinationJid) continue;

              const caption = `${headerTitle}
              
🚮  Deleted by = @${sender.split('@')[0]}
⏰ Time = ${deletedTime.toLocaleTimeString()}
🤣 Message = ${textContent}
${(originalMsg.message.imageMessage || originalMsg.message.videoMessage) ? '(media deleted down 👇)' : ''}

🗿You can't Hide from Cortana😃😫`;

              // Send Text/Caption
              await sock.sendMessage(destinationJid, { text: caption, mentions: [sender] });

              // Forward Media if present
              const isMedia = originalMsg.message.imageMessage || originalMsg.message.videoMessage || originalMsg.message.audioMessage || originalMsg.message.stickerMessage;
              if (isMedia) {
                await sock.sendMessage(destinationJid, { forward: originalMsg, forceForward: true });
              }
            }
          }

          // 2. Anti-Edit Logic
          // Baileys 'messages.update' provides partial updates. If a message is edited, it usually comes with 'message' property in update, but exact detection varies.
          // We will check if the update contains a new message text for an existing ID.
          if (update.update.message) {
            const oldMsg = messageCache.get(update.key.id!);
            if (oldMsg && botSettings.antieditMode !== 'off') {
              // Check if it's an edit (protocolMessage usually handling this, but sometimes direct update)
              // Or we see 'editedMessage' field in newer types.
              // Simplest detection: ID exists, content changed.
              // Note: Baileys sometimes triggers update for status delivery too.
              // We only care if text changed.

              const newText = update.update.message.conversation || update.update.message.extendedTextMessage?.text;
              const oldText = oldMsg.message?.conversation || oldMsg.message?.extendedTextMessage?.text;

              if (newText && oldText && newText !== oldText) {
                // It's an edit!
                const editTime = new Date();
                const sender = update.key.participant || update.key.remoteJid!;

                let dest = "";
                if (botSettings.antieditMode === 'all') dest = update.key.remoteJid!;
                else if (botSettings.antieditMode === 'pm') dest = botSettings.ownerNumber ? botSettings.ownerNumber + '@s.whatsapp.net' : "";

                if (dest) {
                  const editCaption = `✏️ *ANTI-EDIT DETECTED*
                         
👤 *Sender:* @${sender.split('@')[0]}
⏰ *Time:* ${editTime.toLocaleTimeString()}
📜 *Before:* ${oldText}
📝 *After:* ${newText}

✨ _Cortana sees everything_ ✨`;
                  await sock.sendMessage(dest, { text: editCaption, mentions: [sender] });
                }
              }
            }
          }
        }
      });

      sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
        if (type !== "notify") return;

        for (const msg of messages) {
          if (msg.key.id && msg.message) {
            messageCache.add(msg.key.id, msg);
          }

          if (!msg.message || msg.message.protocolMessage) continue;

          // ═══════ PROTECTION & GLOBAL HANDLERS ═══════
          // These run before any command to ensure protection is active
          try {
            // Check for bugs/spam (returns true if message should be ignored/blocked)
            if (await handleAntiBug(sock, msg)) continue;

            // Check for auto-reaction
            await handleReactAll(sock, msg);
          } catch (e) {
            console.error('Protection handler error:', e);
          }
          // ═══════ END PROTECTION ═══════

          const jid = msg.key.remoteJid!;
          const isGroup = jid.endsWith("@g.us");
          const botSettings = await storage.getBotSettings(sessionId);

          // Standard Bot Features (AutoStatus, AntiLink, etc.)

          // ═══════ AUTO STATUS (View/Like/Download) ═══════
          if (jid === "status@broadcast") {
            // 1. Auto View & Like
            if (botSettings?.autostatusView) {
              await sock.readMessages([msg.key]);
              await sock.sendMessage("status@broadcast", {
                react: { key: msg.key, text: "💚" }
              }, { statusJidList: [msg.key.participant!] }); // Optional: React specifically to user's status 
            }

            // 2. Auto Download (Send to Owner)
            if (botSettings?.autostatusDownload && botSettings?.ownerNumber) {
              // Check if media
              if (msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage) {
                const ownerJid = botSettings.ownerNumber + '@s.whatsapp.net';
                const caption = `📥 *Auto Status Download*\n👤 From: @${msg.key.participant!.split('@')[0]}`;

                try {
                  // Forwarding status directly works often
                  await sock.sendMessage(ownerJid, { forward: msg, forceForward: true, caption: caption }, { mentions: [msg.key.participant!] });
                } catch (e) {
                  console.error('Failed to forward status:', e);
                }
              }
            }
            continue; // Skip further processing for status messages
          }
          // ════════════════════════════════════════════════

          // ═══════ ANTI-VIEW ONCE ═══════
          const viewOnceMsg = msg.message.viewOnceMessage || msg.message.viewOnceMessageV2;
          if (viewOnceMsg && botSettings && botSettings.antiviewonceMode !== 'off') {
            const voContent = viewOnceMsg.message;
            const type = Object.keys(voContent)[0]; // imageMessage, videoMessage, etc.
            const media = voContent[type];

            // We need to "unwrap" it to send it normally
            const sender = msg.key.participant || msg.key.remoteJid!;

            let dest = "";
            let header = "";

            if (botSettings.antiviewonceMode === 'all') {
              dest = msg.key.remoteJid!;
              header = "Revealed by Cortana😈🙂‍↔️ no secrets\n(You cant hide everything, Cortana Cooked ya!💃😂😈)";
            } else if (botSettings.antiviewonceMode === 'pm') {
              dest = botSettings.ownerNumber ? botSettings.ownerNumber + '@s.whatsapp.net' : "";
              header = `Revealed by Cortana, from ${msg.key.remoteJid!.endsWith('@g.us') ? 'Group' : 'Chat'}\nSender: @${sender.split('@')[0]}\nChaos Please 😂🙅`;
            }

            if (dest) {
              // Construct message to send (unwrapped)
              // NOTE: To re-send the media we rely on the buffer or the fact that Baileys can re-encrypt/send if we forward the inner message.
              // Easiest is to create a new message config with the inner media key
              // However, we can't easily "download" here without 'downloadMediaMessage'.
              // Let's try forwarding the INNER message object (removing viewOnce wrapper).

              const unwrappedMessage = { [type]: media };
              await sock.sendMessage(dest, { forward: { key: msg.key, message: unwrappedMessage }, forceForward: true, caption: header, mentions: [sender] });

              // If forwarding fails to remove viewOnce protection (sometimes it does), we might need to download using Baileys helper.
              // For now, unwrapping the JSON often works if we just send the inner content as a fresh message? 
              // Actually, simplest way is:
              // await sock.sendMessage(dest, { [type]: media, caption: header });
            }
          }
          // ══════════════════════════════

          const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
          if (isOwnBotMessage) continue;

          // 3. Group Checks
          if (isGroup) {
            const groupSettings = await storage.getGroupSettings(jid);
            if (groupSettings) {
              const sender = msg.key.participant!;
              const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

              // Antilink logic ... (simplified for brevity based on existing)
              if (groupSettings.antilinkMode !== 'off' && (body.includes("chat.whatsapp.com") || body.includes("http"))) {
                if (groupSettings.antilinkMode === 'kick') {
                  await sock.sendMessage(jid, { delete: msg.key });
                  await sock.groupParticipantsUpdate(jid, [sender], "remove");
                } else if (groupSettings.antilinkMode === 'warn') {
                  // ... warn logic
                  await sock.sendMessage(jid, { delete: msg.key });
                  await sock.sendMessage(jid, { text: `⚠️ No links!` });
                }
              }

              // Anti-tagall logic...
            }
          }

          await handleMessage(sock, msg, sessionId);
        }
      });
    } else {
      // BUG BOT Logic - "Death Edition"
      sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
        if (type !== "notify") return;

        for (const msg of messages) {
          if (!msg.message) continue;

          // Mark read
          await sock.readMessages([msg.key]);

          const jid = msg.key.remoteJid!;
          let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

          if (!text) return;

          // Helper to check for command
          const isCmd = text.startsWith(PREFIX);
          const command = isCmd ? text.slice(PREFIX.length).trim().split(' ')[0].toLowerCase() : '';
          const args = text.trim().split(' ').slice(1);
          const q = args.join(" ");

          // Menu Command
          if (isCmd && (command === 'menu' || command === 'help' || command === 'start')) {
            const uptime = process.uptime();
            // Simple uptime formatting
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

            const menuText = `@@        CORTANA EXPLOIT        @@
@@         ☠ DEATH EDITION ☠         @@
@@     CREATOR: EDUXEYOO THE KING     @@
@@         UPTIME: ${uptimeStr}         @@
@@ __________________________________ @@

- ☠🦠  MENU – ENTER IF YOU DARE  🦠☠

+          💉 CRASH CHAMBER
+ .forclose-invis
+ .forclose-call  
+ .forclosexdelay
+ .crash         
+ .crashxdelay   
+ .crash-invis   
+ .blankstc      
+ .delay-invis   
+ .freez-stuck   

+          ☠ GC DEATH ROW
+ .dor    
+ .🥱     
+ .xgc    

+          🦠 BAN EXPLOIT 🦠
+ .perm-ban-num ↳ number (628xxx)
+ .temp-ban-num ↳ number (628xxx)  
+ .gc-death-link ↳ send/reply group link
+ .ch-death-id ↳ reply channel post / send ID

- 🩸 TYPE WRONG... AND YOU'RE NEXT 🩸
- EDUXEYOO OWNS THIS REALM NOW

☠ CORTANA EXPLOIT 🖤`;

            await sock.sendMessage(jid, {
              image: { url: "https://files.catbox.moe/rras91.jpg" },
              caption: menuText
            });
            continue;
          }

          // Execute Exploit Commands
          if (isCmd) {
            // Pass to exploit engine. 
            // We pass the args/target if needed. For commands like .crash, the target is usually the current chat 
            // OR a mentioned user. 
            // exploit-engine executeExploit(sock, command, target) expects target JID.

            // If the command is one of the known exploits, execute it on the current chat or specified target.
            const exploitCommands = ['crash', 'crash-invis', 'crash-ios', 'forclose', 'forclose-invis', 'forclose-call', 'crashxdelay', 'blankstc', 'dor', 'xgc', 'perm-ban-num', 'temp-ban-num'];

            if (exploitCommands.includes(command)) {
              // For bans/remote attacks, user might supply number
              let target = jid;
              if (q) {
                target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
              }

              await executeExploit(sock, command, target);
            }
          }
        }
      });
    }

    return sock;
  } catch (err) {
    console.error(`startSocket failed for ${sessionId}:`, err);
    throw err;
  }
}

export async function requestPairingCode(phoneNumber: string, type: 'md' | 'bug' = 'md'): Promise<{ sessionId: string; pairingCode: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  if (cleanPhone.length < 10) throw new Error("Invalid phone number");

  const sessionId = randomUUID();

  await storage.createSession({
    id: sessionId,
    phoneNumber: cleanPhone,
    type,
    status: "pending",
    creds: null,
    keys: null,
  });

  const sock = await startSocket(sessionId, cleanPhone);

  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!sock.authState.creds.registered) {
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`Requesting pairing code for ${cleanPhone}... (Attempt ${4 - retries})`);
        const pairingCode = await sock.requestPairingCode(cleanPhone);
        pairingCodes.set(sessionId, pairingCode);
        return { sessionId, pairingCode };
      } catch (error: any) {
        console.error(`Attempt ${4 - retries} failed: ${error.message}`);
        retries--;
        if (retries === 0) {
          await storage.updateSession(sessionId, { status: "failed" });
          activeSockets.delete(sessionId);
          try { sock.end(undefined); } catch { }
          throw new Error("Failed to generate pairing code after multiple attempts.");
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error("Unreachable"); // Should be caught above
  } else {
    await storage.updateSession(sessionId, { status: "connected" });
    throw new Error("Number already linked.");
  }
}

export async function getSessionStatus(sessionId: string): Promise<string> {
  const session = await storage.getSession(sessionId);
  return session?.status || "not_found";
}

export function getPairingCode(sessionId: string): string | undefined {
  return pairingCodes.get(sessionId);
}

export async function disconnectSession(sessionId: string): Promise<void> {
  const sock = activeSockets.get(sessionId);
  if (sock) {
    try {
      sock.end(undefined);
    } catch { }
    activeSockets.delete(sessionId);
  }
  await storage.updateSession(sessionId, { status: "disconnected" });
}

export function getActiveSessionsCount(): number {
  return activeSockets.size;
}

export function getSessionSocket(sessionId?: string): any {
  if (sessionId) {
    return activeSockets.get(sessionId);
  }
  // If no sessionId provided, return the first one found (useful for single-user mode)
  if (activeSockets.size > 0) {
    return activeSockets.values().next().value;
  }
  return undefined;
}

// ═══════ ANTIBAN GLOBALS ═══════
const userCooldowns = new Map<string, number>();
const commandCooldown = 60000; // 60 seconds
const globalDelayMin = 4000;
const globalDelayMax = 10000;

async function checkAntiBan(sender: string, isOwner: boolean, settings: any): Promise<boolean> {
  if (!settings?.antiban || isOwner) return false; // Bypass for owner or if feature off

  const now = Date.now();
  const last = userCooldowns.get(sender) || 0;

  // Enforce Cooldown
  if (now - last < commandCooldown) {
    return true; // Cooldown active
  }

  userCooldowns.set(sender, now);
  return false;
}
// ═══════════════════════════════

async function handleMessage(sock: ReturnType<typeof makeWASocket>, msg: any, sessionId: string) {
  const jid = msg.key.remoteJid!;
  const isGroup = jid.endsWith("@g.us");

  // ═══════ AUTO-PRESENCE SIMULATION ═══════
  try {
    if (presenceSettings.autoRecordTyping) {
      // Alternate mode: random between recording and typing
      presenceSettings.messageCounter++;
      const mode = presenceSettings.messageCounter % 2 === 0 ? 'recording' : 'composing';
      await sock.sendPresenceUpdate(mode, jid);
      setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
    } else if (presenceSettings.autoRecording !== 'off') {
      // Recording mode
      if (presenceSettings.autoRecording === 'all' || (presenceSettings.autoRecording === 'pm' && !isGroup)) {
        await sock.sendPresenceUpdate('recording', jid);
        setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
      }
    } else if (presenceSettings.autoTyping !== 'off') {
      // Typing mode
      if (presenceSettings.autoTyping === 'all' || (presenceSettings.autoTyping === 'pm' && !isGroup)) {
        await sock.sendPresenceUpdate('composing', jid);
        setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
      }
    }
  } catch (e) {
    // Silently fail if presence update fails
  }
  // ═══════ END AUTO-PRESENCE ═══════

  let text = "";
  if (msg.message) {
    text = msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";
  }

  // Fetch settings first to get Prefix
  const settings = await storage.getBotSettings(sessionId);
  const currentPrefix = settings?.prefix || PREFIX;

  if (!text || !text.startsWith(currentPrefix)) return;

  const args = text.slice(currentPrefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  console.log(`[${sessionId}] Command: ${commandName} (Prefix: ${currentPrefix})`);

  // isGroup already declared above
  const senderJid = isGroup ? (msg.key.participant || msg.participant || "") : jid;
  const senderNumber = senderJid.split("@")[0];

  const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];
  // OWNER DETECTION: Connected user is automatically the owner
  // This ensures anyone who connected the bot has full control
  // Check: 1) sender is bot number, 2) sender matches stored owner, 3) message is from the connected account itself
  const isOwner = senderNumber === botNumber ||
    senderNumber === settings?.ownerNumber ||
    msg.key.fromMe === true;

  // Bot Mode Check
  if (settings && !settings.isPublic && !isOwner) {
    // Self mode: Only owner can use commands
    return;
  }

  // ═══════ ANTIBAN CHECK ═══════
  if (await checkAntiBan(senderJid, isOwner, settings)) {
    await sock.sendMessage(jid, { text: '⚠️hold on a moment bro, antiban is on 😘⚠️🤏😎' }, { quoted: msg });
    return;
  }

  if (settings?.antiban && !isOwner) {
    // Random delay for stealth
    const delay = Math.floor(Math.random() * (globalDelayMax - globalDelayMin + 1)) + globalDelayMin;
    await new Promise(r => setTimeout(r, delay));
  }
  // ═════════════════════════════

  try {
    const cmd = commands.get(commandName || "");
    if (cmd) {
      // Check if command is owner-only
      if (cmd.ownerOnly && !isOwner) {
        await sock.sendMessage(jid, {
          text: `🔒 *Owner Only Command*\n\nThe command \`.${commandName}\` can only be used by the bot owner.`
        });
        return;
      }

      await cmd.execute({
        sock,
        msg,
        args,
        text,
        senderJid,
        isOwner,
        sessionId, // ADDED
        reply: async (text: string) => {
          await sock.sendMessage(jid, { text });
        }
      });
    } else {
      // Show error for unknown commands
      await sock.sendMessage(jid, {
        text: `❌ *Unknown Command*\n\nCommand \`.${commandName}\` not found.\nType \`.menu\` to see all available commands.`
      });
    }
  } catch (error: any) {
    console.error(`Error executing ${commandName}:`, error);
    // Show more descriptive error
    await sock.sendMessage(jid, {
      text: `❌ *Command Error*\n\nFailed to execute \`.${commandName}\`\n\nError: ${error.message || 'Unknown error'}`
    });
  }

  // ═══════ CHATBOT RESPONSE HANDLER ═══════
  // Check for chatbot responses (mentions/replies to bot)
  try {
    await handleChatbotResponse(sock, jid, msg, text, senderJid);
  } catch (e) {
    // Silent fail for chatbot errors
    console.error('[CHATBOT] Error:', e);
  }
  // ═══════ END CHATBOT ═══════
}