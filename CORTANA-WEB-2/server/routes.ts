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

  return httpServer;
}
