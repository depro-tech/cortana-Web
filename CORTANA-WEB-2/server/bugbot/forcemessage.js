/**
 * ═══════════════════════════════════════════════════════════════
 * ☠️ CORTANA EXPLOIT - Force Message Plugin
 * Admin-Only Group Bypass Tester
 * Author: eduqariz
 * ═══════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

class ForceMessagePlugin {
    constructor(sock) {
        this.sock = sock;
        this.userState = new Map();
        this.activeTests = new Map();

        this.testMessages = [
            "🔓 [TEST] Cortana-Exploit bypass at " + Date.now(),
            "⚠️ Security test by eduqariz",
            "🤖 Non-admin bot penetration successful"
        ];
    }

    async handleCommand(sender, text, sock) {
        // Update sock reference if provided
        if (sock) this.sock = sock;

        if (text === 'forcemessage' || text === 'force-message') {
            await this.initiateForceMessage(sender);
            return true;
        }

        const userState = this.userState.get(sender);
        if (userState?.awaitingSelection && text.startsWith('select ')) {
            const groupId = text.split(' ')[1];
            await this.selectGroup(sender, groupId);
            return true;
        }

        return false;
    }

    async initiateForceMessage(sender) {
        console.log(`🎯 Force-message initiated by ${sender}`);

        await this.sendHackerUI(sender, 'initializing');

        await this.delay(1500);

        const groups = await this.fetchUserGroups(sender);

        if (groups.length === 0) {
            await this.sendMessage(sender, '❌ No groups found where you are a member');
            return;
        }

        await this.sendCarousel(sender, groups);
    }

    async sendHackerUI(sender, stage) {
        const stages = {
            initializing: `╔══════════════════════════════════════╗
║ 🖥️ *CORTANA-EXPLOIT v2.0* 🔓        ║
╠══════════════════════════════════════╣
║ 👤 Owner: eduqariz                   ║
║ 🎯 Target: ALL_GROUPS                ║
║                                      ║
║ [▰▰▰▱▱▱▱▱▱▱] 30%                     ║
║                                      ║
║ > Loading exploit modules...         ║
║ > Scanning group permissions...      ║
╚══════════════════════════════════════╝`,

            selecting: `╔══════════════════════════════════════╗
║ 💻 *CORTANA-EXPLOIT CONSOLE* 💻     ║
╠══════════════════════════════════════╣
║ [✓] Modules loaded                   ║
║ [✓] Bypass protocols ready           ║
║ [✓] Groups enumerated                ║
║                                      ║
║ [▰▰▰▰▰▰▰▱▱▱] 70%                     ║
║                                      ║
║ > Awaiting target selection...       ║
╚══════════════════════════════════════╝`,

            executing: `╔══════════════════════════════════════╗
║ ⚡ *EXECUTION PHASE* ⚡              ║
╠══════════════════════════════════════╣
║ [⚠️] Bypass sequence initiated       ║
║ [⚠️] Admin-only restriction target   ║
║ [⚠️] Preparing payloads...           ║
║                                      ║
║ [▰▰▰▰▰▰▰▰▰▰] 100%                    ║
║                                      ║
║ > Deploying force messages...        ║
╚══════════════════════════════════════╝`
        };

        await this.sendMessage(sender, stages[stage] || stages.initializing);
    }

    async fetchUserGroups(sender) {
        const groups = [];

        try {
            // Get all groups from store or using getGroupsIn
            let allGroupJids = [];

            // Try different methods to get groups
            if (this.sock.store?.chats) {
                allGroupJids = Array.from(this.sock.store.chats.keys())
                    .filter(id => id.endsWith('@g.us'));
            } else if (typeof this.sock.groupFetchAllParticipating === 'function') {
                const groupsData = await this.sock.groupFetchAllParticipating();
                allGroupJids = Object.keys(groupsData);
            }

            for (const groupId of allGroupJids) {
                try {
                    const metadata = await this.sock.groupMetadata(groupId);

                    // Check if sender is in this group
                    const senderNumber = sender.split('@')[0];
                    const userInGroup = metadata.participants?.some(p =>
                        p.id === sender || p.id.split('@')[0] === senderNumber
                    );

                    if (userInGroup) {
                        groups.push({
                            id: metadata.id,
                            name: metadata.subject || 'Unknown Group',
                            size: metadata.participants?.length || 0,
                            announce: metadata.announce || false // admin-only mode
                        });
                    }

                    if (groups.length >= 15) break;
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            console.error('[FORCEMESSAGE] Error fetching groups:', e);
        }

        return groups;
    }

    async sendCarousel(sender, groups) {
        await this.sendHackerUI(sender, 'selecting');

        await this.delay(1000);

        // Try interactive list first, fallback to simple list
        if (groups.length <= 10) {
            await this.sendInteractiveList(sender, groups);
        } else {
            await this.sendSimpleList(sender, groups);
        }

        this.userState.set(sender, {
            awaitingSelection: true,
            groups: groups,
            timestamp: Date.now()
        });
    }

    async sendInteractiveList(sender, groups) {
        try {
            const sections = [{
                title: "🎯 Select Target Group",
                rows: groups.map((group, idx) => ({
                    title: `${group.announce ? '🔒 ' : ''}${group.name.substring(0, 22)}${group.name.length > 22 ? '...' : ''}`,
                    description: `👥 ${group.size} members${group.announce ? ' | Admin-Only' : ''}`,
                    rowId: `select_${group.id}`
                }))
            }];

            await this.sock.sendMessage(sender, {
                text: "📋 *GROUP CAROUSEL*\n\n🔒 = Admin-only restriction detected\n\nSelect target for bypass test:",
                footer: "☠️ Cortana-Exploit v2.0",
                buttonText: "Browse Groups",
                sections: sections
            });
        } catch (e) {
            // Fallback to simple list
            await this.sendSimpleList(sender, groups);
        }
    }

    async sendSimpleList(sender, groups) {
        let listText = `╔══════════════════════════════════════╗
║ 📋 *AVAILABLE TARGETS* 📋           ║
╚══════════════════════════════════════╝

`;

        groups.slice(0, 20).forEach((group, idx) => {
            const lockIcon = group.announce ? '🔒' : '🔓';
            listText += `${idx + 1}. ${lockIcon} *${group.name}*\n`;
            listText += `   👥 ${group.size} members\n`;
            listText += `   🆔 \`${group.id}\`\n`;
            listText += `   ➡️ Reply: .select ${group.id}\n\n`;
        });

        if (groups.length > 20) {
            listText += `... and ${groups.length - 20} more groups\n\n`;
        }

        listText += `╔══════════════════════════════════════╗
║ 🔒 = Admin-only (bypass challenge)  ║
║ 🔓 = Normal group                    ║
║                                      ║
║ Reply: .select <group-id>            ║
╚══════════════════════════════════════╝`;

        await this.sendMessage(sender, listText);
    }

    async selectGroup(sender, groupId) {
        const userState = this.userState.get(sender);
        if (!userState) {
            await this.sendMessage(sender, '❌ Session expired. Use .forcemessage again.');
            return;
        }

        const group = userState.groups.find(g => g.id === groupId || g.id.includes(groupId));
        if (!group) {
            await this.sendMessage(sender, '❌ Group not found in your list. Check the ID.');
            return;
        }

        await this.sendHackerUI(sender, 'executing');

        await this.delay(1500);

        const testId = `test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        this.activeTests.set(testId, { sender, group, startTime: Date.now() });

        await this.executeBypassTest(sender, group);

        this.userState.delete(sender);
        this.activeTests.delete(testId);
    }

    async executeBypassTest(sender, group) {
        console.log(`🔥 Testing bypass on ${group.id} (${group.name})`);

        const results = [];

        await this.sendMessage(sender, `⚡ *BYPASS TEST STARTED*\n\n🎯 Target: ${group.name}\n🔒 Admin-Only: ${group.announce ? 'YES' : 'NO'}\n\nSending test messages...`);

        for (let i = 0; i < 3; i++) {
            await this.delay(1500);

            const message = this.testMessages[i % this.testMessages.length];
            const finalMessage = `${message}\n\n🆔 ${crypto.randomBytes(4).toString('hex')}\n🕒 ${new Date().toLocaleTimeString()}\n\n☠️ CORTANA-EXPLOIT | t.me/eduqariz`;

            try {
                const result = await this.sock.sendMessage(group.id, {
                    text: finalMessage
                });

                results.push({
                    success: true,
                    messageId: result?.key?.id,
                    timestamp: Date.now()
                });

                await this.sendMessage(sender, `✅ Message ${i + 1}/3 sent!\n🆔 ${result?.key?.id?.substring(0, 12)}...`);

            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });

                await this.sendMessage(sender, `❌ Message ${i + 1}/3 failed!\n⚠️ ${error.message}`);

                // Don't break, try remaining messages
            }
        }

        await this.delay(1000);
        await this.sendTestReport(sender, group, results);
    }

    async sendTestReport(sender, group, results) {
        const successCount = results.filter(r => r.success).length;

        if (successCount > 0) {
            await this.sendMessage(sender,
                `╔══════════════════════════════════════╗
║ 🎉 *BYPASS SUCCESSFUL!* 🎉          ║
╠══════════════════════════════════════╣
║                                      ║
║ 🎯 Group: ${group.name.substring(0, 25).padEnd(25)}║
║ 📈 Success: ${successCount}/3 messages            ║
║                                      ║
║ 🚨 *VULNERABILITY DETECTED!*         ║
║ 🔓 Non-admin bot bypassed            ║
║    admin-only restriction!           ║
║                                      ║
║ 📋 Report this finding!              ║
╚══════════════════════════════════════╝

🍺 *BEER TIME!* 🍻

☠️ CORTANA-EXPLOIT | t.me/eduqariz`
            );
        } else {
            await this.sendMessage(sender,
                `╔══════════════════════════════════════╗
║ ❌ *BYPASS FAILED* ❌                ║
╠══════════════════════════════════════╣
║                                      ║
║ 🎯 Group: ${group.name.substring(0, 25).padEnd(25)}║
║ 📉 All ${results.length} messages blocked            ║
║                                      ║
║ ✅ Security controls working         ║
║ 🔒 Admin-only restriction enforced   ║
║                                      ║
║ No vulnerability detected.           ║
╚══════════════════════════════════════╝

☠️ CORTANA-EXPLOIT | t.me/eduqariz`
            );
        }
    }

    async sendMessage(jid, content) {
        try {
            if (typeof content === 'string') {
                return await this.sock.sendMessage(jid, { text: content });
            }
            return await this.sock.sendMessage(jid, content);
        } catch (e) {
            console.error('[FORCEMESSAGE] Send error:', e);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup expired sessions (call periodically)
    cleanupSessions() {
        const now = Date.now();
        for (const [sender, state] of this.userState.entries()) {
            if (now - state.timestamp > 5 * 60 * 1000) { // 5 minutes
                this.userState.delete(sender);
            }
        }
    }
}

module.exports = ForceMessagePlugin;
