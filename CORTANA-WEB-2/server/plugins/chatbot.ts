import { registerCommand } from "./types";
import axios from "axios";
import { storage } from "../storage";

// In-memory storage for chat history and user info
const chatMemory = {
    messages: new Map<string, string[]>(), // Stores last 20 messages per user
    userInfo: new Map<string, any>()  // Stores user information
};

// Extract user information from messages
function extractUserInfo(message: string) {
    const info: any = {};

    // Extract name
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }

    // Extract age
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }

    // Extract location
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }

    return info;
}

// Get AI response from API - Using working ChatGPT API
async function getAIResponse(userMessage: string, userContext: any): Promise<string | null> {
    try {
        // Build a context-aware prompt
        const contextMessages = userContext.messages?.slice(-5).join('\n') || '';
        const userInfo = userContext.userInfo ? JSON.stringify(userContext.userInfo) : '';

        // Create a combined prompt with context
        const fullPrompt = `You are CORTANA MD, a WhatsApp bot developed by èdûqarîz. 
Be casual, use emojis naturally, and keep responses short (1-2 lines max).
If user is rude, be savage back. If user is nice, be friendly.
Previous context: ${contextMessages}
User info: ${userInfo}
User says: ${userMessage}`;

        const encodedText = encodeURIComponent(fullPrompt);
        const apiUrl = `https://ab-chatgpt4o.abrahamdw882.workers.dev/?q=${encodedText}`;

        const response = await axios.get(apiUrl, {
            timeout: 15000
        });

        // New API returns { status: "success", data: "response text" }
        if (!response.data || response.data.status !== "success" || !response.data.data) {
            throw new Error("Invalid API response: missing status or data");
        }

        // Clean up the response
        let cleanedResponse = response.data.data.trim()
            // Replace emoji names with actual emojis
            .replace(/winks/gi, '😉')
            .replace(/eye roll/gi, '🙄')
            .replace(/shrug/gi, '🤷‍♂')
            .replace(/raises eyebrow/gi, '🤨')
            .replace(/smiles/gi, '😊')
            .replace(/laughs/gi, '😂')
            .replace(/cries/gi, '😢')
            .replace(/thinks/gi, '🤔')
            .replace(/sleeps/gi, '😴')
            // Clean up whitespace
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return cleanedResponse;
    } catch (error: any) {
        console.error("AI API error:", error.message);
        return null;
    }
}

// Chatbot on/off command
registerCommand({
    name: "chatbot",
    description: "Enable/disable AI chatbot",
    category: "ai",
    usage: ".chatbot on | .chatbot off",
    execute: async ({ args, msg, reply, sock, isOwner }) => {
        const jid = msg.key.remoteJid!;
        const mode = args[0]?.toLowerCase();

        if (!mode || (mode !== 'on' && mode !== 'off')) {
            return reply("*CHATBOT SETUP*\n\n*.chatbot on*\nEnable chatbot\n\n*.chatbot off*\nDisable chatbot in this group");
        }

        // Check if sender is admin (for groups)
        let isAdmin = false;
        if (jid.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(jid);
                const senderId = msg.key.participant || msg.key.remoteJid;
                isAdmin = groupMetadata.participants.some(p =>
                    p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
                );
            } catch (e) {
                console.warn('Could not fetch group metadata');
            }
        } else {
            // In PMs, anyone can enable
            isAdmin = true;
        }

        if (!isAdmin && !isOwner) {
            return reply('❌ Only group admins or the bot owner can use this command.');
        }

        let settings = await storage.getGroupSettings(jid);
        if (!settings) {
            settings = await storage.createGroupSettings({ groupId: jid, sessionId: 'default' });
        }

        if (mode === 'on') {
            if (settings.chatbotEnabled) {
                return reply('Chatbot is already enabled for this chat');
            }
            await storage.updateGroupSettings(jid, { chatbotEnabled: true });
            return reply('✅ Chatbot has been enabled! Mention me or reply to me to chat.');
        }

        if (mode === 'off') {
            if (!settings.chatbotEnabled) {
                return reply('Chatbot is already disabled for this chat');
            }
            await storage.updateGroupSettings(jid, { chatbotEnabled: false });
            return reply('✅ Chatbot has been disabled.');
        }
    }
});

// Export function to handle chatbot responses (called from whatsapp.ts)
// This bot replies to ALL messages when enabled - like a chat assistant
export async function handleChatbotResponse(
    sock: any,
    jid: string,
    msg: any,
    userMessage: string,
    senderId: string
) {
    try {
        // Check if chatbot is enabled for this chat
        const settings = await storage.getGroupSettings(jid);
        if (!settings || !settings.chatbotEnabled) return;

        // Skip if message is from the bot itself
        if (msg.key.fromMe) return;

        // Skip if message is empty
        if (!userMessage || userMessage.trim() === '') return;

        // Skip command messages (starts with prefix)
        const { getBotSettings } = await import("../whatsapp");
        const botSettings = await getBotSettings(senderId.split('@')[0]);
        const prefix = botSettings?.prefix || '.';
        if (userMessage.startsWith(prefix)) return;

        // Get bot's ID for mention cleanup
        const botId = sock.user.id;
        const botNumber = botId.split(':')[0];

        // Clean the message (remove bot mentions if any)
        let cleanedMessage = userMessage
            .replace(new RegExp(`@${botNumber}`, 'g'), '')
            .trim();

        if (!cleanedMessage) return;

        // Initialize user's chat memory
        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        // Extract and update user information
        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, {
                ...chatMemory.userInfo.get(senderId),
                ...userInfo
            });
        }

        // Add message to history (keep last 20 messages)
        const messages = chatMemory.messages.get(senderId)!;
        messages.push(cleanedMessage);
        if (messages.length > 20) {
            messages.shift();
        }
        chatMemory.messages.set(senderId, messages);

        // ═══════════════════════════════════════════════════════════
        // TYPING SIMULATION - Makes bot feel more human
        // ═══════════════════════════════════════════════════════════
        try {
            await sock.presenceSubscribe(jid);
            await sock.sendPresenceUpdate('composing', jid);

            // Calculate typing delay based on response length (1-4 seconds)
            const typingDelay = Math.min(4000, Math.max(1500, cleanedMessage.length * 50));
            await new Promise(resolve => setTimeout(resolve, typingDelay));
        } catch (e) {
            // Silent fail - typing indicator is optional
        }

        // Get AI response
        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        // ═══════ NULL-GUARD: Prevent sending empty/null messages ═══════
        if (!response || response.trim() === '') {
            console.log('[CHATBOT] Skipped sending empty/null response');
            return;
        }

        const trimmedResponse = response.trim();
        if (trimmedResponse.length === 0) {
            console.log('[CHATBOT] Skipped sending whitespace-only response');
            return;
        }

        // Stop typing indicator
        try {
            await sock.sendPresenceUpdate('paused', jid);
        } catch (e) { }

        // Send response
        await sock.sendMessage(jid, {
            text: trimmedResponse
        }, {
            quoted: msg
        });

    } catch (error: any) {
        console.error('❌ Error in chatbot response:', error.message);
    }
}
