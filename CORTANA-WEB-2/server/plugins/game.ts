import { registerCommand } from "./types";

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
