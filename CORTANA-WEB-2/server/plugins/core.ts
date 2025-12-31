import { registerCommand } from "./types";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

// Menu images - rotate sequentially
const MENU_IMAGES = [
    "https://files.catbox.moe/y0yjzu.jpg",
    "https://files.catbox.moe/2ob13q.jpg",
    "https://files.catbox.moe/zn4l18.jpg"
];
let menuImageIndex = 0;

// Load menu template from file
function getMenuTemplate(): string {
    // Try multiple paths: production (dist/menu.txt) and development (server/menu.txt)
    const possiblePaths = [
        path.join(__dirname, "menu.txt"),           // Production: dist/menu.txt
        path.join(__dirname, "..", "menu.txt"),     // Dev: server/plugins/../menu.txt = server/menu.txt
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

    console.error("[MENU] Failed to load menu.txt from any location:", possiblePaths);
    return "CORTANA MD MENU\n\nMenu file not found. Contact creator.";
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

        // Get menu from file and replace placeholders
        let menuText = getMenuTemplate();
        menuText = menuText.replace("{{UPTIME}}", uptimeString);
        menuText = menuText.replace("{{GREETING}}", greetingFull);

        try {
            const randomImage = MENU_IMAGES[menuImageIndex % MENU_IMAGES.length];
            menuImageIndex++;

            await sock.sendMessage(chatJid, {
                image: { url: randomImage },
                caption: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363309657579178@newsletter",
                        newsletterName: "CORTANA x EDU-MD",
                        serverMessageId: 1
                    }
                }
            }, { quoted: msg });

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
        await reply("CORTANA MD is alive!\n\nGen II Edition\nDeveloped by eduqariz");
    }
});

registerCommand({
    name: "creator",
    aliases: ["dev", "owner", "developer"],
    description: "Show bot creator info",
    category: "core",
    execute: async ({ reply }) => {
        await reply("CORTANA MD CREATOR\n\nHere is my beloved creator:\n+254113374182\n\nWanna message him? Don't hesitate!\nBuy him tea also!\n\nwa.me/254113374182\n\nMade with love by eduqariz");
    }
});
