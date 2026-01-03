import { registerCommand } from "./types";
import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const config = {
    botName: 'CORTANA MD'
};

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

// ChatGPT Command
registerCommand({
    name: "chatgpt",
    aliases: ["gpt", "ai", "ask"],
    description: "Ask ChatGPT anything",
    category: "ai",
    usage: ".chatgpt <question>",
    execute: async ({ args, reply }) => {
        const question = args.join(" ").trim();

        if (!question) {
            return reply("❌ Provide a question!\n\nUsage: .chatgpt what is AI?");
        }

        try {
            await reply("🤖 Thinking...");

            // Try multiple ChatGPT APIs
            const apis = [
                {
                    name: 'Hercai',
                    call: async () => {
                        const res = await axios.get(`https://hercai.onrender.com/v3/hercai?question=${encodeURIComponent(question)}`, { timeout: 30000 });
                        return res.data?.reply;
                    }
                },
                {
                    name: 'ShizoAPI',
                    call: async () => {
                        const res = await axios.get(`https://shizoapi.onrender.com/api/ai/chatgpt?q=${encodeURIComponent(question)}&apikey=shizo`, { timeout: 30000 });
                        return res.data?.result;
                    }
                },
                {
                    name: 'PopcatXYZ',
                    call: async () => {
                        const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}&owner=CORTANA&botname=CORTANA`, { timeout: 30000 });
                        return res.data?.response;
                    }
                }
            ];

            for (const api of apis) {
                try {
                    const response = await api.call();
                    if (response) {
                        return reply(`🤖 *ChatGPT*\n\n${response}`);
                    }
                } catch (e: any) {
                    console.error(`[ChatGPT] ${api.name} failed:`, e.message);
                }
            }

            return reply("❌ All AI APIs are currently unavailable. Try again later!");

        } catch (error: any) {
            console.error('[ChatGPT] Error:', error);
            return reply("❌ Failed to get AI response!");
        }
    }
});

// Nanobanana Image Generation API
const NANOBANANA_API = "https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/nanobanana";
const NANOBANANA_KEY = "free";

// AI Image Generation (Imagine) - NEW NANOBANANA API
registerCommand({
    name: "imagine",
    aliases: ["aiimage", "generate", "dalle"],
    description: "Generate AI images from text",
    category: "ai",
    usage: ".imagine <prompt>",
    execute: async ({ args, reply, sock, msg }) => {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a prompt to generate an image.\n\nUsage: .imagine a beautiful sunset over the ocean");

        try {
            await reply("🎨 Generating image with AI...");

            let imageUrl = null;

            // Try NEW nanobanana API first
            try {
                console.log('[IMAGINE] Trying nanobanana API...');
                const apiUrl = `${NANOBANANA_API}?apiKey=${NANOBANANA_KEY}&prompt=${encodeURIComponent(query)}`;
                const response = await axios.get(apiUrl, { timeout: 60000 });

                if (response.data?.imageUrl || response.data?.url || response.data?.image) {
                    imageUrl = response.data.imageUrl || response.data.url || response.data.image;
                    console.log('[IMAGINE] ✅ Success with nanobanana');
                }
            } catch (e: any) {
                console.error('[IMAGINE] Nanobanana failed:', e.message);
            }

            // Fallback to other APIs
            if (!imageUrl) {
                const fallbackApis = [
                    `https://api.popcat.xyz/dalle?prompt=${encodeURIComponent(query)}`,
                    `https://hercai.onrender.com/v3/dalle?prompt=${encodeURIComponent(query)}`
                ];

                for (const apiUrl of fallbackApis) {
                    try {
                        const response = await axios.get(apiUrl, { timeout: 30000 });
                        if (response.data?.url) {
                            imageUrl = response.data.url;
                            break;
                        } else if (response.data?.image) {
                            imageUrl = response.data.image;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }

            if (imageUrl) {
                await sock.sendMessage(msg.key.remoteJid, {
                    image: { url: imageUrl },
                    caption: `✅ *AI Generated Image*\n\n📝 Prompt: ${query}`
                }, { quoted: msg });
            } else {
                return reply("❌ Failed to generate image. All image generation APIs are currently unavailable.");
            }
        } catch (e: any) {
            console.error('[IMAGINE] Error:', e);
            return reply("❌ Failed to generate image. Try again!");
        }
    }
});


// Remove Background
registerCommand({
    name: "removebg",
    aliases: ["rmbg", "nobg"],
    description: "Remove background from image",
    category: "ai",
    usage: "Reply to image with .removebg",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .removebg");
        }

        try {
            await reply("⏳ Removing background...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.get(`https://api.popcat.xyz/removebg?image=data:image/jpeg;base64,${base64}`, {
                responseType: 'arraybuffer',
                timeout: 45000
            });

            await sock.sendMessage(msg.key.remoteJid, {
                image: Buffer.from(response.data),
                caption: "✅ Background removed!"
            });

        } catch (error: any) {
            console.error('[REMOVEBG] Error:', error);
            return reply("❌ Failed to remove background! API might be unavailable.");
        }
    }
});

// OCR - Text Extraction
registerCommand({
    name: "ocr",
    aliases: ["readtext", "extract"],
    description: "Extract text from images",
    category: "ai",
    usage: "Reply to image with .ocr",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .ocr");
        }

        try {
            await reply("⏳ Reading text from image...");

            const base64 = imageBuffer.toString('base64');
            const response = await axios.post('https://api.ocr.space/parse/image', {
                base64Image: `data:image/jpeg;base64,${base64}`,
                language: 'eng',
                isOverlayRequired: false
            }, {
                headers: {
                    'apikey': 'helloworld'
                },
                timeout: 30000
            });

            if (response.data?.ParsedResults?.[0]?.ParsedText) {
                const text = response.data.ParsedResults[0].ParsedText;
                if (text.trim()) {
                    return reply(`📝 *Extracted Text:*\n\n${text}`);
                } else {
                    return reply("❌ No text found in image!");
                }
            }

            return reply("❌ Failed to extract text!");

        } catch (error: any) {
            console.error('[OCR] Error:', error);
            return reply("❌ Text extraction failed!");
        }
    }
});

// AI Vision - Describe Images
registerCommand({
    name: "aivision",
    aliases: ["describe", "whatisthis"],
    description: "AI describes what's in an image",
    category: "ai",
    usage: "Reply to image with .aivision",
    execute: async ({ reply, sock, msg }) => {
        const imageBuffer = await getImageBuffer(msg, sock);
        if (!imageBuffer) {
            return reply("❌ Reply to an image with .aivision");
        }

        try {
            await reply("👁️ AI is analyzing the image...");

            const base64 = imageBuffer.toString('base64');

            const response = await axios.post(
                'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
                { inputs: base64 },
                {
                    headers: { 'Authorization': 'Bearer hf_demo' },
                    timeout: 30000
                }
            );

            if (response.data?.[0]?.generated_text) {
                const description = response.data[0].generated_text;
                return reply(`👁️ *AI Vision Analysis:*\n\n${description}`);
            }

            return reply("❌ Failed to analyze image!");

        } catch (error: any) {
            console.error('[AIVISION] Error:', error);
            return reply("❌ Image analysis failed! AI might be busy.");
        }
    }
});
