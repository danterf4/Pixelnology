// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
const WORKER_URL = 'https://autumn-wave-6693.max-andres-rf.workers.dev';
const DAILY_COUNT = 15;

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let allGames = [];
let sections = []; // [{anchor, timeline:[{game,locked,correct}], complete:false}, ...]
let poolGames = []; // all non-anchor games
let checksUsed = 0;
let gameWon = false;
let gameLost = false;
const coverCache = {};

const SECTION_SIZE = 5; // games per section (1 anchor + 4 to place)
const NUM_SECTIONS = 3;
const MAX_CHECKS = 3;
const SECTION_LABELS = ['Early Era', 'Mid Era', 'Modern Era'];

function getDailySeed() {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) * 7 + 13;
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
async function init() {
  const d = new Date();
  document.getElementById('date-pill').textContent =
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('puzzle-pill').textContent = `Puzzle #${getDailySeed() % 1000}`;

  document.getElementById('how-toggle').addEventListener('click', toggleHow);
  document.getElementById('check-btn').addEventListener('click', checkTimeline);
  document.getElementById('clear-btn').addEventListener('click', clearAll);

  document.getElementById('pool-grid').innerHTML =
    `<div style="color:var(--text-muted);font-size:13px;padding:8px;">Loading today's games…</div>`;

  try {
    const res = await fetch(`${WORKER_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: getDailySeed() })
    });
    const shuffled = await res.json();
    allGames = shuffled.slice(0, DAILY_COUNT).sort((a, b) => a.y - b.y);
    allGames.forEach(g => { if (g.img) coverCache[g.id] = g.img; });
  } catch (err) {
    console.error('Failed to load games:', err);
    document.getElementById('pool-grid').innerHTML =
      `<div style="color:var(--red);font-size:13px;padding:8px;">Failed to load games. Please refresh.</div>`;
    return;
  }

  // Split into 3 sections of 5, anchor at middle of each section
  sections = [];
  for (let s = 0; s < NUM_SECTIONS; s++) {
    const sectionGames = allGames.slice(s * SECTION_SIZE, (s + 1) * SECTION_SIZE);
    const anchorIdx = Math.floor(sectionGames.length / 2);
    const anchor = sectionGames[anchorIdx];
    sections.push({
      anchor,
      timeline: [{ game: anchor, locked: true }],
      complete: false,
      label: SECTION_LABELS[s]
    });
  }

  // All non-anchor games go into the pool — shuffled with seeded RNG
  const anchorIds = new Set(sections.map(s => s.anchor.id));
  poolGames = allGames.filter(g => !anchorIds.has(g.id));

  // Seeded Fisher-Yates shuffle
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
  if (!sections.length) return;
  renderPool();
  renderTimeline();
  renderStats();
  updateCheckBtn();
}

function updateCardCovers(gameId) {
  const poolEl = document.querySelector(`.pool-card[data-id="${gameId}"] .pc-cover`);
  if (poolEl) injectCover(poolEl, gameId, 'pool');
  const tlEl = document.querySelector(`.tl-thumb[data-id="${gameId}"]`);
  if (tlEl) injectCover(tlEl, gameId, 'tl');
}

function injectCover(el, gameId, type) {
  const url = coverCache[gameId];
  if (!url || url === 'loading' || url === 'none') return;
  el.innerHTML = `<img src="${url}" alt="" draggable="false" onerror="this.parentNode.innerHTML='<span class=\\'${type === 'pool' ? 'pc-cover-icon' : 'tl-thumb-icon'}\\'>?</span>'" />`;
}

function renderPool() {
  const grid = document.getElementById('pool-grid');
  grid.innerHTML = '';
  const placedIds = new Set();
  sections.forEach(sec => sec.timeline.forEach(t => placedIds.add(t.game.id)));

  poolGames.forEach(g => {
    const placed = placedIds.has(g.id);
    const div = document.createElement('div');
    div.className = 'pool-card' + (placed ? ' placed' : '');
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

    const check = document.createElement('div');
    check.className = 'pc-check';
    check.textContent = '✓';

    div.appendChild(check);
    div.appendChild(coverDiv);
    div.appendChild(body);

    if (!placed) {
      div.draggable = true;
      div.addEventListener('dragstart', e => onDragStart(e, g, 'pool', null, null));
      div.addEventListener('dragend', onDragEnd);
      div.addEventListener('touchstart', e => onTouchStart(e, g, 'pool', null, null), { passive: false });
    }

    // Click opens info popup (only if not a drag)
    div.addEventListener('click', e => {
      if (!div.classList.contains('dragging')) openGamePopup(g);
    });

    grid.appendChild(div);
  });
}

function renderTimeline() {
  const container = document.getElementById('tl-items');
  container.innerHTML = '';

  sections.forEach((sec, sIdx) => {
    const header = document.createElement('div');
    header.className = 'tl-section-header' + (sec.complete ? ' complete' : '');
    const placed = sec.timeline.filter(t => !t.locked).length;
    const total = SECTION_SIZE - 1;
    const checked = sec.wrongCount !== undefined;
    let rightHtml;
    if (sec.complete) {
      rightHtml = '<span class="tl-section-badge">✓ Complete</span>';
    } else if (checked && sec.wrongCount === 0 && placed < total) {
      rightHtml = `<span class="tl-section-status incomplete">${placed}/${total} placed</span>`;
    } else if (checked && placed === total && sec.wrongCount > 0) {
      rightHtml = `<span class="tl-section-status wrong">${sec.wrongCount} wrong</span>`;
    } else if (checked && placed === total && sec.wrongCount === 0) {
      rightHtml = `<span class="tl-section-status perfect">All correct!</span>`;
    } else {
      rightHtml = `<span class="tl-section-progress">${placed}/${total} placed</span>`;
    }
    header.innerHTML = `
      <span class="tl-section-label">${sec.label}</span>
      ${rightHtml}
    `;
    container.appendChild(header);

    const secWrap = document.createElement('div');
    secWrap.className = 'tl-section-wrap' + (sec.complete ? ' complete' : '');
    secWrap.dataset.section = sIdx;

    if (!sec.complete) {
      secWrap.appendChild(makeGap(sIdx, 0));
    }
    sec.timeline.forEach((entry, i) => {
      secWrap.appendChild(makeItemRow(entry, sIdx, i));
      if (!sec.complete) secWrap.appendChild(makeGap(sIdx, i + 1));
    });

    container.appendChild(secWrap);
  });
}

function makeGap(sIdx, insertIdx) {
  const div = document.createElement('div');
  div.className = 'tl-gap';
  const line = document.createElement('div');
  line.className = 'tl-gap-line';
  div.appendChild(line);
  const zone = document.createElement('div');
  zone.className = 'tl-drop-zone';
  zone.dataset.sectionIdx = sIdx;
  zone.dataset.insertIdx = insertIdx;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); dropAt(sIdx, insertIdx); });
  div.appendChild(zone);
  return div;
}

function makeItemRow(entry, sIdx, idx) {
  const row = document.createElement('div');
  row.className = 'tl-item';

  const yearCol = document.createElement('div');
  yearCol.className = 'tl-year-col';
  if (entry.locked && entry.correct !== false) {
    yearCol.textContent = entry.game.y;
    yearCol.style.color = 'var(--amber)';
  } else if (sections[sIdx].complete || sections[sIdx].revealed || gameWon) {
    yearCol.textContent = entry.game.y;
    yearCol.style.color = entry.correct === false ? 'var(--red)' : 'var(--text-muted)';
  }
  row.appendChild(yearCol);

  const dot = document.createElement('div');
  dot.className = 'tl-dot' +
    (entry.locked ? ' anchor' : '') +
    ((sections[sIdx].complete || sections[sIdx].revealed || gameWon) && entry.correct === true ? ' correct' : '') +
    ((sections[sIdx].complete || sections[sIdx].revealed || gameWon) && entry.correct === false ? ' wrong' : '');
  row.appendChild(dot);

  const card = document.createElement('div');
  const sec = sections[sIdx];
  const isRevealed = sec.complete || sec.revealed || gameWon;
  card.className = 'tl-card' +
    (entry.locked ? ' anchor-card' : '') +
    (!entry.locked && !sec.complete && !sec.revealed && !gameWon ? ' removable' : '') +
    (isRevealed && entry.correct === true ? ' correct' : '') +
    (isRevealed && entry.correct === false ? ' wrong' : '');

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
  titleWrap.innerHTML = `<div class="tl-card-title">${entry.game.t}</div>`;
  left.appendChild(titleWrap);

  const right = document.createElement('div');
  right.className = 'tl-card-right';

  if (entry.locked) {
    const yr = document.createElement('div');
    yr.className = 'tl-card-year amber';
    yr.textContent = entry.game.y + ' ★';
    right.appendChild(yr);
  } else if (isRevealed) {
    const yr = document.createElement('div');
    yr.className = 'tl-card-year ' + (entry.correct ? 'green' : 'red');
    yr.textContent = entry.game.y;
    right.appendChild(yr);
    const icon = document.createElement('span');
    icon.className = 'tl-status-icon';
    icon.textContent = entry.correct ? '✓' : '✗';
    icon.style.color = entry.correct ? 'var(--green)' : 'var(--red)';
    right.appendChild(icon);
  } else {
    const rmBtn = document.createElement('button');
    rmBtn.className = 'remove-btn';
    rmBtn.textContent = '×';
    rmBtn.title = 'Remove from timeline';
    rmBtn.addEventListener('click', (e) => { e.stopPropagation(); removeGame(sIdx, idx); });
    right.appendChild(rmBtn);
  }

  card.appendChild(left);
  card.appendChild(right);
  row.appendChild(card);

  if (!entry.locked && !sec.complete && !sec.revealed && !gameWon) {
    card.draggable = true;
    card.addEventListener('dragstart', e => onDragStart(e, entry.game, 'timeline', sIdx, idx));
    card.addEventListener('dragend', onDragEnd);
    card.addEventListener('touchstart', e => onTouchStart(e, entry.game, 'timeline', sIdx, idx), { passive: false });
  }

  return row;
}

// ═══════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════
function removeGame(sIdx, idx) {
  const entry = sections[sIdx].timeline[idx];
  if (entry.locked || gameLost) return;
  sections[sIdx].timeline.splice(idx, 1);
  delete sections[sIdx].wrongCount;
  render();
}

function clearAll() {
  if (gameWon || gameLost) return;
  sections.forEach(sec => {
    if (!sec.complete) {
      sec.timeline = [{ game: sec.anchor, locked: true }];
      delete sec.wrongCount;
    }
  });
  render();
}

function dropAt(sIdx, insertIdx) {
  if (!dragState.game || gameWon || gameLost) return;
  const sec = sections[sIdx];
  if (sec.complete) return;
  const g = dragState.game;

  if (dragState.source === 'timeline' && dragState.sectionIdx !== null) {
    const fromSec = sections[dragState.sectionIdx];
    if (!fromSec.complete) {
      fromSec.timeline.splice(dragState.timelineIdx, 1);
    }
  }

  const existingIdx = sec.timeline.findIndex(t => t.game && t.game.id === g.id);
  let adjusted = insertIdx;
  if (existingIdx !== -1) {
    sec.timeline.splice(existingIdx, 1);
    if (existingIdx < insertIdx) adjusted--;
  }

  sec.timeline.splice(adjusted, 0, { game: g, locked: false });
  const entry = sec.timeline.find(t => t.game.id === g.id);
  if (entry) delete entry.correct;
  delete sec.wrongCount;
  dragState = {};
  render();
}

// ═══════════════════════════════════════════════════════
// DRAG — DESKTOP
// ═══════════════════════════════════════════════════════
let dragState = {};

function onDragStart(e, game, source, sectionIdx, timelineIdx) {
  dragState = { game, source, sectionIdx, timelineIdx };
  e.dataTransfer.effectAllowed = 'move';
  const el = e.currentTarget;
  setTimeout(() => el.classList.add('dragging'), 0);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

// ═══════════════════════════════════════════════════════
// DRAG — TOUCH
// ═══════════════════════════════════════════════════════
let touchState = {};

function onTouchStart(e, game, source, sectionIdx, timelineIdx) {
  if (gameWon || gameLost) return;
  e.preventDefault();
  const touch = e.touches[0];
  const el = e.currentTarget;
  dragState = { game, source, sectionIdx, timelineIdx };

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
}

function onTouchEnd(e) {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  const { el, ghost, lastZone, moved } = touchState;

  // Tap (no drag movement) on a pool card → open info popup
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
    const sIdx = parseInt(lastZone.dataset.sectionIdx, 10);
    const idx = parseInt(lastZone.dataset.insertIdx, 10);
    if (!isNaN(sIdx) && !isNaN(idx)) dropAt(sIdx, idx);
  }
  touchState = {};
}

// ═══════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════
function renderStats() {
  const placed = sections.reduce((n, sec) => n + sec.timeline.filter(t => !t.locked).length, 0);
  const remaining = poolGames.length - placed;
  document.getElementById('stat-placed').textContent = placed;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-checks').textContent = checksUsed;
  const pct = (placed / poolGames.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  const dockCount = document.getElementById('dock-count');
  if (dockCount) dockCount.textContent = remaining + ' remaining';
}

function updateCheckBtn() {
  const placed = sections.reduce((n, sec) => n + sec.timeline.filter(t => !t.locked).length, 0);
  const btn = document.getElementById('check-btn');
  const allFilled = sections.every(sec => sec.complete || sec.timeline.filter(t => !t.locked).length === SECTION_SIZE - 1);
  const checksLeft = MAX_CHECKS - checksUsed;
  btn.disabled = !allFilled || gameWon || gameLost;
  if (!gameWon && !gameLost) {
    btn.textContent = checksLeft <= MAX_CHECKS && checksUsed > 0
      ? `Check timeline (${checksLeft} left)`
      : 'Check timeline';
  }
}

// ═══════════════════════════════════════════════════════
// CHECK
// ═══════════════════════════════════════════════════════
function checkTimeline() {
  if (gameWon || gameLost) return;
  checksUsed++;

  let newlyCompleted = 0;
  let totalWrong = 0;

  sections.forEach(sec => {
    if (sec.complete) return;
    let secWrong = 0;
    sec.timeline.forEach((entry, i) => {
      const prevYear = i > 0 ? sec.timeline[i - 1].game.y : -Infinity;
      const nextYear = i < sec.timeline.length - 1 ? sec.timeline[i + 1].game.y : Infinity;
      entry.correct = entry.game.y >= prevYear && entry.game.y <= nextYear;
      if (!entry.locked && !entry.correct) secWrong++;
    });

    if (secWrong === 0 && sec.timeline.length === SECTION_SIZE) {
      sec.complete = true;
      sec.wrongCount = 0;
      sec.timeline.forEach(e => { e.locked = true; });
      newlyCompleted++;
    } else {
      sec.wrongCount = secWrong;
      totalWrong += secWrong;
    }
  });

  const allDone = sections.every(s => s.complete);
  const outOfAttempts = checksUsed >= MAX_CHECKS && !allDone;

  if (allDone) {
    gameWon = true;
    render();
    const dock = document.getElementById('bottom-dock');
    if (dock) dock.style.display = 'none';
    document.body.style.paddingBottom = '0';
    setTimeout(showEndScreen, 600);
    setMsg('', '');
  } else if (outOfAttempts) {
    gameLost = true;
    sections.forEach(sec => {
      if (!sec.complete) {
        sec.timeline.sort((a, b) => a.game.y - b.game.y);
        sec.timeline.forEach((entry, i) => {
          const prevYear = i > 0 ? sec.timeline[i - 1].game.y : -Infinity;
          const nextYear = i < sec.timeline.length - 1 ? sec.timeline[i + 1].game.y : Infinity;
          entry.correct = entry.game.y >= prevYear && entry.game.y <= nextYear;
        });
        sec.revealed = true;
      }
    });
    render();
    const dock = document.getElementById('bottom-dock');
    if (dock) dock.style.display = 'none';
    document.body.style.paddingBottom = '0';
    setMsg(`<strong>No attempts left!</strong> Here's the correct order.`, 'error');
    setTimeout(showEndScreen, 800);
  } else {
    render();
    const checksLeft = MAX_CHECKS - checksUsed;
    if (newlyCompleted > 0 && totalWrong === 0) {
      setMsg(`<strong>${newlyCompleted} section${newlyCompleted > 1 ? 's' : ''} complete!</strong> Keep going — ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left.`, 'success');
    } else if (newlyCompleted > 0) {
      setMsg(`<strong>${newlyCompleted} section${newlyCompleted > 1 ? 's' : ''} locked!</strong> Still ${totalWrong} wrong. ${checksLeft} attempt${checksLeft !== 1 ? 's' : ''} left.`, 'warning');
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

  const completedCount = sections.filter(s => s.complete).length;
  let stars, emoji, msg;

  if (gameLost) {
    stars = completedCount === 0 ? '☆☆☆' : completedCount === 1 ? '★☆☆' : '★★☆';
    emoji = '💀';
    msg = completedCount === 0
      ? 'Better luck next time!'
      : `${completedCount}/3 section${completedCount > 1 ? 's' : ''} completed`;
  } else {
    stars = checksUsed === 1 ? '★★★' : checksUsed === 2 ? '★★☆' : '★☆☆';
    emoji = checksUsed === 1 ? '🏆' : checksUsed <= 2 ? '⭐' : '🕹️';
    msg = checksUsed === 1 ? 'Perfect! First try!' : checksUsed === 2 ? 'Excellent!' : 'Well done!';
  }

  const anchorIds = new Set(sections.map(s => s.anchor.id));
  const breakdown = sections.map((sec) => {
    const displayTimeline = sec.revealed
      ? [...sec.timeline].sort((a, b) => a.game.y - b.game.y)
      : sec.timeline;
    const rows = displayTimeline.map(e => {
      const isAnchor = anchorIds.has(e.game.id);
      const statusColor = isAnchor ? 'var(--amber)' : (sec.complete ? 'var(--green)' : (e.correct ? 'var(--green)' : 'var(--red)'));
      const statusIcon = isAnchor ? '★' : (sec.complete || e.correct ? '✓' : '✗');
      return `<div class="end-row">
        <div class="er-title">${e.game.t}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="er-year" style="color:var(--text-dim)">${e.game.y}</div>
          <div class="er-status"><span style="color:${statusColor}">${statusIcon}</span></div>
        </div>
      </div>`;
    }).join('');
    const headerColor = sec.complete ? 'var(--green)' : (sec.revealed ? 'var(--red)' : 'var(--accent-light)');
    const headerSuffix = sec.complete ? ' ✓' : (sec.revealed ? ' — solution shown' : '');
    return `<div style="margin-bottom:1rem">
      <div style="font-size:11px;font-family:var(--mono);color:${headerColor};text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px">${sec.label}${headerSuffix}</div>
      ${rows}
    </div>`;
  }).join('');

  const subLine = gameLost
    ? `Out of attempts &nbsp;·&nbsp; ${completedCount}/3 sections correct`
    : `${msg} &nbsp;·&nbsp; ${checksUsed} check${checksUsed !== 1 ? 's' : ''} used`;

  document.getElementById('end-screen').innerHTML = `
    <div class="end-card">
      <div class="end-emoji">${emoji}</div>
      <div class="end-score">${stars}</div>
      <div class="end-score-sub">${subLine}</div>
      <div class="end-breakdown">${breakdown}</div>
      <div class="share-row">
        <button class="btn btn-primary" onclick="copyShare()">Share result</button>
        <button class="btn" onclick="window.location.reload()">Play again (new seed)</button>
      </div>
      <div class="copy-confirm" id="copy-confirm"></div>
    </div>`;
}

function copyShare() {
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const completedCount = sections.filter(s => s.complete).length;
  const stars = gameLost
    ? (completedCount === 0 ? '☆☆☆' : completedCount === 1 ? '★☆☆' : '★★☆')
    : (checksUsed === 1 ? '★★★' : checksUsed === 2 ? '★★☆' : '★☆☆');
  const result = gameLost
    ? `Out of attempts — ${completedCount}/3 sections correct`
    : `${checksUsed} check${checksUsed !== 1 ? 's' : ''} used`;
  const text = `Pixelnology — ${dateStr}\n${stars}\n${result}\n\nCan you beat my score?`;
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

  titleEl.textContent = game.t;

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

  // Re-check arrows after pool renders or window resizes
  const observer = new MutationObserver(updateArrows);
  observer.observe(document.getElementById('pool-grid'), { childList: true });
  window.addEventListener('resize', updateArrows);

  updateArrows();
}

document.addEventListener('DOMContentLoaded', initDockArrows);
init().catch(err => {
  console.error('Init failed:', err);
  document.getElementById('pool-grid').innerHTML =
    `<div style="color:var(--red);font-size:13px;padding:8px;">Failed to load games. Please refresh.</div>`;
});
