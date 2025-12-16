import { registerCommand } from "./types";

registerCommand({
    name: "utility",
    description: "Utility menu",
    category: "utility",
    execute: async ({ reply }) => {
        await reply("🔧 Utility Commands:\n- ping\n- uptime\n- delete\n- quoting\n- listpc\n- listgc");
    }
});

registerCommand({
    name: "delete",
    aliases: ["del"],
    description: "Delete a message",
    category: "utility",
    execute: async ({ sock, msg, reply }) => {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (!quotedId) return reply("Please reply to a message to delete it");

        await sock.sendMessage(msg.key.remoteJid!, {
            delete: {
                remoteJid: msg.key.remoteJid!,
                fromMe: false,
                id: quotedId,
                participant: quotedParticipant
            }
        });
    }
});

registerCommand({
    name: "tomp3",
    description: "Convert video to audio",
    category: "converter",
    execute: async ({ reply }) => {
        await reply("🎵 Converter features require FFmpeg server-side processing which is simulates here. Send a video and I will (pretend to) convert it!");
    }
});

registerCommand({
    name: "togif",
    description: "Convert video to GIF",
    category: "converter",
    execute: async ({ reply }) => {
        await reply("🎞️ Converting to GIF... (Feature coming with ImageMagick integration)");
    }
});

registerCommand({
    name: "shorten",
    description: "Shorten URL",
    category: "converter",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url) return reply("Please provide a URL");
        await reply(`🔗 Shortened URL: https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)} (Mock)`);
    }
});

registerCommand({
    name: "base64",
    description: "Encode text to Base64",
    category: "converter",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("Please provide text");
        const encoded = Buffer.from(text).toString('base64');
        await reply(`🔠 Base64: ${encoded}`);
    }
});

registerCommand({
    name: "dbase64",
    description: "Decode Base64",
    category: "converter",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("Please provide text");
        const decoded = Buffer.from(text, 'base64').toString('utf-8');
        await reply(`🔠 Decoded: ${decoded}`);
    }
});

registerCommand({
    name: "qr",
    description: "Generate QR Code",
    category: "converter",
    execute: async ({ args, sock, msg }) => {
        const text = args.join(" ");
        if (!text) {
            await sock.sendMessage(msg.key.remoteJid!, { text: "Please supply text for QR" });
            return;
        }
        await sock.sendMessage(msg.key.remoteJid!, {
            image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}` },
            caption: "📱 Here is your QR Code"
        });
    }
});
