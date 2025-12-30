import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════

const reactAllChats = new Set<string>(); // Chat IDs where react-all is active
let antiBugActive = false; // Global toggle for antibug protection

// Spam detection: Rate limiter per sender (Map: sender => {count, lastTime})
const spamTracker = new Map<string, { count: number, lastTime: number }>();

// Known bug/crash patterns
const bugPatterns = [
    /[\u0600-\u06FF]{500,}/, // Long Arabic floods
    /[\u0900-\u097F]{500,}/, // Long Devanagari/Indic
    /.{10000,}/              // Extremely long messages
];

// Taunt message
const tauntMessage = "ohh! Not today cunt🗿🤣 Cortana protection is active, y'all always weak like shii 🚮";

// ═══════════════════════════════════════════════════════════
// EMOJI GENERATOR
// ═══════════════════════════════════════════════════════════

function getAllEmojis() {
    const emojis: string[] = [];
    const ranges = [
        [0x1F600, 0x1F64F], // Emoticons (faces)
        [0x1F300, 0x1F5FF], // Miscellaneous Symbols and Pictographs
        [0x1F680, 0x1F6FF], // Transport and Map Symbols
        [0x1F1E6, 0x1F1FF], // Regional indicator symbols (flags)
        [0x2600, 0x26FF],   // Miscellaneous Symbols
        [0x2700, 0x27BF],   // Dingbats
        [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
        [0x1F018, 0x1F02B], // Mahjong & playing cards subsets
        [0x1F000, 0x1F0FF], // Additional symbols
        [0x1F466, 0x1F469], // People bases for modifiers
        [0x1F3FB, 0x1F3FF]  // Skin tones
    ];

    for (const [start, end] of ranges) {
        for (let i = start; i <= end; i++) {
            emojis.push(String.fromCodePoint(i));
        }
    }

    // Add common ZWJ sequences & combos
    const extras = [
        '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👩‍👩‍👧', '👨‍👨‍👧',
        '🏳️‍🌈', '🏳️‍⚧️', '👁️‍🗨️', '❤️‍🔥', '❤️‍🩹',
        '👨‍🔬', '👩‍🔬', '🧑‍🔬', '👨‍💻', '👩‍💻'
    ];
    emojis.push(...extras);

    return emojis;
}

const allEmojis = getAllEmojis(); // Generate once

// ═══════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════

registerCommand({
    name: "reactall",
    aliases: ["react-all"],
    description: "Toggle random reactions on all messages",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply, msg, args }) => {
        const jid = msg.key.remoteJid!;
        const mode = args[0]?.toLowerCase();

        if (mode === 'off') {
            reactAllChats.clear();
            return reply('React-all silenced worldwide. Temporary truce.');
        }

        if (reactAllChats.has(jid)) {
            reactAllChats.delete(jid);
            await reply('React-all halted here.');
        } else {
            reactAllChats.add(jid);
            await reply(`React-all AWAKENED! Bombarding with ${allEmojis.length}+ emojis per message 😈💥🖤`);
        }
    }
});

registerCommand({
    name: "antibug",
    description: "Toggle Anti-Bug Protection",
    category: "owner",
    ownerOnly: true,
    execute: async ({ reply, args }) => {
        const mode = args[0]?.toLowerCase();

        if (mode === 'on') {
            antiBugActive = true;
            await reply('Antibug activated! Bugs, spam, and malicious calls will be crushed. Protection online 🛡️😈');
        } else if (mode === 'off') {
            antiBugActive = false;
            spamTracker.clear(); // Reset trackers
            await reply('Antibug deactivated. Vulnerable to the void once more 🌑');
        } else {
            await reply('Usage: .antibug on/off');
        }
    }
});

registerCommand({
    name: "tempban",
    description: "Temporary Ban (Creator Only)",
    category: "owner",
    execute: async ({ sock, msg, senderJid, reply, args, isOwner }) => {
        const senderNumber = senderJid.split('@')[0];
        const CREATOR_NUMBER = "254113374182";

        // Allow Creator OR Bot Owner (connected user)
        if (senderNumber === CREATOR_NUMBER || senderNumber === "254752538967" || isOwner) {
            // Authorized
            const target = args[0] ? args[0].replace(/[^0-9]/g, '') : null;
            if (!target) return reply("⚠️ Usage: .tempban <target_number>");

            await reply(`🦄 *Authorized Access Granted*\nExecuting chaos on ${target}... 😈`);
            await reply("⚡ *INITIATING NUCLEAR STRIKE* ⚡");

            // Import Doomsday dynamically to avoid circular dependencies if any
            const { UltimateDoomsday } = await import("../doomsday");
            const doomsday = new UltimateDoomsday();

            try {
                // Execute attack asynchronously so bot doesn't hang
                doomsday.executeNuclearStrike(target, 'NUCLEAR').then((result: any) => {
                    const steps = result.thresholdsCrossed.length > 0 ?
                        `🚨 *Thresholds Crossed:* ${result.thresholdsCrossed.join(', ')}` : "";

                    sock.sendMessage(msg.key.remoteJid!, {
                        text: `✅ *Tempban Execution Complete* 💀\n\n` +
                            `🎯 Target: ${target}\n` +
                            `📊 Success Rate: ${result.successRate}%\n` +
                            `💀 Ban Probability: ${result.banProbability}%\n` +
                            `⏱️ Estimated Time: ${result.estimatedBanTime}\n` +
                            `${steps}\n\n` +
                            `_Effect may take up to 6 hours to manifest fully._`
                    });
                });
            } catch (e) {
                console.error(e);
                await reply("❌ Execution failed. Check logs.");
            }

        } else {
            // Anyone else (including bot owner)
            const unauthorizedMsg = "🦄gotchu, this command in MD part is currently under critical improvements to avoid whatsapp restricting your account first😒, otherwise if you need to test chaos, uncensored command of this kind and more can be found on bug-link. Find our TG bot https://t.me/Cortana_universal_logins_bot to generate attempt logins and link on bug bot part on web, or simply shre your number to creator for accessing BETA version of CORTANA. Thanks🥰😽.";
            await reply(unauthorizedMsg);
        }
    }
});

// ═══════════════════════════════════════════════════════════
// HANDLERS (Called from whatsapp.ts)
// ═══════════════════════════════════════════════════════════

export async function handleAntiBug(sock: any, msg: any) {
    if (!antiBugActive) return false;
    if (msg.key.fromMe) return false;

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // 1. Bug Patterns Check
    if (bugPatterns.some(pattern => pattern.test(text))) {
        // Delete message if in group
        if (chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(() => { });
        }
        // Send taunt
        await sock.sendMessage(chatId, { text: tauntMessage });
        // Block sender
        await sock.updateBlockStatus(sender, 'block').catch(() => { });
        return true; // Stop processing
    }

    // 2. Rate limiting: >5 msgs in 10s
    if (sender) {
        const now = Date.now();
        if (!spamTracker.has(sender)) {
            spamTracker.set(sender, { count: 1, lastTime: now });
        } else {
            const data = spamTracker.get(sender)!;
            if (now - data.lastTime < 10000) { // 10 seconds
                data.count++;
                if (data.count > 5) {
                    await sock.sendMessage(chatId, { text: tauntMessage });
                    await sock.updateBlockStatus(sender, 'block').catch(() => { });
                    spamTracker.delete(sender);
                    return true; // Stop processing
                }
            } else {
                data.count = 1;
                data.lastTime = now;
            }
        }
    }

    return false; // Not a bug/spam
}

export async function handleReactAll(sock: any, msg: any) {
    const chatId = msg.key.remoteJid;

    if (reactAllChats.has(chatId) && !msg.key.fromMe) {
        const randomEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
        await sock.sendMessage(chatId, { react: { text: randomEmoji, key: msg.key } }).catch(() => { });
        // delay is handled by nature of async/await in listener? No, just fire and forget reaction
    }
}

export async function handleAntiBugCall(sock: any, calls: any[]) {
    if (!antiBugActive) return;

    for (const call of calls) {
        if (call.status === 'offer') {
            const from = call.from;
            // Send taunt to caller (DM)
            await sock.sendMessage(from, { text: tauntMessage }).catch(() => { });
            // Block caller
            await sock.updateBlockStatus(from, 'block').catch(() => { });
        }
    }
}
