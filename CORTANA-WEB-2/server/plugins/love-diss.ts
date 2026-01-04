import { registerCommand } from "./types";
import axios from "axios";

// ════════════════════════════════════════════════════════════════════════
//                                LOVE SECTION
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "pickup",
    description: "Get a cheesy pickup line",
    category: "lovediss",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://vinuxd.vercel.app/api/pickup");
            await reply(`😉 *Pickup Line*\n\n${res.data.pickup}`);
        } catch {
            await reply("😉 Are you a magician? Because whenever I look at you, everyone else disappears.");
        }
    }
});

registerCommand({
    name: "lovequote",
    description: "Get a romantic love quote",
    category: "lovediss",
    execute: async ({ reply }) => {
        const quotes = [
            "I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more.",
            "You are my best friend, my human diary and my other half. You mean the world to me and I love you.",
            "If I know what love is, it is because of you.",
            "I swear I couldn't love you more than I do right now, and yet I know I will tomorrow.",
            "To the world you may be one person, but to one person you are the world.",
            "You are the last thought in my mind before I drift off to sleep and the first thought when I wake up each morning.",
            "I love you not only for what you are, but for what I am when I am with you.",
            "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
            "Thinking of you keeps me awake. Dreaming of you keeps me asleep. Being with you keeps me alive."
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        await reply(`💝 *Love Quote*\n\n"${quote}"`);
    }
});

registerCommand({
    name: "romantic",
    description: "Send a romantic message",
    category: "lovediss",
    execute: async ({ reply }) => {
        const msgs = [
            "My love for you is a journey, starting at forever and ending at never.",
            "I wish I could turn back the clock. I'd find you sooner and love you longer.",
            "I want to be the reason behind your smile because surely you are the reason behind mine.",
            "Every love story is beautiful, but ours is my favorite.",
            "You are my paradise and I would happily get stranded on you for a lifetime."
        ];
        await reply(`💖 *Romantic Message*\n\n${msgs[Math.floor(Math.random() * msgs.length)]}`);
    }
});

registerCommand({
    name: "flirt",
    description: "Send a flirty text",
    category: "lovediss",
    execute: async ({ reply }) => {
        const flirts = [
            "I’m not a photographer, but I can picture us together.",
            "Do you believe in love at first sight, or should I walk by again?",
            "If being sexy was a crime, you'd be guilty as charged.",
            "Is your name Google? Because you have everything I've been searching for.",
            "I sat near you on purpose... just saying."
        ];
        await reply(`😏 *Flirt*\n\n${flirts[Math.floor(Math.random() * flirts.length)]}`);
    }
});

registerCommand({
    name: "missyou",
    description: "I miss you message",
    category: "lovediss",
    execute: async ({ reply }) => {
        const msgs = [
            "I miss you like the sun misses the flowers in the depths of winter.",
            "A thousand miles between us won't stop me from missing you every day.",
            "I only miss you when I'm breathing.",
            "Thinking of you is easy, I do it every day. Missing you is the heartache that never goes away."
        ];
        await reply(`💔 *Miss You*\n\n${msgs[Math.floor(Math.random() * msgs.length)]}`);
    }
});

registerCommand({
    name: "kiss",
    description: "Kiss someone",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply("💋 Mwah! (Tag someone to kiss them)");
        await sock.sendMessage(msg.key.remoteJid!, {
            text: `😘 *Kiss*\n\n@${msg.key.participant?.split('@')[0]} kisses @${mentioned.split('@')[0]}! Mwah!`,
            mentions: [mentioned, msg.key.participant!]
        });
    }
});

registerCommand({
    name: "hug",
    description: "Hug someone",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply("🤗 Sending you a big hug!");
        await sock.sendMessage(msg.key.remoteJid!, {
            text: `🤗 *Hug*\n\n@${msg.key.participant?.split('@')[0]} gives a warm hug to @${mentioned.split('@')[0]}!`,
            mentions: [mentioned, msg.key.participant!]
        });
    }
});

registerCommand({
    name: "propose",
    description: "Propose to someone",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply("💍 Who do you want to marry? Tag them!");
        await sock.sendMessage(msg.key.remoteJid!, {
            text: `💍 *Proposal*\n\n@${msg.key.participant?.split('@')[0]} gets down on one knee...\n\n@${mentioned.split('@')[0]}, will you marry me? 🥺`,
            mentions: [mentioned, msg.key.participant!]
        });
    }
});

registerCommand({
    name: "wedding",
    description: "Hold a wedding ceremony",
    category: "lovediss",
    execute: async ({ reply }) => {
        await reply(`💒 *Wedding Ceremony*\n\nDearly beloved, we are gathered here today... 🥂✨\n\n(Tag two people next time to marry them!)`);
    }
});

registerCommand({
    name: "ship",
    description: "Calculate love percentage",
    category: "lovediss",
    execute: async ({ reply, args, msg, sock }) => {
        let p1 = msg.key.participant!;
        let p2 = args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!p2) return reply("❌ Tag someone to test compatibility!");

        const score = Math.floor(Math.random() * 101);
        let text = "";

        if (score > 90) text = "🔥 True Love!";
        else if (score > 70) text = "❤️ Great Match!";
        else if (score > 40) text = "🤔 Maybe works?";
        else text = "💀 Toxic.";

        await sock.sendMessage(msg.key.remoteJid!, {
            text: `💘 *Love Calculator*\n\n@${p1.split('@')[0]} + @${p2.split('@')[0]}\n\nScore: *${score}%*\nVerdict: ${text}`,
            mentions: [p1, p2]
        });
    }
});


// ════════════════════════════════════════════════════════════════════════
//                                DISS SECTION
// ════════════════════════════════════════════════════════════════════════

registerCommand({
    name: "insult",
    description: "Generate a huge insult",
    category: "lovediss",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get("https://evilinsult.com/generate_insult.php?lang=en&type=json");
            await reply(`🔥 *Burn!*\n\n${res.data.insult}`);
        } catch {
            await reply("🔥 I'd insult you, but nature already did a terrible job.");
        }
    }
});

registerCommand({
    name: "roast",
    description: "Hard roast",
    category: "lovediss",
    execute: async ({ reply }) => {
        const roasts = [
            "You have the perfect face for radio.",
            "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
            "Your secrets are safe with me. I never even listen when you tell me them.",
            "I'd agree with you but then we'd both be wrong.",
            "Someday you’ll go far... and I hope you stay there.",
            "You bring everyone so much joy... when you leave the room."
        ];
        await reply(`💀 *Roast*\n\n${roasts[Math.floor(Math.random() * roasts.length)]}`);
    }
});

registerCommand({
    name: "breakup",
    description: "Send a breakup message",
    category: "lovediss",
    execute: async ({ reply }) => {
        const msgs = [
            "It's not you, it's me. Actually, it is you. You're the problem.",
            "Our relationship is like a broken pencil. Pointless.",
            "I think we should see other people. I mean, I already am, so you should too.",
            "Welcome to Dumpsville. Population: You.",
            "I've found someone who treats me like I deserve... their name is 'Peace and Quiet'."
        ];
        await reply(`💔 *Break Up*\n\n${msgs[Math.floor(Math.random() * msgs.length)]}`);
    }
});

registerCommand({
    name: "hate",
    description: "Hate message",
    category: "lovediss",
    execute: async ({ reply }) => {
        const msgs = [
            "I don't hate you, I just hope your charger only works at a specific angle.",
            "If I had a face like yours, I'd sue my parents.",
            "I look at you and wonder where God went wrong.",
            "You are the reason why aliens won't talk to us."
        ];
        await reply(`🤬 *Hate*\n\n${msgs[Math.floor(Math.random() * msgs.length)]}`);
    }
});

registerCommand({
    name: "trash",
    description: "Call someone trash",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        await sock.sendMessage(msg.key.remoteJid!, { text: "🗑️ *Trash Alert*\n\nTaking out the garbage..." }, { quoted: msg });
    }
});

registerCommand({
    name: "clown",
    description: "Call someone a clown",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        await sock.sendMessage(msg.key.remoteJid!, { text: "🤡 *Clown Detected*\n\nHonk honk!" }, { quoted: msg });
    }
});

registerCommand({
    name: "idiot",
    description: "Call someone an idiot",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        await sock.sendMessage(msg.key.remoteJid!, { text: "🥴 *Idiot Alert*\n\nIntelligence not found." }, { quoted: msg });
    }
});

registerCommand({
    name: "fake",
    description: "Expose fake people",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        await sock.sendMessage(msg.key.remoteJid!, { text: "🎭 *Fake Friend Detected*\n\nPlastic is bad for the environment." }, { quoted: msg });
    }
});

registerCommand({
    name: "loser",
    description: "Call someone a loser",
    category: "lovediss",
    execute: async ({ reply, msg, sock }) => {
        await sock.sendMessage(msg.key.remoteJid!, { text: "📉 *L*" }, { quoted: msg });
    }
});
