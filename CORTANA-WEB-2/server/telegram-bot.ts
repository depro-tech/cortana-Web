import TelegramBot from 'node-telegram-bot-api';
import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';
import { getSessionSocket, getSessionByPhone, getAllActiveSessions } from './whatsapp';

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
    step: 'waiting_phone' | 'waiting_channel_select' | 'waiting_update_select' | 'waiting_count' | 'confirming';
    phoneNumber?: string;
    sessionId?: string;
    channels?: Array<{ id: string; name: string }>;
    selectedChannel?: { id: string; name: string };
    updates?: Array<{ id: string; text: string; timestamp?: number }>;
    selectedUpdate?: { id: string; text: string };
    count?: number;
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
            [{ text: '➕ Add Premium', callback_data: 'mod_addprem' }],
            [{ text: '➖ Remove Premium', callback_data: 'mod_delprem' }],
            [{ text: '📋 List Premium', callback_data: 'mod_listprem' }],
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

        // ═══════════════════════════════════════════════════════════
        // REACTCHANNEL HANDLERS - Multi-user flow
        // ═══════════════════════════════════════════════════════════
        else if (data === 'react_channel_menu' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            reactChannelState.delete(chatId);
            reactChannelState.set(chatId, { step: 'waiting_phone' });
            await telegramBot.sendMessage(chatId,
                '🚀 *WhatsApp Channel Reactor*\n\n' +
                '📱 *Step 1: Enter Phone Number*\n\n' +
                'Enter the WhatsApp number that is connected to the bot:\n\n' +
                '_Example: 254712345678_',
                { parse_mode: 'Markdown' }
            );
        }

        // Channel selection callback (channel_X where X is index)
        else if (data.startsWith('channel_') && isAdmin) {
            const state = reactChannelState.get(chatId);
            if (!state || state.step !== 'waiting_channel_select' || !state.channels) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Session expired' });
                return;
            }

            const index = parseInt(data.split('_')[1]);
            if (isNaN(index) || index >= state.channels.length) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Invalid selection' });
                return;
            }

            state.selectedChannel = state.channels[index];
            state.step = 'waiting_update_select';
            await telegramBot.answerCallbackQuery(query.id);

            // Fetch recent updates from this channel
            await telegramBot.sendMessage(chatId, '⏳ Fetching recent updates from channel...');

            const session = await getSessionByPhone(state.phoneNumber!);
            if (!session) {
                await telegramBot.sendMessage(chatId, '❌ Session expired. Please start again.');
                reactChannelState.delete(chatId);
                return;
            }

            try {
                const sock = session.sock;
                let updates: any[] = [];

                // Try multiple methods to fetch updates with fallbacks
                if (typeof sock.newsletterFetchUpdates === 'function') {
                    try {
                        updates = await sock.newsletterFetchUpdates(state.selectedChannel.id, 10);
                    } catch (e) {
                        console.log('❌ newsletterFetchUpdates failed:', (e as Error).message);
                    }
                }
                
                if ((!updates || updates.length === 0) && typeof sock.newsletterFetchMessages === 'function') {
                    try {
                        updates = await sock.newsletterFetchMessages(state.selectedChannel.id, 10);
                    } catch (e) {
                        console.log('❌ newsletterFetchMessages failed:', (e as Error).message);
                    }
                }
                
                if ((!updates || updates.length === 0) && typeof sock.fetchMessages === 'function') {
                    try {
                        updates = await sock.fetchMessages(state.selectedChannel.id, 10);
                    } catch (e) {
                        console.log('❌ fetchMessages failed:', (e as Error).message);
                    }
                }
                
                if ((!updates || updates.length === 0) && typeof sock.getMessages === 'function') {
                    try {
                        updates = await sock.getMessages(state.selectedChannel.id, 10);
                    } catch (e) {
                        console.log('❌ getMessages failed:', (e as Error).message);
                    }
                }

                console.log('📦 Fetched updates:', updates?.length || 0, 'Channel ID:', state.selectedChannel.id);

                if (!updates || updates.length === 0) {
                    const retryKeyboard = {
                        inline_keyboard: [
                            [{ text: '🔄 Retry', callback_data: `channel_${state.channels!.indexOf(state.selectedChannel!)}` }],
                            [{ text: '⬅️ Back to Channels', callback_data: 'react_channel_menu' }]
                        ]
                    };
                    
                    await telegramBot.sendMessage(chatId,
                        '⚠️ Could not fetch updates from this channel.\n\n' +
                        'This could happen if:\n' +
                        '• Channel is empty\n' +
                        '• API not available in your Baileys version\n' +
                        '• Channel permissions issue\n\n' +
                        'Try a different channel or retry.',
                        { reply_markup: retryKeyboard, parse_mode: 'Markdown' }
                    );
                    return;
                }

                // Parse updates with robust text extraction
                state.updates = updates.slice(0, 10).map((u: any, i: number) => {
                    // Try multiple text extraction paths
                    const text = 
                        u.message?.extendedTextMessage?.text ||
                        u.message?.conversation ||
                        u.message?.imageMessage?.caption ||
                        u.message?.videoMessage?.caption ||
                        u.message?.documentMessage?.caption ||
                        u.message?.audioMessage?.caption ||
                        u.body || 
                        u.text || 
                        u.caption ||
                        u.content ||
                        `[Update ${i + 1}]`;
                    
                    // Get reliable message ID
                    const msgId = 
                        u.key?.id || 
                        u.serverMessageId || 
                        u.id || 
                        u.message?.id ||
                        String(i);
                    
                    return {
                        id: msgId,
                        text: String(text).substring(0, 60).trim() || `[Update ${i + 1}]`
                    };
                }).filter(u => u.id && u.id !== '-1'); // Filter out invalid entries

                if (state.updates.length === 0) {
                    const retryKeyboard = {
                        inline_keyboard: [
                            [{ text: '🔄 Retry', callback_data: `channel_${state.channels!.indexOf(state.selectedChannel!)}` }],
                            [{ text: '⬅️ Back to Channels', callback_data: 'react_channel_menu' }]
                        ]
                    };
                    
                    await telegramBot.sendMessage(chatId,
                        '⚠️ Updates were found but could not be parsed.\n\nThis is a compatibility issue. Try a different channel.',
                        { reply_markup: retryKeyboard, parse_mode: 'Markdown' }
                    );
                    return;
                }

                // Create update selection keyboard
                const updateButtons = state.updates.map((u, i) => ([{
                    text: `${i + 1}. ${u.text}${u.text.length >= 60 ? '...' : ''}`,
                    callback_data: `update_${i}`
                }]));
                updateButtons.push([{ text: '⬅️ Back to Channels', callback_data: 'react_channel_menu' }]);

                await telegramBot.sendMessage(chatId,
                    `✅ *${state.selectedChannel.name}*\n\n` +
                    `📝 *Step 3: Select Update*\n\n` +
                    `Found ${state.updates.length} update(s). Choose one to react to:`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: updateButtons }
                    }
                );

            } catch (e) {
                console.error('Failed to fetch updates:', e);
                const retryKeyboard = {
                    inline_keyboard: [
                        [{ text: '🔄 Retry', callback_data: `channel_${state.channels!.indexOf(state.selectedChannel!)}` }],
                        [{ text: '⬅️ Back to Channels', callback_data: 'react_channel_menu' }]
                    ]
                };
                
                await telegramBot.sendMessage(chatId, 
                    `⚠️ *Error fetching updates*\n\n\`${(e as Error).message}\`\n\nPlease try again or select a different channel.`,
                    { reply_markup: retryKeyboard, parse_mode: 'Markdown' }
                );
            }
        }

        // Update selection callback
        else if (data.startsWith('update_') && isAdmin) {
            const state = reactChannelState.get(chatId);
            if (!state || state.step !== 'waiting_update_select' || !state.updates) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Session expired' });
                return;
            }

            const index = parseInt(data.split('_')[1]);
            if (isNaN(index) || index >= state.updates.length) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Invalid selection' });
                return;
            }

            state.selectedUpdate = state.updates[index];
            state.step = 'waiting_count';
            await telegramBot.answerCallbackQuery(query.id);

            await telegramBot.sendMessage(chatId,
                `✅ *Update Selected!*\n\n` +
                `💬 "${state.selectedUpdate.text}..."\n\n` +
                `🔢 *Step 4: Reaction Count*\n\n` +
                `Select how many reactions to send:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getReactChannelKeyboard()
                }
            );
        }

        // Count selection callbacks
        else if ((data === 'react_100' || data === 'react_500' || data === 'react_1000') && isAdmin) {
            const state = reactChannelState.get(chatId);
            if (!state || state.step !== 'waiting_count') {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Please start with /start > ReactChannel' });
                return;
            }

            const count = parseInt(data.split('_')[1]);
            
            // Validate count is a proper number
            if (isNaN(count) || count <= 0 || count > 5000) {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Invalid reaction count' });
                return;
            }
            
            state.count = count;
            state.step = 'confirming';
            await telegramBot.answerCallbackQuery(query.id);

            const confirmKeyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Confirm', callback_data: 'confirm_react' },
                        { text: '❌ Cancel', callback_data: 'cancel_react' }
                    ]
                ]
            };

            await telegramBot.sendMessage(chatId,
                `📋 *Confirmation*\n\n` +
                `📢 Channel: *${state.selectedChannel?.name}*\n` +
                `💬 Update: "${state.selectedUpdate?.text}..."\n` +
                `🔢 Count: ${count} reactions\n\n` +
                `Ready to flood?`,
                { reply_markup: confirmKeyboard, parse_mode: 'Markdown' }
            );
        }

        else if (data === 'react_custom' && isAdmin) {
            const state = reactChannelState.get(chatId);
            if (!state || state.step !== 'waiting_count') {
                await telegramBot.answerCallbackQuery(query.id, { text: 'Please start with /start > ReactChannel' });
                return;
            }

            state.count = -1; // Flag for custom count input
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '🔢 Enter custom count (1-5000):',
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'confirm_react' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            const state = reactChannelState.get(chatId);

            if (!state || !state.selectedChannel || !state.selectedUpdate || !state.count || !state.phoneNumber) {
                await telegramBot.sendMessage(chatId, '❌ Session expired. Please start again.');
                reactChannelState.delete(chatId);
                return;
            }

            // Get session and execute
            const session = await getSessionByPhone(state.phoneNumber);
            if (!session) {
                await telegramBot.sendMessage(chatId, '❌ WhatsApp session not found. Please check the number.');
                reactChannelState.delete(chatId);
                return;
            }

            // Execute the reaction flood
            await executeReactChannel(
                chatId,
                state.selectedChannel.id,
                state.selectedUpdate.id,
                state.count,
                state.selectedChannel.name,
                session.sock
            );
            reactChannelState.delete(chatId);
        }

        else if (data === 'cancel_react' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            reactChannelState.delete(chatId);
            await telegramBot.sendMessage(chatId, '❌ Operation cancelled.\n\nUse /start to begin again.');
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
// REACTCHANNEL MESSAGE HANDLER (Multi-step flow)
// ═══════════════════════════════════════════════════════════
telegramBot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const telegramId = chatId.toString();
    const state = reactChannelState.get(chatId);

    // Only process if there's an active ReactChannel state and user is admin
    if (!state || telegramId !== ADMIN_ID) return;

    const text = msg.text.trim();

    // Step: Waiting for phone number
    if (state.step === 'waiting_phone') {
        const phoneNumber = text.replace(/[^0-9]/g, '');

        if (phoneNumber.length < 10) {
            await telegramBot.sendMessage(chatId, '❌ Invalid phone number. Please enter a valid number (e.g., 254712345678)');
            return;
        }

        await telegramBot.sendMessage(chatId, '⏳ Looking up session...');

        const session = await getSessionByPhone(phoneNumber);

        if (!session) {
            await telegramBot.sendMessage(chatId,
                `❌ No active session found for *${phoneNumber}*\n\n` +
                `Make sure this number is connected to the bot.`,
                { parse_mode: 'Markdown' }
            );
            reactChannelState.delete(chatId);
            return;
        }

        state.phoneNumber = phoneNumber;
        state.sessionId = session.sessionId;

        // Fetch subscribed channels with status update
        const statusMsg = await telegramBot.sendMessage(chatId, 
            '⏳ *Fetching channels...*\n\nConnecting to WhatsApp session...',
            { parse_mode: 'Markdown' }
        );

        try {
            const sock = session.sock;

            // Get subscribed newsletters with multiple fallbacks
            let channels: any[] = [];

            // Try different Baileys versions and methods
            if (typeof sock.newsletterSubscribedList === 'function') {
                try {
                    channels = await sock.newsletterSubscribedList();
                } catch (e) {
                    console.log('❌ newsletterSubscribedList failed:', (e as Error).message);
                }
            }
            
            if ((!channels || channels.length === 0) && typeof sock.newsletterGetSubscribed === 'function') {
                try {
                    channels = await sock.newsletterGetSubscribed();
                } catch (e) {
                    console.log('❌ newsletterGetSubscribed failed:', (e as Error).message);
                }
            }
            
            if ((!channels || channels.length === 0) && typeof sock.fetchUpdates === 'function') {
                try {
                    channels = await sock.fetchUpdates();
                } catch (e) {
                    console.log('❌ fetchUpdates failed:', (e as Error).message);
                }
            }

            console.log('📢 Fetched channels:', channels?.length || 0, 'Methods available:', {
                newsletterSubscribedList: typeof sock.newsletterSubscribedList,
                newsletterGetSubscribed: typeof sock.newsletterGetSubscribed,
                fetchUpdates: typeof sock.fetchUpdates
            });

            if (!channels || channels.length === 0) {
                await telegramBot.sendMessage(chatId,
                    '❌ No channels found.\n\n' +
                    'Make sure you have:\n' +
                    '• Followed at least one WhatsApp channel\n' +
                    '• Your WhatsApp session is properly connected\n\n' +
                    '_Try again by typing /start_',
                    { parse_mode: 'Markdown' }
                );
                reactChannelState.delete(chatId);
                return;
            }

            // Store channels with robust field extraction
            state.channels = channels.slice(0, 10).map((c: any) => {
                const channelId = c.id || c.jid || c.channelJid || String(Date.now());
                const channelName = c.name || 
                                   c.subject || 
                                   c.title || 
                                   c.channel_name || 
                                   c.displayName ||
                                   (c.metadata?.subject) ||
                                   'Unnamed Channel';
                
                return {
                    id: channelId,
                    name: channelName.substring(0, 40) // Limit name length
                };
            });
            state.step = 'waiting_channel_select';

            const channelButtons = state.channels.map((c, i) => ([{
                text: `📢 ${c.name}`,
                callback_data: `channel_${i}`
            }]));
            channelButtons.push([{ text: '❌ Cancel', callback_data: 'cancel_react' }]);

            await telegramBot.sendMessage(chatId,
                `✅ *Session Found!*\n\n` +
                `📱 Number: *${phoneNumber}*\n` +
                `🔗 Channels: ${state.channels.length}\n\n` +
                `📢 *Step 2: Select Channel*\n\n` +
                `Choose a channel to react to:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: channelButtons }
                }
            );

        } catch (e) {
            console.error('Failed to fetch channels:', e);
            await telegramBot.sendMessage(chatId,
                `❌ Error fetching channels: ${(e as Error).message}`,
                { parse_mode: 'Markdown' }
            );
            reactChannelState.delete(chatId);
        }
        return;
    }

    // Step: Waiting for custom count input
    if (state.step === 'waiting_count' && state.count === -1) {
        const count = parseInt(text);

        if (isNaN(count) || count < 1 || count > 5000) {
            await telegramBot.sendMessage(chatId, '❌ Invalid number. Please enter between 1 and 5000.');
            return;
        }

        state.count = count;
        state.step = 'confirming';

        const confirmKeyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Confirm', callback_data: 'confirm_react' },
                    { text: '❌ Cancel', callback_data: 'cancel_react' }
                ]
            ]
        };

        await telegramBot.sendMessage(chatId,
            `📋 *Confirmation*\n\n` +
            `📢 Channel: *${state.selectedChannel?.name}*\n` +
            `💬 Update: "${state.selectedUpdate?.text}..."\n` +
            `🔢 Count: ${count} reactions\n\n` +
            `Ready to flood?`,
            { reply_markup: confirmKeyboard, parse_mode: 'Markdown' }
        );
    }
});

// Execute ReactChannel flood
async function executeReactChannel(
    chatId: number,
    channelJid: string,
    serverId: string,
    count: number,
    channelName?: string,
    providedSock?: any
) {
    // Validate count parameter
    if (typeof count !== 'number' || isNaN(count) || count <= 0 || count > 5000) {
        await telegramBot.sendMessage(chatId, '❌ Invalid reaction count. Must be between 1-5000.');
        return;
    }
    
    const sock = providedSock || getSessionSocket();

    if (!sock) {
        await telegramBot.sendMessage(chatId, '❌ WhatsApp not connected. Please link your WhatsApp first.');
        return;
    }

    if (typeof sock.newsletterReactMessage !== 'function') {
        await telegramBot.sendMessage(chatId, '❌ Reaction API not available in current Baileys version.');
        return;
    }

    // Create emoji distribution
    const selectedEmojis = [...REACTION_EMOJIS].sort(() => Math.random() - 0.5).slice(0, 6);
    const reactionDistribution: { emoji: string, count: number }[] = [];
    let remaining = count;

    for (let i = 0; i < selectedEmojis.length - 1; i++) {
        const share = Math.floor(Math.random() * (remaining / 2)) + Math.floor(remaining / 10);
        reactionDistribution.push({
            emoji: selectedEmojis[i],
            count: Math.min(share, remaining)
        });
        remaining -= reactionDistribution[i].count;
    }

    if (remaining > 0) {
        reactionDistribution.push({
            emoji: selectedEmojis[selectedEmojis.length - 1],
            count: remaining
        });
    }

    reactionDistribution.sort((a, b) => b.count - a.count);
    const distText = reactionDistribution.map(r => `${r.emoji}×${r.count}`).join(' ');

    const startMsg = await telegramBot.sendMessage(chatId,
        `🦄 *CORTANA REACTOR ACTIVATED*\n\n` +
        `📢 Channel: *${channelName || channelJid}*\n` +
        `📊 Distribution: ${distText}\n` +
        `⏳ Progress: 0/${count}\n\n` +
        `_Please wait..._`,
        { parse_mode: 'Markdown' }
    );

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    for (const { emoji, count: emojiCount } of reactionDistribution) {
        for (let i = 0; i < emojiCount; i++) {
            try {
                await sock.newsletterReactMessage(channelJid, serverId, emoji);
                successCount++;

                // Update progress every 100 reactions
                if (successCount % 100 === 0) {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    try {
                        await telegramBot.editMessageText(
                            `🦄 *CORTANA REACTOR*\n\n` +
                            `📢 Channel: *${channelName || channelJid}*\n` +
                            `📊 Progress: ${successCount}/${count} ✅\n` +
                            `⏱️ Elapsed: ${elapsed}s\n` +
                            `⚠️ Errors: ${errorCount}`,
                            { chat_id: chatId, message_id: startMsg.message_id, parse_mode: 'Markdown' }
                        );
                    } catch (e) {
                        // Ignore edit errors
                    }
                }

                // Smart delay (avoid detection)
                const delay = 150 + Math.random() * 150;
                await new Promise(r => setTimeout(r, delay));

                // Longer break every 75 reactions
                if (successCount % 75 === 0) {
                    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
                }

            } catch (e: any) {
                errorCount++;
                if (errorCount > 10) {
                    await telegramBot.sendMessage(chatId,
                        `⚠️ *Stopped after ${successCount} reactions*\n\n` +
                        `Too many errors detected. Channel might be restricting reactions.`,
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }
                await new Promise(r => setTimeout(r, 5000)); // Back off
            }
        }
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const emoji = successCount === count ? '✅' : '⚠️';

    await telegramBot.sendMessage(chatId,
        `${emoji} *REACTION COMPLETE!*\n\n` +
        `🎉 Success: ${successCount}/${count}\n` +
        `❌ Errors: ${errorCount}\n` +
        `⏱️ Time: ${elapsed}s\n` +
        `📈 Speed: ${Math.round((successCount / elapsed) * 10) / 10} reactions/sec\n\n` +
        `📢 Channel: ${channelName || channelJid}\n\n` +
        `🔄 Use /start for main menu`,
        { parse_mode: 'Markdown' }
    );
}

// Error handling
telegramBot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
});

export default telegramBot;
