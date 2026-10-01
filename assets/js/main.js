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
const ICON = {
  close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>',
  min: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 12h10"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
};

/* ---------- 画像のまとまり（ビューアで順番に見る） ---------- */
const SETS = {};
UIUX.forEach(p => { SETS[p.id] = { title: p.title, sub: p.sub, items: p.items }; });
SETS.univ = { title: '大学時代のデザイン', items: UNIV };
SETS.illust = { title: 'イラスト', items: ILLUST };
const catLabel = id => (CATEGORIES.find(c => c.id === id) || {}).label || id;

// カルーセルに並べるもの：Web制作 ＋ ゲーム（ゲームも見逃さないように）
const SLIDES = WEB.map(w => Object.assign({ type: 'web' }, w))
  .concat(GAMES.map(g => Object.assign({ type: 'game' }, g)));

/* ==========================================================================
   開始の演出
   ========================================================================== */
const intro = $('#intro');
function ready() { document.body.classList.add('ready'); }
function endIntro() {
  if (!intro.isConnected || intro.classList.contains('out')) return;
  intro.classList.add('out');
  ready();
  setTimeout(() => intro.remove(), 400);
}
let seen = false;
try { seen = sessionStorage.getItem('luo-intro') === '1'; sessionStorage.setItem('luo-intro', '1'); } catch (e) { /* 気にしない */ }
if (reduce || seen) { intro.remove(); ready(); }
else {
  const dur = isMobile() ? 850 : 1500;           // スマホは短めに
  intro.style.setProperty('--d', dur + 'ms');
  setTimeout(endIntro, dur + 200);
  intro.addEventListener('pointerdown', endIntro);
  addEventListener('keydown', endIntro, { once: true });
}

/* ==========================================================================
   机の上の作品（ドラッグで動かせる・位置は保存）
   ========================================================================== */
const desk = $('#desk');
const entriesBox = $('#entries');
const POS_KEY = 'luo-desk-pos-v1';
const savedPos = store.get(POS_KEY) || {};
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.min(1, Math.max(0, v));

function thing(id) {
  if (id === 'web') {
    const w = WEB[0];
    return '<span class="o-browser"><span class="o-bar"><i></i><i></i><i></i></span><span class="o-screen">' +
      (w && w.shot ? '<img src="' + esc(asset(w.shot)) + '" alt="">' : '') + '<span class="o-www">www</span></span></span>';
  }
  if (id.indexOf('game:') === 0) {
    const g = GAMES.find(x => 'game:' + x.id === id) || {};
    const color = ['var(--pink)', 'var(--blue)', 'var(--red)', '#3ccf8e'][GAMES.indexOf(g) % 4];
    return '<span class="o-cart"><span class="o-cart-label" style="--c:' + color + '">' +
      (g.shot ? '<img src="' + esc(asset(g.shot)) + '" alt="">' : '<span style="flex:1"></span>') +
      '<b>GAME</b></span></span><span class="o-cart-play">PLAY ▶</span>';
  }
  if (id === 'uiux') {
    return '<span class="o-tabs">' + UIUX.slice(0, 2).reverse().map(p =>
      '<span class="o-tab"><img src="' + pic(p.items[0].src, 'sm') + '" data-fallback="' + orig(p.items[0].src) + '" alt=""></span>').join('') + '</span>';
  }
  if (id === 'illust') {
    return '<span class="o-sketch"><img src="' + pic(ILLUST[0].src, 'sm') + '" data-fallback="' + orig(ILLUST[0].src) + '" alt=""></span>';
  }
  if (id === 'univ') {
    return '<span class="o-polas">' + [UNIV[3], UNIV[1]].filter(Boolean).map(it =>
      '<span class="o-pola"><img src="' + pic(it.src, 'sm') + '" data-fallback="' + orig(it.src) + '" alt=""></span>').join('') + '</span>';
  }
  if (id === 'works') {
    return '<span class="o-folder"><span class="o-folder-paper"></span><span class="o-folder-paper"></span>' +
      '<span class="o-folder-front"><b>WORKS</b><small>ALL ' + countWorks() + '</small></span></span>';
  }
  if (id === 'about') {
    return '<span class="o-id"><span class="o-id-head"><span>ID</span><span>PROFILE</span></span>' +
      '<img src="' + pic(PROFILE.avatar, 'sm') + '" data-fallback="' + orig(PROFILE.avatar) + '" alt="">' +
      '<span class="o-id-lines"><i></i><i></i><i></i><i></i></span></span>';
  }
  if (id === 'contact') {
    return '<span class="o-mail"><svg viewBox="0 0 100 64" preserveAspectRatio="none"><path d="M0 0L50 36L100 0" fill="none" stroke="#1d1d1b" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="o-mail-stamp">〒</span></span>';
  }
  if (id === 'resume') {
    return '<span class="o-doc"><b>履歴書</b><i></i><i></i><i></i><i></i><i></i><span class="o-doc-pdf">PDF</span></span>';
  }
  return '';
}
function countWorks() { return WEB.length + GAMES.length + UIUX.length + UNIV.length + ILLUST.length; }

const entries = DESK.map((d, i) => {
  const isLink = d.id === 'resume';
  const el = document.createElement(isLink ? 'a' : 'button');
  el.className = 'entry';
  el.dataset.id = d.id;
  el.style.setProperty('--r', rand(-7, 7).toFixed(1) + 'deg');   // 角度だけランダム
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
  el.innerHTML = '<span class="thing" aria-hidden="true">' + thing(d.id) + '</span>' + preview +
    '<span class="tape">' + esc(d.label) + extra + '</span>';
  if (g) el.setAttribute('aria-label', d.label + '（Web ゲーム）');
  // 決めた位置 ＋ ほんの少しだけずらす（設計されたランダム）
  el._home = { x: clamp01(d.x + rand(-0.012, 0.012)), y: clamp01(d.y + rand(-0.012, 0.012)) };
  el._pos = savedPos[d.id] || el._home;
  entriesBox.appendChild(el);
  makeEntryDraggable(el);
  // 画面の上のほうにあるときは、プレビューを下に出す
  if (g) {
    const flip = () => el.classList.toggle('preview-below', el.getBoundingClientRect().top < 280);
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
  say('作品を最初の位置に並べ直しました');
}
$('#resetDesk').addEventListener('click', resetDesk);

/* ==========================================================================
   ウィンドウ（シート）
   ========================================================================== */
const tabsBox = $('#tabs');
const sheets = new Map();
let zTop = 100, cascade = 0, uid = 0;
const KIND_COLOR = { FOLDER: 'var(--yellow)', BROWSER: '#8fc1ff', GAME: '#ff9f9c', VIEWER: '#ffb3d8', TEXT: '#fff', MAIL: '#b9ebd2' };

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
  el.className = 'sheet';
  el.dataset.id = id;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', tid);
  el.style.setProperty('--k', KIND_COLOR[o.kind] || '#fff');
  el.innerHTML =
    '<header class="sheet-bar"><span class="sheet-kind" aria-hidden="true">' + o.kind + '</span>' +
    '<h2 class="sheet-title" id="' + tid + '" tabindex="-1">' + esc(o.title) + '</h2>' +
    '<button class="sbtn" data-act="min" aria-label="しまう">' + ICON.min + '</button>' +
    '<button class="sbtn" data-act="close" aria-label="閉じる">' + ICON.close + '</button></header>' +
    '<div class="sheet-body">' + o.body + '</div>' +
    (o.status !== undefined ? '<div class="sheet-foot">' + esc(o.status) + '</div>' : '');
  el._opener = document.activeElement;
  el.style.visibility = 'hidden';
  desk.appendChild(el);
  el.style.width = Math.min(o.w || 600, desk.clientWidth - 24) + 'px';

  // 下の定規に「開いているもの」として並べる
  const tab = document.createElement('button');
  tab.className = 'rbtn tab';
  tab.style.setProperty('--k', KIND_COLOR[o.kind] || '#fff');
  tab.innerHTML = '<span class="tk" aria-hidden="true">' + o.kind.slice(0, 1) + '</span><span class="tl">' + esc(o.title) + '</span>';
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

  // 位置：中身が入ってから測って、中央から少しずつずらして重ねる
  const W = desk.clientWidth, H = desk.clientHeight;
  const step = (cascade++ % 5) * 30;
  el.style.left = Math.max(12, Math.min((W - el.offsetWidth) / 2 + step - 60, W - el.offsetWidth - 12)) + 'px';
  el.style.top = Math.max(12, Math.min((H - el.offsetHeight) / 2 + step - 50, H - el.offsetHeight - 12)) + 'px';
  el.style.visibility = '';
  showSheet(el, true);
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
  sheets.forEach(s => { s.classList.remove('active'); s._tab.setAttribute('aria-pressed', 'false'); });
  el.style.zIndex = ++zTop;
  el.classList.add('active');
  el._tab.setAttribute('aria-pressed', 'true');
  if (el._onFocus) el._onFocus();
}
function minimize(el) {
  el.hidden = true;
  el.classList.remove('active');
  el._tab.setAttribute('aria-pressed', 'false');
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
  sheets.forEach(s => { if (!s.hidden && (!best || +s.style.zIndex > +best.style.zIndex)) best = s; });
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
    const W = desk.clientWidth, H = desk.clientHeight;
    const sx = e.clientX, sy = e.clientY, l = el.offsetLeft, t = el.offsetTop, w = el.offsetWidth;
    bar.setPointerCapture(e.pointerId);
    bar.style.cursor = 'grabbing';
    const move = ev => {
      // ウィンドウが画面の外に行きすぎないように（タイトルバーは必ずつかめる位置に）
      const x = Math.min(W - 120, Math.max(120 - w, l + ev.clientX - sx));
      const y = Math.min(H - 46, Math.max(0, t + ev.clientY - sy));
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
  Array.from(sheets.keys()).forEach(closeSheet);
  desk.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
});

// Esc で一番手前のウィンドウを閉じる
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || document.fullscreenElement) return;
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
  if (id === 'web') return WEB.map((w, i) => card('data-open="web" data-index="' + i + '"', shotMedia(w.shot, w.title, 'web'), w.title, w.desc, 'WEB'));
  if (id === 'game') return GAMES.map(g => card('data-open="game:' + esc(g.id) + '"', shotMedia(g.shot, g.title, 'game'), g.title, g.desc, 'PLAY ▶', 'play'));
  if (id === 'uiux') return UIUX.map(p => card('data-view="' + p.id + '" data-i="0"', imgTag(p.items[0].src, 'sm', p.title), p.title, p.sub, p.items.length + ' 枚'));
  const set = id === 'univ' ? UNIV : ILLUST;
  return set.map((it, i) => card('data-view="' + id + '" data-i="' + i + '"', imgTag(it.src, 'sm', it.cap), it.cap));
}
const catSection = id => '<section class="cat" data-cat="' + id + '"><h3 class="cat-h">' + esc(catLabel(id)) +
  ' <small>' + catCards(id).length + ' WORKS</small></h3><div class="cards">' + catCards(id).join('') + '</div></section>';

function openWorks(cat) {
  const chips = [{ id: 'all', label: 'すべて' }].concat(CATEGORIES).map(c =>
    '<button class="chip" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.label) + '</button>').join('');
  const el = openSheet('works', {
    title: '作品一覧', kind: 'FOLDER', w: 860, status: countWorks() + ' 件の作品',
    body: '<div class="filters" role="group" aria-label="作品の分類">' + chips + '</div>' + CATEGORIES.map(c => catSection(c.id)).join(''),
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
    title: catLabel(id), kind: 'FOLDER', w: 680,
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
      '<button class="shot" data-open="game:' + esc(s.id) + '">' + shotMedia(s.shot, s.title, 'game') + '<span class="shot-play" aria-hidden="true">▶ PLAY</span></button>' +
      '<div class="slide-info"><p class="slide-kind game">Web ゲーム</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
      '<p class="role">' + (s.control === 'keyboard' ? 'キーボードで遊ぶゲーム' : 'タッチ・マウスで遊ぶゲーム') + '</p>' +
      '<div class="slide-actions"><button class="btn btn-red" data-open="game:' + esc(s.id) + '">▶ ウィンドウで遊ぶ</button>' +
      '<a class="btn" href="' + esc(s.url) + '" target="_blank" rel="noopener">新しいタブで開く ↗</a></div></div></div>';
  }
  return '<div class="slide" role="group" aria-roledescription="スライド" aria-label="' + esc(label) + '">' +
    '<a class="shot" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + shotMedia(s.shot, s.title, 'web') +
    '<span class="sr-only">（サイトを新しいタブで開きます）</span></a>' +
    '<div class="slide-info"><p class="slide-kind">Web制作</p><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p>' +
    (s.role ? '<p class="role">担当：' + esc(s.role) + '</p>' : '') + tags +
    '<div class="slide-actions"><a class="btn btn-ink" href="' + esc(s.url) + '" target="_blank" rel="noopener">サイトを見る ↗</a>' +
    (s.repo ? '<a class="btn" href="' + esc(s.repo) + '" target="_blank" rel="noopener">GitHub ↗</a>' : '') + '</div></div></div>';
}

function openWeb(start) {
  const existing = sheets.get('web');
  if (existing) { showSheet(existing, true); if (start !== null) existing._show(start); return; }
  const n = SLIDES.length;
  openSheet('web', {
    title: 'Web制作', kind: 'BROWSER', w: 720,
    status: '画像を選ぶと、サイトが新しいタブで開きます',
    body:
      '<div class="addr"><span class="addr-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="addr-field" aria-label="表示中のサイトのアドレス"></span>' +
      '<a class="btn addr-go" target="_blank" rel="noopener">開く ↗</a></div>' +
      '<div class="car" role="region" aria-roledescription="カルーセル" aria-label="Web制作とWeb ゲーム">' +
      '<div class="car-view"><div class="car-track">' + SLIDES.map((s, i) => slideHTML(s, i, n)).join('') + '</div></div>' +
      '<div class="car-nav"><button class="car-arrow prev" aria-label="前の作品">' + ICON.prev + '</button>' +
      '<button class="car-arrow next" aria-label="次の作品">' + ICON.next + '</button></div>' +
      '<div class="dots">' + SLIDES.map((s, i) =>
        '<button class="dot' + (s.type === 'game' ? ' game' : '') + '" aria-label="' + (i + 1) + '番目：' + esc(s.title) + '"></button>').join('') + '</div></div>',
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
   中身：Web ゲーム（タイトル画面 → 押してから読み込む）
   ========================================================================== */
function openGame(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  openSheet('game:' + id, { title: g.title, kind: 'GAME', w: 780, body: '', init: el => gameTitle(el, g) });
}
function gameTitle(el, g) {
  const pcOnly = g.control === 'keyboard' && (isMobile() || touchOnly());
  const body = $('.sheet-body', el);
  body.innerHTML =
    '<div class="g-title"><' + (pcOnly ? 'div' : 'button tabindex="-1"') + ' class="g-shot">' +
    (g.shot ? '<img src="' + esc(asset(g.shot)) + '" alt="' + esc(g.title) + 'のタイトル画面">' : shotMedia('', g.title, 'game')) +
    '</' + (pcOnly ? 'div' : 'button') + '>' +
    '<div class="g-meta"><p class="g-ctrl">' + (g.control === 'keyboard' ? '⌨ キーボードで遊ぶ' : '☝ タッチ・マウスで遊ぶ') + '</p>' +
    '<h3>' + esc(g.title) + '</h3><p>' + esc(g.desc) + '</p>' +
    (pcOnly ? '<p class="g-pc">このゲームはPCで遊べます</p>' : '') +
    '<div class="row">' + (pcOnly ? '' : '<button class="btn btn-red g-start">▶ プレイする</button>') +
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
    '<div class="g-play"><div class="g-stage">' +
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
    const body = '<div class="viewer"><div class="v-stage"><img class="v-img" alt=""></div>' +
      '<div class="v-bar"><button class="btn v-prev">‹ 前へ</button>' +
      '<p class="v-cap"><span class="v-text"></span><span class="v-count"></span></p>' +
      '<button class="btn v-next">次へ ›</button></div>' +
      (n > 1 ? '<div class="v-thumbs" role="group" aria-label="一覧">' + set.items.map((it, k) =>
        '<button class="v-thumb" data-k="' + k + '" aria-label="' + (k + 1) + '枚目：' + esc(it.cap || set.title) + '">' +
        imgTag(it.src, 'sm', '') + '</button>').join('') + '</div>' : '') + '</div>';
    el = openSheet('viewer', { title, kind: 'VIEWER', w: 940, refresh: true, body, init: initViewer, status: '← → キー・スワイプでもめくれます' });
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
    title: '私について', kind: 'TEXT', w: 680,
    body:
      '<div class="about"><figure class="about-photo">' + imgTag(PROFILE.avatar, 'sm', 'ルオ ジアウェンの写真', false) + '</figure><div>' +
      '<p class="kicker">PROFILE</p><h3 class="about-name">' + esc(PROFILE.name) + '</h3>' +
      PROFILE.bio.map(p => '<p>' + esc(p) + '</p>').join('') +
      '<div class="row"><a class="btn btn-ink" href="' + esc(asset(PROFILE.resume)) + '" target="_blank" rel="noopener">履歴書をダウンロード</a>' +
      '<a class="btn" href="' + esc(PROFILE.aboutMe) + '" target="_blank" rel="noopener">詳しく ↗</a></div></div></div>' +
      '<section class="exp"><h3>経歴 / Experience</h3><ol class="timeline">' + EXPERIENCE.map(x =>
        '<li><p class="t-period">' + esc(x.period) + '</p><p class="t-title">' + esc(x.title) + '</p><p class="t-text">' + esc(x.text) + '</p></li>').join('') +
      '</ol></section>',
  });
}
function openContact() {
  const mail = PROFILE.email;
  const href = 'mailto:' + mail + '?subject=' + encodeURIComponent('お仕事のご相談');
  const el = openSheet('contact', {
    title: 'お問い合わせ', kind: 'MAIL', w: 560,
    body:
      '<div class="mail"><span class="mail-stamp" aria-hidden="true">〒</span>' +
      '<dl class="mail-head"><div><dt>宛先</dt><dd><a href="' + esc(href) + '">' + esc(mail) + '</a></dd></div>' +
      '<div><dt>件名</dt><dd>お仕事のご相談</dd></div></dl>' +
      '<p class="mail-lead">' + esc(PROFILE.contactLead) + '</p>' +
      '<p class="mail-thanks">' + esc(PROFILE.thanks) + '</p>' +
      '<div class="row"><a class="btn btn-ink" href="' + esc(href) + '">メールを書く</a>' +
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
  if (id === 'works') return openWorks(d.cat);
  if (id === 'web') return openWeb(d.index !== undefined ? +d.index : null);
  if (id.indexOf('game:') === 0) return openGame(id.slice(5));
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

// PC では机がスクロールしないように（フォーカス移動などで勝手に動くのを防ぐ）
desk.addEventListener('scroll', () => { if (!isMobile() && (desk.scrollTop || desk.scrollLeft)) desk.scrollTop = desk.scrollLeft = 0; });

/* ---------- 画面サイズが変わったとき ---------- */
let rz = 0;
addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layoutEntries(); keepSheetsInView(); }); });
layoutEntries();
// フォントが読み込まれて大きさが変わったら並べ直す
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutEntries);
updateNav();
})();
