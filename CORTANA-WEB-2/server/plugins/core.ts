import { registerCommand } from "./types";

const MENU_VIDEO = "https://files.catbox.moe/hveiqo.mp4";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        const menuText = `╭━━━━『 *CORTANA MD* 』━━━━╮
│  🎄 *CHRISTMAS EDITION* 🎄
╰━━━━━━━━━━━━━━━━━━━━╯

┏━━━ *OWNER MENU* ━━━┓
┃ • block | unblock
┃ • public | self
┃ • broadcast | setbio
┃ • restart | shutdown
┗━━━━━━━━━━━━━━━━━━┛

┏━━━ *GROUP MANAGE* ━━━┓
┃ • add | kick | promote
┃ • open | close | link
┃ • tagall | hidetag
┃ • setppgc | delete
┗━━━━━━━━━━━━━━━━━━┛

┏━━━ *AI & CHATBOTS* ━━━┓
┃ • gpt | gemini | llama
┃ • joke | advice
┃ • quote | fact | trivia
┗━━━━━━━━━━━━━━━━━━┛

┏━━━ *MEDIA & DOWNLOAD* ━━━┓
┃ • play | ytmp3 | ytmp4
┃ • tiktok | ig | twitter
┃ • sticker | toimg
┗━━━━━━━━━━━━━━━━━━┛

┏━━━ *SECURITY* ━━━┓
┃ • antilink (kick/warn)
┃ • antigroupmention (kick/warn)
┃ • antidelete | antiviewonce
┗━━━━━━━━━━━━━━━━━━┛

┏━━━ *SYSTEM* ━━━┓
┃ • ping | alive | speed
┃ • runtime | owner
┗━━━━━━━━━━━━━━━━━━┛

       🎄 *Èdûqarîz 2025* 🎄`;

        try {
            // Send video with menu
            await sock.sendMessage(senderJid, {
                video: { url: MENU_VIDEO },
                caption: menuText,
                gifPlayback: true
            });

            // Send audio as a playable document
            await sock.sendMessage(senderJid, {
                audio: { url: "https://files.catbox.moe/5s85cc.mp3" },
                mimetype: 'audio/mpeg',
                fileName: 'menu_audio.mp3',
                ptt: false
            });
        } catch (error) {
            console.error("Failed to send menu image/audio:", error);
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
        await reply("🏓 Pinging...");
        const end = Date.now();
        await reply(`🏓 Pong! ${end - start}ms`);
    }
});

registerCommand({
    name: "alive",
    aliases: ["uptime", "runtime"],
    description: "Check bot runtime",
    category: "core",
    execute: async ({ reply }) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await reply(`🎄 *CORTANA MD X-MASS ED.*\n\n✅ Bot is alive!\n⏱️ Runtime: ${hours}h ${minutes}m ${seconds}s\n⚡ Speed: Fast\n🌐 Status: Online`);
    }
});

registerCommand({
    name: "owner",
    description: "Get owner contact",
    category: "core",
    execute: async ({ reply }) => {
        await reply("👑 *Bot Owner*\n\n📞 Number: Not set\n🤖 Bot: CORTANA MD");
    }
});
