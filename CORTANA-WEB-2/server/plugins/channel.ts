import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// CHANNEL CHAMBER - Channel Management Commands
// ═══════════════════════════════════════════════════════════

// Reaction emojis pool for channel reactions
const REACTION_EMOJIS = ["🦄", "💃", "😂", "😽", "😒", "🏃‍♂️", "😊", "🤣", "❤️", "🔥", "👏", "😍", "🙌", "💯", "👀", "🎉"];

// Store pending reaction sessions
const pendingReactions = new Map<string, {
    channelJid: string;
    channelName: string;
}>();

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
            const code = link.split("/channel/")[1]?.split("/")[0];
            if (!code) return reply("Invalid link format");

            try {
                // @ts-ignore
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
    description: "React to a channel update with 1000 reactions",
    category: "channel",
    usage: ".reactchannel <channel link>",
    ownerOnly: true,
    execute: async ({ args, reply, sock, msg }) => {
        const input = args.join(" ");
        const chatJid = msg.key.remoteJid!;

        // Check if user is providing server ID for pending session
        if (input && /^\d+$/.test(input.trim())) {
            const serverId = input.trim();
            const session = pendingReactions.get(chatJid);

            if (session) {
                // Clear the session
                pendingReactions.delete(chatJid);

                // Send reactions
                return await sendReactionsToUpdate(sock, session.channelJid, session.channelName, serverId, reply);
            } else {
                return reply("oh! man, no channel selected🏃‍♂️\n\nFirst run: .reactchannel <channel_link>");
            }
        }

        // Validate channel link
        if (!input || !input.includes("whatsapp.com/channel/")) {
            return reply("🦄 *CORTANA CHANNEL REACTOR*\n\n*Usage:*\n1️⃣ .reactchannel <channel_link>\n2️⃣ Forward an update from that channel here\n3️⃣ Type the server ID shown in the forward\n\nExample:\n.reactchannel https://whatsapp.com/channel/0029xxx");
        }

        try {
            // Extract channel code from link
            const code = input.split("/channel/")[1]?.split("/")[0]?.split("?")[0];
            if (!code) {
                return reply("oh! man, invalid channel link format🏃‍♂️");
            }

            await reply("⏳ Looking up channel...");

            // Get channel metadata
            let channelJid: string;
            let channelName: string;
            let subscribers: number;
            try {
                // @ts-ignore
                const metadata = await sock.newsletterMetadata("invite", code);
                if (!metadata || !metadata.id) {
                    return reply("oh! man, couldn't find that channel🏃‍♂️\n\nMake sure the link is valid!");
                }
                channelJid = metadata.id;
                channelName = metadata.name || "Unknown Channel";
                subscribers = metadata.subscribers || 0;
            } catch (e: any) {
                return reply(`oh! man, error fetching channel🏃‍♂️\n\n${e.message}`);
            }

            // Store session
            pendingReactions.set(chatJid, { channelJid, channelName });

            // Auto-expire session after 5 minutes
            setTimeout(() => {
                pendingReactions.delete(chatJid);
            }, 300000);

            await reply(`🦄 *CORTANA CHANNEL REACTOR*\n\n✅ *Channel Found!*\n\n📢 Name: *${channelName}*\n👥 Subscribers: ${subscribers.toLocaleString()}\n🎯 JID: \`${channelJid}\`\n\n━━━━━━━━━━━━━━━━━━━━━\n\n*Next Step:*\n1️⃣ Go to the channel in WhatsApp\n2️⃣ Find the update you want to react to\n3️⃣ Long-press the update → "Forward"\n4️⃣ Forward it here\n5️⃣ Check the *server ID* in the forward info\n6️⃣ Type: *.reactchannel <server_id>*\n\n_Example: .reactchannel 143_\n\n⏳ Session expires in 5 minutes`);

        } catch (error: any) {
            console.error("[REACTCHANNEL] Error:", error);
            await reply(`oh! man, something went wrong🏃‍♂️\n\n${error.message}`);
        }
    }
});

// Helper function to send reactions
async function sendReactionsToUpdate(
    sock: any,
    channelJid: string,
    channelName: string,
    serverId: string,
    reply: (text: string) => Promise<any>
) {
    try {
        // Generate 1000 reactions with random distribution
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

        await reply(`🦄 *SENDING ${totalReactions} REACTIONS!*\n\n📢 Channel: *${channelName}*\n📝 Server ID: \`${serverId}\`\n\n📊 *Distribution:*\n${distributionText}\n\n⏳ Please wait...`);

        let successCount = 0;
        let errorCount = 0;
        let lastError = "";

        for (const { emoji, count } of reactionDistribution) {
            for (let i = 0; i < count; i++) {
                try {
                    // @ts-ignore
                    await sock.newsletterReactMessage(channelJid, serverId, emoji);
                    successCount++;

                    if (successCount % 25 === 0) {
                        await new Promise(r => setTimeout(r, 200));
                    }
                } catch (e: any) {
                    errorCount++;
                    lastError = e.message || "Unknown";
                    console.error("[REACTCHANNEL] Error:", e.message);
                    if (errorCount > 15) {
                        await reply(`❌ Too many errors after ${successCount} reactions.\n\nLast error: ${lastError}\n\n*Tips:*\n• Make sure you're subscribed to the channel\n• Verify the server ID is correct\n• The update might no longer exist`);
                        return;
                    }
                }
            }
        }

        const emoji = successCount >= 900 ? "🎉" : successCount >= 500 ? "✅" : "⚠️";
        await reply(`${emoji} *REACTIONS COMPLETE!*\n\n📢 *${channelName}*\n✅ Sent: ${successCount}/${totalReactions}\n${errorCount > 0 ? `⚠️ Failed: ${errorCount}` : ''}`);

    } catch (error: any) {
        await reply(`❌ Error sending reactions: ${error.message}`);
    }
}

registerCommand({
    name: "ch-ban",
    aliases: ["channel-ban"],
    description: "Ban user from channel (Coming Soon)",
    category: "channel",
    execute: async ({ reply }) => {
        await reply("⏳ *COMING SOON IN THE NEXT UPDATE*\n\nChannel ban functionality is currently under development and will be available in the next release. Stay tuned! 🚀");
    }
});
