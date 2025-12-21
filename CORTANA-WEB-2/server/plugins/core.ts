import { registerCommand } from "./types";

const MENU_IMAGE = "https://files.catbox.moe/69h2r0.jpg";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        // ═══════ TYPING INTRO ANIMATION ═══════
        const introText = "CORTANA IS HERE";
        let displayText = "";

        try {
            // Send initial empty message
            const sentMsg = await sock.sendMessage(senderJid, { text: "𝗖" });
            const introKey = sentMsg.key;

            // Typing animation - update message character by character
            for (let i = 0; i < introText.length; i++) {
                displayText += introText[i];

                // Update the message with growing text
                await sock.sendMessage(senderJid, {
                    text: `*${displayText}*`,
                    edit: introKey
                });

                // Delay between characters (90ms)
                await new Promise(resolve => setTimeout(resolve, 90));
            }

            // Display complete text for 1 second (keep it visible)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Don't delete - let it stay as intro
            // Small delay before showing menu
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (e) {
            console.error('[MENU] Intro animation error:', e);
            // Continue to menu even if intro fails
        }
        // ═══════ END INTRO ANIMATION ═══════

        const menuText = `🌺❀────────────────────────❀🌺
     C̷O̷R̷T̷A̷N̷A̷ ̷M̷D̷ 
   C H R I S T M A S  E D.
🌺❀────────────────────────❀🌺


🌸🌼 OWNER MENU 🌼🌸
⮞ .block <number>
⮞ .unblock <number>
⮞ .self | .public
⮞ .bc <message>
⮞ .setbio <text>
⮞ .antidelete <all-on/pm-on/off>
⮞ .autostatus <on/off>
⮞ .device (reply)


🌸🌼 AUTO-PRESENCE 🌼🌸
⮞ .autorecording <all-on/pm-on/off>
⮞ .autotyping <all-on/pm-on/off>
⮞ .autorecordtyping <on/off>
⮞ .presence-status


🌸🌼 GROUP MENU 🌼🌸
⮞ .antilink <kick/warn/off>
⮞ .antitag <kick/warn/off>
⮞ .promote <@user/reply>
⮞ .demote <@user/reply>
⮞ .kick <@user/reply>
⮞ .add <number>
⮞ .tagall <text>
⮞ .hidetag <text>
⮞ .open | .close
⮞ .link | .resetlink
⮞ .delete (reply)
⮞ .setppgc (reply image)
⮞ .approveall
⮞ .groupjid <link>
⮞ .kickall ⚠️
⮞ .hijackgc ☠️


🌸🌼 CHANNEL 🌼🌸
⮞ .channelid <link>


🌸🌼 MUSIC & AUDIO 🌼🌸
⮞ .play <name/link>
⮞ .song <name/link>
⮞ .lyrics <song name>
⮞ .soundcloud <link>
⮞ .ytmp3 <link>
⮞ .ytmp4 <link>
⮞ .yts <query>


🌸🌼 DOWNLOADERS 🌼🌸
⮞ .tiktok <link>
⮞ .ig <link>
⮞ .fb <link>
⮞ .twitter <link>


🌸🌼 REACTIONS 🌼🌸
⮞ .hug | .kiss | .slap
⮞ .pat | .poke | .bonk
⮞ .bite | .cuddle | .wave
⮞ .wink | .smile | .cry
⮞ .blush | .happy | .dance
⮞ .yeet | .bully | .handhold
⮞ .highfive | .lick | .glomp


🌸🌼 FUN & MEMES 🌼🌸
⮞ .joke | .meme | .quote
⮞ .fact | .roast | .insult
⮞ .compliment | .burn
⮞ .ship <name1 name2>
⮞ .rate <thing>
⮞ .ask <question>
⮞ .pick <opt1 | opt2>
⮞ .owo <text> | .uwu <text>
⮞ .mock <text>
⮞ .zalgo <text>
⮞ .vaporwave <text>
⮞ .cowsay <text>
⮞ .clap <text>
⮞ .lenny | .tableflip | .shrug
⮞ .wyr | .neverhave
⮞ .gg | .f | .chad | .based


🌸🌼 GAMES 🌼🌸
⮞ .truth | .dare
⮞ .math | .quiz | .trivia
⮞ .slot | .dice | .coinflip
⮞ .rps <rock/paper/scissors>
⮞ .8ball <question>
⮞ .guessnumber | .hangman


🌸🌼 AI FEATURES 🌼🌸
⮞ .chatgpt <prompt>
⮞ .imagine <prompt>
⮞ .removebg (reply image)
⮞ .ocr (reply image)
⮞ .chatbot <on/off>


🌸🌼 SEARCH & INFO 🌼🌸
⮞ .google <query>
⮞ .weather <city>
⮞ .wiki <topic>
⮞ .github <user>
⮞ .npm <package>
⮞ .dictionary <word>


🌸🌼 ANIME & MANGA 🌼🌸
⮞ .waifu | .neko
⮞ .animequote
⮞ .anime <name>
⮞ .manga <name>


🌸🌼 TEXT TOOLS 🌼🌸
⮞ .fancy <text>
⮞ .reverse <text>
⮞ .binary <text>
⮞ .morse <text>
⮞ .translate <lang> <text>


🌸🌼 IMAGE EFFECTS 🌼🌸
⮞ .blur | .enhance (reply)
⮞ .wanted | .wasted (reply)
⮞ .trigger | .circle (reply)
⮞ .sepia | .pixelate (reply)


🌸🌼 UTILITIES 🌼🌸
⮞ .sticker (reply)
⮞ .toimg (reply sticker)
⮞ .qr <text>
⮞ .screenshot <url>
⮞ .wallpaper <query>
⮞ .calc <expression>
⮞ .ping | .runtime | .alive


🔊 CORTANA MD • Christmas
💝 By èdûqarîz`;

        try {
            // Send menu as forwarded message from verified channel
            await sock.sendMessage(senderJid, {
                image: { url: MENU_IMAGE },
                caption: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363220704101715@newsletter",
                        newsletterName: "CORTANA x EDU-MD",
                        serverMessageId: 1
                    }
                }
            });
        } catch (error) {
            console.error('Error sending menu:', error);
            await reply(menuText);
        }
    }
});

registerCommand({
    name: "ping",
    description: "Check bot latency",
    category: "core",
    execute: async ({ reply }) => {
        const start = Date.now();
        await reply("Pinging...");
        const end = Date.now();
        await reply(`🏓 Pong! ${end - start}ms`);
    }
});

registerCommand({
    name: "runtime",
    aliases: ["uptime"],
    description: "Check bot runtime",
    category: "core",
    execute: async ({ reply }) => {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        await reply(`⏱️ *Bot Runtime*\n\n${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
});

registerCommand({
    name: "alive",
    description: "Check if bot is alive",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`✅ *CORTANA MD is alive!*\n\n🎄 Christmas Edition\n💝 Developed by èdûqarîz`);
    }
});
