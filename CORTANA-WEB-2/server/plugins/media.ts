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

            // First search for the video
            let videoUrl = query;
            let title = 'Video';
            let thumbnail = '';

            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                const search = await yts(query);
                if (!search.videos.length) {
                    return reply("❌ No results found.");
                }
                const video = search.videos[0];
                videoUrl = video.url;
                title = video.title;
                thumbnail = video.thumbnail;
            }

            // Multi-API fallback for video download
            const apis = [
                { url: `https://apis.davidcyriltech.my.id/download/ytmp4?url=${videoUrl}`, type: 'davidcyril' },
                { url: `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${videoUrl}`, type: 'ryzendesu' },
                { url: `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`, type: 'hectormanuel' }
            ];

            let downloadUrl = null;

            for (const api of apis) {
                try {
                    const { data } = await axios.get(api.url, { timeout: 15000 });
                    console.log(`[VIDEO] Trying ${api.type}:`, JSON.stringify(data).substring(0, 200));

                    // Handle different response formats
                    if (data.status === 200 || data.success) {
                        const result = data.result || data;
                        downloadUrl = result.downloadUrl || result.url || result.video;
                        if (result.title) title = result.title;
                    } else if (data.url || data.video) {
                        downloadUrl = data.url || data.video;
                        if (data.title) title = data.title;
                    }

                    if (downloadUrl) break;
                } catch (e) {
                    console.log(`[VIDEO] ${api.type} failed:`, e);
                    continue;
                }
            }

            if (downloadUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: downloadUrl },
                    caption: `CORTANA MD
╭═════════════════⊷
║ 🎥 *Title:* ${title}
║ 🔗 *Source:* YouTube
╰═════════════════⊷
*Powered by CORTANA MD*`
                });
            } else {
                await reply("❌ Failed to fetch video from all sources. Try again later.");
            }
        } catch (e) {
            console.error('[VIDEO ERROR]', e);
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

            // 2. Multi-API Fallback for audio download
            const apis = [
                { url: `https://apis.davidcyriltech.my.id/download/ytmp3?url=${url}`, type: 'davidcyril' },
                { url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`, type: 'ryzendesu' },
                { url: `https://api.akuari.my.id/downloader/youtubeaudio?link=${url}`, type: 'akuari' },
                { url: `https://apis-keith.vercel.app/download/dlmp3?url=${url}`, type: 'keith' }
            ];

            let audioUrl = null;
            let songData = {
                title: video.title,
                artist: video.author?.name || 'Unknown Artist',
                thumbnail: video.thumbnail
            };

            for (const api of apis) {
                try {
                    const { data } = await axios.get(api.url, { timeout: 15000 });
                    console.log(`[PLAY] Trying ${api.type}:`, JSON.stringify(data).substring(0, 200));

                    // Handle different response formats from various APIs
                    if (api.type === 'davidcyril') {
                        if (data.status === 200 && data.result?.downloadUrl) {
                            audioUrl = data.result.downloadUrl;
                            if (data.result.title) songData.title = data.result.title;
                            if (data.result.author) songData.artist = data.result.author;
                            break;
                        }
                    } else if (api.type === 'ryzendesu') {
                        if (data.status === 200 && data.url) {
                            audioUrl = data.url;
                            if (data.title) songData.title = data.title;
                            break;
                        }
                    } else if (api.type === 'akuari') {
                        if (data.success && data.result?.download) {
                            audioUrl = data.result.download;
                            if (data.result.title) songData.title = data.result.title;
                            break;
                        }
                        // Alternative format
                        if (data.url || data.downloadUrl) {
                            audioUrl = data.url || data.downloadUrl;
                            break;
                        }
                    } else if (api.type === 'keith') {
                        if (data.response?.downloadUrl) {
                            audioUrl = data.response.downloadUrl;
                            if (data.response.title) songData.title = data.response.title;
                            break;
                        }
                        // Alternative format
                        if (data.url || data.result?.url) {
                            audioUrl = data.url || data.result?.url;
                            break;
                        }
                    }

                    // Generic fallback check
                    if (!audioUrl) {
                        const result = data.result || data.response || data;
                        const possibleUrl = result.downloadUrl || result.url || result.download || result.audio;
                        if (possibleUrl && typeof possibleUrl === 'string') {
                            audioUrl = possibleUrl;
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`[PLAY] ${api.type} failed:`, e);
                    continue;
                }
            }

            if (audioUrl) {
                console.log(`[PLAY] Sending audio from: ${audioUrl}`);
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
                await reply("❌ Failed to fetch audio from all sources. Please try again.");
            }

        } catch (e) {
            console.error('[PLAY ERROR]', e);
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
