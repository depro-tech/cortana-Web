import { registerCommand } from "./types";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        // We can keep the simpler text menu for now or re-implement the image one
        await reply("🤖 *CORTANA BOT MENU* 🤖\n\nType .mpesa to test payment!\nType .alive to check status.");
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
