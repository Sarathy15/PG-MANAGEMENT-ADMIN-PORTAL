import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./routes/apiRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 1. API routes
app.use("/api/v1", apiRoutes);

// 2. Serve static frontend assets from /frontend directory (vanilla pages)
app.use(express.static(path.join(process.cwd(), "frontend")));

// Helper redirect to default to login page of vanilla frontend
app.get("/", (req, res, next) => {
  res.redirect("/login.html");
});

// 3. Vite development middleware / SPA production build fallback
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use Vite middleware as fallback for other assets/routing
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/spa*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PGMS] Full-Stack server is actively running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
export default app;
