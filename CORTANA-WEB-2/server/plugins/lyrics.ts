import { registerCommand } from "./types";
import axios from "axios";

registerCommand({
    name: "lyrics",
    description: "Get lyrics of a song (Usage: .lyrics song - artist)",
    category: "media",
    execute: async ({ reply, args, sock, msg }) => {
        const input = args.join(" ");
        if (!input) return reply("❌ Usage: .lyrics <song name> - <artist name>");

        let [songName, artistName] = input.split("-").map(s => s.trim());
        if (!artistName) {
            // If no artist provided, try to search with just song name or warn
            // For this API, artistName seems required or at least useful.
            // We'll proceed with empty string if undefined, or ask user.
            // However, flexible splitting is better.
            artistName = "";
        }

        if (!songName) return reply("❌ Please provide a song name!");

        await reply(`🔍 Searching lyrics for "${songName}"${artistName ? ` by ${artistName}` : ""}...`);

        try {
            const response = await axios.post(
                'https://scrapesoft-music-lyrics.p.rapidapi.com/api/lyrics',
                {
                    songName: songName,
                    artistName: artistName || " " // API might error on empty, giving it a space or trying just song
                },
                {
                    headers: {
                        'x-rapidapi-key': 'a0289f399cmsh40bc1c174015ecep18f822jsnd3db91d38782',
                        'x-rapidapi-host': 'scrapesoft-music-lyrics.p.rapidapi.com',
                        'Content-Type': 'application/json'
                    },
                    // Some APIs fail if unknown params are passed, but snippet had access_token query.
                    // We will omit it for now as RapidAPI key should suffice.
                }
            );

            const data = response.data;
            if (data && data.lyrics) {
                await sock.sendMessage(msg.key.remoteJid!, {
                    text: `🎤 *${data.songName || songName}*\n👤 *${data.artistName || artistName}*\n\n${data.lyrics}`,
                    contextInfo: {
                        externalAdReply: {
                            title: "Lyrics Search",
                            body: "Cortana Music",
                            thumbnailUrl: data.albumArt || "https://files.catbox.moe/if8sv8.mp3", // Fallback or audio url if art missing
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: msg });
            } else {
                await reply("❌ Lyrics not found. Please check the song/artist name.");
            }

        } catch (error: any) {
            console.error("[LYRICS] Error:", error.result || error.message);
            await reply("❌ Error fetching lyrics. The API might use a different format or the song wasn't found.");
        }
    }
});
