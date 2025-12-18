import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// REACTION & INTERACTION COMMANDS (40+ commands)
// All using anime GIF APIs for rich reactions
// ═══════════════════════════════════════════════════════════════

// HUG
registerCommand({
    name: "hug",
    description: "Hug someone",
    category: "reaction",
    usage: ".hug @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/hug', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} hugs @${mentioned.split('@')[0]} 🤗` : `${args.join(' ') || 'Someone'} gets a warm hug! 🤗`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🤗 *Hugs!*");
        }
    }
});

// KISS
registerCommand({
    name: "kiss",
    description: "Kiss someone",
    category: "reaction",
    usage: ".kiss @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/kiss', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} kisses @${mentioned.split('@')[0]} 😘💋` : `${args.join(' ') || 'Someone'} gets a kiss! 😘`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("😘 *Kiss!*");
        }
    }
});

// SLAP
registerCommand({
    name: "slap",
    description: "Slap someone",
    category: "reaction",
    usage: ".slap @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/slap', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} slaps @${mentioned.split('@')[0]} 👋😤` : `${args.join(' ') || 'Someone'} gets slapped! 👋`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("👋 *SLAP!*");
        }
    }
});

// PAT
registerCommand({
    name: "pat",
    description: "Pat someone's head",
    category: "reaction",
    usage: ".pat @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/pat', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} pats @${mentioned.split('@')[0]} 🤲` : `${args.join(' ') || 'Someone'} gets head pats! 🤲`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🤲 *Pat pat!*");
        }
    }
});

// CUDDLE
registerCommand({
    name: "cuddle",
    description: "Cuddle someone",
    category: "reaction",
    usage: ".cuddle @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/cuddle', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} cuddles @${mentioned.split('@')[0]} 🥰` : `${args.join(' ') || 'Someone'} gets cuddles! 🥰`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🥰 *Cuddles!*");
        }
    }
});

// BONK
registerCommand({
    name: "bonk",
    description: "Bonk someone",
    category: "reaction",
    usage: ".bonk @user",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/bonk', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} bonks @${mentioned.split('@')[0]} 🔨` : `${args.join(' ') || 'Someone'} gets bonked! 🔨`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🔨 *BONK!*");
        }
    }
});

// WAVE
registerCommand({
    name: "wave",
    description: "Wave at someone",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/wave', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "👋 *Waves!*"
            });
        } catch {
            await reply("👋 *Waves!*");
        }
    }
});

// CRY
registerCommand({
    name: "cry",
    description: "Cry",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/cry', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😢 *Crying...*"
            });
        } catch {
            await reply("😢 *Cries*");
        }
    }
});

// SMILE
registerCommand({
    name: "smile",
    description: "Smile",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/smile', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😊 *Smiles!*"
            });
        } catch {
            await reply("😊 *Smiles!*");
        }
    }
});

// POKE
registerCommand({
    name: "poke",
    description: "Poke someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/poke', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} pokes @${mentioned.split('@')[0]} 👉` : `${args.join(' ') || 'Someone'} gets poked!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("👉 *Poke!*");
        }
    }
});

// WINK
registerCommand({
    name: "wink",
    description: "Wink",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/wink', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😉 *Winks!*"
            });
        } catch {
            await reply("😉 *Winks!*");
        }
    }
});

// DANCE
registerCommand({
    name: "dance",
    description: "Dance",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/dance', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "💃 *Dancing!*"
            });
        } catch {
            await reply("💃 *Dances!*");
        }
    }
});

// CRINGE
registerCommand({
    name: "cringe",
    description: "Cringe reaction",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/cringe', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😬 *Cringe!*"
            });
        } catch {
            await reply("😬 *That's cringe!*");
        }
    }
});

// BLUSH
registerCommand({
    name: "blush",
    description: "Blush",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/blush', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😳 *Blushes!*"
            });
        } catch {
            await reply("😳 *Blushes!*");
        }
    }
});

// HAPPY
registerCommand({
    name: "happy",
    description: "Show happiness",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/happy', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😄 *So happy!*"
            });
        } catch {
            await reply("😄 *Happy!*");
        }
    }
});

// BITE
registerCommand({
    name: "bite",
    description: "Bite someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/bite', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} bites @${mentioned.split('@')[0]} 😬` : `${args.join(' ') || 'Someone'} gets bitten!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("😬 *Bite!*");
        }
    }
});

// BULLY
registerCommand({
    name: "bully",
    description: "Bully someone (playfully)",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/bully', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} bullies @${mentioned.split('@')[0]} 😈` : `${args.join(' ') || 'Someone'} gets bullied!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("😈 *Bully!*");
        }
    }
});

// YEET
registerCommand({
    name: "yeet",
    description: "Yeet someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/yeet', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} yeets @${mentioned.split('@')[0]} 🚀` : `${args.join(' ') || 'Someone'} gets yeeted!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🚀 *YEET!*");
        }
    }
});

// KICK
registerCommand({
    name: "kickreaction",
    aliases: ["kickgif"],
    description: "Kick someone (animation)",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/kick', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} kicks @${mentioned.split('@')[0]} 🦵` : `${args.join(' ') || 'Someone'} gets kicked!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🦵 *Kick!*");
        }
    }
});

// HANDHOLD
registerCommand({
    name: "handhold",
    description: "Hold hands with someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/handhold', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} holds hands with @${mentioned.split('@')[0]} 🤝` : `${args.join(' ') || 'Someone'} holds hands!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🤝 *Holds hands!*");
        }
    }
});

// HIGHFIVE
registerCommand({
    name: "highfive",
    description: "High five someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/highfive', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} high-fives @${mentioned.split('@')[0]} 🙌` : `${args.join(' ') || 'Someone'} gets a high five!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🙌 *High five!*");
        }
    }
});

// NOM
registerCommand({
    name: "nom",
    description: "Nom nom nom",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/nom', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "😋 *Nom nom nom!*"
            });
        } catch {
            await reply("😋 *Nom nom!*");
        }
    }
});

// KILL
registerCommand({
    name: "kill",
    description: "Kill someone (playfully)",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/kill', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} kills @${mentioned.split('@')[0]} ⚔️` : `${args.join(' ') || 'Someone'} gets eliminated!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("⚔️ *Kill!*");
        }
    }
});

// LICK
registerCommand({
    name: "lick",
    description: "Lick someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/lick', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} licks @${mentioned.split('@')[0]} 👅` : `${args.join(' ') || 'Someone'} gets licked!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("👅 *Lick!*");
        }
    }
});

// GLOMP
registerCommand({
    name: "glomp",
    description: "Glomp someone",
    category: "reaction",
    execute: async ({ reply, sock, msg, args }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/glomp', { timeout: 10000 });
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const text = mentioned ? `@${msg.key.participant?.split('@')[0]} glomps @${mentioned.split('@')[0]} 🤗💨` : `${args.join(' ') || 'Someone'} gets glomped!`;

            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: text,
                mentions: mentioned ? [msg.key.participant, mentioned] : []
            });
        } catch {
            await reply("🤗💨 *Glomp!*");
        }
    }
});

// AWOO
registerCommand({
    name: "awoo",
    description: "Awoo!",
    category: "reaction",
    execute: async ({ reply, sock, msg }) => {
        try {
            const response = await axios.get('https://api.waifu.pics/sfw/awoo', { timeout: 10000 });
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: response.data.url },
                caption: "🐺 *AWOO!*"
            });
        } catch {
            await reply("🐺 *Awoo!*");
        }
    }
});
