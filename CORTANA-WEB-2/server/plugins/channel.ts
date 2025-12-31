import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// CHANNEL CHAMBER - Channel Management Commands
// ═══════════════════════════════════════════════════════════

// Reaction emojis pool for channel reactions
const REACTION_EMOJIS = ["🦄", "💃", "😂", "😽", "😒", "🏃‍♂️", "😊", "🤣", "❤️", "🔥", "👏", "😍", "🙌", "💯", "👀", "🎉"];

// Store pending reaction sessions (channelJid -> { updates, chatJid, listMsgKey })
const pendingReactions = new Map<string, {
    channelJid: string;
    channelName: string;
    updates: { serverId: string; preview: string }[];
    chatJid: string;
    listMsgKey: any;
    sock: any;
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

        // Check if user is selecting an update from previous list
        if (input && /^\d{1,2}$/.test(input.trim())) {
            const selection = parseInt(input.trim());
            const sessionKey = chatJid;
            const session = pendingReactions.get(sessionKey);

            if (session && selection >= 1 && selection <= session.updates.length) {
                const selectedUpdate = session.updates[selection - 1];

                // Delete the list message
                if (session.listMsgKey) {
                    try {
                        await sock.sendMessage(chatJid, { delete: session.listMsgKey });
                    } catch (e) {
                        console.log("[REACTCHANNEL] Could not delete list message");
                    }
                }

                // Clear the session
                pendingReactions.delete(sessionKey);

                // Now send reactions
                return await sendReactionsToUpdate(sock, chatJid, session.channelJid, session.channelName, selectedUpdate.serverId, reply);
            }
        }

        // Validate channel link
        if (!input || !input.includes("whatsapp.com/channel/")) {
            return reply("🦄 *CORTANA CHANNEL REACTOR*\n\n*Usage:* .reactchannel <channel_link>\n\nExample:\n.reactchannel https://whatsapp.com/channel/0029xxx\n\nThe bot will show recent updates to choose from!");
        }

        try {
            // Extract channel code from link
            const code = input.split("/channel/")[1]?.split("/")[0]?.split("?")[0];
            if (!code) {
                return reply("oh! man, invalid channel link format🏃‍♂️");
            }

            await reply("⏳ Fetching channel info and recent updates...");

            // Get channel metadata
            let channelJid: string;
            let channelName: string;
            try {
                // @ts-ignore
                const metadata = await sock.newsletterMetadata("invite", code);
                if (!metadata || !metadata.id) {
                    return reply("oh! man, couldn't find that channel🏃‍♂️\n\nMake sure the link is valid!");
                }
                channelJid = metadata.id;
                channelName = metadata.name || "Unknown Channel";
            } catch (e: any) {
                return reply(`oh! man, error fetching channel🏃‍♂️\n\n${e.message}`);
            }

            // Fetch recent messages/updates from the channel
            let updates: { serverId: string; preview: string }[] = [];
            try {
                // @ts-ignore - newsletterFetchMessages(jid, count, since, after)
                const result = await sock.newsletterFetchMessages(channelJid, 15, 0, 0);

                console.log("[REACTCHANNEL] Fetch result:", JSON.stringify(result, null, 2));

                // Parse the result to extract messages
                if (result && result.content) {
                    for (const item of result.content) {
                        if (item.tag === 'message' && item.attrs) {
                            const serverId = item.attrs.server_id || item.attrs.id;
                            // Try to get message preview
                            let preview = "Update #" + serverId;

                            // Try to extract text content
                            if (item.content) {
                                for (const content of item.content) {
                                    if (content.tag === 'plaintext' && content.content) {
                                        const text = Buffer.isBuffer(content.content)
                                            ? content.content.toString('utf-8')
                                            : String(content.content);
                                        preview = text.substring(0, 50) + (text.length > 50 ? "..." : "");
                                        break;
                                    }
                                }
                            }

                            if (serverId) {
                                updates.push({ serverId: serverId.toString(), preview });
                            }
                        }
                    }
                }
            } catch (e: any) {
                console.error("[REACTCHANNEL] Fetch error:", e);
                return reply(`oh! man, couldn't fetch updates🏃‍♂️\n\n${e.message}\n\nMake sure you're subscribed to the channel!`);
            }

            if (updates.length === 0) {
                return reply("oh! man, no updates found in this channel🏃‍♂️\n\nThe channel might be empty or you need to subscribe first!");
            }

            // Limit to 10 updates
            updates = updates.slice(0, 10);

            // Create selection list message
            let listText = `🦄 *CORTANA CHANNEL REACTOR*\n\n📢 *${channelName}*\n\n*Select an update to react:*\n\n`;

            updates.forEach((update, index) => {
                listText += `*${index + 1}.* ${update.preview}\n   └─ ID: \`${update.serverId}\`\n\n`;
            });

            listText += `\n_Reply with the number (1-${updates.length}) to send 1000 reactions!_\n\n_Or type *.reactchannel cancel* to cancel_`;

            // Send the list and store the session
            const listMsg = await sock.sendMessage(chatJid, { text: listText });

            // Store session for this chat
            pendingReactions.set(chatJid, {
                channelJid,
                channelName,
                updates,
                chatJid,
                listMsgKey: listMsg?.key,
                sock
            });

            // Auto-expire session after 2 minutes
            setTimeout(() => {
                if (pendingReactions.has(chatJid)) {
                    pendingReactions.delete(chatJid);
                }
            }, 120000);

        } catch (error: any) {
            console.error("[REACTCHANNEL] Error:", error);
            await reply(`oh! man, something went wrong🏃‍♂️\n\n${error.message}`);
        }
    }
});

// Handle numeric replies for update selection
registerCommand({
    name: "1",
    aliases: ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
    description: "Select update for reactchannel",
    category: "channel",
    hidden: true,
    execute: async ({ msg, sock, reply }) => {
        const chatJid = msg.key.remoteJid!;
        const session = pendingReactions.get(chatJid);

        if (!session) return; // No pending session

        const text = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text || "";
        const selection = parseInt(text.replace(/^\./, "").trim());

        if (isNaN(selection) || selection < 1 || selection > session.updates.length) {
            return reply(`Invalid selection! Choose 1-${session.updates.length}`);
        }

        const selectedUpdate = session.updates[selection - 1];

        // Delete the list message
        if (session.listMsgKey) {
            try {
                await sock.sendMessage(chatJid, { delete: session.listMsgKey });
            } catch (e) {
                console.log("[REACTCHANNEL] Could not delete list message");
            }
        }

        // Clear the session
        pendingReactions.delete(chatJid);

        // Send reactions
        await sendReactionsToUpdate(sock, chatJid, session.channelJid, session.channelName, selectedUpdate.serverId, reply);
    }
});

// Helper function to send reactions
async function sendReactionsToUpdate(
    sock: any,
    chatJid: string,
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

        await reply(`🦄 *SENDING REACTIONS!*\n\n📢 Channel: *${channelName}*\n📝 Update ID: \`${serverId}\`\n\n📊 *Distribution:*\n${distributionText}\n\n⏳ Sending ${totalReactions} reactions...`);

        let successCount = 0;
        let errorCount = 0;

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
                    if (errorCount > 10) {
                        await reply(`❌ Too many errors after ${successCount} reactions.\n\nError: ${e.message}`);
                        return;
                    }
                }
            }
        }

        await reply(`🎉 *REACTIONS COMPLETE!*\n\n📢 *${channelName}*\n✅ Sent: ${successCount}/${totalReactions}\n${errorCount > 0 ? `⚠️ Failed: ${errorCount}` : ''}`);

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
