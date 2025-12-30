import { registerCommand } from "./types";
import axios from "axios";

// Random menu images
const MENU_IMAGES = [
    "https://files.catbox.moe/y0yjzu.jpg",
    "https://files.catbox.moe/2ob13q.jpg",
    "https://files.catbox.moe/zn4l18.jpg"
];
const MENU_AUDIO = "https://files.catbox.moe/4rj6pk.mp3";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        // Use remoteJid for the chat (works for both groups and PMs)
        const chatJid = msg.key.remoteJid!;
        // ═══════ REACT TO MENU COMMAND ═══════
        try {
            await sock.sendMessage(msg.key.remoteJid, {
                react: { text: "💃", key: msg.key }
            });
        } catch (e) {
            // Silent fail if react doesn't work
        }

        // ═══════ LETTER BY LETTER INTRO ═══════
        try {
            // Send initial message to the chat
            const sentMsg = await sock.sendMessage(chatJid, { text: "𝗖" });
            const introKey = sentMsg?.key;

            if (introKey) {
                const introText = "CORTANA IS HERE";
                let displayText = "";

                // Letter by letter typing animation
                for (let i = 0; i < introText.length; i++) {
                    displayText += introText[i];

                    await sock.sendMessage(chatJid, {
                        text: `*${displayText}*`,
                        edit: introKey
                    });

                    await new Promise(resolve => setTimeout(resolve, 80));
                }

                // Keep visible briefly
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (e) {
            console.error('[MENU] Intro error:', e);
            // Continue to menu even if intro fails
        }
        // ═══════ END INTRO ═══════

        const menuText = `🌺❀────────────────────────❀🌺
     C̷O̷R̷T̷A̷N̷A̷ ̷M̷D̷ 
   C H R I S T M A S  E D.
🌺❀────────────────────────❀🌺

🌷🌹 A N T I – F E A T U R E S 🌹🌷

[ VIEW ONCE ]
⮞ .vv1 (reply: reveal to chat)
⮞ .vv2 (reply: reveal to dm)
⮞ .antiviewonce-all-on
⮞ .antiviewonce-pm-on
⮞ .antiviewonce-off

[ ANTI DELETE ]
⮞ .antidelete-all-on
⮞ .antidelete-pm-on
⮞ .antidelete-off

[ ANTI EDIT ]
⮞ .antiedit-all-on
⮞ .antiedit-pm-on
⮞ .antiedit-off

[ AUTO STATUS ]
⮞ .autodownload-status-on
⮞ .autodownload-status-off
⮞ .autolikestatus-on
⮞ .autostatuslike-off

[ PRESENCE ]
⮞ .autorecording-all-on
⮞ .autorecording-pm-on
⮞ .autorecording-off
⮞ .autotyping-all-on
⮞ .autotyping-pm-on
⮞ .autotyping-off

[ GROUP SECURITY ]
⮞ .antilink-kick
⮞ .antilink-warn
⮞ .antilink-off
⮞ .antitag-kick
⮞ .antitag-warn
⮞ .antitag-off
⮞ .antileft <on/off> 😈
🌷───────────────────────────────🌷
⮞ .demote <@user>
⮞ .kick <@user>
⮞ .add <number>
⮞ .tagall <text>
⮞ .hidetag <text>
⮞ .open
⮞ .close
⮞ .link
⮞ .resetlink
⮞ .delete (reply)
⮞ .setppgc (reply image)
⮞ .approveall
⮞ .groupjid <link>
⮞ .gcname <text>
⮞ .gcdesc <text>


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
⮞ .spotify <link>


🌸🌼 DOWNLOADERS 🌼🌸
⮞ .tiktok <link>
⮞ .tiktokmp3 <link>
⮞ .facebook <link>
⮞ .ig <link>
⮞ .twitter <link>
⮞ .apk <app name>


🌸🌼 REACTIONS 🌼🌸
⮞ .hug
⮞ .kiss
⮞ .slap
⮞ .pat
⮞ .poke
⮞ .bonk
⮞ .bite
⮞ .cuddle
⮞ .wave
⮞ .wink
⮞ .smile
⮞ .cry
⮞ .blush
⮞ .happy
⮞ .dance
⮞ .yeet
⮞ .bully
⮞ .handhold
⮞ .highfive
⮞ .lick
⮞ .glomp
⮞ .nom
⮞ .kill
⮞ .awoo
⮞ .cringe


🌸🌼 FUN & MEMES 🌼🌸
⮞ .joke
⮞ .meme
⮞ .quote
⮞ .fact
⮞ .roast
⮞ .insult
⮞ .compliment
⮞ .burn
⮞ .ship <name1 name2>
⮞ .rate <thing>
⮞ .ask <question>
⮞ .pick <opt1 | opt2>
⮞ .owo <text>
⮞ .uwu <text>
⮞ .mock <text>
⮞ .zalgo <text>
⮞ .vaporwave <text>
⮞ .cowsay <text>
⮞ .clap <text>
⮞ .lenny
⮞ .tableflip
⮞ .unflip
⮞ .shrug
⮞ .facepalm
⮞ .disapprove
⮞ .wyr
⮞ .neverhave
⮞ .gg
⮞ .f
⮞ .chad
⮞ .based
⮞ .flex
⮞ .dank
⮞ .yolo
⮞ .legend
⮞ .dealwithit
⮞ .notbad
⮞ .oops
⮞ .love
⮞ .headpat
⮞ .triggered
⮞ .shipname <names>
⮞ .how <question>
⮞ .when <question>


🌸🌼 GAMES 🌼🌸
⮞ .truth
⮞ .dare
⮞ .math
⮞ .quiz
⮞ .trivia
⮞ .slot
⮞ .dice
⮞ .coinflip
⮞ .rps <choice>
⮞ .8ball <question>
⮞ .guessnumber
⮞ .hangman
⮞ .casino


🌸🌼 AI FEATURES 🌼🌸
⮞ .chatgpt <prompt>
⮞ .imagine <prompt>
⮞ .removebg (reply)
⮞ .ocr (reply)
⮞ .chatbot <on/off>
⮞ .aivision (reply)


🌸🌼 SEARCH & INFO 🌼🌸
⮞ .google <query>
⮞ .weather <city>
⮞ .wiki <topic>
⮞ .github <user>
⮞ .npm <package>
⮞ .dictionary <word>
⮞ .movie <name>


🌸🌼 ANIME & MANGA 🌼🌸
⮞ .waifu
⮞ .neko
⮞ .animequote
⮞ .anime <name>
⮞ .manga <name>
⮞ .character <name>
⮞ .shinobu
⮞ .megumin
⮞ .animewallpaper


🌸🌼 TEXT TOOLS 🌼🌸
⮞ .fancy <text>
⮞ .reverse <text>
⮞ .binary <text>
⮞ .morse <text>
⮞ .translate <lang> <text>
⮞ .emojimix <e1+e2>
⮞ .encrypt <text>
⮞ .decrypt <text>
⮞ .shorten <url>
⮞ .readmore <text>
⮞ .flip


🌸🌼 IMAGE EFFECTS 🌸
⮞ .blur (reply)
⮞ .enhance (reply)
⮞ .wanted (reply)
⮞ .wasted (reply)
⮞ .trigger (reply)
⮞ .circle (reply)
⮞ .sepia (reply)
⮞ .pixelate (reply)
⮞ .colorize (reply)


🌸🌼 OWNER MENU 🌸
⮞ .block <number>
⮞ .unblock <number>
⮞ .self
⮞ .public
⮞ .bc <message>
⮞ .setbio <text>
⮞ .setprefix <symbol>
⮞ .device (reply)


🌸🌼 GROUP MENU 🌼🌸
⮞ .promote <@user>
⮞ .demote <@user>
⮞ .kick <@user>
⮞ .add <number>
⮞ .tagall <text>
⮞ .hidetag <text>
⮞ .open
⮞ .close
⮞ .link
⮞ .resetlink
⮞ .setppgc (reply image)
⮞ .delete (reply message)
⮞ .channelid <link>


🌺❀────────────────────────❀🌺
     CORTANA MD
   C H R I S T M A S  E D.
🌺❀────────────────────────❀🌺


🌸🌼 UTILITIES 🌸
⮞ .sticker (reply)
⮞ .toimg (reply)
⮞ .qr <text>
⮞ .screenshot <url>
⮞ .wallpaper <query>
⮞ .calc <expression>
⮞ .ping
⮞ .runtime
⮞ .alive
⮞ .ip <ip>
⮞ .uuid
⮞ .hash <text>
⮞ .paste <text>


🐉 DANGER CORTANA COMMANDS 🐉
⮞ .forclose <num> ☠️
⮞ .hijackgc ☠️
⮞ .promoteall
⮞ .demoteall
⮞ .kickall ⚠️
⮞ .tempban <num>
⮞ .antiban <on/off>
⮞ .antibug <on/off>
⮞ .reactall <on/off>
⮞ .leaveall (exit all groups)


🔊 CORTANA MD • Christmas
💝 By èdûqarîz`;

        try {
            // Pick random menu image
            const randomImage = MENU_IMAGES[Math.floor(Math.random() * MENU_IMAGES.length)];

            // Send menu as forwarded message from verified channel
            await sock.sendMessage(chatJid, {
                image: { url: randomImage },
                caption: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363309657579178@newsletter",
                        newsletterName: "CORTANA x EDU-MD",
                        serverMessageId: 1
                    }
                }
            }, { quoted: msg });

            // Audio removed - format incompatible with WhatsApp voice notes

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
