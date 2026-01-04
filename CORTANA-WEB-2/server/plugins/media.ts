import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";
import { downloadAudio, formatSize, isYTUrl, searchYT } from "../utils/yt-downloader";

// ═══════════════════════════════════════════════════════════════
// PLAY COMMAND - Enhanced with proper audio metadata
// Sends thumbnail first, then high-quality audio with album art
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "play",
    aliases: ["p"],
    description: "Download and play song from YouTube",
    category: "media",
    usage: ".play <song name or YouTube URL>",
    execute: async ({ args, reply, sock, msg }) => {
        const searchQuery = args.join(" ").trim();

        if (!searchQuery) {
            return reply("*🎵 PLAY - AUDIO DOWNLOADER*\n\nUsage: .play <song name>\nExample: .play faded alan walker");
        }

        const jid = msg.key.remoteJid!;

        try {
            // Show initial reaction
            try {
                await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });
            } catch (e) { }

            await reply("🔍 *Searching...*");

            // Search for the song
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("❌ No songs found! Try a different search.");
            }

            const video = videos[0];
            const urlYt = video.url;
            const thumbnail = video.thumbnail;
            const title = video.title;
            const author = video.author?.name || "Unknown Artist";
            const duration = video.timestamp || "N/A";
            const views = video.views ? video.views.toLocaleString() : "N/A";

            // Send thumbnail with song info FIRST
            await sock.sendMessage(jid, {
                image: { url: thumbnail },
                caption: `*🎵 SONG FOUND*\n\n` +
                    `📝 *Title:* ${title}\n` +
                    `👤 *Artist:* ${author}\n` +
                    `⏱️ *Duration:* ${duration}\n` +
                    `👁️ *Views:* ${views}\n` +
                    `🔗 *URL:* ${urlYt}\n\n` +
                    `⬇️ *Downloading audio...*`
            }, { quoted: msg });

            // React to show downloading
            try {
                await sock.sendMessage(jid, { react: { text: "⬇️", key: msg.key } });
            } catch (e) { }

            // Download the audio
            const audioResult = await downloadAudio(urlYt);

            if (!audioResult) {
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
                return reply("❌ Failed to download audio. Please try again or use a different song.");
            }

            console.log(`[PLAY] ✅ Downloaded: ${audioResult.title} (${formatSize(audioResult.buffer.length)})`);

            // Send the audio with album art in contextInfo (like menu audio)
            await sock.sendMessage(jid, {
                audio: audioResult.buffer,
                mimetype: "audio/mpeg",
                fileName: audioResult.fileName,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: audioResult.title,
                        body: `${author} • ${duration}`,
                        thumbnailUrl: thumbnail,
                        mediaType: 1,
                        showAdAttribution: false,
                        sourceUrl: urlYt
                    }
                }
            }, { quoted: msg });

            // Success reaction
            try {
                await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
            } catch (e) { }

            console.log(`[PLAY] ✅ Sent audio: ${title}`);

        } catch (error: any) {
            console.error('[PLAY] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply("❌ Download failed. Please try again!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// YTMP3 COMMAND - Direct YouTube URL to MP3
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "ytmp3",
    aliases: ["yta", "mp3"],
    description: "Convert YouTube video to MP3",
    category: "media",
    usage: ".ytmp3 <YouTube URL>",
    execute: async ({ args, reply, sock, msg }) => {
        const url = args[0]?.trim();

        if (!url || !isYTUrl(url)) {
            return reply("*🎵 YTMP3 - YouTube to MP3*\n\nUsage: .ytmp3 <YouTube URL>\nExample: .ytmp3 https://youtu.be/xxxxx");
        }

        const jid = msg.key.remoteJid!;

        try {
            await sock.sendMessage(jid, { react: { text: "🔄", key: msg.key } }).catch(() => { });
            await reply("⬇️ *Converting to MP3...*");

            const audioResult = await downloadAudio(url);

            if (!audioResult) {
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
                return reply("❌ Conversion failed. The video might be restricted.");
            }

            // Send info message
            await sock.sendMessage(jid, {
                image: { url: audioResult.thumbnail },
                caption: `*🎵 MP3 READY*\n\n` +
                    `📝 *Title:* ${audioResult.title}\n` +
                    `👤 *Artist:* ${audioResult.artist}\n` +
                    `📦 *Size:* ${formatSize(audioResult.buffer.length)}`
            }, { quoted: msg });

            // Send audio with album art
            await sock.sendMessage(jid, {
                audio: audioResult.buffer,
                mimetype: "audio/mpeg",
                fileName: audioResult.fileName,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: audioResult.title,
                        body: audioResult.artist,
                        thumbnailUrl: audioResult.thumbnail,
                        mediaType: 1,
                        showAdAttribution: false,
                        sourceUrl: url
                    }
                }
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

        } catch (error: any) {
            console.error('[YTMP3] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply("❌ Conversion failed. Please try again!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// SONG COMMAND - Alternative name for play
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "song",
    aliases: ["musik", "audio", "music"],
    description: "Download song from YouTube (alias for .play)",
    category: "media",
    usage: ".song <song name>",
    execute: async ({ args, reply, sock, msg }) => {
        const searchQuery = args.join(" ").trim();

        if (!searchQuery) {
            return reply("*🎵 SONG DOWNLOADER*\n\nUsage: .song <song name>\nExample: .song shape of you");
        }

        const jid = msg.key.remoteJid!;

        try {
            await sock.sendMessage(jid, { react: { text: "🎵", key: msg.key } }).catch(() => { });
            await reply("🔍 *Searching for song...*");

            // Search
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("❌ No songs found!");
            }

            const video = videos[0];

            // Send preview
            await sock.sendMessage(jid, {
                image: { url: video.thumbnail },
                caption: `*🎵 ${video.title}*\n\n` +
                    `👤 *Artist:* ${video.author?.name || "Unknown"}\n` +
                    `⏱️ *Duration:* ${video.timestamp}\n\n` +
                    `⬇️ *Downloading...*`
            }, { quoted: msg });

            // Download
            const audioResult = await downloadAudio(video.url);

            if (!audioResult) {
                return reply("❌ Download failed. Try again!");
            }

            // Send audio with metadata
            await sock.sendMessage(jid, {
                audio: audioResult.buffer,
                mimetype: "audio/mpeg",
                fileName: audioResult.fileName,
                ptt: false,
                contextInfo: {
                    externalAdReply: {
                        title: audioResult.title,
                        body: audioResult.artist,
                        thumbnailUrl: video.thumbnail,
                        mediaType: 1,
                        showAdAttribution: false,
                        sourceUrl: video.url
                    }
                }
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

        } catch (error: any) {
            console.error('[SONG] Error:', error);
            await reply("❌ Download failed!");
        }
    }
});


// ═══════════════════════════════════════════════════════════════
// VIDEO COMMAND - Unchanged as requested
// ═══════════════════════════════════════════════════════════════
// Video download helpers
const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter: () => Promise<any>, attempts = 3): Promise<any> {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}


registerCommand({
    name: "video",
    description: "Download video from YouTube",
    category: "media",
    usage: ".video <video name or YouTube link>",
    execute: async ({ args, reply, sock, msg }) => {
        const searchQuery = args.join(" ").trim();

        if (!searchQuery) {
            return reply("❌ What video do you want to download?");
        }

        try {
            // Determine if input is a YouTube link
            let videoUrl = '';
            let videoTitle = '';
            let videoThumbnail = '';

            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
            } else {
                // Search YouTube for the video
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return reply('❌ No videos found!');
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title;
                videoThumbnail = videos[0].thumbnail;
            }

            // Send thumbnail immediately
            try {
                const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
                const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
                const captionTitle = videoTitle || searchQuery;
                if (thumb) {
                    await sock.sendMessage(msg.key.remoteJid, {
                        image: { url: thumb },
                        caption: `*${captionTitle}*\nDownloading...`
                    });
                }
            } catch (e: any) {
                console.error('[VIDEO] thumb error:', e?.message || e);
            }

            // Validate YouTube URL
            const urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
            if (!urls) {
                return reply('❌ This is not a valid YouTube link!');
            }

            // Get video: try Izumi first, then Okatsu fallback
            async function getIzumiVideoByUrl(youtubeUrl: string) {
                const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
                const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
                if (res?.data?.result?.download) return res.data.result;
                throw new Error('Izumi video api returned no download');
            }

            async function getOkatsuVideoByUrl(youtubeUrl: string) {
                const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
                const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
                if (res?.data?.result?.mp4) {
                    return { download: res.data.result.mp4, title: res.data.result.title };
                }
                throw new Error('Okatsu ytmp4 returned no mp4');
            }

            let videoData;
            try {
                videoData = await getIzumiVideoByUrl(videoUrl);
            } catch (e1) {
                videoData = await getOkatsuVideoByUrl(videoUrl);
            }

            // Send video directly using the download URL
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: videoData.download },
                mimetype: 'video/mp4',
                fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
                caption: `*${videoData.title || videoTitle || 'Video'}*\n\n> *_Downloaded by CORTANA MD_*`
            });

        } catch (error: any) {
            console.error('[VIDEO] Command Error:', error?.message || error);
            await reply('❌ Download failed: ' + (error?.message || 'Unknown error'));
        }
    }
});
