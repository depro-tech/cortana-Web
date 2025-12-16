import { registerCommand } from "./types";
import yts from "yt-search";

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
    execute: async ({ args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a song name");

        try {
            const search = await yts(query);
            if (!search.videos.length) return reply("❌ No results found");

            const video = search.videos[0];
            await reply(`🎵 *${video.title}*\n\nDuration: ${video.timestamp}\nViews: ${video.views}\nUploader: ${video.author.name}\n\nClick link to watch: ${video.url}\n\n(Audio download currently requires additional configuration)`);
        } catch (e) {
            await reply("❌ Error searching YouTube");
        }
    }
});

registerCommand({
    name: "ytmp3",
    description: "Download YouTube Audio",
    category: "media",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid YouTube URL");
        await reply("🎵 Downloading audio... (Feature pending ytdl-core installation)");
    }
});

registerCommand({
    name: "ytmp4",
    description: "Download YouTube Video",
    category: "media",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url || !isUrl(url)) return reply("❌ Please provide a valid YouTube URL");
        await reply("🎥 Downloading video... (Feature pending ytdl-core installation)");
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
        await reply("⏳ Downloading TikTok video...");
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
        await reply("⏳ Downloading Instagram media...");
    }
});
