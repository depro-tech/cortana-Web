import { registerCommand } from "./types";
import axios from "axios";

// Truth/Dare from ShizoAPI (researched from Knightbot-MD)
registerCommand({
    name: "truth",
    description: "Get a truth question",
    category: "game",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get('https://shizoapi.onrender.com/api/texts/truth?apikey=shizo');
            const truthMessage = res.data.result;
            await reply(`🔮 *Truth*\n\n${truthMessage}`);
        } catch (error) {
            console.error('Truth command error:', error);
            await reply('❌ Failed to get truth. Try again later!');
        }
    }
});

registerCommand({
    name: "dare",
    description: "Get a dare challenge",
    category: "game",
    execute: async ({ reply }) => {
        try {
            const res = await axios.get('https://shizoapi.onrender.com/api/texts/dare?apikey=shizo');
            const dareMessage = res.data.result;
            await reply(`💪 *Dare*\n\n${dareMessage}`);
        } catch (error) {
            console.error('Dare command error:', error);
            await reply('❌ Failed to get dare. Try again later!');
        }
    }
});

registerCommand({
    name: "tictactoe",
    aliases: ["ttt"],
    description: "Play Tic Tac Toe",
    category: "game",
    execute: async ({ reply }) => {
        // Simple placeholder for now as full game state requires persistent storage or memory active game manager
        await reply("❌ Tic Tac Toe requires a second player. Feature coming with multiplayer update!");
    }
});

registerCommand({
    name: "slot",
    description: "Play Slot Machine",
    category: "game",
    execute: async ({ reply }) => {
        const emojis = ['🍇', '🍊', '🍋', '🍌', '🍉', '🍓', '🍎', '🍒'];
        const slot1 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot2 = emojis[Math.floor(Math.random() * emojis.length)];
        const slot3 = emojis[Math.floor(Math.random() * emojis.length)];
        const result = slot1 === slot2 && slot2 === slot3 ? 'WIN! 🎉' : 'LOSE 😢';
        await reply(`🎰 *SLOT MACHINE*\n\n${slot1} | ${slot2} | ${slot3}\n\n${result}`);
    }
});

registerCommand({
    name: "dice",
    description: "Roll a dice",
    category: "game",
    execute: async ({ reply }) => {
        const result = Math.floor(Math.random() * 6) + 1;
        await reply(`🎲 You rolled: ${result}`);
    }
});

registerCommand({
    name: "rps",
    description: "Rock Paper Scissors",
    category: "game",
    execute: async ({ args, reply }) => {
        const choices = ['rock', 'paper', 'scissors'];
        const userChoice = args[0]?.toLowerCase();
        if (!choices.includes(userChoice)) return reply("❌ Choose rock, paper, or scissors");

        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let result = '';

        if (userChoice === botChoice) result = "It's a tie!";
        else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) result = 'You win! 🎉';
        else result = 'You lose! 😢';

        await reply(`✊✋✌️ *Rock Paper Scissors*\n\nYou: ${userChoice}\nBot: ${botChoice}\n\n${result}`);
    }
});

registerCommand({
    name: "math",
    description: "Math Quiz",
    category: "game",
    execute: async ({ reply }) => {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        // Ideally we would store the answer in a session map to check next message
        await reply(`🧮 *Math Quiz*\n\nSolve: ${num1} ${operator} ${num2} = ?\n\n(Reply with answer implementation pending)`);
    }
});

registerCommand({
    name: "casino",
    description: "Casino Game",
    category: "game",
    execute: async ({ reply }) => {
        const result = Math.random() > 0.5 ? "You won 1000 coins! 💰" : "You lost 500 coins 💸";
        await reply(`🎰 *CASINO*\n\n${result}`);
    }
});

// HANGMAN
registerCommand({
    name: "hangman",
    description: "Play hangman word guessing game",
    category: "game",
    execute: async ({ reply }) => {
        const words = ['JAVASCRIPT', 'PYTHON', 'WHATSAPP', 'CORTANA', 'PROGRAMMING', 'DATABASE', 'ARTIFICIAL', 'ALGORITHM'];
        const word = words[Math.floor(Math.random() * words.length)];
        const masked = '_'.repeat(word.length);
        await reply(`🎮 *Hangman Game*\n\nWord: ${masked.split('').join(' ')}\n\nGuess the word! (${word.length} letters)\n\n_Reply with your guess_`);
    }
});

// GUESS NUMBER
registerCommand({
    name: "guessnumber",
    aliases: ["guessnum", "guess"],
    description: "Guess the number (1-100)",
    category: "game",
    execute: async ({ reply }) => {
        const number = Math.floor(Math.random() * 100) + 1;
        await reply(`🎲 *Guess the Number!*\n\nI'm thinking of a number between 1 and 100.\n\nReply with your guess!\n\n_Hint: The number is ${number > 50 ? 'above' : 'below or equal to'} 50_`);
    }
});

// COIN FLIP
registerCommand({
    name: "coinflip",
    aliases: ["flip", "coin"],
    description: "Flip a coin",
    category: "game",
    execute: async ({ reply }) => {
        const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
        await reply(`🪙 *Coin Flip*\n\nResult: **${result}**!`);
    }
});

// 8-BALL
registerCommand({
    name: "8ball",
    aliases: ["eightball"],
    description: "Ask the magic 8-ball",
    category: "game",
    usage: ".8ball <question>",
    execute: async ({ args, reply }) => {
        const question = args.join(" ");
        if (!question) return reply("❌ Ask a question!\n\nUsage: .8ball Will I be rich?");

        const answers = [
            "Yes, definitely!",
            "It is certain!",
            "Without a doubt!",
            "You may rely on it.",
            "As I see it, yes.",
            "Most likely.",
            "Outlook good.",
            "Signs point to yes.",
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            "Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."
        ];

        const answer = answers[Math.floor(Math.random() * answers.length)];
        await reply(`🎱 *Magic 8-Ball*\n\nQuestion: ${question}\n\nAnswer: **${answer}**`);
    }
});

// TRIVIA QUESTIONS
registerCommand({
    name: "triviagame",
    aliases: ["quizgame"],
    description: "Play trivia quiz",
    category: "game",
    execute: async ({ reply }) => {
        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            if (response.data?.results) {
                const q = response.data.results[0];
                const answers = [...q.incorrect_answers, q.correct_answer].sort();
                const message = `🎯 *Trivia Time!*\n\n` +
                    `Category: ${q.category}\n` +
                    `Difficulty: ${q.difficulty}\n\n` +
                    `Question: ${q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}\n\n` +
                    `A) ${answers[0]}\n` +
                    `B) ${answers[1]}\n` +
                    `C) ${answers[2]}\n` +
                    `D) ${answers[3]}\n\n` +
                    `_Reply with A, B, C, or D_`;
                await reply(message);
            }
        } catch (error) {
            await reply("❌ Could not fetch trivia question!");
        }
    }
});

// QUIZ GAME
registerCommand({
    name: "quiz",
    description: "Random quiz question",
    category: "game",
    execute: async ({ reply }) => {
        const quizzes = [
            { q: "What is the capital of France?", a: "Paris" },
            { q: "What is 2 + 2?", a: "4" },
            { q: "What color is the sky?", a: "Blue" },
            { q: "How many continents are there?", a: "7" },
            { q: "What is the largest ocean?", a: "Pacific" },
            { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci" },
            { q: "What is the speed of light?", a: "299,792,458 m/s" }
        ];

        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        await reply(`❓ *Quick Quiz*\n\n${quiz.q}\n\n_Reply with your answer!_\n\n||Answer: ${quiz.a}||`);
    }
});
