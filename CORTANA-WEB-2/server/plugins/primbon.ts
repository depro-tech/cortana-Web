import { registerCommand } from "./types";
import axios from "axios";
import * as cheerio from "cheerio";

// Indonesian Primbon (Fortune Telling) Commands

registerCommand({
    name: "artinama",
    description: "Arti nama (Indonesian name meaning)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .artinama <name>\nContoh: .artinama Budi");

        try {
            const response = await axios.get(`https://www.primbon.com/arti_nama.php?nama1=${encodeURIComponent(name)}&proses=+Submit%21+`);
            const $ = cheerio.load(response.data);
            
            let result = $("#body").text().trim();
            if (result) {
                result = result.substring(0, 500); // Limit length
                await reply(`🔮 *Arti Nama: ${name}*\n\n${result}`);
            } else {
                await reply("❌ Tidak dapat menemukan arti nama tersebut.");
            }
        } catch (error) {
            console.error("[ARTINAMA] Error:", error);
            await reply("❌ Gagal mengambil data primbon.");
        }
    }
});

registerCommand({
    name: "artimimpi",
    description: "Arti mimpi (Indonesian dream interpretation)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const dream = args.join(" ");
        if (!dream) return reply("❌ Usage: .artimimpi <mimpi>\nContoh: .artimimpi ular");

        try {
            const response = await axios.get(`https://www.primbon.com/tafsir_mimpi.php?mimpi=${encodeURIComponent(dream)}&submit=+Submit%21+`);
            const $ = cheerio.load(response.data);
            
            let result = $("#body").text().trim();
            if (result) {
                result = result.substring(0, 500);
                await reply(`💭 *Arti Mimpi: ${dream}*\n\n${result}`);
            } else {
                await reply("❌ Tidak dapat menemukan arti mimpi tersebut.");
            }
        } catch (error) {
            console.error("[ARTIMIMPI] Error:", error);
            await reply("❌ Gagal mengambil data primbon.");
        }
    }
});

registerCommand({
    name: "ramalanjodoh",
    aliases: ["jodoh"],
    description: "Ramalan jodoh (Indonesian love compatibility)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        if (args.length < 2) return reply("❌ Usage: .ramalanjodoh <nama1> <nama2>\nContoh: .ramalanjodoh Budi Ani");

        const name1 = args[0];
        const name2 = args[1];

        try {
            const response = await axios.get(`https://www.primbon.com/kecocokan_nama_pasangan.php?nama1=${encodeURIComponent(name1)}&nama2=${encodeURIComponent(name2)}&proses=+Submit%21+`);
            const $ = cheerio.load(response.data);
            
            let result = $("#body").text().trim();
            if (result) {
                result = result.substring(0, 500);
                await reply(`💑 *Ramalan Jodoh*\n👤 ${name1} ❤️ ${name2}\n\n${result}`);
            } else {
                await reply("❌ Tidak dapat mengambil ramalan jodoh.");
            }
        } catch (error) {
            console.error("[RAMALANJODOH] Error:", error);
            await reply("❌ Gagal mengambil data primbon.");
        }
    }
});

registerCommand({
    name: "zodiak",
    aliases: ["zodiac"],
    description: "Ramalan zodiak (Indonesian zodiac)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const zodiak = args[0];
        if (!zodiak) return reply("❌ Usage: .zodiak <zodiak>\nContoh: .zodiak aries\n\nZodiak: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces");

        const zodiakMap: Record<string, string> = {
            aries: "1", taurus: "2", gemini: "3", cancer: "4",
            leo: "5", virgo: "6", libra: "7", scorpio: "8",
            sagittarius: "9", capricorn: "10", aquarius: "11", pisces: "12"
        };

        const zodNumber = zodiakMap[zodiak.toLowerCase()];
        if (!zodNumber) return reply("❌ Zodiak tidak valid! Gunakan: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces");

        try {
            await reply(`♈ *Ramalan Zodiak ${zodiak.toUpperCase()}*\n\n✨ Hari ini adalah hari yang baik untuk ${zodiak}!\n💫 Keberuntungan: ⭐⭐⭐⭐\n💰 Keuangan: Stabil\n❤️ Cinta: Harmonis`);
        } catch (error) {
            console.error("[ZODIAK] Error:", error);
            await reply("❌ Gagal mengambil ramalan zodiak.");
        }
    }
});

registerCommand({
    name: "shio",
    description: "Ramalan shio (Indonesian Chinese zodiac)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const shio = args[0];
        if (!shio) return reply("❌ Usage: .shio <shio>\nContoh: .shio naga\n\nShio: tikus, kerbau, macan, kelinci, naga, ular, kuda, kambing, monyet, ayam, anjing, babi");

        const shioList = ["tikus", "kerbau", "macan", "kelinci", "naga", "ular", "kuda", "kambing", "monyet", "ayam", "anjing", "babi"];
        if (!shioList.includes(shio.toLowerCase())) {
            return reply("❌ Shio tidak valid! Gunakan: tikus, kerbau, macan, kelinci, naga, ular, kuda, kambing, monyet, ayam, anjing, babi");
        }

        await reply(`🐉 *Ramalan Shio ${shio.toUpperCase()}*\n\n✨ Keberuntungan hari ini: Baik\n💰 Rejeki: Lancar\n❤️ Asmara: Harmonis\n🏆 Karir: Progresif`);
    }
});

registerCommand({
    name: "weton",
    description: "Ramalan berdasarkan weton Jawa (Javanese calendar)",
    category: "primbon",
    execute: async ({ args, reply }) => {
        if (args.length < 3) return reply("❌ Usage: .weton <tanggal> <bulan> <tahun>\nContoh: .weton 15 08 1995");

        const day = args[0];
        const month = args[1];
        const year = args[2];

        await reply(`📅 *Ramalan Weton*\n\nTanggal: ${day}/${month}/${year}\n\n✨ Weton Anda memiliki karakter:\n• Pekerja keras\n• Sabar\n• Bijaksana\n💰 Rejeki: Lancar di usia matang\n❤️ Jodoh: Cocok dengan weton Rabu Pon`);
    }
});

registerCommand({
    name: "pekerjaan",
    aliases: ["karir"],
    description: "Ramalan pekerjaan/karir",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .pekerjaan <nama>\nContoh: .pekerjaan Budi");

        await reply(`💼 *Ramalan Karir: ${name}*\n\n🎯 Bidang yang cocok:\n• Bisnis\n• Teknologi\n• Pendidikan\n\n📈 Peluang:\n• Tahun ini adalah tahun keberuntungan\n• Kesempatan promosi terbuka lebar\n• Jangan takut ambil risiko`);
    }
});

registerCommand({
    name: "rejeki",
    aliases: ["rezeki"],
    description: "Ramalan rejeki/keuangan",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .rejeki <nama>\nContoh: .rejeki Budi");

        await reply(`💰 *Ramalan Rejeki: ${name}*\n\n✨ Kondisi Keuangan:\n• Stabil dan terus meningkat\n• Ada rezeki nomplok di bulan ini\n• Investasi akan memberikan hasil\n\n📊 Saran:\n• Kelola keuangan dengan bijak\n• Jangan boros\n• Sedekah membawa berkah`);
    }
});

registerCommand({
    name: "pernikahan",
    aliases: ["nikah"],
    description: "Ramalan pernikahan",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .pernikahan <nama>\nContoh: .pernikahan Budi");

        await reply(`💑 *Ramalan Pernikahan: ${name}*\n\n💕 Prediksi:\n• Akan menikah dalam 1-2 tahun\n• Pasangan ideal: Orang yang sabar\n• Rumah tangga harmonis\n\n🏠 Kehidupan:\n• Akan dikaruniai 2-3 anak\n• Ekonomi keluarga stabil\n• Banyak kebahagiaan`);
    }
});

registerCommand({
    name: "sifat",
    aliases: ["karakter"],
    description: "Ramalan sifat/karakter",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .sifat <nama>\nContoh: .sifat Budi");

        await reply(`🎭 *Ramalan Sifat: ${name}*\n\n✨ Karakter:\n• Pekerja keras\n• Jujur dan dapat dipercaya\n• Suka menolong\n• Kreatif dan inovatif\n\n⚠️ Kelemahan:\n• Terlalu perfeksionis\n• Kadang keras kepala\n\n💪 Kekuatan:\n• Leadership yang baik\n• Komunikasi efektif`);
    }
});

registerCommand({
    name: "keberuntungan",
    aliases: ["hoki", "lucky"],
    description: "Ramalan keberuntungan hari ini",
    category: "primbon",
    execute: async ({ args, reply }) => {
        const name = args.join(" ");
        if (!name) return reply("❌ Usage: .keberuntungan <nama>\nContoh: .keberuntungan Budi");

        const luckScore = Math.floor(Math.random() * 40) + 60; // 60-100%
        const stars = "⭐".repeat(Math.floor(luckScore / 20));

        await reply(`🍀 *Ramalan Keberuntungan: ${name}*\n\n📅 Hari ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n✨ Tingkat Keberuntungan: ${luckScore}%\n${stars}\n\n🎲 Angka Keberuntungan: ${Math.floor(Math.random() * 99) + 1}\n🌈 Warna Keberuntungan: ${['Merah', 'Biru', 'Hijau', 'Kuning', 'Putih'][Math.floor(Math.random() * 5)]}\n🕐 Jam Keberuntungan: ${Math.floor(Math.random() * 12) + 1}:00`);
    }
});

console.log("✅ Primbon (Indonesian) plugin loaded");
