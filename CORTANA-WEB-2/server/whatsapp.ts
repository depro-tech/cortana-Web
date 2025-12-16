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
  downloadMediaMessage
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
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      generateHighQualityLinkPreview: true,
      getMessage: async (key: any) => {
        return { conversation: '' };
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
        } else if (statusCode === 515) {
          // Stream error (Restart Required) - Common with Baileys
          // We explicitly check for 515 regardless of "connected" status to be safe, 
          // though usually it happens after connection.

          console.log(`Session ${sessionId} encountered Stream Error (515). Reconnecting in 2s...`);
          activeSockets.delete(sessionId);

          setTimeout(async () => {
            console.log(`Reconnecting session ${sessionId} now...`);
            try {
              // If we don't have phoneNumber here, we try to get it from storage inside startSocket or it's fine
              // passing undefined is okay if settings already exist.
              await startSocket(sessionId, phoneNumber);
            } catch (err) {
              console.error(`Failed to reconnect session ${sessionId}:`, err);
            }
          }, 2000);
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log(`Session ${sessionId} requires restart. Reconnecting...`);
          activeSockets.delete(sessionId);
          startSocket(sessionId, phoneNumber);
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

        let ownerNum = phoneNumber;
        if (!ownerNum) {
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
    });

    sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message || msg.message.protocolMessage) continue;

        const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
        if (isOwnBotMessage) continue;

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

  if (cleanPhone.length < 10) {
    throw new Error("Invalid phone number");
  }

  const sessionId = randomUUID();

  await storage.createSession({
    id: sessionId,
    phoneNumber: cleanPhone,
    status: "pending",
    creds: null,
    keys: null,
  });

  const sock = await startSocket(sessionId, cleanPhone);

  // Wait a bit for the socket to be ready to request code
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!sock.authState.creds.registered) {
    try {
      console.log(`Requesting pairing code for ${cleanPhone}...`);
      const pairingCode = await sock.requestPairingCode(cleanPhone);
      pairingCodes.set(sessionId, pairingCode);
      console.log(`Pairing code: ${pairingCode}`);
      return { sessionId, pairingCode };
    } catch (error: any) {
      console.error(`Failed to generate pairing code: ${error.message}`);
      // Don't mark as failed immediately if it's just a rate limit, but here we assume it failed.
      await storage.updateSession(sessionId, { status: "failed" });
      activeSockets.delete(sessionId);
      try { sock.end(undefined); } catch { }
      throw new Error("Failed to generate pairing code.");
    }
  } else {
    // Already registered
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