import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// YT DOWNLOADER UTILITY
// Downloads YouTube audio with proper quality and metadata
// ═══════════════════════════════════════════════════════════════

const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Check if URL is a YouTube URL
 */
export function isYTUrl(url: string): boolean {
    return ytIdRegex.test(url);
}

/**
 * Extract video ID from YouTube URL
 */
export function getVideoID(url: string): string | null {
    if (!isYTUrl(url)) return null;
    const match = ytIdRegex.exec(url);
    return match ? match[1] : null;
}

/**
 * Search YouTube for videos
 */
export async function searchYT(query: string): Promise<any[]> {
    try {
        const yts = require('yt-search');
        const results = await yts(query);
        return results.videos || [];
    } catch (error) {
        console.error('[YT] Search error:', error);
        return [];
    }
}

/**
 * Get video info from YouTube
 */
export async function getVideoInfo(urlOrId: string): Promise<any> {
    try {
        const videoId = isYTUrl(urlOrId) ? getVideoID(urlOrId) : urlOrId;
        if (!videoId) throw new Error('Invalid video ID');

        // Try multiple info APIs
        const apis = [
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        ];

        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 10000 });
                if (response.data && response.data.title) {
                    return {
                        id: videoId,
                        title: response.data.title,
                        author: response.data.author_name || 'Unknown',
                        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                        url: `https://www.youtube.com/watch?v=${videoId}`
                    };
                }
            } catch (e) {
                continue;
            }
        }

        // Fallback - return basic info
        return {
            id: videoId,
            title: 'Unknown Title',
            author: 'Unknown Artist',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`
        };
    } catch (error) {
        console.error('[YT] Get info error:', error);
        throw error;
    }
}

/**
 * Download audio from YouTube using multiple fallback APIs
 * Returns the audio buffer ready to send
 */
export async function downloadAudio(urlOrQuery: string): Promise<{
    buffer: Buffer;
    title: string;
    artist: string;
    thumbnail: string;
    duration: string;
    fileName: string;
} | null> {
    try {
        let videoUrl: string;
        let videoInfo: any;

        // If it's a search query, find the video first
        if (!isYTUrl(urlOrQuery)) {
            const videos = await searchYT(urlOrQuery);
            if (!videos.length) {
                throw new Error('No videos found');
            }
            videoUrl = videos[0].url;
            videoInfo = {
                id: videos[0].videoId,
                title: videos[0].title,
                author: videos[0].author?.name || 'Unknown',
                thumbnail: videos[0].thumbnail,
                duration: videos[0].timestamp || 'N/A'
            };
        } else {
            videoUrl = urlOrQuery;
            const videoId = getVideoID(urlOrQuery);
            videoInfo = await getVideoInfo(urlOrQuery);
            videoInfo.duration = 'N/A';
        }

        console.log(`[YT] Downloading: ${videoInfo.title}`);

        // Try multiple download APIs
        const downloadApis = [
            // API 1: Notube
            async () => {
                const cheerio = await import('cheerio');
                const qs = await import('querystring');

                const params = { url: videoUrl, format: 'mp3', lang: 'en' };
                const convRes = await axios.post('https://s64.notube.net/recover_weight.php',
                    qs.stringify(params),
                    { timeout: 30000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );

                if (!convRes.data.token) throw new Error('No notube token');

                const pageRes = await axios.get(`https://notube.net/en/download?token=${convRes.data.token}`, { timeout: 30000 });
                const $ = cheerio.load(pageRes.data);
                const downloadUrl = $('#breadcrumbs-section #downloadButton').attr('href');

                if (!downloadUrl) throw new Error('No notube download URL');

                const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
                return Buffer.from(audioRes.data);
            },

            // API 2: Foreign ytapi
            async () => {
                const apiUrl = `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/ytapi?apiKey=free&url=${encodeURIComponent(videoUrl)}&fo=1&qu=1`;
                const res = await axios.get(apiUrl, { timeout: 60000 });
                if (!res.data?.downloadUrl) throw new Error('No ytapi download URL');

                const audioRes = await axios.get(res.data.downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
                return Buffer.from(audioRes.data);
            },

            // API 3: Izumi
            async () => {
                const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=audio`;
                const res = await axios.get(apiUrl, { timeout: 60000 });
                if (!res.data?.result?.download) throw new Error('No Izumi download URL');

                const audioRes = await axios.get(res.data.result.download, { responseType: 'arraybuffer', timeout: 120000 });
                return Buffer.from(audioRes.data);
            },

            // API 4: Okatsu
            async () => {
                const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });
                const downloadUrl = res.data?.result?.mp3 || res.data?.result?.downloadUrl;
                if (!downloadUrl) throw new Error('No Okatsu download URL');

                const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
                return Buffer.from(audioRes.data);
            },

            // API 5: ChatGPT-4o API (abrahamdw882)
            async () => {
                const apiUrl = `https://ab-chatgpt4o.abrahamdw882.workers.dev/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });
                if (!res.data?.data?.download) throw new Error('No abrahamdw882 download URL');

                const audioRes = await axios.get(res.data.data.download, { responseType: 'arraybuffer', timeout: 120000 });
                return Buffer.from(audioRes.data);
            }
        ];

        let audioBuffer: Buffer | null = null;

        for (let i = 0; i < downloadApis.length; i++) {
            try {
                console.log(`[YT] Trying API ${i + 1}...`);
                audioBuffer = await downloadApis[i]();
                if (audioBuffer && audioBuffer.length > 10000) {
                    console.log(`[YT] ✅ Success with API ${i + 1}`);
                    break;
                }
            } catch (e: any) {
                console.log(`[YT] ❌ API ${i + 1} failed:`, e.message);
            }
        }

        if (!audioBuffer) {
            throw new Error('All download APIs failed');
        }

        // Clean filename
        const safeTitle = videoInfo.title
            .replace(/[\\/:*?"<>|]/g, '')
            .slice(0, 80);

        return {
            buffer: audioBuffer,
            title: videoInfo.title,
            artist: videoInfo.author,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            fileName: `${safeTitle}.mp3`
        };

    } catch (error: any) {
        console.error('[YT] Download error:', error.message);
        return null;
    }
}

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
