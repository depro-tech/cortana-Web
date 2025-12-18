import { type WASocket } from "@whiskeysockets/baileys";
import { storage } from "../storage";
import { db } from "../db";

export interface CommandContext {
    sock: WASocket;
    msg: any;
    args: string[];
    text: string;
    senderJid: string;
    isOwner: boolean;
    reply: (text: string) => Promise<any>;
}

export interface Command {
    name: string;
    aliases?: string[];
    description: string;
    category: string;
    usage?: string; // e.g., ".play <song name>"
    ownerOnly?: boolean;
    execute: (ctx: CommandContext) => Promise<void>;
}

export const commands: Map<string, Command> = new Map();

export function registerCommand(cmd: Command) {
    commands.set(cmd.name, cmd);
    cmd.aliases?.forEach(alias => commands.set(alias, cmd));
}
