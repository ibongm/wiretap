import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

function apiDevPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const endpoint = parsedUrl.pathname.replace(/^\/api\//, '').split('/')[0].split('?')[0];
          const handlerPath = path.resolve(__dirname, `api/${endpoint}.ts`);

          const query: Record<string, string> = {};
          parsedUrl.searchParams.forEach((val, key) => {
            query[key] = val;
          });

          let body: any = null;
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks).toString('utf-8');
            try {
              body = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              body = rawBody;
            }
          }

          const vercelReq = Object.assign(req, { query, body });
          const vercelRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return vercelRes;
            },
            json(data: any) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(data));
              return vercelRes;
            },
            send(data: any) {
              if (typeof data === 'object') {
                return vercelRes.json(data);
              }
              res.end(data);
              return vercelRes;
            }
          });

          const module = await server.ssrLoadModule(handlerPath);
          const handler = module.default;
          if (typeof handler === 'function') {
            await handler(vercelReq, vercelRes);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: `Handler not found for /api/${endpoint}` }));
          }
        } catch (err: any) {
          console.error(`[API Dev Error on ${req.url}]:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: err.message || 'Internal Server Error' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    apiDevPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'wiretap-icon.png', 'wiretap-logo.png', 'wiretap-logo-192x192.png', 'wiretap-logo-512x512.png'],
      manifest: {
        name: 'Wiretap — Editorial Intelligence Engine',
        short_name: 'Wiretap',
        description: 'High-density personal news aggregator and editorial reading engine',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        icons: [
          {
            src: '/wiretap-logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/wiretap-logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/wiretap-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
