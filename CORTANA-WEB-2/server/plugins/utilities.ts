import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

// YouTube MP3 downloader
registerCommand({
    name: "ytmp3",
    description: "Download YouTube audio as MP3",
    category: "media",
    usage: ".ytmp3 <youtube url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return reply("❌ Provide a valid YouTube URL!\n\nUsage: .ytmp3 <url>");
        }

        try {
            await reply("⏳ Converting to MP3...");

            // Try multiple APIs
            const apis = [
                {
                    name: 'DavidCyril',
                    url: `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`,
                    parser: (data: any) => data.result?.downloadUrl || data.downloadUrl
                },
                {
                    name: 'Ryzendesu',
                    url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`,
                    parser: (data: any) => data.url || data.downloadUrl
                }
            ];

            for (const api of apis) {
                try {
                    const response = await axios.get(api.url, { timeout: 30000 });
                    const audioUrl = api.parser(response.data);

                    if (audioUrl) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg"
                        });
                        return;
                    }
                } catch (e: any) {
                    console.error(`[YTMP3] ${api.name} failed:`, e.message);
                }
            }

            return reply("❌ Failed to download audio. Try again later.");

        } catch (error: any) {
            return reply("❌ Download failed.");
        }
    }
});

// YouTube MP4 downloader
registerCommand({
    name: "ytmp4",
    description: "Download YouTube video as MP4",
    category: "media",
    usage: ".ytmp4 <youtube url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return reply("❌ Provide a valid YouTube URL!\n\nUsage: .ytmp4 <url>");
        }

        try {
            await reply("⏳ Downloading video...");

            const response = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${url}`, {
                timeout: 30000
            });

            if (response.data && response.data.result && response.data.result.downloadUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: response.data.result.downloadUrl },
                    caption: `📹 *YouTube Video*\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                });
                return;
            }

            return reply("❌ Failed to download video.");

        } catch (error: any) {
            return reply("❌ Download failed.");
        }
    }
});

// YouTube search
registerCommand({
    name: "yts",
    description: "Search YouTube",
    category: "search",
    usage: ".yts <query>",
    execute: async ({ args, reply }) => {
        const query = args.join(" ").trim();

        if (!query) {
            return reply("❌ Provide a search query!\n\nUsage: .yts despacito");
        }

        try {
            const search = await yts(query);

            if (search.videos.length === 0) {
                return reply("❌ No results found.");
            }

            let message = `🔍 *YouTube Search Results for:* ${query}\n\n`;

            search.videos.slice(0, 10).forEach((video: any, index: number) => {
                message += `${index + 1}. *${video.title}*\n`;
                message += `   👤 ${video.author.name}\n`;
                message += `   ⏱️ ${video.timestamp}\n`;
                message += `   👁️ ${video.views} views\n`;
                message += `   🔗 ${video.url}\n\n`;
            });

            await reply(message);

        } catch (error: any) {
            return reply("❌ Search failed.");
        }
    }
});

// Spotify downloader
registerCommand({
    name: "spotify",
    description: "Download Spotify track",
    category: "media",
    usage: ".spotify <spotify url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || !url.includes('spotify')) {
            return reply("❌ Provide a valid Spotify URL!\n\nUsage: .spotify <url>");
        }

        try {
            await reply("⏳ Downloading from Spotify...");

            // Spotify downloader API
            const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/spotify?url=${encodeURIComponent(url)}`, {
                timeout: 30000
            });

            if (response.data && response.data.data && response.data.data.download) {
                const track = response.data.data;

                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: track.download },
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: track.title || "Spotify Track",
                            body: track.artist || "Unknown Artist",
                            thumbnailUrl: track.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                });
                return;
            }

            return reply("❌ Failed to download from Spotify.");

        } catch (error: any) {
            return reply("❌ Download failed. The track might be region-locked.");
        }
    }
});

// Calculator
registerCommand({
    name: "calc",
    aliases: ["calculate"],
    description: "Calculate mathematical expression",
    category: "utility",
    usage: ".calc <expression>",
    execute: async ({ args, reply }) => {
        const expression = args.join(" ").trim();

        if (!expression) {
            return reply("❌ Provide an expression!\n\nUsage: .calc 2 + 2");
        }

        try {
            // Simple safe eval using Function constructor
            const result = Function(`"use strict"; return (${expression})`)();
            await reply(`🧮 *Calculator*\n\nExpression: ${expression}\nResult: ${result}`);
        } catch (error: any) {
            return reply("❌ Invalid expression. Use basic math operators (+, -, *, /, %)");
        }
    }
});

// Translate
registerCommand({
    name: "translate",
    aliases: ["tr"],
    description: "Translate text",
    category: "utility",
    usage: ".translate <lang> <text>",
    execute: async ({ args, reply }) => {
        if (args.length < 2) {
            return reply("❌ Usage: .translate <target_lang> <text>\n\nExample: .translate es Hello World");
        }

        const targetLang = args[0];
        const text = args.slice(1).join(" ");

        try {
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);

            if (response.data && response.data[0] && response.data[0][0]) {
                const translated = response.data[0].map((item: any) => item[0]).join('');
                await reply(`🌐 *Translation*\n\nFrom: Auto-detected\nTo: ${targetLang}\n\n${translated}`);
            } else {
                await reply("❌ Translation failed.");
            }
        } catch (error: any) {
            return reply("❌ Translation failed. Check the language code.");
        }
    }
});
