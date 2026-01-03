import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// NOTE: Primary .play command is in media.ts (uses yts for better search)
// This file contains alternative download commands using various APIs
// ═══════════════════════════════════════════════════════════════

const DAVID_API = "https://api.davidcyril.tech/api";

// ═══════════════════════════════════════════════════════════════
// SONG COMMAND - YouTube Audio/Video (DavidCyril API)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "song",
    aliases: ["music", "mp3", "audio"],
    description: "Download song with audio quality",
    category: "media",
    usage: ".song <song name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();

        if (!query) {
            return reply("*🎵 SONG DOWNLOADER*\n\nUsage: .song <song name>\nExample: .song shape of you");
        }

        try {
            await reply("🔍 Searching...");

            const res = await axios.get(`${DAVID_API}/download/song?query=${encodeURIComponent(query)}`, {
                timeout: 30000
            });
            const data = res.data;

            if (!data?.status || !data?.result?.audio?.download_url) {
                return reply("❌ Song not found!");
            }

            const result = data.result;
            const audio = result.audio;

            const caption = `*🎵 SONG INFO*\n\n📝 Title: ${result.title}\n⏱️ Duration: ${result.duration}\n🎧 Quality: ${audio.quality}\n📅 Published: ${result.published}`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: result.thumbnail },
                caption: caption
            }, { quoted: msg });

            await reply("⬇️ Downloading...");

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: audio.download_url },
                mimetype: "audio/mpeg",
                fileName: `${result.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
            }, { quoted: msg });

        } catch (error: any) {
            console.error("Song Error:", error);
            await reply("❌ Download failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TIKTOK COMMAND - TikTok Video/Audio Download (DavidCyril API)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tiktok",
    aliases: ["tt", "tiktokdl", "ttdl"],
    description: "Download TikTok video without watermark",
    category: "downloader",
    usage: ".tiktok <tiktok url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('tiktok.com') && !url.includes('vm.tiktok'))) {
            return reply("*📱 TIKTOK DOWNLOADER*\n\nUsage: .tiktok <url>\nExample: .tiktok https://vm.tiktok.com/xxxxx");
        }

        try {
            await reply("⏳ Downloading TikTok...");

            const res = await axios.get(`${DAVID_API}/download/tiktok?url=${encodeURIComponent(url)}`, {
                timeout: 45000
            });
            const data = res.data;

            if (!data?.success || !data?.result?.video) {
                return reply("❌ Failed to download. Check the URL!");
            }

            const result = data.result;

            // Send video
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: result.video },
                caption: `📱 *TikTok Download*\n\n👤 Author: ${result.author?.nickname || 'Unknown'}\n📝 ${result.desc?.slice(0, 200) || 'No description'}`,
                mimetype: "video/mp4"
            }, { quoted: msg });

        } catch (error: any) {
            console.error("TikTok Error:", error);
            await reply("❌ Download failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TIKTOK AUDIO COMMAND - TikTok Audio/Music Download
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tiktokmp3",
    aliases: ["ttmp3", "ttaudio", "tiktokaudio"],
    description: "Download TikTok audio/sound",
    category: "downloader",
    usage: ".tiktokmp3 <tiktok url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || (!url.includes('tiktok.com') && !url.includes('vm.tiktok'))) {
            return reply("*🎵 TIKTOK AUDIO*\n\nUsage: .tiktokmp3 <url>");
        }

        try {
            await reply("⏳ Extracting audio...");

            const res = await axios.get(`${DAVID_API}/download/tiktok?url=${encodeURIComponent(url)}`, {
                timeout: 45000
            });
            const data = res.data;

            if (!data?.success || !data?.result?.music) {
                return reply("❌ Failed to extract audio!");
            }

            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: data.result.music },
                mimetype: "audio/mpeg"
            }, { quoted: msg });

        } catch (error: any) {
            console.error("TikTok MP3 Error:", error);
            await reply("❌ Download failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// FACEBOOK COMMAND - Facebook Video Download (DavidCyril API)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "facebook",
    aliases: ["fb", "fbdl", "facebookdl"],
    description: "Download Facebook videos",
    category: "downloader",
    usage: ".facebook <facebook video url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || !url.includes('facebook.com') && !url.includes('fb.watch')) {
            return reply("*📘 FACEBOOK DOWNLOADER*\n\nUsage: .facebook <url>\nExample: .facebook https://fb.watch/xxxxx");
        }

        try {
            await reply("⏳ Downloading Facebook video...");

            const res = await axios.get(`${DAVID_API}/download/facebook?url=${encodeURIComponent(url)}`, {
                timeout: 45000
            });
            const data = res.data;

            if (!data?.success || !data?.result?.downloads) {
                return reply("❌ Failed to download. Check the URL!");
            }

            const downloads = data.result.downloads;
            const videoUrl = downloads.hd?.url || downloads.sd?.url;

            if (!videoUrl) {
                return reply("❌ No downloadable video found!");
            }

            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoUrl },
                caption: `📘 *Facebook Video*\n\n📝 ${data.result.title || 'Downloaded'}\n📊 Quality: ${downloads.hd?.url ? 'HD' : 'SD'}`,
                mimetype: "video/mp4"
            }, { quoted: msg });

        } catch (error: any) {
            console.error("Facebook Error:", error);
            await reply("❌ Download failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// APK COMMAND - Download Android APK (DavidCyril API)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "apk",
    aliases: ["getapk", "downloadapk"],
    description: "Download Android APK files",
    category: "tools",
    usage: ".apk <app name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();

        if (!query) {
            return reply("*📱 APK DOWNLOADER*\n\nUsage: .apk <app name>\nExample: .apk whatsapp");
        }

        try {
            await reply("🔍 Searching for APK...");

            const res = await axios.get(`${DAVID_API}/download/apk?query=${encodeURIComponent(query)}`, {
                timeout: 30000
            });
            const data = res.data;

            if (!data?.status || !data?.apk?.downloadLink) {
                return reply("❌ APK not found!");
            }

            const apk = data.apk;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: apk.icon },
                caption: `*📱 APK FOUND*\n\n📛 Name: ${apk.name}\n📦 Package: ${apk.package}\n🔄 Version: ${apk.lastUpdated}\n\n⬇️ Download Link:\n${apk.downloadLink}`
            }, { quoted: msg });

        } catch (error: any) {
            console.error("APK Error:", error);
            await reply("❌ Failed to find APK!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// LYRICS COMMAND - Get song lyrics
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "lyrics",
    aliases: ["lyric", "lirik"],
    description: "Get song lyrics",
    category: "media",
    usage: ".lyrics <song name>",
    execute: async ({ args, reply }) => {
        const query = args.join(" ").trim();

        if (!query) {
            return reply("❌ Provide a song name!\n\nUsage: .lyrics hello adele");
        }

        try {
            await reply("🔍 Searching lyrics for: " + query + "...");

            // Try API 1: Pink Venom API (with YT search first)
            try {
                console.log('[LYRICS] Trying pink-venom API...');
                const yts = require("yt-search");
                const search = await yts(query);
                
                if (search.videos.length > 0) {
                    const video = search.videos[0];
                    const songQuery = video.title;
                    
                    const response = await axios.get(`https://api-pink-venom.vercel.app/lyrics?q=${encodeURIComponent(songQuery)}`, {
                        timeout: 15000
                    });

                    if (response.data && response.data.lyrics) {
                        const { title, artist, lyrics } = response.data;
                        let message = `🎵 *${title}*\n`;
                        if (artist) message += `🎤 *Artist:* ${artist}\n`;
                        message += `\n${lyrics}`;

                        if (message.length > 60000) {
                            message = message.substring(0, 60000) + "\n\n... (lyrics truncated)";
                        }

                        console.log('[LYRICS] ✅ Success with pink-venom API');
                        return reply(message);
                    }
                }
            } catch (e: any) {
                console.log('[LYRICS] pink-venom failed:', e.message);
            }

            // Try API 2: Popcat API
            try {
                console.log('[LYRICS] Trying popcat API...');
                const response = await axios.get(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(query)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const title = response.data.title || query;
                    const artist = response.data.artist || "Unknown";
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;

                    console.log('[LYRICS] ✅ Success with popcat API');
                    return reply(`🎵 *${title}*\n👤 *Artist:* ${artist}\n\n${preview}`);
                }
            } catch (e: any) {
                console.log('[LYRICS] popcat failed:', e.message);
            }

            // Try API 3: Some-Random-API
            try {
                console.log('[LYRICS] Trying some-random-api...');
                const response = await axios.get(`https://some-random-api.com/others/lyrics?title=${encodeURIComponent(query)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const title = response.data.title || query;
                    const artist = response.data.author || "Unknown";
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;

                    console.log('[LYRICS] ✅ Success with some-random-api');
                    return reply(`🎵 *${title}*\n👤 *Artist:* ${artist}\n\n${preview}`);
                }
            } catch (e: any) {
                console.log('[LYRICS] some-random-api failed:', e.message);
            }

            // Try API 4: lyrics.ovh
            try {
                console.log('[LYRICS] Trying lyrics.ovh...');
                const parts = query.split(" ");
                let artist = parts[0];
                let title = parts.slice(1).join(" ") || query;

                const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;
                    
                    console.log('[LYRICS] ✅ Success with lyrics.ovh');
                    return reply(`🎵 *Lyrics: ${query}*\n\n${preview}`);
                }
            } catch (e: any) {
                console.log('[LYRICS] lyrics.ovh failed:', e.message);
            }

            console.error('[LYRICS] ❌ All APIs failed for query:', query);
            return reply("❌ Lyrics not found on all APIs. Try:\n• .lyrics artist songname\n• .lyrics hello adele\n• Be more specific");

        } catch (error: any) {
            console.error('[LYRICS] Error:', error);
            return reply("❌ Failed to fetch lyrics. Try again!");
        }
    }
});
            }

            // Try API 3: lyrics.ovh
            try {
                const parts = query.split(" ");
                let artist = parts[0];
                let title = parts.slice(1).join(" ") || query;

                const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;
                    return reply(`🎵 *Lyrics: ${query}*\n\n${preview}`);
                }
            } catch (e: any) {
                console.log('[LYRICS] lyrics.ovh failed:', e.message);
            }

            return reply("❌ Lyrics not found. Try: .lyrics artist songname");

        } catch (error: any) {
            console.error('[LYRICS] Error:', error);
            return reply("❌ Failed to fetch lyrics. Try again!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// SOUNDCLOUD COMMAND - Download from SoundCloud
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "soundcloud",
    aliases: ["sc", "scdl"],
    description: "Download audio from SoundCloud",
    category: "media",
    usage: ".soundcloud <soundcloud url>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0];

        if (!url || !url.includes('soundcloud.com')) {
            return reply("❌ Provide a valid SoundCloud URL!\n\nUsage: .soundcloud <url>");
        }

        try {
            await reply("⏳ Downloading from SoundCloud...");

            const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/scdl?url=${encodeURIComponent(url)}`, {
                timeout: 45000
            });

            if (response.data?.data?.download) {
                const track = response.data.data;

                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: track.download },
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: track.title || "SoundCloud Track",
                            body: track.artist || "Unknown Artist",
                            thumbnailUrl: track.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true,
                            sourceUrl: url
                        }
                    }
                });
                return;
            }

            return reply("❌ Failed to download from SoundCloud. The URL might be invalid.");

        } catch (error: any) {
            console.error('[SOUNDCLOUD] Error:', error);
            return reply("❌ Download failed. The track might be private or region-locked.");
        }
    }
});
