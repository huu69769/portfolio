/* ==========================================================================
   main.js ― 動きのコード
   作品や文章を変えたいときは data.js を書き換えてください（ここは触らなくてOK）。
   ========================================================================== */
(() => {
'use strict';

/* ---------- 小さな道具 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mqMobile = matchMedia('(max-width: 720px)');
const isMobile = () => mqMobile.matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// タッチだけの端末（スマホ・タブレット）
const touchOnly = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
const live = $('#live');
const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); };

// localStorage は使えない環境（プライベートモードなど）があるので、必ず try/catch で包む
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できなくても表示は続ける */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* 同上 */ } },
};

/* ---------- 画像のパス ---------- */
const isAbs = p => /^(https?:)?\/\//.test(p);
const asset = p => (!p ? '' : isAbs(p) ? p : BASE + p);
const absUrl = p => { try { return new URL(p, location.href).href; } catch (e) { return p; } };
const stem = f => f.replace(/\.[^.]+$/, '');
const pic = (f, size) => BASE + 'img/' + size + '/' + stem(f) + '.webp';   // 軽い版
const orig = f => BASE + 'img/' + f;                                        // 元の画像
function imgTag(f, size, alt, lazy = true) {
  return '<img src="' + pic(f, size) + '" data-fallback="' + orig(f) + '" alt="' + esc(alt) + '"' +
    (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
}
// 軽い版が無いときは元の画像に。元の画像も無ければ隠す
document.addEventListener('error', e => {
  const t = e.target;
  if (!(t instanceof HTMLImageElement)) return;
  if (t.dataset.fallback) { const f = t.dataset.fallback; delete t.dataset.fallback; t.src = f; }
  else t.classList.add('img-missing');
}, true);

// Web制作・ゲームのスクリーンショット（無ければ仮の画像）
function shotMedia(shot, title, kind, lazy = true) {
  const fake = '<span class="ph-fake' + (kind === 'game' ? ' game' : '') + '" aria-hidden="true">' + esc(title) + '</span>';
  if (!shot) return fake;
  return '<img src="' + esc(asset(shot)) + '" alt="' + esc(title) + 'の画面"' + (lazy ? ' loading="lazy"' : '') +
    ' decoding="async" style="position:absolute;inset:0">' + fake;
}
/* ---------- ドット絵のアイコン ---------- */
const SVG = {
  folder: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M2 6h11l3 3h14v19H2z" fill="#d9a92e"/><path d="M2 11h28v17H2z" fill="#f4cf5f"/><path d="M2 6h11l3 3h14v19H2z" fill="none" stroke="#4a3700" stroke-width="1.4"/><path d="M3 12h26" stroke="#fff3c4" stroke-width="1.2"/></svg>',
  web: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M2 6h11l3 3h14v19H2z" fill="#d9a92e"/><path d="M2 11h28v17H2z" fill="#f4cf5f"/><path d="M2 6h11l3 3h14v19H2z" fill="none" stroke="#4a3700" stroke-width="1.4"/><circle cx="21" cy="20" r="7" fill="#7cc4e8" stroke="#1d4a66" stroke-width="1.3"/><path d="M14 20h14M21 13v14M16 16h10M16 24h10" stroke="#1d4a66" stroke-width="1"/><ellipse cx="21" cy="20" rx="3" ry="7" fill="none" stroke="#1d4a66" stroke-width="1"/></svg>',
  game: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="5" width="26" height="22" fill="#d8d4cb" stroke="#333" stroke-width="1.4"/><rect x="4" y="6" width="24" height="4" fill="#4b3263"/><rect x="6" y="12" width="20" height="13" fill="#fff" stroke="#8a867e"/><path d="M13 15l7 3.5-7 3.5z" fill="#b27aa6" stroke="#4b3263"/></svg>',
  txt: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#333" stroke-width="1.4"/><path d="M20 2v6h6" fill="#ddd" stroke="#333" stroke-width="1.4"/><path d="M10 13h12M10 17h12M10 21h12M10 25h8" stroke="#4b3263" stroke-width="1.6"/></svg>',
  pdf: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#333" stroke-width="1.4"/><path d="M20 2v6h6" fill="#ddd" stroke="#333" stroke-width="1.4"/><rect x="4" y="17" width="20" height="9" fill="#c2413b"/><path d="M7 19h3v2H8v3H7zM8 19h2v2H8zM11 19h3v5h-3zM12 20h1v3h-1zM15 19h3v1h-2v1h2v1h-2v2h-1z" fill="#fff"/><path d="M12 20h1v3h-1z" fill="#c2413b"/></svg>',
  mail: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="8" width="26" height="17" fill="#fff" stroke="#333" stroke-width="1.4"/><path d="M3 8l13 10 13-10" fill="none" stroke="#333" stroke-width="1.4"/><circle cx="25" cy="9" r="4" fill="#b27aa6" stroke="#4b3263"/></svg>',
  img: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#333" stroke-width="1.4"/><path d="M5 25l8-9 6 6 4-4 4 7z" fill="#6f9c96"/><circle cx="22" cy="11" r="3" fill="#f4cf5f"/></svg>',
  phone: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="8" y="2" width="16" height="28" rx="2" fill="#3a3833" stroke="#222" stroke-width="1.2"/><rect x="10" y="5" width="12" height="20" fill="#fff"/><rect x="10" y="5" width="12" height="4" fill="#4b3263"/><path d="M11 11h2v2h-2zM15 11h2v2h-2zM19 11h2v2h-2zM11 15h2v2h-2zM15 15h2v2h-2zM19 15h2v2h-2zM11 19h2v2h-2zM15 19h2v2h-2z" fill="#6f9c96"/><rect x="19" y="19" width="2" height="2" fill="#b27aa6"/><rect x="14" y="26.5" width="4" height="1.6" fill="#8a867e"/></svg>',
  pc: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect x="4" y="4" width="24" height="17" fill="#d8d4cb" stroke="#333" stroke-width="1.4"/><rect x="7" y="7" width="18" height="11" fill="#6f9c96"/><rect x="10" y="23" width="12" height="3" fill="#d8d4cb" stroke="#333"/><rect x="6" y="26" width="20" height="3" fill="#d8d4cb" stroke="#333"/></svg>',
};
const ICON_OF = { web: 'web', uiux: 'folder', illust: 'folder', univ: 'folder', works: 'pc', about: 'txt', contact: 'mail', resume: 'pdf' };
const iconFor = id => SVG[id.indexOf('game:') === 0 ? 'game' : id.indexOf('app:') === 0 ? 'phone' : ICON_OF[id] || 'folder'];
const KIND_ICON = { FOLDER: 'folder', BROWSER: 'web', GAME: 'game', APP: 'phone', VIEWER: 'img', TEXT: 'txt', MAIL: 'mail', WELCOME: 'pc' };

/* ---------- 画像のまとまり（ビューアで順番に見る） ---------- */
const SETS = {};
UIUX.forEach(p => { SETS[p.id] = { title: p.title, sub: p.sub, items: p.items }; });
SETS.univ = { title: '大学時代のデザイン', items: UNIV };
SETS.illust = { title: 'イラスト', items: ILLUST };
const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || id;
// 中身がまだ無い分類（ゲームなど）は出さない
const HAS = { app: APPS.length, web: WEB.length, game: GAMES.length };
const CATS = CATEGORIES.filter(c => !(c.id in HAS) || HAS[c.id]);
// デスクトップに置くもの（中身が無いアイコンは出さない）
const findApp = id => APPS.find(a => 'app:' + a.id === id);
const findGame = id => GAMES.find(g => 'game:' + g.id === id);
const DESK_ITEMS = DESK.filter(d =>
  d.id === 'web' ? WEB.length : d.id.indexOf('app:') === 0 ? findApp(d.id) : d.id.indexOf('game:') === 0 ? findGame(d.id) : true);

// カルーセルに並べるもの：Web制作 ＋ ゲーム（ゲームも見逃さないように）
const SLIDES = WEB.map(w => Object.assign({ type: 'web' }, w))
  .concat(GAMES.map(g => Object.assign({ type: 'game' }, g)));

/* ==========================================================================
   起動画面
   ========================================================================== */
const boot = $('#boot');
const BOOT_LINES = ['LUO JIAWEN portfolio OS  ver.2026', ''].concat(
  APPS.length ? ['アプリ を読み込み中 ........ OK'] : [],
  ['UI/UX を読み込み中 ........ OK', 'イラスト を読み込み中 ...... OK'],
  WEB.length ? ['Web制作 を読み込み中 ....... OK'] : [],
  GAMES.length ? ['Web ゲーム を読み込み中 .... OK'] : [],
  ['', 'ようこそ。']);
let bootTimer = null, booted = false;
function endBoot() {
  if (booted) return;
  booted = true;
  clearInterval(bootTimer);
  boot.classList.add('done');
  setTimeout(() => boot.remove(), 400);
  document.body.classList.add('ready');
}
let seen = false;
try { seen = sessionStorage.getItem('luo-boot') === '1'; sessionStorage.setItem('luo-boot', '1'); } catch (e) { /* 気にしない */ }
if (reduce || seen) { boot.remove(); booted = true; document.body.classList.add('ready'); }
else {
  // スマホは約1秒、PCは約1.6秒
  const step = isMobile() ? 90 : 160;
  let i = 0;
  bootTimer = setInterval(() => {
    const p = document.createElement('p');
    p.textContent = BOOT_LINES[i] || '\u00a0';
    $('#bootLines').appendChild(p);
    if (++i >= BOOT_LINES.length) { clearInterval(bootTimer); setTimeout(endBoot, isMobile() ? 200 : 380); }
  }, step);
  boot.addEventListener('pointerdown', endBoot);
  addEventListener('keydown', endBoot, { once: true });
}

/* ==========================================================================
   デスクトップのアイコン（ドラッグで動かせる・位置は保存）
   ========================================================================== */
const desk = $('#desk');
const entriesBox = $('#entries');
const POS_KEY = 'luo-desk-pos-v3';
const savedPos = store.get(POS_KEY) || {};
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.min(1, Math.max(0, v));

function countWorks() { return APPS.length + WEB.length + GAMES.length + UIUX.length + UNIV.length + ILLUST.length; }

const entries = DESK_ITEMS.map((d, i) => {
  const isLink = d.id === 'resume';
  const el = document.createElement(isLink ? 'a' : 'button');
  el.className = 'entry icon';
  el.dataset.id = d.id;
  el.style.setProperty('--i', i);
  let extra = '';
  if (isLink) {
    el.href = asset(PROFILE.resume); el.target = '_blank'; el.rel = 'noopener';
    extra = '<span class="sr-only">（PDF・新しいタブで開きます）</span>';
  } else {
    el.type = 'button';
    el.dataset.open = d.id;
  }
  const g = d.id.indexOf('game:') === 0 && GAMES.find(x => 'game:' + x.id === d.id);
  const preview = g ? '<span class="preview" aria-hidden="true">' + (g.shot ? '<img src="' + esc(asset(g.shot)) + '" alt="" loading="lazy">' : '') +
    '<span>▶ ' + esc(g.desc) + '</span></span>' : '';
  el.innerHTML = '<span class="ico" aria-hidden="true">' + iconFor(d.id) + '</span>' + preview +
    '<span class="lbl">' + esc(d.label) + extra + '</span>';
  if (g) el.setAttribute('aria-label', 'Web ゲーム：' + g.title);
  if (findApp(d.id)) el.setAttribute('aria-label', 'アプリ：' + d.label.replace(/\s+/g, ' '));
  // 決めた位置 ＋ ほんの少しだけずらす（設計されたランダム）
  el._home = { x: clamp01(d.x + rand(-0.015, 0.015)), y: clamp01(d.y + rand(-0.015, 0.015)) };
  el._pos = savedPos[d.id] || el._home;
  entriesBox.appendChild(el);
  makeEntryDraggable(el);
  // 画面の上のほうにあるときは、プレビューを下に出す
  if (g) {
    const flip = () => {
      const r = el.getBoundingClientRect();
      el.classList.toggle('preview-left', r.left > innerWidth / 2);
      el.classList.toggle('preview-up', r.top > innerHeight - 330);
    };
    el.addEventListener('pointerenter', flip);
    el.addEventListener('focus', flip);
  }
  return el;
});

function layoutEntries() {
  if (isMobile()) { entries.forEach(el => { el.style.left = ''; el.style.top = ''; }); return; }
  const W = entriesBox.clientWidth, H = entriesBox.clientHeight;
  entries.forEach(el => {
    el.style.left = Math.round(el._pos.x * Math.max(0, W - el.offsetWidth)) + 'px';
    el.style.top = Math.round(el._pos.y * Math.max(0, H - el.offsetHeight)) + 'px';
  });
}
function savePositions() {
  const o = {};
  entries.forEach(el => { if (el._pos !== el._home) o[el.dataset.id] = el._pos; });
  store.set(POS_KEY, o);
}

// ドラッグ：5px 未満の移動は「押した」、5px 以上は「動かした」
let suppressClickUntil = 0;
let entryZ = 1;
function makeEntryDraggable(el) {
  let start = null;
  el.addEventListener('pointerdown', e => {
    entries.forEach(x => x.classList.toggle('selected', x === el));
    if (isMobile() || e.button !== 0) return;
    const r = el.getBoundingClientRect();
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop, moved: false, w: r.width };
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* 古いブラウザ */ }
  });
  el.addEventListener('pointermove', e => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!start.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      start.moved = true;
      el.classList.add('dragging');
      el.classList.remove('settle');
      el.style.zIndex = ++entryZ;
    }
    const W = entriesBox.clientWidth, H = entriesBox.clientHeight;
    const maxX = Math.max(0, W - el.offsetWidth), maxY = Math.max(0, H - el.offsetHeight);
    const x = Math.min(maxX, Math.max(0, start.l + dx));
    const y = Math.min(maxY, Math.max(0, start.t + dy));
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el._pos = { x: maxX ? x / maxX : 0, y: maxY ? y / maxY : 0 };
  });
  const end = e => {
    if (!start || e.pointerId !== start.id) return;
    if (start.moved) {
      el.classList.remove('dragging');
      savePositions();
      suppressClickUntil = performance.now() + 350;    // 動かしたあとの「押した」は無視
    }
    start = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}
// ドラッグ直後の「押した」を止める（リンクの履歴書も開かないように）
document.addEventListener('click', e => {
  if (performance.now() < suppressClickUntil && e.target.closest('.entry')) { e.preventDefault(); e.stopPropagation(); }
}, true);

function resetDesk() {
  store.del(POS_KEY);
  entries.forEach(el => { el._pos = el._home; el.classList.add('settle'); });
  layoutEntries();
  setTimeout(() => entries.forEach(el => el.classList.remove('settle')), 500);
  say('アイコンを最初の位置に並べ直しました');
}
desk.addEventListener('pointerdown', e => {
  if (!e.target.closest('.entry')) entries.forEach(x => x.classList.remove('selected'));
});

/* ==========================================================================
   ウィンドウ（シート）
   ========================================================================== */
const tabsBox = $('#tabs');
const sheets = new Map();
let zTop = 100, cascade = 0, uid = 0;

function openSheet(id, o) {
  let el = sheets.get(id);
  if (el) {
    if (o.refresh) {
      setSheetTitle(el, o.title);
      $('.sheet-body', el).innerHTML = o.body;
      if (o.status !== undefined) $('.sheet-foot', el).textContent = o.status;
      if (o.init) o.init(el);
    }
    showSheet(el, true);
    return el;
  }
  const tid = 'sheet-t-' + (++uid);
  el = document.createElement('section');
  const ico = SVG[KIND_ICON[o.kind] || 'folder'];
  el.className = 'sheet win out' + (o.cls ? ' ' + o.cls : '');
  el.dataset.id = id;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', tid);
  el.innerHTML =
    '<header class="sheet-bar titlebar"><span class="t-ico" aria-hidden="true">' + ico + '</span>' +
    '<h2 class="sheet-title" id="' + tid + '" tabindex="-1">' + esc(o.title) + '</h2>' +
    '<button class="btn sbtn" data-act="min" aria-label="最小化"><span aria-hidden="true">_</span></button>' +
    '<button class="btn sbtn" data-act="close" aria-label="閉じる"><span aria-hidden="true">×</span></button></header>' +
    (o.menu ? '<div class="menubar" aria-hidden="true"><span>ファイル</span><span>編集</span><span>表示</span><span>ヘルプ</span></div>' : '') +
    '<div class="sheet-body' + (o.inset === false ? '' : ' in') + '">' + o.body + '</div>' +
    (o.status !== undefined ? '<div class="sheet-foot statusbar">' + esc(o.status) + '</div>' : '');
  if (o.node) $('.sheet-body', el).appendChild(o.node);
  el._opener = document.activeElement;
  el.style.visibility = 'hidden';
  if (o.before) desk.insertBefore(el, o.before); else desk.appendChild(el);
  el.style.width = Math.min(o.w || 600, desk.clientWidth - 24) + 'px';

  // タスクバーに「開いているもの」として並べる
  const tab = document.createElement('button');
  tab.className = 'btn tab';
  tab.innerHTML = '<span class="tk" aria-hidden="true">' + ico + '</span><span class="tl">' + esc(o.title) + '</span>';
  tab.addEventListener('click', () => {
    if (el.hidden) showSheet(el, true);
    else if (el.classList.contains('active')) minimize(el);
    else showSheet(el, true);
  });
  tabsBox.appendChild(tab);
  el._tab = tab;

  el.addEventListener('pointerdown', () => { if (!el.classList.contains('active')) focusSheet(el); });
  el.addEventListener('focusin', () => { if (!el.classList.contains('active')) focusSheet(el); });
  $('[data-act="close"]', el).addEventListener('click', () => closeSheet(id));
  $('[data-act="min"]', el).addEventListener('click', () => minimize(el));
  makeSheetDraggable(el);
  sheets.set(id, el);
  if (o.init) o.init(el);

  // 位置：中身が入ってから測る。真ん中 or 少しずつずらして重ねる
  const W = desk.clientWidth, H = desk.clientHeight;
  const step = o.center ? 0 : (cascade++ % 5) * 28;
  el.style.left = Math.max(8, Math.min((W - el.offsetWidth) / 2 + step - (o.center ? 0 : 50), W - el.offsetWidth - 8)) + 'px';
  el.style.top = Math.max(8, Math.min((H - el.offsetHeight) / 2 + step - (o.center ? 10 : 40), H - el.offsetHeight - 8)) + 'px';
  el.style.visibility = '';
  showSheet(el, !o.noFocus);
  updateNav();
  return el;
}
function setSheetTitle(el, t) {
  $('.sheet-title', el).textContent = t;
  $('.tl', el._tab).textContent = t;
}
function showSheet(el, moveFocus) {
  el.hidden = false;
  el._tab.classList.remove('is-min');
  focusSheet(el);
  if (moveFocus) $('.sheet-title', el).focus({ preventScroll: true });
  updateNav();
}
function focusSheet(el) {
  sheets.forEach(s => { s.classList.remove('active'); s._tab.setAttribute('aria-pressed', 'false'); s._tab.classList.remove('pressed'); });
  el.style.zIndex = ++zTop;
  el.classList.add('active');
  el._tab.setAttribute('aria-pressed', 'true');
  el._tab.classList.add('pressed');
  if (el._onFocus) el._onFocus();
}
function minimize(el) {
  el.hidden = true;
  el.classList.remove('active');
  el._tab.setAttribute('aria-pressed', 'false');
  el._tab.classList.remove('pressed');
  el._tab.classList.add('is-min');
  if (el._onHide) el._onHide();
  const top = topSheet();
  if (top) focusSheet(top);
  el._tab.focus();
  updateNav();
}
function closeSheet(id) {
  const el = sheets.get(id);
  if (!el) return;
  const hadFocus = el.contains(document.activeElement);
  if (el._cleanup) el._cleanup();
  el._tab.remove();
  el.remove();
  sheets.delete(id);
  const top = topSheet();
  if (top) focusSheet(top);
  if (hadFocus || document.activeElement === document.body) {
    const op = el._opener;
    if (op && op.isConnected && op.offsetParent !== null && !op.closest('[hidden]')) op.focus({ preventScroll: true });
    else if (top) $('.sheet-title', top).focus({ preventScroll: true });
  }
  updateNav();
}
function topSheet() {
  let best = null;
  sheets.forEach(s => {
    if (s.hidden || (isMobile() && s.classList.contains('is-welcome'))) return;   // スマホのようこそはホーム画面の一部
    if (!best || +s.style.zIndex > +best.style.zIndex) best = s;
  });
  return best;
}
// 中身が大きくなったときに、画面の下からはみ出さないように持ち上げる
function fitSheet(el) {
  if (isMobile()) return;
  const H = desk.clientHeight;
  if (el.offsetTop + el.offsetHeight > H - 12) el.style.top = Math.max(12, H - el.offsetHeight - 12) + 'px';
}
function makeSheetDraggable(el) {
  const bar = $('.sheet-bar', el);
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || isMobile() || el.classList.contains('maxed') || e.button !== 0) return;
    focusSheet(el);
    const W = desk.clientWidth, H = desk.clientHeight;
    const sx = e.clientX, sy = e.clientY, l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth;
    bar.setPointerCapture(e.pointerId);
    bar.style.cursor = 'grabbing';
    const move = ev => {
      // ウィンドウが画面の外に行きすぎないように（タイトルバーは必ずつかめる位置に）
      const x = Math.min(W - 120, Math.max(120 - w, l + ev.clientX - sx));
      const y = Math.min(H - 30, Math.max(0, t + ev.clientY - sy));
      el.style.left = x + 'px'; el.style.top = y + 'px';
    };
    const up = () => {
      bar.style.cursor = '';
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  });
}
function keepSheetsInView() {
  if (isMobile()) return;
  const W = desk.clientWidth, H = desk.clientHeight;
  sheets.forEach(el => {
    el.style.width = Math.min(parseFloat(el.style.width) || el.offsetWidth, W - 24) + 'px';
    el.style.left = Math.min(Math.max(120 - el.offsetWidth, el.offsetLeft), W - 120) + 'px';
    el.style.top = Math.min(Math.max(0, el.offsetTop), Math.max(0, H - 46)) + 'px';
    fitSheet(el);
  });
}

/* ---------- スマホの「もどる・ホーム」 ---------- */
const mBack = $('#mBack');
function updateNav() { mBack.disabled = !topSheet(); }
mBack.addEventListener('click', () => { const t = topSheet(); if (t) closeSheet(t.dataset.id); });
$('#mHome').addEventListener('click', () => {
  Array.from(sheets.keys()).forEach(id => { if (id !== 'welcome') closeSheet(id); });
  desk.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
});

// Esc で一番手前のウィンドウを閉じる
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || document.fullscreenElement) return;
  if (!startMenu.hidden) { toggleStart(false); startBtn.focus(); return; }
  const t = topSheet();
  if (t) { e.preventDefault(); closeSheet(t.dataset.id); }
});

/* ==========================================================================
   中身：作品カード
   ========================================================================== */
function card(attrs, media, title, sub, badge, badgeCls) {
  return '<button class="card" ' + attrs + '><span class="ph">' +
    (badge ? '<span class="badge ' + (badgeCls || '') + '">' + badge + '</span>' : '') + media + '</span>' +
    '<b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</button>';
}
function catCards(id) {
  if (id === 'web') return WEB.map((w, i) => card('data-open="web" data-index="' + i + '"', shotMedia(w.shot, w.title, 'web'), w.title, w.desc));
  if (id === 'app') return APPS.map(a => card('data-open="app:' + esc(a.id) + '"', shotMedia(a.shot, a.title, 'web'), a.title, a.desc));
  if (id === 'game') return GAMES.map(g => card('data-open="game:' + esc(g.id) + '"', shotMedia(g.shot, g.title, 'game'), g.title, g.desc));
  if (id === 'uiux') return UIUX.map(p => card('data-view="' + p.id + '" data-i="0"', imgTag(p.items[0].src, 'sm', p.title), p.title, p.sub));
  const set = id === 'univ' ? UNIV : ILLUST;
  return set.map((it, i) => card('data-view="' + id + '" data-i="' + i + '"', imgTag(it.src, 'sm', it.cap), it.cap));
}
const catSection = id => '<section class="cat" data-cat="' + id + '"><h3 class="cat-h">' + esc(catLabel(id)) +
  ' <small>' + catCards(id).length + ' WORKS</small></h3><div class="cards">' + catCards(id).join('') + '</div></section>';

function openWorks(cat) {
  const chips = [{ id: 'all', label: 'すべて' }].concat(CATS).map(c =>
    '<button class="chip" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + '</button>').join('');
  const el = openSheet('works', {
    title: 'すべての作品', kind: 'FOLDER', w: 860, menu: true, status: countWorks() + ' 件の作品',
    body: '<div class="filters" role="group" aria-label="作品の分類">' + chips + '</div>' + CATS.map(c => catSection(c.id)).join(''),
    init: sheet => {
      sheet._filter = c => {
        $$('.chip', sheet).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === c)));
        $$('.cat', sheet).forEach(s => { s.hidden = !(c === 'all' || s.dataset.cat === c); });
        $('.sheet-body', sheet).scrollTop = 0;
      };
      $$('.chip', sheet).forEach(b => b.addEventListener('click', () => sheet._filter(b.dataset.cat)));
      sheet._filter('all');
    },
  });
  if (cat) el._filter(cat);
}

function openFolder(id) {
  const n = catCards(id).length;
  const lead = id === 'uiux' ? '<p class="lead">2つのプロジェクトを、画面の流れに沿ってご紹介します。</p>' : '';
  openSheet(id, {
    title: catLabel(id), kind: 'FOLDER', w: 640, menu: true,
    status: n + ' 件' + (id === 'uiux' ? '　選ぶと、画面を順番に見られます' : '　選ぶと、大きく見られます'),
    body: lead + '<div class="cards">' + catCards(id).join('') + '</div>',
  });
}

/* ==========================================================================
   中身：Web制作（ブラウザ風・自動で切り替わるカルーセル）
   ========================================================================== */
function slideHTML(s, i, n) {
  const tags = (s.tags || []).length ? '<ul class="tags" aria-label="使用技術">' + s.tags.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '';
  const label = (i + 1) + ' / ' + n + '：' + s.title;
  if (s.type === 'game') {
    return '<div class="slide" role="group" aria-roledescription="スライド" aria-label="' + esc(label) + '">' +
      '<button class="shot" data-open="game:' + esc(s.id) + '">' + shotMedia(s.shot, s.title, 'game') + '</button>' +
      '<div class="slide-info"><p class="slide-kind">Web ゲーム</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
      '<p class="role">' + (s.control === 'keyboard' ? 'キーボードで遊ぶゲーム' : 'タッチ・マウスで遊ぶゲーム') + '</p>' +
      '<div class="slide-actions"><button class="btn" data-open="game:' + esc(s.id) + '">▶ ウィンドウで遊ぶ</button>' +
      '<a class="btn" href="' + esc(s.url) + '" target="_blank" rel="noopener">新しいタブで開く ↗</a></div></div></div>';
  }
  return '<div class="slide" role="group" aria-roledescription="スライド" aria-label="' + esc(label) + '">' +
    '<a class="shot" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + shotMedia(s.shot, s.title, 'web') +
    '<span class="sr-only">（サイトを新しいタブで開きます）</span></a>' +
    '<div class="slide-info"><p class="slide-kind">Web制作</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
    (s.role ? '<p class="role">担当：' + esc(s.role) + '</p>' : '') + tags +
    '<div class="slide-actions"><a class="btn" href="' + esc(s.url) + '" target="_blank" rel="noopener">サイトを見る ↗</a>' +
    (s.repo ? '<a class="btn" href="' + esc(s.repo) + '" target="_blank" rel="noopener">GitHub ↗</a>' : '') + '</div></div></div>';
}

function openWeb(start) {
  const existing = sheets.get('web');
  if (existing) { showSheet(existing, true); if (start !== null) existing._show(start); return; }
  const n = SLIDES.length;
  openSheet('web', {
    title: 'Web制作 - ブラウザ', kind: 'BROWSER', w: 700, inset: false,
    status: '画像を選ぶと、サイトが新しいタブで開きます',
    body:
      '<div class="addr"><span aria-hidden="true">アドレス</span>' +
      '<span class="addr-field in" aria-label="表示中のサイトのアドレス"></span>' +
      '<a class="btn addr-go" target="_blank" rel="noopener">開く ↗</a></div>' +
      '<div class="car" role="region" aria-roledescription="カルーセル" aria-label="' + (GAMES.length ? 'Web制作とWeb ゲーム' : 'Web制作') + '">' +
      '<div class="car-view in"><div class="car-track">' + SLIDES.map((s, i) => slideHTML(s, i, n)).join('') + '</div></div>' +
      '<div class="car-nav"><button class="btn car-arrow prev" aria-label="前の作品">‹</button>' +
      '<button class="btn car-arrow next" aria-label="次の作品">›</button></div>' +
      '<div class="dots">' + SLIDES.map((s, i) =>
        '<button class="dot" aria-label="' + (i + 1) + '番目：' + esc(s.title) + '"></button>').join('') + '</div></div>',
    init: el => initCarousel(el, start || 0),
  });
}

function initCarousel(el, start) {
  const car = $('.car', el), track = $('.car-track', el);
  const slides = $$('.slide', el), dots = $$('.dot', el);
  const addr = $('.addr-field', el), go = $('.addr-go', el);
  const n = slides.length;
  let index = 0, timer = null, hovering = false, focused = false;

  function show(i) {
    index = ((i % n) + n) % n;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    slides.forEach((s, k) => {
      const on = k === index;
      s.setAttribute('aria-hidden', String(!on));
      // 表示中のスライドだけ Tab で選べる
      $$('a, button', s).forEach(f => { f.tabIndex = on ? 0 : -1; });
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === index)));
    addr.textContent = absUrl(SLIDES[index].url);
    go.href = SLIDES[index].url;
  }
  const canPlay = () => !reduce && !hovering && !focused && !el.hidden && !document.hidden && el.isConnected;
  function stop() { clearInterval(timer); timer = null; }
  function play() { stop(); if (canPlay()) timer = setInterval(() => show(index + 1), CAROUSEL_INTERVAL); }
  const user = i => { show(i); play(); };

  $('.prev', el).addEventListener('click', () => user(index - 1));
  $('.next', el).addEventListener('click', () => user(index + 1));
  dots.forEach((d, k) => d.addEventListener('click', () => user(k)));
  // マウスが乗っている間・キーボードで選んでいる間は止める
  car.addEventListener('mouseenter', () => { hovering = true; stop(); });
  car.addEventListener('mouseleave', () => { hovering = false; play(); });
  car.addEventListener('focusin', () => { focused = true; stop(); });
  car.addEventListener('focusout', e => { if (!car.contains(e.relatedTarget)) { focused = false; play(); } });
  const onVis = () => play();
  document.addEventListener('visibilitychange', onVis);

  // スマホは左右にスワイプ
  let sx = null, sy = 0;
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; stop(); }, { passive: true });
  track.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    play();
  });

  el._show = i => { show(i); play(); };
  el._onFocus = play;
  el._onHide = stop;
  el._cleanup = () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  show(start);
  play();
}

/* ==========================================================================
   中身：アプリ（スマホの形のウィンドウの中で、実際に操作できる）
   ========================================================================== */
function openApp(id) {
  const a = APPS.find(x => x.id === id);
  if (!a) return;
  const tags = (a.tags || []).length ? '<ul class="tags" aria-label="使用技術">' + a.tags.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '';
  openSheet('app:' + id, {
    title: a.title, kind: 'APP', w: 720, inset: false, cls: 'app-win',
    status: 'スマホ版の画面です。そのまま操作できます（見本のデータが入っています）',
    body:
      '<div class="app-layout"><div class="phone"><iframe src="' + esc(a.url) + '" title="' + esc(a.title) + '（アプリ）"></iframe></div>' +
      '<div class="app-info"><p class="slide-kind">アプリ開発</p><h3>' + esc(a.title) + '</h3><p>' + esc(a.desc) + '</p>' +
      (a.role ? '<p class="role">担当：' + esc(a.role) + '</p>' : '') + tags +
      '<div class="row"><a class="btn" href="' + esc(a.url) + '" target="_blank" rel="noopener">新しいタブで開く ↗</a>' +
      (a.repo ? '<a class="btn" href="' + esc(a.repo) + '" target="_blank" rel="noopener">GitHub ↗</a>' : '') + '</div></div></div>',
    init: el => {
      const frame = $('iframe', el);
      // アプリの中で Esc を押したら、アプリから抜けてページの操作にもどる（同じサイト内のみ）
      frame.addEventListener('load', () => {
        try {
          frame.contentWindow.addEventListener('keydown', ev => { if (ev.key === 'Escape') $('[data-act="close"]', el).focus(); });
        } catch (e) { /* 別ドメインのアプリ */ }
      });
    },
  });
}

/* ==========================================================================
   中身：Web ゲーム（タイトル画面 → 押してから読み込む）
   ========================================================================== */
function openGame(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  openSheet('game:' + id, { title: g.title + ' - ゲーム', kind: 'GAME', w: 760, body: '', init: el => gameTitle(el, g) });
}
function gameTitle(el, g) {
  const pcOnly = g.control === 'keyboard' && (isMobile() || touchOnly());
  const body = $('.sheet-body', el);
  body.innerHTML =
    '<div class="g-title"><' + (pcOnly ? 'div' : 'button tabindex="-1"') + ' class="g-shot in">' +
    (g.shot ? '<img src="' + esc(asset(g.shot)) + '" alt="' + esc(g.title) + 'のタイトル画面">' : shotMedia('', g.title, 'game')) +
    '</' + (pcOnly ? 'div' : 'button') + '>' +
    '<div class="g-meta"><p class="g-ctrl">' + (g.control === 'keyboard' ? 'キーボードで遊ぶゲーム' : 'タッチ・マウスで遊ぶゲーム') + '</p>' +
    '<h3>' + esc(g.title) + '</h3><p>' + esc(g.desc) + '</p>' +
    (pcOnly ? '<p class="g-pc">このゲームはPCで遊べます</p>' : '') +
    '<div class="row">' + (pcOnly ? '' : '<button class="btn g-start">プレイする</button>') +
    '<a class="btn" href="' + esc(g.url) + '" target="_blank" rel="noopener">新しいタブで開く ↗</a></div></div></div>';
  const startBtn = $('.g-start', body);
  if (startBtn) {
    startBtn.addEventListener('click', () => gamePlay(el, g));
    $('.g-shot', body).addEventListener('click', () => gamePlay(el, g));   // 画面を押しても始まる
  }
  el._cleanup = null;
  fitSheet(el);
}
function gamePlay(el, g) {
  const kb = g.control === 'keyboard';
  const body = $('.sheet-body', el);
  body.innerHTML =
    '<div class="g-play"><div class="g-stage in">' +
    '<iframe src="' + esc(g.url) + '" title="' + esc(g.title) + '（ゲーム）" allow="fullscreen; autoplay"></iframe>' +
    (kb ? '<button class="g-cover"><b>▶ ここを押して操作をはじめる</b><small>矢印キーやスペースキーは、ゲームの中だけで使われます</small></button>' : '') +
    '</div><div class="g-tools"><button class="btn g-full">⛶ 全画面</button>' +
    '<a class="btn" href="' + esc(g.url) + '" target="_blank" rel="noopener">新しいタブで開く ↗</a>' +
    '<button class="btn g-back">タイトルにもどる</button></div></div>';
  const stage = $('.g-stage', body), frame = $('iframe', body), full = $('.g-full', body), cover = $('.g-cover', body);
  fitSheet(el);
  const focusGame = () => { try { frame.focus(); frame.contentWindow.focus(); } catch (e) { /* 別ドメインのゲーム */ } };
  if (cover) { cover.addEventListener('click', () => { cover.remove(); focusGame(); }); cover.focus(); }
  frame.addEventListener('load', () => {
    if (!cover) focusGame();
    // ゲームの中で Esc を押したら、ゲームから抜けてページの操作にもどる（同じサイト内のゲームのみ）
    try {
      frame.contentWindow.addEventListener('keydown', ev => {
        if (ev.key !== 'Escape') return;
        if (el.classList.contains('maxed')) { el.classList.remove('maxed'); label(); }
        full.focus();
      });
    } catch (e) { /* 別ドメインのゲーム */ }
  });

  const label = () => { full.textContent = (document.fullscreenElement === stage || el.classList.contains('maxed')) ? '⛶ もとに戻す' : '⛶ 全画面'; };
  full.addEventListener('click', () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.classList.contains('maxed')) { el.classList.remove('maxed'); label(); return; }
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    const fallback = () => { el.classList.add('maxed'); label(); focusSheet(el); };
    if (!req) { fallback(); return; }
    try { Promise.resolve(req.call(stage)).then(focusGame, fallback); } catch (e) { fallback(); }
  });
  const onFs = () => label();
  document.addEventListener('fullscreenchange', onFs);
  $('.g-back', body).addEventListener('click', () => { cleanup(); gameTitle(el, g); $('.g-start', el) && $('.g-start', el).focus(); });
  function cleanup() {
    document.removeEventListener('fullscreenchange', onFs);
    if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
    el.classList.remove('maxed');
  }
  el._cleanup = cleanup;
}

/* ==========================================================================
   中身：画像ビューア（前へ・次へ・矢印キー・スワイプ）
   ========================================================================== */
let view = null;
function openViewer(setId, i) {
  const set = SETS[setId];
  if (!set) return;
  const n = set.items.length;
  i = ((i % n) + n) % n;
  const title = set.title + (set.sub ? ' — ' + set.sub : '');
  let el = sheets.get('viewer');
  if (!el || el._set !== setId) {
    const body = '<div class="viewer"><div class="v-stage in"><img class="v-img" alt=""></div>' +
      '<div class="v-bar"><button class="btn v-prev">‹ 前へ</button>' +
      '<p class="v-cap"><span class="v-text"></span><span class="v-count"></span></p>' +
      '<button class="btn v-next">次へ ›</button></div>' +
      (n > 1 ? '<div class="v-thumbs" role="group" aria-label="一覧">' + set.items.map((it, k) =>
        '<button class="v-thumb" data-k="' + k + '" aria-label="' + (k + 1) + '枚目：' + esc(it.cap || set.title) + '">' +
        imgTag(it.src, 'sm', '') + '</button>').join('') + '</div>' : '') + '</div>';
    el = openSheet('viewer', { title, kind: 'VIEWER', w: 900, refresh: true, inset: false, body, init: initViewer, status: '← → キー・スワイプでもめくれます' });
    el._set = setId;
  } else {
    showSheet(el, false);
  }
  view = { setId, i };
  const it = set.items[i];
  const img = $('.v-img', el), stage = $('.v-stage', el);
  img.classList.remove('img-missing');
  img.onload = () => { stage.classList.toggle('tall', img.naturalHeight / img.naturalWidth > 1.8); };
  img.dataset.fallback = orig(it.src);
  img.src = pic(it.src, 'md');
  img.alt = (it.cap || set.title) + '（' + (i + 1) + ' / ' + n + '）';
  stage.scrollTop = 0;
  $('.v-text', el).textContent = it.cap || set.title;
  $('.v-count', el).textContent = (i + 1) + ' / ' + n;
  $$('.v-thumb', el).forEach((b, k) => {
    b.setAttribute('aria-current', String(k === i));
    if (k === i) { const box = b.parentElement; box.scrollLeft = b.offsetLeft - (box.clientWidth - b.offsetWidth) / 2; }
  });
  // 次の画像を先に読み込んでおく
  [i + 1, i - 1].forEach(k => { const nx = set.items[((k % n) + n) % n]; if (nx) new Image().src = pic(nx.src, 'md'); });
  return el;
}
function initViewer(el) {
  const step = d => { if (view) { openViewer(view.setId, view.i + d); say($('.v-text', el).textContent + ' ' + $('.v-count', el).textContent); } };
  $('.v-prev', el).addEventListener('click', () => step(-1));
  $('.v-next', el).addEventListener('click', () => step(1));
  $$('.v-thumb', el).forEach(b => b.addEventListener('click', () => openViewer(view.setId, +b.dataset.k)));
  const stage = $('.v-stage', el);
  let sx = null, sy = 0;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  });
  el._step = step;
}
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const el = sheets.get('viewer');
  if (!el || el.hidden || topSheet() !== el || e.altKey || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  el._step(e.key === 'ArrowLeft' ? -1 : 1);
});

/* ==========================================================================
   中身：私について・お問い合わせ
   ========================================================================== */
function openAbout() {
  openSheet('about', {
    title: '私について.txt - メモ帳', kind: 'TEXT', w: 660,
    body:
      '<div class="about"><figure class="about-photo">' + imgTag(PROFILE.avatar, 'sm', 'ルオ ジアウェンの写真', false) + '</figure><div>' +
      '<h3 class="about-name">' + esc(PROFILE.name) + '</h3>' +
      PROFILE.bio.map(p => '<p>' + esc(p) + '</p>').join('') +
      '<div class="row"><a class="btn" href="' + esc(asset(PROFILE.resume)) + '" target="_blank" rel="noopener">履歴書をダウンロード</a></div></div></div>' +
      '<section class="exp out"><h3>経歴 / Experience</h3><ol class="timeline">' + EXPERIENCE.map(x =>
        '<li><p class="t-period">' + esc(x.period) + '</p><p class="t-title">' + esc(x.title) + '</p><p class="t-text">' + esc(x.text) + '</p></li>').join('') +
      '</ol></section>',
  });
}
function openContact() {
  const mail = PROFILE.email;
  const href = 'mailto:' + mail + '?subject=' + encodeURIComponent('お仕事のご相談');
  const el = openSheet('contact', {
    title: 'お問い合わせ - 新規メッセージ', kind: 'MAIL', w: 520, inset: false,
    body:
      '<div class="mail">' +
      '<dl class="mail-head"><div><dt>宛先:</dt><dd class="in"><a href="' + esc(href) + '">' + esc(mail) + '</a></dd></div>' +
      '<div><dt>件名:</dt><dd class="in">お仕事のご相談</dd></div></dl>' +
      '<div class="mail-body in"><p class="mail-lead">' + esc(PROFILE.contactLead) + '</p>' +
      '<p class="mail-thanks">' + esc(PROFILE.thanks) + '</p></div>' +
      '<div class="row"><a class="btn" href="' + esc(href) + '">メールを書く</a>' +
      '<button class="btn mail-copy">アドレスをコピー</button></div></div>',
  });
  const copy = $('.mail-copy', el);
  copy.onclick = () => {
    const done = ok => { copy.textContent = ok ? 'コピーしました' : 'コピーできませんでした'; say(copy.textContent); setTimeout(() => { copy.textContent = 'アドレスをコピー'; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(() => done(true), () => done(false));
    else done(false);
  };
}

/* ==========================================================================
   どこから押しても同じように開く
   ========================================================================== */
function open(id, d) {
  d = d || {};
  toggleStart(false);
  if (id === 'welcome') return openWelcome();
  if (id === 'works') return openWorks(d.cat);
  if (id === 'web') return openWeb(d.index !== undefined ? +d.index : null);
  if (id.indexOf('game:') === 0) return openGame(id.slice(5));
  if (id.indexOf('app:') === 0) return openApp(id.slice(4));
  if (id === 'uiux' || id === 'univ' || id === 'illust') return openFolder(id);
  if (id === 'about') return openAbout();
  if (id === 'contact') return openContact();
}
document.addEventListener('click', e => {
  const v = e.target.closest('[data-view]');
  if (v) { openViewer(v.dataset.view, +v.dataset.i || 0); return; }
  const o = e.target.closest('[data-open]');
  if (o) open(o.dataset.open, o.dataset);
});

/* ==========================================================================
   ようこそ.exe（自己紹介）
   ========================================================================== */
const hero = $('#hero');
function openWelcome(first) {
  openSheet('welcome', {
    title: 'ようこそ.exe', kind: 'WELCOME', w: 580, center: true, cls: 'is-welcome',
    body: '', node: hero, before: entriesBox, noFocus: !!first, inset: false,
  });
}

/* ==========================================================================
   スタートメニュー・時計
   ========================================================================== */
const startBtn = $('#startBtn');
const startMenu = $('#startMenu');
startBtn.innerHTML = SVG.pc + '<span>スタート</span>';
$$('[data-ico]').forEach(s => { s.innerHTML = SVG[s.dataset.ico]; });
$('#smList').innerHTML =
  DESK_ITEMS.map(d => d.id === 'resume'
    ? '<a role="menuitem" href="' + esc(asset(PROFILE.resume)) + '" target="_blank" rel="noopener">' + SVG.pdf + '<span>履歴書をダウンロード</span></a>'
    : '<button role="menuitem" data-open="' + esc(d.id) + '">' + iconFor(d.id) + '<span>' + esc(d.label) + '</span></button>').join('') +
  '<div class="sm-sep" role="separator"></div>' +
  '<button role="menuitem" data-open="welcome">' + SVG.pc + '<span>ようこそ画面</span></button>' +
  '<button role="menuitem" id="resetIcons">' + SVG.pc + '<span>アイコンを並べ直す</span></button>';
$('#resetIcons').addEventListener('click', () => { resetDesk(); toggleStart(false); });
function toggleStart(force) {
  const show = force !== undefined ? force : startMenu.hidden;
  if (show === !startMenu.hidden) return;
  startMenu.hidden = !show;
  startBtn.classList.toggle('pressed', show);
  startBtn.setAttribute('aria-expanded', String(show));
  if (show) { startMenu.style.zIndex = ++zTop + 1000; $('#smList > *').focus(); }
}
startBtn.addEventListener('click', e => { e.stopPropagation(); toggleStart(); });
document.addEventListener('pointerdown', e => {
  if (!startMenu.hidden && !startMenu.contains(e.target) && !startBtn.contains(e.target)) toggleStart(false);
});
// メニューの中は上下キーで移動できる
startMenu.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = $$('#smList > a, #smList > button');
  const k = items.indexOf(document.activeElement);
  items[(k + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
});
startMenu.addEventListener('focusout', e => { if (!startMenu.contains(e.relatedTarget) && e.relatedTarget !== startBtn) toggleStart(false); });
const clock = $('#clock');
function tick() { const d = new Date(); clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
tick(); setInterval(tick, 20000);

// PC ではデスクトップがスクロールしないように（フォーカス移動などで勝手に動くのを防ぐ）
desk.addEventListener('scroll', () => { if (!isMobile() && (desk.scrollTop || desk.scrollLeft)) desk.scrollTop = desk.scrollLeft = 0; });

/* ---------- 画面サイズが変わったとき ---------- */
let rz = 0;
addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layoutEntries(); keepSheetsInView(); }); });
layoutEntries();
openWelcome(true);
// フォントが読み込まれて大きさが変わったら並べ直す
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutEntries);
updateNav();
})();
