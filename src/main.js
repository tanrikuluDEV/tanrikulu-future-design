const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
const vp = document.getElementById('viewport'), world = document.getElementById('world');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TR = document.documentElement.lang === 'tr';
const tx = (en, tr) => (TR ? tr : en); // copy for the English page / the Turkish page (tr/index.html)
const frames = [...document.querySelectorAll('.frame')];
const box = (el) => { // position in board coordinates (walks up to the world)
  let x = 0, y = 0, e = el;
  while (e && e !== world) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
};

// Ordered tour: scrolling walks these in sequence. Phones get a stacked board
// where each service card is its own stop.
const mobileMQ = matchMedia('(max-width: 760px)');
let isMobile = mobileMQ.matches;
const LAYOUT = {
  desktop: { stops: [['home', 'f-hero'], ['services', 'f-svc'], ['app', 'f-phone'], ['brand', 'f-brand'], ['process', 'g-process'], ['contact', 'f-contact']], world: { x: -100, y: -100, w: 3040, h: 2750 } },
  mobile: { stops: [['home', 'f-hero'], ['services', 'svc1'], ['services', 'svc2'], ['services', 'svc3'], ['app', 'f-phone'], ['brand', 'f-brand'], ['process', 'g-process'], ['contact', 'f-contact']], world: { x: -60, y: -120, w: 560, h: 6560 } },
};
let STOP_IDS, STOP_KEYS, N, LAST, WORLD;
function setupLayout() {
  const L = LAYOUT[isMobile ? 'mobile' : 'desktop'];
  STOP_IDS = L.stops.map((q) => q[1]); STOP_KEYS = L.stops.map((q) => q[0]); N = STOP_IDS.length; LAST = N; WORLD = L.world;
}
setupLayout();
const keyIndex = (k) => STOP_KEYS.indexOf(k);
let stops = [];
const viewH = () => innerHeight - 150; // room for top bar + dock
function view(r, pad = isMobile ? 26 : 70) { // rect -> {cx, cy, z} in world space
  const z = Math.min((innerWidth - pad) / r.w, (viewH() - pad) / r.h, 1.3);
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, z };
}
function computeStops() { stops = STOP_IDS.map((id) => view(box(document.getElementById(id)))); stops.push(view(WORLD, 40));
  // scroll distance for each leg ~ how far the camera visibly travels, so speed feels the same everywhere
  segPx = stops.slice(0, -1).map((a, i) => { const b = stops[i + 1];
    const len = Math.hypot(b.cx - a.cx, b.cy - a.cy) * Math.sqrt(a.z * b.z) + Math.abs(Math.log(b.z / a.z)) * innerHeight * .6;
    return Math.max(500, Math.min(1600, len * .9)); });
}
let segPx = [];
function advance(px) { // move along the tour by a scroll distance in pixels, crossing legs as needed
  let guard = 0;
  while (px !== 0) {
    const i = px > 0 ? Math.min(LAST - 1, Math.floor(pGoal)) : Math.max(0, Math.ceil(pGoal) - 1);
    const room = px > 0 ? (i + 1 - pGoal) * segPx[i] : (pGoal - i) * segPx[i];
    if ((px > 0 && pGoal >= LAST) || (px < 0 && pGoal <= 0)) break;
    const used = Math.min(Math.abs(px), room || segPx[i]);
    if (used >= room) pGoal = px > 0 ? i + 1 : i; else pGoal += Math.sign(px) * used / segPx[i]; // land exactly on the boundary
    px -= Math.sign(px) * used;
    if (used === 0 || ++guard > 20) break;
  }
  pGoal = Math.max(0, Math.min(LAST, pGoal));
}
const toCam = (v) => ({ x: innerWidth / 2 - v.cx * v.z, y: 70 + viewH() / 2 - v.cy * v.z, z: v.z });
const ease = (f) => Math.min(1, Math.max(0, f)); // linear: the camera moves exactly as much as you scroll
function tourView(p) { // camera at a fractional position along the tour
  const i = Math.min(LAST - 1, Math.floor(p)), f = ease(p - i);
  const a = stops[i], b = stops[i + 1];
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * f) * (1 - (i + 1 === LAST ? 0 : .18) * Math.sin(Math.PI * f)); // pull back mid-flight (not into the overview)
  return toCam({ cx: a.cx + (b.cx - a.cx) * f, cy: a.cy + (b.cy - a.cy) * f, z });
}

let mode = 'tour';            // 'tour' (scroll-driven) or 'free' (user dragged / zoomed)
let p = 0, pGoal = 0;          // tour progress, 0..N-1
const cam = { x: 0, y: 0, z: 1 }, goal = { x: 0, y: 0, z: 1 };

let follow = .07; // how tightly the camera tracks: tight for scrolling, softer for menu jumps
let flight = null;
function goStop(i) { // fly straight to a section instead of retracing the scroll path
  i = Math.max(0, Math.min(LAST, i));
  const from = { cx: (innerWidth / 2 - cam.x) / cam.z, cy: (70 + viewH() / 2 - cam.y) / cam.z, z: cam.z };
  const to = stops[i];
  const dist = Math.hypot(to.cx - from.cx, to.cy - from.cy) * Math.sqrt(from.z * to.z);
  const dip = i === LAST || from.z < .6 ? 0 : Math.min(.35, dist / innerWidth * .18); // pull back a bit only for long side-to-side hops
  flight = { from, to, i, dip, t0: performance.now(), dur: reduce ? 1 : Math.min(1400, 650 + dist * .35) };
  mode = 'fly'; pGoal = i;
}
function flyView(now) {
  const f = Math.min(1, (now - flight.t0) / flight.dur), e = f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  const { from: a, to: b } = flight;
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e) * (1 - flight.dip * Math.sin(Math.PI * e));
  if (f >= 1) { mode = 'tour'; p = pGoal = flight.i; flight = null; }
  return toCam({ cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, z });
}
document.querySelectorAll('[data-key]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); goStop(keyIndex(b.dataset.key)); }));
document.querySelectorAll('[data-go="f-contact"]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); goStop(keyIndex('contact')); }));
document.getElementById('overview').addEventListener('click', (e) => {
  e.stopPropagation(); goStop(LAST);
});

// --- scroll = move along the tour at the user's own speed (Magic Mouse / trackpad / wheel) ---
vp.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) { enterFree(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * .01)); return; }
  if (mode === 'fly') return;
  if (mode === 'free') { mode = 'tour'; pGoal = p = nearestStop(); }
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  const d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
  follow = .3; advance(d); // no snapping: wherever you stop scrolling, the camera stays
}, { passive: false });
function stopAt(sx, sy) { // which section is under this screen point (pointer capture hides the real target)
  const wx = (sx - cam.x) / cam.z, wy = (sy - cam.y) / cam.z, pad = 40;
  return STOP_IDS.findIndex((id) => { const r = box(document.getElementById(id)); return wx > r.x - pad && wx < r.x + r.w + pad && wy > r.y - pad && wy < r.y + r.h + pad; });
}
function nearestStop() { // which stop the camera is closest to right now
  const cx = (innerWidth / 2 - cam.x) / cam.z, cy = (70 + viewH() / 2 - cam.y) / cam.z;
  let best = 0, bd = Infinity; stops.forEach((v, i) => { const d = Math.hypot(v.cx - cx, v.cy - cy) + Math.abs(Math.log(v.z / cam.z)) * 400; if (d < bd) { bd = d; best = i; } });
  return best;
}
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea')) return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goStop(Math.floor(pGoal + .001) + 1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goStop(Math.ceil(pGoal - .001) - 1); }
  if (e.key === 'Home') goStop(0); if (e.key === 'End') goStop(LAST);
});

// --- drag = look around freely (mouse); swipe = walk the tour (touch); pinch = zoom ---
function enterFree() { if (mode !== 'free') { mode = 'free'; Object.assign(goal, cam); } }
function zoomAt(px, py, f) {
  const z = Math.max(.12, Math.min(2.5, goal.z * f)), k = z / goal.z;
  goal.x = px - (px - goal.x) * k; goal.y = py - (py - goal.y) * k; goal.z = z;
}
const pointers = new Map(); let drag = null, pinch = null, moved = 0;
vp.addEventListener('pointerdown', (e) => {
  if (cam.z < .6 && e.target.closest('#world')) e.preventDefault(); // zoomed out: a click opens the section, not the form field
  else if (e.target.closest('input,textarea,button,.pill,a')) {
    if (e.pointerType !== 'touch') return;
    // touch: a swipe that starts on a field or button still walks the board; a plain tap still focuses/clicks it
    pointers.set(e.pointerId, e); drag = { x: e.clientX, y: e.clientY, touch: true, onControl: true }; moved = 0; return;
  }
  pointers.set(e.pointerId, e); vp.setPointerCapture(e.pointerId);
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; enterFree(); pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: goal.z }; drag = null; return; }
  drag = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; moved = 0;
  if (!drag.touch) { enterFree(); drag.gx = goal.x; drag.gy = goal.y; vp.classList.add('drag'); }
});
const hoverBox = document.createElement('div'); hoverBox.className = 'hoverbox'; world.appendChild(hoverBox);
vp.addEventListener('pointermove', (e) => {
  if (!drag && cam.z < .6) { // zoomed out: show which section a click will open
    const i = stopAt(e.clientX, e.clientY), r = i >= 0 ? box(document.getElementById(STOP_IDS[i])) : null;
    vp.style.cursor = r ? 'zoom-in' : '';
    hoverBox.style.opacity = r ? 1 : 0;
    if (r) Object.assign(hoverBox.style, { left: r.x - 18 + 'px', top: r.y - 18 + 'px', width: r.w + 36 + 'px', height: r.h + 36 + 'px', borderWidth: 3 / cam.z + 'px', borderRadius: 14 / cam.z + 'px' });
  } else if (hoverBox.style.opacity !== '0') { hoverBox.style.opacity = 0; vp.style.cursor = ''; }
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e);
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    zoomAt((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2, (pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d) / goal.z); return;
  }
  if (!drag) return;
  moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
  if (!drag.touch) { goal.x = drag.gx + e.clientX - drag.x; goal.y = drag.gy + e.clientY - drag.y; }
  else if (mode !== 'fly') { if (mode === 'free') { mode = 'tour'; pGoal = p = nearestStop(); } const ly = drag.ly ?? drag.y, lx = drag.lx ?? drag.x;
    const dd = Math.abs(e.clientY - ly) >= Math.abs(e.clientX - lx) ? ly - e.clientY : lx - e.clientX; follow = .3; advance(dd * 1.6); drag.ly = e.clientY; drag.lx = e.clientX;
    const now = performance.now(); drag.v = dd * 1.6 / Math.max(8, now - (drag.lt || now - 16)); drag.lt = now; }
});
const end = (e) => {
  pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
  if (drag) {
    const dy = e.clientY - drag.y, dx = e.clientX - drag.x;
    if (drag.touch && moved > 6) { if (drag.v && performance.now() - drag.lt < 80) glide(drag.v); } else if (moved < 6 && !drag.onControl) { // tap / click on a frame jumps to it
      const i = stopAt(e.clientX, e.clientY);
      if (i >= 0) goStop(i);
    }
  }
  drag = null; vp.classList.remove('drag');
};
vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);

function glide(v) { // momentum after a touch swipe, like native scrolling
  (function step() { if (mode !== 'tour' || Math.abs(v) < .05) return; advance(v * 16); v *= .94; requestAnimationFrame(step); })();
}

// arrows: through the process notes, then down to contact
const arrows = document.getElementById('arrows');
arrows.innerHTML = [[1910, 1640, 1990, 1660], [2220, 1660, 2300, 1630], [2530, 1630, 2610, 1670], [2720, 1820, 2440, 1980]].map(([a, b, c, d]) =>
  `<path d="M${a} ${b} C ${(a + c) / 2} ${b - 60}, ${(a + c) / 2} ${d - 60}, ${c} ${d}" fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round" marker-end="url(#h)"/>`).join('') +
  '<defs><marker id="h" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#141414"/></marker></defs>';

// fake collaborators
const c1 = document.getElementById('c1'), c2 = document.getElementById('c2'), c2t = document.getElementById('c2t');
const path1 = [[1900, 640], [2500, 650], [2300, 900], [2600, 1100], [2200, 1500], [1750, 1250]]; // stays out of the hero, which has its own cursors
const path2 = [[1800, 1300], [2100, 2150], [2400, 2350], [2500, 400], [1800, 1000]];
const msgs = tx(['dev', 'dev · fixing LCP', 'dev · shipping v1.2', 'dev · npm run build'], ['dev', 'dev · LCP düzeltiyor', 'dev · v1.2 yayında', 'dev · npm run build']);
function along(pts, t) { const n = pts.length, s = t % n, i = Math.floor(s), f = s - i, a = pts[i], b = pts[(i + 1) % n], e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]; }

// minimap (click to jump)
const mini = document.getElementById('mini'), mc = mini.getContext('2d');
const ms = () => Math.min(mini.width / WORLD.w, mini.height / WORLD.h);
function drawMini() {
  const s = ms();
  mc.fillStyle = '#F4F2EE'; mc.fillRect(0, 0, mini.width, mini.height);
  frames.forEach((f) => { const r = box(f); mc.fillStyle = f.classList.contains('sel') ? '#2E5BFF' : '#D9D5CC'; mc.fillRect((r.x - WORLD.x) * s, (r.y - WORLD.y) * s, r.w * s, r.h * s); });
  const g = box(document.getElementById('g-process')); mc.fillStyle = '#FFD84A'; mc.fillRect((g.x - WORLD.x) * s, (g.y + 80 - WORLD.y) * s, g.w * s, 200 * s);
  mc.strokeStyle = '#141414'; mc.lineWidth = 3;
  mc.strokeRect((-cam.x / cam.z - WORLD.x) * s, (-cam.y / cam.z - WORLD.y) * s, innerWidth / cam.z * s, innerHeight / cam.z * s);
}
mini.addEventListener('click', (e) => {
  const r = mini.getBoundingClientRect(), s = ms();
  const wx = (e.clientX - r.left) / r.width * mini.width / s + WORLD.x, wy = (e.clientY - r.top) / r.height * mini.height / s + WORLD.y;
  let best = 0, bd = Infinity; stops.slice(0, N).forEach((v, i) => { const d = Math.hypot(v.cx - wx, v.cy - wy); if (d < bd) { bd = d; best = i; } });
  goStop(best);
});

const zoomEl = document.getElementById('zoom'), stepEl = document.getElementById('step'), barEl = document.getElementById('bar');
const dockBtns = [...document.querySelectorAll('[data-key]')], ovBtn = document.getElementById('overview');
let shownStop = -1;
function tick(t) {
  const k = reduce ? 1 : .085;
  if (mode === 'fly') Object.assign(goal, flyView(t));
  else if (mode === 'tour') { p += (pGoal - p) * (reduce ? 1 : follow); if (Math.abs(pGoal - p) < .001) p = pGoal; Object.assign(goal, tourView(p)); }
  const kk = mode === 'free' ? k : 1; cam.x += (goal.x - cam.x) * kk; cam.y += (goal.y - cam.y) * kk; cam.z += (goal.z - cam.z) * kk;
  world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
  vp.style.setProperty('--g', 24 * cam.z + 'px'); vp.style.setProperty('--gx', cam.x + 'px'); vp.style.setProperty('--gy', cam.y + 'px');
  zoomEl.textContent = Math.round(cam.z * 100) + '%';
  const cur = mode === 'fly' ? flight.i : mode === 'tour' ? Math.round(p) : -1;
  if (cur !== shownStop) {
    shownStop = cur;
    const curKey = cur >= 0 && cur < LAST ? STOP_KEYS[cur] : null;
    dockBtns.forEach((b) => b.classList.toggle('on', b.dataset.key === curKey)); ovBtn.classList.toggle('on', cur === LAST);
    const curFrame = curKey ? document.getElementById(STOP_IDS[cur]).closest('.frame') : null;
    frames.forEach((f) => f.classList.toggle('sel', f === curFrame));
    const pad2 = (n) => String(n).padStart(2, '0');
    stepEl.textContent = cur === LAST ? tx('overview', 'genel bakış') : cur >= 0 ? `${pad2(cur + 1)} / ${pad2(N)}` : tx('free', 'serbest');
    const dk = dockBtns.find((b) => b.dataset.key === curKey); if (dk && isMobile) dk.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
  barEl.style.width = (mode === 'free' ? 0 : (mode === 'fly' ? flight.i : p) / LAST * 100) + '%';
  const s = t / 1000;
  const [x1, y1] = along(path1, s * .22); c1.style.transform = `translate(${x1}px,${y1}px) scale(${1 / cam.z})`;
  const [x2, y2] = along(path2, s * .17 + 2); c2.style.transform = `translate(${x2}px,${y2}px) scale(${1 / cam.z})`;
  const mi = Math.floor(s / 3) % msgs.length; c2t.textContent = msgs[mi]; c2t.classList.toggle('typing', mi > 0);
  drawMini();
  requestAnimationFrame(tick);
}

// services: code panels type themselves out, lighthouse score counts up
const codes = [...document.querySelectorAll('.code')].map((el) => ({ el, lines: el.dataset.code.split('|') }));
const scoreEl = document.getElementById('score'), scoreRing = scoreEl.parentElement;
const CYCLE = 8000, svcStart = performance.now();
function svcTick(now) {
  const t = ((now - svcStart) % CYCLE) / CYCLE;
  for (const c of codes) {
    const total = c.lines.join('\n').length, typed = reduce ? total : Math.round(Math.min(1, Math.max(0, (t - .04) / .6)) * total);
    const txt = t > .94 ? '' : c.lines.join('\n').slice(0, typed);
    if (c.el.textContent !== txt) c.el.textContent = txt;
  }
  const sc = reduce ? 100 : t < .45 ? 0 : t > .94 ? 0 : Math.round(Math.min(1, (t - .45) / .25) * 100);
  scoreEl.textContent = sc; scoreRing.style.setProperty('--s', sc);
  requestAnimationFrame(svcTick);
}
requestAnimationFrame(svcTick);

// app: tabs switch screens; it demos itself, a tap from you takes over for a while
const aViews = [...document.querySelectorAll('.a-v')], aTabs = [...document.querySelectorAll('#atabs button')];
const aInd = document.querySelector('.a-ind'), aTap = document.querySelector('.a-tap'), aDonut = document.querySelector('.a-donut');
let aIdx = 0, aPausedUntil = 0, aDonutT = 0;
function aShow(i, tapped) {
  if (i === aIdx) return;
  const prev = aViews[aIdx]; prev.classList.remove('on'); prev.classList.add('out');
  setTimeout(() => prev.classList.remove('out'), 600);
  aIdx = i; aViews[i].classList.add('on');
  aTabs.forEach((b, k) => b.classList.toggle('on', k === i));
  aInd.style.transform = `translateX(${i * 100}%)`;
  if (tapped !== false) { const b = aTabs[i]; aTap.style.left = b.offsetLeft + b.offsetWidth / 2 + 'px'; aTap.classList.remove('go'); void aTap.offsetWidth; aTap.classList.add('go'); }
  if (i === 2) aDonutT = performance.now();
  if (i === 3) document.querySelector('.a-badge').style.transform = 'scale(0)';
}
aTabs.forEach((b, i) => b.addEventListener('click', (e) => { e.stopPropagation(); aPausedUntil = performance.now() + 9000; aShow(i); }));
setInterval(() => { if (!reduce && performance.now() > aPausedUntil) aShow((aIdx + 1) % aViews.length); }, 3800);
(function aLoop(now) { // donut fills when Stats opens
  const f = Math.min(1, (now - aDonutT) / 1200), e = 1 - Math.pow(1 - f, 3);
  aDonut.style.setProperty('--dn', aIdx === 2 ? (e * .62).toFixed(3) : 0);
  requestAnimationFrame(aLoop);
})(0);

// ---------- hero: multiplayer cursors assemble the page, then loop ----------
(function hero() {
  const $ = (id) => document.getElementById(id);
  const W1 = $('w1'), W2 = $('w2'), W3 = $('w3'), W4 = $('w4'), HP = $('hp'), PILL = $('hpill'), BADGE = $('hbadge'), ICON = $('hicon'), COM = $('hcom'), SW = $('hsw');
  const CL = $('hc4'), STAMP = $('hstamp'), COMAV = $('hcomav'), COMBY = $('hcomby'), COMTX = $('hcomtx');
  const C = [$('hc1'), $('hc2'), $('hc3')], SEL = [$('hs1'), $('hs2'), $('hs3')], guide = $('hguide'), typed = $('hptext');
  const PARA = tx('An independent studio. This board is our actual workspace — wander around, everything is live.', 'Bağımsız bir stüdyoyuz. Bu pano gerçek çalışma alanımız; gez, dolaş, her şey canlı.');
  const W4TXT = W4.textContent, CLIENT = tx('Aden · client', 'Aden · müşteri');
  const st = new Map();
  const S = (el) => st.get(el);
  const apply = (el) => { const t = S(el); el.style.transform = `translate(${t.x}px,${t.y}px) rotate(${t.r || 0}deg) scale(${t.s ?? 1})`; el.style.opacity = t.o ?? 1;
    if (t.w != null) el.style.fontWeight = Math.round(t.w);
    if (t.c != null) { const a = t.ca || [20, 20, 20], b = t.cb || [255, 61, 127]; el.style.color = `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t.c)).join(',')})`; } };
  const set = (el, v) => { st.set(el, { ...(S(el) || {}), ...v }); apply(el); };
  const easeIO = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const back = (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  let alive = true;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  function tween(el, to, dur, ease = easeIO, step) {
    if (reduce) { set(el, to); step && step(1); return Promise.resolve(); }
    const from = { ...S(el) };
    return new Promise((res) => { const t0 = performance.now();
      (function f(now) { const k = Math.min(1, (now - t0) / dur), e = ease(k), t = S(el);
        for (const key in to) t[key] = from[key] + (to[key] - from[key]) * e;
        apply(el); step && step(e); k < 1 ? requestAnimationFrame(f) : res(); })(t0); });
  }
  // selections follow their targets every frame
  const selOf = [null, null, null], labelOf = ['', '', ''];
  function box(el) { const t = S(el), s = t.s ?? 1; return { x: t.x, y: t.y, w: el.offsetWidth * s, h: el.offsetHeight * s, r: t.r || 0 }; }
  (function selLoop() {
    selOf.forEach((tg, i) => { const el = SEL[i]; el.classList.toggle('on', !!tg); if (!tg) return;
      let b; if (Array.isArray(tg)) { const bs = tg.map(box); const x = Math.min(...bs.map((q) => q.x)), y = Math.min(...bs.map((q) => q.y));
        b = { x, y, w: Math.max(...bs.map((q) => q.x + q.w)) - x, h: Math.max(...bs.map((q) => q.y + q.h)) - y, r: 0 }; } else b = box(tg);
      el.style.transform = `translate(${b.x - 4}px,${b.y - 4}px) rotate(${b.r}deg)`; el.style.width = b.w + 8 + 'px'; el.style.height = b.h + 8 + 'px';
      el.querySelector('em').textContent = labelOf[i] || `${Math.round(b.w)} × ${Math.round(b.h)}`; });
    requestAnimationFrame(selLoop);
  })();
  async function click(c) { c.classList.add('press'); await sleep(140); c.classList.remove('press'); }
  const ci = (c) => C.indexOf(c);
  async function moveTo(c, x, y, dur = 650) { await tween(c, { x, y }, dur, easeIO); }
  async function grabDrag(c, el, to, dur, opt = {}) {
    const b = box(el), ox = b.w * (opt.gx ?? .35), oy = b.h * (opt.gy ?? .5);
    await moveTo(c, b.x + ox, b.y + oy, opt.reach ?? 650);
    await click(c); selOf[ci(c)] = el; labelOf[ci(c)] = '';
    if (opt.guide) setTimeout(() => guide.classList.add('on'), dur * .55);
    const scale0 = S(el).s ?? 1;
    await tween(el, to, dur, easeIO, () => { const t = S(el), k = (t.s ?? 1) / scale0; set(c, { x: t.x + ox * k, y: t.y + oy * k }); });
    guide.classList.remove('on');
    await sleep(opt.hold ?? 260); selOf[ci(c)] = null;
  }
  // final layout (measured with the final weight so "feel." sits right after "can")
  // every coordinate of the scene, per layout (desktop card 1440×900, phone card 900×1500)
  const P = {
    desktop: { L: 80, rows: [222, 342, 462], pillRight: 1360, pillY: 742, pillS: 1, badge: { x: 1085, y: 128, s: 1 }, icon: { x: 1150, y: 430, s: 1 }, hp: { x: 80, y: 700 },
      scatter: { w1: { x: 820, y: 560, s: .5, r: 9 }, w2: { x: 150, y: 650, s: .42, r: -7 }, w3: { x: 1010, y: 230, s: .6, r: 14 }, w4: { x: 560, y: 170, s: .55, r: -12 },
        pill: { x: 300, y: 140, s: .8, r: -14 }, badge: { x: 1520, y: 330, s: .55, r: 20 }, icon: { x: 1500, y: 700, s: .6, r: 25 } },
      com: { x: 780, y: 230 }, stamp: { x: 790, y: 585, s: 1 }, cl0: [1420, 520], clIdle: [1240, 600], cardW: 1440, cardH: 900, cur0: [[1320, 860], [30, 870], [1420, 40]], afterColor: [980, 610], afterType: [560, 860], idle: [[1000, 640], [620, 820], [1300, 380]] },
    mobile: { L: 60, rows: [250, 370, 490], pillRight: null, pillY: 1330, pillS: 1.6, badge: { x: 400, y: 1010, s: 1.6 }, icon: { x: 90, y: 1060, s: 1.3 }, hp: { x: 60, y: 690 },
      scatter: { w1: { x: 380, y: 980, s: .5, r: 9 }, w2: { x: 60, y: 1180, s: .42, r: -7 }, w3: { x: 560, y: 330, s: .6, r: 14 }, w4: { x: 300, y: 180, s: .55, r: -12 },
        pill: { x: 120, y: 640, s: .9, r: -14 }, badge: { x: 980, y: 760, s: .55, r: 20 }, icon: { x: 960, y: 1200, s: .6, r: 25 } },
      com: { x: 300, y: 140 }, stamp: { x: 480, y: 1225, s: 1.35 }, cl0: [880, 760], clIdle: [760, 1170], cardW: 900, cardH: 1500, cur0: [[820, 1440], [40, 1460], [860, 90]], afterColor: [700, 900], afterType: [420, 1250], idle: [[700, 900], [400, 1250], [780, 300]] },
  };
  let F = {}, Q = P.desktop;
  function layout() {
    Q = P[isMobile ? 'mobile' : 'desktop'];
    W3.style.fontWeight = 820; const w3 = W3.offsetWidth; W3.style.fontWeight = '';
    PILL.style.transform = 'none'; const pw = PILL.offsetWidth;
    const [r1, r2, r3] = Q.rows;
    F = { w1: { x: Q.L, y: r1, r: 0, s: 1 }, w2: { x: Q.L, y: r2, r: 0, s: 1 }, w3: { x: Q.L, y: r3, r: 0, s: 1 }, w4: { x: Q.L + w3 + 30, y: r3, r: 0 },
      pill: { x: Q.pillRight ? Q.pillRight - pw : Q.L, y: Q.pillY, r: 0, s: Q.pillS }, badge: { ...Q.badge, r: 0 }, icon: { ...Q.icon, r: -8 } };
  }
  function scatter() {
    const sc = Q.scatter;
    set(W1, { ...sc.w1, w: 500, o: 1 }); set(W2, { ...sc.w2, w: 500, o: 1 }); set(W3, { ...sc.w3, w: 500, o: 1 }); W4.textContent = W4TXT; W4.classList.remove('hl'); PILL.style.background = ''; set(STAMP, { ...Q.stamp, r: -9, o: 0 });
    set(W4, { ...sc.w4, c: 0, ca: [20, 20, 20], cb: [255, 61, 127], o: 1 });
    set(PILL, { ...sc.pill, o: 1 }); set(BADGE, { ...sc.badge, o: 1 }); set(ICON, { ...sc.icon, o: 1 });
    set(HP, { ...Q.hp, s: 1, r: 0, o: 0 }); typed.textContent = '';
    set(COM, { ...Q.com, s: .6, r: 0, o: 0 }); set(SW, { x: 0, y: 0, s: .8, r: 0, o: 0 });
    SW.querySelectorAll('i').forEach((i) => i.classList.remove('pick'));
  }
  function placeCursors() { C.forEach((c, i) => set(c, { x: Q.cur0[i][0], y: Q.cur0[i][1] })); set(CL, { x: Q.cl0[0], y: Q.cl0[1] }); }
  layout(); placeCursors();

  // ---- revision comments ----
  let round = 0;
  function comAt(target) {
    const b = Array.isArray(target) ? target : box(target), w = COM.offsetWidth, h = COM.offsetHeight, pad = 40;
    const clampX = (x) => Math.max(pad, Math.min(x, Q.cardW - w - pad));
    if (b.y + b.h + 30 + h < Q.cardH - pad) return { x: clampX(b.x), y: b.y + b.h + 30 };   // below
    if (b.x + b.w + pad + w < Q.cardW - pad) return { x: b.x + b.w + pad, y: b.y - 20 };     // right
    if (b.x - w - pad > pad) return { x: b.x - w - pad, y: b.y - 20 };                       // left
    return { x: clampX(b.x), y: b.y - h - 30 };                                              // above
  }
  async function say(cur, l, col, by, text, at) {
    COMAV.textContent = l; COMAV.style.background = col; COMBY.textContent = by; COMTX.textContent = text; COM.classList.remove('done');
    const pos = at.x != null && at.w == null && !at.nodeType ? { x: Math.max(40, Math.min(at.x, Q.cardW - COM.offsetWidth - 40)), y: at.y } : comAt(at);
    await moveTo(cur, pos.x + 20, pos.y + 20, 800); await click(cur);
    set(COM, { x: pos.x, y: pos.y, s: .6, r: 0, o: 0 }); await tween(COM, { o: 1, s: 1 }, 450, back); await sleep(1100);
  }
  async function resolve(cur) {
    const t = S(COM); await moveTo(cur, t.x + 50, t.y + 25, 400); await click(cur);
    COM.classList.add('done'); await sleep(650); await tween(COM, { o: 0, s: .9 }, 300); COM.classList.remove('done');
  }
  async function pickSwatch(cur, idx, x, y) {
    SW.querySelectorAll('i').forEach((i) => i.classList.remove('pick'));
    set(SW, { x, y, s: .8, o: 0 }); await tween(SW, { s: 1, o: 1 }, 260, easeOut);
    const sw = SW.querySelectorAll('i')[idx], r1 = SW.getBoundingClientRect(), r2 = sw.getBoundingClientRect(), z = r1.width / SW.offsetWidth;
    await moveTo(cur, x + (r2.left - r1.left + r2.width / 2) / z, y + (r2.top - r1.top + r2.height / 2) / z, 600); await click(cur); sw.classList.add('pick');
  }
  // a: the client wants another word
  async function rWord(n) {
    const word = tx(['love.', 'trust.', 'touch.'], ['deneyimler.', 'ürünler.', 'arayüzler.'])[n % 3], d = C[1];
    await say(CL, 'A', '#FF8A3D', CLIENT, tx(`what if "${W4TXT}" → "${word}"? 🤔`, `"${W4TXT}" yerine "${word}" mi? 🤔`), W4);
    const b = box(W4); await moveTo(d, b.x + b.w * .5, b.y + b.h * .55, 700); await click(d); await sleep(90); await click(d);
    selOf[1] = W4; labelOf[1] = tx('editing text', 'metin düzenleniyor'); W4.classList.add('hl'); await sleep(450);
    W4.classList.remove('hl'); W4.textContent = '';
    for (let i = 1; i <= word.length; i++) { W4.textContent = word.slice(0, i); const q = box(W4); set(d, { x: q.x + q.w + 4, y: q.y + q.h * .6 }); await sleep(110); }
    await sleep(400); selOf[1] = null; labelOf[1] = '';
    await resolve(CL); moveTo(d, ...Q.afterType, 900);
  }
  // b: the app icon is crooked → rotate it straight from the corner handle
  async function rLogo() {
    const c = C[0];
    await say(CL, 'A', '#FF8A3D', CLIENT, tx('the logo looks a bit crooked 📐', 'logo biraz yamuk duruyor 📐'), ICON);
    const handle = () => { const t = S(ICON), s = t.s ?? 1, a = (t.r || 0) * Math.PI / 180, hx = ICON.offsetWidth * s + 18, hy = -18;
      return { x: t.x + hx * Math.cos(a) - hy * Math.sin(a), y: t.y + hx * Math.sin(a) + hy * Math.cos(a) }; };
    selOf[0] = ICON; labelOf[0] = Math.round(S(ICON).r) + '°';
    const h0 = handle(); await moveTo(c, h0.x, h0.y, 700); await click(c);
    await tween(ICON, { r: 0 }, 1000, easeIO, () => { const h = handle(); set(c, h); labelOf[0] = Math.round(S(ICON).r) + '°'; });
    await sleep(500); selOf[0] = null; labelOf[0] = '';
    await resolve(CL); moveTo(c, ...Q.afterColor, 900);
  }
  // c: the CTA should pop more → recolour it from the swatches
  async function rCta() {
    const m = C[2];
    await say(CL, 'A', '#FF8A3D', CLIENT, tx('the button could pop more 🔥', 'buton biraz daha öne çıksın 🔥'), PILL);
    const b = box(PILL); selOf[2] = PILL;
    await moveTo(m, b.x + b.w * .5, b.y + b.h * .5, 600); await click(m);
    await pickSwatch(m, 2, b.x, b.y - SW.offsetHeight - 24);
    PILL.style.background = '#FF3D7F'; await tween(PILL, { s: (S(PILL).s ?? 1) * 1.08 }, 180, easeOut); await tween(PILL, { s: Q.pillS }, 260, back);
    await sleep(300); await tween(SW, { o: 0, s: .9 }, 200); selOf[2] = null;
    await resolve(CL); moveTo(m, ...Q.idle[2], 900);
  }
  // d: motion asks for blue → recolour "feel."
  async function rBlue() {
    const c = C[0], m = C[2];
    await say(m, 'M', '#2E5BFF', 'motion', tx('try it in blue? 💙', 'maviyle mi denesek? 💙'), W4);
    const b = box(W4); selOf[0] = W4;
    await moveTo(c, b.x + b.w * .5, b.y + b.h * .5, 600); await click(c);
    await pickSwatch(c, 3, b.x + b.w + 40, b.y + 30);
    set(W4, { ca: [255, 61, 127], cb: [46, 91, 255], c: 0 }); await tween(W4, { c: 1 }, 500, easeOut);
    await sleep(300); await tween(SW, { o: 0, s: .9 }, 200); selOf[0] = null;
    await resolve(m); moveTo(c, ...Q.afterColor, 900);
  }

  async function cycle() {
    const was = Q; layout(); if (Q !== was) placeCursors(); scatter(); await sleep(700);
    // 1 · three people assemble the page at once
    await Promise.all([
      (async () => { await grabDrag(C[0], W1, F.w1, 1150, { guide: true }); await grabDrag(C[0], W4, { ...F.w4, s: .62 }, 950); })(),
      (async () => { await sleep(250); await grabDrag(C[1], W2, F.w2, 1250, { guide: true }); await grabDrag(C[1], W3, F.w3, 950, { guide: true }); })(),
      (async () => { await sleep(500); await grabDrag(C[2], PILL, F.pill, 1050); await grabDrag(C[2], BADGE, F.badge, 1150, { reach: 800 }); await grabDrag(C[2], ICON, F.icon, 950, { reach: 750 }); })(),
    ]);
    // 2 · "feel." gets scaled up from its corner handle
    const c = C[0]; selOf[0] = W4;
    let b = box(W4); await moveTo(c, b.x + b.w, b.y + b.h, 550); await click(c);
    await tween(W4, { s: 1 }, 1100, easeIO, () => { const q = box(W4); set(c, { x: q.x + q.w, y: q.y + q.h }); });
    // 3 · …and recoloured from a swatch popover
    b = box(W4); set(SW, { x: b.x + b.w + 40, y: b.y + 30, s: .8, o: 0 }); await tween(SW, { s: 1, o: 1 }, 260, easeOut);
    SW.querySelectorAll('i').forEach((i) => i.classList.remove('pick'));
    const yel = SW.querySelectorAll('i')[2], sr = S(SW);
    await moveTo(c, sr.x + 12 + 80 + 15, sr.y + 25, 600); await click(c); yel.classList.add('pick');
    await tween(W4, { c: 1 }, 500, easeOut); await sleep(300);
    await tween(SW, { o: 0, s: .9 }, 200); selOf[0] = null;
    moveTo(c, ...Q.afterColor, 900);
    // 4 · frontend types the intro paragraph
    const d = C[1]; await moveTo(d, Q.hp.x + 10, Q.hp.y + 12, 700); await click(d); set(HP, { o: 1 });
    await new Promise((res) => { let i = 0; const t = setInterval(() => { typed.textContent = PARA.slice(0, ++i);
      const r = HP.getBoundingClientRect(), cr = typed.getClientRects(), last = cr[cr.length - 1];
      if (last) { const z = r.width / HP.offsetWidth; set(d, { x: S(HP).x + (last.right - r.left) / z + 6, y: S(HP).y + (last.top - r.top) / z + 14 }); }
      if (i >= PARA.length) { clearInterval(t); res(); } }, reduce ? 0 : 28); });
    moveTo(d, ...Q.afterType, 900);
    // 5 · revision round: comments come in, the team answers each one
    const m = C[2];
    await say(m, 'M', '#2E5BFF', 'motion', tx('can we make it bolder? 👀', 'biraz daha kalın olabilir mi? 👀'), Q.com);
    const heads = [W1, W2, W3]; await moveTo(c, Q.L + 10, Q.rows[0] + 18, 700); await click(c); selOf[0] = heads; const WL = tx('weight ', 'kalınlık '); labelOf[0] = WL + 500;
    await Promise.all(heads.map((h) => tween(h, { w: 820 }, 900, easeIO, (e) => { labelOf[0] = WL + Math.round(500 + 320 * e); })));
    await sleep(500); selOf[0] = null; labelOf[0] = '';
    await resolve(m);
    const n = round++, list = [rWord, rLogo, rCta, rBlue];
    await list[(2 * n) % 4](n); await list[(2 * n + 1) % 4](n);
    // 6 · the client signs it off
    await moveTo(CL, Q.stamp.x + 120 * Q.stamp.s, Q.stamp.y + 40 * Q.stamp.s, 900); await click(CL);
    set(STAMP, { s: Q.stamp.s * 2.2, o: 0 }); await tween(STAMP, { s: Q.stamp.s, o: 1 }, 380, back);
    moveTo(CL, ...Q.clIdle, 1000);
    // 7 · admire it for a bit, cursors idle
    moveTo(c, ...Q.idle[0], 1400); moveTo(d, ...Q.idle[1], 1500); moveTo(m, ...Q.idle[2], 1400);
    await sleep(reduce ? 0 : 4500);
    if (reduce) return; // reduced motion: stop on the finished page
    // 8 · scatter and start over
    const sc = Q.scatter, tgt = { [W1.id]: sc.w1, [W2.id]: sc.w2, [W3.id]: sc.w3, [W4.id]: sc.w4, [PILL.id]: sc.pill, [BADGE.id]: sc.badge, [ICON.id]: sc.icon };
    await Promise.all([W1, W2, W3, W4, PILL, BADGE, ICON].map((el) => tween(el, tgt[el.id], 900, easeIO)).concat([tween(HP, { o: 0 }, 400), tween(STAMP, { o: 0, s: Q.stamp.s * .9 }, 400)]));
    setTimeout(cycle, 300);
  }
  // wait for styles + fonts: the scene is laid out from measured sizes
  Promise.all([document.fonts.ready, pageLoaded]).then(cycle);
})();

// ---------- hero: split-flap status board ----------
(function flapBoard() {
  const row = document.getElementById('flap'), N = 10, CH = ' ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVWXYZ0123456789/';
  const MSG = tx([['AVAILABLE', 0], ['Q1 / 2027', 0], ['2 SLOTS', 1], ['SAY HELLO', 0], ['MOBILE', 0], ['WEB', 0], ['BRAND', 0]],
    [['MÜSAİTİZ', 0], ['2027 / Q1', 0], ['2 BOŞ YER', 1], ['YAZ BİZE', 0], ['MOBİL', 0], ['WEB', 0], ['MARKA', 0]]);
  const pad = (t) => { const l = Math.floor((N - t.length) / 2); return (' '.repeat(l) + t).padEnd(N); };
  const cells = Array.from({ length: N }, () => {
    const el = document.createElement('span'); el.className = 'fl';
    el.innerHTML = '<b class="u"><span></span></b><b class="d"><span></span></b><b class="fu"><span></span></b><b class="fd"><span></span></b>';
    row.appendChild(el); const q = (c) => el.querySelector(c + ' span');
    return { el, u: q('.u'), d: q('.d'), fu: q('.fu'), fd: q('.fd'), fuB: el.querySelector('.fu'), fdB: el.querySelector('.fd'), ch: ' ' };
  });
  const show = (c, ch) => { c.u.textContent = c.d.textContent = ch; c.ch = ch; };
  async function flip(c, to) {
    c.fu.textContent = c.ch; c.u.textContent = to; c.fd.textContent = to; c.fuB.style.visibility = c.fdB.style.visibility = 'visible';
    await c.fuB.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(-90deg)' }], { duration: 60, easing: 'ease-in' }).finished;
    c.fuB.style.visibility = 'hidden';
    await c.fdB.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 60, easing: 'ease-out' }).finished;
    c.fdB.style.visibility = 'hidden'; show(c, to);
  }
  async function spin(c, target, delay) {
    if (c.ch === target) return;
    await new Promise((r) => setTimeout(r, delay));
    let i = CH.indexOf(c.ch); const steps = 2 + Math.floor(Math.random() * 4);
    for (let k = 0; k < steps; k++) { i = (i + 1 + Math.floor(Math.random() * 3)) % CH.length; await flip(c, CH[i] === target ? CH[(i + 1) % CH.length] : CH[i]); }
    await flip(c, target);
  }
  let m = 0;
  async function next() {
    const [txt, hot] = MSG[m++ % MSG.length], t = pad(txt);
    if (reduce) { cells.forEach((c, i) => show(c, t[i])); row.classList.toggle('hot', !!hot); return; }
    row.classList.toggle('hot', !!hot);
    await Promise.all(cells.map((c, i) => spin(c, t[i], i * 45)));
    setTimeout(next, m % MSG.length === 1 ? 1800 : 2600);
  }
  cells.forEach((c) => show(c, ' '));
  setTimeout(next, reduce ? 0 : 900);
})();

document.querySelector('[data-stop-home]').addEventListener('click', (e) => { e.preventDefault(); goStop(0); });

// opening: overview, then fly into the first stop
computeStops();
mode = 'free'; Object.assign(cam, toCam(view(WORLD, 40))); Object.assign(goal, cam);
requestAnimationFrame(tick);
setTimeout(() => { Object.assign(goal, toCam(stops[0])); setTimeout(() => { mode = 'tour'; p = pGoal = 0; }, reduce ? 0 : 1400); }, reduce ? 0 : 700);
if (isMobile) document.getElementById('help').textContent = tx('swipe up to walk the board · tap a card', 'panoyu gezmek için yukarı kaydır · bir karta dokun');
setTimeout(() => document.getElementById('help').style.opacity = 0, 7000);
pageLoaded.then(() => document.fonts.ready).then(() => computeStops()); // positions can shift once CSS/fonts arrive
addEventListener('resize', () => {
  const m = mobileMQ.matches;
  if (m !== isMobile) { isMobile = m; setupLayout(); computeStops(); mode = 'tour'; p = pGoal = 0; shownStop = -1; return; }
  computeStops();
});

// ---------- contact: open the visitor's mail app with the brief filled in ----------
(function contactForm() {
  const form = document.getElementById('brief'), note = document.getElementById('form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach((el) => {
      const valid = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      el.classList.toggle('bad', !valid); if (!valid) ok = false;
    });
    if (!ok) { note.textContent = tx('Please add your name, a valid email and a few words about the project.', 'Lütfen adını, geçerli bir e-posta adresini ve projeyle ilgili birkaç kelime yaz.'); note.className = 'c-note err'; return; }
    const d = new FormData(form);
    const body = [`${tx('Name', 'Ad')}: ${d.get('name')}`, `${tx('Email', 'E-posta')}: ${d.get('email')}`, '', d.get('details')].join('\n');
    location.href = `mailto:hello@tanrikulu.dev?subject=${encodeURIComponent(tx('Project brief — ', 'Proje özeti — ') + d.get('name'))}&body=${encodeURIComponent(body)}`;
    note.textContent = tx('Your email app should open now — just hit send.', 'E-posta uygulaman şimdi açılacak, sadece gönder\'e bas.'); note.className = 'c-note ok';
  });
})();
