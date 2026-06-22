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
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname.includes('covers')) {
      let games = [];
      try {
        const body = await request.json();
        games = body.games || []; // expects [{ id, name, year }, ...]
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      if (!games.length) {
        return new Response(JSON.stringify({}), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }

      // Search each game by name, then match by year
      const results = {};
      await Promise.all(games.map(async (game) => {
        try {
          const safeName = game.name.replace(/"/g, '\\"');
          const body = `
            fields name, first_release_date, cover.image_id;
            search "${safeName}";
            limit 5;
          `;
          const res = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
              'Client-ID': CLIENT_ID,
              'Authorization': `Bearer ${TOKEN}`,
              'Content-Type': 'text/plain',
            },
            body,
          });

          if (!res.ok) return;
          const matches = await res.json();

          // Pick the best match: prefer exact year match, fallback to closest
          let best = null;
          let bestDiff = Infinity;
          for (const m of matches) {
            if (!m.cover?.image_id) continue;
            const releaseYear = m.first_release_date
              ? new Date(m.first_release_date * 1000).getFullYear()
              : null;
            const diff = releaseYear ? Math.abs(releaseYear - game.year) : 5;
            if (diff < bestDiff) {
              bestDiff = diff;
              best = m;
            }
          }

          if (best?.cover?.image_id) {
            results[game.id] = best.cover.image_id;
          }
        } catch (e) {
          // skip failed individual lookups
        }
      }));

      return new Response(JSON.stringify(results), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};