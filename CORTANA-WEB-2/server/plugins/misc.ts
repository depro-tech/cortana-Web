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
        const axios = require('axios');

        try {
            await sock.sendMessage(jid, { react: { text: "📰", key: msg.key } }).catch(() => { });
            await reply("📰 *Fetching tech news...*");

            let newsData: { thumbnail?: string; news?: string; title?: string; description?: string } | null = null;

            // Try multiple news APIs
            const newsApis = [
                // API 1: Fantox Tech News
                async () => {
                    const res = await axios.get('https://fantox001-scrappy-api.vercel.app/technews/random', { timeout: 15000 });
                    if (res.data?.news) {
                        return { news: res.data.news, thumbnail: res.data.thumbnail };
                    }
                    throw new Error('No data');
                },

                // API 2: HackerNews (top stories)
                async () => {
                    const idsRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', { timeout: 10000 });
                    const randomId = idsRes.data[Math.floor(Math.random() * 20)]; // Top 20
                    const storyRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${randomId}.json`, { timeout: 10000 });
                    if (storyRes.data?.title) {
                        return {
                            news: `*${storyRes.data.title}*\n\n${storyRes.data.url || ''}\n\n👍 ${storyRes.data.score || 0} points | 💬 ${storyRes.data.descendants || 0} comments`,
                            thumbnail: null
                        };
                    }
                    throw new Error('No data');
                },

                // API 3: Random tech fact fallback
                async () => {
                    const facts = [
                        "💡 The first computer virus was created in 1983 and was called 'Elk Cloner'.",
                        "💡 Google processes over 8.5 billion searches per day.",
                        "💡 The first smartphone was IBM's Simon, released in 1994.",
                        "💡 Over 6 million new blog posts are published every day.",
                        "💡 Email was invented before the World Wide Web.",
                        "💡 The average person spends 7 hours per day on the internet.",
                        "💡 Amazon started as an online bookstore in 1994.",
                        "💡 The first YouTube video was uploaded on April 23, 2005.",
                        "💡 WhatsApp handles over 100 billion messages daily.",
                        "💡 Tesla's Autopilot has driven over 5 billion miles."
                    ];
                    return {
                        news: facts[Math.floor(Math.random() * facts.length)],
                        thumbnail: null
                    };
                }
            ];

            // Try each API until one works
            for (const api of newsApis) {
                try {
                    newsData = await api();
                    if (newsData?.news) break;
                } catch (e) {
                    continue;
                }
            }

            if (!newsData || !newsData.news) {
                return reply("❌ Failed to fetch tech news. Try again later.");
            }

            // Send the news
            if (newsData.thumbnail) {
                await sock.sendMessage(jid, {
                    image: { url: newsData.thumbnail },
                    caption: `📰 *CORTANA TECH NEWS*\n\n${newsData.news}`
                }, { quoted: msg });
            } else {
                await reply(`📰 *CORTANA TECH NEWS*\n\n${newsData.news}`);
            }

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

        } catch (error: any) {
            console.error('[TECHNEWS] Error:', error);
            await reply("❌ Failed to fetch tech news. Try again later.");
        }
    }
});
