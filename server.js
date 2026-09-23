// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
app.get("/api/live-agri-rss", async (_req, res) => {
  try {
    const rssRes = await fetch(
      "https://news.google.com/rss/search?q=Andhra+Pradesh+agriculture+farming&hl=en-IN&gl=IN&ceid=IN:en"
    );
    const xml = await rssRes.text();
    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error fetching live agriculture RSS feed:", error);
    res.status(500).send("Error fetching RSS feed");
  }
});
app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
var distPath = path.resolve(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Application build files not found. Please build the application first.");
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Production server listening on http://0.0.0.0:${PORT}`);
});
