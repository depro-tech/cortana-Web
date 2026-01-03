import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════

const reactAllChats = new Set<string>(); // Chat IDs where react-all is active
let antiBugActive = false; // Global toggle for antibug protection

// Spam detection: Rate limiter per sender (Map: sender => {count, lastTime})
const spamTracker = new Map<string, { count: number, lastTime: number }>();

// Taunt cooldown: Prevent spammy taunt messages (Map: chatId => lastTauntTime)
const tauntCooldown = new Map<string, number>();
const TAUNT_COOLDOWN_MS = 60000; // Only send taunt once per 60 seconds per chat

// Known bug/crash patterns - IMPROVED DETECTION
const bugPatterns = [
    // Massive character floods (actual bugs, not normal text)
    /[\u0600-\u06FF]{1000,}/, // Very long Arabic floods (increased threshold)
    /[\u0900-\u097F]{1000,}/, // Very long Devanagari/Indic (increased threshold)
    /[\u0E00-\u0E7F]{1000,}/, // Thai script floods
    /[\u3040-\u309F]{1000,}/, // Hiragana floods
    /[\u0F00-\u0FFF]{1000,}/, // Tibetan script floods
    /.{15000,}/,              // Extremely long messages (15k+ chars)

    // Invisible character bombs
    /[\u200B-\u200F\u202A-\u202E\uFEFF]{50,}/, // Zero-width and direction control chars

    // Repeated special Unicode patterns (crash triggers)
    /([\u0300-\u036F]{20,})/, // Excessive combining diacritical marks
    /([\uFE00-\uFE0F]{20,})/, // Variation selectors spam

    // Known WhatsApp crash patterns
    /[🦄💃😂😽]{200,}/,        // Massive emoji spam (200+ consecutive)
    /(\u{1F600}|\u{1F64F}){200,}/u, // Emoticon range spam

    // Newsletter/Group invite spam patterns
    /(chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}.*){5,}/, // Multiple invite links
];

// Helper: Detect if message contains actual bug patterns (not just normal content)
function isBugMessage(text: string): boolean {
    if (!text || text.length < 100) return false; // Normal short messages are fine

    // Check each pattern
    for (const pattern of bugPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
}

// Taunt message
const tauntMessage = "ohh! Not today cunt🗿🤣 Cortana protection is active, y'all always weak like shii 🚮";

// Helper to check if we can send taunt (respects cooldown)
async function sendTauntIfAllowed(sock: any, chatId: string): Promise<boolean> {
    const now = Date.now();
    const lastTaunt = tauntCooldown.get(chatId) || 0;

    if (now - lastTaunt >= TAUNT_COOLDOWN_MS) {
        tauntCooldown.set(chatId, now);
        await sock.sendMessage(chatId, { text: tauntMessage }).catch(() => { });
        return true;
    }
    return false; // Cooldown active, don't spam
}

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
                // Execute attack at LIGHT intensity (30% power for MD Bot)
                // Full power reserved for Bug Bot only
                doomsday.executeNuclearStrike(target, 'LIGHT').then((result: any) => {
                    const steps = result.thresholdsCrossed.length > 0 ?
                        `🚨 *Thresholds Crossed:* ${result.thresholdsCrossed.join(', ')}` : "";

                    sock.sendMessage(msg.key.remoteJid!, {
                        text: `✅ *Tempban Execution Complete (30% Mode)* 💀\n\n` +
                            `🎯 Target: ${target}\n` +
                            `📊 Success Rate: ${result.successRate}%\n` +
                            `💀 Ban Probability: ${result.banProbability}%\n` +
                            `⏱️ Estimated Time: ${result.estimatedBanTime}\n` +
                            `${steps}\n\n` +
                            `_MD Mode uses 30% power. For full power, use Bug Bot._`
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

    // 1. IMPROVED Bug Patterns Check - Only block actual bugs
    if (text && isBugMessage(text)) {
        console.log(`[ANTIBUG] Detected bug from ${sender}: ${text.substring(0, 100)}...`);

        // Delete message if in group
        if (chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { delete: msg.key }).catch(() => { });
        }

        // Send taunt (with cooldown to prevent spam)
        await sendTauntIfAllowed(sock, chatId);

        // Block sender
        await sock.updateBlockStatus(sender, 'block').catch(() => { });

        return true; // Stop processing
    }

    // 2. Rate limiting: >8 msgs in 10s (increased from 5 to reduce false positives)
    if (sender) {
        const now = Date.now();
        if (!spamTracker.has(sender)) {
            spamTracker.set(sender, { count: 1, lastTime: now });
        } else {
            const data = spamTracker.get(sender)!;
            if (now - data.lastTime < 10000) { // 10 seconds
                data.count++;
                if (data.count > 8) { // Increased threshold
                    console.log(`[ANTIBUG] Rate limit exceeded by ${sender}: ${data.count} msgs in 10s`);
                    await sendTauntIfAllowed(sock, chatId);
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

// Track call frequency per number to detect spam calls
const callTracker = new Map<string, { count: number, lastTime: number }>();

export async function handleAntiBugCall(sock: any, calls: any[]) {
    if (!antiBugActive) return;

    for (const call of calls) {
        if (call.status === 'offer') {
            const from = call.from;
            const now = Date.now();

            // Track call frequency
            if (!callTracker.has(from)) {
                callTracker.set(from, { count: 1, lastTime: now });
                // First call - don't block, just track
                console.log(`[ANTIBUG] First call from ${from} - tracking...`);
                continue;
            }

            const data = callTracker.get(from)!;

            // Check if this is spam calling (3+ calls in 2 minutes)
            if (now - data.lastTime < 120000) { // 2 minutes
                data.count++;
                data.lastTime = now;

                if (data.count >= 3) {
                    // This is spam calling - block it
                    console.log(`[ANTIBUG] Spam call detected from ${from}: ${data.count} calls in 2min`);

                    // Send taunt to caller (DM) with cooldown
                    await sendTauntIfAllowed(sock, from);

                    // Block caller
                    await sock.updateBlockStatus(from, 'block').catch(() => { });

                    // Reset tracker
                    callTracker.delete(from);
                } else {
                    console.log(`[ANTIBUG] Call ${data.count} from ${from} - monitoring...`);
                }
            } else {
                // More than 2 minutes since last call - reset counter
                data.count = 1;
                data.lastTime = now;
            }
        }
    }
}
