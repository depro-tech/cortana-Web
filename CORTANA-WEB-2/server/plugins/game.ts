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

// Game State for TicTacToe (In-Memory is fine for short games)
const tttGames: Record<string, {
    board: string[];
    turn: string; // 'X' or 'O'
    playerX: string;
    playerO: string;
    state: 'WAITING' | 'PLAYING';
}> = {};

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

registerCommand({
    name: "tictactoe",
    aliases: ["ttt"],
    description: "Play Tic Tac Toe",
    category: "game",
    execute: async ({ reply, senderJid, msg, args, sock }) => {
        const chatId = msg.key.remoteJid!;

        // Handle Game Moves if game exists
        if (tttGames[chatId] && tttGames[chatId].state === 'PLAYING') {
            const game = tttGames[chatId];

            // Check if user is a player
            if (senderJid !== game.playerX && senderJid !== game.playerO) {
                return reply("❌ You are not in this game!");
            }

            // Check turn
            const isX = senderJid === game.playerX;
            if ((isX && game.turn !== 'X') || (!isX && game.turn !== 'O')) {
                return reply("⏳ It's not your turn!");
            }

            // Parse move (1-9)
            const pos = parseInt(args[0]) - 1;
            if (isNaN(pos) || pos < 0 || pos > 8) {
                return reply("❌ Invalid move! Send number 1-9.");
            }

            if (game.board[pos] !== '⬜') {
                return reply("❌ Space taken!");
            }

            // Make move
            game.board[pos] = game.turn === 'X' ? '❌' : '⭕';

            // Check win
            let won = false;
            for (const combo of winningCombos) {
                const [a, b, c] = combo;
                if (game.board[a] !== '⬜' && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
                    won = true;
                    delete tttGames[chatId];
                    return reply(`🎮 *TicTacToe*\n\n${renderBoard(game.board)}\n\n🎉 @${senderJid.split('@')[0]} WINS!`, { mentions: [senderJid] });
                }
            }

            // Check draw
            if (!game.board.includes('⬜')) {
                delete tttGames[chatId];
                return reply(`🎮 *TicTacToe*\n\n${renderBoard(game.board)}\n\n🤝 It's a DRAW!`);
            }

            // Switch turn
            game.turn = game.turn === 'X' ? 'O' : 'X';
            const nextPlayer = game.turn === 'X' ? game.playerX : game.playerO;

            return reply(`🎮 *TicTacToe*\n\n${renderBoard(game.board)}\n\nTurn: @${nextPlayer.split('@')[0]} (${game.turn})`, { mentions: [nextPlayer] });
        }

        // Start New Game or Join
        if (args[0] === 'join') {
            if (!tttGames[chatId] || tttGames[chatId].state !== 'WAITING') {
                return reply("❌ No game waiting to join. Start one with .ttt");
            }
            if (tttGames[chatId].playerX === senderJid) {
                return reply("❌ You created the game!");
            }

            tttGames[chatId].playerO = senderJid;
            tttGames[chatId].state = 'PLAYING';

            return reply(`🎮 *Game Started!*\n\nX: @${tttGames[chatId].playerX.split('@')[0]}\nO: @${senderJid.split('@')[0]}\n\n${renderBoard(tttGames[chatId].board)}\n\nTurn: X`, { mentions: [tttGames[chatId].playerX, senderJid] });
        }

        // Create Game
        if (tttGames[chatId]) {
            return reply("❌ Game already in progress here! Finish it first.");
        }

        tttGames[chatId] = {
            board: Array(9).fill('⬜'),
            turn: 'X',
            playerX: senderJid,
            playerO: '',
            state: 'WAITING'
        };

        await reply(`🎮 *TicTacToe Created!*\n\nWaiting for player 2...\nType *.ttt join* to play!`);
    }
});

function renderBoard(board: string[]) {
    return `${board[0]}${board[1]}${board[2]}\n${board[3]}${board[4]}${board[5]}\n${board[6]}${board[7]}${board[8]}`;
}

// Fixed Math Quiz (Simple)
registerCommand({
    name: "math",
    description: "Simple math problem",
    category: "game",
    execute: async ({ reply }) => {
        const n1 = Math.floor(Math.random() * 50);
        const n2 = Math.floor(Math.random() * 50);
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        // Just displays question, validation would require session state
        await reply(`🧮 *Math*\n\nCalculate: ${n1} ${op} ${n2}\n\n(Mental math practice!)`);
    }
});
