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

            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                const search = await yts(query);
                if (!search.videos.length) {
                    return reply("❌ No results found.");
                }
                const video = search.videos[0];
                videoUrl = video.url;
                title = video.title;
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
        const text = args.join(" ");
        if (!text) return reply("❌ What song do you want to download?");

        try {
            // Send initial processing message
            await reply('🔄 CORTANA MD Fetching your audio... Please wait...');

            // Search YouTube
            const search = await yts(text);
            if (!search.videos.length) {
                return reply('❌ No results found. Please refine your search.');
            }

            const video = search.videos[0];
            const link = video.url;
            const apis = [
                `https://apis.davidcyriltech.my.id/download/ytmp3?url=${link}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${link}`
            ];

            let audioUrl = null;
            let songData = null;

            // Try APIs in sequence
            for (const api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 15000 });

                    if (data.status === 200 || data.success) {
                        audioUrl = data.result?.downloadUrl || data.url;
                        songData = {
                            title: data.result?.title || video.title,
                            artist: data.result?.author || video.author?.name || 'Unknown Artist',
                            thumbnail: data.result?.image || video.thumbnail,
                            videoUrl: link
                        };
                        break;
                    }
                } catch (e: any) {
                    console.error(`API Error (${api}):`, e.message);
                    continue;
                }
            }

            if (!audioUrl || !songData) {
                return reply('⚠ An error occurred. All APIs might be down or unable to process the request.');
            }

            // Send metadata & thumbnail
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: songData.thumbnail },
                caption: `CORTANA MD
╭═════════════════⊷
║ 🎶 Title: ${songData.title}
║ 🎤 Artist: ${songData.artist}
║ 🔗 Source: YouTube
╰═════════════════⊷
*Powered by CORTANA MD*`
            });

            // Send audio file
            await reply('📤 Sending your audio...');
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg"
            });

            // Send document file
            await reply('📤 Sending your MP3 file...');
            await sock.sendMessage(msg.key.remoteJid, {
                document: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${songData.title.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`
            });

            // Send success message
            await reply('✅ CORTANA MD – World-class bot just successfully sent you what you requested! 🎶');

        } catch (error: any) {
            console.error('Music plugin error:', error);
            reply(`❌ Download failed\n${error.message}`);
        }
    }
});
