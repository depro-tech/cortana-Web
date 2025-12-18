import { registerCommand } from "./types";

const MENU_VIDEO = "https://files.catbox.moe/hveiqo.mp4";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        const menuText = `🌺❀──────────────────────────────❀🌺
           C̷O̷R̷T̷A̷N̷A̷ ̷M̷D̷ 
         C H R I S T M A S  E D.
🌺❀──────────────────────────────❀🌺


🌸🌼 O W N E R   M E N U 🌼🌸
⮞ .block
⮞ .unblock
⮞ .dev
⮞ .self
⮞ .public
⮞ .bc
⮞ .setbio
⮞ .settings
⮞ .addprem
⮞ .delprem
⮞ .addowner
⮞ .delowner
⮞ .shell
⮞ .eval
⮞ .restart
⮞ .update
⮞ .backup
⮞ .restore
⮞ .setpp
⮞ .setname
⮞ .setstatus
⮞ .listprem
⮞ .listban
🌸───────────────────────────────🌸


🎭🤖 A U T O – P R E S E N C E 🤖🎭
⮞ .autorecording-all-on
⮞ .autorecording-pm-on
⮞ .autorecording-off
⮞ .autotyping-all-on
⮞ .autotyping-pm-on
⮞ .autotyping-off
⮞ .autorecordtyping-on
⮞ .autorecordtyping-off
⮞ .presence-status
🎭───────────────────────────────🎭


🌷🌹 G R O U P   M A N A G E 🌹🌷
⮞ .add
⮞ .promote
⮞ .demote
⮞ .kick
⮞ .kickall
⮞ .open
⮞ .close
⮞ .link
⮞ .resetlink
⮞ .tagall
⮞ .tagadmin
⮞ .hidetag
⮞ .ginfo
⮞ .invite
⮞ .leave
⮞ .setdesc
⮞ .setname
⮞ .setppgc
⮞ .delete
⮞ .revoke
⮞ .grouplist
⮞ .hijackgc
🌷───────────────────────────────🌷


🌺🌼 A I   &   C H A T B O T S 🌼🌺
⮞ .gpt
⮞ .chatgpt
⮞ .deepseek
⮞ .imagine
⮞ .llama
⮞ .gemini
⮞ .bard
⮞ .blackbox
⮞ .ai
⮞ .aiimg
⮞ .joke
⮞ .advice
⮞ .trivia
⮞ .quote
⮞ .fact
⮞ .riddle
⮞ .meme
⮞ .anime
🌺───────────────────────────────🌺


🌹🌸 U T I L I T I E S 🌸🌹
⮞ .menu
⮞ .help
⮞ .ping
⮞ .alive
⮞ .uptime
⮞ .speed
⮞ .owner
⮞ .repo
⮞ .delete
⮞ .react
⮞ .autoread
⮞ .autostatus
⮞ .translate
⮞ .currency
⮞ .weather
⮞ .time
⮞ .date
⮞ .calc
⮞ .wikipedia
⮞ .google
⮞ .image
⮞ .define
⮞ .urban
🌹───────────────────────────────🌹


🌼🌻 M E D I A   &   D O W N L O A D 🌻🌼
⮞ .song
⮞ .video
⮞ .play
⮞ .ytmp3
⮞ .ytmp4
⮞ .yts
⮞ .ytv
⮞ .fb
⮞ .fbdl
⮞ .ig
⮞ .igdl
⮞ .igstory
⮞ .tiktok
⮞ .ttdl
⮞ .twitter
⮞ .twdl
⮞ .mediafire
⮞ .gdrive
⮞ .apk
⮞ .spotify
⮞ .soundcloud
⮞ .lyrics
⮞ .pinterest
⮞ .wallpaper
🌼───────────────────────────────🌼


📢🌐 C H A N N E L   C H A M B E R 🌐📢
⮞ .ch-jid
⮞ .ch-ban
📢───────────────────────────────📢


🌸🌺 S T I C K E R S 🌺🌸
⮞ .sticker
⮞ .s
⮞ .toimg
⮞ .toanime
⮞ .smeme
⮞ .swm
⮞ .steal
⮞ .take
⮞ .emoji
⮞ .emojimix
⮞ .attp
⮞ .ttp
🌸───────────────────────────────🌸


🌷🌹 A N T I – F E A T U R E S 🌹🌷
⮞ .antilink
⮞ .antigroupmention
⮞ .antibadword
⮞ .antibot
⮞ .antitag
⮞ .antidelete
⮞ .antivirus
⮞ .antiviewonce
⮞ .antispam
⮞ .antiforeign
⮞ .antitoxic
🌷───────────────────────────────🌷


💎🎮 G A M E S 🎮💎
⮞ .tictactoe
⮞ .ttt
⮞ .slot
⮞ .casino
⮞ .dice
⮞ .rps
⮞ .quiz
⮞ .truth
⮞ .dare
⮞ .akinator
⮞ .math
⮞ .guess
⮞ .hangman
⮞ .werewolf
⮞ .chess
⮞ .tebakgambar
⮞ .tebakkata
💎───────────────────────────────💎


🎨✨ I M A G E   E D I T 🎨✨
⮞ .blur
⮞ .beautiful
⮞ .facepalm
⮞ .jail
⮞ .wasted
⮞ .triggered
⮞ .greyscale
⮞ .invert
⮞ .sepia
⮞ .wanted
⮞ .circle
⮞ .brightness
⮞ .darkness
⮞ .rainbow
⮞ .delete
🎨───────────────────────────────🎨


🔍📊 S E A R C H   &   I N F O 📊🔍
⮞ .google
⮞ .wiki
⮞ .news
⮞ .crypto
⮞ .stock
⮞ .movie
⮞ .anime
⮞ .manga
⮞ .character
⮞ .npm
⮞ .github
⮞ .lyrics
⮞ .recipe
⮞ .covid
⮞ .earthquake
🔍───────────────────────────────🔍


🎭🎪 F U N   &   R A N D O M 🎪🎭
⮞ .joke
⮞ .meme
⮞ .quote
⮞ .fact
⮞ .roast
⮞ .compliment
⮞ .flirt
⮞ .pickup
⮞ .ship
⮞ .love
⮞ .gay
⮞ .lesbian
⮞ .couple
⮞ .rate
⮞ .hack
⮞ .when
⮞ .how
⮞ .who
⮞ .what
⮞ .8ball
🎭───────────────────────────────🎭


🔧⚙️ C O N V E R T E R S ⚙️🔧
⮞ .toimage
⮞ .tomp3
⮞ .tomp4
⮞ .toaudio
⮞ .tovideo
⮞ .togif
⮞ .tourl
⮞ .tovn
⮞ .toptv
⮞ .readmore
⮞ .fancy
⮞ .tiny
⮞ .emoji
🔧───────────────────────────────🔧


👥💬 I N T E R A C T I O N 💬👥
⮞ .hug
⮞ .kiss
⮞ .slap
⮞ .pat
⮞ .bonk
⮞ .cuddle
⮞ .cry
⮞ .smile
⮞ .wave
⮞ .dance
⮞ .handhold
⮞ .bite
⮞ .poke
⮞ .feed
👥───────────────────────────────👥


🎵🎶 M U S I C   &   A U D I O 🎶🎵
⮞ .play
⮞ .song
⮞ .lyrics
⮞ .spotify
⮞ .soundcloud
⮞ .bass
⮞ .blown
⮞ .deep
⮞ .earrape
⮞ .fast
⮞ .fat
⮞ .nightcore
⮞ .reverse
⮞ .robot
⮞ .slow
⮞ .smooth
⮞ .tupai
🎵───────────────────────────────🎵


📝✍️ T E X T   &   L O G O ✍️📝
⮞ .blackpink
⮞ .neon
⮞ .devil
⮞ .lion
⮞ .wolf
⮞ .phlogo
⮞ .glitch
⮞ .sand
⮞ .thunder
⮞ .magma
⮞ .3dtext
⮞ .pencil
⮞ .graffiti
⮞ .blood
📝───────────────────────────────📝


🎯🎲 R A N D O M   A N I M E 🎲🎯
⮞ .waifu
⮞ .neko
⮞ .shinobu
⮞ .megumin
⮞ .bully
⮞ .cuddle
⮞ .cry
⮞ .hug
⮞ .awoo
⮞ .kiss
⮞ .lick
⮞ .pat
⮞ .smug
⮞ .bonk
⮞ .yeet
⮞ .blush
⮞ .smile
⮞ .wave
⮞ .highfive
⮞ .handhold
🎯───────────────────────────────🎯


💰🏦 E C O N O M Y 🏦💰
⮞ .daily
⮞ .weekly
⮞ .monthly
⮞ .work
⮞ .rob
⮞ .crime
⮞ .gamble
⮞ .deposit
⮞ .withdraw
⮞ .transfer
⮞ .balance
⮞ .bank
⮞ .leaderboard
⮞ .shop
⮞ .buy
⮞ .sell
⮞ .inventory
💰───────────────────────────────💰


🔐🛡️ M O D E R A T I O N 🛡️🔐
⮞ .warn
⮞ .unwarn
⮞ .warnings
⮞ .mute
⮞ .unmute
⮞ .ban
⮞ .unban
⮞ .clear
⮞ .purge
⮞ .lock
⮞ .unlock
⮞ .filter
⮞ .unfilter
🔐───────────────────────────────🔐


📢🔔 A N N O U N C E M E N T 🔔📢
⮞ .announce
⮞ .broadcast
⮞ .bcgc
⮞ .bcall
⮞ .promote
⮞ .notify
⮞ .remind
⮞ .poll
⮞ .vote
📢───────────────────────────────📢


🌐🔗 L I N K S   &   S H O R T 🔗🌐
⮞ .shorten
⮞ .tinyurl
⮞ .bitly
⮞ .qrcode
⮞ .readqr
⮞ .whois
⮞ .checkip
⮞ .dns
🌐───────────────────────────────🌐


📱💻 D E V I C E   I N F O 💻📱
⮞ .ping
⮞ .speed
⮞ .server
⮞ .botstats
⮞ .system
⮞ .runtime
⮞ .owner
⮞ .repo
📱───────────────────────────────📱


❀──────────────────────────────❀
      🌸 Powered by C̷O̷R̷T̷A̷N̷A̷ ̷M̷D̷ 
         🎄 Èdûqarîz 2025
❀──────────────────────────────❀`;

        try {
            // Send video with menu (not as GIF for larger display)
            await sock.sendMessage(senderJid, {
                video: { url: MENU_VIDEO },
                caption: menuText,
                contextInfo: {
                    externalAdReply: {
                        title: "CORTANA MD - Christmas Edition",
                        body: "Official Bot Menu",
                        thumbnailUrl: MENU_VIDEO,
                        sourceUrl: "https://github.com/depro-tech/cortana-Web",
                        mediaType: 1,
                        showAdAttribution: true,
                        renderLargerThumbnail: false
                    },
                    forwardingScore: 999,
                    isForwarded: false
                }
            });

            // Send audio as a playable document
            await sock.sendMessage(senderJid, {
                audio: { url: "https://files.catbox.moe/5s85cc.mp3" },
                mimetype: 'audio/mpeg',
                fileName: 'menu_audio.mp3',
                ptt: false
            });
        } catch (error) {
            console.error("Failed to send menu image/audio:", error);
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
        await reply("🏓 Pinging...");
        const end = Date.now();
        await reply(`🏓 Pong! ${end - start}ms`);
    }
});

registerCommand({
    name: "alive",
    aliases: ["uptime", "runtime"],
    description: "Check bot runtime",
    category: "core",
    execute: async ({ reply }) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await reply(`🎄 *CORTANA MD X-MASS ED.*\n\n✅ Bot is alive!\n⏱️ Runtime: ${hours}h ${minutes}m ${seconds}s\n⚡ Speed: Fast\n🌐 Status: Online`);
    }
});

registerCommand({
    name: "owner",
    description: "Get owner contact",
    category: "core",
    execute: async ({ reply }) => {
        await reply("👑 *Bot Owner*\n\n📞 Number: Not set\n🤖 Bot: CORTANA MD");
    }
});
