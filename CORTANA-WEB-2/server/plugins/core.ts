import { registerCommand } from "./types";

const MENU_VIDEO = "https://files.catbox.moe/hveiqo.mp4";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        const menuText = `
🌺 C H R I S T M A S   E D I T I O N 🌺
          *CORTANA MD*

🌸 *OWNER MENU*
.block | .unblock | .dev | .self | .public
.bc | .setbio | .settings | .addprem
.delprem | .addowner | .delowner
.shell | .eval | .restart | .shutdown
.backup | .restore | .setpp | .setname

🌹 *GROUP MANAGE*
.add | .kick | .promote | .demote
.open | .close | .link | .resetlink
.tagall | .hidetag | .totag | .invite
.setname | .setdesc | .setppgc
.revoke | .leave | .groupinfo

🌼 *AI & CHATBOTS*
.gpt | .gemini | .llama | .deepseek
.imagine | .dalle | .midjourney
.joke | .advice | .quote | .fact

🌻 *MEDIA & DOWN*
.play | .song | .video | .ytmp3 | .ytmp4
.tiktok | .ig | .twitter | .fb | .pin
.sticker | .exif | .tourl | .toimg

✨ *EFFECTS & FUN*
.blur | .jail | .wasted | .triggered
.simp | .horny | .lol | .gay | .stupid
.couple | .match | .soulmate

🛡️ *SECURITY*
.antilink (kick/warn)
.antigroupmention (kick/warn)
.antidelete | .antiviewonce

🎮 *GAMES*
.ttt | .math | .quiz | .guess | .casino

📱 *SYSTEM*
.ping | .alive | .speed | .owner
.runtime | .rules | .changelog

        🎄 Èdûqarîz 2025 🎄`;

        try {
            await sock.sendMessage(senderJid, {
                video: { url: MENU_VIDEO },
                caption: menuText,
                gifPlayback: true
            });
            // Send audio after menu
            await sock.sendMessage(senderJid, {
                audio: { url: "https://files.catbox.moe/5s85cc.mp3" },
                mimetype: 'audio/mpeg',
                ptt: false // Send as regular audio file
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
