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
⮞ .block
⮞ .unblock
⮞ .dev
⮞ .self
⮞ .public
⮞ .bc
⮞ .setbio
⮞ .settings


🌸🌼 AUTO-PRESENCE 🌼🌸
⮞ .autorecording-all-on
⮞ .autorecording-pm-on
⮞ .autorecording-off
⮞ .autotyping-all-on
⮞ .autotyping-pm-on
⮞ .autotyping-off
⮞ .autorecordtyping-on
⮞ .autorecordtyping-off
⮞ .presence-status


🌸🌼 GROUP MENU 🌼🌸
⮞ .antilink kick on
⮞ .antilink warn on
⮞ .antilink off
⮞ .antigroupmention kick on
⮞ .antigroupmention warn on
⮞ .antigroupmention off
⮞ .promote
⮞ .demote
⮞ .kick
⮞ .add
⮞ .tagall
⮞ .hidetag
⮞ .open
⮞ .close
⮞ .link
⮞ .resetlink
⮞ .gcname
⮞ .gcdesc
⮞ .delete
⮞ .setppgc
⮞ .kickall ⚠️
⮞ .hijackgc ☠️


🌸🌼 REACTIONS 🌼🌸
⮞ .hug
⮞ .kiss
⮞ .cuddle
⮞ .slap
⮞ .pat
⮞ .poke
⮞ .bonk
⮞ .bite
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
⮞ .ship
⮞ .rate
⮞ .ask
⮞ .pick
⮞ .when
⮞ .how
⮞ .shipname
⮞ .owo
⮞ .uwu
⮞ .mock
⮞ .zalgo
⮞ .vaporwave
⮞ .cowsay
⮞ .lenny
⮞ .tableflip
⮞ .unflip
⮞ .shrug
⮞ .facepalm
⮞ .disapprove
⮞ .clap
⮞ .compliment
⮞ .insult
⮞ .roast
⮞ .wyr
⮞ .neverhave
⮞ .heart
⮞ .action
⮞ .say
⮞ .thinking
⮞ .gg
⮞ .respect
⮞ .f
⮞ .chad
⮞ .based
⮞ .flex
⮞ .dank
⮞ .yolo
⮞ .legend
⮞ .dealwithit
⮞ .notbad
⮞ .burn
⮞ .oops
⮞ .love
⮞ .headpat
⮞ .triggered


🌸🌼 MUSIC & AUDIO 🌼🌸
⮞ .play ✨FIXED✨
⮞ .lyrics
⮞ .soundcloud
⮞ .ytmp3
⮞ .ytmp4
⮞ .yts
⮞ .spotify


🌸🌼 DOWNLOADERS 🌼🌸
⮞ .tiktok
⮞ .ig
⮞ .fb
⮞ .twitter


🌸🌼 IMAGE EFFECTS 🌼🌸
⮞ .blur
⮞ .enhance
⮞ .wanted
⮞ .wasted
⮞ .trigger
⮞ .circle
⮞ .sepia
⮞ .pixelate
⮞ .colorize


🌸🌼 AI FEATURES 🌼🌸
⮞ .chatgpt
⮞ .imagine
⮞ .removebg
⮞ .ocr
⮞ .aivision
⮞ .chatbot on/off


🌸🌼 SEARCH & INFO 🌼🌸
⮞ .google
⮞ .weather
⮞ .wiki
⮞ .github
⮞ .npm
⮞ .dictionary
⮞ .movie
⮞ .anime
⮞ .manga
⮞ .character


🌸🌼 TEXT TOOLS 🌼🌸
⮞ .fancy
⮞ .reverse
⮞ .binary
⮞ .morse
⮞ .emojimix
⮞ .encrypt
⮞ .decrypt
⮞ .shorten
⮞ .readmore
⮞ .flip


🌸🌼 ANIME & MANGA 🌼🌸
⮞ .waifu
⮞ .neko
⮞ .animequote
⮞ .shinobu
⮞ .megumin
⮞ .animewallpaper


🌸🌼 GAMES 🌼🌸
⮞ .truth
⮞ .dare
⮞ .math
⮞ .slot
⮞ .dice
⮞ .rps
⮞ .casino
⮞ .hangman
⮞ .guessnumber
⮞ .coinflip
⮞ .8ball
⮞ .triviagame
⮞ .quiz


🌸🌼 FUN EXTRAS 🌼🌸
⮞ .joke
⮞ .meme
⮞ .quote
⮞ .fact


🌸🌼 UTILITIES 🌼🌸
⮞ .calc
⮞ .translate
⮞ .sticker
⮞ .toimg
⮞ .qr
⮞ .screenshot
⮞ .carbon
⮞ .paste
⮞ .wallpaper
⮞ .ip
⮞ .uuid
⮞ .hash
⮞ .base64encode
⮞ .base64decode


🔊 CORTANA MD • Christmas
💝 By èdûqarîz
📊 170+ Commands!`;

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
