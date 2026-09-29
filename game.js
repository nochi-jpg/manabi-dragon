// ===== まなびドラゴン  ゲーム本体（横画面・共通UI） =====
const $ = s => document.querySelector(s);
const stage = $('#stage');
const SPD = window.FAST ? 0.02 : 1;                          // テスト用高速化
const EL = ['国語', '算数', '理科', '社会'];               // 4すくみ：国語→算数→理科→社会→国語（矢印の先に2倍）
const SUBJ = ['国語', '算数', '理科', '社会', '英語', '保健'];
const COLOR = { 国語: '#ff4d4d', 算数: '#38bdf8', 理科: '#4ade80', 社会: '#facc15', 英語: '#818cf8', 保健: '#f472b6' };
const BTNC  = { 国語: '#dc2626', 算数: '#0284c7', 理科: '#16a34a', 社会: '#ca8a04', 英語: '#6366f1', 保健: '#db2777' };
const ICON = { 国語: '📖', 算数: '➗', 理科: '🔬', 社会: '🗾', 英語: '🔤', 保健: '💗' };
const GLYPH = { 国語: ['あ', '文', '言', '筆'], 算数: ['＋', '×', '÷', '＝', 'π'], 理科: ['⚡', '✦', '◎', '☀'], 社会: ['★', '⚔', '⛩', '🏯'], 英語: ['A', 'B', 'C', '!'] };
const DOW = ['月', '火', '水', '木', '金', '土', '日'];
const DOW_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MAXST = 9999;
const SKILL_DROP = 0.2;    // レッスン後にスキルを拾う確率
const OVERCOME = 450;      // 苦手こくふくで追加される能力（最初に正解した場合との差）
const DMG_MUL = 1.6;       // 与ダメージ倍率（試合時間の調整用）
const FINAL_DAY = 22;

// ボス設定：hp・atk・行動パターン（cd＝カウントダウンのターン数、brk＝ブレイクに必要なダメージ割合）
const STAGES = [
  { hp: 6000,  atk: 150, pat: ['attack', 'attack', 'guard', 'charge'] },
  { hp: 18000, atk: 250, pat: ['attack', 'multi', 'guard', 'charge', 'attack', 'roar'] },
  { hp: 40000, atk: 400, pat: ['attack', 'countdown', 'multi', 'haste', 'charge', 'guard', 'heal'], cd: 3, brk: 0.2 },
  { hp: 32000, hp2: 40000, atk: 520, pat: ['shift', 'multi', 'countdown', 'haste', 'charge', 'attack', 'guard'],
    pat2: ['roar', 'countdown', 'multi', 'haste', 'shift', 'charge', 'heal'], cd: 3, brk: 0.15 },
];
// 背景画像がないときのグラデーション（だんだん荒廃→火山）
const GRAD = [
  'linear-gradient(#6fb6ff,#cfe9ff 60%,#6fbf73 61%,#3f8f4a)',
  'linear-gradient(#e38b2a,#f7cf94 60%,#8a7a52 61%,#5b4a2f)',
  'linear-gradient(#2e2147,#5d4570 60%,#3a3340 61%,#1e1a24)',
  'linear-gradient(#1a0303,#7f1d1d 55%,#c2410c 62%,#1c0a05)',
];
const LESSON_GRAD = ['linear-gradient(#f5efe1,#e9dcc0 62%,#8b5a2b 63%,#6b4423)', 'linear-gradient(#e6d8bd,#cdb88f 62%,#6f4a26 63%,#4f3419)', 'linear-gradient(#9b8f86,#6f6660 62%,#3f2e22 63%,#2a1f17)'];

// ---------- 共通 ----------
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.round(n).toLocaleString();
const cap = n => Math.min(MAXST, Math.round(n));
const wait = ms => new Promise(r => setTimeout(r, ms * SPD));
let SC = 1;
function fit() { SC = Math.min(innerWidth / 1280, innerHeight / 720); stage.style.transform = `translate(-50%,-50%) scale(${SC})`; }
addEventListener('resize', fit); fit();
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 2200); }
window.imgFb = el => { const r = el.dataset.fb ? el.dataset.fb.split('|') : []; if (r.length) { el.src = r.shift(); el.dataset.fb = r.join('|'); } else el.remove(); };
function imgArt(list, emoji, cls = '', style = '') {
  return `<div class="art ${cls}" style="${style}"><img src="${list[0]}" data-fb="${list.slice(1).join('|')}" onerror="imgFb(this)" onload="this.nextElementSibling.style.display='none'" alt=""><span class="emo">${emoji}</span></div>`;
}
function setBg(img, grad) { stage.style.backgroundImage = `url("${img}"), ${grad}`; }
function strongAgainst(def) { const j = EL.indexOf(def); return j < 0 ? null : EL[(j + 3) % 4]; }
function mult(atk, def) {
  if (atk === '英語') return 1;
  const i = EL.indexOf(atk), j = EL.indexOf(def);
  if (i < 0 || j < 0) return 1;
  if ((i + 1) % 4 === j) return 2;
  if ((j + 1) % 4 === i) return 0.5;
  return 1;
}
function gauge(sel, r) { $(sel + ' .mask').style.width = (1 - Math.max(0, Math.min(1, r))) * 100 + '%'; }

// ---------- 日付 ----------
const dowOf = d => (d - 1) % 7;                      // 0=月 … 6=日
const weekOf = d => Math.min(3, Math.floor((d - 1) / 7));
const nextBossDay = d => d >= FINAL_DAY ? FINAL_DAY : Math.min(FINAL_DAY, Math.ceil(d / 7) * 7);

// ---------- 自キャラ・ボス ----------
function plTop() { return SUBJ.reduce((a, s) => S.st[s] > S.st[a] ? s : a, '国語'); }
function plTier() {
  const v = Object.values(S.st), m = Math.max(...v), sum = v.reduce((a, b) => a + b, 0), t = ASSETS.player.tiers;
  return (m >= t[1] || sum >= ASSETS.player.sumTier) ? 2 : m >= t[0] ? 1 : 0;
}
function playerArt(style = '') {
  const P = ASSETS.player, t = plTier(), top = plTop(), k = ASSETS.romaji[top];
  return imgArt([`${P.dir}${k}_${t}.png`, `${P.dir}base_${t}.png`, `${P.dir}base_0.png`], P.emoji[t], t ? 'aura' : '', `--aura:${COLOR[top]};${style}`);
}
const bossData = key => ASSETS.boss[key];
function bossArt(key, phase2, style = '') { const b = bossData(key); return imgArt(phase2 && b.img2 ? [b.img2, b.img] : [b.img], b.emoji, '', style); }
function masterArt() { const m = ASSETS.master; return imgArt([m.img], m.emoji); }

// ---------- 問題DB ----------
let DB = [];
function loadDB(rows) { DB = rows.map((r, i) => ({ id: i, s: r[0], g: +r[1] || 4, q: r[2], c: r[3], e: r[4] || '' })).filter(q => SUBJ.includes(q.s) && q.c && q.c.length >= 2); }
loadDB(window.QUESTION_DB || []);
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  // CSV列：教科,学年,問題,正解,ハズレ1,ハズレ2,ハズレ3,解説
  return rows.filter(r => r.length >= 5 && SUBJ.includes(r[0].trim()))
    .map(r => [r[0].trim(), r[1], r[2], [r[3], r[4], r[5], r[6]].filter(x => x && x.trim()), r[7] || '']);
}
async function readCSVFile(file) {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder('utf-8').decode(buf);
  if (text.includes('�')) text = new TextDecoder('shift_jis').decode(buf);
  return parseCSV(text.replace(/^﻿/, ''));
}

// ---------- 状態 ----------
let S, B;
function newRun(grade) {
  const els = []; while (els.length < 3) { const e = pick(EL); if (e !== els[els.length - 1]) els.push(e); }
  S = {
    grade, day: 0, hp: 600, maxHp: 600,
    st: { 国語: 100, 算数: 100, 理科: 100, 社会: 100, 英語: 100, 保健: 100 },
    skills: [], wrong: [], weekSeen: [], allSeen: [], used: new Set(), bossEls: els,
    bossEl: els[0], correct: 0, total: 0, dmg: 0, beaten: 0, overcome: 0, turnBonus: 0, reviveUsed: false,
  };
  B = null;
  tutorial();
}
function pool(s) {
  let p = DB.filter(q => q.s === s && (S.grade === 0 || q.g <= S.grade));
  if (!p.length) p = DB.filter(q => q.s === s);
  return p;
}
function drawLessonQ(s) {
  const p = pool(s); let fresh = p.filter(q => !S.used.has(q.id));
  if (!fresh.length) { p.forEach(q => S.used.delete(q.id)); fresh = p; }
  const q = pick(fresh); S.used.add(q.id); return q;
}
function drawBattleQ(s, last) {
  const w = S.wrong.filter(q => q.s === s && q.id !== last);
  if (w.length && Math.random() < 0.7) return pick(w);
  const seen = (weekOf(S.day) === 3 ? S.allSeen : S.weekSeen).filter(q => q.s === s && q.id !== last);
  if (seen.length && Math.random() < 0.8) return pick(seen);
  const p = pool(s).filter(q => q.id !== last);
  return pick(p.length ? p : pool(s));
}
const has = id => S.skills.some(k => k.id === id);
const count = id => S.skills.filter(k => k.id === id).length;

// ---------- スキル ----------
const SKILLS = [
  ...EL.concat('英語').map(s => ({ id: 'boost_' + s, name: `${s}の紋章`, desc: `${s}で攻撃するダメージ1.5倍（重ねがけOK）`, stack: true })),
  { id: 'drain', name: 'ドレインの牙', desc: '与えたダメージの10%だけHP回復' },
  { id: 'half', name: 'ひらめきメガネ', desc: 'ボス戦ごとに3回、4択を2択にできる' },
  { id: 'shield', name: 'ウロコの盾', desc: '受けるダメージ30%カット（大技にも有効）' },
  { id: 'combo', name: '連続正解の炎', desc: '連続正解するたびダメージ+25%（最大+100%）' },
  { id: 'revive', name: '不死鳥の羽', desc: '一度だけHP半分で復活' },
  { id: 'master', name: 'まなびの極意', desc: 'レッスンで間違えても大きく能力アップ' },
  { id: 'scholar', name: '予習ノート', desc: 'レッスン正解の能力アップ+200' },
  { id: 'quick', name: '早押しブーツ', desc: '5秒以内に正解するとダメージ1.5倍' },
  { id: 'herb', name: '薬草ポーチ', desc: '保健の回復量1.5倍' },
  { id: 'crit', name: 'かいしんの角', desc: '20%の確率でダメージ2倍' },
  { id: 'breaker', name: 'くだけの爪', desc: 'カウントダウン中のダメージ1.5倍（ブレイクしやすい）' },
];
const skillChoices = n => shuffle(SKILLS.filter(k => k.stack || !has(k.id))).slice(0, n);
function skillPopup(k) {
  const m = $('#modal');
  m.innerHTML = `<div class="modalBox pop"><b>${k.name}</b><p>${k.desc}</p><button class="btn" style="margin-top:12px">とじる</button></div>`;
  m.style.display = 'flex'; m.onclick = e => { e.stopPropagation(); m.style.display = 'none'; };
}
document.addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c && S) { e.stopPropagation(); skillPopup(S.skills[c.dataset.k]); } }, true);

// ---------- 画面の部品 ----------
function renderSide(phase) {
  $('#side').style.display = 'block';
  if (phase) $('#phase').innerHTML = phase;
  $('#face').innerHTML = playerArt();
  gauge('#pGauge', S.hp / S.maxHp);
  $('#hpNum').textContent = `${fmt(S.hp)}/${fmt(S.maxHp)}`;
  $('#stats').innerHTML = SUBJ.map(s => `<div><span style="color:${COLOR[s]}">${s}</span><span style="color:${COLOR[s]}">${S.st[s]}</span></div>`).join('');
  $('#items').innerHTML = `<div class="ol">所持アイテム</div>` + (S.skills.length ? S.skills.map((k, i) => `<div class="it ol" data-k="${i}">${k.name}</div>`).join('') : '<div class="it ol" style="text-decoration:none;opacity:.6">なし</div>');
}
function renderInfo() {
  $('#info').style.display = 'block';
  const d = S.day, w = dowOf(d);
  const dowColor = w === 5 ? '#4f6bff' : w === 6 ? '#ff3b4f' : '#fff';
  $('#dayN').innerHTML = d === FINAL_DAY ? '<span class="box" style="font-size:34px">FINAL</span>' : `<span class="box">${d}日目</span>`;
  $('#dow').innerHTML = d === FINAL_DAY ? '<span style="font-size:28px">ファイナルデー</span>' : `<span style="color:${dowColor}">${DOW[w]}</span>`;
  let next = '';
  if (B) {
    const good = strongAgainst(S.bossEl);
    next = `${bName()}<br><span style="color:${COLOR[good]}">${good}</span>が弱点`;
  } else if (d < FINAL_DAY) {
    const nb = nextBossDay(d), el = S.bossEls[weekOf(nb)];
    next = `次回のボス<br>${nb - d === 0 ? '今日！' : `${nb - d}日後`}<br>${bossData(el).name}<br><span style="color:${COLOR[strongAgainst(el)]}">${strongAgainst(el)}</span>が弱点`;
  }
  $('#next').innerHTML = next;
}
function setChara(html) { $('#chara').innerHTML = html; }
function setChoices(cls, items) {
  const c = $('#choices'); c.className = cls; c.innerHTML = items.map(i => i.html).join('');
  [...c.children].forEach((el, i) => { if (items[i].on) el.onclick = e => { e.stopPropagation(); items[i].on(el); }; });
}
function clearChoices() { $('#choices').innerHTML = ''; $('#halfBtn').style.display = 'none'; }
function msg(html) { $('#msgbar').innerHTML = html; }

// メッセージ（タップ or 自動で次へ）
function say(html, auto = 1100) {
  return new Promise(res => {
    msg(`<div>${html}</div><div class="tap">▼</div>`);
    let done = false;
    const fin = () => { if (done) return; done = true; stage.removeEventListener('click', fin); clearTimeout(h); res(); };
    const h = auto ? setTimeout(fin, auto * SPD) : null;
    setTimeout(() => stage.addEventListener('click', fin), 30);
  });
}

// 問題（2×2の選択肢＋下のバーに問題文）
function ask(q, opt = {}) {
  return new Promise(res => {
    const order = shuffle(q.c.map((t, i) => ({ t, ok: i === 0 })));
    const t0 = Date.now();
    msg(`<div class="sub">${opt.head || ''}</div>${opt.limit || opt.quick ? '<div class="timer" id="tm" style="width:100%"></div>' : ''}<div>${esc(q.q)}</div>`);
    let over = false, th;
    const finish = (ok, timeout) => {
      if (over) return; over = true; clearInterval(th); $('#halfBtn').style.display = 'none';
      [...$('#choices').children].forEach((b, i) => { b.disabled = true; if (order[i].ok) b.classList.add('ok'); else if (!b.classList.contains('ng')) b.classList.add('dim'); });
      setTimeout(() => res({ ok, timeout, sec: (Date.now() - t0) / 1000 }), 450 * SPD);
    };
    setChoices('c2', order.map(o => ({ html: `<button class="cbtn pop">${esc(o.t)}</button>`, on: el => { if (!o.ok) el.classList.add('ng'); finish(o.ok); } })));
    const lim = opt.limit || (opt.quick ? 5 : 0);
    if (lim) th = setInterval(() => {
      const r = Math.max(0, 1 - (Date.now() - t0) / (lim * 1000)); const el = $('#tm'); if (el) el.style.width = r * 100 + '%';
      if (!r) { clearInterval(th); if (opt.limit) finish(false, true); }
    }, 100);
    const hb = $('#halfBtn');
    if (B && B.half) {
      hb.style.display = 'block'; hb.textContent = `👓 ひらめき（のこり${B.half}）`;
      hb.onclick = e => {
        e.stopPropagation(); hb.style.display = 'none'; B.half--;
        const btns = [...$('#choices').children];
        shuffle(btns.map((b, i) => i).filter(i => !order[i].ok)).slice(0, Math.max(0, order.length - 2)).forEach(i => btns[i].classList.add('hide'));
      };
    }
  });
}
const explainHTML = (q, head) => `${head}<div class="ex">こたえ：<b style="color:#fde047">${esc(q.c[0])}</b>${q.e ? `　💡${esc(q.e)}` : ''}</div>`;

// ---------- 日付切り替え（ペルソナ風） ----------
function dateCut(from, to) {
  return new Promise(res => {
    const dc = $('#datecut'), strip = $('#strip'), W = 190;
    let cells = '';
    for (let d = 1; d <= FINAL_DAY; d++) {
      const w = dowOf(d), fin = d === FINAL_DAY, reveal = fin && to === FINAL_DAY;
      let extra = '';
      if (!fin && w === 6) {
        const el = S.bossEls[weekOf(d)];
        extra = `<div class="bimg" style="${d < to ? 'filter:grayscale(1) brightness(.5)' : ''}">${bossArt(el)}</div>`;
        if (d === nextBossDay(to)) extra += `<div class="bn">${bossData(el).name}<br><span style="color:${COLOR[strongAgainst(el)]}">${strongAgainst(el)}</span>が弱点</div>`;
      }
      if (reveal) extra = `<div class="bimg">${bossArt('last')}</div>`;
      cells += `<div class="dc ${w === 5 ? 'sat' : w === 6 && !fin ? 'sun' : ''} ${d === to ? 'now' : ''} ${fin ? 'final' : ''}" style="left:${(d - 1) * W}px">
        <div class="d">${fin ? (reveal ? 'FINAL' : '??') : d}</div><div class="w">${fin ? (reveal ? 'DAY' : '???') : DOW[w]}</div>${extra}</div>`;
    }
    strip.innerHTML = cells;
    const pos = d => 640 - ((d - 1) * W + W / 2);
    strip.style.transition = 'none'; strip.style.transform = `translateX(${pos(Math.max(0, from))}px)`;
    const nb = nextBossDay(to), left = nb - to;
    $('#dcTitle').innerHTML = to === FINAL_DAY ? '<span style="color:#ffd54a">ファイナルデー</span><br>運命の日<span class="arrow">▼</span>'
      : left === 0 ? '<span style="color:#ff4d6d">ボス戦 当日！</span><br>　<span class="arrow">▼</span>' : `次回のボス<br>${left}日後<span class="arrow">▼</span>`;
    dc.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => { strip.style.transition = ''; strip.style.transform = `translateX(${pos(to)}px)`; }));
    let done = false; const fin = () => { if (done) return; done = true; dc.style.display = 'none'; dc.onclick = null; res(); };
    setTimeout(fin, (to === FINAL_DAY ? 2000 : 1300) * SPD); dc.onclick = fin;
  });
}

// ---------- タイトル ----------
function title() {
  S = null; B = null;
  setBg(ASSETS.bg.title, GRAD[0]);
  ['#side', '#info', '#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none');
  setChara(''); clearChoices(); msg('');
  $('#msgbar').style.display = 'none';
  const cnt = SUBJ.map(s => `<span class="chip" style="background:${BTNC[s]}">${s} ${DB.filter(q => q.s === s).length}</span>`).join('');
  $('#panelIn').innerHTML = `
    <img src="${ASSETS.logo}" alt="まなびドラゴン" class="logo" onerror="this.outerHTML='<h1 class=&quot;ol&quot;>まなびドラゴン</h1>'">
    <p style="text-align:center">勉強して竜を育て、3週間後の天使をたおせ！</p>
    <h2>学年をえらぶ</h2>
    <div class="row"><button class="btn" data-g="4">4年生</button><button class="btn" data-g="5">5年生</button><button class="btn" data-g="6">6年生</button><button class="btn gold" data-g="0">ミックス</button></div>
    
    <div class="chips" style="margin-top:12px">${cnt}</div>
    <div class="row" style="align-items:center;font-size:17px"><label><input type="checkbox" id="append"> いまの問題に追加</label><button class="btn gray" id="csvBtn" style="font-size:18px;padding:8px 16px">📂 問題CSVを読みこむ</button></div>
    <input type="file" id="csv" accept=".csv,text/csv" hidden>`;
  $('#panel').style.display = 'flex'; $('#panel').classList.add('title');
  $('#panelIn').querySelectorAll('[data-g]').forEach(b => b.onclick = () => newRun(+b.dataset.g));
  $('#csvBtn').onclick = () => $('#csv').click();
  $('#csv').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const rows = await readCSVFile(f);
    if (!rows.length) { toast('読みこめる問題がありませんでした'); return; }
    const base = $('#append').checked ? DB.map(q => [q.s, q.g, q.q, q.c, q.e]) : [];
    loadDB(base.concat(rows)); toast(`${rows.length}問を読みこみました`); title();
  };
}

// ---------- チュートリアル（1画面・1クリックで1日目へ） ----------
function tutorial() {
  const P = $('#panel'); P.classList.remove('title');
  const node = (s, sub) => `<div class="tnode" style="background:${BTNC[s]}">${s}<small>${sub}</small></div>`;
  const b = ASSETS.boss;
  const day = (d, w, cls, icon, label) => `<div class="tday ${cls}"><div class="tw">${w}</div><div class="ti">${icon}</div><div class="tl">${label}</div></div>`;
  $('#panelIn').innerHTML = `
  <div class="tut">
    <h2 class="ol" style="font-size:28px;margin:-6px 0 2px">あそびかた</h2>
    <div class="tsec">
      <div class="thead">① 1週間のながれ</div>
      <div class="tweek">
        ${['月','火','水','木','金'].map(w => day(0, w, '', '📚', 'レッスン')).join('')}
        ${day(0, '土', 'sat', '🎁', 'スキル')}
        ${day(0, '日', 'sun', '⚔', 'ボス戦')}
      </div>
      <p>レッスンで問題を解くと<b style="color:#fde047">学力（＝攻撃力）</b>がアップ！まちがえても少しアップするよ。</p>
      <div class="tboss">
        ${[7, 14, 21].map((d, i) => `<div><b>${d}日目</b><span>四天王 ${i + 1}人目</span></div>`).join('<i>▶</i>')}
        <i>▶</i><div class="fin"><b>22日目</b><span>ファイナルデー</span></div>
      </div>
      <p><b style="color:#ff6b6b">7日目の日曜日にボスが出るぞ！</b> 3週間で4人目の大ボスまでたおそう。</p>
    </div>
    <div class="tsec">
      <div class="thead">② 教科の相性（矢印の先に <b style="color:#fde047">2倍</b> ダメージ／逆向きは ½）</div>
      <div class="tcycle">
        ${node('国語', '炎')}<span class="arr">▶</span>${node('算数', '水')}<span class="arr">▶</span>${node('理科', '草')}<span class="arr">▶</span>${node('社会', '雷')}<span class="arr">▶</span>${node('国語', '炎')}
      </div>
      <div class="tother">
        ${node('英語', 'いつでも等倍')}<span>相性なし。どのボスにも安定</span>
        ${node('保健', '回復＋ガード')}<span>ボス戦でHP回復／レッスンでHP最大値アップ</span>
      </div>
    </div>
    <div class="tsec tips">
      <div>📝 まちがえた問題は<b>ボス戦でまた出る</b>。正解すると「苦手こくふく」でパワーアップ！</div>
      <div>👁 ボスの<b>「次のこうどう」</b>を見て、教科をえらぼう。ガード中は回復のチャンス！</div>
    </div>
    <button class="btn gold" id="tgo" style="display:block;margin:6px auto 0;font-size:26px;padding:8px 60px">1日目へ ▶</button>
  </div>`;
  P.style.display = 'flex';
  const go = () => { P.onclick = null; P.style.display = 'none'; goDay(1); };
  P.onclick = null; setTimeout(() => { P.onclick = go; }, 50);
}

// ---------- 1日の進行 ----------
async function goDay(d) {
  const from = S.day; S.day = d;
  const wk = weekOf(d);
  if (wk < 3) S.bossEl = S.bossEls[wk];
  if (dowOf(d) === 0 && d < FINAL_DAY) S.weekSeen = [];
  await dateCut(from, d);
  $('#msgbar').style.display = 'flex';
  if (d === FINAL_DAY) return finalDay();
  if (dowOf(d) === 6) return battleStart();
  if (dowOf(d) === 5) return saturday();
  lessonDay();
}
function lessonScene(phase) {
  B = null;
  setBg(ASSETS.bg.lesson[weekOf(S.day)] || '', LESSON_GRAD[weekOf(S.day)] || LESSON_GRAD[0]);
  ['#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none');
  setChara(masterArt()); renderSide(phase); renderInfo();
}
async function lessonDay() {
  lessonScene('教科強化<br>フェーズ');
  if (S.day === 1 && !S.introDone) {
    S.introDone = true; clearChoices();
    for (const t of ASSETS.story.day1) await say(`${ASSETS.master.name}「${t}」`, 0);
  }
  const good = strongAgainst(S.bossEl);
  msg(`${ASSETS.master.name}「今日はどの教科を勉強する？」`);
  setChoices('c3', SUBJ.map(s => {
    const tag = s === good ? 'ボスに2倍' : s === '保健' ? 'HP最大値UP' : s === '英語' ? 'いつでも等倍' : '';
    return { html: `<button class="sbtn pop" style="background:${BTNC[s]}">${ICON[s]} ${s}<small>${S.st[s]}</small>${tag ? `<span class="tag">${tag}</span>` : ''}</button>`, on: () => lesson(s) };
  }));
}
async function lesson(s) {
  const q = drawLessonQ(s);
  if (!S.weekSeen.includes(q)) S.weekSeen.push(q);
  if (!S.allSeen.includes(q)) S.allSeen.push(q);
  const tierBefore = plTier(), topBefore = plTop();
  const r = await ask(q, { head: `${ICON[s]} ${s}レッスン` });
  S.total++;
  let gain;
  if (r.ok) { S.correct++; gain = 500 + rnd(301) + (has('scholar') ? 200 : 0); }
  else { gain = has('master') ? 400 + rnd(151) : 150 + rnd(101); if (!S.wrong.includes(q)) S.wrong.push(q); }
  const before = S.st[s]; S.st[s] = cap(S.st[s] + gain); gain = S.st[s] - before;
  let extra = '';
  if (s === '保健') { const hp = r.ok ? 200 : 80; S.maxHp += hp; S.hp += hp; extra = `　HP最大値 +${hp}`; }
  renderSide();
  const up = `<span style="color:${COLOR[s]}">${s} +${gain}</span>${r.ok ? ' だいアップ！' : ' すこしアップ'}${extra}`;
  if (r.ok) await say(`⭕ せいかい！　${up}`, 1500);
  else await say(explainHTML(q, `❌ ざんねん…　${up}　<span class="sub">（この問題はボス戦でも出るよ）</span>`), 0);
  if (plTier() > tierBefore) { anim('#face', 'hurt'); await say(`✨ ${ASSETS.player.name}が進化した！ ✨`, 1500); }
  else if (plTier() > 0 && plTop() !== topBefore) await say(`${ASSETS.player.name}のすがたが「${plTop()}」タイプに変わった！`, 1300);
  if (Math.random() < SKILL_DROP) { const k = skillChoices(1)[0]; S.skills.push(k); renderSide(); await say(`🎁 アイテム「${k.name}」をひろった！<div class="ex">${k.desc}</div>`, 1800); }
  clearChoices();
  goDay(S.day + 1);
}
function saturday() {
  lessonScene('スキル<br>イベント');
  msg(`${ASSETS.master.name}「よくがんばった。ひとつ力を授けよう」`);
  const ch = skillChoices(3);
  setChoices('c3', ch.map(k => ({
    html: `<button class="skcard pop"><b>${k.name}</b>${k.desc}</button>`,
    on: async () => { S.skills.push(k); renderSide(); clearChoices(); await say(`「${k.name}」を手に入れた！`, 1200); goDay(S.day + 1); },
  })));
}
async function finalDay() {
  lessonScene('ファイナル<br>デー');
  setBg(ASSETS.bg.last, GRAD[3]);
  for (const t of ASSETS.story.final) await say(`${ASSETS.master.name}「${t}」`, 0);
  await say(`${ASSETS.master.name}「やつは属性を変えて戦う。たおしても油断するな…闇の力で復活するかもしれん。カウントダウン大技はブレイクで止めるのだ！」`, 0);
  battleStart();
}

// =================== ボス戦 ===================
function battleStart() {
  const idx = weekOf(S.day), st = STAGES[idx], last = idx === 3;
  if (last) S.bossEl = pick(EL);
  B = {
    idx, st, key: last ? 'last' : S.bossEl, hp: st.hp, max: st.hp, atk: st.atk, atkMul: 1, turn: 0, pi: 0,
    combo: 0, half: has('half') ? 3 : 0, lastQ: null, cd: 0, brk: 0, brkNeed: 0, broken: false,
    forced: null, interrupt: false, pGuard: false, pWeak: false, phase2: false,
  };
  setBg(last ? ASSETS.bg.last : ASSETS.bg.battle[idx], GRAD[idx]);
  $('#bossHp').style.display = 'block'; $('#intent').style.display = 'block';
  drawBoss(); renderSide(last ? 'ファイナル<br>バトル' : '教科ボス<br>バトル'); renderInfo();
  B.intent = nextIntent(); updateUI();
  say(`${bName()}があらわれた！`, 1300).then(() => say(`${bName()}「${ASSETS.lines[B.key].intro}」`, 0)).then(showCmd);
}
function bName() { const b = bossData(B.key); return B.phase2 && b.name2 ? b.name2 : b.name; }
function drawBoss() { setChara(`<div id="bossArt" style="position:relative">${bossArt(B.key, B.phase2)}</div>`); }

// ----- 行動予告 -----
const INTENT = {
  attack:    () => ({ t: '⚔ こうげき' }),
  multi:     () => ({ t: '⚔ 3回れんぞくこうげき' }),
  guard:     () => ({ t: '🛡 身を守る → 回復のチャンス！' }),
  charge:    () => ({ t: '💢 力をためる（ばつぐんでひるむ）' }),
  big:       () => ({ t: '💥 ため攻撃！ 保健でガードせよ', danger: 1 }),
  roar:      () => ({ t: '📣 おたけび（攻撃力アップ）' }),
  heal:      () => ({ t: '💚 HPを回復する' }),
  haste:     () => ({ t: '⏱ 8秒以内に答えろ！＋こうげき', danger: 1 }),
  countdown: () => ({ t: '⏳ 大技のカウントダウン開始', danger: 1 }),
  count:     () => ({ t: `⏳ 大技まであと${B.cd}！ ブレイクをねらえ`, danger: 1 }),
  stun:      () => ({ t: '😵 ブレイク中！ ダメージ2倍' }),
  shift:     () => ({ t: `🔄 属性チェンジ → ${B.shiftTo}` }),
};
function nextIntent() {
  let type;
  if (B.forced) { type = B.forced; B.forced = null; }
  else if (B.cd > 0) type = 'count';
  else {
    const pat = B.phase2 && B.st.pat2 ? B.st.pat2 : B.st.pat;
    type = pat[B.pi++ % pat.length];
    if (type === 'attack' && B.idx >= 1 && Math.random() < 0.3) type = 'multi';
  }
  if (type === 'shift') B.shiftTo = pick(EL.filter(e => e !== S.bossEl));
  return { type, ...INTENT[type]() };
}
function updateUI() {
  $('#bName').innerHTML = `${bName()} <span class="chip" style="background:${BTNC[S.bossEl]}">${S.bossEl}</span>${B.atkMul > 1 ? ` <span class="chip" style="background:#7f1d1d">攻×${B.atkMul.toFixed(1)}</span>` : ''}`;
  gauge('#bGauge', B.hp / B.max); $('#bNum').textContent = `${fmt(B.hp)} / ${fmt(B.max)}`;
  renderSide(); renderInfo();
  const it = B.intent, ie = $('#intent');
  ie.innerHTML = '次のこうどう<br>' + it.t; ie.className = 'ol' + (it.danger ? ' danger' : '');
  const cdOn = B.cd > 0 && !B.broken;
  $('#cdBox').style.display = cdOn ? 'block' : 'none';
  if (cdOn) { $('#cdN').textContent = B.cd; $('#brkBar').style.width = Math.min(100, B.brk / B.brkNeed * 100) + '%'; }
  const ba = $('#bossArt'); if (ba) { ba.querySelectorAll('.guardFx').forEach(e => e.remove()); if (it.type === 'guard') ba.insertAdjacentHTML('beforeend', '<div class="guardFx"></div>'); }
  const fa = $('#face'); fa.querySelectorAll('.guardFx').forEach(e => e.remove());
  if (B.pGuard) fa.insertAdjacentHTML('beforeend', '<div class="guardFx" style="border-color:#f9a8d4;box-shadow:0 0 20px #f9a8d4"></div>');
}
function tagFor(s) {
  if (s === '保健') return '回復+ガード';
  const m = mult(s, S.bossEl);
  if (B.intent.type === 'charge' && m === 2) return 'ひるませる！';
  return m === 2 ? 'ばつぐん×2' : m === 0.5 ? 'いまひとつ×½' : '×1';
}
function showCmd() {
  const it = B.intent.type;
  msg(it === 'guard' ? '🛡 ボスはガード中！攻撃はほぼ効かない。回復のチャンス'
    : it === 'big' ? '💥 大ダメージが来る！保健でガードすると半分'
    : it === 'charge' ? '💢 ばつぐんの教科で攻撃すると、ためを止められる'
    : it === 'count' ? `⏳ あと ${fmt(Math.max(0, B.brkNeed - B.brk))} ダメージでブレイク！`
    : it === 'stun' ? '😵 大チャンス！ダメージ2倍' : 'どの教科でたたかう？');
  setChoices('c3', SUBJ.map(s => ({ html: `<button class="sbtn pop" style="background:${BTNC[s]}">${ICON[s]} ${s}<small>${S.st[s]}</small><span class="tag">${tagFor(s)}</span></button>`, on: () => doTurn(s) })));
}

// ----- エフェクト -----
function center(sel) {
  const st = stage.getBoundingClientRect(), r = $(sel).getBoundingClientRect();
  return { x: (r.left - st.left + r.width / 2) / SC, y: (r.top - st.top + r.height / 2) / SC };
}
function fxAdd(html, ms = 1100) { const d = document.createElement('div'); d.innerHTML = html; const n = d.firstElementChild; $('#fx').appendChild(n); setTimeout(() => n.remove(), ms); }
function anim(sel, cls) { const e = $(sel); if (!e) return; e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); setTimeout(() => e.classList.remove(cls), 700); }
function particles(p, glyphs, color, n, size, dist, up) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = dist * (0.5 + Math.random() * 0.7);
    const dx = up ? (Math.random() - .5) * 90 : Math.cos(a) * d, dy = up ? -70 - Math.random() * dist : Math.sin(a) * d;
    fxAdd(`<span class="pt" style="left:${p.x}px;top:${p.y}px;color:${color};font-size:${size}px;--dx:${dx}px;--dy:${dy}px;--r:${rnd(360)}deg">${pick(glyphs)}</span>`);
  }
}
function dmgNum(p, text, color, size) { fxAdd(`<span class="dnum" style="left:${p.x}px;top:${p.y}px;color:${color};font-size:${size}px">${text}</span>`, 1100); }
function bossPoint() { const p = center('#chara'); return { x: p.x, y: p.y - 40 }; }
function fxHit(s, d, m) {
  const p = bossPoint(), c = COLOR[s];
  const r = d / B.max; let tier = r >= .2 ? 4 : r >= .11 ? 3 : r >= .05 ? 2 : 1;
  if (m === 2 && tier < 4) tier++;
  anim('#face', 'lunge');
  setTimeout(() => {
    fxAdd(`<div class="burst" style="left:${p.x}px;top:${p.y}px;width:${130 + tier * 80}px;height:${130 + tier * 80}px;background:radial-gradient(circle,#fff 0%,${c} 35%,transparent 70%)"></div>`);
    if (tier >= 2) for (let i = 0; i < tier; i++) fxAdd(`<div class="slash" style="left:${p.x - 170}px;top:${p.y + (i - tier / 2) * 26}px;--w:${300 + tier * 40}px;background:#fff;color:${c};transform:rotate(${-35 + rnd(70)}deg)"></div>`, 500);
    if (tier >= 3) particles(p, GLYPH[s] || ['✦'], c, tier * 6, 26 + tier * 4, 140 + tier * 40);
    if (tier >= 3) fxAdd(`<div class="flash" style="background:${tier >= 4 ? c : '#fff'}"></div>`, 500);
    anim('#chara', 'hurt'); anim('#stage', tier >= 4 ? 'shakeBig' : 'shake');
    dmgNum({ x: p.x, y: p.y - 40 }, fmt(d), tier >= 3 ? '#ffe066' : '#fff', 40 + tier * 12);
  }, 180 * SPD);
}
function fxHurt(d) {
  const p = center('#face'); const r = d / S.maxHp; const tier = r >= .6 ? 4 : r >= .35 ? 3 : r >= .15 ? 2 : 1;
  anim('#chara', 'lunge');
  setTimeout(() => {
    fxAdd(`<div class="flash" style="background:#ef4444;opacity:${.3 + tier * .15}"></div>`, 500);
    fxAdd(`<div class="burst" style="left:${p.x}px;top:${p.y}px;width:${120 + tier * 50}px;height:${120 + tier * 50}px;background:radial-gradient(circle,#fff 0%,#ef4444 40%,transparent 70%)"></div>`);
    if (tier >= 3) particles(p, ['✖', '✦'], '#ef4444', tier * 4, 26, 120);
    anim('#face', 'hurt'); anim('#stage', tier >= 3 ? 'shakeBig' : 'shake');
    dmgNum({ x: p.x + 50, y: p.y }, fmt(d), '#ff6b6b', 34 + tier * 8);
  }, 180 * SPD);
}
function fxHeal(sel, h) { const p = sel === '#chara' ? bossPoint() : center(sel); particles(p, ['✚', '✦', '♥'], '#4ade80', 14, 26, 130, true); dmgNum({ x: p.x, y: p.y - 30 }, '+' + fmt(h), '#4ade80', 36); }

// ----- 1ターン -----
async function doTurn(s) {
  const it = B.intent;
  const q = drawBattleQ(s, B.lastQ); B.lastQ = q.id;
  const wasWrong = S.wrong.includes(q);
  const r = await ask(q, {
    head: `${ICON[s]} ${s}で${s === '保健' ? '回復' : 'こうげき'}！${wasWrong ? '　<span style="color:#fde047">★前に間違えた問題</span>' : ''}`,
    limit: it.type === 'haste' ? 8 : 0, quick: has('quick'),
  });
  S.total++;
  if (!r.ok) await say(explainHTML(q, r.timeout ? '⏱ 時間切れ！' : '❌ ざんねん…'), 0);
  clearChoices();
  // --- 自分の行動 ---
  if (r.ok) {
    S.correct++; B.combo++;
    if (wasWrong) {
      S.wrong = S.wrong.filter(x => x !== q); S.overcome++;
      const b0 = S.st[s]; S.st[s] = cap(S.st[s] + OVERCOME); renderSide();
      await say(`★苦手こくふく！ <span style="color:${COLOR[s]}">${s}</span>の力が +${S.st[s] - b0}！`, 1000);
    }
    if (s === '保健') {
      const heal = Math.round((150 + S.st.保健 * 0.25) * (has('herb') ? 1.5 : 1));
      const real = Math.min(heal, S.maxHp - S.hp); S.hp += real; B.pGuard = true;
      fxHeal('#face', real); updateUI();
      await say(`💗 HPが${fmt(real)}回復！ ガードのかまえ！`);
    } else {
      const m = mult(s, S.bossEl);
      let d = (60 + S.st[s] * 0.5) * DMG_MUL * m * Math.pow(1.5, count('boost_' + s));
      if (has('combo')) d *= 1 + Math.min(1, 0.25 * (B.combo - 1));
      if (has('quick') && r.sec <= 5) d *= 1.5;
      if (has('breaker') && B.cd > 0) d *= 1.5;
      const crit = has('crit') && Math.random() < 0.2; if (crit) d *= 2;
      if (it.type === 'guard') d *= 0.15;
      if (it.type === 'stun') d *= 2;
      d = Math.max(1, Math.round(d)); B.hp = Math.max(0, B.hp - d); S.dmg += d;
      if (B.cd > 0) B.brk += d;
      fxHit(s, d, m); await wait(350); updateUI();
      let t = `${crit ? 'かいしんの一撃！ ' : ''}${it.type === 'guard' ? 'ガードされた… ' : m === 2 ? 'こうかはばつぐんだ！ ' : m === 0.5 ? 'いまひとつ… ' : ''}${fmt(d)}のダメージ！`;
      if (has('drain')) { const h = Math.min(Math.round(d * 0.1), S.maxHp - S.hp); if (h > 0) { S.hp += h; t += `（HP+${fmt(h)}）`; } }
      await say(t); updateUI();
      if (B.cd > 0 && !B.broken && B.brk >= B.brkNeed) { B.broken = true; anim('#stage', 'shakeBig'); updateUI(); await say('💥 ブレイク！ 大技を止めた！'); }
      if (it.type === 'charge' && m === 2) { B.interrupt = true; await say('ばつぐんの一撃でボスがひるんだ！ ためが消えた！'); }
    }
  } else {
    B.combo = 0;
    if (!S.wrong.includes(q)) S.wrong.push(q);
    B.pWeak = true; updateUI();
    await say(`${s}の${s === '保健' ? '回復' : 'こうげき'}は失敗… すきをつかれた！`, 900);
  }
  if (B.hp <= 0 && B.idx === 3 && !B.phase2) return lastRevive();
  if (B.hp <= 0) return victory();
  // --- ボスの行動 ---
  await bossAct(it);
  if (S.hp <= 0) {
    if (has('revive') && !S.reviveUsed) { S.reviveUsed = true; S.hp = Math.ceil(S.maxHp / 2); fxHeal('#face', S.hp); updateUI(); await say('🪶 不死鳥の羽でふっかつした！'); }
    else { await say(`${ASSETS.player.name}はたおれてしまった…`, 1500); return result(false); }
  }
  B.pGuard = false; B.pWeak = false; B.turn++;
  B.intent = nextIntent(); updateUI(); showCmd();
}
async function hitP(raw, label, noWeak) {
  let d = raw; if (B.pGuard) d *= 0.5; if (has('shield')) d *= 0.7; if (B.pWeak && !noWeak) d *= 1.3;
  d = Math.round(d); S.hp = Math.max(0, S.hp - d);
  fxHurt(d); await wait(350); updateUI();
  await say(`${label}${B.pGuard ? '（ガード）' : ''} ${fmt(d)}のダメージ！`, 1000);
}
async function bossAct(it) {
  const atk = B.atk * B.atkMul, name = bName();
  switch (it.type) {
    case 'attack': return hitP(atk, `${name}のこうげき！`);
    case 'haste': return hitP(atk, `${name}のすばやいこうげき！`);
    case 'multi': for (let i = 0; i < 3; i++) { await hitP(atk * 0.45, `れんぞくこうげき ${i + 1}回目！`); if (S.hp <= 0) return; } return;
    case 'guard': return say(`${name}はじっと身を守っている…`, 900);
    case 'charge':
      if (B.interrupt) { B.interrupt = false; return say(`${name}はひるんで動けない！`, 900); }
      B.forced = 'big'; anim('#chara', 'hurt'); return say(`${name}は力をためている…！ 次のターン大ダメージ！`, 1300);
    case 'big': fxAdd('<div class="flash" style="background:#fff"></div>', 500); return hitP(atk * 3, '💥 ため攻撃が炸裂！');
    case 'roar': B.atkMul += 0.3; anim('#stage', 'shake'); updateUI(); return say(`📣 おたけび！ ${name}の攻撃力が上がった！`);
    case 'heal': { const h = Math.min(Math.round(B.max * 0.08), B.max - B.hp); B.hp += h; fxHeal('#chara', h); updateUI(); return say(`${name}はHPを${fmt(h)}回復した！`); }
    case 'countdown':
      B.cd = B.st.cd; B.brk = 0; B.brkNeed = Math.round(B.max * B.st.brk); B.broken = false; updateUI();
      return say(`⏳ カウントダウン開始！ ${B.cd}ターン以内に ${fmt(B.brkNeed)} ダメージでブレイク！ 失敗すると大技！`, 2200);
    case 'count':
      if (B.broken) { B.broken = false; B.cd = 0; B.forced = 'stun'; updateUI(); return say(`${name}はブレイクしてよろめいている！`); }
      B.cd--; updateUI();
      if (B.cd > 0) return say(`カウント… ${B.cd}！`, 800);
      fxAdd('<div class="flash" style="background:#000;opacity:.8"></div>', 600); await wait(300);
      return hitP(S.maxHp * 0.9, '☄ 大技！ 最大HPの9割のダメージ', true);
    case 'stun': return say(`${name}はふらふらしている…`, 900);
    case 'shift': S.bossEl = B.shiftTo; updateUI(); anim('#chara', 'hurt'); return say(`🔄 ${name}の属性が「${S.bossEl}」に変わった！`);
  }
}
async function lastRevive() {
  S.beaten++; S.turnBonus += Math.max(0, 12 - B.turn) * 300;
  anim('#stage', 'shakeBig'); $('#intent').style.display = 'none'; $('#cdBox').style.display = 'none';
  await say(`🎉 ${bName()}をたおした…！`, 1500);
  const ba = $('#bossArt'); ba.style.transition = 'opacity .8s'; ba.style.opacity = 0;
  await say('……', 900);
  await say('…いや、まだだ！ 闇の気配がふくれあがっていく…！', 1500);
  B.phase2 = true; B.hp = B.max = B.st.hp2; B.atkMul = 1.3; B.pi = 0; B.cd = 0; B.brk = 0; B.broken = false;
  B.forced = null; B.interrupt = false; B.pGuard = false; B.pWeak = false; B.combo = 0; B.turn = 0;
  if (B.half < 3 && has('half')) B.half = 3;
  setBg(ASSETS.bg.last2, GRAD[3]); fxAdd('<div class="flash" style="background:#fff"></div>', 700);
  drawBoss(); anim('#stage', 'shakeBig');
  B.intent = nextIntent(); $('#intent').style.display = 'block'; updateUI();
  await say(`${bName()}「${ASSETS.lines.last.phase2}」`, 0);
  await say(`${bName()}として復活した！ HP全回復・攻撃力アップ！`, 1600);
  showCmd();
}
async function victory() {
  S.beaten++; S.turnBonus += Math.max(0, 12 - B.turn) * 600;
  const last = B.idx === 3;
  anim('#stage', 'shakeBig'); const ba = $('#bossArt'); ba.style.transition = 'opacity 1s'; ba.style.opacity = 0;
  $('#intent').style.display = 'none'; $('#cdBox').style.display = 'none';
  await say(`${bName()}「${ASSETS.lines[B.key].defeat}」`, 0);
  await say(`🎉 ${bName()}をたおした！（${B.turn + 1}ターン）`, 1800);
  if (last) return result(true);
  S.hp = S.maxHp; renderSide();
  await say('HPが全回復した！', 900);
  B = null; $('#bossHp').style.display = 'none';
  goDay(S.day + 1);
}

// ---------- 結果 ----------
function result(clear) {
  setBg(clear ? ASSETS.bg.result : ASSETS.bg.gameover, GRAD[clear ? 0 : 3]);
  clearChoices(); $('#msgbar').style.display = 'none';
  ['#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none');
  const acc = S.total ? Math.round(S.correct / S.total * 100) : 0;
  const rows = [
    [`正解 ${S.correct}問 ×1000`, S.correct * 1000],
    ['与えたダメージ', S.dmg],
    [`ボス撃破 ${S.beaten}体 ×10000`, S.beaten * 10000],
    ['早期撃破ボーナス', S.turnBonus],
    [`苦手こくふく ${S.overcome}問 ×2000`, S.overcome * 2000],
    ['クリアボーナス', clear ? 30000 + S.hp * 10 : 0],
  ];
  const score = rows.reduce((a, r) => a + r[1], 0);
  const rank = score >= 330000 ? 'S' : score >= 250000 ? 'A' : score >= 160000 ? 'B' : score >= 80000 ? 'C' : 'D';
  const gname = S.grade ? S.grade + '年' : 'ミックス';
  const share = `【まなびドラゴン】${gname} ${clear ? 'クリア！' : `${S.day}日目でたおれた`} スコア${fmt(score)}（ランク${rank}）正答率${acc}%`;
  $('#panelIn').innerHTML = `
    <h1 class="ol">${clear ? '🏆 ゲームクリア！' : '💀 ゲームオーバー'}</h1>
    <div class="row" style="align-items:center">
      <div style="width:200px;height:200px">${playerArt('width:200px;height:200px;font-size:140px')}</div>
      <div style="text-align:center"><p>${gname}　正答率 ${acc}%</p><div style="font-size:64px;color:#ffd54a">${fmt(score)}</div><h2>ランク ${rank}</h2></div>
    </div>
    <table>${rows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1])}</td></tr>`).join('')}</table>
    ${S.wrong.length ? `<h2>📝 ふりかえり（まだ苦手な問題）</h2>${S.wrong.map(q => `<div class="exl">${esc(q.q)}　→ こたえ：<b style="color:#c2410c">${esc(q.c[0])}</b>${q.e ? `<br>💡${esc(q.e)}` : ''}</div>`).join('')}` : '<h2>苦手な問題はぜんぶこくふくした！</h2>'}
    <div class="row" style="margin-top:14px"><button class="btn gold" id="again">もういちど</button><button class="btn gray" id="copy">結果をコピー</button></div>`;
  $('#panel').style.display = 'flex';
  $('#again').onclick = title;
  $('#copy').onclick = () => { navigator.clipboard ? navigator.clipboard.writeText(share).then(() => toast('コピーしました'), () => prompt('コピーしてね', share)) : prompt('コピーしてね', share); };
}

title();
