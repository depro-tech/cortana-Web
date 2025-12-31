import { registerCommand } from "./types";
import axios from "axios";

// Menu images - rotate sequentially
const MENU_IMAGES = [
    "https://files.catbox.moe/y0yjzu.jpg",
    "https://files.catbox.moe/2ob13q.jpg",
    "https://files.catbox.moe/zn4l18.jpg"
];
let menuImageIndex = 0; // Counter for sequential rotation
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
        // Calculate Uptime
        const uptime = process.uptime();
        const d = Math.floor(uptime / 86400);
        const h = Math.floor((uptime % 86400) / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeString = d + "d " + h + "h " + m + "m " + s + "s";

        // Calculate Greeting with emojis
        const hour = new Date().getHours();
        let greeting = "🌙 Good Night";
        if (hour >= 5 && hour < 12) greeting = "🌅 Good Morning";
        else if (hour >= 12 && hour < 18) greeting = "☀️ Good Afternoon";
        else if (hour >= 18 && hour < 22) greeting = "🌆 Good Evening";

        const pushName = msg.pushName || "User";

        const menuText = "======= CORTANA MD UTRA =======\n" +
            "Version: Gen II\n" +
            "Uptime: " + uptimeString + "\n" +
            greeting + ", " + pushName + "!\n" +
            "Creator: EDUQARIZ\n" +
            "Availability: All-Day\n" +
            "================================\n\n" +
            "--- ANTI FEATURES ---\n\n" +
            "VIEW ONCE:\n" +
            ".vv1 (reply: reveal to chat)\n" +
            ".vv2 (reply: reveal to dm)\n" +
            ".antiviewonce-all-on\n" +
            ".antiviewonce-pm-on\n" +
            ".antiviewonce-off\n\n" +
            "ANTI DELETE:\n" +
            ".antidelete-all-on\n" +
            ".antidelete-pm-on\n" +
            ".antidelete-off\n\n" +
            "ANTI EDIT:\n" +
            ".antiedit-all-on\n" +
            ".antiedit-pm-on\n" +
            ".antiedit-off\n\n" +
            "AUTO STATUS:\n" +
            ".autodownload-status-on\n" +
            ".autodownload-status-off\n" +
            ".autolikestatus-on\n" +
            ".autostatuslike-off\n\n" +
            "PRESENCE:\n" +
            ".autorecording-all-on\n" +
            ".autorecording-pm-on\n" +
            ".autorecording-off\n" +
            ".autotyping-all-on\n" +
            ".autotyping-pm-on\n" +
            ".autotyping-off\n\n" +
            "--- GROUP SECURITY ---\n" +
            ".antilink-kick\n" +
            ".antilink-warn\n" +
            ".antilink-off\n" +
            ".antitag-kick\n" +
            ".antitag-warn\n" +
            ".antitag-off\n" +
            ".antileft <on/off>\n\n" +
            ".demote <@user>\n" +
            ".kick <@user>\n" +
            ".add <number>\n" +
            ".tagall <text>\n" +
            ".hidetag <text>\n" +
            ".open\n" +
            ".close\n" +
            ".link\n" +
            ".resetlink\n" +
            ".delete (reply)\n" +
            ".setppgc (reply image)\n" +
            ".approveall\n" +
            ".groupjid <link>\n" +
            ".gcname <text>\n" +
            ".gcdesc <text>\n\n" +
            "--- CHANNEL ---\n" +
            ".channelid <link>\n\n" +
            "--- MUSIC & AUDIO ---\n" +
            ".play <name/link>\n" +
            ".song <name/link>\n" +
            ".lyrics <song name>\n" +
            ".soundcloud <link>\n" +
            ".ytmp3 <link>\n" +
            ".ytmp4 <link>\n" +
            ".yts <query>\n" +
            ".spotify <link>\n\n" +
            "--- DOWNLOADERS ---\n" +
            ".tiktok <link>\n" +
            ".tiktokmp3 <link>\n" +
            ".facebook <link>\n" +
            ".ig <link>\n" +
            ".twitter <link>\n" +
            ".apk <app name>\n\n" +
            "--- REACTIONS ---\n" +
            ".hug .kiss .slap .pat .poke .bonk .bite .cuddle .wave .wink .smile .cry .blush .happy .dance .yeet .bully .handhold .highfive .lick .glomp .nom .kill .awoo .cringe\n\n" +
            "--- FUN & MEMES ---\n" +
            ".joke .meme .quote .fact .roast .insult .compliment .burn .ship .rate .ask .pick .owo .uwu .mock .zalgo .vaporwave .cowsay .clap .lenny .tableflip .unflip .shrug .facepalm .wyr .gg .f .chad .love .triggered\n\n" +
            "--- GAMES ---\n" +
            ".truth .dare .math .quiz .trivia .slot .dice .coinflip .rps .8ball .guessnumber .hangman .casino\n\n" +
            "--- AI FEATURES ---\n" +
            ".chatgpt <prompt>\n" +
            ".imagine <prompt>\n" +
            ".removebg (reply)\n" +
            ".ocr (reply)\n" +
            ".chatbot <on/off>\n" +
            ".aivision (reply)\n\n" +
            "--- UTILITIES ---\n" +
            ".sticker (reply)\n" +
            ".toimg (reply)\n" +
            ".qr <text>\n" +
            ".screenshot <url>\n" +
            ".wallpaper <query>\n" +
            ".calc <expression>\n" +
            ".ping .runtime .alive\n" +
            ".ip <ip> .uuid .hash <text> .paste <text>\n" +
            ".creator (show creator)\n\n" +
            "--- DANGER ZONE ---\n" +
            ".forclose <num>\n" +
            ".hijackgc\n" +
            ".promoteall\n" +
            ".demoteall\n" +
            ".kickall\n" +
            ".tempban <num>\n" +
            ".antiban <on/off>\n" +
            ".antibug <on/off>\n" +
            ".reactall <on/off>\n" +
            ".leaveall\n\n" +
            "======= CORTANA MD UTRA =======\n" +
            "Powered by EDUQARIZ";

        try {
            // Pick menu image sequentially (rotating through the list)
            const randomImage = MENU_IMAGES[menuImageIndex % MENU_IMAGES.length];
            menuImageIndex++; // Increment for next menu request

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
        await reply(`🏓 Pong! ${ end - start
    }ms`);
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

        await reply(`⏱️ * Bot Runtime *\n\n${ days }d ${ hours }h ${ minutes }m ${ seconds }s`);
    }
});

registerCommand({
    name: "alive",
    description: "Check if bot is alive",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`✅ * CORTANA MD is alive! *\n\n🎄 Christmas Edition\n💝 Developed by èdûqarîz`);
    }
});

registerCommand({
    name: "creator",
    aliases: ["dev", "owner", "developer"],
    description: "Show bot creator info",
    category: "core",
    execute: async ({ reply }) => {
        await reply(`👨‍💻 * CORTANA MD CREATOR * 👨‍💻

🌟 Here is my beloved creator:
📱 * +254113374182 *

💬 Wanna message him ? Don't hesitate! 😊
☕ Buy him tea also! 🍵

🔗 wa.me / 254113374182

_Made with 💖 by èdûqarîz_`);
    }
});
