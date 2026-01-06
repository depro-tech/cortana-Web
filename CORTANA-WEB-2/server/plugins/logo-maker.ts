import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// LOGO MAKER - Generates stylized logo images using Raganork API
// ═══════════════════════════════════════════════════════════════

const LOGO_API_BASE = "https://raganork-network.vercel.app/api/logo";

// Helper to send image from URL
async function sendLogoFromUrl(sock: any, jid: string, url: string, caption?: string) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        await sock.sendMessage(jid, {
            image: response.data,
            caption: caption || ''
        });
    } catch (e: any) {
        console.error('[LOGO] Failed to send logo:', e.message);
        throw e;
    }
}

// Define all logo styles
const LOGO_STYLES: { num: number; category: string; style: number; desc: string }[] = [
    // Calligraphy (1-11)
    { num: 1, category: "calligraphy", style: 1, desc: "Calligraphy Style 1" },
    { num: 2, category: "calligraphy", style: 2, desc: "Calligraphy Style 2" },
    { num: 3, category: "calligraphy", style: 3, desc: "Calligraphy Style 3" },
    { num: 4, category: "calligraphy", style: 4, desc: "Calligraphy Style 4" },
    { num: 5, category: "calligraphy", style: 5, desc: "Calligraphy Style 5" },
    { num: 6, category: "calligraphy", style: 6, desc: "Calligraphy Style 6" },
    { num: 7, category: "calligraphy", style: 7, desc: "Calligraphy Style 7" },
    { num: 8, category: "calligraphy", style: 8, desc: "Calligraphy Style 8" },
    { num: 9, category: "calligraphy", style: 9, desc: "Calligraphy Style 9" },
    { num: 10, category: "calligraphy", style: 10, desc: "Calligraphy Style 10" },
    { num: 11, category: "calligraphy", style: 11, desc: "Calligraphy Style 11" },

    // Beast (12-13)
    { num: 12, category: "beast", style: 1, desc: "Beast Style 1" },
    { num: 13, category: "beast", style: 2, desc: "Beast Style 2" },

    // PUBG (14-19)
    { num: 14, category: "pubg", style: 1, desc: "PUBG Style 1" },
    { num: 15, category: "pubg", style: 2, desc: "PUBG Style 2" },
    { num: 16, category: "pubg", style: 3, desc: "PUBG Style 3" },
    { num: 17, category: "pubg", style: 4, desc: "PUBG Style 4" },
    { num: 18, category: "pubg", style: 5, desc: "PUBG Style 5" },
    { num: 19, category: "pubg", style: 6, desc: "PUBG Style 6" },

    // RRR (20-25)
    { num: 20, category: "rrr", style: 1, desc: "RRR Style 1" },
    { num: 21, category: "rrr", style: 2, desc: "RRR Style 2" },
    { num: 22, category: "rrr", style: 3, desc: "RRR Style 3" },
    { num: 23, category: "rrr", style: 4, desc: "RRR Style 4" },
    { num: 24, category: "rrr", style: 5, desc: "RRR Style 5" },
    { num: 25, category: "rrr", style: 7, desc: "RRR Style 7" },

    // Free Fire (26-27)
    { num: 26, category: "freefire", style: 1, desc: "Free Fire Style 1" },
    { num: 27, category: "freefire", style: 2, desc: "Free Fire Style 2" },

    // India (28-29)
    { num: 28, category: "india", style: 1, desc: "India Style 1" },
    { num: 29, category: "india", style: 2, desc: "India Style 2" },

    // Avengers (30-32)
    { num: 30, category: "avengers", style: 1, desc: "Avengers Style 1" },
    { num: 31, category: "avengers", style: 2, desc: "Avengers Style 2" },
    { num: 32, category: "avengers", style: 3, desc: "Avengers Style 3" },

    // Pushpa (33-34)
    { num: 33, category: "pushpa", style: 1, desc: "Pushpa Style 1" },
    { num: 34, category: "pushpa", style: 2, desc: "Pushpa Style 2" },

    // Master (35-37)
    { num: 35, category: "master", style: 1, desc: "Master Style 1" },
    { num: 36, category: "master", style: 2, desc: "Master Style 2" },
    { num: 37, category: "master", style: 3, desc: "Master Style 3" },

    // IPL (38-44)
    { num: 38, category: "ipl", style: 1, desc: "IPL Style 1" },
    { num: 39, category: "ipl", style: 2, desc: "IPL Style 2" },
    { num: 40, category: "ipl", style: 3, desc: "IPL Style 3" },
    { num: 41, category: "ipl", style: 4, desc: "IPL Style 4" },
    { num: 42, category: "ipl", style: 5, desc: "IPL Style 5" },
    { num: 43, category: "ipl", style: 6, desc: "IPL Style 6" },
    { num: 44, category: "ipl", style: 7, desc: "IPL Style 7" },

    // Dhoni (45)
    { num: 45, category: "dhoni", style: 1, desc: "Dhoni Style" },

    // Thalapathy/Vijay (46)
    { num: 46, category: "thalapathy", style: 1, desc: "Vijay/Thalapathy Style" },

    // Calligraphy 20 (47)
    { num: 47, category: "calligraphy", style: 20, desc: "Calligraphy Style 20" },

    // KGF (48-52)
    { num: 48, category: "kgf", style: 1, desc: "KGF Style 1" },
    { num: 49, category: "kgf", style: 2, desc: "KGF Style 2" },
    { num: 50, category: "kgf", style: 3, desc: "KGF Style 3" },
    { num: 51, category: "kgf", style: 4, desc: "KGF Style 4" },
    { num: 52, category: "kgf", style: 6, desc: "KGF Style 6" },
];

// Register all logo commands
for (const logo of LOGO_STYLES) {
    registerCommand({
        name: `${logo.num}logo`,
        description: logo.desc,
        category: "logomaker",
        execute: async ({ sock, msg, args, reply }) => {
            const text = args.join(" ");
            if (!text) {
                return await reply(`❌ Please provide text!\nExample: .${logo.num}logo Your Name`);
            }

            await reply(`⏳ Generating ${logo.desc}...`);

            const apiUrl = `${LOGO_API_BASE}/${logo.category}?style=${logo.style}&text=${encodeURIComponent(text)}`;

            try {
                const jid = msg.key.remoteJid!;
                await sendLogoFromUrl(sock, jid, apiUrl, `✨ ${logo.desc}`);
            } catch (error: any) {
                await reply(`❌ Failed to generate logo: ${error.message || 'Unknown error'}`);
            }
        }
    });
}
