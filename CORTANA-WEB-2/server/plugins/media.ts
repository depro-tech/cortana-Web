import { registerCommand } from "./types";
import axios from "axios";
import yts from "yt-search";

// API configuration
const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

// Video download helpers
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

registerCommand({
    name: "play",
    aliases: ["song"],
    description: "Download song from YouTube",
    category: "media",
    usage: ".play <song name>",
    execute: async ({ args, reply, sock, msg }) => {
        const searchQuery = args.join(" ").trim();

        if (!searchQuery) {
            return reply("What song do you want to download?");
        }

        try {
            // Search for the song
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("No songs found!");
            }

            // Send loading message
            await reply("Please wait your download is in progress");

            // Get the first video result
            const video = videos[0];
            const urlYt = video.url;

            // Fetch audio data from Keith API
            const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`, {
                timeout: 60000
            });
            const data = response.data;

            if (!data || !data.status || !data.result || !data.result.downloadUrl) {
                return reply("Failed to fetch audio from the API. Please try again later.");
            }

            const audioUrl = data.result.downloadUrl;
            const title = data.result.title || video.title;

            // Send the audio
            await sock.sendMessage(msg.key.remoteJid, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            });

        } catch (error: any) {
            console.error('Error in play command:', error);
            await reply("Download failed. Please try again later.");
        }
    }
});
