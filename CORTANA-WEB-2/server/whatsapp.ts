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
import axios from "axios";
import { commands } from "./plugins/types";
import "./plugins/core";
import "./plugins/mpesa";

const logger = pino({ level: "warn" });
const msgRetryCounterCache = new NodeCache();

const activeSockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
const pairingCodes: Map<string, string> = new Map();

const BOT_NAME = "CORTANA MD X-MASS ED.";
const MENU_IMAGE = "https://files.catbox.moe/r0wa7j.jpg";
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

    // Check for successful pairing (isNewLogin indicates pairing code was entered)
    if (isNewLogin && connection !== "close") {
      console.log(`Session ${sessionId} pairing successful! Marking as connected.`);
      await storage.updateSession(sessionId, { status: "connected" });
      pairingCodes.delete(sessionId);

      // Create bot settings
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

      // If logged out, clean up completely
      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`Session ${sessionId} logged out`);
        activeSockets.delete(sessionId);
        pairingCodes.delete(sessionId);
        await storage.updateSession(sessionId, { status: "disconnected" });
      }
      // If stream error after successful pairing, reconnect automatically
      else if (currentStatus?.status === "connected" && statusCode === 515) {
        console.log(`Session ${sessionId} stream error after pairing - reconnecting...`);
        activeSockets.delete(sessionId);
        // Reconnect after a short delay
        setTimeout(async () => {
          try {
            await reconnectSession(sessionId, cleanPhone);
          } catch (error: any) {
            console.error(`Failed to reconnect session ${sessionId}:`, error.message);
          }
        }, 3000);
      }
      // Timeout or other errors during pairing
      else if (statusCode === DisconnectReason.timedOut || currentStatus?.status === "pending") {
        console.log(`Session ${sessionId} timed out or failed during pairing`);
        await storage.updateSession(sessionId, { status: "failed" });
        activeSockets.delete(sessionId);
        pairingCodes.delete(sessionId);
      }
    } else if (connection === "connecting") {
      console.log(`Session ${sessionId} is connecting...`);
    } else if (connection === "open") {
      console.log(`Session ${sessionId} connected successfully! New login: ${isNewLogin}`);
      await storage.updateSession(sessionId, { status: "connected" });
      pairingCodes.delete(sessionId);

      // Create bot settings only once
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
    console.log(`[${sessionId}] Message upsert - Type: ${type}, Count: ${messages.length}`);

    if (type !== "notify") {
      console.log(`[${sessionId}] Skipping non-notify message type: ${type}`);
      return;
    }

    for (const msg of messages) {
      console.log(`[${sessionId}] Processing message:`, {
        fromMe: msg.key.fromMe,
        remoteJid: msg.key.remoteJid,
        hasMessage: !!msg.message,
        messageKeys: msg.message ? Object.keys(msg.message) : []
      });

      // Skip if no message content
      if (!msg.message) {
        console.log(`[${sessionId}] Skipping message with no content`);
        continue;
      }

      // Skip protocol messages (history sync, etc)
      if (msg.message.protocolMessage) {
        console.log(`[${sessionId}] Skipping protocol message`);
        continue;
      }

      // Skip bot's own responses (messages sent by the bot)
      // But allow user's own messages (commands from owner)
      const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
      if (isOwnBotMessage) {
        console.log(`[${sessionId}] Skipping bot's own message`);
        continue;
      }

      // Process all other messages - let handleMessage do the text extraction
      await handleMessage(sock, msg, sessionId);
    }
  });

  // Wait a moment for socket to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (!sock.authState.creds.registered) {
    try {
      console.log(`Requesting pairing code for ${cleanPhone}...`);
      const pairingCode = await sock.requestPairingCode(cleanPhone);
      pairingCodes.set(sessionId, pairingCode);
      console.log(`Pairing code generated: ${pairingCode}`);

      // Socket will be cleaned up by connection.update handler after pairing completes
      return { sessionId, pairingCode };
    } catch (error: any) {
      console.error(`Failed to generate pairing code: ${error.message}`);
      await storage.updateSession(sessionId, { status: "failed" });
      activeSockets.delete(sessionId);
      try {
        sock.end(undefined);
      } catch { }
      throw new Error("Failed to generate pairing code. Please try again.");
    }
  } else {
    // Already registered, mark as connected
    await storage.updateSession(sessionId, { status: "connected" });
    try {
      sock.end(undefined);
    } catch { }
    throw new Error("This number is already linked. Please disconnect first.");
  }
}

export async function getSessionStatus(sessionId: string): Promise<string> {
  const session = await storage.getSession(sessionId);
  return session?.status || "not_found";
}

export function getPairingCode(sessionId: string): string | undefined {
  return pairingCodes.get(sessionId);
}

async function handleMessage(sock: ReturnType<typeof makeWASocket>, msg: any, sessionId: string) {
  const jid = msg.key.remoteJid!;

  // Extract text from various message types
  let text = "";
  if (msg.message) {
    text = msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.message.templateButtonReplyMessage?.selectedId ||
      "";
  }

  console.log(`[${sessionId}] Received message from ${jid}: "${text}"`);
  console.log(`[${sessionId}] Message object:`, JSON.stringify(msg.message, null, 2));

  if (!text || !text.startsWith(PREFIX)) return;

  const args = text.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  console.log(`[${sessionId}] Processing command: ${command}`);

  const settings = await storage.getBotSettings(sessionId);
  const isGroup = jid.endsWith("@g.us");
  const senderJid = isGroup ? (msg.key.participant || msg.participant || "") : jid;
  const senderNumber = senderJid.split("@")[0];
  const isOwner = senderNumber === settings?.ownerNumber;

  console.log(`[${sessionId}] Command settings - Owner: ${settings?.ownerNumber}, Sender: ${senderNumber}, IsOwner: ${isOwner}`);

  try {
    const cmd = commands.get(command || "");
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
      // Optional: Reply with "unknown command" or just ignore
      // console.log(`Unknown command: ${command}`);
    }
    // Core Commands
    switch (command) {
      case "owner":
        await sock.sendMessage(jid, {
          text: `👑 *Bot Owner*\n\n📞 Number: ${settings?.ownerNumber || "Not set"}\n🤖 Bot: ${BOT_NAME}`
        });
        break;
      case "alive":
      case "runtime":
      case "uptime":
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await sock.sendMessage(jid, {
          text: `🎄 *${BOT_NAME}*\n\n✅ Bot is alive!\n⏱️ Runtime: ${hours}h ${minutes}m ${seconds}s\n⚡ Speed: Fast\n🌐 Status: Online`
        });
        break;

      // Media Commands
      case "sticker":
      case "s":
        await handleSticker(sock, msg, jid);
        break;
      case "toimg":
        await handleToImg(sock, msg, jid);
        break;

      // Fun Commands
      case "tts":
        await handleTTS(sock, jid, args.join(" "));
        break;
      case "joke":
      case "jokes":
        await sendJoke(sock, jid);
        break;
      case "quote":
        await sendQuote(sock, jid);
        break;
      case "fact":
        await sendFact(sock, jid);
        break;
      case "weather":
        await sendWeather(sock, jid, args.join(" "));
        break;
      case "8ball":
        await handle8Ball(sock, jid, args.join(" "));
        break;
      case "compliment":
        await sendCompliment(sock, jid);
        break;
      case "dare":
        await sendDare(sock, jid);
        break;
      case "truth":
        await sendTruth(sock, jid);
        break;
      case "advice":
        const adviceRes = await axios.get('https://api.adviceslip.com/advice');
        await sock.sendMessage(jid, { text: `💡 *Advice*\n\n${adviceRes.data.slip.advice}` });
        break;

      // AI Commands
      case "gpt":
      case "chatgpt":
        await handleGPT(sock, jid, args.join(" "));
        break;
      case "gemini":
        await handleGemini(sock, jid, args.join(" "));
        break;
      case "imagine":
      case "genimage":
        await handleImageGen(sock, jid, args.join(" "));
        break;

      // Download Commands
      case "ytmp3":
      case "song":
      case "play":
        await handleYTAudio(sock, jid, args.join(" "));
        break;
      case "ytmp4":
      case "video":
        await handleYTVideo(sock, jid, args.join(" "));
        break;
      case "fb":
      case "facebook":
        await handleFacebook(sock, jid, args[0]);
        break;
      case "ig":
      case "instagram":
        await handleInstagram(sock, jid, args[0]);
        break;
      case "tiktok":
      case "tt":
        await handleTikTok(sock, jid, args[0]);
        break;

      // Group Management Commands
      case "tagall":
        if (isGroup) await tagAll(sock, msg, jid);
        break;
      case "tagadmin":
        if (isGroup) await tagAdmin(sock, jid);
        break;
      case "hidetag":
        if (isGroup) await hideTag(sock, msg, jid, args.join(" "));
        break;
      case "kick":
        if (isGroup && isOwner) await kickUser(sock, msg, jid);
        break;
      case "add":
        if (isGroup && isOwner) await addUser(sock, jid, args[0]);
        break;
      case "promote":
        if (isGroup && isOwner) await promoteUser(sock, msg, jid);
        break;
      case "demote":
        if (isGroup && isOwner) await demoteUser(sock, msg, jid);
        break;
      case "open":
        if (isGroup && isOwner) await unmuteGroup(sock, jid);
        break;
      case "close":
        if (isGroup && isOwner) await muteGroup(sock, jid);
        break;
      case "link":
        if (isGroup) {
          const code = await sock.groupInviteCode(jid);
          await sock.sendMessage(jid, { text: `🔗 *Group Link*\n\nhttps://chat.whatsapp.com/${code}` });
        }
        break;
      case "ginfo":
      case "groupinfo":
        if (isGroup) await groupInfo(sock, jid);
        break;

      // Anti-Features
      case "antilink":
        if (isGroup && isOwner) await toggleAntilink(sock, jid, sessionId, args[0]);
        break;
      case "antibadword":
        if (isGroup && isOwner) {
          const enabled = args[0]?.toLowerCase() === "on";
          await storage.updateGroupSettings(jid, { antibadword: enabled });
          await sock.sendMessage(jid, { text: `🚫 Anti Badword ${enabled ? 'enabled' : 'disabled'}!` });
        }
        break;

      // Owner Commands
      case "block":
        if (!isOwner) return;
        const toBlock = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] + '@s.whatsapp.net';
        await sock.updateBlockStatus(toBlock, 'block');
        await sock.sendMessage(jid, { text: '✅ User blocked!' });
        break;
      case "unblock":
        if (!isOwner) return;
        const toUnblock = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] + '@s.whatsapp.net';
        await sock.updateBlockStatus(toUnblock, 'unblock');
        await sock.sendMessage(jid, { text: '✅ User unblocked!' });
        break;
      case "setbio":
        if (!isOwner) return;
        await sock.updateProfileStatus(args.join(" ") || 'CORTANA MD Active');
        await sock.sendMessage(jid, { text: '✅ Bio updated!' });
        break;
      case "self":
        if (!isOwner) return;
        await storage.updateBotSettings(sessionId, { isPublic: false });
        await sock.sendMessage(jid, { text: '🔒 Self mode enabled!' });
        break;
      case "public":
        if (!isOwner) return;
        await storage.updateBotSettings(sessionId, { isPublic: true });
        await sock.sendMessage(jid, { text: '🌐 Public mode enabled!' });
        break;
      case "repo":
        await sock.sendMessage(jid, {
          text: `📦 *CORTANA MD - Christmas Edition 2025*\n\n🎄 GitHub: https://github.com/Eduqariz/Cortana-MD\n👨‍💻 Owner: ${settings?.ownerNumber}\n⭐ Star the repo!`
        });
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(`[${sessionId}] Error handling command ${command}:`, error);
    await sock.sendMessage(jid, { text: "❌ An error occurred while processing your command." });
  }
}

async function sendMenu(sock: ReturnType<typeof makeWASocket>, jid: string) {
  console.log('Preparing menu message...');
  const menuText = `
🌺❀──────────────────────────────❀🌺
           CORTANA MD 
         C H R I S T M A S  E D.
🌺❀──────────────────────────────❀🌺


🌸🌼 O W N E R   M E N U 🌼🌸
⮞ block - Block user
⮞ unblock - Unblock user  
⮞ dev - Developer mode
⮞ self - Private bot mode
⮞ public - Public bot mode
⮞ bc - Broadcast message
⮞ setbio - Set bot bio
⮞ settings - Bot settings
⮞ addprem - Add premium user
⮞ delprem - Remove premium
⮞ addowner - Add owner
⮞ delowner - Remove owner
⮞ shell - Execute shell command
🌸───────────────────────────────🌸


🌷🌹 G R O U P   M A N A G E 🌹🌷
⮞ add - Member member
⮞ promote - Make admin
⮞ demote - Remove admin
⮞ kick - Remove member
⮞ open - Open group
⮞ close - Close group
⮞ link - Get group link
⮞ tagall - Tag everyone
⮞ tagadmin - Tag admins only
⮞ hidetag - Hidden tag
⮞ ginfo - Group info
🌷───────────────────────────────🌷


🌺🌼 A I   &   C H A T B O T S 🌼🌺
⮞ gpt - Ask ChatGPT
⮞ chatgpt - Advanced AI chat
⮞ deepseek - DeepSeek AI
⮞ imagine - Generate images
⮞ llama - LLaMA AI
⮞ gemini - Google Gemini AI
⮞ joke - Random joke
⮞ advice - Get advice
⮞ trivia - Trivia questions
🌺───────────────────────────────🌺


🌹🌸 U T I L I T I E S 🌸🌹
⮞ menu - Show menu
⮞ ping - Bot speed
⮞ alive - Bot status
⮞ uptime - Runtime info
⮞ owner - Owner contact
⮞ repo - Bot repository
⮞ delete - Delete message
⮞ react - React to message
⮞ autoread - Toggle autoread
🌹───────────────────────────────🌹


🌼🌻 M E D I A   &   D O W N L O A D 🌻🌼
⮞ song - Download audio
⮞ video - Download video
⮞ play - YouTube search
⮞ ytmp3 - YouTube to MP3
⮞ ytmp4 - YouTube to MP4
⮞ fb - Facebook downloader
⮞ ig - Instagram downloader
⮞ tiktok - TikTok downloader
⮞ apk - APK downloader
⮞ lyrics - Song lyrics
🌼───────────────────────────────🌼


🌸🌺 S T I C K E R S 🌺🌸
⮞ sticker - Create sticker
⮞ s - Quick sticker
⮞ toimg - Sticker to image
⮞ toanime - Animate image
🌸───────────────────────────────🌸


🌷🌹 A N T I – F E A T U R E S 🌹🌷
⮞ antilink - Toggle antilink
⮞ antibadword - Filter bad words
⮞ antibot - Block other bots
⮞ antigag - Prevent tagging
⮞ antidelete - Save deleted msgs
⮞ antivirus - Scan files
🌷───────────────────────────────🌷


❀──────────────────────────────❀
      🌸 Powered by CORTANA MD 
         🎄 Èdûqarîz 2025
❀──────────────────────────────❀
  `;

  try {
    console.log('Attempting to send menu with image...');
    await sock.sendMessage(jid, {
      image: { url: MENU_IMAGE },
      caption: menuText,
    });
    console.log('Menu with image sent successfully');
  } catch (error: any) {
    console.log('Failed to send menu with image, trying text only...', error.message);
    // Fallback without image
    try {
      await sock.sendMessage(jid, { text: menuText });
      console.log('Menu text sent successfully');
    } catch (textError: any) {
      console.error('Failed to send menu text:', textError);
      throw textError;
    }
  }
}

async function handleSticker(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const imageMsg = msg.message?.imageMessage || quotedMsg?.imageMessage;
  const videoMsg = msg.message?.videoMessage || quotedMsg?.videoMessage;

  if (!imageMsg && !videoMsg) {
    await sock.sendMessage(jid, { text: "📷 Please send or reply to an image/video with .sticker" });
    return;
  }

  let inputFile = "";
  let outputFile = "";

  try {
    await sock.sendMessage(jid, { text: "🎨 Creating sticker..." });

    let mediaMsg: any;
    if (msg.message?.imageMessage || msg.message?.videoMessage) {
      mediaMsg = msg;
    } else {
      mediaMsg = {
        key: {
          remoteJid: jid,
          id: contextInfo?.stanzaId,
          participant: contextInfo?.participant
        },
        message: imageMsg ? { imageMessage: quotedMsg?.imageMessage } : { videoMessage: quotedMsg?.videoMessage }
      };
    }

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      {
        logger,
        reuploadRequest: sock.updateMediaMessage
      }
    );

    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    inputFile = path.join(tempDir, `input_${timestamp}.${imageMsg ? 'jpg' : 'mp4'}`);
    outputFile = path.join(tempDir, `sticker_${timestamp}.webp`);

    fs.writeFileSync(inputFile, buffer);

    const { execSync } = await import("child_process");

    if (imageMsg) {
      execSync(`ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000" -c:v libwebp -quality 80 "${outputFile}"`, { stdio: 'pipe' });
    } else {
      execSync(`ffmpeg -i "${inputFile}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000,fps=15" -c:v libwebp -loop 0 -preset default -an -vsync 0 "${outputFile}"`, { stdio: 'pipe' });
    }

    const stickerBuffer = fs.readFileSync(outputFile);

    await sock.sendMessage(jid, {
      sticker: stickerBuffer
    });

  } catch (error: any) {
    console.error("Sticker creation error:", error);
    await sock.sendMessage(jid, { text: "❌ Failed to create sticker. Please try again with a different image." });
  } finally {
    try {
      if (inputFile && fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (outputFile && fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch { }
  }
}

async function handleTTS(sock: ReturnType<typeof makeWASocket>, jid: string, text: string) {
  if (!text) {
    await sock.sendMessage(jid, { text: "📝 Please provide text: .tts <your text>" });
    return;
  }
  await sock.sendMessage(jid, { text: `🔊 TTS: ${text}` });
}

async function sendJoke(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const jokes = [
    "Why did Santa go to music school? To improve his wrapping skills! 🎅",
    "What do you call an obnoxious reindeer? Rude-olph! 🦌",
    "Why was the snowman looking through the carrots? He was picking his nose! ⛄",
    "What do elves learn in school? The elf-abet! 🧝",
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  await sock.sendMessage(jid, { text: `😂 *Christmas Joke*\n\n${joke}` });
}

async function sendQuote(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const quotes = [
    "Christmas is not a time nor a season, but a state of mind. - Calvin Coolidge 🎄",
    "The best of all gifts around any Christmas tree: the presence of a happy family. - Burton Hillis 🎁",
    "Christmas waves a magic wand over this world, and behold, everything is softer and more beautiful. ✨",
    "Peace on earth will come to stay, when we live Christmas every day. 🕊️",
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  await sock.sendMessage(jid, { text: `💫 *Quote*\n\n${quote}` });
}

async function sendFact(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const facts = [
    "🎄 The tradition of Christmas trees came from Germany in the 16th century.",
    "🦌 Rudolph the Red-Nosed Reindeer was created in 1939 for a coloring book!",
    "🎅 Santa Claus is based on St. Nicholas, a Christian bishop from the 4th century.",
    "🎁 Americans spend about $1 trillion on Christmas gifts every year!",
  ];
  const fact = facts[Math.floor(Math.random() * facts.length)];
  await sock.sendMessage(jid, { text: `📚 *Fun Fact*\n\n${fact}` });
}

async function sendWeather(sock: ReturnType<typeof makeWASocket>, jid: string, city: string) {
  if (!city) {
    await sock.sendMessage(jid, { text: "🌤️ Please provide a city: .weather <city name>" });
    return;
  }
  await sock.sendMessage(jid, { text: `🌤️ Weather feature coming soon for ${city}!` });
}

async function handle8Ball(sock: ReturnType<typeof makeWASocket>, jid: string, question: string) {
  if (!question) {
    await sock.sendMessage(jid, { text: "🎱 Please ask a question: .8ball <your question>" });
    return;
  }

  const responses = [
    "It is certain 🎯",
    "It is decidedly so ✨",
    "Without a doubt 💯",
    "Yes definitely 👍",
    "You may rely on it 🤝",
    "As I see it, yes 👀",
    "Most likely 📈",
    "Outlook good 🌟",
    "Yes 👍",
    "Signs point to yes ✅",
    "Reply hazy, try again 🌫️",
    "Ask again later ⏰",
    "Better not tell you now 🤐",
    "Cannot predict now 🔮",
    "Concentrate and ask again 🧘",
    "Don't count on it 👎",
    "My reply is no ❌",
    "My sources say no 📉",
    "Outlook not so good 😔",
    "Very doubtful 🤔"
  ];

  const answer = responses[Math.floor(Math.random() * responses.length)];
  await sock.sendMessage(jid, {
    text: `🎱 *Magic 8 Ball*\n\n❓ Question: ${question}\n\n✨ Answer: ${answer}`
  });
}

async function sendCompliment(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const compliments = [
    "You're more fun than bubble wrap! 🎉",
    "You light up every room you enter! 💡",
    "Your smile is contagious! 😊",
    "You have the best laugh! 😂",
    "You're a fantastic friend! 🤗",
    "Your kindness is a gift to everyone! 🎁",
    "You're braver than you believe! 💪",
    "You're smarter than you think! 🧠",
    "You bring out the best in people! ⭐",
    "Your energy is absolutely magnetic! 🧲"
  ];

  const compliment = compliments[Math.floor(Math.random() * compliments.length)];
  await sock.sendMessage(jid, { text: `💝 *Compliment*\n\n${compliment}` });
}

async function sendDare(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const dares = [
    "Send a voice note singing your favorite song! 🎤",
    "Change your profile picture to something funny for 1 hour! 📸",
    "Text your crush 'Hi' right now! 💕",
    "Post a story saying something nice about this group! 📱",
    "Send your most embarrassing photo to the group! 😂",
    "Do 10 push-ups and send a video! 💪",
    "Send a voice note in a funny accent! 🗣️",
    "Send a screenshot of your last Google search! 🔍",
    "Text a random contact 'I love you' and screenshot their response! 💌",
    "Speak only in emojis for the next 10 minutes! 😜"
  ];

  const dare = dares[Math.floor(Math.random() * dares.length)];
  await sock.sendMessage(jid, { text: `🎯 *Dare*\n\n${dare}` });
}

async function sendTruth(sock: ReturnType<typeof makeWASocket>, jid: string) {
  const truths = [
    "What's your most embarrassing moment? 😳",
    "What's the last lie you told? 🤥",
    "Who was your first crush? 💕",
    "What's your biggest fear? 😨",
    "What's a secret you've never told anyone? 🤫",
    "What's the dumbest thing you've ever done? 🤦",
    "Have you ever cheated on a test? 📝",
    "What's your guilty pleasure? 😏",
    "Who do you like in this group? 😉",
    "What's the most childish thing you still do? 🧸"
  ];

  const truth = truths[Math.floor(Math.random() * truths.length)];
  await sock.sendMessage(jid, { text: `🎤 *Truth*\n\n${truth}` });
}

async function tagAll(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const participants = groupMetadata.participants;

    let mentions = participants.map(p => p.id);
    let text = "📢 *Attention Everyone!*\n\n";
    participants.forEach(p => {
      text += `@${p.id.split("@")[0]}\n`;
    });

    await sock.sendMessage(jid, { text, mentions });
  } catch (error) {
    await sock.sendMessage(jid, { text: "❌ Failed to tag all members." });
  }
}

async function kickUser(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentioned || mentioned.length === 0) {
    await sock.sendMessage(jid, { text: "❌ Please mention the user to kick." });
    return;
  }

  try {
    await sock.groupParticipantsUpdate(jid, mentioned, "remove");
    await sock.sendMessage(jid, { text: "✅ User kicked successfully!" });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to kick user. Make sure bot is admin." });
  }
}

async function addUser(sock: ReturnType<typeof makeWASocket>, jid: string, number: string) {
  if (!number) {
    await sock.sendMessage(jid, { text: "❌ Please provide a number: .add 1234567890" });
    return;
  }

  try {
    const fullNumber = number.includes("@s.whatsapp.net") ? number : `${number}@s.whatsapp.net`;
    await sock.groupParticipantsUpdate(jid, [fullNumber], "add");
    await sock.sendMessage(jid, { text: "✅ User added successfully!" });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to add user." });
  }
}

async function promoteUser(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentioned || mentioned.length === 0) {
    await sock.sendMessage(jid, { text: "❌ Please mention the user to promote." });
    return;
  }

  try {
    await sock.groupParticipantsUpdate(jid, mentioned, "promote");
    await sock.sendMessage(jid, { text: "✅ User promoted to admin!" });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to promote user." });
  }
}

async function demoteUser(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (!mentioned || mentioned.length === 0) {
    await sock.sendMessage(jid, { text: "❌ Please mention the user to demote." });
    return;
  }

  try {
    await sock.groupParticipantsUpdate(jid, mentioned, "demote");
    await sock.sendMessage(jid, { text: "✅ User demoted from admin!" });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to demote user." });
  }
}

async function toggleAntilink(sock: ReturnType<typeof makeWASocket>, jid: string, sessionId: string, state: string) {
  const enabled = state?.toLowerCase() === "on";

  let groupSetting = await storage.getGroupSettings(jid);
  if (!groupSetting) {
    await storage.createGroupSettings({
      groupId: jid,
      sessionId,
      antilink: enabled,
      antibadword: false,
      antitag: false,
    });
  } else {
    await storage.updateGroupSettings(jid, { antilink: enabled });
  }

  await sock.sendMessage(jid, {
    text: enabled ? "🔗 Antilink enabled! Links will be deleted." : "🔗 Antilink disabled."
  });
}

async function muteGroup(sock: ReturnType<typeof makeWASocket>, jid: string) {
  try {
    await sock.groupSettingUpdate(jid, "announcement");
    await sock.sendMessage(jid, { text: "🔇 Group muted. Only admins can send messages." });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to mute group." });
  }
}

async function unmuteGroup(sock: ReturnType<typeof makeWASocket>, jid: string) {
  try {
    await sock.groupSettingUpdate(jid, "not_announcement");
    await sock.sendMessage(jid, { text: "🔊 Group unmuted. Everyone can send messages." });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to unmute group." });
  }
}

async function groupInfo(sock: ReturnType<typeof makeWASocket>, jid: string) {
  try {
    const metadata = await sock.groupMetadata(jid);
    const info = `
📋 *Group Info*
━━━━━━━━━━━━━━━
📛 Name: ${metadata.subject}
👥 Members: ${metadata.participants.length}
📅 Created: ${new Date(metadata.creation! * 1000).toLocaleDateString()}
📝 Description: ${metadata.desc || "No description"}
━━━━━━━━━━━━━━━
    `;
    await sock.sendMessage(jid, { text: info });
  } catch {
    await sock.sendMessage(jid, { text: "❌ Failed to get group info." });
  }
}

// AI Command Handlers
async function handleGPT(sock: ReturnType<typeof makeWASocket>, jid: string, prompt: string) {
  if (!prompt) {
    await sock.sendMessage(jid, { text: "🤖 Please provide a question: .gpt <your question>" });
    return;
  }

  await sock.sendMessage(jid, { text: "🤖 *Processing your request...*" });

  try {
    const response = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(prompt)}`, {
      timeout: 30000
    });

    if (response.data && response.data.result) {
      await sock.sendMessage(jid, {
        text: `🤖 *GPT Response*\n\n${response.data.result}`
      });
    } else {
      await sock.sendMessage(jid, { text: "❌ Could not get a response. Please try again." });
    }
  } catch (error: any) {
    console.error("GPT API error:", error.message);
    await sock.sendMessage(jid, { text: "❌ Failed to get AI response. Please try again later." });
  }
}

async function handleGemini(sock: ReturnType<typeof makeWASocket>, jid: string, prompt: string) {
  if (!prompt) {
    await sock.sendMessage(jid, { text: "💎 Please provide a question: .gemini <your question>" });
    return;
  }

  await sock.sendMessage(jid, { text: "💎 *Processing with Gemini...*" });

  const geminiApis = [
    `https://vapis.my.id/api/gemini?q=${encodeURIComponent(prompt)}`,
    `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(prompt)}`,
    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(prompt)}`
  ];

  for (const apiUrl of geminiApis) {
    try {
      const response = await axios.get(apiUrl, { timeout: 30000 });

      if (response.data) {
        const result = response.data.result || response.data.answer || response.data.data || response.data.response;
        if (result) {
          await sock.sendMessage(jid, {
            text: `💎 *Gemini Response*\n\n${result}`
          });
          return;
        }
      }
    } catch (error: any) {
      console.error(`Gemini API error for ${apiUrl}:`, error.message);
      continue;
    }
  }

  await sock.sendMessage(jid, { text: "❌ All Gemini APIs failed. Please try again later." });
}

async function handleImageGen(sock: ReturnType<typeof makeWASocket>, jid: string, prompt: string) {
  if (!prompt) {
    await sock.sendMessage(jid, { text: "🎨 Please provide a description: .imagine <description>" });
    return;
  }

  await sock.sendMessage(jid, { text: "🎨 *Generating image...*" });

  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(prompt)}`, {
      timeout: 60000
    });

    if (response.data && response.data.data) {
      await sock.sendMessage(jid, {
        image: { url: response.data.data },
        caption: `🎨 *Generated Image*\n\nPrompt: ${prompt}`
      });
    } else {
      await sock.sendMessage(jid, { text: "❌ Could not generate image. Please try again." });
    }
  } catch (error: any) {
    console.error("Image generation error:", error.message);
    await sock.sendMessage(jid, { text: "❌ Failed to generate image. Please try again later." });
  }
}

// Download Command Handlers
async function handleYTAudio(sock: ReturnType<typeof makeWASocket>, jid: string, query: string) {
  if (!query) {
    await sock.sendMessage(jid, { text: "🎵 Please provide a song name or YouTube URL: .song <name/url>" });
    return;
  }
  await sock.sendMessage(jid, { text: `🎵 Searching for: ${query}\n\nDownload feature coming soon!` });
}

async function handleYTVideo(sock: ReturnType<typeof makeWASocket>, jid: string, query: string) {
  if (!query) {
    await sock.sendMessage(jid, { text: "🎬 Please provide a video name or YouTube URL: .video <name/url>" });
    return;
  }
  await sock.sendMessage(jid, { text: `🎬 Searching for: ${query}\n\nDownload feature coming soon!` });
}

async function handleFacebook(sock: ReturnType<typeof makeWASocket>, jid: string, url: string) {
  if (!url) {
    await sock.sendMessage(jid, { text: "📘 Please provide a Facebook video URL: .fb <url>" });
    return;
  }
  await sock.sendMessage(jid, { text: `📘 Downloading Facebook video...\n\nFeature coming soon!` });
}

async function handleInstagram(sock: ReturnType<typeof makeWASocket>, jid: string, url: string) {
  if (!url) {
    await sock.sendMessage(jid, { text: "📷 Please provide an Instagram URL: .ig <url>" });
    return;
  }
  await sock.sendMessage(jid, { text: `📷 Downloading Instagram media...\n\nFeature coming soon!` });
}

async function handleTikTok(sock: ReturnType<typeof makeWASocket>, jid: string, url: string) {
  if (!url) {
    await sock.sendMessage(jid, { text: "🎵 Please provide a TikTok URL: .tiktok <url>" });
    return;
  }

  if (!url.includes("tiktok.com")) {
    await sock.sendMessage(jid, { text: "❌ Please provide a valid TikTok URL." });
    return;
  }

  await sock.sendMessage(jid, { text: "🎵 *Downloading TikTok video...*" });

  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`, {
      timeout: 60000
    });

    const data = response.data;
    if (data && (data.status === true || data.status === "success" || data.result)) {
      const videoData = data.data || data.result || data;
      const videoUrl = videoData.play || videoData.wmplay || videoData.hdplay || videoData.video || videoData.url;

      if (videoUrl) {
        const authorName = videoData.author?.nickname || videoData.author?.name || videoData.username || 'Unknown';
        const title = videoData.title || videoData.desc || videoData.description || '';

        await sock.sendMessage(jid, {
          video: { url: videoUrl },
          caption: `🎵 *TikTok Video Downloaded*\n\n👤 Author: ${authorName}\n📝 ${title}`
        });
        return;
      }
    }

    const errorMsg = data?.message || data?.error || "Unknown error";
    await sock.sendMessage(jid, { text: `❌ Could not download TikTok video: ${errorMsg}` });
  } catch (error: any) {
    console.error("TikTok download error:", error.message);
    await sock.sendMessage(jid, { text: "❌ Failed to download TikTok video. Please try again later." });
  }
}

async function handleToImg(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string) {
  const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const stickerMsg = quotedMsg?.stickerMessage;

  if (!stickerMsg) {
    await sock.sendMessage(jid, { text: "📷 Please reply to a sticker with .toimg" });
    return;
  }

  try {
    await sock.sendMessage(jid, { text: "🔄 Converting sticker to image..." });

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsgObj = {
      key: {
        remoteJid: jid,
        id: contextInfo?.stanzaId,
        participant: contextInfo?.participant
      },
      message: { stickerMessage: quotedMsg?.stickerMessage }
    };

    const buffer = await downloadMediaMessage(
      quotedMsgObj,
      "buffer",
      {},
      {
        logger,
        reuploadRequest: sock.updateMediaMessage
      }
    );

    await sock.sendMessage(jid, {
      image: buffer,
      caption: "✅ Converted to image!"
    });
  } catch (error: any) {
    console.error("ToImg error:", error);
    await sock.sendMessage(jid, { text: "❌ Failed to convert sticker. Please try again." });
  }
}

async function tagAdmin(sock: ReturnType<typeof makeWASocket>, jid: string) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);

    let text = "📢 *Calling All Admins!*\n\n";
    admins.forEach(admin => {
      text += `@${admin.split("@")[0]}\n`;
    });

    await sock.sendMessage(jid, { text, mentions: admins });
  } catch (error) {
    await sock.sendMessage(jid, { text: "❌ Failed to tag admins." });
  }
}

async function hideTag(sock: ReturnType<typeof makeWASocket>, msg: any, jid: string, message: string) {
  try {
    const groupMetadata = await sock.groupMetadata(jid);
    const participants = groupMetadata.participants.map(p => p.id);

    await sock.sendMessage(jid, {
      text: message || "📢 Hidden tag message",
      mentions: participants
    });
  } catch (error) {
    await sock.sendMessage(jid, { text: "❌ Failed to send hidden tag." });
  }
}

export async function disconnectSession(sessionId: string) {
  const sock = activeSockets.get(sessionId);
  if (sock) {
    await sock.logout();
    activeSockets.delete(sessionId);
  }
  await storage.updateSession(sessionId, { status: "disconnected" });
}

export function getActiveSessionsCount(): number {
  return activeSockets.size;
}

async function reconnectSession(sessionId: string, phoneNumber: string) {
  console.log(`Reconnecting session ${sessionId}...`);

  const authDir = path.join(process.cwd(), "auth_sessions", sessionId);

  if (!fs.existsSync(authDir)) {
    throw new Error("Session auth directory not found");
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
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      return { conversation: '' };
    },
  });

  activeSockets.set(sessionId, sock);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    console.log(`Session ${sessionId} (reconnect) connection update:`, JSON.stringify(update));

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`Session ${sessionId} logged out during reconnect`);
        activeSockets.delete(sessionId);
        await storage.updateSession(sessionId, { status: "disconnected" });
      } else {
        console.log(`Session ${sessionId} closed during reconnect, retrying...`);
        activeSockets.delete(sessionId);
        setTimeout(() => reconnectSession(sessionId, phoneNumber), 5000);
      }
    } else if (connection === "open") {
      console.log(`Session ${sessionId} reconnected successfully!`);
      await storage.updateSession(sessionId, { status: "connected" });
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log(`[${sessionId}] Message upsert - Type: ${type}, Count: ${messages.length}`);

    if (type !== "notify") {
      console.log(`[${sessionId}] Skipping non-notify message type: ${type}`);
      return;
    }

    for (const msg of messages) {
      console.log(`[${sessionId}] Processing message:`, {
        fromMe: msg.key.fromMe,
        remoteJid: msg.key.remoteJid,
        hasMessage: !!msg.message,
        messageKeys: msg.message ? Object.keys(msg.message) : []
      });

      // Skip if no message content
      if (!msg.message) {
        console.log(`[${sessionId}] Skipping message with no content`);
        continue;
      }

      // Skip protocol messages (history sync, etc)
      if (msg.message.protocolMessage) {
        console.log(`[${sessionId}] Skipping protocol message`);
        continue;
      }

      // Skip bot's own responses (messages sent by the bot)
      // But allow user's own messages (commands from owner)
      const isOwnBotMessage = msg.key.fromMe && msg.key.id && msg.key.id.startsWith('3EB0');
      if (isOwnBotMessage) {
        console.log(`[${sessionId}] Skipping bot's own message`);
        continue;
      }

      // Process all other messages - let handleMessage do the text extraction
      await handleMessage(sock, msg, sessionId);
    }
  });

  console.log(`Session ${sessionId} reconnection initiated`);
}