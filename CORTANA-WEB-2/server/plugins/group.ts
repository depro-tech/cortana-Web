import { registerCommand } from "./types";
import { storage } from "../storage";

registerCommand({
    name: "antilink",
    description: "Configure Anti-Link (kick/warn/off)",
    category: "group",
    execute: async ({ args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ Groups only");

        // Combine args to handle "kick on", "warn on"
        const fullArg = args.join(" ").toLowerCase();

        let mode = 'off';
        if (fullArg.includes('kick')) mode = 'kick';
        else if (fullArg.includes('warn')) mode = 'warn';
        else if (fullArg.includes('off')) mode = 'off';
        else return reply("❌ Usage: .antilink kick on | warn on | off");

        let settings = await storage.getGroupSettings(jid);
        if (!settings) {
            settings = await storage.createGroupSettings({ groupId: jid, sessionId: 'default' });
        }

        if (settings) {
            await storage.updateGroupSettings(jid, { antilinkMode: mode });
            await reply(`✅ Anti-Link set to: *${mode}*`);
        }
    }
});

registerCommand({
    name: "antitag",
    aliases: ["antigroupmention"],
    description: "Configure Anti-Tagall (kick/warn/off)",
    category: "group",
    execute: async ({ args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ Groups only");

        // Combine args to handle "kick on", "warn on"
        // User requested: antigroupmention-kick on
        // Alias is antigroupmention, so they type .antigroupmention kick on
        const fullArg = args.join(" ").toLowerCase();

        let mode = 'off';
        if (fullArg.includes('kick')) mode = 'kick';
        else if (fullArg.includes('warn')) mode = 'warn';
        else if (fullArg.includes('off')) mode = 'off';
        else return reply("❌ Usage: .antigroupmention kick on | warn on | off");

        let settings = await storage.getGroupSettings(jid);
        if (!settings) {
            return reply("❌ Group not initialized in DB. Bot needs to be active.");
        }

        await storage.updateGroupSettings(jid, { antigroupmentionMode: mode });
        await reply(`✅ Anti-Group-Mention set to: *${mode}*`);
    }
});

registerCommand({
    name: "add",
    description: "Add a user to the group",
    category: "group",
    execute: async ({ sock, args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        const user = args[0];
        if (!user) return reply("❌ Provide number to add");

        const participant = user.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.groupParticipantsUpdate(jid, [participant], "add");
        await reply(`✅ Added ${user}`);
    }
});

registerCommand({
    name: "kick",
    aliases: ["remove"],
    description: "Kick a user from the group",
    category: "group",
    execute: async ({ sock, args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        let target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : undefined;

        // Handle mentions
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) {
            target = mentions[0];
        }

        if (!target) return reply("❌ Provide user number or mention to kick");

        await sock.groupParticipantsUpdate(jid, [target], "remove");
        await reply(`✅ Kicked user`);
    }
});

registerCommand({
    name: "promote",
    description: "Promote a user to admin",
    category: "group",
    execute: async ({ sock, args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        let target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : undefined;
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) target = mentions[0];

        if (!target) return reply("❌ Provide user or mention");

        await sock.groupParticipantsUpdate(jid, [target], "promote");
        await reply(`✅ Promoted user`);
    }
});

registerCommand({
    name: "demote",
    description: "Demote a user from admin",
    category: "group",
    execute: async ({ sock, args, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        let target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : undefined;
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) target = mentions[0];

        if (!target) return reply("❌ Provide user or mention");

        await sock.groupParticipantsUpdate(jid, [target], "demote");
        await reply(`✅ Demoted user`);
    }
});

registerCommand({
    name: "open",
    description: "Open group settings",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await reply("✅ Group opened");
    }
});

registerCommand({
    name: "close",
    description: "Close group settings",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");
        await sock.groupSettingUpdate(jid, 'announcement');
        await reply("✅ Group closed");
    }
});

registerCommand({
    name: "link",
    description: "Get group invite link",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");
        const code = await sock.groupInviteCode(jid);
        await reply(`https://chat.whatsapp.com/${code}`);
    }
});

registerCommand({
    name: "resetlink",
    aliases: ["revoke"],
    description: "Reset group invite link",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");
        await sock.groupRevokeInvite(jid);
        const code = await sock.groupInviteCode(jid);
        await reply(`✅ Link reset\nNew link: https://chat.whatsapp.com/${code}`);
    }
});

registerCommand({
    name: "tagall",
    description: "Tag all members",
    category: "group",
    execute: async ({ sock, msg, args, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        const metadata = await sock.groupMetadata(jid);
        const text = args.join(" ") || "📢 Group Attention";
        const mentions = metadata.participants.map(p => p.id);

        await sock.sendMessage(jid, {
            text: `*${text}*\n` + mentions.map(m => `@${m.split('@')[0]}`).join('\n'),
            mentions
        });
    }
});

registerCommand({
    name: "hidetag",
    description: "Tag all members strictly (hidden)",
    category: "group",
    execute: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return;

        const metadata = await sock.groupMetadata(jid);
        const text = args.join(" ") || "Hidden Tag";
        const mentions = metadata.participants.map(p => p.id);

        await sock.sendMessage(jid, { text, mentions });
    }
});

registerCommand({
    name: "setppgc",
    description: "Set Group Profile Picture",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ Groups only");

        const isImage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (!isImage) return reply("🙄 wrong 🙅 usage example setppgc (reply to image)");

        await reply("✅ Profile picture updated (Mock)");
    }
});

registerCommand({
    name: "delete",
    aliases: ["del"],
    description: "Delete message",
    category: "group",
    execute: async ({ sock, msg, reply }) => {
        if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) return reply("🙄 wrong 🙅 usage example delete (reply to message)");

        const key = {
            remoteJid: msg.key.remoteJid!,
            fromMe: false,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        };

        await sock.sendMessage(msg.key.remoteJid!, { delete: key });
    }
});
