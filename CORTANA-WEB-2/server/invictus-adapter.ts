import { WASocket } from '@whiskeysockets/baileys';
import * as path from 'path';

// Import the V8 engine using require since it's a JS CommonJS module
// We use a try-catch to handle potential loading errors gracefully
let V8Engine: any;
try {
    const v8Path = path.join(__dirname, 'invictus-v8/start/V8.js');
    console.log('[InvictusAdapter] Loading V8 engine from:', v8Path);
    V8Engine = require(v8Path);
} catch (error) {
    console.error('[InvictusAdapter] Failed to load V8 engine:', error);
}

export async function handleInvictusCommand(sock: WASocket, message: any, chatUpdate: any, store: any) {
    if (!V8Engine) {
        console.error('[InvictusAdapter] V8 Engine not loaded, cannot handle command.');
        return;
    }

    try {
        // V8.js expects (client, m, chatUpdate, store)
        // We pass the socket as client
        await V8Engine(sock, message, chatUpdate, store);
    } catch (error) {
        console.error('[InvictusAdapter] Error executing V8 command:', error);
    }
}
