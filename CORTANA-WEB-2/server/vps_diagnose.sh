#!/bin/bash
echo "============================================"
echo "   🕵️ CORANA VPS DIAGNOSTIC TOOL 🕵️"
echo "============================================"
echo "Time: $(date)"
echo ""

echo "📊 [1] MEMORY USAGE (RAM)"
free -h
echo ""

echo "💾 [2] DISK USAGE (Root)"
df -h / | awk 'NR==1 || NR==2'
echo ""

echo "📁 [3] PROJECT DIR SIZE ($(pwd))"
du -sh .
echo ""

echo "📂 [4] LARGEST FOLDERS IN PROJECT"
du -h --max-depth=1 | sort -hr | head -n 5
echo ""

echo "🔥 [5] TOP 5 MEMORY CONSUMING PROCESSES"
ps aux --sort=-%mem | head -n 6
echo ""

echo "⚡ [6] PM2 STATUS"
if command -v pm2 &> /dev/null; then
    pm2 list
    echo ""
    echo "📜 [7] RECENT PM2 ERROR LOGS"
    pm2 logs cortana --lines 20 --err --nostream
else
    echo "PM2 not found in path."
fi
echo ""

echo "🔐 [8] AUTH SESSIONS COUNT"
if [ -d "auth_sessions" ]; then
    echo "Total Sessions (Folders): $(find auth_sessions -mindepth 2 -maxdepth 2 -type d | wc -l)"
    echo "Auth Folder Size: $(du -sh auth_sessions | cut -f1)"
else
    echo "auth_sessions directory not found."
fi

echo "============================================"
echo "✅ DIAGNOSIS COMPLETE"
