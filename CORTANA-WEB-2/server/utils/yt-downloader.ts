import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════
// YT DOWNLOADER UTILITY - FIXED VERSION
// Downloads YouTube audio with proper quality
// ═══════════════════════════════════════════════════════════════

const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/;

// Minimum audio size - should be at least 100KB for a real audio file
const MIN_AUDIO_SIZE = 100000; // 100KB

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
            videoInfo = {
                id: videoId,
                title: 'YouTube Audio',
                author: 'Unknown',
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                duration: 'N/A'
            };
        }

        console.log(`[YT] Downloading: ${videoInfo.title}`);
        console.log(`[YT] URL: ${videoUrl}`);

        // Try multiple download APIs - prioritize the ones that work
        const downloadApis = [
            // API 1: RuangDev (reliable)
            async () => {
                console.log('[YT] Trying RuangDev API...');
                const apiUrl = `https://api.itsrose.site/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });

                if (!res.data?.status || !res.data?.result?.download_url) {
                    throw new Error('No RuangDev download URL');
                }

                console.log('[YT] Got download URL from RuangDev');
                const audioRes = await axios.get(res.data.result.download_url, {
                    responseType: 'arraybuffer',
                    timeout: 180000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                return Buffer.from(audioRes.data);
            },

            // API 2: Widipe API (usually works)
            async () => {
                console.log('[YT] Trying Widipe API...');
                const apiUrl = `https://widipe.com/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });

                if (!res.data?.result?.mp3) {
                    throw new Error('No Widipe download URL');
                }

                console.log('[YT] Got download URL from Widipe');
                const audioRes = await axios.get(res.data.result.mp3, {
                    responseType: 'arraybuffer',
                    timeout: 180000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                return Buffer.from(audioRes.data);
            },

            // API 3: BK9 API
            async () => {
                console.log('[YT] Trying BK9 API...');
                const apiUrl = `https://bk9.fun/download/youtube?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });

                if (!res.data?.BK9?.audio) {
                    throw new Error('No BK9 download URL');
                }

                console.log('[YT] Got download URL from BK9');
                const audioRes = await axios.get(res.data.BK9.audio, {
                    responseType: 'arraybuffer',
                    timeout: 180000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                return Buffer.from(audioRes.data);
            },

            // API 4: Vreden API
            async () => {
                console.log('[YT] Trying Vreden API...');
                const apiUrl = `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });

                if (!res.data?.result?.download?.url) {
                    throw new Error('No Vreden download URL');
                }

                console.log('[YT] Got download URL from Vreden');
                const audioRes = await axios.get(res.data.result.download.url, {
                    responseType: 'arraybuffer',
                    timeout: 180000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                return Buffer.from(audioRes.data);
            },

            // API 5: SiputZX
            async () => {
                console.log('[YT] Trying SiputZX API...');
                const apiUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const res = await axios.get(apiUrl, { timeout: 60000 });

                if (!res.data?.data?.dl) {
                    throw new Error('No SiputZX download URL');
                }

                console.log('[YT] Got download URL from SiputZX');
                const audioRes = await axios.get(res.data.data.dl, {
                    responseType: 'arraybuffer',
                    timeout: 180000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                return Buffer.from(audioRes.data);
            }
        ];

        let audioBuffer: Buffer | null = null;

        for (let i = 0; i < downloadApis.length; i++) {
            try {
                audioBuffer = await downloadApis[i]();

                // Check if buffer is valid and large enough for audio
                if (audioBuffer && audioBuffer.length >= MIN_AUDIO_SIZE) {
                    console.log(`[YT] ✅ Success with API ${i + 1} - Size: ${formatSize(audioBuffer.length)}`);
                    break;
                } else if (audioBuffer) {
                    console.log(`[YT] ❌ API ${i + 1} returned too small file: ${formatSize(audioBuffer.length)}`);
                    audioBuffer = null;
                }
            } catch (e: any) {
                console.log(`[YT] ❌ API ${i + 1} failed:`, e.message);
            }
        }

        if (!audioBuffer || audioBuffer.length < MIN_AUDIO_SIZE) {
            throw new Error('All download APIs failed or returned invalid audio');
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
