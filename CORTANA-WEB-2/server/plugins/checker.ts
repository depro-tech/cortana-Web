
import { registerCommand } from "./types";

registerCommand({
    name: "check-ban-status",
    aliases: ["checkban", "banstatus", "isbanned"],
    description: "Check if a number is banned on WhatsApp",
    category: "checker",
    execute: async ({ sock, args, reply }) => {
        const input = args.join(" ");
        if (!input) return reply("❌ Please provide a number to check.\nUsage: .check-ban-status <number>");

        const cleanNumber = input.replace(/[^0-9]/g, "");
        if (cleanNumber.length < 7) return reply("❌ Invalid number length. Please check the number.");

        const jid = cleanNumber + "@s.whatsapp.net";

        await reply(`🔍 Checking global ban status for *+${cleanNumber}*...`);

        try {
            // Check existence on WhatsApp
            // onWhatsApp returns an array of found JIDs. 
            // If empty, the number is NOT registered (likely banned/nuked)
            const result = await sock.onWhatsApp(jid);

            const isRegistered = result && result.length > 0 && result[0].exists;

            if (!isRegistered) {
                // BANNED / NUKED
                await reply(`🚫 *BAN DETECTED* 🚫\n\nHola, rest kid, target (+${cleanNumber}) nuked by Cortana ☠️\nFollow instructions or ya'll the next ⚰️`);
            } else {
                // SAFE
                await reply(`✅ *SAFE STATUS* ✅\n\nNo more pain my bro, target (+${cleanNumber}) unbanned by Cortana ✨\nUser can now Breath or get nuked when necessary 😮‍💨`);
            }
        } catch (e) {
            console.error('Ban check error:', e);
            await reply("❌ Error checking status. The API might be rate limited or busy. Try again.");
        }
    }
});

registerCommand({
    name: "unban-num",
    aliases: ["unban-gen", "appeal", "unbangen"],
    description: "Generate unban appeal and support links",
    category: "checker",
    execute: async ({ args, reply }) => {
        const input = args.join(" ");
        if (!input) return reply("❌ Please provide the banned number.");
        const cleanNumber = input.replace(/[^0-9]/g, "");

        const emailSubject = `Unban Request: ${cleanNumber}`;
        // Professional appeal text
        const emailBody = `Hello WhatsApp Support Team,%0D%0A%0D%0AMy WhatsApp account assigned to +${cleanNumber} has been banned. I believe this is a mistake as I strictly follow the Terms of Service. I use this account for important communication.%0D%0A%0D%0APlease review my account and restore access as soon as possible.%0D%0A%0D%0AThank you.`;

        const mailto = `mailto:support@support.whatsapp.com?subject=${emailSubject}&body=${emailBody}`;

        await reply(`🚑 *UNBAN ASSISTANT* 🚑\n\n` +
            `Target: +${cleanNumber}\n\n` +
            `📝 *Option 1: Email Appeal (Recommended)*\n` +
            `Click link to send pre-filled email:\n` +
            `${mailto}\n\n` +
            `💬 *Option 2: Chat Support*\n` +
            `Open Official Support Chat:\nhttps://wa.me/447903565983\n\n` +
            `_Use Option 1 for faster results!_`);
    }
});

registerCommand({
    name: "support",
    description: "Get WhatsApp Support Links",
    category: "checker",
    execute: async ({ args, reply }) => {
        const type = args[0]?.toLowerCase() || "all";

        let text = `📞 *WHATSAPP SUPPORT LINKS* 📞\n\n`;

        if (type === "business" || type === "all") {
            text += `🏢 *Business Support (Chat):*\nhttps://wa.me/447903565983\n\n`;
        }

        if (type === "normal" || type === "all") {
            text += `👤 *General Support (Form):*\nhttps://www.whatsapp.com/contact/\n\n`;
        }

        text += `📧 *Email Support:*\nsupport@support.whatsapp.com\nandroid_web@support.whatsapp.com`;

        await reply(text);
    }
});
