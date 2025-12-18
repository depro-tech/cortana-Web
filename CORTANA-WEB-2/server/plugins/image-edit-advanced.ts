import { registerCommand } from "./types";
import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

// ═══════════════════════════════════════════════════════════════
// ADVANCED IMAGE EDITING COMMANDS
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

// BLUR
registerCommand({
    name: "blur",
    description: "Blur an image",
    category: "image",
    usage: "Send/reply to image with .blur",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .blur");
        }

        try {
            await reply("⏳ Applying blur effect...");

            const formData = new FormData();
            formData.append('image', new Blob([imageBuffer]), 'image.jpg');

            const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                headers: { 'X-Api-Key': 'temp_key' },
                timeout: 30000
            }).catch(() => null);

            // Use canvas-based blur API
            const base64 = imageBuffer.toString('base64');
            const blurResponse = await axios.post('https://api.popcat.xyz/blur', {
                image: base64
            }, { timeout: 30000 });

            if (blurResponse.data?.image) {
                const blurred = Buffer.from(blurResponse.data.image, 'base64');
                await sock.sendMessage(msg.key.remoteJid, {
                    image: blurred,
                    caption: "✅ Blurred image"
                });
                return;
            }

            return reply("❌ Failed to blur image. Try again!");
        } catch (error: any) {
            console.error('[BLUR] Error:', error);
            return reply("❌ Blur effect failed!");
        }
    }
});

// ENHANCE
registerCommand({
    name: "enhance",
    aliases: ["hd", "quality"],
    description: "Enhance image quality",
    category: "image",
    usage: "Send/reply to image with .enhance",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .enhance");
        }

        try {
            await reply("⏳ Enhancing image quality...");

            // Use enhancement API
            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api-inference.huggingface.co/models/caidas/swin2SR-classical-sr-x2-64', {
                inputs: base64
            }, {
                headers: { 'Authorization': 'Bearer hf_demo' },
                responseType: 'arraybuffer',
                timeout: 45000
            }).catch(() => null);

            if (response?.data) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: Buffer.from(response.data),
                    caption: "✅ Enhanced quality"
                });
                return;
            }

            // Fallback: just send back with caption
            await sock.sendMessage(msg.key.remoteJid, {
                image: imageBuffer,
                caption: "⚠️ Enhancement API unavailable, original image returned"
            });

        } catch (error: any) {
            console.error('[ENHANCE] Error:', error);
            return reply("❌ Enhancement failed!");
        }
    }
});

// WANTED POSTER
registerCommand({
    name: "wanted",
    description: "Create a wanted poster",
    category: "image",
    usage: "Send/reply to image with .wanted",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .wanted");
        }

        try {
            await reply("⏳ Creating wanted poster...");

            const base64 = imageBuffer.toString('base64');
            const imageUrl = `data:image/jpeg;base64,${base64}`;

            const response = await axios.get(`https://api.popcat.xyz/wanted?image=${encodeURIComponent(imageUrl)}`, {
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

// WASTED (GTA effect)
registerCommand({
    name: "wasted",
    aliases: ["gta"],
    description: "Apply GTA wasted effect",
    category: "image",
    usage: "Send/reply to image with .wasted",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .wasted");
        }

        try {
            await reply("⏳ Applying wasted effect...");

            // Upload to temporary hosting
            const formData = new FormData();
            formData.append('file', new Blob([imageBuffer]), 'image.jpg');

            // Use Some-Random-API
            const response = await axios.get('https://some-random-api.com/canvas/misc/wasted', {
                params: { avatar: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` },
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "💀 WASTED 💀"
            });

        } catch (error: any) {
            console.error('[WASTED] Error:', error);
            return reply("❌ Failed to apply wasted effect!");
        }
    }
});

// TRIGGERED
registerCommand({
    name: "trigger",
    aliases: ["triggered"],
    description: "Apply triggered effect",
    category: "image",
    usage: "Send/reply to image with .trigger",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .trigger");
        }

        try {
            await reply("⏳ Getting triggered...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.get(`https://some-random-api.com/canvas/misc/triggered?avatar=data:image/jpeg;base64,${base64}`, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "😤 TRIGGERED 😤"
            });

        } catch (error: any) {
            console.error('[TRIGGER] Error:', error);
            return reply("❌ Failed to apply trigger effect!");
        }
    }
});

// CIRCLE
registerCommand({
    name: "circle",
    aliases: ["round"],
    description: "Make image circular",
    category: "image",
    usage: "Send/reply to image with .circle",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .circle");
        }

        try {
            await reply("⏳ Making circular...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api.popcat.xyz/circle', {
                image: base64
            }, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "⭕ Circular image"
            });

        } catch (error: any) {
            console.error('[CIRCLE] Error:', error);
            return reply("❌ Failed to make circular!");
        }
    }
});

// SEPIA
registerCommand({
    name: "sepia",
    description: "Apply sepia tone filter",
    category: "image",
    usage: "Send/reply to image with .sepia",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .sepia");
        }

        try {
            await reply("⏳ Applying sepia filter...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api.popcat.xyz/sepia', {
                image: base64
            }, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "📷 Sepia tone applied"
            });

        } catch (error: any) {
            console.error('[SEPIA] Error:', error);
            return reply("❌ Failed to apply sepia!");
        }
    }
});

// PIXELATE
registerCommand({
    name: "pixelate",
    aliases: ["pixel", "8bit"],
    description: "Pixelate an image",
    category: "image",
    usage: "Send/reply to image with .pixelate",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .pixelate");
        }

        try {
            await reply("⏳ Pixelating image...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api.popcat.xyz/pixelate', {
                image: base64
            }, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🎮 8-bit pixelated"
            });

        } catch (error: any) {
            console.error('[PIXELATE] Error:', error);
            return reply("❌ Failed to pixelate!");
        }
    }
});

// COLORIZE (B&W to Color)
registerCommand({
    name: "colorize",
    aliases: ["color", "colourize"],
    description: "Add color to black and white images",
    category: "image",
    usage: "Send/reply to image with .colorize",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .colorize");
        }

        try {
            await reply("⏳ Colorizing image... (this may take a moment)");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api-inference.huggingface.co/models/microsoft/Colorization', {
                inputs: base64
            }, {
                headers: { 'Authorization': 'Bearer hf_demo' },
                responseType: 'arraybuffer',
                timeout: 60000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "🎨 Colorized!"
            });

        } catch (error: any) {
            console.error('[COLORIZE] Error:', error);
            return reply("❌ Colorization failed! API might be unavailable.");
        }
    }
});
