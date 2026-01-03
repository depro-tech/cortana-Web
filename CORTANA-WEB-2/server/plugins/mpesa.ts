import { registerCommand } from "./types";
import axios from "axios";

// Placeholder for MPESA credentials - usually these should be in ENV
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "YOUR_CONSUMER_KEY";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "YOUR_CONSUMER_SECRET";
const PASSKEY = process.env.MPESA_PASSKEY || "YOUR_PASSKEY";
const SHORTCODE = process.env.MPESA_SHORTCODE || "625625"; // Your Paybill
const ACCOUNT_NUMBER = "20177486"; // Your Account Number

async function getAccessToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    try {
        const response = await axios.get(
            "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
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
        // Check if MPESA credentials are configured
        if (CONSUMER_KEY === "YOUR_CONSUMER_KEY" || CONSUMER_SECRET === "YOUR_CONSUMER_SECRET" || PASSKEY === "YOUR_PASSKEY") {
            return reply("⚠️ *Ohh! Hold on...*\n\nThis feature is currently disabled for improvements by owner *Edu*.\n\nIf you want to pay/purchase anything, send your query to:\n📞 *+254113374182*");
        }

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
                "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                {
                    BusinessShortCode: SHORTCODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phone,
                    PartyB: SHORTCODE,
                    PhoneNumber: phone,
                    CallBackURL: "https://cortana-web.onrender.com/api/mpesa/callback",
                    AccountReference: ACCOUNT_NUMBER,
                    TransactionDesc: "BrianTech Payment",
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
