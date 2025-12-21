import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// DOWNLOADER COMMANDS (Powered by NekoLabs API)
// ═══════════════════════════════════════════════════════════════

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

            // NekoLabs API
            const response = await axios.get(`https://api.nekolabs.my.id/downloader/tiktok?url=${encodeURIComponent(url)}`, { timeout: 30000 });

            if (response.data?.status && response.data?.data) {
                const data = response.data.data;
                const videoUrl = data.no_watermark || data.with_watermark || data.url;

                await sock.sendMessage(msg.key.remoteJid, {
                    video: { url: videoUrl },
                    caption: `📹 *${data.title || 'TikTok Video'}*\n👤 *Author:* ${data.author_name || 'Unknown'}\n\n> Downloaded by CORTANA MD`,
                    mimetype: 'video/mp4'
                });
                return;
            }

            return reply("❌ Failed to download TikTok video.");

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

            // NekoLabs API
            const response = await axios.get(`https://api.nekolabs.my.id/downloader/instagram?url=${encodeURIComponent(url)}`, { timeout: 30000 });

            if (response.data?.status && response.data?.data) {
                const data = response.data.data;
                const mediaList = Array.isArray(data) ? data : [data];

                for (const media of mediaList) {
                    if (media.type === 'video' || media.url?.includes('.mp4')) {
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
                }
                return;
            }

            return reply("❌ Failed to download from Instagram.");

        } catch (error: any) {
            console.error('[INSTAGRAM] Error:', error);
            return reply("❌ Download failed. Account might be private.");
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

            // NekoLabs API
            const response = await axios.get(`https://api.nekolabs.my.id/downloader/facebook?url=${encodeURIComponent(url)}`, { timeout: 30000 });

            if (response.data?.status && response.data?.data) {
                const data = response.data.data;
                const videoUrl = data.hd || data.sd || data.url;

                if (videoUrl) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `📹 *Facebook Video*\n\n> Downloaded by CORTANA MD`,
                        mimetype: 'video/mp4'
                    });
                    return;
                }
            }

            return reply("❌ Failed to download Facebook video.");

        } catch (error: any) {
            console.error('[FACEBOOK] Error:', error);
            return reply("❌ Download failed. Video might be private.");
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

            // NekoLabs API
            const response = await axios.get(`https://api.nekolabs.my.id/downloader/twitter?url=${encodeURIComponent(url)}`, { timeout: 30000 });

            if (response.data?.status && response.data?.data) {
                const data = response.data.data;
                const videoUrl = data.hd || data.sd || data.url || data.video_url;

                if (videoUrl) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        video: { url: videoUrl },
                        caption: `📹 *Twitter Video*\n\n> Downloaded by CORTANA MD`,
                        mimetype: 'video/mp4'
                    });
                    return;
                }
            }

            return reply("❌ Failed to download Twitter video.");

        } catch (error: any) {
            console.error('[TWITTER] Error:', error);
            return reply("❌ Download failed.");
        }
    }
});
