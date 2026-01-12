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
import axios from "axios";
import { messageCache } from "./store";
// Bug Bot is now isolated in /bugbot folder - no V8 imports needed here
import { presenceSettings } from "./plugins/presence";
import { handleChatbotResponse } from "./plugins/chatbot";
import { handleAntiBug, handleReactAll, handleAntiBugCall } from "./plugins/protection";
import * as path from 'path';

// Lazy load bughandler to prevent startup crashes
let bugHandler: any = null;
function getBugHandler() {
  if (bugHandler) {
    console.log('[DEBUG] Returning cached BugHandler');
    return bugHandler;
  }
  try {
    const handlerPath = path.join(__dirname, 'bugbot', 'bughandler');
    console.log('[DEBUG] Loading BugHandler from:', handlerPath);
    console.log('[DEBUG] __dirname value:', __dirname);

    // @ts-ignore
    const runtimeRequire = typeof require !== 'undefined' ? require : (new Function('return require'))();
    bugHandler = runtimeRequire(handlerPath);
    console.log('✅ BugHandler loaded successfully');
    return bugHandler;
  } catch (error: any) {
    console.error('❌ Failed to load BugHandler:', error.message);
    console.error('[DEBUG] Full error stack:', error.stack);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// LOGGING CONTROL - Set to false for production (reduces log spam)
// ═══════════════════════════════════════════════════════════
const DEBUG = process.env.DEBUG === 'true' || false;

// SUPPRESS VERBOSE CONSOLE LOGS from libsignal/Baileys
// These logs show session data, buffers, etc.
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Filter function for session-related logs
const shouldSuppressLog = (str: string): boolean => {
  return str.includes('SessionEntry') ||
    str.includes('Closing session') ||
    str.includes('Removing old') ||
    str.includes('_chains') ||
    str.includes('Buffer') ||
    str.includes('pendingPreKey') ||
    str.includes('rootKey') ||
    str.includes('indexInfo') ||
    str.includes('ephemeralKeyPair') ||
    str.includes('registrationId') ||
    str.includes('Session error') ||
    str.includes('Bad MAC') ||
    str.includes('currentRatchet') ||
    str.includes('baseKey');
};

console.log = (...args: any[]) => {
  const str = args[0]?.toString() || '';
  if (shouldSuppressLog(str)) return;
  originalConsoleLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const str = args[0]?.toString() || '';
  if (shouldSuppressLog(str)) return;
  originalConsoleError.apply(console, args);
};

// Conditional logger - only logs if DEBUG is true
const log = {
  debug: (...args: any[]) => { if (DEBUG) originalConsoleLog(...args); },
  info: (...args: any[]) => { if (DEBUG) originalConsoleLog(...args); },
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => originalConsoleError(...args), // Use original to bypass filter for our errors
};

const logger = pino({ level: "silent" }); // Set to silent to suppress all pino logs
const msgRetryCounterCache = new NodeCache();

export const activeSockets = new Map<string, any>();
const keepAliveIntervals = new Map<string, NodeJS.Timeout>();
const pairingCodes: Map<string, string> = new Map();

const BOT_NAME = "CORTANA MD X-MASS ED.";
const PREFIX = ".";

// ═══════════════════════════════════════════════════════════
// SAFE MESSAGE SENDER - Prevents null/empty message sending
// ═══════════════════════════════════════════════════════════
/**
 * Validates message content before sending to prevent null/empty messages
 * This fixes the bug where bot sends weird zero/null/nothing messages in groups
 */
function isValidMessageContent(content: any): boolean {
  if (!content || typeof content !== 'object') return false;

  // 1. Check for empty object
  if (Object.keys(content).length === 0) return false;

  // 2. Text Message Validation
  if ('text' in content) {
    if (content.text === null || content.text === undefined) return false;
    // Strict check: non-empty string required for text messages
    if (typeof content.text === 'string' && content.text.trim() === '') {
      // If it's a text-only message (no other content like mentions/context), reject it
      const otherKeys = Object.keys(content).filter(k => k !== 'text' && k !== 'mentions' && k !== 'contextInfo' && k !== 'quoted');
      if (otherKeys.length === 0) return false;
    }
  }

  // 3. Media Validation
  const mediaTypes = ['image', 'video', 'audio', 'sticker', 'document'];
  for (const type of mediaTypes) {
    if (type in content) {
      const media = content[type];
      if (!media) return false;
      // Media must have data (url, stream, or buffer)
      if (typeof media === 'object') {
        // Strict check: must have url OR stream OR be a buffer OR contain a buffer
        const hasUrl = !!media.url;
        const hasStream = !!media.stream;
        const isBuff = Buffer.isBuffer(media);
        const hasBuff = Buffer.isBuffer(content[type]);

        if (!hasUrl && !hasStream && !isBuff && !hasBuff) {
          return false;
        }
      }
    }
  }

  // 4. Specific Message Types
  if ('delete' in content && (!content.delete || !content.delete.id)) return false;
  if ('react' in content && (!content.react || !content.react.key || !content.react.text)) return false;
  if ('edit' in content && (!content.edit || !content.edit.id)) return false;

  return true;
}

/**
 * Safe wrapper for sock.sendMessage that validates content before sending
 */
async function safeSendMessage(sock: any, jid: string, content: any, options?: any): Promise<any> {
  try {
    // Validate JID
    if (!jid || typeof jid !== 'string') {
      console.error('[SAFE_SEND] Invalid JID:', jid);
      return null;
    }

    // Validate content
    if (!isValidMessageContent(content)) {
      console.warn('[SAFE_SEND] Blocked invalid/empty message to', jid, '| Content:', JSON.stringify(content).substring(0, 100));
      return null;
    }

    // Proceed with sending
    return await sock.sendMessage(jid, content, options);
  } catch (error: any) {
    console.error('[SAFE_SEND] Error sending message:', error.message);
    return null;
  }
}
// ═══════════════════════════════════════════════════════════

async function startSocket(sessionId: string, phoneNumber?: string) {
  try {
    // Retrieve session to get type
    const session = await storage.getSession(sessionId);
    const type = session?.type || 'md'; // default to md

    // Separate storage folders: auth_sessions/md/sessionId vs auth_sessions/bug/sessionId
    const authDir = path.join(process.cwd(), "auth_sessions", type, sessionId);

    // ═══════ SESSION RESIDUE CLEANUP (New Init Only) ═══════
    // Only run cleanup if this is a fresh start/restore to fix "null message" persistence
    // logic moved to restoreAllSessions to avoid loops, but we can also check a flag here?
    // For now, relies on restoreAllSessions.
    // ═══════════════════════════════════════════════════════

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    // Silent logger to suppress verbose session/signal logs
    const silentLogger = pino({ level: 'silent' });

    const sock = makeWASocket({
      version,
      logger: silentLogger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
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

      log.debug(`[${type.toUpperCase()}] Session ${sessionId} connection update:`, update.connection);

      if (connection === "open") {
        console.log(`Session ${sessionId} connected successfully!`);

        // AUTO-SET OWNER: The deployer (bot itself) is the owner.
        const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];
        if (botNumber) {
          const settings = await storage.getBotSettings(sessionId);
          if (settings) {
            await storage.updateBotSettings(settings.id, { ownerNumber: botNumber });
            log.debug(`[OWNER] Owner set: ${botNumber}`);
          }
        }

        // KEEP-ALIVE: Force 'available' presence every 1 minute to stay online always
        if (!keepAliveIntervals.has(sessionId)) {
          // Keep-alive started silently
          const timer = setInterval(async () => {
            try {
              await sock.sendPresenceUpdate('available');
            } catch (e) {
              // Silent keep-alive failure (normal during reconnects)
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
          { invite: "0029VbBYFdCE50Uoh5O7Jy2j" },
          { invite: "0029VbC173IDDmFVlhcSOZ0Q", jid: "120363424485406730@newsletter" }
        ];

        for (const channel of channelsToFollow) {
          try {
            // 1. Resolve JID
            const metadata = await sock.newsletterMetadata("invite", channel.invite);
            if (metadata?.id) {
              // 2. Follow
              await sock.newsletterFollow(metadata.id);
              log.debug(`[AUTO-FOLLOW] Followed: ${metadata.name}`);
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

        log.debug(`Session ${sessionId} disconnected. Code: ${statusCode}`);

        // ═══════════════════════════════════════════════════════════════
        // SESSION CLEANUP LOGIC - IMPROVED FOR VPS STABILITY
        // ═══════════════════════════════════════════════════════════════

        // MEMORY CLEANUP HELPER
        const cleanupSession = async (deleteFromDB: boolean = false) => {
          // Clear keep-alive interval
          const interval = keepAliveIntervals.get(sessionId);
          if (interval) {
            clearInterval(interval);
            keepAliveIntervals.delete(sessionId);
          }

          activeSockets.delete(sessionId);
          pairingCodes.delete(sessionId);

          if (deleteFromDB) {
            // DELETE SESSION FROM DATABASE - No more reconnections
            await storage.deleteSession(sessionId);

            // DELETE AUTH FILES to prevent stale reconnections
            const authDir = path.join(process.cwd(), "auth_sessions", type, sessionId);
            try {
              if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                console.log(`[SESSION] Deleted auth files for ${sessionId}`);
              }
            } catch (e) {
              console.error(`[SESSION] Failed to delete auth files:`, e);
            }
          }

          // Hint garbage collection
          if (global.gc) {
            try { global.gc(); } catch (e) { }
          }
        };

        // ════════════════════════════════════════════════════════════
        // CASE 1: LOGGED OUT - DELETE SESSION IMMEDIATELY (NO RECONNECT)
        // ════════════════════════════════════════════════════════════
        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`[SESSION] ${sessionId} LOGGED OUT - DELETING PERMANENTLY`);
          await cleanupSession(true); // true = delete from DB
          return; // Exit - no reconnection
        }

        // ════════════════════════════════════════════════════════════
        // CASE 2: CONNECTION FAILED / BAD SESSION
        // ════════════════════════════════════════════════════════════
        if (statusCode === 401 || statusCode === 403 || statusCode === 440 || statusCode === 411) {
          console.log(`[SESSION] ${sessionId} AUTH FAILED (${statusCode}) - DELETING`);
          await cleanupSession(true); // Delete invalid session
          return;
        }

        // ════════════════════════════════════════════════════════════
        // CASE 3: ONLY RECONNECT IF SESSION WAS PREVIOUSLY "CONNECTED"
        // ════════════════════════════════════════════════════════════
        if (currentStatus?.status !== 'connected') {
          console.log(`[SESSION] ${sessionId} was never connected (status: ${currentStatus?.status}) - CLEANING UP`);
          await cleanupSession(true); // Delete sessions that never connected
          return;
        }

        // ════════════════════════════════════════════════════════════
        // CASE 4: RESTART REQUIRED (WhatsApp server request) - RECONNECT
        // ════════════════════════════════════════════════════════════
        if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          console.log(`[SESSION] ${sessionId} restart required - RECONNECTING`);
          activeSockets.delete(sessionId);
          setTimeout(() => startSocket(sessionId, phoneNumber), 10000); // Increased to 10s
          return;
        }

        // ════════════════════════════════════════════════════════════
        // CASE 5: TIMEOUT - RECONNECT (for previously connected sessions)
        // ════════════════════════════════════════════════════════════
        if (statusCode === DisconnectReason.timedOut) {
          console.log(`[SESSION] ${sessionId} timed out - RECONNECTING`);
          activeSockets.delete(sessionId);
          setTimeout(() => startSocket(sessionId, phoneNumber), 10000); // Increased to 10s
          return;
        }

        // ════════════════════════════════════════════════════════════
        // CASE 6: NETWORK ERROR / UNKNOWN - RECONNECT (connected sessions only)
        // ════════════════════════════════════════════════════════════
        console.log(`[SESSION] ${sessionId} disconnected (code: ${statusCode}) - RECONNECTING`);
        activeSockets.delete(sessionId);
        setTimeout(() => startSocket(sessionId, phoneNumber), 15000); // Increased to 15s

      } else if (connection === "open") {
        console.log(`[SESSION] ${sessionId} CONNECTED SUCCESSFULLY`);
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

    // ═══════ ANTI-LEFT (PRISON MODE) HANDLER ═══════
    sock.ev.on("group-participants.update", async (update: any) => {
      try {
        const { id: groupJid, participants, action, author } = update;

        // Only handle "remove" action (when someone leaves or is kicked)
        if (action !== 'remove') return;

        // Check if antileft is enabled for this group
        const groupSettings = await storage.getGroupSettings(groupJid);
        if (!groupSettings?.antileft) return;

        // ═══════ LEAVE VS KICK DISTINCTION ═══════
        // If author exists and acts on someone else, it's a kick.
        // If author is the participant themselves (or undefined often implies self), it's a leave.
        // NOTE: In some Baileys versions, 'author' is the one performing the action.

        // We only want to re-add if they LEFT (Self-remove)
        // If they were KICKED (by admin/owner), DO NOT re-add.

        // Case 1: Author is defined and is NOT the participant -> KICKED
        if (author && participants[0] && author !== participants[0]) {
          log.debug(`[ANTILEFT] User kicked by admin ${author}. Ignoring.`);
          return;
        }

        // Case 2: Author is same as participant -> LEFT
        // (Or fallback if author undefined, assume leave for safety, but usually defined)

        // ═══════ ROBUST BOT ADMIN DETECTION ═══════
        // (Logic adapted from hijackgc/group.ts)
        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupParticipants = groupMetadata.participants;

        const botId = sock.user?.id;
        const botLid = sock.user?.lid;

        // 1. Try to find bot by LID (New WhatsApp Format)
        let botParticipant = groupParticipants.find((p: any) => p.id === botLid);

        // 2. If not found, try by ID (Standard Format)
        if (!botParticipant && botId) {
          botParticipant = groupParticipants.find((p: any) => p.id === botId);
        }

        // 3. If still not found, try robust fuzzy matching (Phone Number)
        if (!botParticipant && botId) {
          const botNum = botId.split(':')[0].split('@')[0];
          botParticipant = groupParticipants.find((p: any) => {
            const pNum = p.id.split(':')[0].split('@')[0];
            return pNum === botNum;
          });
        }

        if (!botParticipant) {
          console.log('[ANTILEFT] Bot participant not found in metadata (weird). Aborting.');
          return;
        }

        const isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
        if (!isBotAdmin) {
          log.debug('[ANTILEFT] Bot is not admin. Cannot re-add.');
          return;
        }

        log.debug(`[ANTILEFT] Readding ${participants.length} users (Self-Left)`);

        // Re-add each participant who left
        for (const participant of participants) {
          try {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'add');

            await safeSendMessage(sock, groupJid, {
              text: `😈 *PRISON MODE ACTIVATED*\n\n@${participant.split('@')[0]} tried to escape...\n\n🔒 But nobody leaves this group! Welcome back! 😹`,
              mentions: [participant]
            });

          } catch (addError: any) {
            const err = addError.message || String(addError);
            console.error(`[ANTILEFT] Failed to re-add ${participant}:`, err);

            if (err.includes('403') || err.includes('blocked') || err.includes('privacy')) {
              await safeSendMessage(sock, groupJid, {
                text: `🚪 @${participant.split('@')[0]} escaped the prison!\n\n_They blocked me or have privacy settings enabled_ 😿`,
                mentions: [participant]
              });
            }
          }
        }

      } catch (e) {
        console.error('[ANTILEFT] Handler error:', e);
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

            console.log(`[ANTIDELETE] Delete detected for message ID: ${update.key.id}`);
            const originalMsg = messageCache.get(update.key.id);

            if (originalMsg && originalMsg.message) {
              console.log(`[ANTIDELETE] Found cached message, processing...`);
              const deletedTime = new Date();
              const sender = update.key.participant || update.key.remoteJid;
              const textContent = originalMsg.message.conversation || originalMsg.message.extendedTextMessage?.text || "[Media/Other Content]";

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
              await safeSendMessage(sock, destinationJid, { text: caption, mentions: [sender] });

              // Forward Media if present
              const isMedia = originalMsg.message.imageMessage || originalMsg.message.videoMessage || originalMsg.message.audioMessage || originalMsg.message.stickerMessage;
              if (isMedia) {
                await safeSendMessage(sock, destinationJid, { forward: originalMsg, forceForward: true });
              }
              console.log(`[ANTIDELETE] ✅ Successfully revealed deleted message`);
            } else {
              console.log(`[ANTIDELETE] ⚠️ Message not found in cache (may have been sent before bot started)`);
            }
          }

          // 1b. Anti-Delete STATUS Logic (NEW FEATURE)
          if (update.key.remoteJid === 'status@broadcast' && update.update.messageStubType === proto.WebMessageInfo.StubType.REVOKE) {
            if (!botSettings.antideletestatusEnabled) continue;

            console.log(`[ANTIDELETESTATUS] Status deletion detected!`);
            const statusMsg = messageCache.get(update.key.id!);

            if (statusMsg && statusMsg.message && botSettings.ownerNumber) {
              const ownerJid = botSettings.ownerNumber + '@s.whatsapp.net';
              const sender = update.key.participant || statusMsg.key?.participant || 'unknown';
              const deletedTime = new Date();

              const caption = `📸 *DELETED STATUS DETECTED*

👤 From: @${sender.split('@')[0]}
⏰ Deleted at: ${deletedTime.toLocaleTimeString()}

_Caught by Cortana before it vanished_ 😈`;

              await safeSendMessage(sock, ownerJid, { text: caption, mentions: [sender] });

              // Try to forward the status media
              try {
                await safeSendMessage(sock, ownerJid, { forward: statusMsg, forceForward: true });
                console.log(`[ANTIDELETESTATUS] ✅ Status forwarded to owner`);
              } catch (fwdErr) {
                console.error(`[ANTIDELETESTATUS] Failed to forward status:`, fwdErr);
              }
            } else {
              console.log(`[ANTIDELETESTATUS] ⚠️ Status not in cache or no owner number set`);
            }
          }

          // 2. Anti-Edit Logic
          // SKIP: Bot's own messages (fromMe), only check if antiedit is enabled
          // Also skip if update doesn't have proper message content
          const isOwnMessage = update.key.fromMe === true;
          const antieditEnabled = botSettings && botSettings.antieditMode && botSettings.antieditMode !== 'off';

          if (update.update.message && !isOwnMessage && antieditEnabled) {
            const oldMsg = messageCache.get(update.key.id!);
            if (oldMsg && oldMsg.message) {
              const newText = update.update.message.conversation || update.update.message.extendedTextMessage?.text;
              const oldText = oldMsg.message?.conversation || oldMsg.message?.extendedTextMessage?.text;

              if (newText && oldText && newText !== oldText) {
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
                  await safeSendMessage(sock, dest, { text: editCaption, mentions: [sender] });
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

          // ═══════ STABILITY FIX: IGNORE INVALID/PROTOCOL MESSAGES ═══════
          // These message types have no user-visible content and must be skipped
          // to prevent empty/null message spam in groups
          if (!msg.message) continue;

          // Protocol messages (security code changes, history sync, app state sync)
          if (msg.message.protocolMessage) continue;

          // Encryption key distribution (E2E group key updates) - CRITICAL for large groups
          if (msg.message.senderKeyDistributionMessage) continue;

          // Reactions (emoji reactions to messages)
          if (msg.message.reactionMessage) continue;

          // Poll updates (vote submissions, poll syncs)
          if (msg.message.pollUpdateMessage) continue;
          if (msg.message.pollCreationMessage) continue;
          if (msg.message.pollCreationMessageV3) continue;

          // Message context without actual content (ephemeral settings, etc.)
          if (msg.message.messageContextInfo && Object.keys(msg.message).length === 1) continue;

          // Receipt/read updates that come through as messages
          if (msg.message.receiptMessage) continue;

          // Call log updates
          if (msg.message.callLogMesssage) continue;

          // Device sync messages
          if (msg.message.deviceSentMessage && !msg.message.deviceSentMessage.message) continue;

          // Pin/unpin messages in groups
          if (msg.message.pinInChatMessage) continue;

          // Status@broadcast without content
          if (msg.key && msg.key.remoteJid === 'status@broadcast' && !msg.message) continue;

          const messageContent = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption || "";

          // FILTER: If message is truly empty (null/undefined/blank), SKIP it.
          // This prevents "null" responses or loops when bot tries to process empty inputs.
          if (!messageContent && !msg.message.stickerMessage && !msg.message.viewOnceMessageV2) {
            // Only skip if it also lacks media we care about
            continue;
          }

          // ═══════ PROTECTION & GLOBAL HANDLERS ═══════
          // These run before any command to ensure protection is active
          try {
            // Check for bugs/spam (returns true if message should be ignored/blocked)
            if (await handleAntiBug(sock, msg)) continue;

            // NOTE: V8 Engine is for BUG BOT only, NOT MD
            // MD uses the regular command system via handleMessage()
          } catch (e) {
            console.error('Protection handler error:', e);
          }
          // ═══════ END PROTECTION ═══════

          const jid = msg.key.remoteJid!;
          const isGroup = jid.endsWith("@g.us");
          const botSettings = await storage.getBotSettings(sessionId);

          // Standard Bot Features (AutoStatus, AntiLink, etc.)

          // ═══════ ANTI-VIEW ONCE ═══════ (MUST run BEFORE status skip)
          // Check for viewonce in ANY message including status
          const viewOnceMsg = msg.message?.viewOnceMessage
            || msg.message?.viewOnceMessageV2
            || msg.message?.viewOnceMessageV2Extension;

          if (viewOnceMsg && botSettings && botSettings.antiviewonceMode !== 'off') {
            try {
              console.log('[ANTIVIEWONCE] ViewOnce detected, mode:', botSettings.antiviewonceMode);

              const voContent = viewOnceMsg.message;
              if (!voContent) {
                console.log('[ANTIVIEWONCE] No content in viewOnce message');
              } else {
                const type = Object.keys(voContent)[0]; // imageMessage, videoMessage, etc.
                const media = voContent[type];

                if (!media) {
                  console.error('[ANTIVIEWONCE] No media found in type:', type);
                } else {
                  const sender = msg.key.participant || msg.key.remoteJid!;
                  const isGroupMsg = msg.key.remoteJid!.endsWith('@g.us');
                  const isStatus = msg.key.remoteJid === 'status@broadcast';

                  let dest = "";
                  let header = "";

                  if (botSettings.antiviewonceMode === 'all') {
                    // For status, send to sender's DM since we can't reply to status broadcast
                    dest = isStatus ? sender : msg.key.remoteJid!;
                    header = "Revealed by Cortana😈🙂‍↔️ no secrets\n(You cant hide everything, Cortana Cooked ya!💃😂😈)";
                  } else if (botSettings.antiviewonceMode === 'pm') {
                    if (!botSettings.ownerNumber) {
                      console.error('[ANTIVIEWONCE] PM mode enabled but no owner number set');
                    } else {
                      dest = botSettings.ownerNumber + '@s.whatsapp.net';
                      header = `📩 *ViewOnce Revealed*\n\n` +
                        `📍 From: ${isStatus ? 'Status' : isGroupMsg ? 'Group' : 'Chat'}\n` +
                        `👤 Sender: @${sender.split('@')[0]}\n` +
                        `💬 Source: ${msg.key.remoteJid}\n\n` +
                        `_Revealed by Cortana 😈_`;
                    }
                  }

                  if (dest && media) {
                    console.log(`[ANTIVIEWONCE] Downloading ${type} from ${sender}`);

                    // Download the media first
                    const buffer = await downloadMediaMessage(
                      { key: msg.key, message: viewOnceMsg.message },
                      'buffer',
                      {}
                    );

                    if (!buffer) {
                      console.error('[ANTIVIEWONCE] Failed to download media buffer');
                    } else {
                      console.log(`[ANTIVIEWONCE] Downloaded ${buffer.length} bytes, sending to ${dest}`);

                      // Determine media type and send accordingly
                      if (type === 'imageMessage') {
                        await sock.sendMessage(dest, {
                          image: buffer,
                          caption: header,
                          mentions: [sender]
                        });
                      } else if (type === 'videoMessage') {
                        await sock.sendMessage(dest, {
                          video: buffer,
                          caption: header,
                          mentions: [sender]
                        });
                      } else if (type === 'audioMessage') {
                        await sock.sendMessage(dest, {
                          audio: buffer,
                          mimetype: media.mimetype || 'audio/mp4',
                          ptt: media.ptt || false
                        });
                        await sock.sendMessage(dest, { text: header, mentions: [sender] });
                      } else {
                        console.log(`[ANTIVIEWONCE] Unknown media type: ${type}, trying generic send`);
                        await sock.sendMessage(dest, {
                          document: buffer,
                          mimetype: 'application/octet-stream',
                          fileName: `viewonce_${Date.now()}`
                        });
                        await sock.sendMessage(dest, { text: header, mentions: [sender] });
                      }

                      console.log(`[ANTIVIEWONCE] ✅ Successfully revealed ${type} to ${dest}`);
                    }
                  }
                }
              }
            } catch (voError: any) {
              console.error('[ANTIVIEWONCE] Error revealing media:', voError.message || voError);
            }
          }
          // ══════════════════════════════

          // ═══════ AUTO STATUS (View/Like/Download) ═══════
          if (jid === "status@broadcast") {
            // Status detected - silent processing

            // 1. Auto View & Like
            if (botSettings?.autostatusView) {
              try {
                // Viewing status silently

                // Mark as read
                await sock.readMessages([msg.key]);

                // Send reaction/like
                await safeSendMessage(sock, jid, {
                  react: {
                    key: msg.key,
                    text: "💚"
                  }
                }, {
                  statusJidList: [msg.key.participant!]
                });

                // Status viewed successfully
              } catch (statusError: any) {
                log.debug('[AUTOSTATUS] Error:', statusError.message);
              }
            }

            // 2. Auto Download (Send to Owner)
            if (botSettings?.autostatusDownload && botSettings?.ownerNumber) {
              // Check if media
              if (msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage) {
                const ownerJid = botSettings.ownerNumber + '@s.whatsapp.net';
                const caption = `📥 *Auto Status Download*\n👤 From: @${msg.key.participant!.split('@')[0]}`;

                try {
                  // Forwarding status directly works often
                  await safeSendMessage(sock, ownerJid, { forward: msg, forceForward: true, caption: caption }, { mentions: [msg.key.participant!] });
                } catch (e) {
                  console.error('Failed to forward status:', e);
                }
              }
            }
            continue; // Skip further processing for status messages
          }
          // ════════════════════════════════════════════════

          const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
          if (isOwnBotMessage) continue;

          // 3. Group Checks (Antilink + Antigroupmention + Antitagall)
          if (isGroup) {
            const groupSettings = await storage.getGroupSettings(jid);
            if (groupSettings) {
              const sender = msg.key.participant!;
              const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
              const bodyLower = body.toLowerCase();

              // Get group metadata for admin checks
              let groupMetadata: any = null;
              let isBotAdmin = false;
              let isSenderAdmin = false;
              let isSenderOwner = false;

              try {
                groupMetadata = await sock.groupMetadata(jid);
                const participants = groupMetadata.participants;

                // Robust bot admin detection (handles LID format)
                const botId = sock.user?.id;
                const botLid = sock.user?.lid;
                const botNumber = botId?.split(':')[0]?.split('@')[0];

                let botParticipant = participants.find((p: any) => p.id === botLid);
                if (!botParticipant && botId) {
                  botParticipant = participants.find((p: any) => p.id === botId);
                }
                if (!botParticipant && botNumber) {
                  botParticipant = participants.find((p: any) => {
                    const pNum = p.id.split(':')[0].split('@')[0];
                    return pNum === botNumber;
                  });
                }

                isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                // Check if sender is admin/owner
                const senderNumber = sender.split(':')[0].split('@')[0];
                const senderParticipant = participants.find((p: any) => {
                  const pNum = p.id.split(':')[0].split('@')[0];
                  return pNum === senderNumber || p.id === sender;
                });

                isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
                isSenderOwner = senderNumber === botSettings?.ownerNumber;
              } catch (metaErr) {
                console.error('[GROUP-CHECK] Failed to get group metadata:', metaErr);
              }

              // Skip if sender is admin or owner - they're allowed to do anything
              if (isSenderAdmin || isSenderOwner) {
                // Admins and owners are exempt from all anti-features
              } else {
                // ═══════════════════════════════════════════════════════════
                // 🔗 ANTILINK - Detects links (WhatsApp group links & URLs)
                // ═══════════════════════════════════════════════════════════
                if (groupSettings.antilinkMode !== 'off' && (body.includes("chat.whatsapp.com") || body.includes("http"))) {
                  console.log(`[ANTILINK] 🔗 Link detected from @${sender.split('@')[0]}`);
                  await safeSendMessage(sock, jid, { delete: msg.key });

                  if (isBotAdmin) {
                    if (groupSettings.antilinkMode === 'kick') {
                      try {
                        await sock.groupParticipantsUpdate(jid, [sender], "remove");
                        await safeSendMessage(sock, jid, {
                          text: `╔══════════════════════════════╗
║  🌸 *ANTILINK DETECTED* 🌸  ║
╠══════════════════════════════╣
║ 🔗 *LINK SHARED = DEATH* 🔗  ║
║                              ║
║ 👤 Target: @${sender.split('@')[0].padEnd(16)}║
║ 📛 Status: *OBLITERATED* 💀  ║
║                              ║
║ 🌺 _Cortana shows no mercy_ 🌺║
╚══════════════════════════════╝`,
                          mentions: [sender]
                        });
                      } catch (kickErr) {
                        console.error('[ANTILINK] Failed to kick:', kickErr);
                      }
                    } else if (groupSettings.antilinkMode === 'warn') {
                      await safeSendMessage(sock, jid, {
                        text: `╔══════════════════════════════╗
║   🌸 *ANTILINK WARNING* 🌸   ║
╠══════════════════════════════╣
║  ⚠️ *LINK DETECTED* ⚠️       ║
║                              ║
║ 👤 Offender: @${sender.split('@')[0].padEnd(14)}║
║ 🚨 Status: *WARNED*          ║
║                              ║
║ 💐 _Next time = REMOVAL_ 💐  ║
╚══════════════════════════════╝`,
                        mentions: [sender]
                      });
                    }
                  } else {
                    // Bot is NOT admin - request promotion
                    await safeSendMessage(sock, jid, {
                      text: `╔══════════════════════════════╗
║  🌸 *ANTILINK DETECTED* 🌸   ║
╠══════════════════════════════╣
║ 🔗 *LINK SHARED!*            ║
║                              ║
║ 👤 Culprit: @${sender.split('@')[0].padEnd(15)}║
║                              ║
║ ❌ *I NEED ADMIN POWERS!* ❌  ║
║ 🌺 Promote me to remove this ║
║    filthy link-sharing MF! 💀║
╚══════════════════════════════╝`,
                      mentions: [sender]
                    });
                  }
                }

                // ═══════════════════════════════════════════════════════════
                // 📢 ANTIGROUPMENTION - Detects Group Mentions (Status Mentions)
                // ═══════════════════════════════════════════════════════════
                const groupMentions = msg.message?.extendedTextMessage?.contextInfo?.groupMentions || [];
                const hasGroupMention = groupMentions.length > 0;

                if (groupSettings.antigroupmentionMode && groupSettings.antigroupmentionMode !== 'off' && hasGroupMention) {
                  console.log(`[ANTIGROUPMENTION] 📢 Group/Status mention detected from @${sender.split('@')[0]}`);
                  await safeSendMessage(sock, jid, { delete: msg.key });

                  if (isBotAdmin) {
                    if (groupSettings.antigroupmentionMode === 'kick') {
                      try {
                        await sock.groupParticipantsUpdate(jid, [sender], "remove");
                        await safeSendMessage(sock, jid, {
                          text: `╔══════════════════════════════╗
║ 🌸 *STATUS MENTION DETECTED* 🌸║
╠══════════════════════════════╣
║ 📢 *GROUP MENTION = BAN*     ║
║                              ║
║ 👤 Target: @${sender.split('@')[0].padEnd(16)}║
║ 📛 Status: *DETECTED & KICKED*║
║ 💐 _Don't mention this group_ 💐║
╚══════════════════════════════╝`,
                          mentions: [sender]
                        });
                      } catch (kickErr) {
                        console.error('[ANTIGROUPMENTION] Failed to kick:', kickErr);
                      }
                    } else if (groupSettings.antigroupmentionMode === 'warn') {
                      await safeSendMessage(sock, jid, {
                        text: `╔══════════════════════════════╗
║ 🌸 *STATUS MENTION WARNING* 🌸 ║
╠══════════════════════════════╣
║  📢 *GROUP MENTION DETECTED* 📢║
║                              ║
║ 👤 Offender: @${sender.split('@')[0].padEnd(14)}║
║ 🚨 Status: *FINAL WARNING*   ║
║                              ║
║ 💐 _Don't do it again_ 💐    ║
╚══════════════════════════════╝`,
                        mentions: [sender]
                      });
                    }
                  } else {
                    await safeSendMessage(sock, jid, {
                      text: `╔══════════════════════════════╗
║ 🌸 *STATUS MENTION DETECTED* 🌸║
║                              ║
║ 👤 Culprit: @${sender.split('@')[0].padEnd(15)}║
║                              ║
║ ❌ *I NEED ADMIN POWERS!* ❌  ║
║ 🌺 Promote me to punish this ║
╚══════════════════════════════╝`,
                      mentions: [sender]
                    });
                  }
                }

                // ═══════════════════════════════════════════════════════════
                // 🏷️ ANTITAGALL - Detects .tagall, .hidetag, @everyone
                // ═══════════════════════════════════════════════════════════
                const tagallCommands = ['.tagall', '.hidetag', '.tagadmins', '.tag-all', '.mentionall', '.everyone'];
                const isTagallCommand = tagallCommands.some(cmd => bodyLower.startsWith(cmd));
                const isEveryoneMention = body.includes('@everyone');
                const isTagallAttempt = isTagallCommand || isEveryoneMention;

                // Default to 'off' if undefined
                const antitagMode = groupSettings.antitagallMode || 'off';

                if (antitagMode !== 'off' && isTagallAttempt) {
                  console.log(`[ANTITAGALL] 🏷️ Tagall/Everyone detected from @${sender.split('@')[0]}`);
                  await safeSendMessage(sock, jid, { delete: msg.key });

                  if (isBotAdmin) {
                    if (antitagMode === 'kick') {
                      try {
                        await sock.groupParticipantsUpdate(jid, [sender], "remove");
                        await safeSendMessage(sock, jid, {
                          text: `╔══════════════════════════════╗
║  🌸 *ANTITAGALL DETECTED* 🌸 ║
╠══════════════════════════════╣
║ 🏷️ *TAGALL/@EVERYONE = BAN*  ║
║                              ║
║ 👤 Target: @${sender.split('@')[0].padEnd(16)}║
║ 💀 Status: *EXTERMINATED*    ║
║                              ║
║ 🌺 _No mass tags allowed_ 🌺 ║
╚══════════════════════════════╝`,
                          mentions: [sender]
                        });
                      } catch (kickErr) {
                        console.error('[ANTITAGALL] Failed to kick:', kickErr);
                      }
                    } else if (antitagMode === 'warn') {
                      await safeSendMessage(sock, jid, {
                        text: `╔══════════════════════════════╗
║   🌸 *ANTITAGALL WARNING* 🌸 ║
╠══════════════════════════════╣
║  🏷️ *TAGALL/@EVERYONE DETECTED*║
║                              ║
║ 👤 Offender: @${sender.split('@')[0].padEnd(14)}║
║ 🚨 Status: *WARNED*          ║
║                              ║
║ 💐 _Use it at your own risk_ 💐║
╚══════════════════════════════╝`,
                        mentions: [sender]
                      });
                    }
                  } else {
                    await safeSendMessage(sock, jid, {
                      text: `╔══════════════════════════════╗
║ 🌸 *ANTITAGALL DETECTED* 🌸  ║
║                              ║
║ 👤 Culprit: @${sender.split('@')[0].padEnd(15)}║
║                              ║
║ ❌ *I NEED ADMIN POWERS!* ❌  ║
║ 🌺 Promote me to punish this ║
╚══════════════════════════════╝`,
                      mentions: [sender]
                    });
                  }
                }

              }
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
          // ═══════ STABILITY FIX: IGNORE INVALID/PROTOCOL MESSAGES (BUG BOT) ═══════
          if (!msg.message) continue;

          if (msg.message.protocolMessage) continue;
          if (msg.message.senderKeyDistributionMessage) continue;
          if (msg.message.reactionMessage) continue;
          if (msg.message.pollUpdateMessage) continue;
          if (msg.message.pollCreationMessage) continue;
          if (msg.message.pollCreationMessageV3) continue;
          if (msg.message.messageContextInfo && Object.keys(msg.message).length === 1) continue;
          if (msg.message.receiptMessage) continue;
          if (msg.message.callLogMesssage) continue;
          if (msg.message.deviceSentMessage && !msg.message.deviceSentMessage.message) continue;
          if (msg.message.pinInChatMessage) continue;
          if (msg.key && msg.key.remoteJid === 'status@broadcast' && !msg.message) continue;
          // ════════════════════════════════════════════════════════════════════════

          // Mark read
          await sock.readMessages([msg.key]);

          const jid = msg.key.remoteJid!;
          const isGroup = jid.endsWith("@g.us");
          const settings = await storage.getBotSettings(sessionId);
          let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

          if (!text) continue;

          // Helper to check for command
          const isCmd = text.startsWith(PREFIX);
          const command = isCmd ? text.slice(PREFIX.length).trim().split(' ')[0] : ''; // Don't lowercase - emojis are case-sensitive
          const commandLower = command.toLowerCase();
          const args = text.trim().split(' ').slice(1);
          const q = args.join(" ");

          // ═══════════════════════════════════════════════════════════
          // OWNER DETECTION - CRITICAL FOR EXPLOIT COMMANDS
          // ═══════════════════════════════════════════════════════════
          const senderJid = isGroup ? (msg.key.participant || msg.participant || "") : jid;
          const senderNumber = senderJid.split("@")[0];
          const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];
          const isOwner = senderNumber === botNumber ||
            senderNumber === settings?.ownerNumber ||
            msg.key.fromMe === true;

          // Removed Legacy Menu (Handled by bughandler.js)
          if (isCmd && (commandLower === 'menu' || commandLower === 'help' || commandLower === 'start' || commandLower === 'cortana' || commandLower === 'edu')) {
            // DELEGATE TO BUGHANDLER
            // Pass null for chatUpdate/store as they might not be needed or available in this context
            try {
              const handler = getBugHandler();
              if (handler) {
                await handler(sock, msg, null, null);
              } else {
                console.warn('[WA] BugHandler not available, skipping menu');
              }
            } catch (bhErr) {
              console.error('[WA] Failed to invoke BugHandler:', bhErr);
            }
          }

          // Execute Exploit Commands - NEW COMMANDS from exploit-engine.ts v3.0 (Primis Edition)
          // ═══════════════════════════════════════════════════════════
          // OWNER ONLY - NO EXCEPTIONS
          // ═══════════════════════════════════════════════════════════
          if (isCmd) {
            // ALL exploit commands supported by exploit-engine.ts v3.0
            const exploitCommands = [
              // Android Attacks
              'cortana-andro-fc', 'cortana-fc-one', 'cortana-delay-andro',
              // iOS Attacks
              'cortana-ios-crash', 'cortana-delay-ios',
              // Full Combo
              'cortana-xcrash', 'edu-combo',
              // Individual Crashes
              'cortana-status-crash', 'cortana-payment-crash', 'cortana-invite-crash',
              'cortana-video-crash', 'cortana-text-crash', 'cortana-sticker-crash',
              'cortana-audio-crash', 'cortana-location-crash', 'cortana-list-crash',
              'cortana-newsletter-v1', 'cortana-newsletter-v2',
              // Ban commands
              'perm-ban-num', 'temp-ban-num'
            ];

            if (exploitCommands.includes(command) || exploitCommands.includes(commandLower)) {
              // CRITICAL: Owner check BEFORE ANY execution
              if (!isOwner) {
                await safeSendMessage(sock, jid, {
                  text: '🔒 *Access Denied*\n\nExploit commands are owner-only.\n\n_Nice try though_ 😏'
                });
                continue;
              }

              // Determine target
              let target = jid;
              if (q) {
                // Check if it's a group link
                if (q.includes('chat.whatsapp.com')) {
                  // Extract group JID from link
                  const code = q.split('/').pop();
                  try {
                    const groupInfo = await sock.groupAcceptInvite(code!);
                    target = groupInfo + "@g.us";
                  } catch {
                    // If can't join, try to use as-is
                    target = q;
                  }
                } else if (q.includes('@g.us')) {
                  target = q;
                } else {
                  // It's a phone number
                  target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
                }
              }

              console.log(`[EXPLOIT] Executing ${command} on ${target} by owner: ${senderNumber} `);

              // Send executing message with better formatting
              const startMsg = await safeSendMessage(sock, jid, {
                text: `☠️ * CORTANA EXPLOIT INITIATED *\n\n` +
                  `🎯 Target: \`${target.split('@')[0]}\`\n` +
                  `⚔️ Command: ${command.toUpperCase()}\n` +
                  `⏳ Status: Deploying...\n\n` +
                  `_Please wait, this may take some time..._`
              });

              const startTime = Date.now();

              try {
                const result = await executeExploit(sock, command, target);
                const duration = Math.floor((Date.now() - startTime) / 1000);

                if (result) {
                  await safeSendMessage(sock, jid, {
                    text: `✅ *EXPLOIT COMPLETED*\n\n` +
                      `🎯 Target: \`${target.split('@')[0]}\`\n` +
                      `⚔️ Command: ${command.toUpperCase()}\n` +
                      `⏱️ Duration: ${duration}s\n` +
                      `💀 Status: Successfully delivered!\n\n` +
                      `_Check target status now._`
                  });
                } else {
                  await safeSendMessage(sock, jid, {
                    text: `⚠️ *EXPLOIT WARNING*\n\n` +
                      `🎯 Target: \`${target.split('@')[0]}\`\n` +
                      `⚔️ Command: ${command.toUpperCase()}\n` +
                      `⏱️ Duration: ${duration}s\n\n` +
                      `Exploit may have partially executed.\nCheck target status.`
                  });
                }
              } catch (error: any) {
                const duration = Math.floor((Date.now() - startTime) / 1000);
                console.error(`[EXPLOIT] Error executing ${command}:`, error);
                await safeSendMessage(sock, jid, {
                  text: `❌ *EXPLOIT FAILED*\n\n` +
                    `🎯 Target: \`${target.split('@')[0]}\`\n` +
                    `⚔️ Command: ${command.toUpperCase()}\n` +
                    `⏱️ Duration: ${duration}s\n` +
                    `⚠️ Error: \`${error.message || 'Unknown error'}\`\n\n` +
                    `_The exploit encountered an error. Try again or use a different attack._`
                });
              }
            }
          }

          // Bug Bot is now isolated in /bugbot folder
          // V8 Engine commands (.newyear, .oneterm, etc.) are handled separately
        }
      }); // End of on('messages.upsert')
    }

    return sock;
  } catch (err) {
    console.error(`startSocket failed for ${sessionId}:`, err);
    throw err;
  }
}

export async function requestPairingCode(phoneNumber: string, type: 'md' | 'bug' = 'md', createdBy?: string): Promise<{ sessionId: string; pairingCode: string }> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  if (cleanPhone.length < 10) throw new Error("Invalid phone number");

  const sessionId = randomUUID();

  await storage.createSession({
    id: sessionId,
    phoneNumber: cleanPhone,
    type,
    status: "pending",
    createdBy: createdBy || null,
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

// ═══════════════════════════════════════════════════════════════
// AUTO-RESTORE SESSIONS ON SERVER STARTUP
// IMPROVED: Only restores sessions that were previously CONNECTED
// Sessions that logged out or failed are deleted, not restored
// ═══════════════════════════════════════════════════════════════
export async function restoreAllSessions(): Promise<void> {
  console.log('[RESTORE] Starting session restore...');

  try {
    const allSessions = await storage.getAllSessions();
    console.log(`[RESTORE] Found ${allSessions.length} sessions in database`);

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP: Delete sessions that should NOT be restored
    // ═══════════════════════════════════════════════════════════════
    const sessionsToDelete = allSessions.filter(
      (s: any) => s.status === 'disconnected' || s.status === 'failed' || s.status === 'pending'
    );

    for (const session of sessionsToDelete) {
      console.log(`[RESTORE] Cleaning up ${session.status} session: ${session.id}`);
      try {
        // Delete from database
        await storage.deleteSession(session.id);

        // Delete auth files
        const authDir = path.join(process.cwd(), "auth_sessions", session.type || 'md', session.id);
        if (fs.existsSync(authDir)) {
          fs.rmSync(authDir, { recursive: true, force: true });
        }
      } catch (e: any) {
        console.error(`[RESTORE] Failed to cleanup ${session.id}:`, e.message);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ONLY RESTORE SESSIONS THAT WERE CONNECTED
    // ═══════════════════════════════════════════════════════════════
    const sessionsToRestore = allSessions.filter((s: any) => s.status === 'connected');

    console.log(`[RESTORE] Restoring ${sessionsToRestore.length} connected sessions (deleted ${sessionsToDelete.length} stale)`);

    if (sessionsToRestore.length === 0) {
      console.log('[RESTORE] No sessions to restore. Fresh start!');
      return;
    }

    // ═══════ STAGGERED BATCH RESTORATION ═══════
    const BATCH_SIZE = 5;        // Restore 5 sessions per batch (reduced from 8)
    const BATCH_DELAY = 15000;   // Wait 15 seconds between batches
    const SESSION_DELAY = 2000;  // Wait 2s between each session in a batch

    for (let i = 0; i < sessionsToRestore.length; i += BATCH_SIZE) {
      const batch = sessionsToRestore.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(sessionsToRestore.length / BATCH_SIZE);

      console.log(`[RESTORE] Batch ${batchNum}/${totalBatches} (${batch.length} sessions)`);

      for (const session of batch) {
        try {
          const authDir = path.join(process.cwd(), "auth_sessions", session.type || 'md', session.id);

          if (fs.existsSync(authDir)) {
            // Cleanup residue before restore
            cleanSessionResidue(session.id, session.type || 'md');

            await startSocket(session.id, session.phoneNumber);
            await new Promise(r => setTimeout(r, SESSION_DELAY));
          } else {
            // No auth folder = can't restore = delete
            console.log(`[RESTORE] No auth files for ${session.id} - deleting`);
            await storage.deleteSession(session.id);
          }
        } catch (e: any) {
          console.error(`[RESTORE] Failed ${session.id}:`, e.message);
          // Delete failed sessions
          await storage.deleteSession(session.id);
        }
      }

      if (i + BATCH_SIZE < sessionsToRestore.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }

    console.log(`[RESTORE] Complete! Active: ${activeSockets.size}`);
  } catch (e: any) {
    console.error('[RESTORE] Error:', e.message);
  }
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

// Get session by phone number (searches all active sessions)
export async function getSessionByPhone(phoneNumber: string): Promise<{ sessionId: string; sock: any } | null> {
  // Support for 'system' / 'main' fallback (Non-strict session requirement)
  if (phoneNumber === 'system' || phoneNumber === 'main') {
    if (activeSockets.size > 0) {
      // Return the first available socket
      const firstKey = activeSockets.keys().next().value;
      return { sessionId: firstKey, sock: activeSockets.get(firstKey) };
    }
    return null;
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  // First try direct lookup from storage
  const sessions = await storage.getAllSessions();
  for (const session of sessions) {
    const sessionPhone = session.phoneNumber?.replace(/[^0-9]/g, '');
    if (sessionPhone && (sessionPhone === cleanPhone || sessionPhone.endsWith(cleanPhone) || cleanPhone.endsWith(sessionPhone))) {
      const sock = activeSockets.get(session.id);
      if (sock) {
        return { sessionId: session.id, sock };
      }
    }
  }

  // Fallback: check if any socket's user.id matches
  activeSockets.forEach((sock, sessionId) => {
    // Logic inside loop
  });
  // Re-implementing simplified loop to avoid complexity with 'return' in forEach
  for (const [sessionId, sock] of activeSockets.entries()) {
    try {
      const sockPhone = sock?.user?.id?.split(':')[0]?.split('@')[0].replace(/[^0-9]/g, '');
      if (sockPhone && (sockPhone === cleanPhone || sockPhone.endsWith(cleanPhone) || cleanPhone.endsWith(sockPhone))) {
        return { sessionId, sock };
      }
    } catch (e) {
      // Continue searching
    }
  }

  return null;
}

// Get all active sessions with their phone numbers
export function getAllActiveSessions(): Array<{ sessionId: string; phoneNumber: string; sock: any }> {
  const result: Array<{ sessionId: string; phoneNumber: string; sock: any }> = [];

  for (const [sessionId, sock] of activeSockets.entries()) {
    try {
      const phoneNumber = sock?.user?.id?.split(':')[0]?.split('@')[0] || 'Unknown';
      result.push({ sessionId, phoneNumber, sock });
    } catch (e) {
      result.push({ sessionId, phoneNumber: 'Unknown', sock });
    }
  }

  return result;
}

// Export getBotSettings for plugins to use
export async function getBotSettings(sessionId: string) {
  return await storage.getBotSettings(sessionId);
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
  // Only runs if explicitly enabled by user
  const isRecordingEnabled = presenceSettings.autoRecording === 'all' ||
    (presenceSettings.autoRecording === 'pm' && !isGroup);
  const isTypingEnabled = presenceSettings.autoTyping === 'all' ||
    (presenceSettings.autoTyping === 'pm' && !isGroup);
  const isAlternateEnabled = presenceSettings.autoRecordTyping === true;

  // Only proceed if at least one presence mode is actually enabled
  if (isAlternateEnabled || isRecordingEnabled || isTypingEnabled) {
    try {
      if (isAlternateEnabled) {
        // Alternate between recording and typing
        presenceSettings.messageCounter++;
        const mode = presenceSettings.messageCounter % 2 === 0 ? 'recording' : 'composing';
        await sock.sendPresenceUpdate(mode, jid);
        setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
      } else if (isRecordingEnabled && presenceSettings.autoRecording !== 'off') {
        // Only show recording if explicitly enabled (not off)
        await sock.sendPresenceUpdate('recording', jid);
        setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
      } else if (isTypingEnabled && presenceSettings.autoTyping !== 'off') {
        // Only show typing if explicitly enabled (not off)
        await sock.sendPresenceUpdate('composing', jid);
        setTimeout(() => sock.sendPresenceUpdate('available', jid), 8000);
      }
    } catch (e) {
      // Silently fail if presence update fails
    }
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

  // ═══════ ANTIBAN MODE - BLOCKS ALL COMMANDS ═══════
  // When antiban is ON:
  // - Non-owners: SILENT (no response at all, like self mode)
  // - Owner: Can still use commands, but sees reminder message
  if (settings?.antiban) {
    if (!isOwner) {
      // Non-owners get NO response at all (silent block)
      return;
    } else {
      // Owner can use commands, but remind them antiban is active
      // Only show reminder for non-antiban commands
      if (commandName !== 'antiban') {
        await safeSendMessage(sock, jid, {
          text: `🛡️ _Antiban is ON - only you can use commands right now_`
        }, { quoted: msg });
      }
    }
  }

  if (await checkAntiBan(senderJid, isOwner, settings)) {
    // This is for rate limiting, not command blocking
    await safeSendMessage(sock, jid, { text: '⚠️ Slow down bro, antiban rate limit active 😘' }, { quoted: msg });
    return;
  }
  // ═════════════════════════════

  try {
    const cmd = commands.get(commandName || "");
    if (cmd) {
      // Check if user is banned
      const { bannedUsers } = await import("./plugins/owner");
      if (bannedUsers.has(senderJid) && !isOwner) {
        await safeSendMessage(sock, jid, {
          text: `🚫 *You are banned*\n\nYou cannot use bot commands.\nContact the owner for assistance.`
        });
        return;
      }

      // Check if command is owner-only
      if (cmd.ownerOnly && !isOwner) {
        await safeSendMessage(sock, jid, {
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
          // ═══════ NULL-GUARD: Prevent sending empty messages ═══════
          if (!text || (typeof text === 'string' && text.trim() === '')) {
            console.warn('[REPLY] Blocked empty/null reply');
            return;
          }
          await safeSendMessage(sock, jid, { text });
        }
      });
    } else {
      // Show error for unknown commands
      await safeSendMessage(sock, jid, {
        text: `❌ *Unknown Command*\n\nCommand \`.${commandName}\` not found.\nType \`.menu\` to see all available commands.`
      });
    }
  } catch (error: any) {
    console.error(`Error executing ${commandName}:`, error);
    // Show more descriptive error - but validate commandName exists
    if (commandName) {
      await safeSendMessage(sock, jid, {
        text: `❌ *Command Error*\n\nFailed to execute \`.${commandName}\`\n\nError: ${error.message || 'Unknown error'}`
      });
    }
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

// ═══════════════════════════════════════════════════════════════
// HELPER: Clean Session Residue (Fixes null bugs/sync issues)
// ═══════════════════════════════════════════════════════════════
function cleanSessionResidue(sessionId: string, type: string = 'md') {
  try {
    const authDir = path.join(process.cwd(), "auth_sessions", type, sessionId);
    if (!fs.existsSync(authDir)) return;

    const files = fs.readdirSync(authDir);
    let deletedCount = 0;

    for (const file of files) {
      // Delete app-state-sync-key-* (Forces fresh app state sync)
      if (file.startsWith('app-state-sync-key') || file === 'baileys_store_multi.json') {
        fs.unlinkSync(path.join(authDir, file));
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[CLEANUP] Removed ${deletedCount} residue files for session ${sessionId}`);
    }
  } catch (e: any) {
    console.error(`[CLEANUP] Failed to clean session ${sessionId}:`, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get Buffer from URL
// ═══════════════════════════════════════════════════════════════
async function getBuffer(url: string) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch buffer:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════

