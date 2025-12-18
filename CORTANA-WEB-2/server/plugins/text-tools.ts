import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// TEXT MANIPULATION & TOOLS
// ═══════════════════════════════════════════════════════════════

// FANCY TEXT
registerCommand({
    name: "fancy",
    aliases: ["fancytext", "style"],
    description: "Convert text to fancy styles",
    category: "text",
    usage: ".fancy <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .fancy Hello World");

        try {
            const response = await axios.get(`https://api.popcat.xyz/textstyle?text=${encodeURIComponent(text)}`, {
                timeout: 10000
            });

            if (response.data) {
                let message = "✨ *Fancy Text Styles:*\n\n";
                Object.entries(response.data).slice(0, 15).forEach(([style, styledText]) => {
                    message += `${styledText}\n`;
                });
                return reply(message);
            }

            return reply("❌ Failed to generate fancy text!");
        } catch (error: any) {
            console.error('[FANCY] Error:', error);
            return reply("❌ Text styling failed!");
        }
    }
});

// REVERSE TEXT
registerCommand({
    name: "reverse",
    aliases: ["rev"],
    description: "Reverse text",
    category: "text",
    usage: ".reverse <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .reverse Hello");

        const reversed = text.split('').reverse().join('');
        return reply(`🔄 *Reversed:*\n\n${reversed}`);
    }
});

// BINARY ENCODING
registerCommand({
    name: "binary",
    description: "Convert text to binary",
    category: "text",
    usage: ".binary <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .binary Hello");

        const binary = text.split('').map(char =>
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join(' ');

        return reply(`💾 *Binary:*\n\n${binary}`);
    }
});

// MORSE CODE
registerCommand({
    name: "morse",
    description: "Convert text to morse code",
    category: "text",
    usage: ".morse <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .morse SOS");

        const morseMap: { [key: string]: string } = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', ' ': '/'
        };

        const morse = text.toUpperCase().split('').map(char =>
            morseMap[char] || char
        ).join(' ');

        return reply(`📡 *Morse Code:*\n\n${morse}`);
    }
});

// EMOJI MIX
registerCommand({
    name: "emojimix",
    aliases: ["mixemoji"],
    description: "Mix two emojis",
    category: "text",
    usage: ".emojimix <emoji1> <emoji2>",
    execute: async ({ args, reply, sock, msg }) => {
        if (args.length < 2) return reply("❌ Provide two emojis!\n\nUsage: .emojimix 😂 ❤️");

        const emoji1 = encodeURIComponent(args[0]);
        const emoji2 = encodeURIComponent(args[1]);

        try {
            const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${emoji1}_${emoji2}`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data?.results && response.data.results.length > 0) {
                const mixedEmoji = response.data.results[0].url;
                await sock.sendMessage(msg.key.remoteJid, {
                    sticker: { url: mixedEmoji }
                });
                return;
            }

            return reply("❌ Could not mix these emojis!");
        } catch (error: any) {
            console.error('[EMOJIMIX] Error:', error);
            return reply("❌ Emoji mix failed!");
        }
    }
});

// SIMPLE ENCRYPTION
registerCommand({
    name: "encrypt",
    description: "Simple text encryption",
    category: "text",
    usage: ".encrypt <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .encrypt secret");

        // Simple Base64 encoding
        const encrypted = Buffer.from(text).toString('base64');
        return reply(`🔒 *Encrypted:*\n\n${encrypted}\n\n_Use .decrypt to decode_`);
    }
});

// SIMPLE DECRYPTION
registerCommand({
    name: "decrypt",
    description: "Simple text decryption",
    category: "text",
    usage: ".decrypt <encrypted text>",
    execute: async ({ args, reply }) => {
        const encrypted = args.join(" ").trim();
        if (!encrypted) return reply("❌ Provide encrypted text!\n\nUsage: .decrypt <base64>");

        try {
            const decrypted = Buffer.from(encrypted, 'base64').toString('utf-8');
            return reply(`🔓 *Decrypted:*\n\n${decrypted}`);
        } catch {
            return reply("❌ Invalid encrypted text!");
        }
    }
});

// URL SHORTENER
registerCommand({
    name: "shorten",
    aliases: ["shorturl", "tinyurl"],
    description: "Shorten a URL",
    category: "text",
    usage: ".shorten <url>",
    execute: async ({ args, reply }) => {
        const url = args[0];
        if (!url) return reply("❌ Provide a URL!\n\nUsage: .shorten https://example.com");

        try {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
                timeout: 10000
            });

            if (response.data) {
                return reply(`🔗 *Shortened URL:*\n\n${response.data}`);
            }

            return reply("❌ Failed to shorten URL!");
        } catch (error: any) {
            console.error('[SHORTEN] Error:', error);
            return reply("❌ URL shortening failed!");
        }
    }
});

// READ MORE TEXT
registerCommand({
    name: "readmore",
    description: "Add 'read more' to long text",
    category: "text",
    usage: ".readmore <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .readmore your long text here");

        const readMore = String.fromCharCode(8206).repeat(4001);
        return reply(text + readMore);
    }
});

// FLIP TEXT
registerCommand({
    name: "flip",
    aliases: ["fliptext"],
    description: "Flip text upside down",
    category: "text",
    usage: ".flip <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ").trim();
        if (!text) return reply("❌ Provide text!\n\nUsage: .flip Hello");

        const flipMap: { [key: string]: string } = {
            'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
            'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
            'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
            'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
            'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ',
            'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N',
            'O': 'O', 'P': 'Ԁ', 'Q': 'b', 'R': 'ɹ', 'S': 'S', 'T': '┴', 'U': '∩',
            'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
            '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ',
            '8': '8', '9': '6', '0': '0',
            '.': '˙', ',': '\'', '!': '¡', '?': '¿', '&': '⅋'
        };

        const flipped = text.split('').reverse().map(char =>
            flipMap[char] || char
        ).join('');

        return reply(`🔃 *Flipped Text:*\n\n${flipped}`);
    }
});
