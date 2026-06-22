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

    // ── GET GAMES ──
    if (request.method === 'POST' && url.pathname.includes('games')) {
      let seed;
      try {
        const body = await request.json();
        seed = body.seed;
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      // Fetch a large pool of well-known games from IGDB
      // Rating > 75, at least 200 ratings, cover required, sorted by rating
      const igdbBody = `
        fields name, first_release_date, cover.image_id, platforms.abbreviation, rating, rating_count;
        where rating > 75
          & rating_count > 200
          & cover != null
          & first_release_date != null
          & category = 0;
        sort rating_count desc;
        limit 200;
      `;

      const res = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'text/plain',
        },
        body: igdbBody,
      });

      if (!res.ok) {
        return new Response('IGDB error', { status: 502, headers: CORS });
      }

      const games = await res.json();

      // Map to clean format
      const mapped = games.map((g, i) => ({
        id: g.id,
        t: g.name,
        y: new Date(g.first_release_date * 1000).getFullYear(),
        p: g.platforms?.map(p => p.abbreviation).filter(Boolean).slice(0, 2).join('/') || 'PC',
        img: g.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
          : null,
      }));

      // Seeded shuffle so same seed = same daily puzzle
      const shuffled = seededShuffle(mapped, seed);

      return new Response(JSON.stringify(shuffled), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // ── GET COVERS (kept for fallback) ──
    if (request.method === 'POST' && url.pathname.includes('covers')) {
      let games = [];
      try {
        const body = await request.json();
        games = body.games || [];
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      if (!games.length) {
        return new Response(JSON.stringify({}), {
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }

      const results = {};
      await Promise.all(games.map(async (game) => {
        try {
          const safeName = game.name.replace(/"/g, '\\"');
          const body = `
            fields name, first_release_date, cover.image_id;
            search "${safeName}";
            limit 10;
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

          let best = null;
          let bestScore = Infinity;

          for (const m of matches) {
            if (!m.cover?.image_id) continue;
            const normalize = s => s.toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s]/g, '')
              .trim();
            const nameDiff = Math.abs(normalize(game.name).length - normalize(m.name || '').length);
            const releaseYear = m.first_release_date
              ? new Date(m.first_release_date * 1000).getFullYear()
              : null;
            const yearDiff = releaseYear ? Math.abs(releaseYear - game.year) : 10;
            const score = yearDiff * 10 + nameDiff;
            if (score < bestScore) { bestScore = score; best = m; }
          }

          if (best?.cover?.image_id) {
            results[String(game.id)] = best.cover.image_id;
          }
        } catch (e) {}
      }));

      return new Response(JSON.stringify(results), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};

// Seeded shuffle (Fisher-Yates)
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}