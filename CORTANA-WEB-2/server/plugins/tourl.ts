import { registerCommand } from "./types";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { uploadMedia, uploadToTelegraph, uploadToCatbox, webpToMp4 } from "../utils/media-uploader";

// ═══════════════════════════════════════════════════════════════
// TOURL COMMAND - Convert media to URL
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tourl",
    aliases: ["url", "upload", "tolink", "geturl"],
    description: "Convert replied media to URL",
    category: "tools",
    usage: ".tourl (reply to image/video/sticker)",
    execute: async ({ msg, reply, sock }) => {
        const jid = msg.key.remoteJid!;

        // Check for quoted message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            return reply("*📤 TOURL - Media to URL*\n\nReply to an image, video, sticker, or document with *.tourl* to get a shareable link.");
        }

        try {
            // React to show processing
            try {
                await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });
            } catch (e) { }

            await reply("⏳ *Uploading media...*");

            // Determine media type
            let mediaType = "";
            let mediaMessage: any = null;

            if (quotedMsg.imageMessage) {
                mediaType = "image";
                mediaMessage = quotedMsg.imageMessage;
            } else if (quotedMsg.videoMessage) {
                mediaType = "video";
                mediaMessage = quotedMsg.videoMessage;
            } else if (quotedMsg.stickerMessage) {
                mediaType = "sticker";
                mediaMessage = quotedMsg.stickerMessage;
            } else if (quotedMsg.documentMessage) {
                mediaType = "document";
                mediaMessage = quotedMsg.documentMessage;
            } else if (quotedMsg.audioMessage) {
                mediaType = "audio";
                mediaMessage = quotedMsg.audioMessage;
            } else {
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
                return reply("❌ Please reply to an image, video, sticker, audio, or document.");
            }

            // Download the media
            const buffer = await downloadMediaMessage(
                { message: quotedMsg, key: msg.key },
                "buffer",
                {}
            );

            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
                return reply("❌ Failed to download media.");
            }

            console.log(`[TOURL] Uploading ${mediaType} (${(buffer.length / 1024).toFixed(1)} KB)`);

            // Upload the media
            const result = await uploadMedia(buffer as Buffer);

            // Success reaction
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

            // Send result
            const response = `*📤 UPLOAD SUCCESSFUL*\n\n` +
                `📁 *Type:* ${mediaType}\n` +
                `🌐 *Service:* ${result.service}\n` +
                `📦 *Size:* ${(buffer.length / 1024).toFixed(1)} KB\n\n` +
                `🔗 *URL:*\n${result.url}`;

            await reply(response);

            console.log(`[TOURL] ✅ Uploaded to ${result.service}: ${result.url}`);

        } catch (error: any) {
            console.error('[TOURL] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply(`❌ Upload failed: ${error.message}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// STICKERTOMP4 COMMAND - Convert animated sticker to MP4
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "stickertomp4",
    aliases: ["stickervideo", "webptomp4", "stkmp4"],
    description: "Convert animated sticker to MP4 video",
    category: "tools",
    usage: ".stickertomp4 (reply to animated sticker)",
    execute: async ({ msg, reply, sock }) => {
        const jid = msg.key.remoteJid!;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.stickerMessage) {
            return reply("*🎬 STICKER TO MP4*\n\nReply to an animated sticker (WebP) with *.stickertomp4* to convert it to MP4 video.");
        }

        try {
            await sock.sendMessage(jid, { react: { text: "🔄", key: msg.key } }).catch(() => { });
            await reply("🔄 *Converting sticker to video...*");

            // Download sticker
            const buffer = await downloadMediaMessage(
                { message: quotedMsg, key: msg.key },
                "buffer",
                {}
            );

            if (!buffer) {
                return reply("❌ Failed to download sticker.");
            }

            // Convert WebP to MP4
            const mp4Url = await webpToMp4(buffer as Buffer);

            // Send the MP4 video
            await sock.sendMessage(jid, {
                video: { url: mp4Url },
                caption: "🎬 *Converted from sticker*",
                mimetype: "video/mp4"
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

        } catch (error: any) {
            console.error('[STICKERTOMP4] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply(`❌ Conversion failed: ${error.message}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TELEGRAPH COMMAND - Upload image to Telegraph specifically
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "telegraph",
    aliases: ["tg", "tgph"],
    description: "Upload image to Telegraph",
    category: "tools",
    usage: ".telegraph (reply to image)",
    execute: async ({ msg, reply, sock }) => {
        const jid = msg.key.remoteJid!;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg?.imageMessage) {
            return reply("*📸 TELEGRAPH UPLOAD*\n\nReply to an image with *.telegraph* to upload it to Telegraph (permanent hosting).");
        }

        try {
            await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } }).catch(() => { });
            await reply("⏳ *Uploading to Telegraph...*");

            const buffer = await downloadMediaMessage(
                { message: quotedMsg, key: msg.key },
                "buffer",
                {}
            );

            if (!buffer) {
                return reply("❌ Failed to download image.");
            }

            const url = await uploadToTelegraph(buffer as Buffer);

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });
            await reply(`*📸 TELEGRAPH UPLOAD*\n\n✅ Uploaded successfully!\n\n🔗 ${url}`);

        } catch (error: any) {
            console.error('[TELEGRAPH] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply(`❌ Upload failed: ${error.message}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// CATBOX COMMAND - Upload to Catbox.moe (permanent)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "catbox",
    aliases: ["cb", "catb"],
    description: "Upload media to Catbox.moe",
    category: "tools",
    usage: ".catbox (reply to media)",
    execute: async ({ msg, reply, sock }) => {
        const jid = msg.key.remoteJid!;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMsg) {
            return reply("*📦 CATBOX UPLOAD*\n\nReply to any media with *.catbox* to upload it to Catbox.moe (permanent hosting).");
        }

        // Get the media message
        const mediaMessage = quotedMsg.imageMessage ||
            quotedMsg.videoMessage ||
            quotedMsg.audioMessage ||
            quotedMsg.documentMessage ||
            quotedMsg.stickerMessage;

        if (!mediaMessage) {
            return reply("❌ Please reply to an image, video, audio, sticker, or document.");
        }

        try {
            await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } }).catch(() => { });
            await reply("⏳ *Uploading to Catbox...*");

            const buffer = await downloadMediaMessage(
                { message: quotedMsg, key: msg.key },
                "buffer",
                {}
            );

            if (!buffer) {
                return reply("❌ Failed to download media.");
            }

            const url = await uploadToCatbox(buffer as Buffer);

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });
            await reply(`*📦 CATBOX UPLOAD*\n\n✅ Uploaded successfully!\n📦 Size: ${((buffer as Buffer).length / 1024).toFixed(1)} KB\n\n🔗 ${url}`);

        } catch (error: any) {
            console.error('[CATBOX] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });
            await reply(`❌ Upload failed: ${error.message}`);
        }
    }
});
