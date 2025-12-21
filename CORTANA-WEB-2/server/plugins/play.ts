import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

// ═══════════════════════════════════════════════════════════════
// PLAY COMMAND - YouTube Search + Download (USING PROVEN APIS)
// Uses the same APIs as your working .ytmp3 command!
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
            await reply("🔍 Searching and downloading: " + query + "...");

            // Use NekoLabs API for direct search + download
            const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`;

            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (response.data?.status && response.data?.data) {
                const data = response.data.data;

                // Send audio with metadata
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: { url: data.audio },
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: data.title,
                            body: `👤 ${data.channel} | ⏱️ ${data.duration}`,
                            thumbnailUrl: data.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true,
                            sourceUrl: data.url
                        }
                    }
                });
                return;
            } else {
                return reply("❌ No results found for: " + query);
            }

        } catch (error: any) {
            console.error('[PLAY] Error:', error);
            return reply("❌ Failed to process your request. Try again or use a different song name!");
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
