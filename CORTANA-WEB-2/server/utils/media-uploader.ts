import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';

// ═══════════════════════════════════════════════════════════════
// MEDIA TO URL UPLOADER UTILITY
// Uploads media to various hosting services and returns URLs
// ═══════════════════════════════════════════════════════════════

// Helper to detect file type from buffer
async function detectFileType(buffer: Buffer): Promise<{ ext: string; mime: string }> {
    try {
        const { fileTypeFromBuffer } = await import('file-type');
        const result = await fileTypeFromBuffer(buffer);
        if (result) {
            return { ext: result.ext, mime: result.mime };
        }
    } catch (e) {
        // Fallback
    }
    return { ext: 'bin', mime: 'application/octet-stream' };
}

/**
 * Upload to Telegraph (images only, permanent)
 */
export async function uploadToTelegraph(buffer: Buffer): Promise<string> {
    const { ext, mime } = await detectFileType(buffer);

    const form = new FormData();
    form.append('file', buffer, { filename: `file.${ext}`, contentType: mime });

    const response = await axios({
        url: 'https://telegra.ph/upload',
        method: 'POST',
        headers: form.getHeaders(),
        data: form,
        timeout: 30000
    });

    if (response.data && response.data[0]?.src) {
        return 'https://telegra.ph' + response.data[0].src;
    }
    throw new Error('Telegraph upload failed');
}

/**
 * Upload to Uguu.se (24 hour temporary hosting)
 */
export async function uploadToUguu(buffer: Buffer): Promise<{ url: string; name: string }> {
    const { ext, mime } = await detectFileType(buffer);

    const form = new FormData();
    form.append('files[]', buffer, { filename: `upload.${ext}`, contentType: mime });

    const response = await axios({
        url: 'https://uguu.se/upload.php',
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...form.getHeaders()
        },
        data: form,
        timeout: 60000
    });

    if (response.data?.files?.[0]) {
        return response.data.files[0];
    }
    throw new Error('Uguu upload failed');
}

/**
 * Upload to Catbox.moe (permanent hosting)
 */
export async function uploadToCatbox(buffer: Buffer): Promise<string> {
    const { ext, mime } = await detectFileType(buffer);

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: `file.${ext}`, contentType: mime });

    const response = await axios({
        url: 'https://catbox.moe/user/api.php',
        method: 'POST',
        headers: form.getHeaders(),
        data: form,
        timeout: 60000
    });

    if (response.data && typeof response.data === 'string' && response.data.startsWith('https://')) {
        return response.data;
    }
    throw new Error('Catbox upload failed');
}

/**
 * Upload to tmpfiles.org (temporary hosting)
 */
export async function uploadToTmpFiles(buffer: Buffer): Promise<string> {
    const { ext, mime } = await detectFileType(buffer);

    const form = new FormData();
    form.append('file', buffer, { filename: `file.${ext}`, contentType: mime });

    const response = await axios({
        url: 'https://tmpfiles.org/api/v1/upload',
        method: 'POST',
        headers: form.getHeaders(),
        data: form,
        timeout: 60000
    });

    if (response.data?.data?.url) {
        // Convert view URL to direct download URL
        return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    }
    throw new Error('TmpFiles upload failed');
}

/**
 * Convert WebP sticker to MP4 using ezgif
 */
export async function webpToMp4(buffer: Buffer): Promise<string> {
    const { ext } = await detectFileType(buffer);

    if (ext !== 'webp') {
        throw new Error('File is not a WebP');
    }

    // Step 1: Upload to ezgif
    const form = new FormData();
    form.append('new-image-url', '');
    form.append('new-image', buffer, { filename: 'sticker.webp', contentType: 'image/webp' });

    const uploadRes = await axios({
        method: 'POST',
        url: 'https://s6.ezgif.com/webp-to-mp4',
        data: form,
        headers: form.getHeaders(),
        timeout: 30000
    });

    const $1 = cheerio.load(uploadRes.data);
    const file = $1('input[name="file"]').attr('value');

    if (!file) throw new Error('Failed to upload to ezgif');

    // Step 2: Convert
    const convertForm = new FormData();
    convertForm.append('file', file);
    convertForm.append('convert', 'Convert WebP to MP4!');

    const convertRes = await axios({
        method: 'POST',
        url: `https://ezgif.com/webp-to-mp4/${file}`,
        data: convertForm,
        headers: convertForm.getHeaders(),
        timeout: 60000
    });

    const $2 = cheerio.load(convertRes.data);
    const result = 'https:' + $2('div#output > p.outfile > video > source').attr('src');

    if (!result || result === 'https:undefined') {
        throw new Error('Failed to convert WebP to MP4');
    }

    return result;
}

/**
 * Main upload function - tries multiple services
 */
export async function uploadMedia(buffer: Buffer): Promise<{
    url: string;
    service: string;
    type: string;
}> {
    const { mime } = await detectFileType(buffer);
    const isImage = mime.startsWith('image/');

    // Try services in order of preference
    const services = [
        { name: 'Catbox', fn: uploadToCatbox, imageOnly: false },
        { name: 'Telegraph', fn: uploadToTelegraph, imageOnly: true },
        { name: 'TmpFiles', fn: uploadToTmpFiles, imageOnly: false },
        { name: 'Uguu', fn: async (b: Buffer) => (await uploadToUguu(b)).url, imageOnly: false }
    ];

    for (const service of services) {
        if (service.imageOnly && !isImage) continue;

        try {
            console.log(`[UPLOAD] Trying ${service.name}...`);
            const url = await service.fn(buffer);
            console.log(`[UPLOAD] ✅ Success with ${service.name}`);
            return { url, service: service.name, type: mime };
        } catch (e: any) {
            console.log(`[UPLOAD] ❌ ${service.name} failed:`, e.message);
        }
    }

    throw new Error('All upload services failed');
}
