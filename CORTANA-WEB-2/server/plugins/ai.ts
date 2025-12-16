import { registerCommand } from "./types";
import axios from "axios";

const config = {
    botName: 'CORTANA MD'
};

registerCommand({
    name: "gpt",
    aliases: ["ai", "chatgpt"],
    description: "Chat with AI",
    category: "ai",
    execute: async ({ sock, args, reply }) => {
        const query = args.join(" ");
        if (!query) return reply("❌ Please provide a question");

        try {
            // Using the API from user's snippet
            const response = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Cortana&botname=${config.botName}`);
            await reply(`🤖 *ChatGPT*\n\n${response.data.response}`);
        } catch (e) {
            await reply("❌ Error connecting to AI service");
        }
    }
});

registerCommand({
    name: "joke",
    description: "Get a random joke",
    category: "ai",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
            await reply(`😂 *${response.data.setup}*\n\n${response.data.punchline}`);
        } catch (e) {
            await reply("❌ Could not fetch joke");
        }
    }
});

registerCommand({
    name: "advice",
    description: "Get random advice",
    category: "ai",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://api.adviceslip.com/advice');
            await reply(`💡 *Advice*\n\n${response.data.slip.advice}`);
        } catch (e) {
            await reply("❌ Could not fetch advice");
        }
    }
});

registerCommand({
    name: "quote",
    description: "Get a random quote",
    category: "ai",
    execute: async ({ reply }) => {
        try {
            // Updated API if quotable.io is down, or stick to it
            const response = await axios.get('https://api.quotable.io/random');
            await reply(`✨ *Quote*\n\n"${response.data.content}"\n\n- ${response.data.author}`);
        } catch (e) {
            // Fallback
            await reply("❌ Could not fetch quote");
        }
    }
});

registerCommand({
    name: "fact",
    description: "Get a random fact",
    category: "ai",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            await reply(`🧠 *Random Fact*\n\n${response.data.text}`);
        } catch (e) {
            await reply("❌ Could not fetch fact");
        }
    }
});

registerCommand({
    name: "trivia",
    description: "Get a trivia question",
    category: "ai",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const q = response.data.results[0];
            const answers = [...q.incorrect_answers, q.correct_answer].sort();
            await reply(`❓ *Trivia Question*\n\nCategory: ${q.category}\nDifficulty: ${q.difficulty}\n\nQuestion: ${q.question}\n\nAnswers:\nA) ${answers[0]}\nB) ${answers[1]}\nC) ${answers[2]}\nD) ${answers[3]}`);
        } catch (e) {
            await reply("❌ Could not fetch trivia");
        }
    }
});
