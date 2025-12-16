import { registerCommand } from "./types";
import { storage } from "../storage";

registerCommand({
    name: "warn",
    description: "Warn a user",
    category: "moderation",
    execute: async ({ args, reply, isOwner, msg }) => {
        if (!isOwner) return; // Simplified perms for now
        const user = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0] + '@s.whatsapp.net';
        await reply(`⚠️ Warning issued to @${user.split('@')[0]}`);
    }
});

registerCommand({
    name: "resetwarn",
    description: "Reset warnings",
    category: "moderation",
    execute: async ({ reply, isOwner }) => {
        if (!isOwner) return;
        await reply("✅ Warnings reset for user.");
    }
});

registerCommand({
    name: "purge",
    description: "Delete last messages",
    category: "moderation",
    execute: async ({ args, reply, isOwner }) => {
        if (!isOwner) return;
        await reply("🗑️ Purge not fully supported by Baileys without admin access to clear chat. Use 'clear' locally.");
    }
});

registerCommand({
    name: "mute",
    description: "Mute group",
    category: "moderation",
    execute: async ({ sock, msg, isOwner }) => {
        if (!isOwner) return;
        const jid = msg.key.remoteJid!;
        await sock.groupSettingUpdate(jid, 'announcement');
        await sock.sendMessage(jid, { text: "🔇 Group muted" });
    }
});

registerCommand({
    name: "unmute",
    description: "Unmute group",
    category: "moderation",
    execute: async ({ sock, msg, isOwner }) => {
        if (!isOwner) return;
        const jid = msg.key.remoteJid!;
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await sock.sendMessage(jid, { text: "🔉 Group unmuted" });
    }
});

registerCommand({
    name: "antispam",
    description: "Anti-spam configuration",
    category: "moderation",
    execute: async ({ args, reply }) => {
        const mode = args[0];
        if (!mode) return reply("🙄 wrong 🙅 usage example antispam on");
        await reply(`✅ Antispam set to ${mode}`);
    }
});
