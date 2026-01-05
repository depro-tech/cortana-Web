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
    execute: async ({ sock, msg, reply, sessionId }) => {
        const chatJid = msg.key.remoteJid!;
        console.log("[MENU] Menu command triggered for chat:", chatJid);

        // React to menu command
        try {
            await sock.sendMessage(chatJid, {
                react: { text: "💃", key: msg.key }
            });
        } catch (e) {
            console.error("[MENU] React failed:", e);
        }

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
            console.log("[MENU] Intro animation complete");
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

        // Get menu from file and replace placeholders
        let menuText = getMenuTemplate();
        menuText = menuText.replace(/\{\{UPTIME\}\}/g, uptimeString);
        menuText = menuText.replace(/\{\{GREETING\}\}/g, greetingFull);
        menuText = menuText.replace(/\{\{PREFIX\}\}/g, ".");
        menuText = menuText.replace(/\{\{MODE\}\}/g, "PUBLIC");

        console.log("[MENU] Menu text prepared, length:", menuText.length);

        // ═══════════════════════════════════════════════════════════
        // MENU SEND WITH VERIFIED BADGE + AUDIO
        // ═══════════════════════════════════════════════════════════
        try {
            console.log("[MENU] Attempting to send menu...");

            // Get current image URL
            const currentImage = MENU_IMAGES[menuImageIndex % MENU_IMAGES.length];
            menuImageIndex++;

            // Fetch thumbnail for verified badge (with timeout, non-blocking)
            let thumbBuffer: any = null;
            try {
                const thumbResponse = await axios.get("https://files.catbox.moe/1fm1gw.png", {
                    responseType: 'arraybuffer',
                    timeout: 3000
                });
                thumbBuffer = thumbResponse.data;
                console.log("[MENU] Thumbnail loaded");
            } catch (e) {
                console.log("[MENU] Thumbnail skipped (timeout or error)");
            }

            // Define the fake verified context
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

            // Send menu with verified badge
            await sock.sendMessage(chatJid, {
                image: { url: currentImage },
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
            console.log("[MENU] ✅ Menu sent with verified badge!");

            // Send Menu Audio (non-blocking, skip if fails)
            try {
                await sock.sendMessage(chatJid, {
                    audio: { url: "https://files.catbox.moe/if8sv8.mp3" },
                    mimetype: "audio/mpeg",
                    ptt: false
                });
                console.log("[MENU] ✅ Audio sent!");
            } catch (audioErr) {
                console.log("[MENU] Audio skipped (error)");
            }

        } catch (error: any) {
            console.error("[MENU] ❌ Image menu failed:", error.message);

            // Fallback: Try text-only
            try {
                console.log("[MENU] Trying text-only fallback...");
                await sock.sendMessage(chatJid, { text: menuText });
                console.log("[MENU] ✅ Text menu sent!");
            } catch (textError: any) {
                console.error("[MENU] ❌ Text fallback also failed:", textError.message);

                // Last resort: use reply function
                try {
                    await reply(menuText);
                    console.log("[MENU] ✅ Reply fallback sent!");
                } catch (replyError) {
                    console.error("[MENU] ❌❌ ALL METHODS FAILED:", replyError);
                }
            }
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
