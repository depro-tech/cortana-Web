import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

// New YT API endpoint
const YTAPI_BASE = "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/ytapi";
const YTAPI_KEY = "free"; // API key

// YouTube MP3 downloader - NEW API
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

            // Use new ytapi with fo=1 for audio, qu=1 for best quality
            const apiUrl = `${YTAPI_BASE}?apiKey=${YTAPI_KEY}&url=${encodeURIComponent(url)}&fo=1&qu=1`;

            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (response.data && response.data.downloadUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: response.data.downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${response.data.title || 'audio'}.mp3`
                }, { quoted: msg });
                return;
            }

            // Fallback to old APIs
            const fallbackApis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`
            ];

            for (const fallbackUrl of fallbackApis) {
                try {
                    const res = await axios.get(fallbackUrl, { timeout: 30000 });
                    const audioUrl = res.data?.result?.downloadUrl || res.data?.downloadUrl || res.data?.url;
                    if (audioUrl) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg"
                        }, { quoted: msg });
                        return;
                    }
                } catch (e) {
                    console.error('[YTMP3] Fallback failed:', e);
                }
            }

            return reply("❌ Failed to download audio. Try again later.");

        } catch (error: any) {
            console.error('[YTMP3] Error:', error);
            return reply("❌ Download failed.");
        }
    }
});


// YouTube MP4 downloader - NEW API
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

            // Use new ytapi with fo=2 for video, qu=2 for 720p quality
            const apiUrl = `${YTAPI_BASE}?apiKey=${YTAPI_KEY}&url=${encodeURIComponent(url)}&fo=2&qu=2`;

            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (response.data && response.data.downloadUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: response.data.downloadUrl },
                    caption: `📹 *${response.data.title || 'YouTube Video'}*\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                }, { quoted: msg });
                return;
            }

            // Fallback to old API
            const fallbackRes = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${url}`, {
                timeout: 30000
            });

            if (fallbackRes.data?.result?.downloadUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: fallbackRes.data.result.downloadUrl },
                    caption: `📹 *YouTube Video*\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                }, { quoted: msg });
                return;
            }

            return reply("❌ Failed to download video.");

        } catch (error: any) {
            console.error('[YTMP4] Error:', error);
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
