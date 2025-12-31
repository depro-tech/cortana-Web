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
    description: "React to a channel update with 1000 mixed reactions",
    category: "channel",
    usage: ".reactchannel <channel_id>/<update_id>",
    ownerOnly: true,
    execute: async ({ args, reply, sock }) => {
        const input = args[0];

        // Validate input format: channelId/updateId
        if (!input || !input.includes("/")) {
            return reply("oh! man, the fowarded update doesnt match or invalid input, must follow input🏃‍♂️\n\n*Usage:* .reactchannel <channel_id>/<update_id>\n\nUse *.channel-id* to find channel ID first!");
        }

        const parts = input.split("/");
        if (parts.length !== 2) {
            return reply("oh! man, the fowarded update doesnt match or invalid input, must follow input🏃‍♂️\n\n*Usage:* .reactchannel <channel_id>/<update_id>\n\nUse *.channel-id* to find channel ID first!");
        }

        let [channelId, updateId] = parts;

        // Ensure channelId has @newsletter suffix
        if (!channelId.includes("@")) {
            channelId = channelId + "@newsletter";
        }

        // Validate update ID is numeric
        if (!/^\d+$/.test(updateId)) {
            return reply("oh! man, the fowarded update doesnt match or invalid input, must follow input🏃‍♂️\n\nUpdate ID should be a number!\n\nUse *.channel-id* to find channel ID first!");
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
                const count = Math.floor(Math.random() * (remaining / 2)) + 10;
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

            await reply(`🦄 *CORTANA CHANNEL REACTOR*\n\n🎯 Channel: \`${channelId}\`\n📝 Update: \`${updateId}\`\n\n📊 *Reaction Distribution:*\n${distributionText}\n\n⏳ Sending ${totalReactions} reactions...`);

            // Send reactions
            let successCount = 0;
            let errorCount = 0;

            for (const { emoji, count } of reactionDistribution) {
                for (let i = 0; i < count; i++) {
                    try {
                        // @ts-ignore - newsletterReactMessage might not be in types
                        await sock.newsletterReactMessage(channelId, updateId, emoji);
                        successCount++;

                        // Small delay to avoid rate limiting (every 50 reactions)
                        if (successCount % 50 === 0) {
                            await new Promise(r => setTimeout(r, 500));
                        }
                    } catch (e) {
                        errorCount++;
                        // If too many errors, stop
                        if (errorCount > 20) {
                            await reply(`❌ Too many errors! Stopped after ${successCount} reactions.\n\nMake sure the channel ID and update ID are correct!`);
                            return;
                        }
                    }
                }
            }

            await reply(`✅ *REACTIONS COMPLETE!*\n\n🎉 Successfully sent: ${successCount} reactions\n${errorCount > 0 ? `⚠️ Failed: ${errorCount}` : ''}`);

        } catch (error: any) {
            console.error("[REACTCHANNEL] Error:", error);
            await reply(`oh! man, the fowarded update doesnt match or invalid input, must follow input🏃‍♂️\n\nError: ${error.message || 'Unknown error'}\n\nUse *.channel-id* to find channel ID first!`);
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
