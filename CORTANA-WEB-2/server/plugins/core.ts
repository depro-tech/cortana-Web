import { registerCommand } from "./types";

const MENU_IMAGE = "https://files.catbox.moe/r0wa7j.jpg";

registerCommand({
    name: "menu",
    aliases: ["help"],
    description: "Show the bot menu",
    category: "core",
    execute: async ({ sock, msg, senderJid, reply }) => {
        const menuText = `🌺❀──────────────────────────────❀🌺
           CORTANA MD 
         C H R I S T M A S  E D.
🌺❀──────────────────────────────❀🌺


🌸🌼 O W N E R   M E N U 🌼🌸
⮞ .block - Block user
⮞ .unblock - Unblock user  
⮞ .dev - Developer mode
⮞ .self - Private bot mode
⮞ .public - Public bot mode
⮞ .bc - Broadcast message
⮞ .setbio - Set bot bio
⮞ .settings - Bot settings
⮞ .addprem - Add premium user
⮞ .delprem - Remove premium
⮞ .addowner - Add owner
⮞ .delowner - Remove owner
⮞ .shell - Execute shell command
⮞ .eval - Execute JavaScript
⮞ .restart - Restart bot
⮞ .update - Update bot
⮞ .backup - Backup data
⮞ .restore - Restore backup
⮞ .setpp - Set bot profile picture
⮞ .setname - Set bot name
⮞ .setstatus - Set bot status
⮞ .listprem - List premium users
⮞ .listban - List banned users
🌸───────────────────────────────🌸


🌷🌹 G R O U P   M A N A G E 🌹🌷
⮞ .add - Add member
⮞ .promote - Make admin
⮞ .demote - Remove admin
⮞ .kick - Remove member
⮞ .open - Open group
⮞ .close - Close group
⮞ .link - Get group link
⮞ .resetlink - Reset group link
⮞ .tagall - Tag everyone
⮞ .tagadmin - Tag admins only
⮞ .hidetag - Hidden tag
⮞ .ginfo - Group info
⮞ .invite - Invite to group
⮞ .leave - Leave group
⮞ .setdesc - Set description
⮞ .setname - Set group name
⮞ .setppgc - Set group picture
⮞ .delete - Delete message
⮞ .revoke - Revoke invite link
⮞ .grouplist - List all groups
🌷───────────────────────────────🌷


🌺🌼 A I   &   C H A T B O T S 🌼🌺
⮞ .gpt - Ask ChatGPT
⮞ .chatgpt - Advanced AI chat
⮞ .deepseek - DeepSeek AI
⮞ .imagine - Generate images
⮞ .llama - LLaMA AI
⮞ .gemini - Google Gemini AI
⮞ .bard - Google Bard
⮞ .blackbox - BlackBox AI
⮞ .ai - General AI
⮞ .aiimg - AI Image generation
⮞ .joke - Random joke
⮞ .advice - Get advice
⮞ .trivia - Trivia questions
⮞ .quote - Random quote
⮞ .fact - Random fact
⮞ .riddle - Random riddle
⮞ .meme - Random meme
⮞ .anime - Anime recommendations
🌺───────────────────────────────🌺


🌹🌸 U T I L I T I E S 🌸🌹
⮞ .menu - Show menu
⮞ .help - Help command
⮞ .ping - Bot speed
⮞ .alive - Bot status
⮞ .uptime - Runtime info
⮞ .speed - Speed test
⮞ .owner - Owner contact
⮞ .repo - Bot repository
⮞ .delete - Delete message
⮞ .react - React to message
⮞ .autoread - Toggle autoread
⮞ .autostatus - Toggle auto status view
⮞ .translate - Translate text
⮞ .currency - Currency converter
⮞ .weather - Weather info
⮞ .time - Current time
⮞ .date - Current date
⮞ .calc - Calculator
⮞ .wikipedia - Wikipedia search
⮞ .google - Google search
⮞ .image - Image search
⮞ .define - Define word
⮞ .urban - Urban dictionary
🌹───────────────────────────────🌹


🌼🌻 M E D I A   &   D O W N L O A D 🌻🌼
⮞ .song - Download audio
⮞ .video - Download video
⮞ .play - YouTube search & download
⮞ .ytmp3 - YouTube to MP3
⮞ .ytmp4 - YouTube to MP4
⮞ .yts - YouTube search
⮞ .ytv - YouTube video info
⮞ .fb - Facebook downloader
⮞ .fbdl - Facebook download
⮞ .ig - Instagram downloader
⮞ .igdl - Instagram download
⮞ .igstory - IG story downloader
⮞ .tiktok - TikTok downloader
⮞ .ttdl - TikTok download
⮞ .twitter - Twitter downloader
⮞ .twdl - Twitter download
⮞ .mediafire - MediaFire downloader
⮞ .gdrive - Google Drive downloader
⮞ .apk - APK downloader
⮞ .spotify - Spotify downloader
⮞ .soundcloud - SoundCloud downloader
⮞ .lyrics - Song lyrics
⮞ .pinterest - Pinterest downloader
⮞ .wallpaper - Wallpaper search
🌼───────────────────────────────🌼


🌸🌺 S T I C K E R S 🌺🌸
⮞ .sticker - Create sticker
⮞ .s - Quick sticker
⮞ .toimg - Sticker to image
⮞ .toanime - Animate image
⮞ .smeme - Sticker meme
⮞ .swm - Sticker watermark
⮞ .steal - Steal sticker
⮞ .take - Take sticker
⮞ .emoji - Get emoji
⮞ .emojimix - Mix emojis
⮞ .attp - Animated text
⮞ .ttp - Text to picture
🌸───────────────────────────────🌸


🌷🌹 A N T I – F E A T U R E S 🌹🌷
⮞ .antilink - Toggle antilink
⮞ .antibadword - Filter bad words
⮞ .antibot - Block other bots
⮞ .antitag - Prevent tagging
⮞ .antidelete - Save deleted msgs
⮞ .antivirus - Scan files
⮞ .antiviewonce - Save view once
⮞ .antispam - Anti spam
⮞ .antiforeign - Anti foreign users
⮞ .antitoxic - Anti toxic words
🌷───────────────────────────────🌷


💎🎮 G A M E S 🎮💎
⮞ .tictactoe - Tic Tac Toe
⮞ .ttt - Tic Tac Toe
⮞ .slot - Slot machine
⮞ .casino - Casino game
⮞ .dice - Roll dice
⮞ .rps - Rock Paper Scissors
⮞ .quiz - Quiz game
⮞ .truth - Truth question
⮞ .dare - Dare challenge
⮞ .akinator - Akinator game
⮞ .math - Math quiz
⮞ .guess - Guessing game
⮞ .hangman - Hangman game
⮞ .werewolf - Werewolf game
⮞ .chess - Chess game
⮞ .tebakgambar - Guess image
⮞ .tebakkata - Guess word
💎───────────────────────────────💎


🎨✨ I M A G E   E D I T 🎨✨
⮞ .blur - Blur image
⮞ .beautiful - Beautify image
⮞ .facepalm - Facepalm effect
⮞ .jail - Jail effect
⮞ .wasted - Wasted effect
⮞ .triggered - Triggered effect
⮞ .greyscale - Greyscale filter
⮞ .invert - Invert colors
⮞ .sepia - Sepia filter
⮞ .wanted - Wanted poster
⮞ .circle - Circle crop
⮞ .brightness - Adjust brightness
⮞ .darkness - Darken image
⮞ .rainbow - Rainbow effect
⮞ .delete - Delete effect
🎨───────────────────────────────🎨


🔍📊 S E A R C H   &   I N F O 📊🔍
⮞ .google - Google search
⮞ .wiki - Wikipedia
⮞ .news - Latest news
⮞ .crypto - Crypto prices
⮞ .stock - Stock prices
⮞ .movie - Movie info
⮞ .anime - Anime info
⮞ .manga - Manga info
⮞ .character - Anime character
⮞ .npm - NPM package info
⮞ .github - GitHub repo info
⮞ .lyrics - Song lyrics
⮞ .recipe - Food recipe
⮞ .covid - COVID statistics
⮞ .earthquake - Earthquake info
🔍───────────────────────────────🔍


🎭🎪 F U N   &   R A N D O M 🎪🎭
⮞ .joke - Random joke
⮞ .meme - Random meme
⮞ .quote - Inspirational quote
⮞ .fact - Random fact
⮞ .roast - Roast someone
⮞ .compliment - Compliment someone
⮞ .flirt - Flirt line
⮞ .pickup - Pickup line
⮞ .ship - Ship calculator
⮞ .love - Love calculator
⮞ .gay - Gay meter
⮞ .lesbian - Lesbian meter
⮞ .couple - Couple picture
⮞ .rate - Rate something
⮞ .hack - Fake hack
⮞ .when - When will...
⮞ .how - How much...
⮞ .who - Who is...
⮞ .what - What is...
⮞ .8ball - Magic 8 ball
🎭───────────────────────────────🎭


🔧⚙️ C O N V E R T E R S ⚙️🔧
⮞ .toimage - Convert to image
⮞ .tomp3 - Convert to MP3
⮞ .tomp4 - Convert to MP4
⮞ .toaudio - Convert to audio
⮞ .tovideo - Convert to video
⮞ .togif - Convert to GIF
⮞ .tourl - Upload to URL
⮞ .tovn - Convert to voice note
⮞ .toptv - Convert to PTV
⮞ .readmore - Add read more
⮞ .fancy - Fancy text
⮞ .tiny - Tiny text
⮞ .emoji - Emoji to image
🔧───────────────────────────────🔧


👥💬 I N T E R A C T I O N 💬👥
⮞ .hug - Hug someone
⮞ .kiss - Kiss someone
⮞ .slap - Slap someone
⮞ .pat - Pat someone
⮞ .bonk - Bonk someone
⮞ .cuddle - Cuddle someone
⮞ .cry - Cry
⮞ .smile - Smile
⮞ .wave - Wave
⮞ .dance - Dance
⮞ .handhold - Hold hands
⮞ .bite - Bite someone
⮞ .poke - Poke someone
⮞ .feed - Feed someone
👥───────────────────────────────👥


🎵🎶 M U S I C   &   A U D I O 🎶🎵
⮞ .play - Play music
⮞ .song - Download song
⮞ .lyrics - Get lyrics
⮞ .spotify - Spotify download
⮞ .soundcloud - SoundCloud download
⮞ .bass - Bass boost
⮞ .blown - Blown effect
⮞ .deep - Deep effect
⮞ .earrape - Earrape effect
⮞ .fast - Speed up
⮞ .fat - Fat effect
⮞ .nightcore - Nightcore
⮞ .reverse - Reverse audio
⮞ .robot - Robot voice
⮞ .slow - Slow down
⮞ .smooth - Smooth audio
⮞ .tupai - Chipmunk voice
🎵───────────────────────────────🎵


📝✍️ T E X T   &   L O G O ✍️📝
⮞ .blackpink - Blackpink logo
⮞ .neon - Neon text
⮞ .devil - Devil text
⮞ .lion - Lion logo
⮞ .wolf - Wolf logo
⮞ .phlogo - PornHub logo
⮞ .glitch - Glitch text
⮞ .sand - Sand writing
⮞ .thunder - Thunder text
⮞ .magma - Magma text
⮞ .3dtext - 3D text
⮞ .pencil - Pencil sketch
⮞ .graffiti - Graffiti text
⮞ .blood - Blood text
📝───────────────────────────────📝


🎯🎲 R A N D O M   A N I M E 🎲🎯
⮞ .waifu - Random waifu
⮞ .neko - Neko image
⮞ .shinobu - Shinobu image
⮞ .megumin - Megumin image
⮞ .bully - Bully GIF
⮞ .cuddle - Cuddle GIF
⮞ .cry - Cry GIF
⮞ .hug - Hug GIF
⮞ .awoo - Awoo GIF
⮞ .kiss - Kiss GIF
⮞ .lick - Lick GIF
⮞ .pat - Pat GIF
⮞ .smug - Smug face
⮞ .bonk - Bonk GIF
⮞ .yeet - Yeet GIF
⮞ .blush - Blush GIF
⮞ .smile - Smile GIF
⮞ .wave - Wave GIF
⮞ .highfive - High five GIF
⮞ .handhold - Hand hold GIF
🎯───────────────────────────────🎯


💰🏦 E C O N O M Y 🏦💰
⮞ .daily - Daily rewards
⮞ .weekly - Weekly rewards
⮞ .monthly - Monthly rewards
⮞ .work - Work for money
⮞ .rob - Rob someone
⮞ .crime - Commit crime
⮞ .gamble - Gamble money
⮞ .deposit - Deposit to bank
⮞ .withdraw - Withdraw from bank
⮞ .transfer - Transfer money
⮞ .balance - Check balance
⮞ .bank - Bank info
⮞ .leaderboard - Top users
⮞ .shop - Item shop
⮞ .buy - Buy items
⮞ .sell - Sell items
⮞ .inventory - Your inventory
💰───────────────────────────────💰


🔐🛡️ M O D E R A T I O N 🛡️🔐
⮞ .warn - Warn user
⮞ .unwarn - Remove warning
⮞ .warnings - Check warnings
⮞ .mute - Mute user
⮞ .unmute - Unmute user
⮞ .ban - Ban user
⮞ .unban - Unban user
⮞ .clear - Clear messages
⮞ .purge - Purge messages
⮞ .lock - Lock group
⮞ .unlock - Unlock group
⮞ .filter - Add word filter
⮞ .unfilter - Remove word filter
🔐───────────────────────────────🔐


📢🔔 A N N O U N C E M E N T 🔔📢
⮞ .announce - Make announcement
⮞ .broadcast - Broadcast to all
⮞ .bcgc - Broadcast to groups
⮞ .bcall - Broadcast to all chats
⮞ .promote - Promote message
⮞ .notify - Notify users
⮞ .remind - Set reminder
⮞ .poll - Create poll
⮞ .vote - Vote in poll
📢───────────────────────────────📢


🌐🔗 L I N K S   &   S H O R T 🔗🌐
⮞ .shorten - Shorten URL
⮞ .tinyurl - TinyURL
⮞ .bitly - Bitly shortener
⮞ .qrcode - Generate QR code
⮞ .readqr - Read QR code
⮞ .whois - Domain WHOIS
⮞ .checkip - Check IP
⮞ .dns - DNS lookup
🌐───────────────────────────────🌐


📱💻 D E V I C E   I N F O 💻📱
⮞ .ping - Bot latency
⮞ .speed - Connection speed
⮞ .server - Server info
⮞ .botstats - Bot statistics
⮞ .system - System info
⮞ .runtime - Bot uptime
⮞ .owner - Owner info
⮞ .repo - Repository
📱───────────────────────────────📱


❀──────────────────────────────❀
      🌸 Powered by CORTANA MD 
         🎄 Èdûqarîz 2025
❀──────────────────────────────❀`;

        try {
            await sock.sendMessage(senderJid, {
                image: { url: MENU_IMAGE },
                caption: menuText,
            });
            // Send audio after menu
            await sock.sendMessage(senderJid, {
                audio: { url: "https://files.catbox.moe/5s85cc.mp3" },
                mimetype: 'audio/mp4',
                ptt: true // Send as voice note
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
