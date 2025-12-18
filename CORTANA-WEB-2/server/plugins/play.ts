import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

// ═══════════════════════════════════════════════════════════════
// PLAY COMMAND - YouTube Search + Download with Thumbnail
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "play",
    aliases: ["song", "music"],
    description: "Search and download music from YouTube",
    category: "media",
    usage: ".play <song name>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ").trim();

        if (!query) {
            return reply("❌ Provide a song name!\n\nUsage: .play despacito");
        }

        try {
            await reply("🔍 Searching for: " + query + "...");

            // Search YouTube
            const search = await yts(query);
            if (!search.videos.length) {
                return reply("❌ No results found for: " + query);
            }

            const video = search.videos[0];
            const videoUrl = video.url;

            await reply(`🎵 *Found:* ${video.title}\n⏱️ ${video.timestamp}\n👤 ${video.author.name}\n\n⏳ Downloading...`);

            // Try multiple APIs for downloading
            let downloaded = false;

            // API 1: DavidCyril
            try {
                const response = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                    timeout: 45000
                });

                if (response.data?.result?.downloadUrl) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        audio: { url: response.data.result.downloadUrl },
                        mimetype: "audio/mpeg",
                        contextInfo: {
                            externalAdReply: {
                                title: video.title,
                                body: `👤 ${video.author.name} | ⏱️ ${video.timestamp}`,
                                thumbnailUrl: video.thumbnail,
                                mediaType: 1,
                                showAdAttribution: true,
                                sourceUrl: videoUrl
                            }
                        }
                    });
                    downloaded = true;
                    return;
                }
            } catch (e: any) {
                console.error('[PLAY] DavidCyril API failed:', e.message);
            }

            // API 2: Ryzendesu
            if (!downloaded) {
                try {
                    const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                        timeout: 45000
                    });

                    if (response.data?.url || response.data?.downloadUrl) {
                        const audioUrl = response.data.url || response.data.downloadUrl;

                        await sock.sendMessage(msg.key.remoteJid, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            contextInfo: {
                                externalAdReply: {
                                    title: video.title,
                                    body: `👤 ${video.author.name} | ⏱️ ${video.timestamp}`,
                                    thumbnailUrl: video.thumbnail,
                                    mediaType: 1,
                                    showAdAttribution: true,
                                    sourceUrl: videoUrl
                                }
                            }
                        });
                        downloaded = true;
                        return;
                    }
                } catch (e: any) {
                    console.error('[PLAY] Ryzendesu API failed:', e.message);
                }
            }

            // API 3: SaveFrom alternative
            if (!downloaded) {
                try {
                    const response = await axios.get(`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
                        timeout: 45000
                    });

                    if (response.data?.data?.download) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            audio: { url: response.data.data.download },
                            mimetype: "audio/mpeg",
                            contextInfo: {
                                externalAdReply: {
                                    title: video.title,
                                    body: `👤 ${video.author.name} | ⏱️ ${video.timestamp}`,
                                    thumbnailUrl: video.thumbnail,
                                    mediaType: 1,
                                    showAdAttribution: true,
                                    sourceUrl: videoUrl
                                }
                            }
                        });
                        downloaded = true;
                        return;
                    }
                } catch (e: any) {
                    console.error('[PLAY] Agatz API failed:', e.message);
                }
            }

            if (!downloaded) {
                return reply("❌ All download APIs failed. Please try again later or use .ytmp3 <url>");
            }

        } catch (error: any) {
            console.error('[PLAY] Error:', error);
            return reply("❌ Failed to process your request. Try again!");
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

            // Try API 1: lyrics.ovh
            try {
                const parts = query.split(" ");
                let artist = parts[0];
                let title = parts.slice(1).join(" ");

                // If query doesn't have artist, search differently
                if (parts.length === 1 || !title) {
                    title = query;
                    artist = "";
                }

                const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;
                    return reply(`🎵 *Lyrics: ${query}*\n\n${preview}`);
                }
            } catch (e: any) {
                console.error('[LYRICS] lyrics.ovh failed:', e.message);
            }

            // Try API 2: Some-Random-API
            try {
                const response = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`, {
                    timeout: 15000
                });

                if (response.data?.lyrics) {
                    const lyrics = response.data.lyrics;
                    const title = response.data.title || query;
                    const artist = response.data.author || "Unknown";
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;

                    return reply(`🎵 *${title}*\n👤 *Artist:* ${artist}\n\n${preview}`);
                }
            } catch (e: any) {
                console.error('[LYRICS] some-random-api failed:', e.message);
            }

            // Try API 3: ShizoAPI
            try {
                const response = await axios.get(`https://shizoapi.onrender.com/api/search/lyrics?query=${encodeURIComponent(query)}&apikey=shizo`, {
                    timeout: 15000
                });

                if (response.data?.result?.lyrics) {
                    const lyrics = response.data.result.lyrics;
                    const title = response.data.result.title || query;
                    const artist = response.data.result.artist || "Unknown";
                    const preview = lyrics.length > 4000 ? lyrics.substring(0, 4000) + "...\n\n_Lyrics truncated_" : lyrics;

                    return reply(`🎵 *${title}*\n👤 *Artist:* ${artist}\n\n${preview}`);
                }
            } catch (e: any) {
                console.error('[LYRICS] ShizoAPI failed:', e.message);
            }

            return reply("❌ Lyrics not found. Try being more specific with 'artist song' format.");

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
