import { registerCommand } from "./types";

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
