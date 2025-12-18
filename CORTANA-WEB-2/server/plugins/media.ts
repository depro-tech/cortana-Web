import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

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
                const title = data.title || 'Video';

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: videoUrl },
                    caption: `CORTANA MD
╭═════════════════⊷
║ 🎥 *Title:* ${title}
║ 🔗 *Source:* YouTube
╰═════════════════⊷
*Powered by CORTANA MD*`
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

registerCommand({
    name: "play",
    aliases: ["song"],
    description: "Download song",
    category: "media",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ");
        if (!query) return reply("Please provide song name or link");

        try {
            await reply(`🔍 Searching song: ${query}...`);

            // 1. Search with yt-search
            const search = await yts(query);
            if (!search.videos.length) {
                return reply("❌ No results found. Please refine your search.");
            }
            const video = search.videos[0];
            const url = video.url;

            // 2. Download using Multi-API Fallback (Robust)
            const apis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${url}`,
                `https://apis-keith.vercel.app/download/dlmp3?url=${url}` // Keep Keith as backup
            ];

            let audioUrl = null;
            let songData = null;

            for (const api of apis) {
                try {
                    const { data } = await axios.get(api);
                    const result = data.result || data;
                    if (data.status === 200 || data.success || result.downloadUrl) {
                        audioUrl = result.downloadUrl || data.url;
                        songData = {
                            title: result.title || video.title,
                            artist: result.author || video.author?.name || 'Unknown Artist',
                            thumbnail: result.image || result.thumbnail || video.thumbnail
                        };
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (audioUrl && songData) {
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mp4',
                    ptt: false,
                    contextInfo: {
                        externalAdReply: {
                            title: songData.title,
                            body: "CORTANA MD MUSIC",
                            thumbnailUrl: songData.thumbnail,
                            sourceUrl: url,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            } else {
                await reply("❌ Failed to fetch audio from all sources.");
            }

        } catch (e) {
            console.error(e);
            await reply("❌ Error fetching song.");
        }
    }
});

registerCommand({
    name: "ch-jid",
    description: "Get Channel JID from Link",
    category: "tools",
    execute: async ({ args, reply, sock }) => {
        const link = args[0];
        if (!link || !link.includes("whatsapp.com/channel/")) return reply("Please provide a valid WhatsApp channel link (e.g. https://whatsapp.com/channel/...)");

        try {
            // Extract code
            const code = link.split("/channel/")[1]?.split("/")[0];
            if (!code) return reply("Invalid link format");

            // Attempt to fetch metadata
            try {
                // @ts-ignore - newsletterMetadata might not be in all baileys types definitions yet
                const metadata = await sock.newsletterMetadata("invite", code);

                if (metadata && metadata.id) {
                    await reply(`📢 *Channel JID Found*\n\nName: ${metadata.name}\nJID: \`\`\`${metadata.id}\`\`\`\nSubscribers: ${metadata.subscribers}`);
                } else {
                    await reply("❌ Could not resolve JID. Ensure the link is valid and public.");
                }
            } catch (err: any) {
                console.error(err);
                await reply(`❌ Error resolving: ${err.message || 'Unknown error'}`);
            }
        } catch (e) {
            await reply("❌ Error processing link.");
        }
    }
});
