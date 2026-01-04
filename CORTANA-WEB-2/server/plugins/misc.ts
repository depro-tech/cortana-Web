import { registerCommand } from "./types";
import os from "os";

registerCommand({
    name: "poll",
    description: "Create a poll",
    category: "announcement",
    execute: async ({ args, sock, msg }) => {
        const text = args.join(" ");
        if (!text.includes("|")) return sock.sendMessage(msg.key.remoteJid!, { text: "Usage: .poll Question | Option1 | Option2..." });

        const [question, ...options] = text.split("|").map(s => s.trim());
        if (options.length < 2) return sock.sendMessage(msg.key.remoteJid!, { text: "Provide at least 2 options" });

        await sock.sendMessage(msg.key.remoteJid!, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        });
    }
});

registerCommand({
    name: "nightcore",
    description: "Nightcore effect",
    category: "music",
    execute: async ({ reply }) => {
        await reply("🎵 Nightcore effect requires ffmpeg processing (Coming soon)");
    }
});

registerCommand({
    name: "bass",
    description: "Bass boost effect",
    category: "music",
    execute: async ({ reply }) => {
        await reply("🎵 Bass boost effect requires ffmpeg processing (Coming soon)");
    }
});

registerCommand({
    name: "device",
    aliases: ["sys"],
    description: "System Info",
    category: "device",
    execute: async ({ args, reply }) => {
        if (args.length > 0) {
            // Optional: if custom args handling needed later
        }
        const cpus = os.cpus();
        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

        await reply(`🖥️ *System Info*\n\nOS: ${os.type()} ${os.release()}\nCPU: ${cpus[0].model}\nCores: ${cpus.length}\nRAM: ${freeMem}GB / ${totalMem}GB\nUptime: ${(os.uptime() / 3600).toFixed(2)} hours`);
    }
});

registerCommand({
    name: "wallpaper",
    description: "Get wallpaper",
    category: "media",
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("🙄 wrong 🙅 usage example wallpaper Anime");
        await reply(`🖼️ *Wallpaper*\n\n(Mock) Result for: ${query}`);
    }
});

registerCommand({
    name: "react",
    description: "React to message",
    category: "core",
    execute: async ({ args, reply, sock, msg }) => {
        if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) return reply("🙄 wrong 🙅 usage example react ❤️ (reply to msg)");
        const emoji = args[0];
        if (!emoji) return reply("🙄 wrong 🙅 usage example react ❤️");

        await sock.sendMessage(msg.key.remoteJid!, {
            react: {
                text: emoji,
                key: {
                    remoteJid: msg.key.remoteJid,
                    id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: msg.message.extendedTextMessage.contextInfo.participant
                }
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// TECHNEWS COMMAND - Random tech news with image
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "technews",
    aliases: ["tech", "tnews"],
    description: "Get random tech news",
    category: "news",
    usage: ".technews",
    execute: async ({ reply, sock, msg }) => {
        const jid = msg.key.remoteJid!;

        try {
            await sock.sendMessage(jid, { react: { text: "📰", key: msg.key } }).catch(() => { });

            const response = await fetch('https://fantox001-scrappy-api.vercel.app/technews/random');
            const data = await response.json();

            if (!data || !data.news) {
                return reply("❌ Failed to fetch tech news. Try again later.");
            }

            const { thumbnail, news } = data;

            if (thumbnail) {
                await sock.sendMessage(jid, {
                    image: { url: thumbnail },
                    caption: `📰 *TECH NEWS*\n\n${news}`
                }, { quoted: msg });
            } else {
                await reply(`📰 *TECH NEWS*\n\n${news}`);
            }

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

        } catch (error: any) {
            console.error('[TECHNEWS] Error:', error);
            await reply("❌ Failed to fetch tech news. Try again later.");
        }
    }
});
