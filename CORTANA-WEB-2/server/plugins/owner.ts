import { registerCommand } from "./types";
import { storage } from "../storage";
import { delay, getDevice } from "@whiskeysockets/baileys";
import { messageCache } from "../store";

// Mock config for now, ideally this comes from storage or a config file
const config = {
    botName: 'CORTANA MD',
    premium: [] as string[],
    owners: [] as string[]
};

registerCommand({
    name: "block",
    description: "Block a user",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const user = args[0] ? args[0] + '@s.whatsapp.net' : undefined;
        if (!user) return reply("❌ Please provide a number to block");
        await sock.updateBlockStatus(user, "block");
        await reply(`✅ Blocked ${user}`);
    }
});

registerCommand({
    name: "unblock",
    description: "Unblock a user",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const user = args[0] ? args[0] + '@s.whatsapp.net' : undefined;
        if (!user) return reply("❌ Please provide a number to unblock");
        await sock.updateBlockStatus(user, "unblock");
        await reply(`✅ Unblocked ${user}`);
    }
});

registerCommand({
    name: "public",
    description: "Set bot to public mode",
    category: "owner",
    execute: async ({ reply, msg }) => {
        const sessionId = msg.key.remoteJid; // Ideally use stored session ID context if available, but for now we assume 1 session or derive it
        // Since we don't have session ID in context easily without refactoring 'execute' type signature heavily, 
        // we might need to rely on the fact that we handle one active session mostly. 
        // But wait, whatsapp.ts passes context. Let's assume we can get it or just use the first session for now.
        const sessions = await storage.getAllSessions();
        if (sessions.length > 0) {
            const settings = await storage.getBotSettings(sessions[0].id);
            if (settings) {
                await storage.updateBotSettings(settings.id, { isPublic: true });
                await reply("✅ Bot is now in *Public* mode. Everyone can use commands.");
            }
        }
    }
});

registerCommand({
    name: "self",
    description: "Set bot to private/self mode",
    category: "owner",
    execute: async ({ reply }) => {
        const sessions = await storage.getAllSessions();
        if (sessions.length > 0) {
            const settings = await storage.getBotSettings(sessions[0].id);
            if (settings) {
                await storage.updateBotSettings(settings.id, { isPublic: false });
                await reply("✅ Bot is now in *Self* mode. Only owner can use commands.");
            }
        }
    }
});

registerCommand({
    name: "antidelete",
    description: "Configure Anti-Delete (all-on/pm-on/off)",
    category: "owner",
    execute: async ({ args, reply }) => {
        const mode = args[0]?.toLowerCase(); // all-on, pm-on, off
        const validModes = ['all-on', 'pm-on', 'off'];
        // To allow loose typing (e.g. just 'all' or 'pm'), we can map them:
        // But user asked for specific syntax "antidelete-all-on", which maps to command "antidelete" arg "all-on" if parsed correctly by command handler space split.
        // Or if they type "antidelete all-on"

        if (!validModes.includes(mode)) {
            return reply(`❌ Invalid mode.\nUsage: .antidelete <all-on | pm-on | off>`);
        }

        const dbMode = mode === 'all-on' ? 'all' : mode === 'pm-on' ? 'pm' : 'off';

        const sessions = await storage.getAllSessions();
        if (sessions.length > 0) {
            const settings = await storage.getBotSettings(sessions[0].id);
            if (settings) {
                await storage.updateBotSettings(settings.id, { antideleteMode: dbMode });
                await reply(`✅ Anti-Delete set to: *${mode}*`);
            }
        }
    }
});

registerCommand({
    name: "autostatusview",
    aliases: ["autostatus"],
    description: "Toggle Auto Status View & Like",
    category: "owner",
    execute: async ({ args, reply }) => {
        const state = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(state)) return reply("❌ Usage: .autostatusview <on/off>");

        const enabled = state === 'on';
        const sessions = await storage.getAllSessions();
        if (sessions.length > 0) {
            const settings = await storage.getBotSettings(sessions[0].id);
            if (settings) {
                await storage.updateBotSettings(settings.id, { autostatusView: enabled });
                await reply(`✅ Auto Status View: *${state.toUpperCase()}*`);
            }
        }
    }
});

registerCommand({
    name: "device",
    description: "Detect user device (Reply to message)",
    category: "owner",
    execute: async ({ msg, reply }) => {
        if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
            return reply("❌ Please reply to a message to detect device");
        }

        const quotedMsgId = msg.message.extendedTextMessage.contextInfo.stanzaId;
        // In a real scenario we'd need the message object or key. 
        // Baileys 'getDevice' works on height of message ID length mostly.
        const device = getDevice(quotedMsgId);

        await reply(`📱 Device detected: *${device}*`);
    }
});

registerCommand({
    name: "bc",
    aliases: ["broadcast"],
    description: "Broadcast message to all chats",
    category: "owner",
    execute: async ({ sock, args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Please provide text to broadcast");

        const chats = await sock.groupFetchAllParticipating();
        const ids = Object.keys(chats);

        await reply(`📢 Sending broadcast to ${ids.length} chats...`);

        for (const id of ids) {
            // Basic anti-ban delay + error handling
            try {
                await sock.sendMessage(id, { text: `*📢 BROADCAST*\n\n${text}` });
                await delay(2000);
            } catch (e) { }
        }

        await reply("✅ Broadcast sent");
    }
});

registerCommand({
    name: "addprem",
    description: "Add a premium user",
    category: "owner",
    execute: async ({ args, reply }) => {
        const user = args[0];
        if (!user) return reply("❌ Provide user number");
        if (!config.premium.includes(user)) {
            config.premium.push(user);
        }
        await reply(`✅ Added ${user} to premium`);
    }
});

registerCommand({
    name: "delprem",
    description: "Remove a premium user",
    category: "owner",
    execute: async ({ args, reply }) => {
        const user = args[0];
        if (!user) return reply("❌ Provide user number");
        config.premium = config.premium.filter(u => u !== user);
        await reply(`✅ Removed ${user} from premium`);
    }
});

registerCommand({
    name: "device",
    description: "Detect device type of a user (reply to message)",
    category: "owner",
    execute: async ({ msg, reply }) => {
        // Check if replying to a message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;

        if (!quotedMsg || !quotedId) {
            return reply("🙄 wrong 🙅 usage example device (reply to a message)");
        }

        try {
            // Get device info from the quoted message
            const device = getDevice(quotedId);

            // Map device numbers to names
            const deviceNames: { [key: number]: string } = {
                0: "📱 ANDROID",
                1: "🍎 IOS (iPhone)",
                2: "💻 WINDOWS",
                3: "🖥️ MACOS",
                4: "🌐 WEB",
                5: "🐧 LINUX"
            };

            const deviceName = deviceNames[device] || `❓ UNKNOWN (${device})`;

            await reply(`🔍 *Device Detection*\n\nDevice: ${deviceName}`);
        } catch (e) {
            await reply("❌ Could not detect device. Make sure you're replying to a user message.");
        }
    }
});
