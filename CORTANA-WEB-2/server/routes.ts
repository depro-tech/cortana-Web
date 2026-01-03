import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requestPairingCode, getSessionStatus, disconnectSession, getActiveSessionsCount, restoreAllSessions } from "./whatsapp";


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ═══════════════════════════════════════════════════════════════
  // AUTO-RESTORE: Reconnect saved sessions on server startup
  // ═══════════════════════════════════════════════════════════════
  setTimeout(async () => {
    console.log('[STARTUP] Server ready - initiating session restoration...');
    await restoreAllSessions();
  }, 5000); // Wait 5 seconds for server to fully initialize

  app.post("/api/pairing/request", async (req, res) => {
    try {
      const { phoneNumber, type } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Valid types: 'md' or 'bug'
      const sessionType = (type === 'bug') ? 'bug' : 'md';

      const result = await requestPairingCode(phoneNumber, sessionType);
      res.json(result);
    } catch (error: any) {
      console.error("Pairing request error:", error);
      res.status(500).json({ error: error.message || "Failed to request pairing code" });
    }
  });

  app.get("/api/pairing/status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const status = await getSessionStatus(sessionId);
      res.json({ status });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get status" });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get sessions" });
    }
  });

  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await disconnectSession(sessionId);
      await storage.deleteSession(sessionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete session" });
    }
  });

  app.get("/api/sessions/active/count", async (req, res) => {
    try {
      const count = getActiveSessionsCount();
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get active sessions count" });
    }
  });

  // Telegram Login Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Import the validation function
      const { validateLogin } = await import("./telegram-auth");
      const isValid = await validateLogin(username, password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials or expired login" });
      }

      res.json({ success: true, message: "Login successful" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message || "Login failed" });
    }
  });

  // Exploit Execution Endpoint
  app.post("/api/exploit/execute", async (req, res) => {
    try {
      const { command, target, sessionId } = req.body;

      if (!command || !target) {
        return res.status(400).json({ error: "Command and target required" });
      }

      const { getSessionSocket } = await import("./whatsapp");
      const { executeExploit } = await import("./exploit-engine");

      // Use provided sessionId or default to the most recent one (handled by getSessionSocket if no ID provided, or we can iterate)
      // For simplicity, we assume the frontend might pass a sessionId if known, or we grab "any" active one if focused on single-user mode.
      // If sessionId is missing, getSessionSocket usually needs logic. 
      // Let's modify getSessionSocket usage slightly or assume single-session context for "Cortana Exploit Mode".

      const sock = getSessionSocket(sessionId);

      if (!sock) {
        return res.status(400).json({ error: "No active WhatsApp session found. Please link a device first." });
      }

      const success = await executeExploit(sock, command, target);

      if (success) {
        res.json({ success: true, message: `Executed ${command} on ${target}` });
      } else {
        res.status(500).json({ error: "Exploit execution failed" });
      }

    } catch (error: any) {
      console.error("Exploit error:", error);
      res.status(500).json({ error: error.message || "Exploit execution failed" });
    }
  });


  // Telegram Webhook Handler (Production)
  app.post("/api/telegram/webhook", (req, res) => {
    // Determine if we should process this update via the bot instance
    // We import the bot only when needed to avoid circular dependency issues if any,
    // though here we can likely import at top level or use the one we have.
    // Ideally, we import 'telegramBot' from './telegram-bot'.
    // Since 'telegramBot' is exported, we can import it at top of file, 
    // but to be safe with initialization order:
    import("./telegram-bot").then(({ telegramBot }) => {
      telegramBot.processUpdate(req.body);
    });
    res.sendStatus(200);
  });

  // M-Pesa STK Push Callback Handler
  app.post("/api/mpesa/callback", async (req, res) => {
    try {
      console.log("[MPESA CALLBACK] Received:", JSON.stringify(req.body, null, 2));

      const { Body } = req.body;

      if (Body && Body.stkCallback) {
        const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

        if (ResultCode === 0) {
          // Payment successful
          const metadata = CallbackMetadata?.Item || [];
          const amount = metadata.find((item: any) => item.Name === "Amount")?.Value;
          const phone = metadata.find((item: any) => item.Name === "PhoneNumber")?.Value;
          const mpesaRef = metadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value;

          console.log(`[MPESA] ✅ Payment Success: ${amount} from ${phone}, Ref: ${mpesaRef}`);

          // TODO: Update database, notify user via WhatsApp
          // const { getSessionSocket } = await import("./whatsapp");
          // const sock = getSessionSocket();
          // if (sock) {
          //   await sock.sendMessage(`${phone}@s.whatsapp.net`, {
          //     text: `✅ Payment of KES ${amount} received! Ref: ${mpesaRef}`
          //   });
          // }
        } else {
          // Payment failed
          console.log(`[MPESA] ❌ Payment Failed: ${ResultDesc}`);
        }
      }

      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error: any) {
      console.error("[MPESA CALLBACK] Error:", error);
      res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
    }
  });

  return httpServer;
}
