import { registerCommand } from "./types";

// ═══════════════════════════════════════════════════════════
// CHANNEL CHAMBER - Channel Management Commands
// ═══════════════════════════════════════════════════════════

// Reaction emojis pool for channel reactions
const REACTION_EMOJIS = ["🦄", "💃", "😂", "😽", "😒", "🏃‍♂️", "😊", "🤣", "❤️", "🔥", "👏", "😍", "🙌", "💯", "👀", "🎉"];

// Store waiting sessions: chatJid -> channelJid
const waitingForUpdate = new Map<string, { jid: string; name: string }>();

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
    usage: ".reactchannel <channel_link>",
    ownerOnly: true,
    execute: async ({ args, reply, sock, msg }) => {
        const chatJid = msg.key.remoteJid!;
        const input = args.join(" ");

        // Case 1: Start Flow - User provides link
        if (input.includes("whatsapp.com/channel/")) {
            const code = input.split("/channel/")[1]?.split("/")[0]?.split("?")[0];
            if (!code) return reply("oh! man, invalid channel link format🏃‍♂️");

            try {
                // @ts-ignore
                const metadata = await sock.newsletterMetadata("invite", code);
                if (!metadata || !metadata.id) {
                    return reply("oh! man, channel not found🏃‍♂️");
                }

                // Set waiting state
                waitingForUpdate.set(chatJid, { jid: metadata.id, name: metadata.name });

                await reply(`🦄 *CORTANA REACTION MODE*\n\n📢 Targeted: *${metadata.name}*\n\n*NOW:* Forward the update you want to react to HERE.\n\n_Waiting for forwarded message..._`);
                return;
            } catch (e: any) {
                return reply(`Error: ${e.message}`);
            }
        }

        // Case 2: Handling Forwarded Message (context-based)
        const waiting = waitingForUpdate.get(chatJid);

        // Check for forwarded info in current message or quoted message
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo ||
            msg.message?.documentMessage?.contextInfo;

        const quotedContext = contextInfo?.quotedMessage?.extendedTextMessage?.contextInfo ||
            contextInfo?.quotedMessage?.imageMessage?.contextInfo ||
            contextInfo?.quotedMessage?.videoMessage?.contextInfo;

        // Determine if there is a forwarded newsletter info
        let newsletterInfo = contextInfo?.forwardedNewsletterMessageInfo || quotedContext?.forwardedNewsletterMessageInfo;

        // If not explicit forwarded info, check stanzas for direct newsletter messages
        if (!newsletterInfo && waiting) {
            // Check if the current message IS from the newsletter (unlikely in DM but possible)
            if (msg.key.remoteJid === waiting.jid) {
                // Direct message from channel
                // Construct pseudo info
                newsletterInfo = {
                    newsletterJid: waiting.jid,
                    serverMessageId: parseInt(msg.key.id || "0"), // Heuristic
                    newsletterName: waiting.name
                };
            }
        }

        if (waiting && newsletterInfo) {
            const forwardedJid = newsletterInfo.newsletterJid;
            const serverId = newsletterInfo.serverMessageId;

            // Strict check: Must match the requested channel
            if (forwardedJid !== waiting.jid) {
                return reply(`❌ *Wrong Channel!*\n\nYou forwarded an update from:\n"${newsletterInfo.newsletterName}"\n\nBut we are targeting:\n"${waiting.name}"\n\nPlease forward an update from the CORRECT channel!`);
            }

            if (!serverId) {
                return reply("❌ Could not extract Server ID from this message. Try another update.");
            }

            // Clear waiting state
            waitingForUpdate.delete(chatJid);

            // Execute Reactions
            await sendReactions(sock, waiting.jid, waiting.name, serverId.toString(), reply);
            return;
        }

        // If command run without link and no pending session
        if (!waiting) {
            return reply(`🦄 *CORTANA CHANNEL REACTOR*\n\nUsage:\n1. *.reactchannel <link>*\n2. Forward an update when asked.`);
        }

        // If waiting but message wasn't a valid forward
        if (waiting) {
            return reply(`⚠️ *Waiting for Forward*\n\nPlease forward a message from *${waiting.name}* to this chat so I can get the ID!`);
        }
    }
});

// Listener for catching forwards without command (when waiting)
// Note: This logic is usually better inside the main handler, 
// but since we are in a plugin, we rely on the execute command trigger.
// BUT: The user will likely just forward the message, NOT run the command again.
// So we need to handle this.
// For now, let's instruct the user to "Forward, then reply to it with .reactchannel" OR
// keep the flow simple: "Reply to forwarded message with .reactchannel" (previous flow)

// Actually, the user's request: ".reactchannel <id> then user is requested to reply with update"
// This implies interactive flow.

// Let's modify the above execution to be smart:
// If just ".reactchannel" is typed while waiting, check the quoted message!

async function sendReactions(sock: any, jid: string, name: string, serverId: string, reply: any) {
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
    const distText = reactionDistribution.map(r => `${r.count} ${r.emoji}`).join(" • ");

    await reply(`🦄 *SENDING REACTIONS via ID ${serverId}*\n\n📢 *${name}*\n📊 ${distText}\n\n⏳ Sending...`);

    let success = 0;
    for (const { emoji, count } of reactionDistribution) {
        for (let i = 0; i < count; i++) {
            try {
                // @ts-ignore
                await sock.newsletterReactMessage(jid, serverId, emoji);
                success++;
                if (success % 20 === 0) await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                // ignore
            }
        }
    }
    await reply(`✅ Done! Sent ${success}/${totalReactions} reactions to ${name}`);
}

registerCommand({
    name: "ch-ban",
    aliases: ["channel-ban"],
    description: "Ban user from channel (Coming Soon)",
    category: "channel",
    execute: async ({ reply }) => {
        await reply("⏳ *COMING SOON*");
    }
});
