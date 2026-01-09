import { WASocket } from '@whiskeysockets/baileys';
import * as path from 'path';

// Import the V8 engine using require since it's a JS CommonJS module
// We use a try-catch to handle potential loading errors gracefully
import * as fs from 'fs';

// Import the V8 engine using require with robust path checking
let V8Engine: any;
try {
    // Try production path (dist/invictus-v8) first, then dev path
    const possiblePaths = [
        path.join(__dirname, 'invictus-v8/start/V8.js'),       // Production/Dist
        path.join(__dirname, '../server/invictus-v8/start/V8.js'), // Dev/Source
        path.join(process.cwd(), 'server/invictus-v8/start/V8.js') // CWD fallback
    ];

    let v8Path = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            v8Path = p;
            break;
        }
    }

    if (v8Path) {
        console.log('[InvictusAdapter] Loading V8 engine from:', v8Path);
        V8Engine = require(v8Path);
        console.log('[InvictusAdapter] ✅ V8 Engine loaded successfully!');
    } else {
        console.error('[InvictusAdapter] ❌ V8 Engine file NOT FOUND in paths:', possiblePaths);
    }
} catch (error) {
    console.error('[InvictusAdapter] ❌ Failed to load V8 engine:', error);
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
