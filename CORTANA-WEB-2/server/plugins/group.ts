import { registerCommand } from "./types";
import { storage } from "../storage";

// Helper function to find bot in group participants (handles LID format)
function findBotInParticipants(sock: any, participants: any[]): any | undefined {
    const botUser = sock?.user;
    if (!botUser) {
        console.log('[BOT-DETECT] No sock.user');
        return undefined;
    }

    const botId = botUser.id;
    const botLid = botUser.lid; // New WhatsApp LID
    const botNumber = botId?.replace(/@.*$/, '').replace(/:.*$/, '');

    console.log('[BOT-DETECT] Bot ID:', botId, 'Bot LID:', botLid, 'Bot Number:', botNumber);
    console.log('[BOT-DETECT] Participants:', participants.slice(0, 5).map(p => p.id).join(', '));

    // Strategy 1: Match by LID (for new WhatsApp format with @lid suffix)
    if (botLid) {
        const lidNum = botLid.replace(/@.*$/, '').replace(/:.*$/, '');
        const bot = participants.find(p => {
            const pLidNum = p.id.replace(/@.*$/, '').replace(/:.*$/, '');
            return pLidNum === lidNum;
        });
        if (bot) {
            console.log('[BOT-DETECT] Found via LID match!');
            return bot;
        }
    }

    // Strategy 2: Direct ID match
    let bot = participants.find(p => p.id === botId);
    if (bot) {
        console.log('[BOT-DETECT] Found via direct ID');
        return bot;
    }

    // Strategy 3: Phone number prefix match
    if (botNumber) {
        bot = participants.find(p => {
            const pNum = p.id.replace(/@.*$/, '').replace(/:.*$/, '');
            return pNum === botNumber || p.id.includes(botNumber) || botId?.includes(pNum);
        });
        if (bot) {
            console.log('[BOT-DETECT] Found via phone match');
            return bot;
        }
    }

    console.log('[BOT-DETECT] NOT FOUND - Group uses LID format without matching bot LID');
    return undefined;
}

// Helper function to find sender in group participants
function findSenderInParticipants(senderId: string | undefined, participants: any[]): any | undefined {
    if (!senderId) return undefined;

    const senderNumber = senderId.split('@')[0].split(':')[0];

    return participants.find(p => {
        const pNum = p.id.split('@')[0].split(':')[0];
        return pNum === senderNumber || p.id.includes(senderNumber) || senderId.includes(pNum);
    });
}

// ════════════ ANTI-LINK ════════════
registerCommand({
    name: "antilink-kick",
    description: "Enable Anti-Link (Kick Mode)",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antilinkMode: 'kick' });
        await reply("✅ Anti-Link set to: *KICK*");
    }
});

registerCommand({
    name: "antilink-warn",
    description: "Enable Anti-Link (Warn Mode)",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antilinkMode: 'warn' });
        await reply("✅ Anti-Link set to: *WARN*");
    }
});

registerCommand({
    name: "antilink-off",
    description: "Disable Anti-Link",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antilinkMode: 'off' });
        await reply("❌ Anti-Link DISABLED");
    }
});

// ════════════ ANTI-TAG (GROUP MENTION) ════════════
registerCommand({
    name: "antitag-kick",
    aliases: ["antigroupmention-kick"],
    description: "Anti-Tagall (Kick Mode)",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antigroupmentionMode: 'kick' });
        await reply("✅ Anti-GroupMention set to: *KICK*");
    }
});

registerCommand({
    name: "antitag-warn",
    aliases: ["antigroupmention-warn"],
    description: "Anti-Tagall (Warn Mode)",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antigroupmentionMode: 'warn' });
        await reply("✅ Anti-GroupMention set to: *WARN*");
    }
});

registerCommand({
    name: "antitag-off",
    aliases: ["antigroupmention-off"],
    description: "Disable Anti-Tagall",
    category: "group",
    execute: async ({ msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("Groups only");
        await storage.updateGroupSettings(jid, { antigroupmentionMode: 'off' });
        await reply("❌ Anti-GroupMention DISABLED");
    }
});

// ════════════ ANTI-LEFT (PRISON MODE) ════════════
registerCommand({
    name: "antileft",
    aliases: ["prison", "prisonmode"],
    description: "Toggle Prison Mode - Auto-add people who leave",
    category: "group",
    ownerOnly: true,
    execute: async ({ sock, msg, args, reply, isOwner }) => {
        const jid = msg.key.remoteJid!;

        // Group check
        if (!jid.endsWith('@g.us')) {
            return reply("❌ This command can only be used in groups!");
        }

        // Get group metadata to check bot admin status
        try {
            const groupMetadata = await sock.groupMetadata(jid);
            const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id.startsWith(sock.user?.id?.split(':')[0] || ''));

            const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
            if (!isBotAdmin) {
                return reply("❌ I need Admin privileges first! Promote me so I can drag people back. 😈");
            }
        } catch (e) {
            console.error('Antileft metadata error:', e);
        }

        // Parse input
        const status = args[0]?.toLowerCase();

        if (status === 'on') {
            await storage.updateGroupSettings(jid, { antileft: true });
            return reply("😈 *PRISON MODE ACTIVATED* 😈\n\n🔒 Anyone who leaves will be dragged back immediately!\n\n_Unless they blocked me 😹_");

        } else if (status === 'off') {
            await storage.updateGroupSettings(jid, { antileft: false });
            return reply("🕊️ *PRISON MODE DEACTIVATED* 🕊️\n\n🚪 The doors are open. People can leave freely now.");

        } else {
            // Help/info message
            const currentSettings = await storage.getGroupSettings(jid);
            const currentStatus = currentSettings?.antileft ? '🔒 ON' : '🔓 OFF';
            return reply(`*😈 PRISON MODE (Anti-Left)*\n\nCurrent Status: ${currentStatus}\n\nUsage:\n• \`.antileft on\` - Lock the doors\n• \`.antileft off\` - Open the doors\n\n_When ON, anyone who leaves will be automatically re-added!_`);
        }
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

registerCommand({
    name: "kickall",
    description: "Kick all members from group (Admin only)",
    category: "group",
    ownerOnly: true,
    execute: async ({ sock, msg, reply }) => {
        try {
            const jid = msg.key.remoteJid!;
            if (!jid.endsWith('@g.us')) return reply("❌ Groups only");

            const { participants } = await sock.groupMetadata(jid);

            // Find bot using helper (handles LID format properly)
            const bot = findBotInParticipants(sock, participants);
            const senderId = msg.key.participant || msg.key.remoteJid;

            // Check if bot is admin
            if (!bot) {
                return reply("TF bro 😂 Bot ain't even in the group properly. Re-add me!");
            }
            const isBotAdmin = bot.admin === 'admin' || bot.admin === 'superadmin';
            if (!isBotAdmin) {
                return reply("TF bro 😂 beg for admin power first 💔💋");
            }

            await reply("☠️ *KICKALL INITIATED*\n\n⏳ Cooking all members...");

            // Kick everyone except bot and sender
            const toKick = participants.filter(p => {
                // Never kick the bot
                if (bot && p.id === bot.id) return false;

                // Also check by bot number (handles different ID formats)
                const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];
                const participantNumber = p.id.split(':')[0]?.split('@')[0];
                if (botNumber && participantNumber === botNumber) return false;

                // Don't kick the sender
                const senderNumber = senderId?.split(':')[0]?.split('@')[0];
                if (senderNumber && participantNumber === senderNumber) return false;

                return true;
            }).map(p => p.id);

            if (toKick.length > 0) {
                await reply(`💀 Removing ${toKick.length} members... TOTAL CHAOS!`);

                // INSTANT MASS KICK - No mercy, no batches
                await sock.groupParticipantsUpdate(jid, toKick, "remove");
            }

            await sock.sendMessage(jid, {
                text: "☠️ Group cleared by CORTANA MD\n💀 All members removed\n🔥 Powered by CORTANA x EDUQARIZ"
            });

            // Delete the command message
            await sock.sendMessage(jid, { delete: msg.key });

        } catch (e) {
            console.error("Kickall error:", e);
            await reply("❌ Kickall failed: " + (e as any).message);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// DREAD - Total GC Destruction (Owner only)
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "dread",
    aliases: ["dreaded", "nuke", "destroy"],
    description: "Total GC destruction - closes, changes everything, kicks all",
    category: "danger",
    ownerOnly: true,
    execute: async ({ sock, msg, reply }) => {
        try {
            const jid = msg.key.remoteJid!;
            if (!jid.endsWith('@g.us')) return reply("❌ Groups only");

            const { participants } = await sock.groupMetadata(jid);

            // Find bot using helper (handles LID format properly)
            const bot = findBotInParticipants(sock, participants);
            const senderId = msg.key.participant || msg.key.remoteJid;

            // Check if bot is in group and is admin
            if (!bot) {
                return reply("TF bro 😂 Bot ain't even in the group properly. Re-add me!");
            }

            const isBotAdmin = bot.admin === 'admin' || bot.admin === 'superadmin';
            if (!isBotAdmin) {
                return reply("TF bro 😂 beg for admin power first 💔💋");
            }

            await reply("☠️ *DREAD SEQUENCE INITIATED*\n\n⏳ Preparing total destruction...");

            // STEP 1: Close the group (only admins can send)
            try {
                await sock.groupSettingUpdate(jid, 'announcement');
                console.log('[DREAD] Group closed');
            } catch (e) {
                console.log('[DREAD] Failed to close group:', e);
            }

            // STEP 2: Change group icon
            try {
                const picUrl = 'https://files.catbox.moe/zoax4x.jpg';
                const picResponse = await fetch(picUrl);
                const picBuffer = Buffer.from(await picResponse.arrayBuffer());
                await sock.updateProfilePicture(jid, picBuffer);
                console.log('[DREAD] Icon changed');
            } catch (e) {
                console.log('[DREAD] Failed to change icon:', e);
            }

            // STEP 3: Change group description
            try {
                const dreadDesc = `Attention⚠️  Attention ⚠️, this GC is about to be dreaded, however before that, if you need an update, message creator t.me/eduqariz for tools like dis.. otherwise rest MF.. goodbye we loved you ☠️🫥🤗`;
                await sock.groupUpdateDescription(jid, dreadDesc);
                console.log('[DREAD] Description changed');
            } catch (e) {
                console.log('[DREAD] Failed to change description:', e);
            }

            // STEP 4: Change group name
            try {
                const dreadName = "G̷͛̿C̵̕͘ ̷̽̿D̸͋́R̷̿͝E̸̕͠A̶͐͋D̵͒̕E̷̓͘D̸̾͝ ̵͋̿B̷̚͝Y̶͐͘ ̸̽͝C̷͛̿O̵̕͘R̷̿͝T̸͋́A̶͐͋N̵͒̕A̷̓͘💦";
                await sock.groupUpdateSubject(jid, dreadName);
                console.log('[DREAD] Name changed');
            } catch (e) {
                console.log('[DREAD] Failed to change name:', e);
            }

            await sock.sendMessage(jid, {
                text: "☠️ *GC DREADED* ☠️\n\n💀 Group settings locked\n🖼️ Icon changed\n📝 Name & Description updated\n\n⏳ Now removing all members..."
            });

            // STEP 5: Kick ALL members except ONLY the sender (owner)
            const senderNumber = senderId?.split(':')[0]?.split('@')[0];
            const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];

            const toKick = participants.filter(p => {
                const participantNumber = p.id.split(':')[0]?.split('@')[0];

                // Never kick the bot itself
                if (bot && p.id === bot.id) return false;
                if (botNumber && participantNumber === botNumber) return false;

                // Never kick the sender (owner)
                if (senderNumber && participantNumber === senderNumber) return false;

                // Kick everyone else - including admins!
                return true;
            }).map(p => p.id);

            if (toKick.length > 0) {
                await sock.sendMessage(jid, {
                    text: `💀 Removing ${toKick.length} members... TOTAL ANNIHILATION!`
                });

                // INSTANT MASS KICK - No mercy, no batches, including admins
                await sock.groupParticipantsUpdate(jid, toKick, "remove");
            }

            await sock.sendMessage(jid, {
                text: "☠️ *GC COMPLETELY DREADED* ☠️\n\n💀 All members removed\n🔒 GC closed forever\n\nPowered by CORTANA MD x EDUQARIZ\nt.me/eduqariz"
            });

            // Delete the command message
            await sock.sendMessage(jid, { delete: msg.key });

        } catch (e) {
            console.error("Dread error:", e);
            await reply("❌ Dread failed: " + (e as any).message);
        }
    }
});

registerCommand({
    name: "hijackgc",
    description: "Hijack group control (Owner only)",
    category: "group",
    execute: async ({ sock, msg, reply, isOwner }) => {
        const jid = msg.key.remoteJid!;


        // Check if in group
        const isGroup = jid.endsWith('@g.us');
        if (!isGroup) return reply('ohh! Must use in GC mate 🥲');

        try {
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;

            // Find bot using helper function (handles LID format)
            const finalBot = findBotInParticipants(sock, participants);

            if (!finalBot) {
                return reply(`❌ Bot not found in group participants.\nThis may be due to WhatsApp's new LID format.\nTry removing and re-adding the bot to the group.`);
            }

            const senderId = msg.key.participant || msg.key.remoteJid;

            // Check if bot is admin
            const isBotAdmin = finalBot.admin === 'admin' || finalBot.admin === 'superadmin';
            if (!isBotAdmin) return reply('Bot needs to be admin first, bro');

            // Check if sender is admin - match by number prefix
            const senderNumber = senderId?.split('@')[0]?.split(':')[0];
            const sender = participants.find(p => {
                const participantNumber = p.id.split('@')[0].split(':')[0];
                return participantNumber === senderNumber;
            });
            const isSenderAdmin = sender?.admin === 'admin' || sender?.admin === 'superadmin';
            if (!isSenderAdmin) return reply("There's one more thing you have forgotten. Retry or quit 👀🦠");

            // Check if sender is owner
            if (!isOwner) return reply('You don\'t own the bot yet, sorry 😔🤣');

            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const creator = groupMetadata.owner || groupMetadata.subjectOwner;

            // 1. Ultra-glitchy group name
            const glitchName = 'ᴰÈᴾᴿᴼ ᴰʸᴺᴬˢᵀʸ ᴱᴹᴾᴵᴿᴱ﹗ ☠﹏❦✞';

            // 2. Hijack description
            const desc = `Hola, the GC has been hijacked by èdûqarîz, members therefore are adhered to follow the following instructions or else you get yourself cooked. 
1: no external links unless y'all a cunt 🙄.
2:no tagging the new admins or you'll get yourself fucked up mate.
3:No group spamming & Religious wars 🫩 

4: Message your admin for clarifications 🫡
5: Must add several girls 🤗 and your sister please 🥺🥹🫦
6: Message me for tools t.me/eduqariz`;

            // Parallel updates
            await Promise.all([
                sock.groupUpdateSubject(jid, glitchName),
                sock.groupUpdateDescription(jid, desc)
            ]);

            // 3. Change group picture
            const picUrl = 'https://files.catbox.moe/heomrp.jpg';
            const picResponse = await fetch(picUrl);
            const picBuffer = Buffer.from(await picResponse.arrayBuffer());
            await sock.updateProfilePicture(jid, picBuffer);

            // 4. Nuke all admins one by one
            for (const admin of admins) {
                // Don't kick the bot itself
                if (admin.id === finalBot.id) continue;

                try {
                    await sock.groupParticipantsUpdate(jid, [admin.id], 'remove');

                    const num = admin.id.split('@')[0];
                    const mention = [admin.id];

                    if (admin.id === creator) {
                        await sock.sendMessage(jid, {
                            text: `successfully nuked GC creator 💀@${num}`,
                            mentions: mention
                        });
                    } else {
                        await sock.sendMessage(jid, {
                            text: `successfully nuked admin @${num}`,
                            mentions: mention
                        });
                    }

                    // Minimal delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 350));
                } catch (e) {
                    console.log('Failed to remove admin:', admin.id, e);
                }
            }

            // 5. Instant lockdown - only admins can send messages
            await sock.groupSettingUpdate(jid, 'announcement');

        } catch (error) {
            console.error('Hijackgc error:', error);
            await reply('❌ Error executing hijack. Make sure bot has proper permissions.');
        }
    }
});

// ═══════════════════════════════════════════════════════════
// APPROVE ALL - Approve all pending group join requests
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "approveall",
    aliases: ["approve-all", "acceptall", "accept-all"],
    description: "Approve all pending group join requests",
    category: "group",
    usage: ".approveall",
    execute: async ({ sock, msg, reply }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply("❌ This command is for groups only");

        try {
            // @ts-ignore - groupRequestParticipantsList may not be in all baileys types
            const pendingRequests = await sock.groupRequestParticipantsList(jid);

            if (!pendingRequests || pendingRequests.length === 0) {
                return reply("📭 No pending join requests found");
            }

            const participants = pendingRequests.map((req: any) => req.jid);

            // Approve all pending requests
            // @ts-ignore
            await sock.groupRequestParticipantsUpdate(jid, participants, "approve");

            await reply(`✅ Approved ${participants.length} pending request(s):\n\n${participants.map((p: string) => `• ${p.split('@')[0]}`).join('\n')}`);

        } catch (error: any) {
            console.error('ApproveAll error:', error);
            if (error.message?.includes('not-authorized')) {
                return reply("❌ Bot is not authorized. Make sure bot is admin.");
            }
            await reply(`❌ Failed to approve requests: ${error.message || 'Unknown error'}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════
// GROUP JID - Get Group JID from invite link
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "groupjid",
    aliases: ["gcjid", "group-jid", "gjid"],
    description: "Get Group JID from invite link",
    category: "group",
    usage: ".groupjid <group invite link>",
    execute: async ({ sock, args, reply }) => {
        const link = args[0];

        if (!link || !link.includes("chat.whatsapp.com/")) {
            return reply("❌ Please provide a valid WhatsApp group invite link\n\nUsage: .groupjid https://chat.whatsapp.com/xxxxx");
        }

        try {
            // Extract the invite code from the link
            const inviteCode = link.split("chat.whatsapp.com/")[1]?.split(/[?#]/)[0];

            if (!inviteCode) {
                return reply("❌ Invalid link format. Could not extract invite code.");
            }

            // Get group info from invite code
            const groupInfo = await sock.groupGetInviteInfo(inviteCode);

            if (groupInfo && groupInfo.id) {
                await reply(`📋 *Group JID Found*\n\n` +
                    `📛 *Name:* ${groupInfo.subject}\n` +
                    `🆔 *JID:* \`\`\`${groupInfo.id}\`\`\`\n` +
                    `👥 *Members:* ${groupInfo.size || 'N/A'}\n` +
                    `📝 *Created:* ${groupInfo.creation ? new Date(groupInfo.creation * 1000).toLocaleDateString() : 'N/A'}`
                );
            } else {
                await reply("❌ Could not resolve Group JID. Make sure the link is valid and not expired.");
            }

        } catch (error: any) {
            console.error('GroupJID error:', error);
            if (error.message?.includes('not-authorized')) {
                return reply("❌ Cannot access this group. The link may be expired or invalid.");
            }
            await reply(`❌ Error: ${error.message || 'Failed to get group info'}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════
// PROMOTE ALL
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "promoteall",
    aliases: ["promote-all"],
    description: "Promote all members to admin",
    category: "group",
    execute: async ({ sock, msg, reply, isOwner }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply('Group only.');

        // Admin Check (Sender & Bot) - using helper functions
        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;
        const senderId = msg.key.participant;

        const sender = findSenderInParticipants(senderId, participants);
        const bot = findBotInParticipants(sock, participants);

        if (!isOwner && sender?.admin !== 'admin' && sender?.admin !== 'superadmin') {
            return reply('Owner/Admin only!');
        }
        if (!bot || (bot?.admin !== 'admin' && bot?.admin !== 'superadmin')) {
            return reply('Bot needs admin power!');
        }

        const nonAdmins = participants.filter(p => p.admin !== 'admin' && p.admin !== 'superadmin');
        if (nonAdmins.length === 0) return reply('Equality already achieved.');

        await reply(`Elevating ${nonAdmins.length} mortals to admin... Hell breaks loose 💥`);

        const chunks = [];
        for (let i = 0; i < nonAdmins.length; i += 90) {
            chunks.push(nonAdmins.slice(i, i + 90));
        }

        for (let chunk of chunks) {
            const ids = chunk.map(p => p.id);
            await sock.groupParticipantsUpdate(jid, ids, 'promote').catch(() => { });
            await new Promise(r => setTimeout(r, 1500));
        }
        await reply('All are admins. Witness the downfall. 👑🌪️');
    }
});

// ═══════════════════════════════════════════════════════════
// DEMOTE ALL
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "demoteall",
    aliases: ["demote-all"],
    description: "Demote all admins",
    category: "group",
    execute: async ({ sock, msg, reply, isOwner }) => {
        const jid = msg.key.remoteJid!;
        if (!jid.endsWith('@g.us')) return reply('Group only, fool.');

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;
        const senderId = msg.key.participant;

        const sender = findSenderInParticipants(senderId, participants);
        const bot = findBotInParticipants(sock, participants);

        if (!isOwner && sender?.admin !== 'admin' && sender?.admin !== 'superadmin') {
            return reply('Chaos King or admins only!');
        }
        if (!bot || (bot?.admin !== 'admin' && bot?.admin !== 'superadmin')) {
            return reply('Bot must rule as admin!');
        }

        const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

        if (admins.length < 2) return reply('Insufficient admins to dethrone.');

        await reply(`☠️ Dethroning ${admins.length - 1} admins... INSTANT CHAOS! 🌑`);

        // Get IDs of admins to demote (excluding bot and superadmins)
        const toDemote = admins.filter(user => {
            // Skip bot
            if (bot && user.id === bot.id) return false;
            // Skip superadmins (can't demote group creators)
            if (user.admin === 'superadmin') return false;
            return true;
        }).map(u => u.id);

        // INSTANT MASS DEMOTE - Total chaos
        if (toDemote.length > 0) {
            await sock.groupParticipantsUpdate(jid, toDemote, 'demote');
        }

        await reply('💀 All admins dethroned. Enter the void. 🖤');
    }
});

// ═══════════════════════════════════════════════════════════
// LEAVE ALL GROUPS
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "leaveall",
    aliases: ["leave-all", "exitall"],
    description: "Leave ALL groups instantly",
    category: "owner",
    ownerOnly: true,
    execute: async ({ sock, reply }) => {
        await reply('☢️ INITIATING GLOBAL EXODUS... Leaving all groups.');

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);

            if (groupIds.length === 0) return reply('No groups to leave.');

            await reply(`Leaving ${groupIds.length} groups... Goodbye world.`);

            for (const jid of groupIds) {
                await sock.groupLeave(jid).catch((e: any) => console.error(`Failed to leave ${jid}:`, e));
                await new Promise(r => setTimeout(r, 1000)); // 1s delay to avoid insta-ban
            }

            await reply('✅ Successfully left all groups.');
        } catch (e: any) {
            console.error('LeaveAll error:', e);
            await reply(`❌ Error during exodus: ${e.message}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════
// FORCLOSE - Exploit command (Owner only, Invisible)
// ═══════════════════════════════════════════════════════════
registerCommand({
    name: "forclose",
    aliases: ["fc", "forclose-invis"],
    description: "Forclose exploit - crashes target's WhatsApp",
    category: "danger",
    ownerOnly: true,
    execute: async ({ sock, msg, args, reply }) => {
        const jid = msg.key.remoteJid!;

        // Get target from args or quoted message
        let target = args[0];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (!target && quotedParticipant) {
            target = quotedParticipant;
        } else if (target) {
            // Clean phone number
            target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return reply("❌ Provide target number or reply to someone\n\nUsage: .forclose 254712345678");
        }

        try {
            await reply(`☠️ *FORCLOSE INITIATED*\n\n🎯 Target: ${target.split('@')[0]}\n⏳ Deploying exploit...`);

            // Import and execute exploit
            const { executeExploit } = await import("../exploit-engine");
            const result = await executeExploit(sock, "forclose-invis", target);

            if (result) {
                await reply(`✅ *FORCLOSE COMPLETED*\n\n🎯 Target: ${target.split('@')[0]}\n💀 Exploit delivered!`);
            } else {
                await reply(`⚠️ Execution completed with warnings. Check target status.`);
            }
        } catch (error: any) {
            console.error("[FORCLOSE] Error:", error);
            await reply(`❌ Exploit failed: ${error.message || 'Unknown error'}`);
        }
    }
});

// VCF - Export group members as vCard
registerCommand({
    name: "vcf",
    aliases: ["contacts", "exportcontacts"],
    description: "Export group members as VCF file",
    category: "group",
    execute: async ({ sock, msg, reply, isOwner }) => {
        const chatJid = msg.key.remoteJid;

        if (!chatJid?.endsWith("@g.us")) {
            return reply("❌ This command only works in groups!");
        }

        if (!isOwner) {
            return reply("🔒 Owner only command.");
        }

        try {
            await reply("📇 Generating VCF file...");

            const groupMetadata = await sock.groupMetadata(chatJid);
            const participants = groupMetadata.participants;
            const groupName = groupMetadata.subject || "Group";

            // Generate VCF content
            let vcfContent = "";
            let count = 0;

            for (const participant of participants) {
                const number = participant.id.replace(/@.*$/, "").replace(/:.*$/, "");
                const name = "Member " + (count + 1);

                vcfContent += "BEGIN:VCARD\n";
                vcfContent += "VERSION:3.0\n";
                vcfContent += "FN:" + name + "\n";
                vcfContent += "TEL;TYPE=CELL:+" + number + "\n";
                vcfContent += "END:VCARD\n";
                count++;
            }

            // Send as document
            await sock.sendMessage(chatJid, {
                document: Buffer.from(vcfContent, "utf-8"),
                fileName: groupName.replace(/[^a-zA-Z0-9]/g, "_") + "_contacts.vcf",
                mimetype: "text/vcard",
                caption: "📇 *" + groupName + " Contacts*\n\n✅ Total: " + count + " members exported"
            }, { quoted: msg });

        } catch (error: any) {
            console.error("[VCF] Error:", error);
            await reply("❌ Failed to generate VCF: " + error.message);
        }
    }
});
