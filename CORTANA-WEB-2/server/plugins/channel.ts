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
    description: "React to a channel update with 1000 reactions",
    category: "channel",
    usage: ".reactchannel <channel_jid>/<server_id>",
    ownerOnly: true,
    execute: async ({ args, reply, sock }) => {
        const input = args.join("").trim();

        if (!input || !input.includes("/")) {
            return reply("oh! man, invalid input🏃‍♂️\n\n*Usage:* .reactchannel <jid>/<server_id>\n\n1️⃣ Get JID: .channel-id <link>\n2️⃣ Get ID: .server-id (reply to forward)\n3️⃣ Combine: .reactchannel <jid>/<id>");
        }

        const parts = input.split("/");
        if (parts.length < 2) return reply("Invalid format. Use <jid>/<id>");

        const serverId = parts.pop();
        const channelJid = parts.join("/");

        if (!channelJid.includes("@newsletter")) {
            return reply("oh! man, invalid JID. Must contain '@newsletter'🏃‍♂️");
        }

        if (!serverId || !/^\d+$/.test(serverId)) {
            return reply("oh! man, ID must be a number🏃‍♂️");
        }

        try {
            const totalReactions = 1000;
            const reactionDistribution: { emoji: string, count: number }[] = [];
            let remaining = totalReactions;

            const shuffledEmojis = [...REACTION_EMOJIS].sort(() => Math.random() - 0.5);
            const selectedEmojis = shuffledEmojis.slice(0, 5 + Math.floor(Math.random() * 4));

            for (let i = 0; i < selectedEmojis.length - 1; i++) {
                const count = Math.floor(Math.random() * (remaining / 2)) + 50;
                reactionDistribution.push({ emoji: selectedEmojis[i], count: Math.min(count, remaining) });
                remaining -= reactionDistribution[i].count;
            }
            if (remaining > 0) {
                reactionDistribution.push({ emoji: selectedEmojis[selectedEmojis.length - 1], count: remaining });
            }

            reactionDistribution.sort((a, b) => b.count - a.count);

            const distributionText = reactionDistribution.map(r => `${r.count} ${r.emoji}`).join(" • ");

            await reply(`🦄 *CORTANA CHANNEL REACTOR*\n\n🎯 JID: \`${channelJid}\`\n📝 Server ID: \`${serverId}\`\n\n📊 *Distribution:*\n${distributionText}\n\n⏳ Sending ${totalReactions} reactions...`);

            let successCount = 0;
            let errorCount = 0;

            for (const { emoji, count } of reactionDistribution) {
                for (let i = 0; i < count; i++) {
                    try {
                        // @ts-ignore
                        await sock.newsletterReactMessage(channelJid, serverId, emoji);
                        successCount++;
                        if (successCount % 20 === 0) await new Promise(r => setTimeout(r, 200));
                    } catch (e: any) {
                        errorCount++;
                        if (errorCount > 20) {
                            await reply(`❌ Stopped after ${successCount} reactions.`);
                            return;
                        }
                    }
                }
            }

            await reply(`✅ *REACTIONS COMPLETE!*\n\n🎉 Sent: ${successCount}/${totalReactions}`);

        } catch (error: any) {
            console.error(error);
            await reply(`oh! man, error🏃‍♂️\n\n${error.message}`);
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
