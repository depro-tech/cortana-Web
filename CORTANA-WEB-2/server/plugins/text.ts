import { registerCommand } from "./types";

registerCommand({
    name: "fancy",
    description: "Make text fancy",
    category: "text",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("Please provide text");

        const map: Record<string, string> = {
            'a': 'α', 'b': 'в', 'c': '¢', 'd': '∂', 'e': 'є', 'f': 'ƒ', 'g': 'g', 'h': 'н', 'i': 'ι',
            'j': 'נ', 'k': 'к', 'l': 'ℓ', 'm': 'м', 'n': 'η', 'o': 'σ', 'p': 'ρ', 'q': 'q', 'r': 'я',
            's': 'ѕ', 't': 'т', 'u': 'υ', 'v': 'ν', 'w': 'ω', 'x': 'χ', 'y': 'у', 'z': 'z'
        };

        const fancy = text.toLowerCase().split('').map(c => map[c] || c).join('');
        await reply(`✨ *Fancy Text*\n\n${fancy}`);
    }
});

registerCommand({
    name: "reverse",
    description: "Reverse text",
    category: "text",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("Please provide text");
        await reply(text.split('').reverse().join(''));
    }
});

registerCommand({
    name: "spoiler",
    description: "Make spoiler text",
    category: "text",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("Please provide text");
        // WhatsApp spoiler hack
        const spoiler = "Warning! Spoiler below:\n" + "\u200B".repeat(4000) + text;
        await reply(spoiler);
    }
});

registerCommand({
    name: "logo",
    description: "Create Logo",
    category: "text",
    execute: async ({ args, sock, msg }) => {
        const text = args.join(" ");
        if (!text) return sock.sendMessage(msg.key.remoteJid!, { text: "Please provide text for logo" });

        // Using a public API for logo generation
        const url = `https://dummyimage.com/600x400/000/fff&text=${encodeURIComponent(text)}`;
        await sock.sendMessage(msg.key.remoteJid!, { image: { url }, caption: "🎨 Your Logo" });
    }
});
