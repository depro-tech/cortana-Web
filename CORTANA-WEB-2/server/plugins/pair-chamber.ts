import { registerCommand } from "./types";
import { requestPairingCode, disconnectSession } from "../whatsapp";
import { storage } from "../storage";

// ═══════════════════════════════════════════════════════════════
// PAIR CHAMBER - Sub-bot Creation System
// ═══════════════════════════════════════════════════════════════

registerCommand({
    name: "pair",
    description: "Create a sub-bot connected to your number",
    category: "pair chamber",
    execute: async ({ sock, args, msg, reply, senderJid }) => {
        const jid = msg.key.remoteJid!;
        const targetNumber = args[0];

        if (!targetNumber) {
            return reply("⚠️ Please provide a number to pair.\nExample: .pair 254712345678");
        }

        // Clean number
        const cleanNumber = targetNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
            return reply("❌ Invalid phone number format.");
        }

        await reply(`🔄 *Requesting Pair Code for ${cleanNumber}...*\n\n_Please wait while I contact the mothership..._`);

        try {
            // Request pairing code with creator tracking
            const { sessionId, pairingCode } = await requestPairingCode(cleanNumber, 'md', senderJid);

            // Format code for easier manual copying (split logic if needed, but raw is best for clipboard)
            // WhatsApp format usually just numbers.

            await sock.sendMessage(jid, {
                text: `✅ *PAIR CODE GENERATED*\n\n` +
                    `📱 Number: ${cleanNumber}\n` +
                    `📟 Code: *${pairingCode}*\n\n` +
                    `⚠️ _You have 1 minute to link this device._\n` +
                    `_Use WhatsApp > Linked Devices > Link a Device > Link with Phone Number._`
            }, { quoted: msg });

            // ⏱️ Auto-cleanup timeout (1 minute)
            // This runs in background to delete session if not connected
            setTimeout(async () => {
                try {
                    const session = await storage.getSession(sessionId);
                    if (session && session.status === 'pending') {
                        console.log(`[PAIR-CHAMBER] Session ${sessionId} timed out. Deleting.`);
                        await disconnectSession(sessionId);
                        await storage.deleteSession(sessionId);

                        // Optional: Notify user it timed out? 
                        // Might be spammy if they just forgot, but good for feedback.
                        // await sock.sendMessage(jid, { text: `⚠️ Pairing timeout for ${cleanNumber}. Session deleted.` });
                    }
                } catch (e: any) {
                    console.error(`[PAIR-CHAMBER] Timeout cleanup error: ${e.message}`);
                }
            }, 60 * 1000); // 60 seconds

        } catch (error: any) {
            console.error(`[PAIR-CHAMBER] Error: ${error.message}`);
            await reply(`❌ Failed to generate pair code.\nReason: ${error.message}`);
        }
    }
});

registerCommand({
    name: "listpaired",
    aliases: ["paired", "mybots"],
    description: "List all active sub-bots you have created",
    category: "pair chamber",
    execute: async ({ sock, msg, reply, senderJid }) => {
        try {
            const allSessions = await storage.getAllSessions();

            // Filter: Created by sender AND (Connected OR Pending)
            const mySessions = allSessions.filter(s =>
                (s.createdBy === senderJid) &&
                (s.status === 'connected' || s.status === 'pending')
            );

            if (mySessions.length === 0) {
                return reply("🤖 *Active Sub-Bots: 0*\n\nYou haven't created any sub-bots yet.\nUse `.pair <number>` to start.");
            }

            let text = `🤖 *YOUR PAIR CHAMBER* (${mySessions.length})\n\n`;

            mySessions.forEach((s, index) => {
                const age = new Date().getTime() - new Date(s.createdAt!).getTime();
                const ageMins = Math.floor(age / 60000);
                const icon = s.status === 'connected' ? '✅' : '⏳';

                text += `${index + 1}. *${s.phoneNumber}* ${icon}\n`;
                text += `   └ Status: ${s.status?.toUpperCase()}\n`;
                text += `   └ Created: ${ageMins}m ago\n\n`;
            });

            text += `_✅ Connected | ⏳ Pending_`;

            await reply(text);

        } catch (error: any) {
            console.error(`[PAIR-CHAMBER] List error: ${error.message}`);
            await reply("❌ Failed to fetch list.");
        }
    }
});
