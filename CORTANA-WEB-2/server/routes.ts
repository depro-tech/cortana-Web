import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requestPairingCode, getSessionStatus, disconnectSession, getActiveSessionsCount } from "./whatsapp";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/pairing/request", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const result = await requestPairingCode(phoneNumber);
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

  return httpServer;
}
