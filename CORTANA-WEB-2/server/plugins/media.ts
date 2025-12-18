import { registerCommand } from "./types";
import axios from "axios";

registerCommand({
    name: "video",
    description: "Download video",
    category: "media",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ");
        if (!query) return reply("Please provide video name or link");

        try {
            await reply(`🔍 Searching/Downloading video: ${query}...`);
            // API Provided by user
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(query)}`;

            const res = await axios.get(apiUrl);
            const data = res.data;

            if (data && (data.url || data.video)) {
                const videoUrl = data.url || data.video;
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: videoUrl },
                    caption: `🎥 *Video Downloaded*\n\nTitle: ${data.title || 'Video'}\n\n*POWERED BY CORTANA MD*`
                });
            } else {
                await reply("❌ Failed to fetch video. Please try a valid YouTube link.");
            }
        } catch (e) {
            console.error(e);
            await reply("❌ Error fetching video.");
        }
    }
});
