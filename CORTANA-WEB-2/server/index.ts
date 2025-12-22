import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import "./telegram-bot"; // Initialize Telegram bot
import { cleanupExpiredCredentials } from "./telegram-auth";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    res.on("finish", () => {
      const duration = Date.now() - start;
      // Log ALL requests to debug static file serving
      // if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
      // }
    });
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      // Run credential cleanup every hour
      setInterval(async () => {
        await cleanupExpiredCredentials();
      }, 60 * 60 * 1000); // 1 hour

      // Run cleanup on startup
      cleanupExpiredCredentials();

      // RENDER KEEP-ALIVE: Prevent sleep by pinging self every 4 minutes (Render sleeps after 15m)
      // Using 4 minutes to be safe combined with WhatsApp activity.
      const pingUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
      console.log(`[KEEP-ALIVE] Setup anti-sleep ping for: ${pingUrl}`);
      setInterval(() => {
        fetch(pingUrl + '/api/health')
          .then(r => r.ok ? console.log('[KEEP-ALIVE] Anti-sleep ping success') : console.error('[KEEP-ALIVE] Anti-sleep ping received:', r.status))
          .catch(e => console.error('[KEEP-ALIVE] Anti-sleep ping failed:', e.message));
      }, 4 * 60 * 1000); // 4 minutes
    },
  );

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    log('SIGTERM received, closing server...');
    httpServer.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, closing server...');
    httpServer.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });

  process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`);
    httpServer.close(() => {
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled rejection at ${promise}, reason: ${reason}`);
  });
})();
