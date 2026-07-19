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

// Rank 'Em: total games per daily puzzle. 2 are pre-placed as anchors
// (client-side, see rank.js) and the player ranks the remaining 4.
const RANK_GAME_COUNT = 6;

// ── RANK 'EM: EMERGENCY FALLBACK POOL ──
// Rank 'Em's normal path draws today's 5 games straight from the same
// live IGDB pool the Timeline game uses (see fetchIgdbPool below), and
// gets their scores live from Metacritic — no separate hand-curated list
// needed for day-to-day play. This small pool (real Metacritic scores,
// one game per distinct average-score bucket, pulled 2026-07-18) exists
// purely as a break-glass fallback for the rare case where IGDB and/or
// Metacritic can't produce 5 valid, non-tied picks that day, so the
// puzzle always loads instead of failing outright.
const EMERGENCY_POOL = [
  {id:1,t:'The Legend of Zelda: Ocarina of Time',y:1998,m:99,u:9.1},
  {id:2,t:'SoulCalibur',y:1999,m:98,u:7.6},
  {id:3,t:'Super Mario Galaxy 2',y:2010,m:98,u:9.0},
  {id:4,t:'Grand Theft Auto IV',y:2008,m:98,u:8.4},
  {id:5,t:'Super Mario Galaxy',y:2007,m:97,u:9.0},
  {id:6,t:'The Legend of Zelda: Breath of the Wild',y:2017,m:97,u:8.9},
  {id:7,t:'Tony Hawk\'s Pro Skater 3',y:2001,m:97,u:7.6},
  {id:8,t:'Perfect Dark',y:2000,m:97,u:8.3},
  {id:9,t:'Grand Theft Auto III',y:2001,m:97,u:7.9},
  {id:10,t:'Halo: Combat Evolved',y:2001,m:97,u:8.6},
  {id:11,t:'GoldenEye 007',y:1997,m:96,u:8.8},
  {id:12,t:'Uncharted 2: Among Thieves',y:2009,m:96,u:8.9},
  {id:13,t:'Gran Turismo',y:1998,m:96,u:8.5},
  {id:14,t:'Gran Turismo 3: A-Spec',y:2001,m:95,u:8.3},
  {id:15,t:'The Elder Scrolls IV: Oblivion',y:2006,m:94,u:8.5},
  {id:16,t:'God of War Ragnarök',y:2022,m:94,u:8.3},
  {id:17,t:'The Last of Us Part II',y:2020,m:93,u:5.9},
  {id:18,t:'Grand Theft Auto: Chinatown Wars',y:2009,m:93,u:7.4},
  {id:19,t:'Street Fighter IV',y:2009,m:93,u:7.6},
  {id:20,t:'Fallout 3',y:2008,m:93,u:8.2},
  {id:21,t:'Mass Effect 3',y:2012,m:93,u:6.4},
  {id:22,t:'World of Warcraft',y:2004,m:93,u:7.5},
  {id:23,t:'Blue Prince',y:2025,m:92,u:7.8},
  {id:24,t:'The Sims',y:2000,m:92,u:8.0},
  {id:25,t:'Tekken 8',y:2024,m:90,u:7.5},
  {id:26,t:'Neon White',y:2022,m:89,u:8.2},
  {id:27,t:'Animal Crossing: New Horizons',y:2020,m:90,u:5.9},
  {id:28,t:'Diablo IV',y:2023,m:86,u:2.7},
  {id:29,t:'Cyberpunk 2077',y:2020,m:86,u:7.3},
  {id:30,t:'Destiny 2',y:2017,m:85,u:5.2}
];

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // NOTE: route matching below uses exact pathname equality (not
    // .includes()) on purpose — '/rank-games' contains the substring
    // 'games', so a loose .includes('games') check would (and, in every
    // version shipped before this fix, silently did) swallow every
    // /rank-games request into the /games handler below, since /games was
    // checked first. Rank 'Em's dedicated endpoint was never actually
    // reachable until this fix. Exact-match avoids this whole class of bug.

    // ── GET GAMES ──
    if (request.method === 'POST' && url.pathname === '/games') {
      let seed;
      try {
        const body = await request.json();
        seed = body.seed;
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      let mapped;
      try {
        mapped = await fetchIgdbPool(200);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'IGDB error', detail: String(e && e.message || e) }), {
          status: 502, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }

      // Seeded shuffle so same seed = same daily puzzle
      const shuffled = seededShuffle(mapped, seed);

      return new Response(JSON.stringify(shuffled), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // ── RANK 'EM: GET DAILY GAMES (RANK_GAME_COUNT total) ──
    // Primary path: draw candidates straight from the same live IGDB pool
    // the Timeline game uses, seeded-shuffle them, and try each in order
    // against live Metacritic scores until RANK_GAME_COUNT land in distinct
    // average-score buckets (no ties — otherwise the puzzle has no single
    // correct order). No separate hand-curated title list needed day-to-day.
    //
    // The whole response is cached at the edge once found (Cache API,
    // ~25h TTL) so only the first visitor for a given day's seed pays for
    // the live lookups — everyone else that day is served from cache.
    //
    // Fallback path: if IGDB and/or Metacritic can't produce RANK_GAME_COUNT
    // valid, non-tied picks within a bounded number of tries (an outage,
    // mostly), fall back to the small offline EMERGENCY_POOL so the puzzle
    // still loads instead of failing outright.
    if (request.method === 'POST' && url.pathname === '/rank-games') {
      let seed;
      try {
        const body = await request.json();
        seed = body.seed;
      } catch {
        return new Response('Bad request', { status: 400, headers: CORS });
      }

      const cache = caches.default;
      const cacheKey = new Request(`https://pixelnology-rank-cache.internal/rank-games/${seed}`);
      const cachedHit = await cache.match(cacheKey);
      if (cachedHit) {
        return new Response(cachedHit.body, { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }

      const MAX_ATTEMPTS = 20;
      const BATCH_SIZE = 5;
      const picks = [];
      const usedBuckets = new Set();

      try {
        const pool = await fetchIgdbPool(300);
        const candidates = seededShuffle(pool, seed);

        for (let start = 0; start < Math.min(MAX_ATTEMPTS, candidates.length) && picks.length < RANK_GAME_COUNT; start += BATCH_SIZE) {
          const batch = candidates.slice(start, start + BATCH_SIZE);
          const results = await Promise.all(batch.map(async c => ({
            candidate: c,
            score: await fetchLiveMetacriticScore(c.t, c.y, 1),
          })));
          for (const { candidate, score } of results) {
            if (picks.length >= RANK_GAME_COUNT || !score) continue;
            // m is a whole number and u has at most 1 decimal, so m + u*10
            // is always an exact integer — safe to use as a dedupe key.
            const bucketKey = score.m + Math.round(score.u * 10);
            if (usedBuckets.has(bucketKey)) continue;
            usedBuckets.add(bucketKey);
            const avg = Math.round((score.m / 10 + score.u) / 2 * 100) / 100;
            picks.push({ id: candidate.id, t: candidate.t, y: candidate.y, p: candidate.p, img: candidate.img, m: score.m, u: score.u, avg, live: true });
          }
        }
      } catch (e) { /* IGDB pool fetch failed — fall through to emergency pool */ }

      const finalPicks = picks.length >= RANK_GAME_COUNT ? picks.slice(0, RANK_GAME_COUNT) : await selectFromEmergencyPool(seed);

      const response = new Response(JSON.stringify(finalPicks), {
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=90000' }
      });
      try { await cache.put(cacheKey, response.clone()); } catch (e) { /* caching is best-effort */ }
      return response;
    }

    // ── GET COVERS (kept for fallback) ──
    if (request.method === 'POST' && url.pathname === '/covers') {
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

// Pick only the platforms a game actually launched on, instead of every
// platform IGDB has ever tagged the entry with (which can include much
// later ports/re-releases, or bad crowd-sourced data like a AAA game
// mistakenly tagged with "Ouya").
//
// IGDB's `platforms` field lists every platform ever associated with a
// game record with no timing info attached, so a single mis-tag stays
// forever. `release_dates` has a date per platform, so we keep only the
// platforms that released within ~6 months of the game's earliest
// release — wide enough to cover staggered console/PC launches, narrow
// enough to exclude remasters, ports, and stray bad tags.
const RELEASE_WINDOW_SECONDS = 60 * 60 * 24 * 180; // 180 days

function getReleasePlatforms(g) {
  const baseline = g.first_release_date;
  const dates = Array.isArray(g.release_dates) ? g.release_dates : [];

  const seen = new Set();
  const platforms = [];
  for (const rd of dates) {
    const abbr = rd.platform?.abbreviation;
    if (!abbr || rd.date == null) continue;
    if (Math.abs(rd.date - baseline) > RELEASE_WINDOW_SECONDS) continue;
    if (!seen.has(abbr)) { seen.add(abbr); platforms.push(abbr); }
  }

  // Fall back to the raw platforms list if release_dates didn't give us
  // anything usable (missing/empty on some entries).
  if (!platforms.length && Array.isArray(g.platforms)) {
    for (const p of g.platforms) {
      if (p.abbreviation && !seen.has(p.abbreviation)) {
        seen.add(p.abbreviation);
        platforms.push(p.abbreviation);
      }
    }
  }

  return platforms.join('/') || 'PC';
}

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

// Fetch today's live Metacritic Metascore + User Score for a single game
// by title/year, used by the Rank 'Em endpoint to check IGDB pool
// candidates (and, historically, to refresh a baked-in score — see git
// history if that path is ever needed again). Metacritic has no
// title-search API that also returns scores, so this pages through the
// finder endpoint filtered to the game's release year (sorted by
// -metaScore) and matches by normalized title.
//
// maxPages bounds how many 50-result pages to try (Cloudflare Workers cap
// subrequests per invocation, and Rank 'Em may check many candidates in
// one request) — default 1 keeps candidate-hunting cheap; pass more only
// when you specifically need to dig past the first 50 results for a
// known title.
// Returns { m, u } on success or null if no confident match was found.
const METACRITIC_API_KEY = '1MOZgmNFxvmljaQR1X9KAij9Mo4xAY3u';
async function fetchLiveMetacriticScore(title, year, maxPages = 1) {
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const searchName = title.replace(/\s*\(\d{4}(?:\s+Remake)?\)\s*$/i, '');
  const target = normalize(searchName);

  for (let page = 0; page < maxPages; page++) {
    const offset = page * 50;
    const url = `https://backend.metacritic.com/finder/metacritic/web?sortBy=-metaScore&productType=games&page=1&releaseYearMin=${year}&releaseYearMax=${year}&offset=${offset}&limit=50&apiKey=${METACRITIC_API_KEY}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      const items = data?.data?.items || [];
      if (!items.length) return null;

      const match = items.find(it => normalize(it.title || '') === target);
      if (match) {
        const m = match.criticScoreSummary?.score;
        const u = match.userScore?.score;
        if (typeof m === 'number' && typeof u === 'number') return { m, u };
        return null; // matched title but missing one of the two scores
      }
      if (items.length < 50) return null; // last page, no match found
    } catch (e) {
      return null; // network error / timeout
    }
  }
  return null; // exhausted page budget without a match
}

// Fetch the same "well-known games" pool the Timeline game uses: rating
// > 75, at least 200 ratings, cover required, category = 0 (main games,
// no DLC/bundles/ports), sorted by rating_count desc. Shared by both the
// Timeline endpoint and Rank 'Em's candidate hunt so there's one source
// of truth for "what counts as a well-known game" instead of two.
async function fetchIgdbPool(limit) {
  // NOTE: "category = 0" (main_game) alone matches nothing — IGDB appears
  // to treat category 0 as its unset/default value and doesn't index it
  // as an explicit, queryable value (confirmed 2026-07-18: a bare
  // `category = 0` filter returns zero results even for games that are
  // unambiguously main games, and those same games omit `category` from
  // the response entirely even when explicitly requested in `fields`).
  // Matching `category = null` alongside `category = 0` catches these
  // "unset" main-game records too.
  const igdbBody = `
    fields name, first_release_date, cover.image_id, platforms.abbreviation,
      release_dates.date, release_dates.platform.abbreviation, rating, rating_count;
    where rating > 75
      & rating_count > 200
      & cover != null
      & first_release_date != null
      & (category = 0 | category = null);
    sort rating_count desc;
    limit ${limit};
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
    const bodyText = await res.text().catch(() => '');
    throw new Error(`IGDB error: ${res.status} ${bodyText.slice(0, 300)}`);
  }

  const games = await res.json();
  return games.map((g) => ({
    id: g.id,
    t: g.name,
    y: new Date(g.first_release_date * 1000).getFullYear(),
    p: getReleasePlatforms(g),
    img: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : null,
  }));
}

// Break-glass fallback for Rank 'Em: build a day's puzzle entirely from
// the small offline EMERGENCY_POOL (real but potentially stale Metacritic
// scores) when IGDB and/or Metacritic can't produce RANK_GAME_COUNT live,
// non-tied picks. No live Metacritic calls here — if we've reached this path,
// Metacritic has already been unreliable this request, so there's no
// point trying it again. Cover art is still fetched live from IGDB by
// name search (best-effort — falls back to no cover on failure).
async function selectFromEmergencyPool(seed) {
  const buckets = {};
  for (const g of EMERGENCY_POOL) {
    const key = g.m + Math.round(g.u * 10);
    (buckets[key] = buckets[key] || []).push(g);
  }
  const bucketKeys = seededShuffle(Object.keys(buckets), seed);

  let rngState = (seed >>> 0) ^ 0x9e3779b9; // distinct stream from the bucket shuffle above
  const rand = () => {
    rngState = (Math.imul(1664525, rngState) + 1013904223) >>> 0;
    return rngState / 4294967296;
  };
  const picks = seededShuffle(
    bucketKeys.slice(0, RANK_GAME_COUNT).map(key => {
      const options = buckets[key];
      return options[Math.floor(rand() * options.length)];
    }),
    seed
  );

  return Promise.all(picks.map(async (g) => {
    let img = null;
    let platforms = 'PC';
    try {
      const searchName = g.t.replace(/\s*\(\d{4}(?:\s+Remake)?\)\s*$/i, '');
      const igdbBody = `
        fields name, first_release_date, cover.image_id, platforms.abbreviation;
        search "${searchName.replace(/"/g, '\\"')}";
        limit 10;
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
      if (res.ok) {
        const matches = await res.json();
        let best = null, bestScore = Infinity;
        const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
        for (const m of matches) {
          const nameDiff = Math.abs(normalize(searchName).length - normalize(m.name || '').length);
          const releaseYear = m.first_release_date ? new Date(m.first_release_date * 1000).getFullYear() : null;
          const yearDiff = releaseYear ? Math.abs(releaseYear - g.y) : 10;
          const score = yearDiff * 10 + nameDiff;
          if (score < bestScore) { bestScore = score; best = m; }
        }
        if (best) {
          if (best.cover?.image_id) img = `https://images.igdb.com/igdb/image/upload/t_cover_big/${best.cover.image_id}.jpg`;
          if (Array.isArray(best.platforms) && best.platforms.length) {
            platforms = best.platforms.map(p => p.abbreviation).filter(Boolean).join('/') || 'PC';
          }
        }
      }
    } catch (e) { /* best-effort enrichment — fall back to no cover */ }

    const avg = Math.round((g.m / 10 + g.u) / 2 * 100) / 100;
    return { id: g.id, t: g.t, y: g.y, p: platforms, img, m: g.m, u: g.u, avg, live: false };
  }));
}
