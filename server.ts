import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Proxy for Google News RSS feed for agriculture
app.get('/api/live-agri-rss', async (_req: Request, res: Response) => {
  try {
    const rssRes = await fetch(
      'https://news.google.com/rss/search?q=Andhra+Pradesh+agriculture+farming&hl=en-IN&gl=IN&ceid=IN:en'
    );
    const xml = await rssRes.text();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error fetching live agriculture RSS feed:', error);
    res.status(500).send('Error fetching RSS feed');
  }
});

// Health checks for Cloud Run container lifecycle
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Serve static assets from dist directory
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback all other routes to index.html (SPA routing)
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application build files not found. Please build the application first.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server listening on http://0.0.0.0:${PORT}`);
});
