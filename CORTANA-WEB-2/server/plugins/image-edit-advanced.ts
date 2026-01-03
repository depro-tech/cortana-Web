import { registerCommand } from "./types";
import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

// ═══════════════════════════════════════════════════════════════
// ADVANCED IMAGE EDITING COMMANDS - FIXED WITH WORKING APIs
// Uses some-random-api.com and telegra.ph for reliability
// ═══════════════════════════════════════════════════════════════

// Helper to get image buffer from quoted message
async function getImageBuffer(msg: any, sock: any): Promise<Buffer | null> {
    try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg?.imageMessage) {
            return await downloadMediaMessage(
                { message: quotedMsg },
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            ) as Buffer;
        }
        if (msg.message?.imageMessage) {
            return await downloadMediaMessage(
                msg,
                'buffer',
                {},
                { logger: console, reuploadRequest: sock.updateMediaMessage }
            ) as Buffer;
        }
        return null;
    } catch (e) {
        console.error('Failed to get image buffer:', e);
        return null;
    }
}

// Helper to upload image to telegra.ph and get URL
async function uploadToTelegraph(buffer: Buffer): Promise<string | null> {
    try {
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const res = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders(),
            timeout: 15000
        });

        if (res.data?.[0]?.src) {
            return 'https://telegra.ph' + res.data[0].src;
        }
        return null;
    } catch (e) {
        console.error('[UPLOAD] Telegraph upload failed:', e);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// BLUR
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "blur",
    description: "Blur an image",
    category: "image",
    usage: "Send/reply to image with .blur",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .blur");

        try {
            await reply("⏳ Applying blur effect...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/blur`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "✅ Blurred image"
            });
        } catch (error: any) {
            console.error('[BLUR] Error:', error);
            return reply("❌ Blur effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// GREYSCALE / GRAYSCALE
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "greyscale",
    aliases: ["grayscale", "grey", "gray", "bw"],
    description: "Convert to black and white",
    category: "image",
    usage: "Send/reply to image with .greyscale",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .greyscale");

        try {
            await reply("⏳ Converting to greyscale...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/greyscale`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🖤 Greyscale applied"
            });
        } catch (error: any) {
            console.error('[GREYSCALE] Error:', error);
            return reply("❌ Greyscale effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// INVERT
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "invert",
    aliases: ["negative"],
    description: "Invert image colors",
    category: "image",
    usage: "Send/reply to image with .invert",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .invert");

        try {
            await reply("⏳ Inverting colors...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/invert`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🔄 Colors inverted"
            });
        } catch (error: any) {
            console.error('[INVERT] Error:', error);
            return reply("❌ Invert effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// BRIGHTNESS
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "bright",
    aliases: ["brightness", "lighten"],
    description: "Increase image brightness",
    category: "image",
    usage: "Send/reply to image with .bright",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .bright");

        try {
            await reply("⏳ Increasing brightness...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/brightness`, {
                params: { avatar: imageUrl, brightness: 100 },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "☀️ Brightness increased"
            });
        } catch (error: any) {
            console.error('[BRIGHT] Error:', error);
            return reply("❌ Brightness effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// THRESHOLD
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "threshold",
    aliases: ["thresh"],
    description: "Apply threshold effect",
    category: "image",
    usage: "Send/reply to image with .threshold",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .threshold");

        try {
            await reply("⏳ Applying threshold...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/threshold`, {
                params: { avatar: imageUrl, threshold: 128 },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "⬛⬜ Threshold applied"
            });
        } catch (error: any) {
            console.error('[THRESHOLD] Error:', error);
            return reply("❌ Threshold effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// PIXELATE
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "pixelate",
    aliases: ["pixel", "8bit"],
    description: "Pixelate an image",
    category: "image",
    usage: "Send/reply to image with .pixelate",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .pixelate");

        try {
            await reply("⏳ Pixelating image...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/pixelate`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🎮 Pixelated!"
            });
        } catch (error: any) {
            console.error('[PIXELATE] Error:', error);
            return reply("❌ Pixelate effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// WANTED POSTER
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "wanted",
    description: "Create a wanted poster",
    category: "image",
    usage: "Send/reply to image with .wanted",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .wanted");

        try {
            await reply("⏳ Creating wanted poster...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/wanted`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🚨 WANTED 🚨"
            });
        } catch (error: any) {
            console.error('[WANTED] Error:', error);
            return reply("❌ Failed to create wanted poster!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// WASTED (GTA)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "wasted",
    aliases: ["gta"],
    description: "Apply GTA wasted effect",
    category: "image",
    usage: "Send/reply to image with .wasted",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .wasted");

        try {
            await reply("⏳ Applying wasted effect...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/wasted`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "💀 WASTED 💀"
            });
        } catch (error: any) {
            console.error('[WASTED] Error:', error);
            return reply("❌ Wasted effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// JAIL
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "jail",
    aliases: ["prison"],
    description: "Put image behind bars",
    category: "image",
    usage: "Send/reply to image with .jail",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .jail");

        try {
            await reply("⏳ Putting behind bars...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/jail`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🔒 Behind bars!"
            });
        } catch (error: any) {
            console.error('[JAIL] Error:', error);
            return reply("❌ Jail effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TRIGGERED
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "triggered",
    aliases: ["trigger"],
    description: "Apply triggered effect",
    category: "image",
    usage: "Send/reply to image with .triggered",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .triggered");

        try {
            await reply("⏳ Getting triggered...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/triggered`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "😤 TRIGGERED 😤"
            });
        } catch (error: any) {
            console.error('[TRIGGERED] Error:', error);
            return reply("❌ Triggered effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// PASSED (Mission Passed GTA)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "passed",
    aliases: ["missionpassed", "respect"],
    description: "Apply mission passed effect",
    category: "image",
    usage: "Send/reply to image with .passed",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .passed");

        try {
            await reply("⏳ Applying mission passed...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/passed`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "✅ MISSION PASSED! Respect+"
            });
        } catch (error: any) {
            console.error('[PASSED] Error:', error);
            return reply("❌ Passed effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// GLASS
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "glass",
    aliases: ["shatter"],
    description: "Apply broken glass effect",
    category: "image",
    usage: "Send/reply to image with .glass",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .glass");

        try {
            await reply("⏳ Shattering glass...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/glass`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "💔 Shattered!"
            });
        } catch (error: any) {
            console.error('[GLASS] Error:', error);
            return reply("❌ Glass effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// COMRADE (Communist effect)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "comrade",
    aliases: ["communist", "ussr"],
    description: "Apply communist overlay",
    category: "image",
    usage: "Send/reply to image with .comrade",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .comrade");

        try {
            await reply("⏳ For the motherland...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/overlay/comrade`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "☭ OUR image, comrade!"
            });
        } catch (error: any) {
            console.error('[COMRADE] Error:', error);
            return reply("❌ Comrade effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// GAY (Rainbow flag overlay)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "gay",
    aliases: ["rainbow", "pride"],
    description: "Apply rainbow overlay",
    category: "image",
    usage: "Send/reply to image with .gay",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .gay");

        try {
            await reply("⏳ Adding rainbow...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/lgbt`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🏳️‍🌈 Pride!"
            });
        } catch (error: any) {
            console.error('[GAY] Error:', error);
            return reply("❌ Rainbow effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// CIRCLE
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "circle",
    aliases: ["round"],
    description: "Make image circular",
    category: "image",
    usage: "Send/reply to image with .circle",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .circle");

        try {
            await reply("⏳ Making circular...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/circle`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "⭕ Circular!"
            });
        } catch (error: any) {
            console.error('[CIRCLE] Error:', error);
            return reply("❌ Circle effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// SPIN (Animated)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "spin",
    aliases: ["rotate"],
    description: "Create spinning gif",
    category: "image",
    usage: "Send/reply to image with .spin",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .spin");

        try {
            await reply("⏳ Creating spin animation...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/spin`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                video: Buffer.from(response.data),
                gifPlayback: true,
                caption: "🔄 Spinning!"
            });
        } catch (error: any) {
            console.error('[SPIN] Error:', error);
            return reply("❌ Spin effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// HEART (Heart cropped)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "heart",
    aliases: ["love"],
    description: "Crop image in heart shape",
    category: "image",
    usage: "Send/reply to image with .heart",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .heart");

        try {
            await reply("⏳ Adding love...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/heart`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "❤️ Love!"
            });
        } catch (error: any) {
            console.error('[HEART] Error:', error);
            return reply("❌ Heart effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// HORNY (Horny card meme)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "horny",
    aliases: ["hornylicense"],
    description: "Create horny license",
    category: "image",
    usage: "Send/reply to image with .horny",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .horny");

        try {
            await reply("⏳ Creating license...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/horny`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "😏 Horny License Approved!"
            });
        } catch (error: any) {
            console.error('[HORNY] Error:', error);
            return reply("❌ Horny effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// SIMP (Simp card)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "simp",
    aliases: ["simpcard"],
    description: "Create simp card",
    category: "image",
    usage: "Send/reply to image with .simp",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .simp");

        try {
            await reply("⏳ Creating simp card...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/simpcard`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "💕 SIMP CARD CERTIFIED!"
            });
        } catch (error: any) {
            console.error('[SIMP] Error:', error);
            return reply("❌ Simp effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// LOLICE (Lolice card)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "lolice",
    aliases: ["fbi"],
    description: "Create lolice/FBI card",
    category: "image",
    usage: "Send/reply to image with .lolice",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .lolice");

        try {
            await reply("⏳ FBI is watching...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/misc/lolice`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🚔 FBI OPEN UP!"
            });
        } catch (error: any) {
            console.error('[LOLICE] Error:', error);
            return reply("❌ Lolice effect failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// COLORIZE (B&W to color - AI)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "colorize",
    aliases: ["colour", "color"],
    description: "Add color to B&W images (AI)",
    category: "image",
    usage: "Send/reply to B&W image with .colorize",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) return reply("❌ Reply to an image with .colorize");

        try {
            await reply("⏳ AI colorizing (may take a moment)...");

            const imageUrl = await uploadToTelegraph(imageBuffer);
            if (!imageUrl) return reply("❌ Failed to process image");

            const response = await axios.get(`https://some-random-api.com/canvas/filter/color`, {
                params: { avatar: imageUrl },
                responseType: 'arraybuffer',
                timeout: 45000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🎨 Colorized!"
            });
        } catch (error: any) {
            console.error('[COLORIZE] Error:', error);
            return reply("❌ Colorize failed - API may be unavailable");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TWEET (Create fake tweet)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tweet",
    aliases: ["faketweet"],
    description: "Create fake tweet",
    category: "image",
    usage: ".tweet <text>",
    execute: async ({ reply, sock, msg, text }) => {
        if (!text) return reply("❌ Usage: .tweet <text>");

        try {
            await reply("⏳ Creating tweet...");

            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderName = msg.pushName || senderJid?.split('@')[0] || 'Anonymous';

            const response = await axios.get(`https://some-random-api.com/canvas/misc/tweet`, {
                params: {
                    displayname: senderName,
                    username: senderName.toLowerCase().replace(/\s/g, ''),
                    avatar: 'https://i.imgur.com/8TcPJfG.png', // Default avatar
                    comment: text
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: `🐦 Tweet by @${senderName}`
            });
        } catch (error: any) {
            console.error('[TWEET] Error:', error);
            return reply("❌ Tweet creation failed!");
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// YOUTUBE COMMENT
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "ytcomment",
    aliases: ["youtubecomment", "ytc"],
    description: "Create fake YouTube comment",
    category: "image",
    usage: ".ytcomment <text>",
    execute: async ({ reply, sock, msg, text }) => {
        if (!text) return reply("❌ Usage: .ytcomment <text>");

        try {
            await reply("⏳ Creating comment...");

            const senderName = msg.pushName || 'Anonymous';

            const response = await axios.get(`https://some-random-api.com/canvas/misc/youtube-comment`, {
                params: {
                    username: senderName,
                    avatar: 'https://i.imgur.com/8TcPJfG.png',
                    comment: text
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: `📺 YouTube comment by ${senderName}`
            });
        } catch (error: any) {
            console.error('[YTCOMMENT] Error:', error);
            return reply("❌ YouTube comment creation failed!");
        }
    }
});

console.log('[PLUGINS] Image Edit Advanced loaded with 22 working effects!');
