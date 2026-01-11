import { WASocket, getContentType, jidNormalizedUser, areJidsSameUser, proto } from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Create a require function for dynamic imports (ES Module compatible)
const dynamicRequire = createRequire(import.meta.url || __filename);

// Import the V8 engine using require with robust path checking
let V8Engine: any;
let smsgFunction: any;

try {
    // In production, dist/index.cjs runs from dist/, so invictus-v8 should be at dist/invictus-v8
    // In development, server/invictus-adapter.ts runs from server/, so invictus-v8 is at server/invictus-v8

    const possiblePaths = [
        // Production paths (when running from dist/index.cjs)
        path.join(process.cwd(), 'dist/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/start/V8.js'),
        // Development paths
        path.join(process.cwd(), 'server/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/server/invictus-v8/start/V8.js'),
    ];

    const functionPaths = [
        path.join(process.cwd(), 'dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'server/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/server/invictus-v8/gudang/myfunction.js'),
    ];

    // DEBUG: Log Environment
    console.log('[InvictusAdapter] Debug Info:');
    console.log('  CWD:', process.cwd());
    console.log('  NODE_ENV:', process.env.NODE_ENV);

    // Check what's in dist folder
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
        console.log('  dist/ contents:', fs.readdirSync(distPath));
        const v8DistPath = path.join(distPath, 'invictus-v8');
        if (fs.existsSync(v8DistPath)) {
            console.log('  dist/invictus-v8/ contents:', fs.readdirSync(v8DistPath));
        } else {
            console.log('  ❌ dist/invictus-v8/ NOT FOUND');
        }
    } else {
        console.log('  ❌ dist/ folder NOT FOUND');
    }

    // Check possible paths and log
    console.log('[InvictusAdapter] Checking paths:');
    for (const p of possiblePaths) {
        const exists = fs.existsSync(p);
        console.log(`  ${exists ? '✅' : '❌'} ${p}`);
    }

    // Load V8 Engine
    let v8Path = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            v8Path = p;
            break;
        }
    }

    // Load myfunction.js for smsg serializer
    let funcPath = '';
    for (const p of functionPaths) {
        if (fs.existsSync(p)) {
            funcPath = p;
            break;
        }
    }

    if (v8Path) {
        console.log('[InvictusAdapter] Loading V8 engine from:', v8Path);
        // Use dynamicRequire for proper module resolution
        V8Engine = dynamicRequire(v8Path);
        console.log('[InvictusAdapter] ✅ V8 Engine loaded successfully!');
    } else {
        console.error('[InvictusAdapter] ❌ V8 Engine file NOT FOUND in any path');
        console.error('[InvictusAdapter] Make sure to run: npm run build');
    }

    if (funcPath) {
        console.log('[InvictusAdapter] Loading myfunction from:', funcPath);
        const myfunction = dynamicRequire(funcPath);
        smsgFunction = myfunction.smsg;
        console.log('[InvictusAdapter] ✅ smsg function loaded successfully!');
    } else {
        console.warn('[InvictusAdapter] ⚠️ myfunction.js NOT FOUND, using fallback serializer');
    }

} catch (error: any) {
    console.error('[InvictusAdapter] ❌ Failed to load V8 engine:', error.message);
    console.error('[InvictusAdapter] Stack:', error.stack);
}

// Fallback message serializer if smsg is not available
function serializeMessage(client: WASocket, msg: any): any {
    if (!msg) return msg;

    const m: any = { ...msg };

    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat?.endsWith('@g.us') || false;
        m.sender = m.fromMe
            ? (client.user?.id || '')
            : (m.key.participant || m.key.remoteJid || '');

        if (m.isGroup && m.key.participant) {
            m.participant = m.key.participant;
        }
    }

    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = m.message[m.mtype];

        // Extract text content
        m.text = m.message.conversation
            || m.message.extendedTextMessage?.text
            || m.msg?.caption
            || m.msg?.text
            || '';

        m.body = m.text;

        // Handle quoted messages
        if (m.msg?.contextInfo?.quotedMessage) {
            const quotedType = getContentType(m.msg.contextInfo.quotedMessage);
            m.quoted = {
                ...m.msg.contextInfo.quotedMessage[quotedType],
                mtype: quotedType,
                id: m.msg.contextInfo.stanzaId,
                chat: m.msg.contextInfo.remoteJid || m.chat,
                sender: m.msg.contextInfo.participant,
                text: m.msg.contextInfo.quotedMessage[quotedType]?.text
                    || m.msg.contextInfo.quotedMessage[quotedType]?.caption
                    || m.msg.contextInfo.quotedMessage.conversation
                    || ''
            };
            m.quoted.msg = m.quoted;
        }

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    }

    // Add helper methods
    m.pushName = msg.pushName || 'User';

    return m;
}

// Add decodeJid helper to socket if not present
function ensureDecodeJid(sock: WASocket): WASocket {
    if (!(sock as any).decodeJid) {
        (sock as any).decodeJid = (jid: string) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decoded = jidNormalizedUser(jid);
                return decoded;
            }
            return jidNormalizedUser(jid);
        };
    }
    return sock;
}

export async function handleInvictusCommand(sock: WASocket, message: any, chatUpdate: any, store: any) {
    if (!V8Engine) {
        // Only log once per session, not every message
        return;
    }

    try {
        // Ensure socket has decodeJid method
        const enhancedSock = ensureDecodeJid(sock);

        // Serialize the message to the format V8.js expects
        let serializedMsg: any;

        if (smsgFunction) {
            // Use the original smsg function from myfunction.js
            serializedMsg = smsgFunction(enhancedSock, message, store);
        } else {
            // Use fallback serializer
            serializedMsg = serializeMessage(enhancedSock, message);
        }

        if (!serializedMsg) {
            return;
        }

        // V8.js expects (client, m, chatUpdate, store)
        await V8Engine(enhancedSock, serializedMsg, chatUpdate, store);

    } catch (error: any) {
        console.error('[InvictusAdapter] Error executing V8 command:', error?.message || error);
    }
}
