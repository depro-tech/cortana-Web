import TelegramBot from 'node-telegram-bot-api';
import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';

const BOT_TOKEN = '8447770192:AAF9mfWRi6cqW88Ymq5fwmW_Z8gaVR8W_PA';
const ADMIN_ID = '7056485483';
const WELCOME_IMAGE = 'https://files.catbox.moe/8rmgp9.jpg';

// Initialize bot
export const telegramBot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Login Bot initialized (Local Storage)');

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

// Keyboards
function getMainKeyboard(isAdmin: boolean) {
    const keyboard = [
        [{ text: '🎫 Generate Logins', callback_data: 'generate_login' }],
        [{ text: '🆔 Check My ID', callback_data: 'check_id' }]
    ];

    if (isAdmin) {
        keyboard.push([{ text: '🛠️ Moderation', callback_data: 'moderation' }]);
    }

    return { inline_keyboard: keyboard };
}

function getModerationKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '➕ Add Premium', callback_data: 'mod_addprem' }],
            [{ text: '➖ Remove Premium', callback_data: 'mod_delprem' }],
            [{ text: '📋 List Premium', callback_data: 'mod_listprem' }],
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
            const validDays = isPremium ? 3 : 1;
            const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

            // Store credentials
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

// Error handling
telegramBot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
});

export default telegramBot;
