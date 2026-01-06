import { registerCommand } from "./types";
import axios from "axios";
import * as cheerio from "cheerio";

// ═══════════════════════════════════════════════════════════════
// E-PHOTO 360 EFFECTS - Generates stylized text images
// ═══════════════════════════════════════════════════════════════

interface EphotoResult {
    status: boolean;
    url: string | null;
    error?: string;
}

async function ephotoMaker(effectUrl: string, texts: string[]): Promise<EphotoResult> {
    try {
        // Step 1: Get the effect page to extract form data
        const pageResponse = await axios.get(effectUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(pageResponse.data);

        // Extract form data
        const token = $('input[name="token"]').val() as string || '';
        const buildServer = $('input[name="build_server"]').val() as string || '';
        const buildServerId = $('input[name="build_server_id"]').val() as string || '';

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('token', token);
        formData.append('build_server', buildServer);
        formData.append('build_server_id', buildServerId);

        // Add text inputs
        texts.forEach((text, i) => {
            formData.append(`text[${i}]`, text);
        });

        // Step 2: Submit form
        const submitResponse = await axios.post(effectUrl, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': effectUrl
            },
            timeout: 20000
        });

        const $result = cheerio.load(submitResponse.data);

        // Step 3: Extract result image URL
        let imageUrl = $result('div.thumbnail a[rel="nofollow"]').attr('href') ||
            $result('div.result img').attr('src') ||
            $result('img.result').attr('src') ||
            $result('#form_value img').attr('src');

        if (!imageUrl) {
            // Try to find any image in result area
            imageUrl = $result('img[src*="ephoto"]').attr('src') ||
                $result('img[src*="effect"]').attr('src');
        }

        if (imageUrl) {
            return { status: true, url: imageUrl };
        }

        return { status: false, url: null, error: 'Could not find result image' };

    } catch (error: any) {
        console.error('[EPHOTO] Error:', error.message);
        return { status: false, url: null, error: error.message };
    }
}

// Helper to send image from URL
async function sendEphotoFromUrl(sock: any, jid: string, url: string, caption?: string) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        await sock.sendMessage(jid, {
            image: response.data,
            caption: caption || ''
        });
    } catch (e: any) {
        console.error('[EPHOTO] Failed to send image:', e.message);
        throw e;
    }
}

// ═══════════════════════════════════════════════════════════════
// E-PHOTO EFFECT COMMANDS
// ═══════════════════════════════════════════════════════════════

// Single-text effects
const SINGLE_TEXT_EFFECTS: { name: string; desc: string; url: string }[] = [
    { name: "ecat", desc: "Glowing Glass Light Bulb", url: "https://en.ephoto360.com/create-handwriting-text-effect-with-a-glowing-glass-light-bulb-682.html" },
    { name: "ehacker", desc: "Anonymous Hacker Avatar", url: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html" },
    { name: "esign", desc: "Metallic Signature", url: "https://en.ephoto360.com/create-metallic-signature-at-the-signature-effect-online-714.html" },
    { name: "eglitter", desc: "Write in the Sky", url: "https://en.ephoto360.com/write-in-the-sky-online-656.html" },
    { name: "elight", desc: "Futuristic Light Text", url: "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html" },
    { name: "ecloud", desc: "Realistic Cloud Text", url: "https://en.ephoto360.com/create-realistic-cloud-text-effect-online-197.html" },
    { name: "eangel", desc: "Colorful Angel Wings", url: "https://en.ephoto360.com/art-of-colorful-angel-wings-with-great-texts-683.html" },
    { name: "etattoo", desc: "Tattoo Signature", url: "https://en.ephoto360.com/create-a-tattoo-online-with-signature-712.html" },
    { name: "eneon", desc: "Multicolored Neon Signature", url: "https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html" },
    { name: "ewatercolor", desc: "Watercolor Text", url: "https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html" },
    { name: "ebpink", desc: "BlackPink Style Logo", url: "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html" },
    { name: "e3d", desc: "Multicolored 3D Text", url: "https://en.ephoto360.com/multicolored-3d-text-effect-online-808.html" },
];

// Dual-text effects (require Text1;Text2)
const DUAL_TEXT_EFFECTS: { name: string; desc: string; url: string }[] = [
    { name: "emarvel", desc: "Marvel Style Text", url: "https://en.ephoto360.com/create-marvel-style-text-effect-online-819.html" },
    { name: "eblub", desc: "Romantic Red Roses", url: "https://en.ephoto360.com/create-romantic-messages-for-your-loved-one-with-red-roses-601.html" },
    { name: "egraffiti", desc: "Graffiti Art Text", url: "https://en.ephoto360.com/create-wonderful-graffiti-art-text-effect-online-585.html" },
    { name: "eglitch", desc: "Digital Glitch Text", url: "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html" },
    { name: "eavenger", desc: "Avengers Logo Style", url: "https://en.ephoto360.com/create-text-effects-in-the-style-of-the-avengers-logo-online-427.html" },
];

// Triple-text effects (require Text1;Text2;Text3)
const TRIPLE_TEXT_EFFECTS: { name: string; desc: string; url: string }[] = [
    { name: "esci", desc: "Sci-Fi Logo Text", url: "https://en.ephoto360.com/create-awesome-logo-sci-fi-text-effects-online-181.html" },
];

// Register single-text effect commands
for (const effect of SINGLE_TEXT_EFFECTS) {
    registerCommand({
        name: effect.name,
        description: effect.desc,
        category: "ephoto",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            if (!text) {
                return await reply(`❌ Please provide text!\nExample: .${effect.name} Your Text`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await ephotoMaker(effect.url, [text]);
            if (result.status && result.url) {
                try {
                    const jid = msg.key.remoteJid!;
                    await sendEphotoFromUrl(sock, jid, result.url, `✨ ${effect.desc}`);
                } catch (e: any) {
                    await reply(`❌ Failed to send: ${e.message}`);
                }
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'Unknown error'}`);
            }
        }
    });
}

// Register dual-text effect commands
for (const effect of DUAL_TEXT_EFFECTS) {
    registerCommand({
        name: effect.name,
        description: effect.desc + " (use Text1;Text2)",
        category: "ephoto",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            if (!text || !text.includes(";")) {
                return await reply(`❌ Please provide two texts separated by ;\nExample: .${effect.name} Text1;Text2`);
            }

            const texts = text.split(";").map(t => t.trim());
            if (texts.length < 2 || !texts[0] || !texts[1]) {
                return await reply(`❌ Both texts are required!\nExample: .${effect.name} CORTANA;MD`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await ephotoMaker(effect.url, texts);
            if (result.status && result.url) {
                try {
                    const jid = msg.key.remoteJid!;
                    await sendEphotoFromUrl(sock, jid, result.url, `✨ ${effect.desc}`);
                } catch (e: any) {
                    await reply(`❌ Failed to send: ${e.message}`);
                }
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'Unknown error'}`);
            }
        }
    });
}

// Register triple-text effect commands
for (const effect of TRIPLE_TEXT_EFFECTS) {
    registerCommand({
        name: effect.name,
        description: effect.desc + " (use Text1;Text2;Text3)",
        category: "ephoto",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            const texts = text.split(";").map(t => t.trim());

            if (texts.length < 3 || !texts[0] || !texts[1] || !texts[2]) {
                return await reply(`❌ Please provide three texts separated by ;\nExample: .${effect.name} Text1;Text2;Text3`);
            }

            await reply(`⏳ Generating ${effect.desc}...`);

            const result = await ephotoMaker(effect.url, texts);
            if (result.status && result.url) {
                try {
                    const jid = msg.key.remoteJid!;
                    await sendEphotoFromUrl(sock, jid, result.url, `✨ ${effect.desc}`);
                } catch (e: any) {
                    await reply(`❌ Failed to send: ${e.message}`);
                }
            } else {
                await reply(`❌ Failed to generate: ${result.error || 'Unknown error'}`);
            }
        }
    });
}
