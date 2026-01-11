import { WASocket, getContentType, jidNormalizedUser, areJidsSameUser, proto } from '@whiskeysockets/baileys';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';

// Create a require function for dynamic imports (ES Module compatible)
const dynamicRequire = createRequire(import.meta.url || __filename);

// Import the V8 engine using require with robust path checking
let V8Engine: any;
let smsgFunction: any;
let v8Loaded = false;
let loadError: string | null = null;

// Log once at startup
console.log('[V8] ═══════════════════════════════════');
console.log('[V8] Initializing Invictus V8 Engine...');
console.log('[V8] CWD:', process.cwd());

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

    // Check paths
    let v8Path = '';
    for (const p of possiblePaths) {
        const exists = fs.existsSync(p);
        console.log(`[V8] ${exists ? '✅' : '❌'} ${p}`);
        if (exists && !v8Path) v8Path = p;
    }

    let funcPath = '';
    for (const p of functionPaths) {
        if (fs.existsSync(p)) {
            funcPath = p;
            break;
        }
    }

    if (v8Path) {
        console.log('[V8] Loading from:', v8Path);
        V8Engine = dynamicRequire(v8Path);
        v8Loaded = true;
        console.log('[V8] ✅ V8 Engine loaded successfully!');
        console.log('[V8] Type:', typeof V8Engine);
    } else {
        loadError = 'V8.js not found in any path';
        console.error('[V8] ❌', loadError);
    }

    if (funcPath) {
        const myfunction = dynamicRequire(funcPath);
        smsgFunction = myfunction.smsg;
        console.log('[V8] ✅ smsg function loaded');
    } else {
        console.log('[V8] ⚠️ Using fallback message serializer');
    }

} catch (error: any) {
    loadError = error.message;
    console.error('[V8] ❌ Load error:', error.message);
    console.error('[V8] Stack:', error.stack);
}

console.log('[V8] ═══════════════════════════════════');

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
        if (m.mtype) {
            m.msg = m.message[m.mtype];
        }
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
    // Debug: Log if V8 is loaded
    if (!v8Loaded) {
        // Only log once per minute to avoid spam
        return;
    }

    try {
        const enhancedSock = ensureDecodeJid(sock);
        let serializedMsg: any;

        if (smsgFunction) {
            serializedMsg = smsgFunction(enhancedSock, message, store);
        } else {
            serializedMsg = serializeMessage(enhancedSock, message);
        }

        if (!serializedMsg) {
            return;
        }

        // Debug: Log command being processed
        const text = serializedMsg.text || serializedMsg.body || '';
        if (text.startsWith('.')) {
            console.log('[V8] Processing command:', text.split(' ')[0]);
        }

        await V8Engine(enhancedSock, serializedMsg, chatUpdate, store);

    } catch (error: any) {
        console.error('[V8] Command error:', error?.message || error);
        console.error('[V8] Stack:', error?.stack);
    }
}

// Export status for debugging
export function getV8Status() {
    return { loaded: v8Loaded, error: loadError };
}
