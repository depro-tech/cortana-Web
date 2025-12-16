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
import { Boom } from "@hapi/boom";
import pino from "pino";
import NodeCache from "node-cache";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { commands } from "./plugins/types";
import "./plugins/index"; // Import all plugins

const logger = pino({ level: "warn" });
const msgRetryCounterCache = new NodeCache();

const activeSockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
const pairingCodes: Map<string, string> = new Map();

const BOT_NAME = "CORTANA MD X-MASS ED.";
const PREFIX = ".";

export async function requestPairingCode(phoneNumber: string): Promise<{ sessionId: string; pairingCode: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  if (cleanPhone.length < 10) {
    throw new Error("Invalid phone number");
  }

  const sessionId = randomUUID();
  const authDir = path.join(process.cwd(), "auth_sessions", sessionId);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await storage.createSession({
    id: sessionId,
    phoneNumber: cleanPhone,
    status: "pending",
    creds: null,
    keys: null,
  });

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
    getMessage: async (key) => {
      return { conversation: '' };
    },
  });

  activeSockets.set(sessionId, sock);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, isNewLogin } = update;

    console.log(`Session ${sessionId} connection update:`, JSON.stringify(update));

    if (isNewLogin && connection !== "close") {
      console.log(`Session ${sessionId} pairing successful! Marking as connected.`);
      await storage.updateSession(sessionId, { status: "connected" });
      pairingCodes.delete(sessionId);

      const existingSettings = await storage.getBotSettings(sessionId);
      if (!existingSettings) {
        await storage.createBotSettings({
          sessionId,
          prefix: PREFIX,
          ownerNumber: cleanPhone,
          isPublic: true,
        });
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const currentStatus = await storage.getSession(sessionId);

      console.log(`Session ${sessionId} disconnected. Status code: ${statusCode}, Current status: ${currentStatus?.status}`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`Session ${sessionId} logged out`);
        activeSockets.delete(sessionId);
        pairingCodes.delete(sessionId);
        await storage.updateSession(sessionId, { status: "disconnected" });
      } else if (currentStatus?.status === "connected" && statusCode === 515) {
        console.log(`Session ${sessionId} stream error after pairing - reconnecting...`);
        activeSockets.delete(sessionId);
        // Clean restart after stream error
        setTimeout(async () => {
          // In a real implementation we would restart the session here
        }, 3000);
      } else if (statusCode === DisconnectReason.timedOut || currentStatus?.status === "pending") {
        console.log(`Session ${sessionId} timed out or failed during pairing`);
        await storage.updateSession(sessionId, { status: "failed" });
        activeSockets.delete(sessionId);
        pairingCodes.delete(sessionId);
      }
    } else if (connection === "open") {
      console.log(`Session ${sessionId} connected successfully!`);
      await storage.updateSession(sessionId, { status: "connected" });
      pairingCodes.delete(sessionId);

      const existingSettings = await storage.getBotSettings(sessionId);
      if (!existingSettings) {
        await storage.createBotSettings({
          sessionId,
          prefix: PREFIX,
          ownerNumber: cleanPhone,
          isPublic: true,
        });
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.message.protocolMessage) continue;

      const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
      if (isOwnBotMessage) continue;

      await handleMessage(sock, msg, sessionId);
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (!sock.authState.creds.registered) {
    try {
      console.log(`Requesting pairing code for ${cleanPhone}...`);
      const pairingCode = await sock.requestPairingCode(cleanPhone);
      pairingCodes.set(sessionId, pairingCode);
      console.log(`Pairing code: ${pairingCode}`);
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
    try { sock.end(undefined); } catch { }
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
    } catch { } // Ignore errors if already closed
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