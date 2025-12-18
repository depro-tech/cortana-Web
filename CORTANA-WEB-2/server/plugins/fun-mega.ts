import { registerCommand } from "./types";
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// FUN & MEME COMMANDS (50+ commands)
// Random generators, memes, ASCII art, jokes, and entertainment
// ═══════════════════════════════════════════════════════════════

// FACEPALM
registerCommand({
    name: "facepalm",
    description: "Facepalm reaction",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`(－‸ლ)\n\n*Facepalm*`);
    }
});

// SHRUG
registerCommand({
    name: "shrug",
    description: "Shrug",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`¯\\_(ツ)_/¯\n\n*Shrugs*`);
    }
});

// TABLEFLIP
registerCommand({
    name: "tableflip",
    description: "Flip the table",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`(╯°□°)╯︵ ┻━┻\n\n*Flips table!*`);
    }
});

// UNFLIP
registerCommand({
    name: "unflip",
    description: "Put table back",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`┬─┬ノ( º _ ºノ)\n\n*Puts table back*`);
    }
});

// DISAPPROVE
registerCommand({
    name: "disapprove",
    description: "Look of disapproval",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`ಠ_ಠ\n\n*Disapproves strongly*`);
    }
});

// LENNY
registerCommand({
    name: "lenny",
    description: "Lenny face",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`( ͡° ͜ʖ ͡°)`);
    }
});

// CRY TEXT
registerCommand({
    name: "crytext",
    description: "Crying face",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`(╥﹏╥)\n\n*So sad...*`);
    }
});

// LOVE
registerCommand({
    name: "love",
    description: "Show love",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`♡〜٩(^▿^)۶〜♡\n\n*Sends love!*`);
    }
});

// MAGIC8BALL ALT
registerCommand({
    name: "ask",
    description: "Ask a yes/no question",
    category: "fun",
    usage: ".ask <question>",
    execute: async ({ args, reply }) => {
        const question = args.join(" ");
        if (!question) return reply("❌ Ask a question!");

        const answers = ["Yes", "No", "Maybe", "Definitely", "Absolutely not", "Ask again later", "Very likely", "Unlikely", "Cannot predict", "Without a doubt"];
        const answer = answers[Math.floor(Math.random() * answers.length)];

        await reply(`❓ *Question:* ${question}\n\n✅ *Answer:* **${answer}**`);
    }
});

// PICK/CHOOSE
registerCommand({
    name: "pick",
    aliases: ["choose"],
    description: "Pick between options",
    category: "fun",
    usage: ".pick option1 | option2 | option3",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text.includes("|")) return reply("❌ Usage: .pick option1 | option2 | option3");

        const options = text.split("|").map(o => o.trim());
        const choice = options[Math.floor(Math.random() * options.length)];

        await reply(`🎯 *I choose:* **${choice}**`);
    }
});

// RANDOM NUMBER
registerCommand({
    name: "random",
    aliases: ["rng", "rand"],
    description: "Generate random number",
    category: "fun",
    usage: ".random <min> <max>",
    execute: async ({ args, reply }) => {
        const min = parseInt(args[0]) || 1;
        const max = parseInt(args[1]) || 100;

        if (min >= max) return reply("❌ Min must be less than max!");

        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        await reply(`🎲 *Random Number (${min}-${max}):* **${result}**`);
    }
});

// SHIP
registerCommand({
    name: "ship",
    description: "Ship two people",
    category: "fun",
    usage: ".ship @user1 @user2",
    execute: async ({ args, reply }) => {
        const names = args.join(" ").split(" ");
        if (names.length < 2) return reply("❌ Provide two names!");

        const percentage = Math.floor(Math.random() * 100) + 1;
        const name1 = names[0];
        const name2 = names[1];

        let rating = "";
        if (percentage < 30) rating = "💔 Not compatible";
        else if (percentage < 60) rating = "💕 Could work";
        else if (percentage < 90) rating = "💖 Great match!";
        else rating = "💞 Perfect match!";

        await reply(`💘 *Ship Compatibility*\n\n${name1} × ${name2}\n\n**${percentage}%** - ${rating}`);
    }
});

// RATE
registerCommand({
    name: "rate",
    description: "Rate something",
    category: "fun",
    usage: ".rate <thing>",
    execute: async ({ args, reply }) => {
        const thing = args.join(" ");
        if (!thing) return reply("❌ What should I rate?");

        const rating = Math.floor(Math.random() * 10) + 1;
        await reply(`⭐ *Rating for ${thing}:*\n\n**${rating}/10**`);
    }
});

// WHEN
registerCommand({
    name: "when",
    description: "When will something happen?",
    category: "fun",
    usage: ".when <question>",
    execute: async ({ args, reply }) => {
        const question = args.join(" ");
        if (!question) return reply("❌ Ask when something will happen!");

        const times = ["Never", "Tomorrow", "In 1 hour", "In 1 day", "In 1 week", "In 1 month", "In 1 year", "In 10 years", "Next week", "Soon", "Very soon", "Maybe never"];
        const time = times[Math.floor(Math.random() * times.length)];

        await reply(`⏰ *When ${question}?*\n\n**${time}**`);
    }
});

// HOW
registerCommand({
    name: "how",
    description: "How much/many?",
    category: "fun",
    usage: ".how <question>",
    execute: async ({ args, reply }) => {
        const question = args.join(" ");
        if (!question) return reply("❌ Ask a 'how' question!");

        const percentage = Math.floor(Math.random() * 100) + 1;
        await reply(`❓ *How ${question}?*\n\n**${percentage}%**`);
    }
});

// SHIP NAME
registerCommand({
    name: "shipname",
    description: "Create ship name",
    category: "fun",
    usage: ".shipname name1 name2",
    execute: async ({ args, reply }) => {
        if (args.length < 2) return reply("❌ Provide two names!");

        const name1 = args[0].toLowerCase();
        const name2 = args[1].toLowerCase();

        const half1 = name1.substring(0, Math.ceil(name1.length / 2));
        const half2 = name2.substring(Math.floor(name2.length / 2));
        const shipName = half1 + half2;

        await reply(`💘 *Ship Name:*\n\n${args[0]} + ${args[1]} = **${shipName.charAt(0).toUpperCase() + shipName.slice(1)}**`);
    }
});

// INSULT (playful)
registerCommand({
    name: "insult",
    aliases: ["roastuser"],
    description: "Playful insult",
    category: "fun",
    execute: async ({ reply }) => {
        const insults = [
            "You're as useful as a screen door on a submarine!",
            "If brains were dynamite, you wouldn't have enough to blow your nose!",
            "You're proof that evolution can go in reverse!",
            "I'd agree with you, but then we'd both be wrong!",
            "You're not stupid; you just have bad luck thinking!",
            "If ignorance is bliss, you must be the happiest person alive!",
            "You bring everyone joy... when you leave the room!",
            "You're like a cloud. When you disappear, it's a beautiful day!"
        ];

        const insult = insults[Math.floor(Math.random() * insults.length)];
        await reply(`🔥 ${insult}`);
    }
});

// COMPLIMENT
registerCommand({
    name: "compliment",
    description: "Get a compliment",
    category: "fun",
    execute: async ({ reply }) => {
        const compliments = [
            "You're amazing!",
            "You light up the room!",
            "Your smile is contagious!",
            "You're one of a kind!",
            "You're wonderful!",
            "You make me happy!",
            "You're brilliant!",
            "You're incredible!",
            "You're a true friend!",
            "You deserve a hug right now!"
        ];

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await reply(`💝 ${compliment}`);
    }
});

// BURN
registerCommand({
    name: "burn",
    description: "Sick burn",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`🔥 *SICK BURN!*\n\nApply cold water to burned area!`);
    }
});

// WYR (Would You Rather)
registerCommand({
    name: "wyr",
    aliases: ["wouldyourather"],
    description: "Would you rather question",
    category: "fun",
    execute: async ({ reply }) => {
        const questions = [
            "Would you rather have the ability to fly or be invisible?",
            "Would you rather live forever or have superpowers?",
            "Would you rather be rich or famous?",
            "Would you rather travel to the past or future?",
            "Would you rather have unlimited money or true love?",
            "Would you rather never use the internet again or never watch TV?",
            "Would you rather be able to talk to animals or speak all languages?",
            "Would you rather live in space or under the sea?"
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];
        await reply(`🤔 *Would You Rather?*\n\n${question}`);
    }
});

// NEVER HAVE I EVER
registerCommand({
    name: "neverhave",
    aliases: ["neverhaveiever", "nhie"],
    description: "Never have I ever",
    category: "fun",
    execute: async ({ reply }) => {
        const statements = [
            "Never have I ever traveled to another country",
            "Never have I ever gone skydiving",
            "Never have I ever lied to get out of trouble",
            "Never have I ever cried during a movie",
            "Never have I ever broken a bone",
            "Never have I ever pulled an all-nighter",
            "Never have I ever forgotten someone's name right after meeting them",
            "Never have I ever sent a text to the wrong person"
        ];

        const statement = statements[Math.floor(Math.random() * statements.length)];
        await reply(`✋ *Never Have I Ever*\n\n${statement}`);
    }
});

// ACTION
registerCommand({
    name: "action",
    description: "Perform an action",
    category: "fun",
    usage: ".action <text>",
    execute: async ({ args, reply }) => {
        const action = args.join(" ");
        if (!action) return reply("❌ What action?");

        await reply(`*${action}*`);
    }
});

// SAY
registerCommand({
    name: "say",
    description: "Make bot say something",
    category: "fun",
    usage: ".say <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ What should I say?");

        await reply(text);
    }
});

// ASCII ART - HEART
registerCommand({
    name: "heart",
    description: "ASCII heart",
    category: "fun",
    execute: async ({ reply }) => {
        const heart = `♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
♥░░░░░░░░░░░░░♥
♥░░█░░░░░░░█░░♥
♥░░██░░░░░██░░♥
♥░░███░░░███░░♥
♥░░████░████░░♥
♥░░█████████░░♥
♥░░░███████░░░♥
♥░░░░█████░░░░♥
♥░░░░░███░░░░░♥
♥░░░░░░█░░░░░░♥
♥░░░░░░░░░░░░░♥
♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥`;
        await reply(heart);
    }
});

// COW SAY
registerCommand({
    name: "cowsay",
    description: "Cow says something",
    category: "fun",
    usage: ".cowsay <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ") || "Moo!";
        const cow = `
 ${"_".repeat(text.length + 2)}
< ${text} >
 ${"-".repeat(text.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
        await reply(cow);
    }
});

// THINKING
registerCommand({
    name: "thinking",
    description: "Thinking...",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`🤔💭\n\n*Thinking...*`);
    }
});

// CLAP
registerCommand({
    name: "clap",
    description: "Clap text",
    category: "fun",
    usage: ".clap <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Provide text!");

        const clapped = text.split(" ").join(" 👏 ");
        await reply(`👏 ${clapped} 👏`);
    }
});

// MOCK
registerCommand({
    name: "mock",
    aliases: ["spongebob"],
    description: "MoCk TeXt LiKe ThIs",
    category: "fun",
    usage: ".mock <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Provide text!");

        let mocked = "";
        for (let i = 0; i < text.length; i++) {
            mocked += i % 2 === 0 ? text[i].toLowerCase() : text[i].toUpperCase();
        }

        await reply(mocked);
    }
});

// VAPORWAVE
registerCommand({
    name: "vaporwave",
    aliases: ["aesthetic", "vapor"],
    description: "Ａｅｓｔｈｅｔｉｃ　ｔｅｘｔ",
    category: "fun",
    usage: ".vaporwave <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Provide text!");

        let vapor = "";
        for (let char of text) {
            if (char === " ") {
                vapor += "　";
            } else if (char.charCodeAt(0) >= 33 && char.charCodeAt(0) <= 126) {
                vapor += String.fromCharCode(char.charCodeAt(0) + 65248);
            } else {
                vapor += char;
            }
        }

        await reply(vapor);
    }
});

// OWOIFY
registerCommand({
    name: "owo",
    aliases: ["owoify", "uwu"],
    description: "OwO-ify text",
    category: "fun",
    usage: ".owo <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Pwovide text UwU!");

        let owo = text
            .replace(/r|l/g, 'w')
            .replace(/R|L/g, 'W')
            .replace(/n([aeiou])/g, 'ny$1')
            .replace(/N([aeiou])/g, 'Ny$1')
            .replace(/ove/g, 'uv');

        const kaomojis = [" (・`ω´・)", " ;;w;;", " owo", " UwU", " >w<", " ^w^"];
        owo += kaomojis[Math.floor(Math.random() * kaomojis.length)];

        await reply(owo);
    }
});

// ZALGO
registerCommand({
    name: "zalgo",
    aliases: ["cursed", "glitch"],
    description: "Ç̷̗͎̈u̶͚̾r̶̰̈́s̴̰̈́e̵̫̾d̶̰͋ text",
    category: "fun",
    usage: ".zalgo <text>",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("❌ Provide text!");

        const zalgoChars = [
            '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307',
            '\u0308', '\u0309', '\u030a', '\u030b', '\u030c', '\u030d', '\u030e', '\u030f',
            '\u0310', '\u0311', '\u0312', '\u0313', '\u0314', '\u0315', '\u0316', '\u0317'
        ];

        let zalgo = "";
        for (let char of text) {
            zalgo += char;
            for (let i = 0; i < 3; i++) {
                zalgo += zalgoChars[Math.floor(Math.random() * zalgoChars.length)];
            }
        }

        await reply(zalgo);
    }
});

// HEADPAT GIF
registerCommand({
    name: "headpat",
    description: "Give headpats",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("*pat pat pat* 🤲");
    }
});

// FLEX
registerCommand({
    name: "flex",
    description: "Flex on 'em",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("💪😎\n\n*FLEXING HARD!*");
    }
});

// DANK
registerCommand({
    name: "dank",
    description: "Dank meme",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("🔥👌💯\n\n*SO DANK!*");
    }
});

// YOLO
registerCommand({
    name: "yolo",
    description: "You only live once!",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("🎉 Y O L O 🎉\n\nYou Only Live Once!");
    }
});

// DEALWITHIT
registerCommand({
    name: "dealwithit",
    description: "Deal with it",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`(⌐■_■)\n\n*Deal with it.*`);
    }
});

// TRIGGERED
registerCommand({
    name: "triggeredtext",
    description: "TRIGGERED!",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`╰( ‾ʖ̫‾)╯\n\n*T R I G G E R E D*`);
    }
});

// NOT BAD
registerCommand({
    name: "notbad",
    description: "Not bad",
    category: "fun",
    execute: async ({ reply }) => {
        await reply(`(⌐■_■)\n\n*Not bad...*`);
    }
});

// OOPS
registerCommand({
    name: "oops",
    description: "Oops!",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("(๑′°︿°๑)\n\n*Oops!*");
    }
});

// GG
registerCommand({
    name: "gg",
    description: "Good game!",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("🎮 *GG!*\n\nGood Game!");
    }
});

// RESPECT
registerCommand({
    name: "respect",
    aliases: ["f", "pressf"],
    description: "Press F to pay respects",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("🎖️ *F*\n\nPressing F to pay respects...");
    }
});

// LEGEND
registerCommand({
    name: "legend",
    description: "Absolute legend",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("👑 *ABSOLUTE LEGEND!* 👑");
    }
});

// CHAD
registerCommand({
    name: "chad",
    description: "Gigachad moment",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("💪😎\n\n*GIGACHAD MOMENT!*");
    }
});

// BASED
registerCommand({
    name: "based",
    description: "Based",
    category: "fun",
    execute: async ({ reply }) => {
        await reply("🗿 *BASED*");
    }
});
