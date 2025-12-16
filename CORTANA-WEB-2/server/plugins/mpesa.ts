import { registerCommand } from "./types";
import axios from "axios";

// Placeholder for MPESA credentials - usually these should be in ENV
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "YOUR_CONSUMER_KEY";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "YOUR_CONSUMER_SECRET";
const PASSKEY = process.env.MPESA_PASSKEY || "YOUR_PASSKEY";
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379"; // Test Shortcode

async function getAccessToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    try {
        const response = await axios.get(
            "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            {
                headers: { Authorization: `Basic ${auth}` },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("MPESA Token Error:", error);
        return null;
    }
}

registerCommand({
    name: "mpesa",
    description: "Trigger an MPESA STK Push (Test)",
    category: "utility",
    execute: async ({ reply, args, senderJid }) => {
        if (args.length < 2) {
            return reply("❌ Usage: .mpesa <phone> <amount>\nExample: .mpesa 254712345678 1");
        }

        const phone = args[0];
        const amount = args[1];

        await reply(`💸 Initiating STK Push of KES ${amount} to ${phone}...`);

        const token = await getAccessToken();
        if (!token) return reply("❌ Failed to authenticate with MPESA.");

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString("base64");

        try {
            const res = await axios.post(
                "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                {
                    BusinessShortCode: SHORTCODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phone,
                    PartyB: SHORTCODE,
                    PhoneNumber: phone,
                    CallBackURL: "https://cortana-web.onrender.com/api/mpesa/callback", // Update this
                    AccountReference: "CortanaBot",
                    TransactionDesc: "Bot Payment",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            await reply(`✅ STK Push sent! Response: ${res.data.ResponseDescription}`);
        } catch (err: any) {
            console.error(err);
            await reply("❌ STK Push failed. Check server logs.");
        }
    }
});
