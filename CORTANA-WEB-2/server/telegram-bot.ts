import TelegramBot from 'node-telegram-bot-api';
import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';
import { getSessionSocket, getSessionByPhone, getAllActiveSessions } from './whatsapp';
import * as fs from 'fs';
import * as path from 'path';

// Use Function hack to get global require and bypass bundler analysis
// @ts-ignore
const runtimeRequire = typeof require !== 'undefined' ? require : (new Function('return require'))();

// Lazy load ReactEngine to prevent startup crashes
let reactEngine: any = null;

async function getReactEngine() {
    if (reactEngine) return reactEngine;
    try {
        console.log("Loading ReactEngine from: " + path.join(__dirname, 'react-engine.cjs'));
        // @ts-ignore
        const ReactEngineClass = runtimeRequire(path.join(__dirname, 'react-engine.cjs'));
        reactEngine = new ReactEngineClass();
        return reactEngine;
    } catch (error: any) {
        console.error("FAILED TO LOAD REACT ENGINE:", error);
        throw error;
    }
}

const BOT_TOKEN = '8447770192:AAF9mfWRi6cqW88Ymq5fwmW_Z8gaVR8W_PA';
const ADMIN_ID = '7056485483';
const WELCOME_IMAGE = 'https://files.catbox.moe/8rmgp9.jpg';

// Initialize bot with conditional polling (Polling for Dev, Webhook for Prod)
const isProduction = process.env.NODE_ENV === 'production';
export const telegramBot = new TelegramBot(BOT_TOKEN, { polling: !isProduction });

console.log(`🤖 Telegram Bot initialized (${isProduction ? 'Webhook' : 'Polling'} Mode)`);

if (isProduction) {
    // Try multiple sources for external URL
    const externalUrl = process.env.RENDER_EXTERNAL_URL
        || process.env.EXTERNAL_URL
        || 'https://cortana.world.briantechspace.co.ke';

    const webhookUrl = `${externalUrl}/api/telegram/webhook`;
    telegramBot.setWebHook(webhookUrl)
        .then(() => console.log(`✅ Webhook set to: ${webhookUrl}`))
        .catch(err => console.error('❌ Failed to set webhook:', err));
}


// Utility functions
function generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateCredentials() {
    const username = `user_${generateRandomString(6)}`;
    const password = `Pass_${generateRandomString(8)}`;
    return { username, password };
}

// ReactChannel state management
interface ReactChannelState {
    step: 'waiting_link' | 'waiting_emojis';
    sessionPhone?: string;
    channelJid?: string;
    messageId?: string;
    channelName?: string;
}

const reactChannelState = new Map<number, ReactChannelState>();

// Reaction emojis pool
const REACTION_EMOJIS = ["🦄", "💃", "😂", "😽", "😒", "🏃‍♂️", "😊", "🤣", "❤️", "🔥", "👏", "😍", "🙌", "💯", "👀", "🎉"];

// Keyboards
function getMainKeyboard(isAdmin: boolean) {
    const keyboard = [
        [{ text: '🎫 Generate Logins', callback_data: 'generate_login' }],
        [{ text: '🆔 Check My ID', callback_data: 'check_id' }]
    ];

    if (isAdmin) {
        keyboard.push([{ text: '💬 ReactChannel', callback_data: 'react_channel_menu' }]);
        keyboard.push([{ text: '🛠️ Moderation', callback_data: 'moderation' }]);
    }

    return { inline_keyboard: keyboard };
}

function getModerationKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '➕ Add Premium', callback_data: 'mod_addprem' }, { text: '➖ Del Premium', callback_data: 'mod_delprem' }],
            [{ text: '📋 List Premium', callback_data: 'mod_listprem' }],
            [{ text: '➕ Add Number', callback_data: 'mod_addnumber' }, { text: '➖ Del Number', callback_data: 'mod_delnumber' }],
            [{ text: '📋 List Numbers', callback_data: 'mod_listnumber' }],
            [{ text: '⬅️ Back', callback_data: 'back_main' }]
        ]
    };
}

function getReactChannelKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '💬 React 100', callback_data: 'react_100' }],
            [{ text: '💬 React 500', callback_data: 'react_500' }],
            [{ text: '💬 React 1000', callback_data: 'react_1000' }],
            [{ text: '⚙️ Custom Count', callback_data: 'react_custom' }],
            [{ text: '⬅️ Back', callback_data: 'back_main' }]
        ]
    };
}

// Command handlers
telegramBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();
    const isAdmin = telegramId === ADMIN_ID;

    const welcomeText = `Hey? How are you, y'all here for logins, right? 

Now click on the button below to get your trial logins for exploit menu

💎 Signed by dev edu`;

    try {
        await telegramBot.sendPhoto(chatId, WELCOME_IMAGE, {
            caption: welcomeText,
            reply_markup: getMainKeyboard(isAdmin)
        });
    } catch (error) {
        console.error('Error sending welcome:', error);
        await telegramBot.sendMessage(chatId, welcomeText, {
            reply_markup: getMainKeyboard(isAdmin)
        });
    }
});

// Callback query handlers
telegramBot.on('callback_query', async (query) => {
    const chatId = query.message!.chat.id;
    const telegramId = chatId.toString();
    const isAdmin = telegramId === ADMIN_ID;
    const data = query.data;

    try {
        if (data === 'generate_login') {
            // Get user data
            let user = await localStorage.getUser(telegramId);

            // Check if trial used and not premium (skip for admin)
            if (!isAdmin && user?.firstTrialUsed && !user?.isPremium) {
                await telegramBot.answerCallbackQuery(query.id, {
                    text: "Party's over!"
                });
                await telegramBot.sendMessage(chatId,
                    "Party's over mate🤣 now contact dev for another trial if interested🦄.\n\nt.me/eduqariz"
                );
                return;
            }

            // Check premium expiration
            if (user?.isPremium && user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt)) {
                await localStorage.createOrUpdateUser(telegramId, {
                    isPremium: false,
                    premiumExpiresAt: null
                });
                user = await localStorage.getUser(telegramId);
            }

            // Check rate limit for premium users (3 days) (skip for admin)
            if (!isAdmin && user?.isPremium && user?.lastLoginGenerated) {
                const daysSinceLastGen = (Date.now() - new Date(user.lastLoginGenerated).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceLastGen < 3) {
                    const timeLeft = Math.ceil(3 - daysSinceLastGen);
                    await telegramBot.answerCallbackQuery(query.id, {
                        text: `Wait ${timeLeft} more day(s)`
                    });
                    return;
                }
            }

            // Generate credentials
            const { username, password } = generateCredentials();
            const passwordHash = await bcrypt.hash(password, 10);

            const isPremium = user?.isPremium || false;
            // Admin generated logins also get 3 days
            const validDays = (isPremium || isAdmin) ? 3 : 1;
            const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

            // Store credentials (firstUsedAt handled by local-storage default)
            await localStorage.createCredential({
                telegramId,
                username,
                passwordHash,
                expiresAt: expiresAt.toISOString(),
                isActive: true
            });

            // Update user
            if (!user) {
                await localStorage.createOrUpdateUser(telegramId, {
                    firstTrialUsed: true,
                    lastLoginGenerated: new Date().toISOString(),
                    isPremium: false
                });
            } else {
                await localStorage.createOrUpdateUser(telegramId, {
                    lastLoginGenerated: new Date().toISOString()
                });
            }

            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                `✅ *Login Generated*\n\n` +
                `👤 Username: \`${username}\`\n` +
                `🔐 Password: \`${password}\`\n\n` +
                `⏳ Valid for: ${validDays} day(s)\n` +
                `📅 Expires: ${expiresAt.toLocaleString()}\n\n` +
                `⚠️ Copy these credentials now!`,
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'check_id') {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                `🆔 *Your Telegram ID*\n\n\`${telegramId}\`\n\n` +
                `Now here is your desired ID, message dev now.\nt.me/eduqariz`,
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'moderation' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '🛠️ *Moderation Panel*\n\nSelect an action:',
                { parse_mode: 'Markdown', reply_markup: getModerationKeyboard() }
            );
        }

        else if (data === 'back_main') {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                'Main Menu:',
                { reply_markup: getMainKeyboard(isAdmin) }
            );
        }

        else if (data === 'mod_addprem' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '➕ *Add Premium User*\n\n' +
                'Send in this format:\n' +
                '`/addprem <telegram_id> <days>`\n\n' +
                'Example: `/addprem 123456789 30`',
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'mod_delprem' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '➖ *Remove Premium User*\n\n' +
                'Send in this format:\n' +
                '`/delprem <telegram_id>`\n\n' +
                'Example: `/delprem 123456789`',
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'mod_listprem' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);

            const premiumUsers = await localStorage.getPremiumUsers();

            if (premiumUsers.length === 0) {
                await telegramBot.sendMessage(chatId, '📋 No premium users found.');
                return;
            }

            let message = '📋 *Premium Users*\n\n';
            for (const user of premiumUsers) {
                const expires = user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString() : 'Never';
                message += `• ID: \`${user.telegramId}\`\n  Expires: ${expires}\n\n`;
            }

            await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        else if (data === 'mod_addnumber' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '➕ *Add Authorized Number*\n\n' +
                'Send in this format:\n' +
                '`/addnumber <phone_number>`\n\n' +
                'Example: `/addnumber 254712345678`',
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'mod_delnumber' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '➖ *Remove Authorized Number*\n\n' +
                'Send in this format:\n' +
                '`/delnumber <number>`\n\n' +
                'Example: `/delnumber 254712345678`',
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'mod_listnumber' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            const authorized = loadAuthorizedNumbers();

            if (authorized.length === 0) {
                await telegramBot.sendMessage(chatId, '📋 No authorized numbers found.');
                return;
            }

            let message = '📋 *Authorized Numbers (REALBAN)*\n\n';
            for (let i = 0; i < authorized.length; i++) {
                message += `${i + 1}. \`${authorized[i]}\`\n`;
            }
            message += `\n_Total: ${authorized.length}_`;

            await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        }

        // ═══════════════════════════════════════════════════════════
        // REACTCHANNEL HANDLERS - New Simple Flow
        // ═══════════════════════════════════════════════════════════
        else if (data === 'react_channel_menu') {
            // Check auth (Admin or Premium)
            let user = await localStorage.getUser(telegramId);
            const isPremium = user?.isPremium;

            if (!isAdmin && !isPremium) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Premium only!' });
                return;
            }

            await telegramBot.answerCallbackQuery(query.id);

            // AUTO-SELECT PROXY MODE (Magic Automation)
            reactChannelState.set(chatId, {
                step: 'waiting_link',
                sessionPhone: 'proxy'
            });

            await telegramBot.sendMessage(chatId,
                `🚀 *ReactChannel* (Proxy Automation)\n\n` +
                `📝 *Step 1: Send Channel Link*\n` +
                `Paste the link to the specific channel update/message.\n\n` +
                `_Example: https://whatsapp.com/channel/abc.../123_\n` +
                `_NOTE: Using Proxy Engine for automated reactions 🪄_`,
                { parse_mode: 'Markdown' }
            );
        }

        // Session selection handler removed (Legacy)

        else if (data === 'cancel_react') {
            await telegramBot.answerCallbackQuery(query.id);
            reactChannelState.delete(chatId);
            await telegramBot.sendMessage(chatId, '❌ Cancelled.');
        }

    } catch (error) {
        console.error('Callback error:', error);
        await telegramBot.answerCallbackQuery(query.id, {
            text: '❌ Error occurred'
        });
    }
});

// Admin commands
telegramBot.onText(/\/addprem (.+) (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    const targetId = match?.[1];
    const days = parseInt(match?.[2] || '0');

    if (!targetId || !days) {
        await telegramBot.sendMessage(chatId, '❌ Invalid format. Use: /addprem <id> <days>');
        return;
    }

    try {
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        await localStorage.createOrUpdateUser(targetId, {
            isPremium: true,
            premiumDays: days.toString(),
            premiumExpiresAt: expiresAt.toISOString()
        });

        await telegramBot.sendMessage(chatId,
            `✅ Added premium for user \`${targetId}\`\n` +
            `📅 Expires: ${expiresAt.toLocaleString()}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Add premium error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error adding premium');
    }
});

telegramBot.onText(/\/delprem (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    const targetId = match?.[1];

    if (!targetId) {
        await telegramBot.sendMessage(chatId, '❌ Invalid format. Use: /delprem <id>');
        return;
    }

    try {
        await localStorage.createOrUpdateUser(targetId, {
            isPremium: false,
            premiumExpiresAt: null,
            premiumDays: '0'
        });

        await telegramBot.sendMessage(chatId,
            `✅ Removed premium for user \`${targetId}\``,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Remove premium error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error removing premium');
    }
});

telegramBot.onText(/\/listprem/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    try {
        const premiumUsers = await localStorage.getPremiumUsers();

        if (premiumUsers.length === 0) {
            await telegramBot.sendMessage(chatId, '📋 No premium users found.');
            return;
        }

        let message = '📋 *Premium Users*\n\n';
        for (const user of premiumUsers) {
            const expires = user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString() : 'Never';
            message += `• ID: \`${user.telegramId}\`\n  Expires: ${expires}\n\n`;
        }

        await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('List premium error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error listing premium users');
    }
});

// ═══════════════════════════════════════════════════════════
// BUG BOT AUTHORIZATION COMMANDS (Owner Only)
// Manages access to .realban command
// ═══════════════════════════════════════════════════════════

const AUTHORIZED_DB_PATH = path.join(process.cwd(), 'server', 'bugbot', 'database', 'authorized.json');

function loadAuthorizedNumbers(): string[] {
    try {
        if (fs.existsSync(AUTHORIZED_DB_PATH)) {
            return JSON.parse(fs.readFileSync(AUTHORIZED_DB_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('[AUTH] Error loading authorized.json:', e);
    }
    return [];
}

function saveAuthorizedNumbers(numbers: string[]): boolean {
    try {
        const dir = path.dirname(AUTHORIZED_DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(AUTHORIZED_DB_PATH, JSON.stringify(numbers, null, 2));
        return true;
    } catch (e) {
        console.error('[AUTH] Error saving authorized.json:', e);
        return false;
    }
}

telegramBot.onText(/\/addnumber (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    const number = match?.[1]?.replace(/[^0-9]/g, '');

    if (!number || number.length < 10) {
        await telegramBot.sendMessage(chatId,
            '❌ Invalid format.\n\nUse: `/addnumber 254712345678`\n(International format, 10+ digits)',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        const authorized = loadAuthorizedNumbers();

        if (authorized.includes(number)) {
            await telegramBot.sendMessage(chatId,
                `⚠️ Number \`${number}\` is already authorized!`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        authorized.push(number);
        saveAuthorizedNumbers(authorized);

        await telegramBot.sendMessage(chatId,
            `✅ *Number Authorized for REALBAN*\n\n` +
            `📱 Number: \`${number}\`\n` +
            `🔓 Access: .realban, .forcemessage\n\n` +
            `_Total authorized: ${authorized.length}_`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Add number error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error adding number');
    }
});

telegramBot.onText(/\/delnumber (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    const number = match?.[1]?.replace(/[^0-9]/g, '');

    if (!number) {
        await telegramBot.sendMessage(chatId,
            '❌ Invalid format.\n\nUse: `/delnumber 254712345678`',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        const authorized = loadAuthorizedNumbers();
        const index = authorized.indexOf(number);

        if (index === -1) {
            await telegramBot.sendMessage(chatId,
                `⚠️ Number \`${number}\` is not in the authorized list!`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        authorized.splice(index, 1);
        saveAuthorizedNumbers(authorized);

        await telegramBot.sendMessage(chatId,
            `✅ *Number Removed from Authorization*\n\n` +
            `📱 Number: \`${number}\`\n` +
            `🔒 Access revoked for: .realban, .forcemessage\n\n` +
            `_Remaining authorized: ${authorized.length}_`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Delete number error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error removing number');
    }
});

telegramBot.onText(/\/listnumber/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = chatId.toString();

    if (telegramId !== ADMIN_ID) {
        await telegramBot.sendMessage(chatId, '❌ Unauthorized');
        return;
    }

    try {
        const authorized = loadAuthorizedNumbers();

        if (authorized.length === 0) {
            await telegramBot.sendMessage(chatId,
                '📋 *Authorized Numbers*\n\n_No numbers authorized yet._\n\nUse `/addnumber 254xxx` to add.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        let message = '📋 *Authorized Numbers (REALBAN Access)*\n\n';
        for (let i = 0; i < authorized.length; i++) {
            message += `${i + 1}. \`${authorized[i]}\`\n`;
        }
        message += `\n_Total: ${authorized.length} numbers_`;

        await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('List numbers error:', error);
        await telegramBot.sendMessage(chatId, '❌ Error listing numbers');
    }
});

// ═══════════════════════════════════════════════════════════
// REACTCHANNEL MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════
telegramBot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const telegramId = chatId.toString();
    const state = reactChannelState.get(chatId);

    // Only process if active state and Auth
    if (!state) return;

    // Verify auth again
    const isAdmin = telegramId === ADMIN_ID;
    let user = await localStorage.getUser(telegramId);
    const isPremium = user?.isPremium;

    if (!isAdmin && !isPremium) {
        reactChannelState.delete(chatId);
        return;
    }

    const text = msg.text.trim();

    // 1. Waiting for Link
    if (state.step === 'waiting_link') {
        if (!text.includes('whatsapp.com/channel/')) {
            await telegramBot.sendMessage(chatId, '❌ Invalid link. Must be a WhatsApp channel link.\nTry again or /cancel.');
            return;
        }

        await telegramBot.sendMessage(chatId, '⏳ Resolving link details...');

        // Get session for resolution (Any valid session)
        let session: any = null;
        if (state.sessionPhone === 'proxy' || state.sessionPhone === 'all' || state.sessionPhone === 'system') {
            const all = getAllActiveSessions();
            if (all.length > 0) session = all[0];
        } else {
            session = await getSessionByPhone(state.sessionPhone!);
        }

        // Fallback
        if (!session) {
            const sys = await getSessionByPhone('system');
            if (sys) session = sys;
        }

        if (!session) {
            await telegramBot.sendMessage(chatId, '❌ No active sessions available to resolve link.');
            reactChannelState.delete(chatId);
            return;
        }

        try {
            // Extract code and message ID
            // Format: https://whatsapp.com/channel/<CODE>/<MSG_ID>
            const parts = text.split('/');
            const code = parts[parts.indexOf('channel') + 1];
            const msgId = parts[parts.indexOf('channel') + 2];

            if (!code) {
                await telegramBot.sendMessage(chatId, '❌ Could not parse link.');
                return;
            }

            // Resolve channel info
            const metadata = await session.sock.newsletterMetadata("invite", code);

            state.channelJid = metadata.id;
            state.channelName = metadata.name;
            state.messageId = msgId || undefined; // If no msgId, maybe latest? User guide implies specific link.

            if (!state.messageId) {
                await telegramBot.sendMessage(chatId, '⚠️ Link does not contain a message ID. Please copy link to a specific *message/update*.');
                return;
            }

            state.step = 'waiting_emojis';

            await telegramBot.sendMessage(chatId,
                `✅ *Target Found!*\n\n` +
                `📢 Channel: ${metadata.name}\n` +
                `🆔 Msg ID: ${state.messageId}\n\n` +
                `🤠 *Step 2: Send Reactions*\n` +
                `Send a list of emojis (or text) to use for mixing.\n` +
                `_Example: 🔥 ❤️ 😂_`
            );

        } catch (e) {
            console.error('Link resolution failed:', e);
            await telegramBot.sendMessage(chatId, `❌ Failed to resolve link: ${(e as Error).message}`);
        }
    }

    // 2. Waiting for Emojis
    else if (state.step === 'waiting_emojis') {
        const emojis = text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);

        if (!emojis || emojis.length === 0) {
            await telegramBot.sendMessage(chatId, '❌ No emojis found. Please send at least one emoji.');
            return;
        }

        const uniqueEmojis = [...new Set(emojis)]; // Dedup

        if (uniqueEmojis.length > 6) {
            // Optional: Limit
        }

        const count = 1000; // Fixed 1k as requested


        if (state.sessionPhone === 'proxy') {
            try {
                const engine = await getReactEngine();

                // HYBRID MODE EXECUTION (The "Most Possible Way")
                const sys = await getSessionByPhone('system');
                const systemSock = sys?.sock;
                const allSessions = getAllActiveSessions().filter(s => s.sock);

                await telegramBot.sendMessage(chatId,
                    `🚀 *Launching HYBRID ASSAULT* 🚀\n\n` +
                    `1️⃣ Real Sessions: ${allSessions.length}\n` +
                    `2️⃣ Socket Injection: ACTIVE (System)\n` +
                    `3️⃣ Proxy Flood: ACTIVE (HTTP)\n\n` +
                    `_Guaranteed "Most Possible" Attempt initiated..._`,
                    { parse_mode: 'Markdown' }
                );

                const tasks: Promise<any>[] = [];

                // A. Real Session Flood (Guaranteed delivery for N users)
                if (allSessions.length > 0) {
                    tasks.push(Promise.all(allSessions.map(sess =>
                        executeReactChannelWithCustom(
                            chatId, state.channelJid!, state.messageId!, 1, uniqueEmojis, state.channelName, sess.sock
                        )
                    )));
                }

                // B. Socket Spoofing (Exploit Attempt via System Socket)
                if (systemSock) {
                    tasks.push(engine.floodSocketSpoof(
                        systemSock, state.channelJid!, state.messageId!, uniqueEmojis, count
                    ));
                }

                // C. Proxy Flood (External Traffic)
                tasks.push(engine.floodReactions(
                    state.channelJid!, state.messageId!, uniqueEmojis, count, null
                ));

                // Wait for all vectors
                await Promise.all(tasks);

                await telegramBot.sendMessage(chatId,
                    `✅ *Hybrid Attack Complete*\n\n` +
                    `All vectors exhausted. If reactions do not appear, they are patched server-side.\n` +
                    `We utilized every possible method available.`,
                    { parse_mode: 'Markdown' }
                );
            } catch (err: any) {
                await telegramBot.sendMessage(chatId, `❌ **ENGINE ERROR**: ${err.message}`);
                console.error(err);
            }

        } else {
            // LEGACY / SESSION MODE
            let targetSessions: any[] = [];

            if (state.sessionPhone === 'all' || state.sessionPhone === 'system') {
                const all = getAllActiveSessions();
                targetSessions = all.filter(s => s.sock);
            } else {
                const s = await getSessionByPhone(state.sessionPhone!);
                if (s) targetSessions.push(s);
            }

            // Fallback if empty
            if (targetSessions.length === 0) {
                const sys = await getSessionByPhone('system');
                if (sys) targetSessions.push(sys);
            }

            if (targetSessions.length === 0) {
                await telegramBot.sendMessage(chatId, '❌ No active sessions found.');
                reactChannelState.delete(chatId);
                return;
            }

            await telegramBot.sendMessage(chatId, `🚀 Launching ReactChannel on ${targetSessions.length} active session(s)...`);

            // Execute for ALL target sessions
            await Promise.all(targetSessions.map(sess =>
                executeReactChannelWithCustom(
                    chatId,
                    state.channelJid!,
                    state.messageId!,
                    count,
                    uniqueEmojis,
                    state.channelName,
                    sess.sock
                )
            ));
        }

        reactChannelState.delete(chatId);
    }
});

// New Helper function for custom emojis - Optimized for Speed & Mixing
async function executeReactChannelWithCustom(
    chatId: number,
    channelJid: string,
    serverId: string,
    count: number,
    customEmojis: string[],
    channelName: string | undefined,
    sock: any
) {
    const startMsg = await telegramBot.sendMessage(chatId,
        `🦄 *REACT CHANNEL STARTED*\n\n` +
        `📢 Target: ${channelName || channelJid}\n` +
        `🤠 Emojis: ${customEmojis.join(' ')}\n` +
        `🔢 Total: ${count}\n\n` +
        `_Flooding with batched parallel execution..._`,
        { parse_mode: 'Markdown' }
    );

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    // 1. Prepare Task Queue (Mixed Emojis)
    const taskQueue: string[] = [];
    let remaining = count;

    // Distribute counts evenly
    customEmojis.forEach((emoji, index) => {
        if (index === customEmojis.length - 1) {
            for (let i = 0; i < remaining; i++) taskQueue.push(emoji);
        } else {
            const share = Math.floor(remaining / (customEmojis.length - index));
            for (let i = 0; i < share; i++) taskQueue.push(emoji);
            remaining -= share;
        }
    });

    // Shuffle Queue (Fisher-Yates) for better mixing
    for (let i = taskQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [taskQueue[i], taskQueue[j]] = [taskQueue[j], taskQueue[i]];
    }

    // 2. Execute in Batches
    const BATCH_SIZE = 50; // 50 parallel requests
    const BATCH_DELAY = 800; // 0.8s delay between batches

    for (let i = 0; i < taskQueue.length; i += BATCH_SIZE) {
        const batch = taskQueue.slice(i, i + BATCH_SIZE);

        // Execute batch in parallel
        await Promise.all(batch.map(async (emoji) => {
            try {
                await sock.newsletterReactMessage(channelJid, serverId, emoji);
                successCount++;
            } catch (e) {
                errorCount++;
            }
        }));

        // Update progress every ~200 items
        if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= taskQueue.length) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            try {
                await telegramBot.editMessageText(
                    `🦄 *REACT CHANNEL FLOOD*\n\n` +
                    `📢 Target: ${channelName || channelJid}\n` +
                    `📊 Progress: ${Math.min(i + BATCH_SIZE, count)}/${count}\n` +
                    `✅ Success: ${successCount}\n` +
                    `❌ Errors: ${errorCount}\n` +
                    `⏱️ Time: ${elapsed}s`,
                    { chat_id: chatId, message_id: startMsg.message_id, parse_mode: 'Markdown' }
                );
            } catch (e) { }
        }

        // Delay between batches to prevent rate limits
        if (i + BATCH_SIZE < taskQueue.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY));
        }
    }

    const elapsed = Math.round((Date.now() - startTime) / 100) / 10; // 1 decimal place
    await telegramBot.sendMessage(chatId,
        `✅ *DONE*\nSuccess: ${successCount}\nErrors: ${errorCount}\nTime: ${elapsed}s`
    );
}



// Error handling
telegramBot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
});

export default telegramBot;
