import { WASocket, getContentType, jidNormalizedUser, areJidsSameUser, proto } from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';

// Import the V8 engine using require with robust path checking
let V8Engine: any;
let smsgFunction: any;

try {
    // Try production path (dist/invictus-v8) first, then dev path
    const possiblePaths = [
        path.join(__dirname, 'invictus-v8/start/V8.js'),       // Production/Dist
        path.join(__dirname, '../server/invictus-v8/start/V8.js'), // Dev/Source
        path.join(process.cwd(), 'server/invictus-v8/start/V8.js'), // CWD fallback
        path.join(process.cwd(), 'dist/invictus-v8/start/V8.js')   // CWD Dist fallback (Critical)
    ];

    const functionPaths = [
        path.join(__dirname, 'invictus-v8/gudang/myfunction.js'),
        path.join(__dirname, '../server/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'server/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'dist/invictus-v8/gudang/myfunction.js')
    ];

    // DEBUG: Log Environment
    console.log('[InvictusAdapter] Debug Info:');
    console.log('__dirname:', __dirname);
    console.log('CWD:', process.cwd());

    try {
        console.log('Contents of __dirname:', fs.readdirSync(__dirname));
        const checkPath = path.join(__dirname, 'invictus-v8');
        if (fs.existsSync(checkPath)) {
            console.log('Contents of invictus-v8:', fs.readdirSync(checkPath));
        } else {
            console.log('invictus-v8 dir NOT FOUND at:', checkPath);
        }
    } catch (e: any) {
        console.log('Could not list dirs:', e.message);
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
        V8Engine = require(v8Path);
        console.log('[InvictusAdapter] ✅ V8 Engine loaded successfully!');
    } else {
        console.error('[InvictusAdapter] ❌ V8 Engine file NOT FOUND in paths:', possiblePaths);
    }

    if (funcPath) {
        console.log('[InvictusAdapter] Loading myfunction from:', funcPath);
        const myfunction = require(funcPath);
        smsgFunction = myfunction.smsg;
        console.log('[InvictusAdapter] ✅ smsg function loaded successfully!');
    } else {
        console.warn('[InvictusAdapter] ⚠️ myfunction.js NOT FOUND, using fallback serializer');
    }

} catch (error) {
    console.error('[InvictusAdapter] ❌ Failed to load V8 engine:', error);
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
        console.error('[InvictusAdapter] V8 Engine not loaded, cannot handle command.');
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
            console.log('[InvictusAdapter] Message serialization returned null, skipping');
            return;
        }

        // V8.js expects (client, m, chatUpdate, store)
        await V8Engine(enhancedSock, serializedMsg, chatUpdate, store);

    } catch (error: any) {
        console.error('[InvictusAdapter] Error executing V8 command:', error?.message || error);
    }
}
