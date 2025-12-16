import { registerCommand } from "./types";
import yts from "yt-search";
import ytdl from "@distube/ytdl-core";

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

            const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

            await sock.sendMessage(senderJid, {
                audio: { stream: stream },
                mimetype: 'audio/mp4',
                fileName: `${video.title}.mp3`
            }, { quoted: msg });

        } catch (e: any) {
            console.error("Play Error:", e);
            await reply(`❌ Error processing request: ${e.message}`);
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
            const info = await ytdl.getInfo(url);
            const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

            await sock.sendMessage(senderJid, {
                audio: { stream: stream },
                mimetype: 'audio/mp4',
                fileName: `${info.videoDetails.title}.mp3`
            }, { quoted: msg });
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
            const info = await ytdl.getInfo(url);
            const stream = ytdl(url, { filter: 'videoandaudio', quality: 'highest' }); // or lowestvideo if size issues

            await sock.sendMessage(senderJid, {
                video: { stream: stream },
                caption: `🎬 ${info.videoDetails.title}`,
                mimetype: 'video/mp4'
            }, { quoted: msg });
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
        // Placeholder until tiktok scrappers are added
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid TikTok URL");
        await reply("⏳ TikTok download currently unavailable (API limitation).");
    }
});

registerCommand({
    name: "ig",
    aliases: ["instagram"],
    description: "Download Instagram media",
    category: "media",
    execute: async ({ args, reply }) => {
        const url = args[0];
        // Placeholder
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid Instagram URL");
        await reply("⏳ Instagram download currently unavailable (API limitation).");
    }
});
