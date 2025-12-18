import { registerCommand } from "./types";

const MENU_IMAGE = "https://files.catbox.moe/69h2r0.jpg";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        // ═══════ TYPING INTRO ANIMATION ═══════
        const introText = "CORTANA IS HERE";
        let displayText = "";

        try {
            // Send initial empty message
            const sentMsg = await sock.sendMessage(senderJid, { text: "𝗖" });
            const introKey = sentMsg.key;

            // Typing animation - update message character by character
            for (let i = 0; i < introText.length; i++) {
                displayText += introText[i];

                // Update the message with growing text
                await sock.sendMessage(senderJid, {
                    text: `*${displayText}*`,
                    edit: introKey
                });

                // Delay between characters (90ms)
                await new Promise(resolve => setTimeout(resolve, 90));
            }

            // Display complete text for 1 second (keep it visible)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Don't delete - let it stay as intro
            // Small delay before showing menu
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (e) {
            console.error('[MENU] Intro animation error:', e);
            // Continue to menu even if intro fails
        }
        // ═══════ END INTRO ANIMATION ═══════

        const menuText = `🌺❀──────────────────────────────❀🌺
           C̷O̷R̷T̷A̷N̷A̷ ̷M̷D̷ 
         C H R I S T M A S  E D.
🌺❀──────────────────────────────❀🌺


🌸🌼 O W N E R   M E N U 🌼🌸
⮞ .block
⮞ .unblock
⮞ .dev
⮞ .self
⮞ .public
⮞ .bc
⮞ .setbio
⮞ .settings


🌸🌼 AUTO-PRESENCE 🌼🌸
⮞ .autorecording-all-on
⮞ .autorecording-pm-on
⮞ .autorecording-off
⮞ .autotyping-all-on
⮞ .autotyping-pm-on
⮞ .autotyping-off
⮞ .autorecordtyping-on
⮞ .autorecordtyping-off
⮞ .presence-status


🌸🌼 G R O U P   M E N U 🌼🌸
⮞ .antilink <on/off>
⮞ .promote
⮞ .demote
⮞ .kick
⮞ .add
⮞ .tagall
⮞ .hidetag
⮞ .group <open/close>
⮞ .gcname <text>
⮞ .gcdesc <text>
⮞ .join <link>
⮞ .left


🌸🌼 SEARCH & INFO 🌼🌸
⮞ .google <query>
⮞ .wiki <query>
⮞ .lyrics <song name>
⮞ .movie <movie name>
⮞ .weather <city>
⮞ .npm <package>
⮞ .define <word>
⮞ .github <username>


🌸🌼 MEDIA & DOWNLOAD 🌼🌸
⮞ .play <song name>
⮞ .video <video name>
⮞ .ytmp3 <youtube url>
⮞ .ytmp4 <youtube url>
⮞ .yts <query>
⮞ .tiktok <url>
⮞ .ig <instagram url>
⮞ .fb <facebook url>
⮞ .twitter <twitter url>
⮞ .spotify <spotify url>


🌸🌼 AI CHATBOT 🌼🌸
⮞ .chatbot on
⮞ .chatbot off


🌸🌼 FUN 🌼🌸
⮞ .joke
⮞ .meme
⮞ .quote
⮞ .fact
⮞ .roast
⮞ .truth
⮞ .dare
⮞ .math


🌸🌼 UTILITIES 🌼🌸
⮞ .calc <expression>
⮞ .translate <lang> <text>
⮞ .sticker (reply to image)
⮞ .toimg (reply to sticker)


🔊 CORTANA MD • Christmas Edition
💝 Developed by èdûqarîz
🎅 Merry Christmas! 🎄`;

        try {
            // Send menu as forwarded message from verified channel
            await sock.sendMessage(senderJid, {
                image: { url: MENU_IMAGE },
                caption: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363220704101715@newsletter",
                        newsletterName: "CORTANA x EDU-MD",
                        serverMessageId: 1
                    }
                }
            });
        } catch (error) {
            console.error('Error sending menu:', error);
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
        await reply(`🏓 Pong! ${end - start}ms`);
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

        await reply(`⏱️ *Bot Runtime*\n\n${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
});

registerCommand({
    name: "alive",
    description: "Check if bot is alive",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`✅ *CORTANA MD is alive!*\n\n🎄 Christmas Edition\n💝 Developed by èdûqarîz`);
    }
});
