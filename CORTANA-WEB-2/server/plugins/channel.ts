import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// CHANNEL CHAMBER - Channel Management Commands
// ═══════════════════════════════════════════════════════════

// Reaction emojis pool for channel reactions
const REACTION_EMOJIS = ["🦄", "💃", "😂", "😽", "😒", "🏃‍♂️", "😊", "🤣", "❤️", "🔥", "👏", "😍", "🙌", "💯", "👀", "🎉"];

registerCommand({
    name: "channel-id",
    aliases: ["ch-jid", "channelid", "chid"],
    description: "Get Channel JID/ID from Link",
    category: "channel",
    usage: ".channel-id <channel link>",
    execute: async ({ args, reply, sock }) => {
        const link = args[0];
        if (!link || !link.includes("whatsapp.com/channel/")) {
            return reply("Please provide a valid WhatsApp channel link (e.g. https://whatsapp.com/channel/...)");
        }

        try {
            // Extract code
            const code = link.split("/channel/")[1]?.split("/")[0];
            if (!code) return reply("Invalid link format");

            // Attempt to fetch metadata
            try {
                // @ts-ignore - newsletterMetadata might not be in all baileys types definitions yet
                const metadata = await sock.newsletterMetadata("invite", code);

                if (metadata && metadata.id) {
                    await reply(`📢 *Channel JID Found*\n\nName: ${metadata.name}\nJID: \`\`\`${metadata.id}\`\`\`\nSubscribers: ${metadata.subscribers}`);
                } else {
                    await reply("❌ Could not resolve JID. Ensure the link is valid and public.");
                }
            } catch (err: any) {
                console.error(err);
                await reply(`❌ Error resolving: ${err.message || 'Unknown error'}`);
            }
        } catch (e) {
            await reply("❌ Error processing link.");
        }
    }
});

registerCommand({
    name: "server-id",
    aliases: ["update-id", "ms-id"],
    description: "Get Sever ID from forwarded channel update",
    category: "channel",
    usage: ".server-id (reply to update)",
    execute: async ({ msg, reply }) => {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo ||
            msg.message?.documentMessage?.contextInfo;

        const quoted = contextInfo?.quotedMessage;

        // Try to find forwarded info in current message (forwarded) or quoted message
        const directFwInfo = contextInfo?.forwardedNewsletterMessageInfo;

        const quotedContext = quoted?.extendedTextMessage?.contextInfo ||
            quoted?.imageMessage?.contextInfo ||
            quoted?.videoMessage?.contextInfo ||
            quoted?.documentMessage?.contextInfo;

        const nestedFwInfo = quotedContext?.forwardedNewsletterMessageInfo;

        const info = directFwInfo || nestedFwInfo;

        if (info && info.serverMessageId) {
            const serverId = info.serverMessageId;
            const channelName = info.newsletterName || "Unknown";
            const channelJid = info.newsletterJid || "Unknown";

            return await reply(`🆔 *SERVER ID FOUND*\n\n📢 Channel: *${channelName}*\n🔢 Server ID: \`${serverId}\`\n🎯 JID: \`${channelJid}\`\n\n*Usage:* .reactchannel ${channelJid}/${serverId}`);
        }

        // Fallback: Infer from stanzaId if direct channel message
        if (contextInfo?.stanzaId && contextInfo?.remoteJid?.includes("@newsletter")) {
            return await reply(`🆔 *SERVER ID FOUND*\n\n🔢 Server ID: \`${contextInfo.stanzaId}\`\n🎯 JID: \`${contextInfo.remoteJid}\`\n\n*Usage:* .reactchannel ${contextInfo.remoteJid}/${contextInfo.stanzaId}`);
        }

        await reply("❌ *No Channel Info Found*\n\nThe forwarded message does not contain channel metadata.\n\n*Tips:*\n1. Ensure you forwarded it *directly* from a channel.\n2. Some WhatsApp versions strip this info.\n3. Try using WhatsApp Web to find the ID.");
    }
});

registerCommand({
    name: "reactchannel",
    aliases: ["react-channel", "ch-react"],
    description: "React to a channel update with reactions (reply to update)",
    category: "channel",
    usage: ".reactchannel [count]",
    ownerOnly: true,
    execute: async ({ args, msg, reply, sock }) => {
        // Get the replied message context
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
            msg.message?.imageMessage?.contextInfo?.quotedMessage ||
            msg.message?.videoMessage?.contextInfo?.quotedMessage;

        // Check if current message has forwarded channel info (direct channel update)
        const directContext = msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo;

        let channelJid: string | null = null;
        let serverId: string | null = null;
        let channelName: string | null = null;

        // Priority 1: Check if replying to a channel update
        if (quotedMsg) {
            const quotedContext = quotedMsg.extendedTextMessage?.contextInfo ||
                quotedMsg.imageMessage?.contextInfo ||
                quotedMsg.videoMessage?.contextInfo ||
                quotedMsg.documentMessage?.contextInfo;

            // Check for forwarded newsletter info
            if (quotedContext?.forwardedNewsletterMessageInfo) {
                const fwInfo = quotedContext.forwardedNewsletterMessageInfo;
                channelJid = fwInfo.newsletterJid;
                serverId = fwInfo.serverMessageId;
                channelName = fwInfo.newsletterName;
            }
            // Check if quoted message is directly from newsletter
            else if (quotedContext?.remoteJid?.includes("@newsletter")) {
                channelJid = quotedContext.remoteJid;
                serverId = quotedContext.stanzaId;
            }
        }

        // Priority 2: Check if current message is from channel (direct update)
        if (!channelJid && directContext?.forwardedNewsletterMessageInfo) {
            const fwInfo = directContext.forwardedNewsletterMessageInfo;
            channelJid = fwInfo.newsletterJid;
            serverId = fwInfo.serverMessageId;
            channelName = fwInfo.newsletterName;
        }

        // Priority 3: Check current message remote JID
        if (!channelJid && msg.key?.remoteJid?.includes("@newsletter")) {
            channelJid = msg.key.remoteJid;
            serverId = msg.key.id;
        }

        // Priority 4: Manual input fallback (jid/serverId format)
        if (!channelJid || !serverId) {
            const input = args.join("").trim();
            if (input && input.includes("/")) {
                const parts = input.split("/");
                if (parts.length >= 2) {
                    const manualServerId = parts.pop();
                    const manualChannelJid = parts.join("/");
                    if (manualChannelJid.includes("@newsletter") && manualServerId && /^\d+$/.test(manualServerId)) {
                        channelJid = manualChannelJid;
                        serverId = manualServerId;
                    }
                }
            }
        }

        // Validation
        if (!channelJid || !serverId) {
            return reply(`❌ *No Channel Update Detected!*\n\n📌 *How to use:*\n1. Reply to a channel update message\n2. Send: \`.reactchannel [count]\`\n\n*Or manually:* .reactchannel <jid>/<id> [count]\n\nℹ️ The message must be from a WhatsApp channel (@newsletter)`);
        }

        // Parse count from args (skip jid/id if present)
        let count = 500;
        for (const arg of args) {
            const num = parseInt(arg);
            if (!isNaN(num) && num >= 1 && num <= 5000) {
                count = num;
                break;
            }
        }

        if (count < 1 || count > 5000) {
            return reply("❌ Count must be between 1 and 5000");
        }

        try {
            // Check if method exists
            if (typeof sock.newsletterReactMessage !== 'function') {
                return reply(`❌ *Method Not Available*\n\nThe reaction API might not be available in your baileys version.\n\n📢 Channel: ${channelName || channelJid}\n🔢 Server ID: ${serverId}`);
            }

            // Create distribution
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
            const distText = reactionDistribution.map(r => `${r.emoji}×${r.count}`).join(" ");

            // Send preview
            await reply(`🦄 *CORTANA REACTOR ACTIVATED*\n\n📢 Channel: *${channelName || channelJid}*\n🔢 Server ID: \`${serverId}\`\n\n📊 Distribution: ${distText}\n\n⏳ Sending ${count} reactions...\n\n*Please wait...*`);

            let successCount = 0;
            let errorCount = 0;
            let lastProgressUpdate = 0;

            for (const { emoji, count: emojiCount } of reactionDistribution) {
                for (let i = 0; i < emojiCount; i++) {
                    try {
                        // @ts-ignore
                        await sock.newsletterReactMessage(channelJid, serverId, emoji);
                        successCount++;

                        // Send progress every 100 reactions
                        if (successCount - lastProgressUpdate >= 100) {
                            try {
                                await reply(`⏳ Progress: ${successCount}/${count}...`);
                                lastProgressUpdate = successCount;
                            } catch (e) {
                                // Ignore reply errors
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
                            await reply(`⚠️ *Stopped after ${successCount} reactions*\n\nToo many errors detected. Channel might be restricting reactions.`);
                            return;
                        }
                        await new Promise(r => setTimeout(r, 5000)); // Back off
                    }
                }
            }

            // Final result
            const emoji = successCount === count ? "✅" : "⚠️";
            await reply(`${emoji} *REACTION COMPLETE!*\n\n🎉 Success: ${successCount}/${count}\n❌ Errors: ${errorCount}\n\n📢 Channel: ${channelName || channelJid}`);

        } catch (error: any) {
            console.error(error);
            await reply(`❌ *Error*\n\n${error.message}`);
        }
    }
});

registerCommand({
    name: "ch-ban",
    aliases: ["channel-ban"],
    description: "Ban user from channel (Coming Soon)",
    category: "channel",
    execute: async ({ reply }) => {
        await reply("⏳ *COMING SOON IN THE NEXT UPDATE*\n\nChannel ban functionality is currently under development and will be available in the next release. Stay tuned! 🚀");
    }
});
