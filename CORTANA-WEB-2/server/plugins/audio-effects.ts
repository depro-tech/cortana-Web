import { registerCommand } from "./types";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

// ═══════════════════════════════════════════════════════════
// AUDIO EFFECTS - Bass, Nightcore, Robot, Slow, Fast, etc.
// Ported from Anita-V4
// ═══════════════════════════════════════════════════════════

const AUDIO_EFFECTS = {
    bass: '-af equalizer=f=54:width_type=o:width=2:g=20',
    blown: '-af acrusher=.1:1:64:0:log',
    deep: '-af atempo=4/4,asetrate=44500*2/3',
    earrape: '-af volume=12',
    fast: '-filter:a "atempo=1.63,asetrate=44100"',
    fat: '-filter:a "atempo=1.6,asetrate=22100"',
    nightcore: '-filter:a atempo=1.06,asetrate=44100*1.25',
    reverse: '-filter_complex "areverse"',
    robot: '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"',
    slow: '-filter:a "atempo=0.7,asetrate=44100"',
    smooth: '-filter:v "minterpolate=\'mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120\'"',
    chipmunk: '-filter:a "atempo=0.5,asetrate=65100"',
    vibrato: '-af "vibrato=f=6.5:d=0.7"',
    echo: '-af "aecho=0.8:0.9:1000:0.3"',
    chorus: '-af "chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3"'
};

// Register all audio effect commands
Object.entries(AUDIO_EFFECTS).forEach(([effect, filter]) => {
    registerCommand({
        name: effect,
        description: `Apply ${effect} audio effect`,
        category: "audio",
        usage: `.${effect} (reply to audio)`,
        execute: async ({ msg, sock, reply, sessionId }) => {
            try {
                // Check if replying to audio
                const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                
                if (!quotedMsg) {
                    return reply(`❌ Reply to an audio/voice message!\n\nUsage: .${effect} (reply to audio)`);
                }

                const audioMsg = quotedMsg.audioMessage;
                if (!audioMsg) {
                    return reply("❌ Reply to an audio or voice message!");
                }

                await reply(`🎵 Processing ${effect} effect... Please wait`);

                // Download the audio
                const buffer = await downloadMediaMessage(
                    { key: msg.key, message: quotedMsg },
                    'buffer',
                    {}
                );

                if (!buffer) {
                    return reply("❌ Failed to download audio file");
                }

                // Create temp directory if not exists
                const tempDir = path.join(process.cwd(), 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const inputPath = path.join(tempDir, `input_${Date.now()}.mp3`);
                const outputPath = path.join(tempDir, `output_${effect}_${Date.now()}.mp3`);

                // Write buffer to file
                fs.writeFileSync(inputPath, buffer);

                // Process with ffmpeg
                const command = `ffmpeg -i "${inputPath}" ${filter} "${outputPath}"`;

                exec(command, async (error, stdout, stderr) => {
                    try {
                        // Clean up input file
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

                        if (error) {
                            console.error(`[${effect.toUpperCase()}] Error:`, error);
                            return reply(`❌ Failed to apply ${effect} effect. Make sure ffmpeg is installed.`);
                        }

                        if (!fs.existsSync(outputPath)) {
                            return reply(`❌ Failed to generate output file`);
                        }

                        // Read processed audio
                        const processedAudio = fs.readFileSync(outputPath);

                        // Send processed audio
                        await sock.sendMessage(msg.key.remoteJid!, {
                            audio: processedAudio,
                            mimetype: 'audio/mpeg',
                            ptt: audioMsg.ptt || false, // Maintain voice note status
                            fileName: `${effect}_audio.mp3`
                        }, { quoted: msg });

                        console.log(`[${effect.toUpperCase()}] ✅ Successfully processed audio`);

                        // Clean up output file
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

                    } catch (sendError: any) {
                        console.error(`[${effect.toUpperCase()}] Send error:`, sendError);
                        // Clean up on error
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    }
                });

            } catch (err: any) {
                console.error(`[${effect.toUpperCase()}] Error:`, err);
                return reply(`❌ Error: ${err.message}`);
            }
        }
    });
});

// Combined audio effects command with list
registerCommand({
    name: "audioeffect",
    aliases: ["aefx", "effect"],
    description: "Apply audio effects to voice/audio messages",
    category: "audio",
    usage: ".audioeffect <effect> (reply to audio)",
    execute: async ({ args, reply }) => {
        if (args.length === 0) {
            const effectsList = Object.keys(AUDIO_EFFECTS).map((e, i) => `${i + 1}. .${e}`).join('\n');
            return reply(
                `🎵 *AUDIO EFFECTS*\n\n` +
                `*Available effects:*\n${effectsList}\n\n` +
                `*Usage:*\n` +
                `• Reply to audio/voice: .bass\n` +
                `• Or use: .audioeffect bass (reply)`
            );
        }

        const effect = args[0].toLowerCase();
        if (!AUDIO_EFFECTS[effect]) {
            return reply(`❌ Unknown effect: ${effect}\n\nUse .audioeffect to see all effects`);
        }

        return reply(`Use .${effect} command directly by replying to audio`);
    }
});
