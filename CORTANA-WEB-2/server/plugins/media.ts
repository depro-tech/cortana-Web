import { registerCommand } from "./types";
import yts from "yt-search";
import axios from "axios";

const isUrl = (url: string) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
};

registerCommand({
    name: "yts",
    aliases: ["ytsearch"],
    description: "Search YouTube",
    category: "media",
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a search query");

        try {
            const search = await yts(query);
            let text = `🔍 *YouTube Search Results*\n\n`;
            search.videos.slice(0, 5).forEach((video, i) => {
                text += `${i + 1}. ${video.title}\nDuration: ${video.timestamp}\nURL: ${video.url}\n\n`;
            });
            await reply(text);
        } catch (e) {
            await reply("❌ Error searching YouTube");
        }
    }
});

registerCommand({
    name: "play",
    aliases: ["song"],
    description: "Play/Download from YouTube",
    category: "media",
    execute: async ({ args, reply, sock, senderJid, msg }) => {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a song name");

        try {
            await reply("🔎 Searching...");
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ No results found");

            const video = search.videos[0];
            const url = video.url;

            await sock.sendMessage(senderJid, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n\n📅 Date: ${video.ago}\n🎬 Channel: ${video.author.name}\n⏱️ Duration: ${video.timestamp}\n👀 Views: ${video.views}\n\n⬇️ *Downloading audio...*`
            }, { quoted: msg });

            // Try multiple APIs with fallback
            const apis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${url}`
            ];

            let downloadUrl = null;
            let lastError = null;

            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 10000 });

                    // Try different response formats
                    if (response.data?.success && response.data?.result?.download_url) {
                        downloadUrl = response.data.result.download_url;
                        break;
                    } else if (response.data?.url) {
                        downloadUrl = response.data.url;
                        break;
                    } else if (response.data?.download) {
                        downloadUrl = response.data.download;
                        break;
                    }
                } catch (e) {
                    lastError = e;
                    continue; // Try next API
                }
            }

            if (downloadUrl) {
                await sock.sendMessage(senderJid, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${video.title}.mp3`
                }, { quoted: msg });
            } else {
                throw new Error(lastError?.message || "All download APIs failed");
            }

        } catch (e: any) {
            console.error("Play Error:", e);
            await reply(`❌ Error processing request: ${e.message} (Try again later)`);
        }
    }
});

registerCommand({
    name: "ytmp3",
    description: "Download YouTube Audio",
    category: "media",
    execute: async ({ args, reply, sock, senderJid, msg }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid YouTube URL");

        try {
            await reply("⬇️ *Downloading audio...*");
            const apis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${url}`
            ];

            let downloadUrl = null;
            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 10000 });
                    if (response.data?.success && response.data?.result?.download_url) {
                        downloadUrl = response.data.result.download_url;
                        break;
                    } else if (response.data?.url) {
                        downloadUrl = response.data.url;
                        break;
                    } else if (response.data?.download) {
                        downloadUrl = response.data.download;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (downloadUrl) {
                await sock.sendMessage(senderJid, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `audio.mp3`
                }, { quoted: msg });
            } else {
                throw new Error("All APIs failed");
            }
        } catch (e: any) {
            await reply(`❌ Error: ${e.message}`);
        }
    }
});

registerCommand({
    name: "ytmp4",
    description: "Download YouTube Video",
    category: "media",
    execute: async ({ args, reply, sock, senderJid, msg }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid YouTube URL");

        try {
            await reply("⬇️ *Downloading video...*");
            const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp4?url=${url}`;
            const response = await axios.get(apiUrl);

            if (response.data && response.data.success && response.data.result.download_url) {
                await sock.sendMessage(senderJid, {
                    video: { url: response.data.result.download_url },
                    caption: `🎬 Video Downloaded`,
                    mimetype: 'video/mp4'
                }, { quoted: msg });
            } else {
                throw new Error("API returned no URL");
            }
        } catch (e: any) {
            await reply(`❌ Error: ${e.message}`);
        }
    }
});

registerCommand({
    name: "tiktok",
    aliases: ["tt"],
    description: "Download TikTok video",
    category: "media",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid TikTok URL");
        await reply("⏳ TikTok download currently unavailable.");
    }
});

registerCommand({
    name: "ig",
    aliases: ["instagram"],
    description: "Download Instagram media",
    category: "media",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid Instagram URL");
        await reply("⏳ Instagram download currently unavailable.");
    }
});
