/**
 * Pixeline — IGDB Cover Proxy (Cloudflare Worker)
 *
 * Deploy steps:
 *   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this entire file into the editor
 *   3. Click "Save and deploy"
 *   4. Copy the worker URL (e.g. https://pixeline-igdb.YOUR-NAME.workers.dev)
 *   5. Paste that URL into pixeline.html as the value of WORKER_URL
 *
 * The worker accepts POST /covers with JSON body { ids: [igdbGameId, ...] }
 * and returns { igdbGameId: "image_id", ... }
 */

const CLIENT_ID = 'jvtj8vvmpcqrclojx3kcphhdqj8kns';
const TOKEN     = '9jbw6392kbuuicavkgqq7embkxd8ia';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/covers') {
      let ids = [];
      try {
        const body = await request.json();
        ids = body.ids || [];
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      if (!ids.length) {
        return new Response(JSON.stringify({}), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }

      // Query IGDB covers endpoint
      const igdbBody = `fields game, image_id; where game = (${ids.join(',')}); limit 200;`;
      const igdbRes = await fetch('https://api.igdb.com/v4/covers', {
        method: 'POST',
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'text/plain',
        },
        body: igdbBody,
      });

      if (!igdbRes.ok) {
        const err = await igdbRes.text();
        return new Response(`IGDB error: ${err}`, { status: 502, headers: CORS });
      }

      const covers = await igdbRes.json();

      // Build map: gameId -> image_id
      const map = {};
      for (const cover of covers) {
        if (cover.game && cover.image_id) {
          map[cover.game] = cover.image_id;
        }
      }

      return new Response(JSON.stringify(map), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};
