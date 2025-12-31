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
    name: "reactchannel",
    aliases: ["react-channel", "ch-react"],
    description: "React to a forwarded channel update with 1000 reactions",
    category: "channel",
    usage: ".reactchannel (reply to forwarded channel update)",
    ownerOnly: true,
    execute: async ({ msg, reply, sock }) => {
        // Get quoted/replied message
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo ||
            msg.message?.documentMessage?.contextInfo;

        // Check if it's a forwarded newsletter message
        const forwardedNewsletterInfo = quotedMsg?.forwardedNewsletterMessageInfo;

        if (!forwardedNewsletterInfo) {
            return reply("oh! man, the fowarded update doesnt match or invalid input, must follow input🏃‍♂️\n\n*Usage:* Reply to a forwarded channel update with *.reactchannel*\n\n1️⃣ Forward an update from any channel\n2️⃣ Reply to it with *.reactchannel*\n3️⃣ Watch the magic happen 🦄");
        }

        const channelJid = forwardedNewsletterInfo.newsletterJid;
        const serverId = forwardedNewsletterInfo.serverMessageId?.toString();
        const channelName = forwardedNewsletterInfo.newsletterName || "Unknown Channel";

        if (!channelJid || !serverId) {
            return reply("oh! man, couldn't extract channel info from the forwarded message🏃‍♂️\n\nMake sure you're replying to a *forwarded channel update*, not a regular message!");
        }

        try {
            // Generate 1000 reactions with random distribution
            const totalReactions = 1000;
            const reactionDistribution: { emoji: string, count: number }[] = [];
            let remaining = totalReactions;

            // Shuffle emojis to get a random subset
            const shuffledEmojis = [...REACTION_EMOJIS].sort(() => Math.random() - 0.5);
            const selectedEmojis = shuffledEmojis.slice(0, 5 + Math.floor(Math.random() * 4)); // Use 5-8 different emojis

            // Distribute reactions randomly among selected emojis
            for (let i = 0; i < selectedEmojis.length - 1; i++) {
                const count = Math.floor(Math.random() * (remaining / 2)) + 50;
                reactionDistribution.push({ emoji: selectedEmojis[i], count: Math.min(count, remaining) });
                remaining -= reactionDistribution[i].count;
            }
            // Give remaining to last emoji
            if (remaining > 0) {
                reactionDistribution.push({ emoji: selectedEmojis[selectedEmojis.length - 1], count: remaining });
            }

            // Sort by count descending for display
            reactionDistribution.sort((a, b) => b.count - a.count);

            // Create distribution message
            const distributionText = reactionDistribution
                .map(r => `${r.count} ${r.emoji}`)
                .join(" • ");

            await reply(`🦄 *CORTANA CHANNEL REACTOR*\n\n📢 Channel: *${channelName}*\n🎯 JID: \`${channelJid}\`\n📝 Update ID: \`${serverId}\`\n\n📊 *Reaction Distribution:*\n${distributionText}\n\n⏳ Sending ${totalReactions} reactions... Please wait!`);

            // Send reactions using newsletterReactMessage(jid, serverId, reaction)
            let successCount = 0;
            let errorCount = 0;
            let lastError = "";

            for (const { emoji, count } of reactionDistribution) {
                for (let i = 0; i < count; i++) {
                    try {
                        // @ts-ignore
                        await sock.newsletterReactMessage(channelJid, serverId, emoji);
                        successCount++;

                        // Delay to avoid rate limiting (every 20 reactions)
                        if (successCount % 20 === 0) {
                            await new Promise(r => setTimeout(r, 300));
                        }
                    } catch (e: any) {
                        errorCount++;
                        lastError = e.message || "Unknown error";
                        console.error("[REACTCHANNEL] Reaction error:", e.message);

                        // If too many consecutive errors, stop
                        if (errorCount > 10) {
                            await reply(`❌ Too many errors! Stopped after ${successCount} reactions.\n\nLast error: ${lastError}\n\nMake sure:\n• You're subscribed to the channel\n• The channel allows reactions\n• The update still exists`);
                            return;
                        }
                    }
                }
            }

            const successEmoji = successCount >= 900 ? "🎉" : successCount >= 500 ? "✅" : "⚠️";
            await reply(`${successEmoji} *REACTIONS COMPLETE!*\n\n📢 Channel: *${channelName}*\n🎉 Sent: ${successCount}/${totalReactions} reactions\n${errorCount > 0 ? `⚠️ Failed: ${errorCount}` : ''}`);

        } catch (error: any) {
            console.error("[REACTCHANNEL] Error:", error);
            await reply(`oh! man, something went wrong🏃‍♂️\n\nError: ${error.message || 'Unknown error'}\n\nMake sure you're subscribed to the channel!`);
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
