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

const logger = pino({ level: "warn" });
const msgRetryCounterCache = new NodeCache();

const activeSockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
const pairingCodes: Map<string, string> = new Map();

const BOT_NAME = "CORTANA MD X-MASS ED.";
const PREFIX = ".";

async function startSocket(sessionId: string, phoneNumber?: string) {
  try {
    const authDir = path.join(process.cwd(), "auth_sessions", sessionId);

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
      browser: ["Ubuntu", "Chrome", "120.0.0"],
      generateHighQualityLinkPreview: true,
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

      console.log(`Session ${sessionId} connection update:`, JSON.stringify(update));

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
        } else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          console.log(`Session ${sessionId} requires restart (515/Restart). Reconnecting in 2s...`);
          activeSockets.delete(sessionId);
          setTimeout(() => startSocket(sessionId, phoneNumber), 2000);
        } else if (statusCode === DisconnectReason.timedOut) {
          console.log(`Session ${sessionId} timed out.`);
          // If we were connected, we should retry. If pending, maybe fail.
          // For now, let's treat timeout as fail if pending, retry if connected?
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
            // If it has text, append notification, otherwise send notification then media

            if (botSettings.antideleteMode === 'all') {
              // Resend to chat (In-place)
              await sock.sendMessage(update.key.remoteJid, { text: caption, mentions: [sender] });
              if (!messageContent.conversation && !messageContent.extendedTextMessage) {
                // Resend media if possible
                await sock.sendMessage(update.key.remoteJid, { forward: originalMsg, forceForward: true });
              }
            } else if (botSettings.antideleteMode === 'pm') {
              // Send to Bot Owner (PM) - or Self if self-mode
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
        // 1. Cache Message for Antidelete
        if (msg.key.id && msg.message) {
          messageCache.add(msg.key.id, msg);
        }

        if (!msg.message || msg.message.protocolMessage) continue;

        const jid = msg.key.remoteJid!;
        const isGroup = jid.endsWith("@g.us");
        const botSettings = await storage.getBotSettings(sessionId);

        // 2. Auto Status View & Like
        if (jid === "status@broadcast" && botSettings?.autostatusView) {
          await sock.readMessages([msg.key]);
          // React with like (💚)
          await sock.sendMessage("status@broadcast", {
            react: { key: msg.key, text: "💚" }
          }, { statusJidList: [msg.key.participant] });
          continue; // Stop processing status messages further
        }

        const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
        if (isOwnBotMessage) continue;

        // 3. Group Checks (Antilink, Anti-Tagall)
        if (isGroup) {
          const groupSettings = await storage.getGroupSettings(jid);
          if (groupSettings) {
            const isAdmin = false; // logic to check if sender is admin needed here if we want to bypass admins
            // For now, assume common users

            const sender = msg.key.participant!;
            const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

            // Antilink
            if (groupSettings.antilinkMode !== 'off' && (body.includes("chat.whatsapp.com") || body.includes("http"))) {
              // Check if sender is admin (Skipped for brevity/limitations, assume simple check)
              // Ideally: const groupMetadata = await sock.groupMetadata(jid); const admins = ...

              if (groupSettings.antilinkMode === 'kick') {
                await sock.sendMessage(jid, { delete: msg.key });
                await sock.groupParticipantsUpdate(jid, [sender], "remove");
              } else if (groupSettings.antilinkMode === 'warn') {
                await sock.sendMessage(jid, { delete: msg.key });

                let warnings = JSON.parse(groupSettings.warnings || '{}');
                warnings[sender] = (warnings[sender] || 0) + 1;

                if (warnings[sender] >= 4) {
                  await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} has been kicked for sending links (4/4 warnings).`, mentions: [sender] });
                  await sock.groupParticipantsUpdate(jid, [sender], "remove");
                  delete warnings[sender];
                } else {
                  await sock.sendMessage(jid, { text: `⚠️ @${sender.split('@')[0]} Links are not allowed! Warning: ${warnings[sender]}/4`, mentions: [sender] });
                }

                await storage.updateGroupSettings(jid, { warnings: JSON.stringify(warnings) });
              }
            }

            // Antigroupmention (Anti-Tagall)
            if (groupSettings.antigroupmentionMode !== 'off' && (body.includes("@everyone") || body.includes("@here"))) {
              if (groupSettings.antigroupmentionMode === 'kick') {
                await sock.groupParticipantsUpdate(jid, [sender], "remove");
              } else if (groupSettings.antigroupmentionMode === 'warn') {
                let warnings = JSON.parse(groupSettings.warnings || '{}');
                warnings[sender] = (warnings[sender] || 0) + 1;

                if (warnings[sender] >= 4) {
                  await sock.sendMessage(jid, { text: `🚫 @${sender.split('@')[0]} has been kicked for mass mentioning (4/4 warnings).`, mentions: [sender] });
                  await sock.groupParticipantsUpdate(jid, [sender], "remove");
                  delete warnings[sender];
                } else {
                  await sock.sendMessage(jid, { text: `⚠️ @${sender.split('@')[0]} Mass mentions are not allowed! Warning: ${warnings[sender]}/4`, mentions: [sender] });
                }

                await storage.updateGroupSettings(jid, { warnings: JSON.stringify(warnings) });
              }
            }
          }
        }

        await handleMessage(sock, msg, sessionId);
      }
    });

    return sock;
  } catch (err) {
    console.error(`startSocket failed for ${sessionId}:`, err);
    throw err;
  }
}

export async function requestPairingCode(phoneNumber: string): Promise<{ sessionId: string; pairingCode: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  if (cleanPhone.length < 10) throw new Error("Invalid phone number");

  const sessionId = randomUUID();

  await storage.createSession({
    id: sessionId,
    phoneNumber: cleanPhone,
    status: "pending",
    creds: null,
    keys: null,
  });

  const sock = await startSocket(sessionId, cleanPhone);

  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!sock.authState.creds.registered) {
    try {
      console.log(`Requesting pairing code for ${cleanPhone}...`);
      const pairingCode = await sock.requestPairingCode(cleanPhone);
      pairingCodes.set(sessionId, pairingCode);
      return { sessionId, pairingCode };
    } catch (error: any) {
      console.error(`Failed to generate pairing code: ${error.message}`);
      await storage.updateSession(sessionId, { status: "failed" });
      activeSockets.delete(sessionId);
      try { sock.end(undefined); } catch { }
      throw new Error("Failed to generate pairing code.");
    }
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
  const isGroup = jid.endsWith("@g.us");
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
      console.log(`Unknown command: ${commandName}`);
    }
  } catch (error) {
    console.error(`Error executing ${commandName}:`, error);
    await sock.sendMessage(jid, { text: "❌ An error occurred." });
  }
}