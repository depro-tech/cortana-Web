import TelegramBot from 'node-telegram-bot-api';
import bcrypt from 'bcrypt';
import { localStorage } from './local-storage';
import { getSessionSocket } from './whatsapp';

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
    step: 'waiting_channel_link' | 'waiting_message' | 'confirming';
    channelLink?: string;
    channelJid?: string;
    channelName?: string;
    messageContent?: string;
    serverId?: string;
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
        // REACTCHANNEL HANDLERS
        // ═══════════════════════════════════════════════════════════
        else if (data === 'react_channel_menu' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            reactChannelState.delete(chatId);
            await telegramBot.sendMessage(chatId,
                '🚀 *WhatsApp Channel Reactor*\n\nSelect reaction count:',
                { parse_mode: 'Markdown', reply_markup: getReactChannelKeyboard() }
            );
        }

        else if ((data === 'react_100' || data === 'react_500' || data === 'react_1000') && isAdmin) {
            const count = parseInt(data.split('_')[1]);
            reactChannelState.set(chatId, { step: 'waiting_channel_link', count });
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                `✅ Count: *${count} reactions*\n\n` +
                `📎 *Step 1: Channel Link*\n\n` +
                `Paste the WhatsApp channel link:\n\n` +
                `_Example: https://www.whatsapp.com/channel/XXXXX_`,
                { parse_mode: 'Markdown' }
            );
        }

        else if (data === 'react_custom' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            await telegramBot.sendMessage(chatId,
                '🔢 *Custom Count*\n\nEnter the number of reactions (1-5000):',
                { parse_mode: 'Markdown' }
            );
            // Set a temporary state to capture custom count
            reactChannelState.set(chatId, { step: 'waiting_channel_link', count: -1 }); // -1 means waiting for count input
        }

        else if (data === 'confirm_react' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            const state = reactChannelState.get(chatId);

            if (!state || !state.channelJid || !state.serverId || !state.count) {
                await telegramBot.sendMessage(chatId, '❌ Session expired. Please start again.');
                reactChannelState.delete(chatId);
                return;
            }

            // Execute the reaction flood
            await executeReactChannel(chatId, state.channelJid, state.serverId, state.count, state.channelName);
            reactChannelState.delete(chatId);
        }

        else if (data === 'cancel_react' && isAdmin) {
            await telegramBot.answerCallbackQuery(query.id);
            reactChannelState.delete(chatId);
            await telegramBot.sendMessage(chatId, '❌ Operation cancelled.', {
                reply_markup: getReactChannelKeyboard()
            });
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

    // Step: Waiting for custom count (when count is -1)
    if (state.step === 'waiting_channel_link' && state.count === -1) {
        const count = parseInt(text);

        if (isNaN(count) || count < 1 || count > 5000) {
            await telegramBot.sendMessage(chatId, '❌ Invalid number. Please enter between 1 and 5000.');
            return;
        }

        state.count = count;

        await telegramBot.sendMessage(chatId,
            `✅ Count: *${count} reactions*\n\n` +
            `📎 *Step 1: Channel Link*\n\n` +
            `Paste the WhatsApp channel link:\n\n` +
            `_Example: https://www.whatsapp.com/channel/XXXXX_`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Step: Waiting for channel link
    if (state.step === 'waiting_channel_link' && text.includes('whatsapp.com/channel/')) {
        // Extract code and try to resolve JID
        const code = text.split('/channel/')[1]?.split('/')[0]?.split('?')[0];
        if (!code) {
            await telegramBot.sendMessage(chatId, '❌ Could not extract channel code from link.');
            return;
        }

        state.channelLink = text;

        // Try to get channel JID using WhatsApp socket
        const sock = getSessionSocket();
        if (sock && typeof sock.newsletterMetadata === 'function') {
            try {
                await telegramBot.sendMessage(chatId, '⏳ Resolving channel...');
                const metadata = await sock.newsletterMetadata('invite', code);

                if (metadata?.id) {
                    state.channelJid = metadata.id;
                    state.channelName = metadata.name || 'WhatsApp Channel';
                    state.step = 'waiting_message';

                    await telegramBot.sendMessage(chatId,
                        `✅ *Channel Found!*\n\n` +
                        `📢 Name: *${state.channelName}*\n\n` +
                        `📝 *Step 2: Message Content*\n\n` +
                        `Now copy and paste the exact text content of the channel update you want to react to:`,
                        { parse_mode: 'Markdown' }
                    );
                    return;
                }
            } catch (e) {
                console.error('Failed to resolve channel:', e);
            }
        }

        // Fallback if WhatsApp not connected
        await telegramBot.sendMessage(chatId,
            `❌ Could not resolve channel.\n\n` +
            `Make sure WhatsApp is connected and try again.`,
            { parse_mode: 'Markdown' }
        );
        reactChannelState.delete(chatId);
        return;
    }

    // Handle invalid input at channel link step
    if (state.step === 'waiting_channel_link') {
        await telegramBot.sendMessage(chatId,
            '❌ Invalid channel link.\n\nPlease paste a valid WhatsApp channel link:\n_https://www.whatsapp.com/channel/XXXXX_',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Step: Waiting for message content
    if (state.step === 'waiting_message') {
        if (text.length < 1) {
            await telegramBot.sendMessage(chatId, '❌ Message cannot be empty. Please paste the channel update text.');
            return;
        }

        state.messageContent = text;
        const preview = text.substring(0, 100) + (text.length > 100 ? '...' : '');

        await telegramBot.sendMessage(chatId, '⏳ Searching for matching update in channel...');

        // Try to fetch channel updates and match by content
        const sock = getSessionSocket();
        if (sock && typeof sock.newsletterFetchUpdates === 'function' && state.channelJid) {
            try {
                const updates = await sock.newsletterFetchUpdates(state.channelJid, 50);

                if (updates && updates.length > 0) {
                    // Search for matching message
                    for (const update of updates) {
                        const updateText = update.message?.extendedTextMessage?.text ||
                            update.message?.conversation ||
                            update.message?.imageMessage?.caption ||
                            update.message?.videoMessage?.caption || '';

                        // Check if the pasted text is contained in the update
                        if (updateText && updateText.toLowerCase().includes(text.toLowerCase().substring(0, 50))) {
                            state.serverId = update.key?.id || update.serverMessageId;

                            if (state.serverId) {
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
                                    `✅ *Update Found!*\n\n` +
                                    `📢 Channel: *${state.channelName}*\n` +
                                    `💬 Message: "${preview}"\n` +
                                    `🔢 Count: ${state.count} reactions\n\n` +
                                    `Ready to flood?`,
                                    { reply_markup: confirmKeyboard, parse_mode: 'Markdown' }
                                );
                                return;
                            }
                        }
                    }
                }

                // No match found
                await telegramBot.sendMessage(chatId,
                    `❌ Could not find matching update in channel.\n\n` +
                    `Make sure you copied the exact text from a recent channel update.\n\n` +
                    `Try again with a different message or paste more of the content.`,
                    { parse_mode: 'Markdown' }
                );

            } catch (e) {
                console.error('Failed to fetch updates:', e);
                await telegramBot.sendMessage(chatId,
                    `❌ Error fetching channel updates.\n\n${(e as Error).message}`,
                    { parse_mode: 'Markdown' }
                );
            }
        } else {
            await telegramBot.sendMessage(chatId,
                `❌ WhatsApp not connected or update fetch not available.\n\n` +
                `Please make sure WhatsApp is linked.`,
                { parse_mode: 'Markdown' }
            );
            reactChannelState.delete(chatId);
        }
    }
});

// Execute ReactChannel flood
async function executeReactChannel(
    chatId: number,
    channelJid: string,
    serverId: string,
    count: number,
    channelName?: string
) {
    const sock = getSessionSocket();

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
