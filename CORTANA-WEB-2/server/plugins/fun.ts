import { registerCommand } from "./types";

registerCommand({
    name: "8ball",
    description: "Ask the magic 8 ball",
    category: "fun",
    execute: async ({ args, reply }) => {
        const question = args.join(" ");
        if (!question) return reply("🎱 Please ask a question: .8ball <your question>");

        const responses = [
            "It is certain 🎯", "It is decidedly so ✨", "Without a doubt 💯", "Yes definitely 👍",
            "You may rely on it 🤝", "As I see it, yes 👀", "Most likely 📈", "Outlook good 🌟",
            "Yes 👍", "Signs point to yes ✅", "Reply hazy, try again 🌫️", "Ask again later ⏰",
            "Better not tell you now 🤐", "Cannot predict now 🔮", "Concentrate and ask again 🧘",
            "Don't count on it 👎", "My reply is no ❌", "My sources say no 📉", "Outlook not so good 😔",
            "Very doubtful 🤔"
        ];
        const answer = responses[Math.floor(Math.random() * responses.length)];
        await reply(`🎱 *Magic 8 Ball*\n\n❓ Question: ${question}\n\n✨ Answer: ${answer}`);
    }
});

registerCommand({
    name: "compliment",
    description: "Get a compliment",
    category: "fun",
    execute: async ({ reply }) => {
        const compliments = [
            "You're more fun than bubble wrap! 🎉",
            "You light up every room you enter! 💡",
            "Your smile is contagious! 😊",
            "You have the best laugh! 😂",
            "You're a fantastic friend! 🤗",
            "Your kindness is a gift to everyone! 🎁",
            "You're braver than you believe! 💪",
            "You're smarter than you think! 🧠",
            "You bring out the best in people! ⭐",
            "Your energy is absolutely magnetic! 🧲"
        ];
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];
        await reply(`💝 *Compliment*\n\n${compliment}`);
    }
});

registerCommand({
    name: "dare",
    description: "Get a dare",
    category: "fun",
    execute: async ({ reply }) => {
        const dares = [
            "Send a voice note singing your favorite song! 🎤",
            "Change your profile picture to something funny for 1 hour! 📸",
            "Text your crush 'Hi' right now! 💕",
            "Post a story saying something nice about this group! 📱",
            "Send your most embarrassing photo to the group! 😂",
            "Do 10 push-ups and send a video! 💪",
            "Send a voice note in a funny accent! 🗣️",
            "Send a screenshot of your last Google search! 🔍",
            "Text a random contact 'I love you' and screenshot their response! 💌",
            "Speak only in emojis for the next 10 minutes! 😜"
        ];
        await reply(`🎯 *Dare*\n\n${dares[Math.floor(Math.random() * dares.length)]}`);
    }
});

registerCommand({
    name: "truth",
    description: "Get a truth question",
    category: "fun",
    execute: async ({ reply }) => {
        const truths = [
            "What is your biggest fear? 😱",
            "Have you ever lied to your best friend? 🤥",
            "What is your most embarrassing moment? 😳",
            "Who was your first crush? 😍",
            "What is something you have never told anyone? 🤫"
        ];
        await reply(`💭 *Truth*\n\n${truths[Math.floor(Math.random() * truths.length)]}`);
    }
});

registerCommand({
    name: "tts",
    description: "Text to Speech",
    category: "fun",
    execute: async ({ args, reply }) => {
        const text = args.join(" ");
        if (!text) return reply("📝 Please provide text: .tts <your text>");
        await reply(`🔊 TTS: ${text}`);
    }
});
