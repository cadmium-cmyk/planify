import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * CalDAV Proxy route to bypass browser CORS restrictions
 */
app.post('/api/caldav-proxy', async (req: Request, res: Response) => {
  const { url, method = 'PROPFIND', headers = {}, body = '' } = req.body;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Target URL is required' });
    return;
  }

  try {
    const formattedMethod = method.toUpperCase();
    const fetchOptions: RequestInit = {
      method: formattedMethod,
      headers: {
        ...headers,
      },
    };

    if (body && !['GET', 'HEAD'].includes(formattedMethod)) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();

    res.status(response.status);
    
    // Copy safe response headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    }

    res.send(responseText);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: 'Proxy Error',
      details: errorMessage,
    });
  }
});

/**
 * Dedicated CalDAV connection test route
 */
app.post('/api/caldav-test', async (req: Request, res: Response) => {
  const { serverUrl, username, password } = req.body;

  if (!serverUrl || !username || !password) {
    res.status(400).json({
      success: false,
      message: 'Please provide Server URL, Username, and Password.',
    });
    return;
  }

  let targetUrl = serverUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }
  targetUrl = targetUrl.replace(/\/+$/, '');

  const credentials = Buffer.from(`${username.trim()}:${password.trim()}`).toString('base64');
  const authHeader = `Basic ${credentials}`;

  const propfindBody = `<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:resourcetype/>
    <D:displayname/>
  </D:prop>
</D:propfind>`;

  try {
    // 1. Try PROPFIND
    const response = await fetch(targetUrl, {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/xml; charset=utf-8',
        Depth: '1',
      },
      body: propfindBody,
    });

    if (response.status === 207 || response.ok) {
      res.json({
        success: true,
        message: 'Successfully connected to CalDAV server!',
      });
      return;
    }

    if (response.status === 401) {
      res.json({
        success: false,
        message: 'Authentication failed (401 Unauthorized). Check username & password.',
      });
      return;
    }

    if (response.status === 404) {
      res.json({
        success: false,
        message: 'CalDAV server URL not found (404). Check the server address or principal URL path.',
      });
      return;
    }

    // 2. Fallback GET probe
    const getRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (getRes.ok || getRes.status === 207) {
      res.json({
        success: true,
        message: 'Connected to CalDAV endpoint successfully via GET fallback!',
      });
      return;
    }

    res.json({
      success: false,
      message: `CalDAV server responded with HTTP status ${response.status}`,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.json({
      success: false,
      message: `Failed to connect to ${targetUrl}: ${errorMessage}`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planify server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
