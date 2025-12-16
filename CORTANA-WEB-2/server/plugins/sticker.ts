import { registerCommand } from "./types";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Helper to create temp directory
const ensureTempDir = () => {
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
};

registerCommand({
    name: "sticker",
    aliases: ["s"],
    description: "Create sticker from image/video",
    category: "sticker",
    execute: async ({ sock, msg, args, reply }) => {
        const jid = msg.key.remoteJid!;
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = msg.message?.imageMessage || quotedMsg?.imageMessage;
        const videoMsg = msg.message?.videoMessage || quotedMsg?.videoMessage;

        if (!imageMsg && !videoMsg) {
            return reply("📷 Please send or reply to an image/video with .sticker");
        }

        let inputFile = "";
        let outputFile = "";

        try {
            await reply("🎨 Creating sticker...");

            let mediaMsg: any;
            if (msg.message?.imageMessage || msg.message?.videoMessage) {
                mediaMsg = msg;
            } else {
                mediaMsg = {
                    key: {
                        remoteJid: jid,
                        id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId,
                        participant: msg.message?.extendedTextMessage?.contextInfo?.participant
                    },
                    message: imageMsg ? { imageMessage: quotedMsg?.imageMessage } : { videoMessage: quotedMsg?.videoMessage }
                };
            }

            const buffer = await downloadMediaMessage(
                mediaMsg,
                "buffer",
                {},
                {
                    logger: console as any, // Simple logger shim
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            const tempDir = ensureTempDir();
            const timestamp = Date.now();
            inputFile = path.join(tempDir, `input_${timestamp}.${imageMsg ? 'jpg' : 'mp4'}`);
            outputFile = path.join(tempDir, `sticker_${timestamp}.webp`);

            fs.writeFileSync(inputFile, buffer);

            const { execSync } = await import("child_process");

            if (imageMsg) {
                execSync(`ffmpeg -i "${inputFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000" -c:v libwebp -quality 80 "${outputFile}"`, { stdio: 'pipe' });
            } else {
                execSync(`ffmpeg -i "${inputFile}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(512-iw)/2:(512-ih)/2:color=#00000000,fps=15" -c:v libwebp -loop 0 -preset default -an -vsync 0 "${outputFile}"`, { stdio: 'pipe' });
            }

            const stickerBuffer = fs.readFileSync(outputFile);
            await sock.sendMessage(jid, { sticker: stickerBuffer });

        } catch (error: any) {
            console.error("Sticker creation error:", error);
            await reply("❌ Failed to create sticker. Ensure ffmpeg is installed.");
        } finally {
            try {
                if (inputFile && fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                if (outputFile && fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            } catch { }
        }
    }
});

registerCommand({
    name: "toimg",
    description: "Convert sticker to image",
    category: "sticker",
    execute: async ({ reply }) => {
        await reply("Feature coming soon (requires specialized converter)");
    }
});
