// ═══════════════════════════════════════════════════════
// RANK 'EM — daily challenge: order 6 games from highest to
// lowest average(Metacritic Metascore, Metacritic User Score).
// Structurally mirrors script.js's Timeline game (same drag/check/
// lock loop, same evenly-spaced pre-placed anchors), swapping
// "release year, ascending" for "average score, descending" as the
// thing being guessed. 2 anchors are pre-placed as reference points,
// leaving 4 games for the player to rank.
// ═══════════════════════════════════════════════════════
const WORKER_URL = 'https://autumn-wave-6693.max-andres-rf.workers.dev';
const DAILY_COUNT = 6; // 2 pre-placed anchors + 4 unplaced pool games
const ANCHOR_COUNT = 2;
const MAX_CHECKS = 3;
const LAUNCH_DATE = '2026-07-18';

// ═══════════════════════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════════════════════
function getTodayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function getActiveDateStr() {
  const params = new URLSearchParams(window.location.search);
  const d = params.get('date');
  if (d && d >= LAUNCH_DATE && d <= getTodayStr()) return d;
  return getTodayStr();
}

function getDailySeed(dateStr) {
  const s = dateStr || getActiveDateStr();
  const [y, m, day] = s.split('-').map(Number);
  // Different multiplier from the Timeline game's seed so the two daily
  // puzzles don't happen to draw the exact same "random" ordering.
  return (y * 10000 + m * 100 + day) * 11 + 29;
}

function getPuzzleNumber(dateStr) {
  const s = dateStr || getActiveDateStr();
  const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number);
  const [y, m, day] = s.split('-').map(Number);
  const launchUTC = Date.UTC(ly, lm - 1, ld);
  const activeUTC = Date.UTC(y, m - 1, day);
  const daysSinceLaunch = Math.round((activeUTC - launchUTC) / 86400000);
  return daysSinceLaunch + 1;
}

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let allGames = [];
let timeline = []; // flat, ordered: [{game, anchor, locked, correct, userCorrect}, ...] — index 0 = highest score
let poolGames = [];
let checksUsed = 0;
let gameWon = false;
let gameLost = false;
let timelineRevealed = false;
const coverCache = {};

// ═══════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════
function getSaveKey() {
  return 'pixelnology_rank_state_' + getActiveDateStr();
}

const RESULTS_KEY = 'pixelnology_rank_results';

function saveResult() {
  try {
    const correctCount = timeline.filter(e => !e.anchor && e.correct).length;
    const total = poolGames.length;
    const stars = gameLost
      ? '☆☆☆'
      : (checksUsed === 1 ? '★★★' : checksUsed === 2 ? '★★☆' : '★☆☆');
    const results = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
    results[getActiveDateStr()] = { stars, checksUsed, gameLost, correctCount, total };
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error('[Pixelnology Rank] saveResult FAILED:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(getSaveKey(), JSON.stringify({
      date: getActiveDateStr(),
      allGames,
      timeline,
      checksUsed,
      gameWon,
      gameLost,
      timelineRevealed,
      coverCache
    }));
  } catch (e) { /* storage full or unavailable */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(getSaveKey());
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (s.date !== getActiveDateStr()) return false;
    if (!s.timeline) return false;
    allGames         = s.allGames;
    timeline         = s.timeline;
    checksUsed       = s.checksUsed;
    gameWon          = s.gameWon;
    gameLost         = s.gameLost;
    timelineRevealed = !!s.timelineRevealed;
    Object.assign(coverCache, s.coverCache || {});
    const anchorIds = new Set(timeline.filter(e => e.anchor).map(e => e.game.id));
    poolGames = allGames.filter(g => !anchorIds.has(g.id));
    return true;
  } catch (e) { return false; }
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
async function init() {
  const activeDate = getActiveDateStr();
  const isPast = activeDate !== getTodayStr();
  const [ay, am, ad] = activeDate.split('-').map(Number);
  const d = new Date(ay, am - 1, ad);
  document.getElementById('date-pill').textContent =
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('puzzle-pill').textContent = `Rank #${getPuzzleNumber()}`;

  const banner = document.getElementById('past-puzzle-bar');
  if (banner && isPast) {
    const updateBanner = () => {
      banner.innerHTML = `You're playing a past puzzle &nbsp;·&nbsp; <a href="rank.html">Today's puzzle →</a>`;
    };
    updateBanner();
    banner.style.display = 'flex';
  }

  document.getElementById('how-toggle').addEventListener('click', toggleHow);
  document.querySelectorAll('#check-btn, #check-btn-mobile').forEach(btn => btn.addEventListener('click', checkTimeline));
  document.querySelectorAll('#clear-btn, #clear-btn-mobile').forEach(btn => btn.addEventListener('click', clearAll));

  if (loadState()) {
    render();
    if (gameWon || gameLost) {
      saveResult();
      const dock = document.getElementById('bottom-dock');
      if (dock) dock.style.display = 'none';
      document.body.style.paddingBottom = '0';
      showEndScreen();
    }
    return;
  }

  document.getElementById('pool-grid').innerHTML =
    `<div style="color:var(--text-muted);font-size:13px;padding:8px;">Loading today's games…</div>`;

  try {
    const res = await fetch(`${WORKER_URL}/rank-games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: getDailySeed() })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Worker responded ${res.status}: ${errBody.slice(0, 300)}`);
    }
    allGames = await res.json();
    if (!Array.isArray(allGames) || allGames.length < DAILY_COUNT) {
      throw new Error(`Worker returned ${Array.isArray(allGames) ? allGames.length : typeof allGames} games, expected ${DAILY_COUNT}`);
    }
    allGames.forEach(g => { if (g.img) coverCache[g.id] = g.img; });
  } catch (err) {
    console.error('Failed to load games:', err);
    document.getElementById('pool-grid').innerHTML =
      `<div style="color:var(--red);font-size:13px;padding:8px;">Failed to load games. Please refresh.</div>`;
    return;
  }

  // Pick ANCHOR_COUNT evenly-spaced anchors (middle game of each chunk,
  // by rank order) and pre-place them, already locked, directly into the
  // ranking — same "evenly-spaced reference points" pattern as the
  // Timeline game, just chunked by average score (descending) instead of
  // release year (ascending).
  allGames = allGames.slice(0, DAILY_COUNT).sort((a, b) => b.avg - a.avg);

  timeline = [];
  for (let s = 0; s < ANCHOR_COUNT; s++) {
    // Evenly split allGames into ANCHOR_COUNT chunks (sizes as equal as DAILY_COUNT allows)
    // and take the middle game of each — works for any DAILY_COUNT, not just multiples of ANCHOR_COUNT.
    const chunkStart = Math.floor(s * DAILY_COUNT / ANCHOR_COUNT);
    const chunkEnd = Math.floor((s + 1) * DAILY_COUNT / ANCHOR_COUNT);
    const chunk = allGames.slice(chunkStart, chunkEnd);
    const anchor = chunk[Math.floor(chunk.length / 2)];
    timeline.push({ game: anchor, anchor: true, locked: true });
  }
  // allGames is sorted by avg descending, so anchors taken chunk-by-chunk are already in order.

  // All non-anchor games go into the pool — shuffled with seeded RNG
  const anchorIds = new Set(timeline.map(e => e.game.id));
  poolGames = allGames.filter(g => !anchorIds.has(g.id));

  // Seeded shuffle so the pool's on-screen order is stable per day but
  // doesn't hint at the ranking (the worker already shuffles display
  // order too, but reshuffling client-side keeps behavior identical to
  // the Timeline game in case that ever changes).
  let rngState = getDailySeed();
  function seededRand() {
    rngState ^= rngState << 13; rngState ^= rngState >> 17; rngState ^= rngState << 5;
    return Math.abs(rngState) / 0x7fffffff;
  }
  for (let i = poolGames.length - 1; i > 0; i--) {
    const j = Math.floor(seededRand() * (i + 1));
    [poolGames[i], poolGames[j]] = [poolGames[j], poolGames[i]];
  }

  render();
}

function toggleHow() {
  document.getElementById('how-overlay').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('how-close').addEventListener('click', () => {
    document.getElementById('how-overlay').classList.remove('open');
  });
  document.getElementById('how-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('open');
    }
  });
});

// ═══════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════
function render() {
  if (!allGames.length) return;
  renderPool();
  renderTimeline();
  renderStats();
  updateCheckBtn();
  saveState();
}

function injectCover(el, gameId, type) {
  const url = coverCache[gameId];
  if (!url || url === 'loading' || url === 'none') return;
  el.innerHTML = `<img src="${url}" alt="" draggable="false" onerror="this.parentNode.innerHTML='<span class=\\'${type === 'pool' ? 'pc-cover-icon' : 'tl-thumb-icon'}\\'>?</span>'" />`;
}

function renderPool() {
  const grid = document.getElementById('pool-grid');
  grid.innerHTML = '';
  const placedIds = new Set(timeline.map(t => t.game.id));

  poolGames.forEach(g => {
    if (placedIds.has(g.id)) return;

    const div = document.createElement('div');
    div.className = 'pool-card';
    div.dataset.id = g.id;
    div.title = g.t;

    const coverDiv = document.createElement('div');
    coverDiv.className = 'pc-cover';
    const url = coverCache[g.id];
    if (url && url !== 'loading' && url !== 'none') {
      coverDiv.innerHTML = `<img src="${url}" alt="" draggable="false" onerror="this.parentNode.innerHTML='<span class=\\'pc-cover-icon\\'>?</span>'" />`;
    } else {
      coverDiv.innerHTML = `<span class="pc-cover-icon">?</span>`;
    }

    const body = document.createElement('div');
    body.className = 'pc-body';
    body.innerHTML = `<div class="pc-title">${g.t}</div>`;

    div.appendChild(coverDiv);
    div.appendChild(body);

    div.draggable = true;
    div.addEventListener('dragstart', e => onDragStart(e, g, 'pool', null));
    div.addEventListener('dragend', onDragEnd);
    div.addEventListener('touchstart', e => onTouchStart(e, g, 'pool', null), { passive: false });

    div.addEventListener('click', e => {
      if (!div.classList.contains('dragging')) openGamePopup(g);
    });

    grid.appendChild(div);
  });
}

function renderTimeline() {
  const container = document.getElementById('tl-items');
  container.innerHTML = '';

  const interactive = !gameWon && !gameLost;

  if (interactive) container.appendChild(makeGap(0));
  timeline.forEach((entry, i) => {
    container.appendChild(makeItemRow(entry, i));
    if (interactive) container.appendChild(makeGap(i + 1));
  });
}

function makeGap(insertIdx) {
  const div = document.createElement('div');
  div.className = 'tl-gap';
  const line = document.createElement('div');
  line.className = 'tl-gap-line';
  div.appendChild(line);
  const zone = document.createElement('div');
  zone.className = 'tl-drop-zone';
  zone.dataset.insertIdx = insertIdx;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); dropAt(insertIdx); });
  div.appendChild(zone);
  return div;
}

function makeItemRow(entry, idx) {
  const row = document.createElement('div');
  row.className = 'tl-item';

  const isOver = gameWon || gameLost;
  const hasFeedback = entry.correct !== undefined;

  // Rank position badge (#1 = best) — structural, always visible; it's the
  // slot, not the secret. The secret is which game the player put there.
  const yearCol = document.createElement('div');
  yearCol.className = 'tl-year-col';
  yearCol.textContent = '#' + (idx + 1);
  yearCol.style.color = 'var(--amber)';
  row.appendChild(yearCol);

  const dot = document.createElement('div');
  dot.className = 'tl-dot' +
    (entry.anchor ? ' anchor' : '') +
    ((isOver || entry.locked) && entry.correct === true ? ' correct' : '') +
    (hasFeedback && entry.correct === false ? ' wrong' : '');
  row.appendChild(dot);

  const card = document.createElement('div');
  card.className = 'tl-card' +
    (entry.anchor ? ' anchor-card' : '') +
    (!entry.locked && !isOver ? ' removable' : '') +
    ((isOver || entry.locked) && entry.correct === true ? ' correct' : '') +
    (hasFeedback && entry.correct === false ? ' wrong' : '');

  const left = document.createElement('div');
  left.className = 'tl-card-left';
  left.style.cssText = 'display:flex;align-items:center;gap:0;min-width:0;flex:1;';

  const thumb = document.createElement('div');
  thumb.className = 'tl-thumb';
  thumb.dataset.id = entry.game.id;
  const url = coverCache[entry.game.id];
  if (url && url !== 'loading' && url !== 'none') {
    thumb.innerHTML = `<img src="${url}" alt="" draggable="false" onerror="this.innerHTML='<span class=\\'tl-thumb-icon\\'>?</span>'" />`;
  } else {
    thumb.innerHTML = `<span class="tl-thumb-icon">?</span>`;
  }
  left.appendChild(thumb);

  const titleWrap = document.createElement('div');
  titleWrap.style.cssText = 'min-width:0;flex:1;';
  titleWrap.innerHTML = `<div class="tl-card-title">${entry.game.t}</div>` +
    `<div class="tl-card-platform">${entry.game.y}${entry.game.p ? ' · ' + entry.game.p : ''}</div>`;
  left.appendChild(titleWrap);

  const right = document.createElement('div');
  right.className = 'tl-card-right';

  if (entry.anchor) {
    const yr = document.createElement('div');
    yr.className = 'tl-card-year amber';
    yr.textContent = entry.game.avg.toFixed(2) + ' ★';
    right.appendChild(yr);
  } else if (isOver) {
    const yr = document.createElement('div');
    yr.className = 'tl-card-year ' + (entry.correct ? 'green' : 'red');
    yr.textContent = entry.game.avg.toFixed(2);
    right.appendChild(yr);
    const icon = document.createElement('span');
    icon.className = 'tl-status-icon';
    icon.textContent = entry.correct ? '✓' : '✗';
    icon.style.color = entry.correct ? 'var(--green)' : 'var(--red)';
    right.appendChild(icon);
  } else if (entry.locked) {
    const yr = document.createElement('div');
    yr.className = 'tl-card-year green';
    yr.textContent = entry.game.avg.toFixed(2);
    right.appendChild(yr);
    const icon = document.createElement('span');
    icon.className = 'tl-status-icon';
    icon.textContent = '✓';
    icon.style.color = 'var(--green)';
    right.appendChild(icon);
  } else if (hasFeedback) {
    const icon = document.createElement('span');
    icon.className = 'tl-status-icon';
    icon.textContent = '✗';
    icon.style.color = 'var(--red)';
    right.appendChild(icon);
    const rmBtn = document.createElement('button');
    rmBtn.className = 'remove-btn';
    rmBtn.textContent = '×';
    rmBtn.title = 'Remove from ranking';
    rmBtn.addEventListener('click', (e) => { e.stopPropagation(); removeGame(idx); });
    right.appendChild(rmBtn);
  } else {
    const rmBtn = document.createElement('button');
    rmBtn.className = 'remove-btn';
    rmBtn.textContent = '×';
    rmBtn.title = 'Remove from ranking';
    rmBtn.addEventListener('click', (e) => { e.stopPropagation(); removeGame(idx); });
    right.appendChild(rmBtn);
  }

  card.appendChild(left);
  card.appendChild(right);
  row.appendChild(card);

  if (!entry.locked && !isOver) {
    card.draggable = true;
    card.addEventListener('dragstart', e => onDragStart(e, entry.game, 'timeline', idx));
    card.addEventListener('dragend', onDragEnd);
    card.addEventListener('touchstart', e => onTouchStart(e, entry.game, 'timeline', idx), { passive: false });
  }

  return row;
}

// ═══════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════
function removeGame(idx) {
  const entry = timeline[idx];
  if (!entry || entry.locked || gameWon || gameLost) return;
  timeline.splice(idx, 1);
  render();
}

function clearAll() {
  if (gameWon || gameLost) return;
  timeline = timeline.filter(e => e.locked);
  render();
}

function dropAt(insertIdx) {
  if (!dragState.game || gameWon || gameLost) return;
  const g = dragState.game;

  if (dragState.source === 'timeline' && dragState.timelineIdx != null) {
    timeline.splice(dragState.timelineIdx, 1);
    if (dragState.timelineIdx < insertIdx) insertIdx--;
  }

  const dupIdx = timeline.findIndex(t => t.game && t.game.id === g.id);
  if (dupIdx !== -1) {
    timeline.splice(dupIdx, 1);
    if (dupIdx < insertIdx) insertIdx--;
  }

  timeline.splice(insertIdx, 0, { game: g, locked: false });
  dragState = {};
  render();
}

// ═══════════════════════════════════════════════════════
// DRAG — DESKTOP
// ═══════════════════════════════════════════════════════
let dragState = {};

function onDragStart(e, game, source, timelineIdx) {
  dragState = { game, source, timelineIdx };
  e.dataTransfer.effectAllowed = 'move';
  const el = e.currentTarget;
  setTimeout(() => el.classList.add('dragging'), 0);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

function initPoolDropZone() {
  const dock = document.getElementById('bottom-dock');
  dock.addEventListener('dragover', e => {
    if (dragState.source === 'timeline') e.preventDefault();
  });
  dock.addEventListener('drop', e => {
    e.preventDefault();
    returnGameToPool();
  });
}

function returnGameToPool() {
  if (dragState.source !== 'timeline' || dragState.timelineIdx == null) return;
  const entry = timeline[dragState.timelineIdx];
  if (entry && !entry.locked) {
    timeline.splice(dragState.timelineIdx, 1);
    dragState = {};
    render();
  }
}

// ═══════════════════════════════════════════════════════
// DRAG — TOUCH
// ═══════════════════════════════════════════════════════
let touchState = {};

function onTouchStart(e, game, source, timelineIdx) {
  if (gameWon || gameLost) return;
  e.preventDefault();
  const touch = e.touches[0];
  const el = e.currentTarget;
  dragState = { game, source, timelineIdx };

  const rect = el.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.id = 'touch-ghost';
  ghost.style.cssText = `
    position: fixed; z-index: 9999; pointer-events: none; opacity: 0.85;
    width: ${rect.width}px; left: ${rect.left}px; top: ${rect.top}px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5); transition: none;
  `;
  document.body.appendChild(ghost);
  el.classList.add('dragging');
  touchState = { el, ghost, offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top, lastZone: null, startX: touch.clientX, startY: touch.clientY, moved: false };

  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const { ghost, offsetX, offsetY, lastZone, startX, startY } = touchState;
  if (Math.abs(touch.clientX - startX) > 8 || Math.abs(touch.clientY - startY) > 8) touchState.moved = true;
  ghost.style.left = (touch.clientX - offsetX) + 'px';
  ghost.style.top = (touch.clientY - offsetY) + 'px';
  ghost.style.display = 'none';
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  ghost.style.display = '';
  const zone = target && target.closest('.tl-drop-zone');
  if (zone !== lastZone) {
    if (lastZone) lastZone.classList.remove('drag-over');
    if (zone) zone.classList.add('drag-over');
    touchState.lastZone = zone;
  }
  touchState.lastX = touch.clientX;
  touchState.lastY = touch.clientY;
  handleEdgeScroll(touch.clientY);
}

function onTouchEnd(e) {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  clearEdgeScroll();
  const { el, ghost, lastZone, moved } = touchState;

  if (!moved && dragState.source === 'pool') {
    const tappedGame = dragState.game;
    if (ghost) ghost.remove();
    if (el) el.classList.remove('dragging');
    dragState = {};
    touchState = {};
    openGamePopup(tappedGame);
    return;
  }
  if (ghost) ghost.remove();
  if (el) el.classList.remove('dragging');
  if (lastZone) {
    lastZone.classList.remove('drag-over');
    const idx = parseInt(lastZone.dataset.insertIdx, 10);
    if (!isNaN(idx)) dropAt(idx);
  } else {
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.closest('#bottom-dock')) returnGameToPool();
  }
  touchState = {};
}

// ═══════════════════════════════════════════════════════
// AUTO-SCROLL NEAR SCREEN EDGES WHILE DRAGGING
// ═══════════════════════════════════════════════════════
const EDGE_ZONE = 70;
const EDGE_HOLD_MS = 1000;
const EDGE_SCROLL_SPEED = 14;
const EDGE_SCROLL_SPEED_TOUCH = 56;

let edgeDir = null;
let edgeHoldTimer = null;
let edgeScrollRAF = null;

function handleEdgeScroll(clientY) {
  const vh = window.innerHeight;
  let dir = null;
  if (clientY < EDGE_ZONE) dir = 'up';
  else if (clientY > vh - EDGE_ZONE) dir = 'down';

  if (dir === edgeDir) return;
  clearEdgeScroll();
  edgeDir = dir;
  if (dir) {
    edgeHoldTimer = setTimeout(() => {
      edgeScrollRAF = requestAnimationFrame(runEdgeScroll);
    }, EDGE_HOLD_MS);
  }
}

function runEdgeScroll() {
  if (!edgeDir) return;
  const isTouchDrag = !!touchState.ghost;
  const speed = isTouchDrag ? EDGE_SCROLL_SPEED_TOUCH : EDGE_SCROLL_SPEED;
  window.scrollBy(0, edgeDir === 'up' ? -speed : speed);
  if (isTouchDrag) refreshTouchZoneDuringAutoScroll();
  edgeScrollRAF = requestAnimationFrame(runEdgeScroll);
}

function clearEdgeScroll() {
  if (edgeHoldTimer) { clearTimeout(edgeHoldTimer); edgeHoldTimer = null; }
  if (edgeScrollRAF) { cancelAnimationFrame(edgeScrollRAF); edgeScrollRAF = null; }
  edgeDir = null;
}

function refreshTouchZoneDuringAutoScroll() {
  const { ghost, lastX, lastY, lastZone } = touchState;
  if (!ghost || lastX == null || lastY == null) return;
  ghost.style.display = 'none';
  const target = document.elementFromPoint(lastX, lastY);
  ghost.style.display = '';
  const zone = target && target.closest('.tl-drop-zone');
  if (zone !== lastZone) {
    if (lastZone) lastZone.classList.remove('drag-over');
    if (zone) zone.classList.add('drag-over');
    touchState.lastZone = zone;
  }
}

document.addEventListener('dragover', e => {
  if (dragState.game) handleEdgeScroll(e.clientY);
});
document.addEventListener('dragend', clearEdgeScroll);
document.addEventListener('drop', clearEdgeScroll);

// ═══════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════
function renderStats() {
  const placed = timeline.filter(e => !e.anchor).length;
  const remaining = poolGames.length - placed;
  document.getElementById('stat-placed').textContent = placed;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-checks').textContent = MAX_CHECKS - checksUsed;
  const pct = (placed / poolGames.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  const dockCount = document.getElementById('dock-count');
  if (dockCount) dockCount.textContent = remaining + ' remaining';
}

function updateCheckBtn() {
  const placed = timeline.filter(e => !e.anchor).length;
  const btns = document.querySelectorAll('#check-btn, #check-btn-mobile');
  const allFilled = placed === poolGames.length;
  const checksLeft = MAX_CHECKS - checksUsed;
  const label = checksLeft <= MAX_CHECKS && checksUsed > 0
    ? `Check ranking (${checksLeft} left)`
    : 'Check ranking';
  btns.forEach(btn => {
    btn.disabled = !allFilled || gameWon || gameLost;
    if (!gameWon && !gameLost) {
      btn.textContent = label;
    }
  });
}

// ═══════════════════════════════════════════════════════
// CHECK
// ═══════════════════════════════════════════════════════
function checkTimeline() {
  if (gameWon || gameLost) return;
  checksUsed++;

  let newlyLocked = 0;
  let totalWrong = 0;

  timeline.forEach((entry, i) => {
    if (entry.locked) return;
    // Descending order: item above must have a >= average, item below a <=
    // average. Boundary slots (top/bottom of the list) always satisfy their
    // missing side, same "neighbor consistency" trick the Timeline game uses.
    const prevAvg = i > 0 ? timeline[i - 1].game.avg : Infinity;
    const nextAvg = i < timeline.length - 1 ? timeline[i + 1].game.avg : -Infinity;
    entry.correct = entry.game.avg <= prevAvg && entry.game.avg >= nextAvg;
    if (entry.correct) {
      entry.locked = true;
      newlyLocked++;
    } else {
      totalWrong++;
    }
  });

  const allCorrect = timeline.length === DAILY_COUNT && timeline.every(e => e.locked);
  const outOfAttempts = checksUsed >= MAX_CHECKS && !allCorrect;

  if (allCorrect) {
    gameWon = true;
    saveState();
    saveResult();
    render();
    const dock = document.getElementById('bottom-dock');
    if (dock) dock.style.display = 'none';
    document.body.style.paddingBottom = '0';
    setTimeout(showEndScreen, 600);
    setMsg('', '');
  } else if (outOfAttempts) {
    gameLost = true;
    timeline.forEach(entry => { entry.userCorrect = entry.locked ? true : entry.correct; });
    timeline.sort((a, b) => b.game.avg - a.game.avg); // reveal true order: highest avg first
    timeline.forEach(entry => { entry.correct = entry.userCorrect; });
    timelineRevealed = true;
    saveState();
    saveResult();
    render();
    const dock = document.getElementById('bottom-dock');
    if (dock) dock.style.display = 'none';
    document.body.style.paddingBottom = '0';
    setMsg(`<strong>No attempts left!</strong> Here's the correct ranking.`, 'error');
    setTimeout(showEndScreen, 800);
  } else {
    render();
    const checksLeft = MAX_CHECKS - checksUsed;
    if (newlyLocked > 0 && totalWrong === 0) {
      setMsg(`<strong>All ranked games are correct!</strong> Rank the rest — ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left.`, 'success');
    } else if (newlyLocked > 0) {
      setMsg(`<strong>${newlyLocked} game${newlyLocked > 1 ? 's' : ''} locked in!</strong> Still ${totalWrong} wrong. ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left.`, 'warning');
    } else {
      setMsg(totalWrong === 1
        ? `<strong>1 game</strong> is in the wrong spot. ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left!`
        : `<strong>${totalWrong} games</strong> are in the wrong spots. ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left!`,
        checksLeft === 1 ? 'error' : 'warning');
    }
  }
}

// ═══════════════════════════════════════════════════════
// END SCREEN
// ═══════════════════════════════════════════════════════
function showEndScreen() {
  document.getElementById('end-screen').style.display = 'block';
  document.getElementById('end-screen').scrollIntoView({ behavior: 'smooth' });

  const correctCount = timeline.filter(e => !e.anchor && e.correct).length;
  const total = poolGames.length;
  let stars, msg;

  if (gameLost) {
    stars = '☆☆☆';
    msg = correctCount === 0
      ? 'Better luck next time!'
      : `${correctCount}/${total} games ranked correctly`;
  } else {
    stars = checksUsed === 1 ? '★★★' : checksUsed === 2 ? '★★☆' : '★☆☆';
    msg = checksUsed === 1 ? 'Perfect! First try!' : checksUsed === 2 ? 'Excellent!' : 'Well done!';
  }

  const displayTimeline = timelineRevealed
    ? [...timeline].sort((a, b) => b.game.avg - a.game.avg)
    : timeline;
  const breakdown = displayTimeline.map((e, i) => {
    const statusColor = e.anchor ? 'var(--amber)' : (e.correct ? 'var(--green)' : 'var(--red)');
    const statusIcon = e.anchor ? '★' : (e.correct ? '✓' : '✗');
    return `<div class="end-row">
      <div class="er-title">#${i + 1} ${e.game.t}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="er-year" style="color:var(--text-dim)" title="Metascore ${e.game.m} · User ${e.game.u}">${e.game.avg.toFixed(2)}</div>
        <div class="er-status"><span style="color:${statusColor}">${statusIcon}</span></div>
      </div>
    </div>`;
  }).join('');

  const subLine = gameLost
    ? `Out of attempts &nbsp;·&nbsp; ${correctCount}/${total} games correct`
    : `${msg} &nbsp;·&nbsp; ${checksUsed} check${checksUsed !== 1 ? 's' : ''} used`;

  document.getElementById('end-screen').innerHTML = `
    <div class="end-card">
      <div class="end-score">${stars}</div>
      <div class="end-score-sub">${subLine}</div>
      <div class="end-breakdown">${breakdown}</div>
      <div class="share-row">
        <button class="btn btn-primary" onclick="copyShare()">Share result</button>
      </div>
      <div class="copy-confirm" id="copy-confirm"></div>
    </div>`;
}

function copyShare() {
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const correctCount = timeline.filter(e => !e.anchor && e.correct).length;
  const total = poolGames.length;
  const stars = gameLost
    ? '☆☆☆'
    : (checksUsed === 1 ? '★★★' : checksUsed === 2 ? '★★☆' : '★☆☆');
  const result = gameLost
    ? `Out of attempts — ${correctCount}/${total} games correct`
    : `${checksUsed} check${checksUsed !== 1 ? 's' : ''} used`;
  const text = `Gameology Rank 'Em — ${dateStr}\n${stars}\n${result}\n\nCan you beat my score?`;
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById('copy-confirm');
    if (el) { el.textContent = 'Copied to clipboard!'; setTimeout(() => { el.textContent = ''; }, 2500); }
  });
}

window.copyShare = copyShare;

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
let msgTimer = null;
function setMsg(html, type) {
  const el = document.getElementById('msg-box');
  if (msgTimer) { clearTimeout(msgTimer); msgTimer = null; }
  if (!html) { el.className = 'msg-box'; return; }
  el.className = 'msg-box show ' + (type || 'info');
  el.innerHTML = html;
  msgTimer = setTimeout(() => {
    el.className = 'msg-box';
    msgTimer = null;
  }, 4000);
}

// ═══════════════════════════════════════════════════════
// GAME INFO POPUP
// ═══════════════════════════════════════════════════════
function openGamePopup(game) {
  const overlay = document.getElementById('game-popup-overlay');
  const coverEl = document.getElementById('game-popup-cover');
  const titleEl = document.getElementById('game-popup-title');
  const platformEl = document.getElementById('game-popup-platform');

  titleEl.textContent = game.t;
  if (platformEl) platformEl.textContent = [game.y, game.p].filter(Boolean).join(' · ');

  const url = coverCache[game.id];
  if (url && url !== 'loading' && url !== 'none') {
    coverEl.innerHTML = `<img src="${url}" alt="${game.t}" onerror="this.parentNode.innerHTML='?'">`;
  } else {
    coverEl.innerHTML = '?';
  }

  overlay.classList.add('open');
}

function closeGamePopup() {
  document.getElementById('game-popup-overlay').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('game-popup-close').addEventListener('click', closeGamePopup);
  document.getElementById('game-popup-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeGamePopup();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGamePopup();
  });
});

// ═══════════════════════════════════════════════════════
// DOCK SCROLL ARROWS
// ═══════════════════════════════════════════════════════
function initDockArrows() {
  const scroll = document.getElementById('dock-scroll');
  const left = document.getElementById('dock-arrow-left');
  const right = document.getElementById('dock-arrow-right');
  if (!scroll || !left || !right) return;

  const STEP = 200;
  const isDesktop = () => window.innerWidth > 560;

  function updateArrows() {
    if (isDesktop()) {
      left.classList.toggle('hidden', scroll.scrollTop <= 4);
      right.classList.toggle('hidden', scroll.scrollTop >= scroll.scrollHeight - scroll.clientHeight - 4);

    } else {
      const leftIcon = left.querySelector('span');
      if (leftIcon) leftIcon.textContent = 'keyboard_arrow_left';

      const rightIcon = right.querySelector('span');
      if (rightIcon) rightIcon.textContent = 'keyboard_arrow_right';

      left.classList.toggle('hidden', scroll.scrollLeft <= 4);
      right.classList.toggle('hidden', scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth - 4);
    }
  }

  left.addEventListener('click', () => {
    if (isDesktop()) scroll.scrollBy({ top: -STEP, behavior: 'smooth' });
    else scroll.scrollBy({ left: -STEP, behavior: 'smooth' });
  });
  right.addEventListener('click', () => {
    if (isDesktop()) scroll.scrollBy({ top: STEP, behavior: 'smooth' });
    else scroll.scrollBy({ left: STEP, behavior: 'smooth' });
  });
  scroll.addEventListener('scroll', updateArrows, { passive: true });

  const observer = new MutationObserver(updateArrows);
  observer.observe(document.getElementById('pool-grid'), { childList: true });
  window.addEventListener('resize', updateArrows);

  updateArrows();
}

document.addEventListener('DOMContentLoaded', initDockArrows);
document.addEventListener('DOMContentLoaded', initPoolDropZone);
init().catch(err => {
  console.error('Init failed:', err);
  document.getElementById('pool-grid').innerHTML =
    `<div style="color:var(--red);font-size:13px;padding:8px;">Failed to load games. Please refresh.</div>`;
});
