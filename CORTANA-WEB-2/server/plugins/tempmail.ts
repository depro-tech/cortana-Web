import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// TEMPMAIL COMMAND - Create temporary disposable email
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tempmail",
    aliases: ["tempemail", "tempmailcreate", "createmail"],
    description: "Create temporary disposable email",
    category: "tools",
    usage: ".tempmail",
    execute: async ({ reply, sock, msg }) => {
        const jid = msg.key.remoteJid!;

        try {
            await sock.sendMessage(jid, { react: { text: "⌛", key: msg.key } }).catch(() => { });
            await reply("⏳ *Creating temporary email...*");

            const response = await axios.get('https://api.nekolabs.web.id/tools/tempmail/v3/create', {
                timeout: 30000
            });

            if (!response.data.success || !response.data.result) {
                throw new Error('Failed to create temporary email');
            }

            const { email, sessionId, expiresAt } = response.data.result;
            const expires = new Date(expiresAt).toLocaleString();

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

            const message = `*📧 CORTANA TEMP MAIL*\n\n` +
                `✅ *Email Created Successfully!*\n\n` +
                `📬 *Your Email:*\n\`${email}\`\n\n` +
                `🔑 *Session ID:*\n\`${sessionId}\`\n\n` +
                `⏰ *Expires:* ${expires}\n\n` +
                `━━━━━━━━━━━━━━━━━\n` +
                `📋 *How to check inbox:*\n` +
                `\`.tempinbox ${sessionId}\`\n\n` +
                `💡 *Tip:* Save your session ID to check inbox later!`;

            await reply(message);

        } catch (error: any) {
            console.error('[TEMPMAIL] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });

            let errorMessage = "Failed to create temporary email. ";
            if (error.message.includes('timeout')) {
                errorMessage += "API took too long, try again later.";
            } else if (error.message.includes('Network')) {
                errorMessage += "Network error. Check connection.";
            } else {
                errorMessage += error.message;
            }

            await reply(`❌ ${errorMessage}`);
        }
    }
});

// ═══════════════════════════════════════════════════════════════
// TEMPINBOX COMMAND - Check temporary email inbox
// ═══════════════════════════════════════════════════════════════
registerCommand({
    name: "tempinbox",
    aliases: ["checkinbox", "tempmailinbox", "tempcheck", "inbox"],
    description: "Check your temporary email inbox",
    category: "tools",
    usage: ".tempinbox <session_id>",
    execute: async ({ args, reply, sock, msg }) => {
        const jid = msg.key.remoteJid!;
        const sessionId = args[0];

        if (!sessionId) {
            return reply(
                `*📬 CORTANA TEMP INBOX*\n\n` +
                `❌ *Missing Session ID!*\n\n` +
                `📋 *Usage:*\n\`.tempinbox YOUR_SESSION_ID\`\n\n` +
                `💡 *Example:*\n\`.tempinbox abc123xyz789\`\n\n` +
                `🔑 Get session ID from \`.tempmail\` command`
            );
        }

        try {
            await sock.sendMessage(jid, { react: { text: "⌛", key: msg.key } }).catch(() => { });
            await reply("📬 *Checking inbox...*");

            const response = await axios.get(`https://api.nekolabs.web.id/tools/tempmail/v3/inbox?id=${sessionId}`, {
                timeout: 30000
            });

            if (!response.data.success) {
                throw new Error('Invalid session ID or inbox expired');
            }

            const { totalEmails, emails } = response.data.result;

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } }).catch(() => { });

            if (totalEmails === 0) {
                return reply(
                    `*📬 CORTANA TEMP INBOX*\n\n` +
                    `📭 *Inbox Empty*\n\n` +
                    `No emails received yet.\n` +
                    `Use your temp email somewhere and check back!\n\n` +
                    `📊 Total Emails: 0`
                );
            }

            let inboxText = `*📬 CORTANA TEMP INBOX*\n\n` +
                `📊 *Total Emails:* ${totalEmails}\n` +
                `━━━━━━━━━━━━━━━━━\n\n`;

            emails.forEach((email: any, index: number) => {
                inboxText += `*📨 Email ${index + 1}*\n`;
                inboxText += `📤 *From:* ${email.from || 'Unknown'}\n`;
                inboxText += `📝 *Subject:* ${email.subject || 'No Subject'}\n`;

                if (email.text && email.text.trim()) {
                    const cleanText = email.text.replace(/\r\n/g, '\n').trim();
                    const preview = cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
                    inboxText += `💬 *Content:*\n${preview}\n`;
                }

                if (email.downloadUrl) {
                    inboxText += `📎 *Attachment:* ${email.downloadUrl}\n`;
                }

                inboxText += `\n`;
            });

            // Split if too long
            if (inboxText.length > 4000) {
                const parts = inboxText.match(/.{1,4000}/gs) || [];
                for (const part of parts) {
                    await reply(part);
                }
            } else {
                await reply(inboxText);
            }

        } catch (error: any) {
            console.error('[TEMPINBOX] Error:', error);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } }).catch(() => { });

            let errorMessage = "Failed to check inbox. ";
            if (error.message.includes('Invalid session') || error.message.includes('404')) {
                errorMessage += "Session expired or invalid. Create a new email with .tempmail";
            } else if (error.message.includes('timeout')) {
                errorMessage += "API timeout. Try again.";
            } else {
                errorMessage += error.message;
            }

            await reply(`❌ ${errorMessage}`);
        }
    }
});
