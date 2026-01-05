import { registerCommand } from "./types";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

// Menu images - rotate sequentially (cycle through 3 images)
const MENU_IMAGES = [
    "https://files.catbox.moe/y0yjzu.jpg",
    "https://files.catbox.moe/2ob13q.jpg",
    "https://files.catbox.moe/zn4l18.jpg"
];
let menuImageIndex = 0; // Tracks which image to show next

// Load menu template from file
function getMenuTemplate(): string {
    // Try multiple paths: working menu first (only implemented commands), then ultra, then fallback
    const possiblePaths = [
        path.join(__dirname, "menu-working.txt"),   // Production: dist/menu-working.txt (VERIFIED COMMANDS ONLY)
        path.join(__dirname, "..", "menu-working.txt"), // Dev: server/menu-working.txt
        path.join(__dirname, "menu-ultra.txt"),     // Fallback: ultra menu
        path.join(__dirname, "..", "menu-ultra.txt"),
        path.join(__dirname, "menu.txt"),           // Fallback: original menu
        path.join(__dirname, "..", "menu.txt"),
    ];

    for (const menuPath of possiblePaths) {
        try {
            if (fs.existsSync(menuPath)) {
                console.log("[MENU] Loading menu from:", menuPath);
                return fs.readFileSync(menuPath, "utf-8");
            }
        } catch (e) {
            // Continue to next path
        }
    }

    console.error("[MENU] Failed to load menu from any location:", possiblePaths);
    return "CORTANA V4.0 ULTRA MENU\n\nMenu file not found. Contact EDUQARIZ.";
}

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, reply }) => {
        const chatJid = msg.key.remoteJid!;

        // React to menu command
        try {
            await sock.sendMessage(chatJid, {
                react: { text: "💃", key: msg.key }
            });
        } catch (e) { }

        // Letter by letter intro
        try {
            const sentMsg = await sock.sendMessage(chatJid, { text: "C" });
            const introKey = sentMsg?.key;

            if (introKey) {
                const introText = "CORTANA IS HERE";
                let displayText = "";

                for (let i = 0; i < introText.length; i++) {
                    displayText += introText[i];
                    await sock.sendMessage(chatJid, {
                        text: "*" + displayText + "*",
                        edit: introKey
                    });
                    await new Promise(resolve => setTimeout(resolve, 80));
                }
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (e) {
            console.error("[MENU] Intro error:", e);
        }

        // Calculate Uptime
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeString = d + "d " + h + "h " + m + "m " + s + "s";

        // Calculate Greeting with emojis
        const hour = new Date().getHours();
        let greeting = "🌙 Good Night";
        if (hour >= 5 && hour < 12) greeting = "🌅 Good Morning";
        else if (hour >= 12 && hour < 18) greeting = "☀️ Good Afternoon";
        else if (hour >= 18 && hour < 22) greeting = "🌆 Good Evening";

        const pushName = msg.pushName || "User";
        const greetingFull = greeting + ", " + pushName + "!";

        // Get bot settings for prefix and mode
        const { getBotSettings } = await import("../whatsapp");
        const settings = await getBotSettings(msg.key.remoteJid!.split('@')[0]);
        const prefix = settings?.prefix || ".";
        const mode = (msg.key.remoteJid?.endsWith('@s.whatsapp.net') ? "SELF" : (settings?.isPublic ? "PUBLIC" : "PRIVATE"));

        // Get menu from file and replace placeholders
        let menuText = getMenuTemplate();
        menuText = menuText.replace(/\{\{UPTIME\}\}/g, uptimeString);
        menuText = menuText.replace(/\{\{GREETING\}\}/g, greetingFull);
        menuText = menuText.replace(/\{\{PREFIX\}\}/g, prefix);
        menuText = menuText.replace(/\{\{MODE\}\}/g, mode);

        try {
            console.log("[MENU] Starting menu send process...");

            // 1. Define Helper First
            const getBuffer = async (url: string) => {
                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
                    return response.data;
                } catch (error) {
                    console.error("Failed to fetch buffer:", error);
                    return null;
                }
            };

            // 2. Fetch Thumbnail
            console.log("[MENU] Fetching thumbnail...");
            let thumbBuffer: any = null;
            try {
                thumbBuffer = await getBuffer("https://files.catbox.moe/1fm1gw.png");
                console.log("[MENU] Thumbnail fetched:", thumbBuffer ? "Success" : "Failed (null)");
            } catch (e) {
                console.error("[MENU] Thumbnail exception:", e);
            }

            // 3. Fetch Main Image
            const currentImage = MENU_IMAGES[menuImageIndex % MENU_IMAGES.length];
            menuImageIndex++;

            console.log("[MENU] Fetching main menu image:", currentImage);
            let mainImageBuffer: any = null;
            try {
                mainImageBuffer = await getBuffer(currentImage);
                console.log("[MENU] Main image fetched:", mainImageBuffer ? "Success" : "Failed (null)");
            } catch (e) {
                console.error("[MENU] Main image exception:", e);
            }

            // 4. Define Context (Now thumbBuffer is ready)
            const officialContext = {
                key: {
                    fromMe: false,
                    participant: '0@s.whatsapp.net',
                    remoteJid: 'status@broadcast'
                },
                message: {
                    imageMessage: {
                        caption: 'Cortana MD Ultra',
                        ...(thumbBuffer ? { jpegThumbnail: thumbBuffer } : {})
                    }
                }
            };

            // 5. Send Menu (Fallback if main image failed)
            if (!mainImageBuffer) {
                console.log("[MENU] Main image unavailable, sending text-only menu.");
                await sock.sendMessage(chatJid, {
                    text: menuText,
                    contextInfo: {
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363309657579178@newsletter",
                            newsletterName: "CORTANA OFFICIAL",
                            serverMessageId: 1
                        }
                    }
                }, { quoted: officialContext });
            } else {
                console.log("[MENU] Sending image menu...");
                await sock.sendMessage(chatJid, {
                    image: mainImageBuffer,
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
                console.log("[MENU] Image menu sent!");
            }

            // 6. Send Audio
            console.log("[MENU] Sending audio...");
            await sock.sendMessage(chatJid, {
                audio: { url: "https://files.catbox.moe/if8sv8.mp3" },
                mimetype: "audio/mpeg",
                ptt: false
            }, { quoted: officialContext });
            console.log("[MENU] Audio sent!");

        } catch (error) {
            console.error("Error sending menu:", error);
            await reply(menuText);
        }
    }
});

registerCommand({
    name: "ping",
    description: "Check bot latency",
    category: "core",
    execute: async ({ reply }) => {
        const start = Date.now();
        await reply("Pinging...");
        const end = Date.now();
        await reply("Pong! " + (end - start) + "ms");
    }
});

registerCommand({
    name: "runtime",
    aliases: ["uptime"],
    description: "Check bot runtime",
    category: "core",
    execute: async ({ reply }) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        await reply("Bot Runtime: " + days + "d " + hours + "h " + minutes + "m " + seconds + "s");
    }
});

registerCommand({
    name: "alive",
    description: "Check if bot is alive",
    category: "core",
    execute: async ({ reply }) => {
        await reply("🤖 *CORTANA MD is alive!*\n\n✨ Gen II Edition\n👨‍💻 Developed by eduqariz");
    }
});

registerCommand({
    name: "creator",
    aliases: ["dev", "owner", "developer"],
    description: "Show bot creator info",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`🌟 *CORTANA MD CREATOR* 🌟

👨‍💻 *Developer:* Èdûqarîz
📱 *WhatsApp:* +254113374182
📞 *Contact:* wa.me/254113374182

💬 *Telegram:* t.me/eduqariz
🤖 *Login Bot:* t.me/Cortana_universal_logins_bot

🌐 *Website:* cortana.world.briantechspace.co.ke

☕ Wanna buy him tea? Don't hesitate!

💖 _Made with love by eduqariz_ 💖`);
    }
});

registerCommand({
    name: "repo",
    aliases: ["source", "github", "link"],
    description: "Show bot links and info",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`🔗 *CORTANA MD LINKS* 🔗

🌐 *Bot Website:*
https://cortana.world.briantechspace.co.ke

🤖 *Telegram Login Bot:*
https://t.me/Cortana_universal_logins_bot

💬 *Developer Telegram:*
https://t.me/eduqariz

📱 *Developer WhatsApp:*
https://wa.me/254113374182

━━━━━━━━━━━━━━━━━━━━
🦄 *CORTANA MD* - Gen II Edition
💖 Powered by Èdûqarîz
━━━━━━━━━━━━━━━━━━━━`);
    }
});
