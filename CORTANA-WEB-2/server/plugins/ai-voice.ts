
import { registerCommand } from "./types";
import axios from "axios";
import { Buffer } from "buffer";

// TikTok Voice IDs mapping
const voices: { [key: string]: string } = {
    // Females
    "gal1": "en_us_001", // Classic Female
    "gal2": "en_us_002", // Female 2
    "gal3": "en_au_001", // Australian Female
    "lucy": "en_us_001",
    "lydia": "en_au_001",

    // Males
    "male1": "en_us_006", // Male 1
    "male2": "en_us_007", // Male 2 (Deep)
    "male3": "en_us_009", // Male 3
    "male4": "en_uk_001", // UK Male
    "edu": "en_uk_001",   // British (Educated)
    "victor": "en_us_007", // Deep
    "gemini": "en_us_006", // Standard

    // Characters
    "ghost": "en_us_ghostface",
    "chewy": "en_us_chewbacca",
};

async function generateTTS(text: string, voice: string): Promise<Buffer | null> {
    try {
        const response = await axios.post("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            text: text,
            voice: voice
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.data && response.data.data) {
            return Buffer.from(response.data.data, "base64");
        }
        return null;
    } catch (e: any) {
        console.error("TTS Error:", e.message);
        return null; // Fail gracefully
    }
}

// 1. Voice Gal Command
registerCommand({
    name: "voicegal",
    aliases: ["gal"],
    description: "Generate female AI voice. Usage: .voicegal <1-3> <text>",
    category: "ai-voice",
    execute: async ({ sock, args, reply, msg }) => {
        // Parse args: .voicegal 1 hello world
        const id = args[0];
        const text = args.slice(1).join(" ");

        if (!id || !text) return reply("❌ Usage: .voicegal <1/2/3> <text>");

        const voiceKey = `gal${id}`;
        const voiceId = voices[voiceKey];

        if (!voiceId) return reply("❌ Invalid Voice ID. Use 1, 2, or 3.");

        await reply(`🎙️ Generating Voice Gal ${id}...`);

        try {
            const audioBuffer = await generateTTS(text, voiceId);
            if (audioBuffer) {
                // Send audio
                await sock.sendMessage(msg.key.remoteJid!, {
                    audio: audioBuffer,
                    mimetype: "audio/mp4",
                    ptt: true // Send as voice note
                }, { quoted: msg });
            } else {
                await reply("❌ Failed to generate audio. API might be busy.");
            }
        } catch (e) {
            await reply("❌ Error generating voice.");
        }
    }
});

// 2. Male Voice Command
registerCommand({
    name: "malevoice",
    aliases: ["male"],
    description: "Generate male AI voice. Usage: .malevoice <1-4> <text>",
    category: "ai-voice",
    execute: async ({ sock, args, reply, msg }) => {
        const id = args[0];
        const text = args.slice(1).join(" ");

        if (!id || !text) return reply("❌ Usage: .malevoice <1/2/3/4> <text>");

        const voiceKey = `male${id}`;
        const voiceId = voices[voiceKey];

        if (!voiceId) return reply("❌ Invalid Voice ID. Use 1, 2, 3, or 4.");

        await reply(`🎙️ Generating Male Voice ${id}...`);

        try {
            const audioBuffer = await generateTTS(text, voiceId);
            if (audioBuffer) {
                await sock.sendMessage(msg.key.remoteJid!, {
                    audio: audioBuffer,
                    mimetype: "audio/mp4",
                    ptt: true
                }, { quoted: msg });
            } else {
                await reply("❌ Failed to generate audio.");
            }
        } catch (e) {
            await reply("❌ Error generating voice.");
        }
    }
});

// 3. Named Voice Commands (Lucy, Lydia, Edu, Victor, Gemini)
const namedVoices = ["lucy", "lydia", "edu", "victor", "gemini"];

namedVoices.forEach(name => {
    registerCommand({
        name: name,
        description: `Generate ${name}'s voice`,
        category: "ai-voice",
        execute: async ({ sock, args, reply, msg }) => {
            const text = args.join(" ");
            if (!text) return reply(`❌ Please provide text for ${name} to speak.`);

            const voiceId = voices[name];
            await reply(`🎙️ ${name.charAt(0).toUpperCase() + name.slice(1)} is speaking...`);

            const audioBuffer = await generateTTS(text, voiceId);
            if (audioBuffer) {
                await sock.sendMessage(msg.key.remoteJid!, {
                    audio: audioBuffer,
                    mimetype: "audio/mp4",
                    ptt: true
                }, { quoted: msg });
            } else {
                await reply("❌ Voice generation failed.");
            }
        }
    });
});
