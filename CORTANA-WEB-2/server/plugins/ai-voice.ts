
import { registerCommand } from "./types";
import axios from "axios";
import { Buffer } from "buffer";

// Custom Voice Names mapped to TikTok Voice IDs
const voices: { [key: string]: { id: string; name: string; gender: string } } = {
    // Female Voices (Gals)
    "celline": { id: "en_us_001", name: "Celline", gender: "Female" },
    "olive": { id: "en_us_002", name: "Olive", gender: "Female" },
    "sandisiwe": { id: "en_au_001", name: "Sandisiwe", gender: "Female" },

    // Male Voices (Guys)
    "archie": { id: "en_us_006", name: "Archie 😂", gender: "Male" },
    "pedrodom": { id: "en_us_007", name: "Pedrodom", gender: "Male" },
    "brian": { id: "en_uk_001", name: "Brian", gender: "Male" },
    "dee": { id: "en_us_009", name: "DEE Brooz", gender: "Male" },

    // Character Voices (Fun)
    "ghost": { id: "en_us_ghostface", name: "Ghostface", gender: "Character" },
    "chewy": { id: "en_us_chewbacca", name: "Chewbacca", gender: "Character" },
    "rocket": { id: "en_us_rocket", name: "Rocket", gender: "Character" },
};

async function generateTTS(text: string, voiceId: string): Promise<Buffer | null> {
    try {
        const response = await axios.post("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            text: text,
            voice: voiceId
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 15000
        });

        if (response.data && response.data.data) {
            return Buffer.from(response.data.data, "base64");
        }
        return null;
    } catch (e: any) {
        console.error("TTS Generation Error:", e.message);
        return null;
    }
}

// Register all named voice commands dynamically
Object.entries(voices).forEach(([key, info]) => {
    registerCommand({
        name: key,
        description: `Speak as ${info.name} (${info.gender})`,
        category: "ai-voice",
        execute: async ({ sock, args, reply, msg }) => {
            const text = args.join(" ");
            if (!text) return reply(`❌ Usage: .${key} <text to speak>`);

            await reply(`🎙️ *${info.name}* is preparing to speak...`);

            try {
                const audioBuffer = await generateTTS(text, info.id);
                if (audioBuffer) {
                    await sock.sendMessage(msg.key.remoteJid!, {
                        audio: audioBuffer,
                        mimetype: "audio/mpeg",
                        ptt: false // Send as regular audio (MP3) for better playback
                    }, { quoted: msg });
                } else {
                    await reply("❌ Voice generation failed. Try again.");
                }
            } catch (e) {
                console.error(e);
                await reply("❌ Error generating voice.");
            }
        }
    });
});

// Convenience command to list all available voices
registerCommand({
    name: "voices",
    aliases: ["voicelist", "tts"],
    description: "List all available AI voices",
    category: "ai-voice",
    execute: async ({ reply }) => {
        const females = Object.entries(voices)
            .filter(([_, v]) => v.gender === "Female")
            .map(([k, v]) => `.${k} - ${v.name}`)
            .join("\n");

        const males = Object.entries(voices)
            .filter(([_, v]) => v.gender === "Male")
            .map(([k, v]) => `.${k} - ${v.name}`)
            .join("\n");

        const chars = Object.entries(voices)
            .filter(([_, v]) => v.gender === "Character")
            .map(([k, v]) => `.${k} - ${v.name}`)
            .join("\n");

        await reply(`🎙️ *CORTANA AI VOICES* 🎙️\n\n` +
            `👩 *Female Voices:*\n${females}\n\n` +
            `👨 *Male Voices:*\n${males}\n\n` +
            `🎭 *Character Voices:*\n${chars}\n\n` +
            `_Usage: .<voicename> <your text>_`);
    }
});
