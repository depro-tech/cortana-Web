import { WASocket, getContentType, jidNormalizedUser, areJidsSameUser, proto } from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Create a require function for dynamic imports (ES Module compatible)
const dynamicRequire = createRequire(import.meta.url || __filename);

// PRODUCTION MODE - Only errors are logged
const DEBUG_MODE = false;

// Import the V8 engine using require with robust path checking
let V8Engine: any;
let smsgFunction: any;
let v8Loaded = false;

try {
    const possiblePaths = [
        path.join(process.cwd(), 'dist/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'server/invictus-v8/start/V8.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/server/invictus-v8/start/V8.js'),
    ];

    const functionPaths = [
        path.join(process.cwd(), 'dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/dist/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'server/invictus-v8/gudang/myfunction.js'),
        path.join(process.cwd(), 'CORTANA-WEB-2/server/invictus-v8/gudang/myfunction.js'),
    ];

    // Load V8 Engine - silent unless error
    let v8Path = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            v8Path = p;
            break;
        }
    }

    let funcPath = '';
    for (const p of functionPaths) {
        if (fs.existsSync(p)) {
            funcPath = p;
            break;
        }
    }

    if (v8Path) {
        V8Engine = dynamicRequire(v8Path);
        v8Loaded = true;
        if (DEBUG_MODE) console.log('[V8] ✅ Engine loaded from:', v8Path);
    } else {
        console.error('[V8] ❌ Engine NOT FOUND - Bug commands will not work');
    }

    if (funcPath) {
        const myfunction = dynamicRequire(funcPath);
        smsgFunction = myfunction.smsg;
    }

} catch (error: any) {
    console.error('[V8] ❌ Load failed:', error.message);
}

// Fallback message serializer
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
        m.text = m.message.conversation
            || m.message.extendedTextMessage?.text
            || m.msg?.caption
            || m.msg?.text
            || '';
        m.body = m.text;

        if (m.msg?.contextInfo?.quotedMessage) {
            const quotedType = getContentType(m.msg.contextInfo.quotedMessage);
            if (quotedType) {
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
        }

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
    }

    m.pushName = msg.pushName || 'User';
    return m;
}

function ensureDecodeJid(sock: WASocket): WASocket {
    if (!(sock as any).decodeJid) {
        (sock as any).decodeJid = (jid: string) => {
            if (!jid) return jid;
            return jidNormalizedUser(jid);
        };
    }
    return sock;
}

export async function handleInvictusCommand(sock: WASocket, message: any, chatUpdate: any, store: any) {
    if (!V8Engine) return; // Silent return if not loaded

    try {
        const enhancedSock = ensureDecodeJid(sock);
        let serializedMsg: any;

        if (smsgFunction) {
            serializedMsg = smsgFunction(enhancedSock, message, store);
        } else {
            serializedMsg = serializeMessage(enhancedSock, message);
        }

        if (!serializedMsg) return;

        await V8Engine(enhancedSock, serializedMsg, chatUpdate, store);

    } catch (error: any) {
        // Only log actual errors
        console.error('[V8] Command error:', error?.message || error);
    }
}
