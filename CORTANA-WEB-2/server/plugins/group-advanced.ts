import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// ADVANCED GROUP COMMANDS - Ship, Poll, Pick
// Ported from Anita-V4
// ═══════════════════════════════════════════════════════════

// Ship Command - Match two users
registerCommand({
    name: "ship",
    description: "Ship two random users in the group",
    category: "fun",
    usage: ".ship",
    execute: async ({ msg, sock, reply }) => {
        try {
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            
            if (!isGroup) {
                return reply("❌ This command only works in groups!");
            }

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid!);
            const participants = groupMetadata.participants.filter(p => !p.id.includes('bot'));

            if (participants.length < 2) {
                return reply("❌ Need at least 2 members to ship!");
            }

            // Pick two random users
            const user1 = participants[Math.floor(Math.random() * participants.length)];
            const user2 = participants.filter(p => p.id !== user1.id)[Math.floor(Math.random() * (participants.length - 1))];

            // Calculate compatibility (random)
            const compatibility = Math.floor(Math.random() * 100) + 1;
            
            let status = '';
            let emoji = '';
            
            if (compatibility < 25) {
                status = 'Not Compatible 💔';
                emoji = '😢';
            } else if (compatibility < 50) {
                status = 'Could Work 🤷';
                emoji = '😐';
            } else if (compatibility < 75) {
                status = 'Good Match! 💖';
                emoji = '😊';
            } else {
                status = 'Perfect Match! 💕✨';
                emoji = '😍';
            }

            const message = `💘 *SHIP COMPATIBILITY* 💘\n\n` +
                          `@${user1.id.split('@')[0]} ❤️ @${user2.id.split('@')[0]}\n\n` +
                          `━━━━━━━━━━━━━━━\n` +
                          `${'█'.repeat(Math.floor(compatibility / 10))}${'░'.repeat(10 - Math.floor(compatibility / 10))} ${compatibility}%\n` +
                          `━━━━━━━━━━━━━━━\n\n` +
                          `${emoji} ${status}`;

            await sock.sendMessage(msg.key.remoteJid!, {
                text: message,
                mentions: [user1.id, user2.id]
            }, { quoted: msg });

        } catch (error: any) {
            console.error('[SHIP] Error:', error);
            return reply("❌ Failed to ship users");
        }
    }
});

// Poll Command - Create polls
registerCommand({
    name: "poll",
    description: "Create a poll in the group",
    category: "group",
    usage: ".poll question | option1 | option2 | ...",
    execute: async ({ args, sock, msg, reply }) => {
        try {
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            
            if (!isGroup) {
                return reply("❌ This command only works in groups!");
            }

            const input = args.join(" ").trim();
            
            if (!input || !input.includes('|')) {
                return reply(
                    "❌ Invalid format!\n\n" +
                    "*Usage:* .poll question | option1 | option2 | option3\n\n" +
                    "*Example:* .poll Best fruit? | Apple | Banana | Orange"
                );
            }

            const parts = input.split('|').map(p => p.trim());
            const question = parts[0];
            const options = parts.slice(1);

            if (options.length < 2) {
                return reply("❌ Provide at least 2 options!");
            }

            if (options.length > 12) {
                return reply("❌ Maximum 12 options allowed!");
            }

            // Send poll
            await sock.sendMessage(msg.key.remoteJid!, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            });

            console.log('[POLL] ✅ Created poll:', question);

        } catch (error: any) {
            console.error('[POLL] Error:', error);
            return reply("❌ Failed to create poll. Make sure your WhatsApp supports polls.");
        }
    }
});

// Pick Command - Pick random user
registerCommand({
    name: "pick",
    aliases: ["choose", "random"],
    description: "Pick a random user from the group",
    category: "fun",
    usage: ".pick",
    execute: async ({ msg, sock, reply }) => {
        try {
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            
            if (!isGroup) {
                return reply("❌ This command only works in groups!");
            }

            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid!);
            const participants = groupMetadata.participants.filter(p => !p.id.includes('bot'));

            if (participants.length === 0) {
                return reply("❌ No members found!");
            }

            const randomUser = participants[Math.floor(Math.random() * participants.length)];

            const message = `🎲 *RANDOM PICK*\n\n` +
                          `The chosen one is:\n` +
                          `@${randomUser.id.split('@')[0]} 🎯`;

            await sock.sendMessage(msg.key.remoteJid!, {
                text: message,
                mentions: [randomUser.id]
            }, { quoted: msg });

        } catch (error: any) {
            console.error('[PICK] Error:', error);
            return reply("❌ Failed to pick random user");
        }
    }
});

// Diff Command - Show members who joined/left
registerCommand({
    name: "diff",
    aliases: ["changes", "groupdiff"],
    description: "Show members who joined or left recently",
    category: "group",
    usage: ".diff",
    execute: async ({ msg, sock, reply }) => {
        try {
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            
            if (!isGroup) {
                return reply("❌ This command only works in groups!");
            }

            // This is a simplified version - in production you'd track changes over time
            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid!);
            
            const message = `👥 *GROUP CHANGES*\n\n` +
                          `📊 *Current Members:* ${groupMetadata.participants.length}\n` +
                          `📛 *Group Name:* ${groupMetadata.subject}\n` +
                          `📝 *Description:* ${groupMetadata.desc || 'No description'}\n\n` +
                          `_Note: Track feature coming soon_`;

            return reply(message);

        } catch (error: any) {
            console.error('[DIFF] Error:', error);
            return reply("❌ Failed to get group changes");
        }
    }
});

// Group Info by Link
registerCommand({
    name: "ginfo",
    aliases: ["groupinfo", "glinkinfo"],
    description: "Get group info from invite link",
    category: "group",
    usage: ".ginfo <group_link>",
    execute: async ({ args, sock, reply }) => {
        try {
            const input = args.join(" ").trim();
            
            if (!input) {
                return reply("❌ Provide a group invite link!\n\nUsage: .ginfo https://chat.whatsapp.com/xxxxx");
            }

            const linkMatch = input.match(/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]{22,24})/);
            
            if (!linkMatch) {
                return reply("❌ Invalid group link format!");
            }

            const code = linkMatch[1];
            
            await reply("🔍 Fetching group info...");

            const groupInfo = await sock.groupGetInviteInfo(code);

            if (!groupInfo) {
                return reply("❌ Failed to get group info. Link may be invalid or revoked.");
            }

            const creationDate = new Date(groupInfo.creation * 1000);
            const formattedDate = creationDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const message = `📋 *GROUP INFORMATION*\n\n` +
                          `📛 *Name:* ${groupInfo.subject}\n` +
                          `👤 *Creator:* wa.me/${groupInfo.owner.split('@')[0]}\n` +
                          `🆔 *Group ID:* ${groupInfo.id}\n` +
                          `👥 *Members:* ${groupInfo.size} participants\n` +
                          `📅 *Created:* ${formattedDate}\n` +
                          `🔇 *Muted:* ${groupInfo.announce ? 'Yes' : 'No'}\n` +
                          `🔒 *Locked:* ${groupInfo.restrict ? 'Yes' : 'No'}\n` +
                          (groupInfo.desc ? `\n📝 *Description:*\n${groupInfo.desc}` : '');

            await sock.sendMessage(msg.key.remoteJid!, {
                text: message,
                mentions: [groupInfo.owner]
            });

        } catch (error: any) {
            console.error('[GINFO] Error:', error);
            return reply("❌ Failed to fetch group info. Check if link is valid.");
        }
    }
});

// Common Members - Find common members between groups
registerCommand({
    name: "common",
    aliases: ["commonmembers"],
    description: "Find common members (use in group after joining another)",
    category: "group",
    usage: ".common",
    execute: async ({ msg, sock, reply }) => {
        try {
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            
            if (!isGroup) {
                return reply("❌ This command only works in groups!");
            }

            // This is a simplified version
            const groupMetadata = await sock.groupMetadata(msg.key.remoteJid!);
            
            const message = `👥 *COMMON MEMBERS*\n\n` +
                          `📊 *Total Members:* ${groupMetadata.participants.length}\n` +
                          `📛 *Group:* ${groupMetadata.subject}\n\n` +
                          `_Note: Compare feature requires joining multiple groups_`;

            return reply(message);

        } catch (error: any) {
            console.error('[COMMON] Error:', error);
            return reply("❌ Failed to find common members");
        }
    }
});
