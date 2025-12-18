import { registerCommand } from "./types";
import axios from "axios";

// TikTok downloader
registerCommand({
    name: "tiktok",
    aliases: ["ttdl", "tt"],
    description: "Download TikTok video",
    category: "media",
    usage: ".tiktok <tiktok url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || !url.includes('tiktok')) {
            return reply("❌ Provide a valid TikTok URL!\n\nUsage: .tiktok <url>");
        }

        try {
            await reply("⏳ Downloading TikTok video...");

            // Try API 1: Tiklydown
            try {
                const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
                    timeout: 30000
                });

                if (response.data && response.data.video && response.data.video.noWatermark) {
                    const videoUrl = response.data.video.noWatermark;
                    const title = response.data.title || "TikTok Video";
                    const author = response.data.author?.nickname || "Unknown";

                    await sock.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `📹 *${title}*\n👤 *Author:* ${author}\n\n> Downloaded by CORTANA MD`,
                        mimetype: 'video/mp4'
                    });
                    return;
                }
            } catch (e: any) {
                console.error('[TIKTOK] Tiklydown failed:', e.message);
            }

            // Try API 2: Ryzendesu
            try {
                const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`, {
                    timeout: 30000
                });

                if (response.data && response.data.data && response.data.data.video) {
                    const videoUrl = response.data.data.video;
                    const title = response.data.data.title || "TikTok Video";

                    await sock.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `📹 *${title}*\n\n> Downloaded by CORTANA MD`,
                        mimetype: 'video/mp4'
                    });
                    return;
                }
            } catch (e: any) {
                console.error('[TIKTOK] Ryzendesu failed:', e.message);
            }

            return reply("❌ Failed to download TikTok video. The URL might be invalid or APIs are down.");

        } catch (error: any) {
            console.error('[TIKTOK] Error:', error);
            return reply("❌ Download failed. Please try again later.");
        }
    }
});

// Instagram downloader
registerCommand({
    name: "ig",
    aliases: ["igdl", "instagram"],
    description: "Download Instagram photo/video",
    category: "media",
    usage: ".ig <instagram url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || !url.includes('instagram')) {
            return reply("❌ Provide a valid Instagram URL!\n\nUsage: .ig <url>");
        }

        try {
            await reply("⏳ Downloading from Instagram...");

            const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`, {
                timeout: 30000
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                const media = response.data.data[0];

                if (media.type === 'video') {
                    await sock.sendMessage(msg.key.remoteJid, {
                        video: { url: media.url },
                        caption: `📹 *Instagram Video*\n\n> Downloaded by CORTANA MD`,
                        mimetype: 'video/mp4'
                    });
                } else {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: media.url },
                        caption: `📷 *Instagram Photo*\n\n> Downloaded by CORTANA MD`
                    });
                }
                return;
            }

            return reply("❌ Failed to download from Instagram. The URL might be invalid.");

        } catch (error: any) {
            console.error('[INSTAGRAM] Error:', error);
            return reply("❌ Download failed. Try again later.");
        }
    }
});

// Facebook downloader
registerCommand({
    name: "fb",
    aliases: ["fbdl", "facebook"],
    description: "Download Facebook video",
    category: "media",
    usage: ".fb <facebook url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('facebook') && !url.includes('fb.watch'))) {
            return reply("❌ Provide a valid Facebook URL!\n\nUsage: .fb <url>");
        }

        try {
            await reply("⏳ Downloading Facebook video...");

            const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`, {
                timeout: 30000
            });

            if (response.data && response.data.data && response.data.data.sd) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: response.data.data.sd },
                    caption: `📹 *Facebook Video*\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                });
                return;
            }

            return reply("❌ Failed to download Facebook video.");

        } catch (error: any) {
            console.error('[FACEBOOK] Error:', error);
            return reply("❌ Download failed. Try again later.");
        }
    }
});

// Twitter downloader
registerCommand({
    name: "twitter",
    aliases: ["twdl", "x"],
    description: "Download Twitter/X video",
    category: "media",
    usage: ".twitter <twitter url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
            return reply("❌ Provide a valid Twitter/X URL!\n\nUsage: .twitter <url>");
        }

        try {
            await reply("⏳ Downloading Twitter video...");

            const response = await axios.post(`https://savetweet-pi.vercel.app/download`,
                { url },
                {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data && response.data.data && response.data.data.videoUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: response.data.data.videoUrl },
                    caption: `📹 *Twitter Video*\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                });
                return;
            }

            return reply("❌ Failed to download Twitter video.");

        } catch (error: any) {
            console.error('[TWITTER] Error:', error);
            return reply("❌ Download failed. Try again later.");
        }
    }
});
