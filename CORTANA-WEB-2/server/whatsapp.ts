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
import { executeExploit } from "./exploit-engine";
import { presenceSettings } from "./plugins/presence";
import { handleChatbotResponse } from "./plugins/chatbot";
import { handleAntiBug, handleReactAll, handleAntiBugCall } from "./plugins/protection";

// ═══════════════════════════════════════════════════════════
// LOGGING CONTROL - Set to false for production (reduces log spam)
// ═══════════════════════════════════════════════════════════
const DEBUG = process.env.DEBUG === 'true' || false;

// Conditional logger - only logs if DEBUG is true
const log = {
  debug: (...args: any[]) => { if (DEBUG) console.log(...args); },
  info: (...args: any[]) => { if (DEBUG) console.log(...args); },
  warn: (...args: any[]) => console.warn(...args), // Always show warnings
  error: (...args: any[]) => console.error(...args), // Always show errors
};

const logger = pino({ level: "error" }); // Changed from "warn" to "error" to reduce Baileys logs
const msgRetryCounterCache = new NodeCache();

const activeSockets = new Map<string, any>();
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

        if (statusCode === DisconnectReason.loggedOut) {
          log.info(`Session ${sessionId} logged out`);

          // MEMORY CLEANUP: Clear keep-alive interval
          const interval = keepAliveIntervals.get(sessionId);
          if (interval) {
            clearInterval(interval);
            keepAliveIntervals.delete(sessionId);
          }

          activeSockets.delete(sessionId);
          pairingCodes.delete(sessionId);
          await storage.updateSession(sessionId, { status: "disconnected" });

          // Hint garbage collection (V8 may ignore, but helps)
          if (global.gc) {
            try { global.gc(); } catch (e) { }
          }

        } else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          log.debug(`Session ${sessionId} restart required. Reconnecting...`);
          activeSockets.delete(sessionId);
          setTimeout(() => startSocket(sessionId, phoneNumber), 2000);
        } else if (statusCode === DisconnectReason.timedOut) {
          log.debug(`Session ${sessionId} timed out.`);
          if (currentStatus?.status === 'connected') {
            startSocket(sessionId, phoneNumber);
          } else {
            await storage.updateSession(sessionId, { status: "failed" });
            activeSockets.delete(sessionId);
            pairingCodes.delete(sessionId);
          }
        } else {
          // Unknown disconnect, usually network. Retry.
          log.debug(`Session ${sessionId} reconnecting...`);
          startSocket(sessionId, phoneNumber);
        }
      } else if (connection === "open") {
        log.info(`Session ${sessionId} connected!`);
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
              await safeSendMessage(sock, destinationJid, { text: caption, mentions: [sender] });

              // Forward Media if present
              const isMedia = originalMsg.message.imageMessage || originalMsg.message.videoMessage || originalMsg.message.audioMessage || originalMsg.message.stickerMessage;
              if (isMedia) {
                await safeSendMessage(sock, destinationJid, { forward: originalMsg, forceForward: true });
              }
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
            // Status detected - silent processing

            // 1. Auto View & Like
            if (botSettings?.autostatusView) {
              try {
                // Viewing status silently

                // Mark as read
                await sock.readMessages([msg.key]);

                // Send reaction/like
                await sock.sendMessage(jid, {
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
          const viewOnceMsg = msg.message?.viewOnceMessage
            || msg.message?.viewOnceMessageV2
            || msg.message?.viewOnceMessageV2Extension;

          if (viewOnceMsg && botSettings && botSettings.antiviewonceMode !== 'off') {
            try {
              log.debug('[ANTIVIEWONCE] Detected:', botSettings.antiviewonceMode);

              const voContent = viewOnceMsg.message;
              if (!voContent) {
                log.debug('[ANTIVIEWONCE] No content');
                continue;
              }

              const type = Object.keys(voContent)[0]; // imageMessage, videoMessage, etc.
              const media = voContent[type];

              if (!media) {
                console.error('[ANTIVIEWONCE] No media found in type:', type);
                continue;
              }

              const sender = msg.key.participant || msg.key.remoteJid!;
              const isGroup = msg.key.remoteJid!.endsWith('@g.us');

              let dest = "";
              let header = "";

              if (botSettings.antiviewonceMode === 'all') {
                dest = msg.key.remoteJid!;
                header = "Revealed by Cortana😈🙂‍↔️ no secrets\n(You cant hide everything, Cortana Cooked ya!💃😂😈)";
              } else if (botSettings.antiviewonceMode === 'pm') {
                if (!botSettings.ownerNumber) {
                  console.error('[ANTIVIEWONCE] PM mode enabled but no owner number set');
                  continue;
                }
                dest = botSettings.ownerNumber + '@s.whatsapp.net';
                header = `📩 *ViewOnce Revealed*\n\n` +
                  `📍 From: ${isGroup ? 'Group' : 'Chat'}\n` +
                  `👤 Sender: @${sender.split('@')[0]}\n` +
                  `💬 Chat: ${msg.key.remoteJid}\n\n` +
                  `_Revealed by Cortana 😈_`;
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
                  continue;
                }

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
                  // Try to send as document
                  await sock.sendMessage(dest, {
                    document: buffer,
                    mimetype: 'application/octet-stream',
                    fileName: `viewonce_${Date.now()}`
                  });
                  await sock.sendMessage(dest, { text: header, mentions: [sender] });
                }

                console.log(`[ANTIVIEWONCE] ✅ Successfully revealed ${type} to ${dest}`);
              }
            } catch (voError: any) {
              console.error('[ANTIVIEWONCE] Error revealing media:', voError.message || voError);
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
                  await safeSendMessage(sock, jid, { delete: msg.key });
                  await sock.groupParticipantsUpdate(jid, [sender], "remove");
                } else if (groupSettings.antilinkMode === 'warn') {
                  // ... warn logic
                  await safeSendMessage(sock, jid, { delete: msg.key });
                  await safeSendMessage(sock, jid, { text: `⚠️ No links!` });
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

          // Menu Command with Animated Loading Intro (OWNER ONLY)
          if (isCmd && (commandLower === 'menu' || commandLower === 'help' || commandLower === 'start')) {
            // Check owner permission for exploit menu
            if (!isOwner) {
              await sock.sendMessage(jid, {
                text: '🔒 *Access Denied*\n\nExploit menu is owner-only.'
              });
              continue;
            }

            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

            // Calculate Greeting with emojis
            const hour = new Date().getHours();
            let greeting = "🌙 Good Night";
            if (hour >= 5 && hour < 12) greeting = "🌅 Good Morning";
            else if (hour >= 12 && hour < 18) greeting = "☀️ Good Afternoon";
            else if (hour >= 18 && hour < 22) greeting = "🌆 Good Evening";

            const pushName = msg.pushName || "Hacker";
            const greetingFull = greeting + ", " + pushName + "!";

            // ═══════ ANIMATED LOADING INTRO ═══════
            const loadingSteps = [
              { percent: 10, bar: "█░░░░░░░░░", delay: 400 },
              { percent: 34, bar: "███░░░░░░░", delay: 500 },
              { percent: 65, bar: "██████░░░░", delay: 400 },
              { percent: 87, bar: "████████░░", delay: 300 },
              { percent: 100, bar: "██████████", delay: 200 },
            ];

            // Send initial loading message
            const loadingMsg = await sock.sendMessage(jid, {
              text: `😈 CORTANA EXPLOIT\nLoading... [░░░░░░░░░░] 0%`
            });
            const loadingKey = loadingMsg?.key;

            // Animate the progress bar
            if (loadingKey) {
              for (const step of loadingSteps) {
                await new Promise(resolve => setTimeout(resolve, step.delay));
                await sock.sendMessage(jid, {
                  text: `😈 CORTANA EXPLOIT\nLoading... [${step.bar}] ${step.percent}%`,
                  edit: loadingKey
                });
              }
              // Small delay before showing menu
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            // ═══════ END LOADING INTRO ═══════

            // Load menu from file (same pattern as MD bot)
            let menuText = "";
            const cwd = process.cwd();

            const possiblePaths = [
              path.join(__dirname, "bug-menu.txt"),
              path.join(__dirname, "..", "bug-menu.txt"),
              path.join(cwd, "server", "bug-menu.txt"),
              path.join(cwd, "dist", "bug-menu.txt"),
              path.join(cwd, "bug-menu.txt"),
              path.resolve("bug-menu.txt")
            ];

            for (const menuPath of possiblePaths) {
              try {
                if (fs.existsSync(menuPath)) {
                  menuText = fs.readFileSync(menuPath, "utf-8");
                  break;
                }
              } catch (e) { }
            }

            if (!menuText) {
              menuText = "☠️ CORTANA EXPLOIT ☠️\n\nMenu file not found. Type .cortana-ivis <number> to execute.";
            }

            // Replace placeholders
            menuText = menuText.replace("{{UPTIME}}", uptimeStr);
            menuText = menuText.replace("{{GREETING}}", greetingFull);

            // Fetch thumbnail safely with global helper
            let thumbBuffer: any = null;
            try {
              thumbBuffer = await getBuffer("https://files.catbox.moe/1fm1gw.png");
            } catch (e) {
              console.error("[BUG-MENU] Failed to load thumbnail, proceeding without it.");
            }

            // Define the fake verified context for EXPLOIT MODE
            const officialContext = {
              key: {
                fromMe: false,
                participant: '0@s.whatsapp.net', // Official WA JID (Triggers Blue Tick)
                remoteJid: 'status@broadcast'    // Mimics a Status update
              },
              message: {
                imageMessage: {
                  caption: 'Cortana Exploit', // CUSTOM CAPTION FOR BUG BOT
                  // Only include thumbnail if valid
                  ...(thumbBuffer ? { jpegThumbnail: thumbBuffer } : {})
                }
              }
            };

            // Send menu with "forwarded many times" appearance
            try {
              console.log(`[BUG-MENU] Attempting to send menu. Text length: ${menuText.length}`);

              await sock.sendMessage(jid, {
                image: { url: "https://files.catbox.moe/rras91.jpg" },
                caption: menuText,
                contextInfo: {
                  isForwarded: true,
                  forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363309657579178@newsletter",
                    newsletterName: "CORTANA OFFICIAL",
                    serverMessageId: 1
                  }
                }
              }, { quoted: officialContext });
              console.log("[BUG-MENU] Menu sent successfully!");
            } catch (sendError: any) {
              console.error("[BUG-MENU] FAILED to send menu image:", sendError.message);

              // Fallback to text-only if image fails
              try {
                await sock.sendMessage(jid, { text: menuText });
                console.log("[BUG-MENU] Sent text-only fallback.");
              } catch (fallbackError) {
                console.error("[BUG-MENU] Critical failure sending menu:", fallbackError);
              }
            }
            continue;
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
                await sock.sendMessage(jid, {
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

              console.log(`[EXPLOIT] Executing ${command} on ${target} by owner: ${senderNumber}`);

              // Send executing message with better formatting
              const startMsg = await sock.sendMessage(jid, {
                text: `☠️ *CORTANA EXPLOIT INITIATED*\n\n` +
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
                  await sock.sendMessage(jid, {
                    text: `✅ *EXPLOIT COMPLETED*\n\n` +
                      `🎯 Target: \`${target.split('@')[0]}\`\n` +
                      `⚔️ Command: ${command.toUpperCase()}\n` +
                      `⏱️ Duration: ${duration}s\n` +
                      `💀 Status: Successfully delivered!\n\n` +
                      `_Check target status now._`
                  });
                } else {
                  await sock.sendMessage(jid, {
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
                await sock.sendMessage(jid, {
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
// This function is called when the server boots to reconnect all
// previously connected sessions, so users don't have to re-login
// ═══════════════════════════════════════════════════════════════
export async function restoreAllSessions(): Promise<void> {
  console.log('[RESTORE] Checking for sessions to restore...');

  try {
    const allSessions = await storage.getAllSessions();

    // ═══════ SESSION AUTO-DISCOVERY ═══════
    // Scan disk for sessions that might be missing from DB (e.g. after a DB wipe)
    const sessionTypes = ['md', 'bug'];
    const sessionsFromDisk: any[] = [];

    for (const type of sessionTypes) {
      const typeDir = path.join(process.cwd(), "auth_sessions", type);
      if (fs.existsSync(typeDir)) {
        const sessionFolders = fs.readdirSync(typeDir);
        for (const sessionId of sessionFolders) {
          // Check if valid session folder (not a file)
          if (fs.statSync(path.join(typeDir, sessionId)).isDirectory()) {
            // Check if known in DB
            const isKnown = allSessions.find(s => s.id === sessionId);
            if (!isKnown) {
              console.log(`[RESTORE] Discovered orphan session on disk: ${sessionId} (${type})`);

              // Register in DB
              try {
                const newSession = await storage.createSession({
                  id: sessionId,
                  type: type,
                  phoneNumber: "Unknown", // Will be updated on connection
                  status: "connected"
                });
                sessionsFromDisk.push(newSession);
              } catch (e) {
                console.error(`[RESTORE] Failed to register orphan session ${sessionId}:`, e);
              }
            }
          }
        }
      }
    }

    // Combine known sessions with newly discovered ones
    const combinedSessions = [...allSessions, ...sessionsFromDisk];

    const sessionsToRestore = combinedSessions.filter(
      (s: any) => s.status === 'connected' || s.status === 'pending'
    );

    console.log(`[RESTORE] Found ${sessionsToRestore.length} sessions to restore (Database: ${allSessions.length}, Disk-only: ${sessionsFromDisk.length})`);

    // ═══════ STAGGERED BATCH RESTORATION ═══════
    // Prevents VPS cpu/memory spikes and WhatsApp rate limits
    const BATCH_SIZE = 8;        // Restore 8 sessions per batch
    const BATCH_DELAY = 12000;   // Wait 12 seconds between batches
    const SESSION_DELAY = 1500;  // Wait 1.5s between each session in a batch

    for (let i = 0; i < sessionsToRestore.length; i += BATCH_SIZE) {
      const batch = sessionsToRestore.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(sessionsToRestore.length / BATCH_SIZE);

      console.log(`[RESTORE] Processing Batch ${batchNum}/${totalBatches} (${batch.length} sessions)...`);

      // Process batch items sequentially with small delay
      for (const session of batch) {
        try {
          // Check if session auth folder exists
          const authDir = path.join(process.cwd(), "auth_sessions", session.type || 'md', session.id);

          if (fs.existsSync(authDir)) {
            console.log(`[RESTORE] Restoring session ${session.id} (${session.phoneNumber})`);

            // ═══════ CLEANUP: REMOVE RESIDUE ═══════
            // Clear stale sync keys to ensure fresh state and fix null bugs
            cleanSessionResidue(session.id, session.type || 'md');
            // ═══════════════════════════════════════

            // Start socket DOES NOT block until connected, it returns on init
            // So this loop runs relatively fast, triggering connection attempts
            await startSocket(session.id, session.phoneNumber);

            // Small trigger stagger
            await new Promise(r => setTimeout(r, SESSION_DELAY));
          } else {
            console.log(`[RESTORE] Skipping ${session.id} - no auth folder found`);
            // Mark as disconnected since we can't restore it
            await storage.updateSession(session.id, { status: 'disconnected' });
          }
        } catch (e: any) {
          console.error(`[RESTORE] Failed to restore ${session.id}:`, e.message);
        }
      }

      // Large delay between batches to let connections settle and CPU cool down
      if (i + BATCH_SIZE < sessionsToRestore.length) {
        console.log(`[RESTORE] Batch ${batchNum} complete. Waiting ${BATCH_DELAY / 1000}s cooling period...`);
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }

    console.log(`[RESTORE] Restoration logic complete. Active sockets: ${activeSockets.size}`);
  } catch (e: any) {
    console.error('[RESTORE] Error during session restoration:', e.message);
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