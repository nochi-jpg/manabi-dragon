// ===== まなびドラゴン  ゲーム本体（横画面・共通UI） =====
const $ = s => document.querySelector(s);
const stage = $('#stage');
const SPD = window.FAST ? 0.02 : 1;                          // テスト用高速化
const EL = ['国語', '算数', '理科', '社会'];               // 4すくみ：国語の敵には算数、算数の敵には理科、理科の敵には社会、社会の敵には国語が2倍
const SUBJ = ['国語', '算数', '理科', '社会', '英語', '保健'];
const COLOR = { 国語: '#ff4d4d', 算数: '#38bdf8', 理科: '#4ade80', 社会: '#facc15', 英語: '#818cf8', 保健: '#f472b6' };
const BTNC  = { 国語: '#dc2626', 算数: '#0284c7', 理科: '#16a34a', 社会: '#ca8a04', 英語: '#6366f1', 保健: '#db2777' };
const ICON = { 国語: '📖', 算数: '➗', 理科: '🔬', 社会: '🗾', 英語: '🔤', 保健: '💗' };
const GLYPH = { 国語: ['あ', '文', '言', '筆'], 算数: ['＋', '×', '÷', '＝', 'π'], 理科: ['⚡', '✦', '◎', '☀'], 社会: ['★', '⚔', '⛩', '🏯'], 英語: ['A', 'B', 'C', '!'] };
const DOW = ['月', '火', '水', '木', '金', '土', '日'];
const DOW_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MAXST = 9999;
const EMBLEM = { normal: 1.25, hard: 1.35 }; // 紋章（通常）・聖紋章（ハード）1個あたりのステータス倍率
const MAX_ITEMS = 6;       // アイテムは最大6個
const SKILL_DROP = 0.2;    // レッスン後にスキルを拾う確率
const HARD = { dmg: 0.62, hurt: 1.5, hp: 1.2, score: 1.5 }; // ハードモード：与ダメ×0.62、被ダメ×1.5、スコア×1.5
const EXTREME = { dmg: 0.6, hurt: 1.6, hp: 1.3, score: 2 }; // エクストリーム：ハードよりさらにきびしい
const DIFF = () => S.extreme ? EXTREME : HARD;
const HP_UP = [300, 120];  // 保健レッスンで増える最大HP（正解, 不正解）
const OVERCOME = 450;      // 苦手こくふくで追加される能力（最初に正解した場合との差）
const DMG_MUL = 1.85;      // 与ダメージ倍率（試合時間の調整用）
const FINAL_DAY = 22;
// ランク基準（ハードはスコアを1.5で割って判定）。Sはクリア＋正答率90%以上も必要、ゲームオーバーは最高B
const RANK = { S: 320000, A: 280000, B: 200000, C: 120000, sAcc: 90, SS: 650000, SSS: 1400000 };
// SS・SSS は倍率こみの「表示スコア」で判定（Sの条件もみたしたときだけ）。目安：SS＝ハードで完全勝利、SSS＝エクストリームで真・完全勝利
const TIME_BONUS_SEC = 1800; // クリアタイムボーナス：30分−かかった秒数（最大1800点）

// ボス設定：hp・atk・行動パターン（cd＝カウントダウンのターン数、brk＝ブレイクに必要なダメージ割合）
const STAGES = [
  { hp: 6000,  atk: 135, pat: ['attack', 'attack', 'guard', 'charge'] },
  { hp: 18000, atk: 225, pat: ['attack', 'multi', 'guard', 'charge', 'attack', 'roar'] },
  { hp: 40000, atk: 360, pat: ['attack', 'countdown', 'multi', 'haste', 'charge', 'guard', 'heal'], cd: 3, brk: 0.2 },
  { hp: 28000, hp2: 27000, atk: 470, pat: ['attack', 'multi', 'countdown', 'haste', 'charge', 'attack', 'guard'],
    pat2: ['roar', 'countdown', 'multi', 'haste', 'attack', 'charge', 'heal'], cd: 3, brk: 0.15 },
];
// ハードモード専用の行動パターン（STAGESに上書き）。absorb＝吸収攻撃、seal＝保健封印、issen＝今のHPの9割を削る奥義
const HARD_PAT = [
  { pat: ['attack', 'multi', 'charge', 'guard', 'seal', 'haste'] },
  { pat: ['attack', 'countdown', 'absorb', 'charge', 'haste', 'seal', 'guard', 'roar'], cd: 3, brk: 0.2 },
  { pat: ['multi', 'countdown', 'haste', 'absorb', 'charge', 'seal', 'roar', 'guard', 'heal'], cd: 3, brk: 0.2 },
  { pat: ['attack', 'multi', 'countdown', 'absorb', 'haste', 'charge', 'seal', 'guard'],
    pat2: ['roar', 'countdown', 'multi', 'seal', 'haste', 'attack', 'absorb', 'charge', 'heal'] },
];
// 裏ボス：剣聖クロガネ（ハードモードのみ）
const KUROGANE = { hp: 55000, atk: 470, pat: ['issen', 'attack', 'charge', 'countdown', 'attack', 'multi', 'haste', 'seal', 'issen', 'guard'], cd: 2, brk: 0.16 };
// ワスレーヌ・クロガネの属性は毎ターン回る → 弱点が 算数 ▶ 国語 ▶ 社会 ▶ 理科 ▶ 算数 の順に変わる
const ROTATE_EL = ['国語', '社会', '理科', '算数'];
// エクストリームのみ：ワスレーヌ第3形態（毎ターン属性がランダムに変わる＋教科封印 seal＝封印する確率・2ターン）
const LAST3 = { hp: 350000, atk: 650, pat: ['attack', 'multi', 'issen', 'countdown', 'absorb', 'haste', 'charge', 'roar', 'multi', 'attack'], cd: 2, brk: 0.12, seal: 0.5 };
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
const cap = n => Math.round(n);   // もとのステータスは上限なしで記録（表示・計算は eff で9999まで。法衣があれば突破）
const wait = ms => new Promise(r => setTimeout(r, ms * SPD));
let SC = 1;
// ---------- 画面サイズ合わせ（PC・スマホ共通） ----------
const ROTATE_PORTRAIT = true;   // 縦画面のときはゲーム画面を90度回して最大表示する
function fit() {
  const vv = window.visualViewport, W = vv ? vv.width : innerWidth, H = vv ? vv.height : innerHeight;
  const cs = getComputedStyle($('#safe')), px = v => parseFloat(v) || 0;
  const sl = px(cs.paddingLeft), sr = px(cs.paddingRight), st = px(cs.paddingTop), sb = px(cs.paddingBottom);
  const w = W - sl - sr, h = H - st - sb, rot = ROTATE_PORTRAIT && h > w;
  SC = rot ? Math.min(h / 1280, w / 720) : Math.min(w / 1280, h / 720);
  stage.style.left = (sl + w / 2) + 'px'; stage.style.top = (st + h / 2) + 'px';
  stage.style.transform = `translate(-50%,-50%)${rot ? ' rotate(90deg)' : ''} scale(${SC})`;
}
['resize', 'orientationchange'].forEach(ev => addEventListener(ev, () => { fit(); setTimeout(fit, 300); }));
if (window.visualViewport) visualViewport.addEventListener('resize', fit);
fit(); setTimeout(fit, 100);
// ピンチ・ダブルタップでの拡大を防ぐ
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
// スマホ（Android等）：最初のタップで全画面＋横向き固定をためす（iPhoneは「ホーム画面に追加」で全画面）
function goFullscreen() {
  const d = document.documentElement, standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
  if (standalone || document.fullscreenElement || !matchMedia('(pointer: coarse)').matches) return;
  const req = d.requestFullscreen || d.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(d, { navigationUI: 'hide' });
    const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} setTimeout(fit, 300); };
    p && p.then ? p.then(lock).catch(() => {}) : lock();
  } catch (e) {}
}
document.addEventListener('pointerdown', goFullscreen, { once: false });
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 2200); }
// 1ファイル版では画像を埋めこみデータ（window.__IMG）から読む
const R = p => (window.__IMG && window.__IMG[p]) || p;
window.imgFb = el => { const r = el.dataset.fb ? el.dataset.fb.split('|') : []; if (r.length) { el.src = R(r.shift()); el.dataset.fb = r.join('|'); } else { el.parentElement.classList.add('noimg'); el.remove(); } };
function imgArt(list, emoji, cls = '', style = '') {
  return `<div class="art ${cls}" style="${style}"><img src="${R(list[0])}" data-fb="${list.slice(1).join('|')}" onerror="imgFb(this)" onload="this.nextElementSibling.style.display='none'" alt=""><span class="emo">${emoji}</span></div>`;
}
function setBg(img, grad) { stage.style.backgroundImage = `url("${R(img)}"), ${grad}`; }
function strongAgainst(def) { const j = EL.indexOf(def); return j < 0 ? null : EL[(j + 1) % 4]; }
function mult(atk, def) {
  if (atk === '英語') return 1;
  const i = EL.indexOf(atk), j = EL.indexOf(def);
  if (i < 0 || j < 0) return 1;
  if ((j + 1) % 4 === i) return 2;     // 攻撃側が、敵の「次」の教科なら2倍（例：国語の敵に算数）
  if ((i + 1) % 4 === j) return 0.5;
  return 1;
}
function gauge(sel, r) { $(sel + ' .mask').style.width = (1 - Math.max(0, Math.min(1, r))) * 100 + '%'; }

// ---------- 日付 ----------
const dowOf = d => (d - 1) % 7;                      // 0=月 … 6=日
const weekOf = d => Math.min(3, Math.floor((d - 1) / 7));
const nextBossDay = d => d >= FINAL_DAY ? FINAL_DAY : Math.min(FINAL_DAY, Math.ceil(d / 7) * 7);

// ---------- 自キャラ・ボス ----------
// 紋章・聖紋章はステータスに倍率をかける（最大9999）。失うと元の数値にもどる
function statMul(s) { return Math.pow(EMBLEM.normal, count('boost_' + s)) * Math.pow(EMBLEM.hard, count('h_holy_' + s)) * Math.pow(1.5, count('sr_holy_' + s) + count('lr_robe_' + s)); }
function eff(s) { const v = Math.round(S.st[s] * statMul(s)); return has('lr_robe_' + s) ? v : Math.min(MAXST, v); } // 法衣は9999を突破
// オーバーフロー：法衣がないときに9999をこえている分（内部では記録していて、法衣を手に入れると還元される）
function overflow(s) { return s === '保健' || has('lr_robe_' + s) ? 0 : Math.max(0, Math.round(S.st[s] * statMul(s)) - MAXST); }
const ofTxt = s => overflow(s) > 0 ? `<span style="color:#fca5a5">（オーバーフロー ${fmt(overflow(s))}）</span>` : '';
function plTop() { return SUBJ.reduce((a, s) => eff(s) > eff(a) ? s : a, '国語'); }
function plTier() {
  const v = SUBJ.map(eff), m = Math.max(...v), sum = v.reduce((a, b) => a + b, 0), t = ASSETS.player.tiers;
  return sum >= ASSETS.player.ultTier ? 3 : (m >= t[1] || sum >= ASSETS.player.sumTier) ? 2 : m >= t[0] ? 1 : 0;
}
function playerArt(style = '') {
  const P = ASSETS.player, t = plTier(), top = plTop(), k = ASSETS.romaji[top];
  if (t === 3) return imgArt([P.ultimate, `${P.dir}${k}_2.png`], P.emoji[3], 'aura', `--aura:#fff;${style}`);
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
function newRun(grade, extreme = false) {
  const els = []; while (els.length < 3) { const e = pick(EL); if (e !== els[els.length - 1]) els.push(e); }
  S = {
    grade, day: 0, hp: 600, maxHp: 600,
    st: { 国語: 100, 算数: 100, 理科: 100, 社会: 100, 英語: 100, 保健: 100 },
    skills: [], wrong: [], weekSeen: [], allSeen: [], used: new Set(), deck: {}, recent: [], bossEls: els,
    extreme, bossEl: els[0], correct: 0, total: 0, dmg: 0, beaten: 0, overcome: 0, turnBonus: 0, reviveUsed: false,
  };
  B = null;
  tutorial();
}
function pool(s) {
  let p = DB.filter(q => q.s === s && (S.grade === 0 || q.g <= S.grade));
  if (!p.length) p = DB.filter(q => q.s === s);
  return p;
}
// 教科ごとの「山札」：その教科の問題を一巡するまで同じ問題は出ない
function markRecent(q) { S.recent.push(q.id); if (S.recent.length > 8) S.recent.shift(); }
function drawFromDeck(s) {
  if (!S.deck[s] || !S.deck[s].length) {
    const p = shuffle(pool(s));
    // 最近出た問題は山札の底へ（pop は末尾から引く）
    S.deck[s] = p.filter(q => S.recent.includes(q.id)).concat(p.filter(q => !S.recent.includes(q.id)));
  }
  const q = S.deck[s].pop(); markRecent(q); return q;
}
function drawLessonQ(s) { return drawFromDeck(s); }
function drawBattleQ(s) {
  // 間違えた問題は40%の確率で出す（最近出たものは避ける）
  const w = S.wrong.filter(q => q.s === s && !S.recent.slice(-4).includes(q.id));
  if (w.length && Math.random() < 0.4) { const q = pick(w); markRecent(q); return q; }
  return drawFromDeck(s);
}
const has = id => S.skills.some(k => k.id === id);
const count = id => S.skills.filter(k => k.id === id).length;

// ---------- スキル ----------
const SKICON = { 国語: '📚', 算数: '🧮', 理科: '🧪', 社会: '🗾', 英語: '🔤' };
const SKILLS = [
  ...EL.concat('英語').map(s => ({ id: 'boost_' + s, name: `${SKICON[s]} ${s}の紋章`, desc: `${s}のステータス${EMBLEM.normal}倍（重ねがけOK・最大9999）`, stack: true, r: 1 })),
  { id: 'drain', name: '🦷 ドレインの牙', desc: '与えたダメージの10%だけHP回復' },
  { id: 'half', name: '👓 ひらめきメガネ', desc: 'ボス戦ごとに3回、4択を2択にできる' },
  { id: 'shield', name: '🛡️ ウロコの盾', desc: '受けるダメージ30%カット（大技にも有効）' },
  { id: 'combo', name: '🔥 連続正解の炎', desc: '連続正解するたびダメージ+25%（最大+100%）' },
  { id: 'revive', name: '🪶 不死鳥の羽', desc: '一度だけHP半分で復活' },
  { id: 'master', name: '🎓 まなびの極意', desc: 'レッスンで間違えても大きく能力アップ' },
  { id: 'scholar', name: '📝 予習ノート', desc: 'レッスン正解の能力アップ+200' },
  { id: 'quick', name: '👟 早押しブーツ', desc: '5秒以内に正解するとダメージ1.5倍' },
  { id: 'herb', name: '🌿 薬草ポーチ', desc: '保健の回復量1.5倍' },
  { id: 'crit', name: '💥 かいしんの角', desc: '20%の確率でダメージ2倍' },
  { id: 'breaker', name: '🐾 くだけの爪', desc: 'カウントダウン中のダメージ1.5倍（ブレイクしやすい）' },
].map(k => ({ r: 1, ...k }));
// ハードモード専用アイテム（ハイリスク・ハイリターン）（★★レア）。出現率は DROP_RATE
const SKILLS_HARD = [
  ...EL.concat('英語').map(s => ({ id: 'h_holy_' + s, name: `${SKICON[s]} ${s}の聖紋章`, desc: `${s}のステータス${EMBLEM.hard}倍（重ねがけOK・最大9999）。ただし${s}で間違えると最大HPの20%の反動ダメージ`, stack: true, r: 2 })),
  { id: 'h_vamp', name: '🦷 吸血の牙', desc: '与えたダメージの30%を吸収。ただし保健の回復量が半分になる' },
  { id: 'h_sage', name: '👓 賢者のメガネ', desc: 'ボス戦の問題がすべて2択になる。ただし与えるダメージ0.7倍' },
  { id: 'h_bigshield', name: '🛡️ 竜鱗の大盾', desc: '受けるダメージ50%カット。ただし与えるダメージ0.75倍' },
  { id: 'h_inferno', name: '🔥 連続正解の業火', desc: '連続正解ごとにダメージ+40%（最大+200%）。ただし間違えると最大HPの25%の反動ダメージ' },
  { id: 'h_tail', name: '🪶 不死鳥の尾羽', desc: 'たおれてもHP1で踏みとどまる（ボス戦1回につき1回・次のボス戦でまた使える）。ただし使うと全ステータスが×0.8になる' },
  { id: 'h_ougi', name: '🎓 まなびの奥義', desc: 'レッスン正解の伸びが1.8倍。苦手こくふく（間違えた問題に再正解）の伸びも1.2倍。ただしレッスンで間違えると伸びなし' },
  { id: 'h_godboots', name: '👟 俊足のブーツ', desc: '3秒以内に正解するとダメージ2.5倍。ただしボス戦の全問題に8秒の制限時間' },
  { id: 'h_elixir', name: '🌿 霊薬ポーチ', desc: '保健の回復量2.5倍。ただし保健で間違えると最大HPの20%の反動ダメージ' },
  { id: 'h_bighorn', name: '💥 かいしんの大角', desc: '40%で大会心（ダメージ2倍）、20%で逆会心（ダメージ0.3倍）' },
  { id: 'h_fang', name: '🐾 砕牙の爪', desc: 'カウントダウン中のダメージ2.5倍。それ以外は0.8倍' },
  { id: 'h_haisui', name: '💀 背水の書', desc: 'HPが50%以下のとき与えるダメージ2.5倍。ただし51%以上のときは0.9倍' },
].map(k => ({ r: 2, ...k }));
// 激レア★★★（出現条件は今後）
const SKILLS_SR = [
  ...EL.concat('英語').map(s => ({ id: 'sr_holy_' + s, name: `${SKICON[s]} ${s}の神聖紋章`, desc: `${s}のステータス1.5倍（重ねがけOK・最大9999）。ただし${s}で間違えると最大HPの50%の反動ダメージ`, stack: true })),
  { id: 'sr_chimera', name: '🦷 キメラのアギト', desc: '与えたダメージの50%を吸収。ただし保健の回復量が1/4になる' },
  { id: 'sr_glasses', name: '👓 神のメガネ', desc: '30%の確率で問題が1択になる。ただし与えるダメージ0.7倍' },
  { id: 'sr_aegis', name: '🛡️ アイギスの盾', desc: '受けるダメージ65%カット。ただし与えるダメージ0.7倍' },
  { id: 'sr_blackfire', name: '🔥 黒炎', desc: '連続正解ごとにダメージ+50%（最大+300%）。ただし間違えると最大HPの50%の反動ダメージ' },
  { id: 'sr_blood', name: '🪶 不死鳥の血', desc: 'たおれてもHP50で踏みとどまる（ボス戦1回につき1回・次のボス戦でまた使える）。ただし使うと全ステータスが×0.8になる' },
  { id: 'sr_helm', name: '🎓 賢者の兜', desc: 'レッスン正解の伸び2倍、苦手こくふくの伸び1.5倍。ただしレッスンで間違えるとその教科のステータスが×0.8になる' },
  { id: 'sr_idaten', name: '👟 韋駄天のぞうり', desc: '2秒以内に正解するとダメージ3倍。ただしボス戦の全問題に6秒の制限時間' },
  { id: 'sr_elixir', name: '🌿 秘薬', desc: '保健の回復量4倍。ただし保健で間違えると最大HPの50%の反動ダメージ' },
  { id: 'sr_ichigeki', name: '💥 一撃必殺の刻印', desc: '20%でダメージ5倍。ただし20%でダメージ0.1倍' },
  { id: 'sr_beast', name: '🐾 獣の刻印', desc: 'カウントダウン中のダメージ5倍。それ以外は0.7倍' },
  { id: 'sr_haisui', name: '💀 決死の書', desc: 'HPが80%以下のとき与えるダメージ3倍。ただし81%以上のときは0.75倍' },
].map(k => ({ r: 3, ...k }));
// レジェンド☆（出現条件は今後）
const SKILLS_LR = [
  ...EL.concat('英語').map(s => ({ id: 'lr_robe_' + s, name: `${SKICON[s]} ${s}の法衣`, desc: `${s}のステータス1.5倍（重ねがけOK）。ステータス9999の上限を突破する。ただし${s}で間違えると最大HPの75%の反動ダメージ`, stack: true })),
  { id: 'lr_inferno', name: '🔥 インフェルノ', desc: '連続正解ごとにダメージ+50%（上限なし）。ただし間違えると最大HPの75%の反動ダメージ' },
  { id: 'lr_phoenix', name: '🪶 不死鳥のはく製', desc: 'たおれてもHP100で踏みとどまる（ボス戦1回につき1回・次のボス戦でまた使える）。ただし使うと全ステータスが×0.8になる' },
  { id: 'lr_hermes', name: '👟 ヘルメスのくつ', desc: '1.5秒以内に正解するとダメージ3倍。ただしボス戦の全問題に4秒の制限時間' },
  { id: 'lr_elixir', name: '🌿 古の秘薬', desc: '保健の回復でHP全回復。ただし保健で間違えると最大HPの90%の反動ダメージ' },
  { id: 'lr_haja', name: '💥 覇者の刻印', desc: '50%でダメージ10倍。ただし50%でダメージ0.1倍' },
  { id: 'lr_beastking', name: '🐾 獣王の刻印', desc: 'カウントダウン中のダメージ10倍。それ以外は0.6倍' },
  { id: 'lr_vampire', name: '💀 ヴァンパイアの刻印', desc: 'HPが80%以下のとき与えるダメージ5倍。ただし81%以上のときは0.6倍' },
].map(k => ({ r: 4, ...k }));
// レアリティ：1ノーマル★ 2レア★★ 3激レア★★★ 4レジェンド☆
const RAR = { 1: '　　★', 2: '　★★', 3: '★★★', 4: '　　☆' };
const rStar = k => RAR[k.r || 1];
const iName = k => rStar(k).trim() + k.name;                     // メッセージ用
const iHtml = k => `<span class="rst r${k.r || 1}">${rStar(k)}</span>${k.name}`; // 一覧用（そろえて表示）
const rCls = k => ' rar' + (k.r || 1);
const skTitle = k => `<span class="rst r${k.r || 1}">${rStar(k).trim()}</span><b>${skLabel(k)}</b>`;
// 同じ系統（絵文字が同じ）のアイテムを1つでも持っていたら、その系統は出ない（紋章・法衣など重ねがけOKのものは除く）
const famHeld = k => !k.stack && S.skills.some(x => skIcon(x) === skIcon(k));
// ---- アイテムの出現率（★, ★★, ★★★, ☆ の%）。devil＝悪魔のささやき、base＝それ以外すべて ----
const DROP_RATE = {
  normal:  { base: [85, 10, 5, 0],  devil: [20, 60, 15, 5], ruriLast: [20, 65, 9, 1] },
  hard:    { base: [70, 15, 10, 5], devil: [0, 60, 35, 5], ruriLast: [0, 50, 40, 10] },
  extreme: { base: [30, 40, 20, 10], devil: [0, 50, 40, 10], ruriLast: [0, 0, 40, 60] },   // エクストリーム（今後追加する難易度）
};
const diffKey = () => S.extreme ? 'extreme' : S.grade === 0 ? 'hard' : 'normal';
const POOLS = () => [SKILLS, SKILLS_HARD, SKILLS_SR, SKILLS_LR];
function rollRarity(kind = 'base') {
  const w = DROP_RATE[diffKey()][kind]; let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 4; i++) { if ((x -= w[i]) < 0) return i + 1; } return 1;
}
const canGet = (k, taken) => k.stack || (!has(k.id) && !famHeld(k) && !taken.some(t => t.id === k.id || skIcon(t) === skIcon(k)));
// n個をえらぶ（1個ずつレアリティを抽選。その星の表が空なら、近い星の表から出す）
function skillChoices(n, kind = 'base', pre = []) {
  const out = [...pre];
  for (let i = 0; i < n; i++) {
    const r = rollRarity(kind), order = [r, r - 1, r - 2, r - 3, r + 1, r + 2, r + 3].filter(x => x >= 1 && x <= 4);
    for (const rr of order) {
      const c = POOLS()[rr - 1].filter(k => canGet(k, out) && !out.includes(k));
      if (c.length) { out.push(pick(c)); break; }
    }
  }
  return pre.length ? shuffle(out) : out;
}
// ルリのおみせ（最終週）：確定枠つきの3枚
function ruriLastChoices() {
  const d = diffKey(), from = (pool, f = () => true) => pick(pool.filter(k => canGet(k, []) && f(k)));
  let g;
  if (d === 'normal') g = from(SKILLS_SR);                                           // 激レア確定
  else if (d === 'hard') g = from(Math.random() < 0.8 ? SKILLS_SR : SKILLS_LR) || from(SKILLS_SR) || from(SKILLS_LR); // 激レア以上確定（40:10）
  else {                                                                             // 一番高い教科の法衣確定（持っていたら他のレジェンド）
    const top = ['国語', '算数', '理科', '社会', '英語'].reduce((a, x) => eff(x) > eff(a) ? x : a, '国語');
    g = has('lr_robe_' + top) ? from(SKILLS_LR, k => k.id !== 'lr_robe_' + top) : SKILLS_LR.find(k => k.id === 'lr_robe_' + top);
  }
  return skillChoices(g ? 2 : 3, 'ruriLast', g ? [g] : []);
}
// 師匠のおくりもの：一番高い教科の紋章（レアリティ抽選：紋章→聖紋章→神聖紋章→法衣）
function emblemGift(top) { return POOLS()[rollRarity() - 1].find(k => k.stack && k.id.endsWith('_' + top)); }
const skIcon = k => k.name.split(' ')[0], skLabel = k => k.name.split(' ').slice(1).join(' ');
// ⑤ 入手したアイテムの効果を表示（クリックでとじる）
function showItem(k, verb = '手に入れた') {
  return new Promise(res => {
    const m = $('#modal');
    m.innerHTML = `<div class="modalBox pop${rCls(k)}"><div style="font-size:18px;color:#b45309">🎁 ${verb}！</div><div style="font-size:72px;line-height:1.1">${skIcon(k)}</div>${skTitle(k)}<p>${k.desc}</p><div style="font-size:14px;color:#888;margin-top:8px">クリックでとじる</div></div>`;
    m.style.display = 'flex';
    m.onclick = e => { e.stopPropagation(); m.style.display = 'none'; m.onclick = null; res(); };
  });
}
// ② 7個目を入手したら、すてるアイテムを選ぶ
function discardItem() {
  return new Promise(res => {
    msg(`<div>アイテムがいっぱい！（最大${MAX_ITEMS}個）すてるアイテムをえらんでね</div><div class="sub">左のリストをクリックすると効果を確認できるよ</div>`);
    setChoices('c4', S.skills.map((k, i) => ({
      html: `<button class="skcard mini pop${rCls(k)}"><span class="skic">${skIcon(k)}</span>${skTitle(k)}${i === S.skills.length - 1 ? '<span class="newtag">NEW</span>' : ''}</button>`,
      on: async () => { const [x] = S.skills.splice(i, 1); clearChoices(); renderSide(); await say(`「${iName(x)}」をすてた`, 1000); res(); },
    })));
  });
}
async function gainItem(k, verb) {
  const robe = k.id.startsWith('lr_robe_') ? k.id.slice(8) : null, ov = robe ? overflow(robe) : 0, e0 = robe ? eff(robe) : 0;
  S.skills.push(k); renderSide();
  await showItem(k, verb);
  if (robe && ov > 0) { anim('#face', 'hurt'); await say(`✨ ${k.name}の力で、たまっていたオーバーフロー ${fmt(ov)} が解放された！ <span style="color:${COLOR[robe]}">${robe}</span> ${fmt(e0)} → ${fmt(eff(robe))}`, 1800); }
  if (S.skills.length > MAX_ITEMS) await discardItem();
}
function skillPopup(k) {
  const m = $('#modal');
  m.innerHTML = `<div class="modalBox pop${rCls(k)}"><div style="font-size:64px;line-height:1.1">${skIcon(k)}</div>${skTitle(k)}<p>${k.desc}</p><button class="btn" style="margin-top:12px">とじる</button></div>`;
  m.style.display = 'flex'; m.onclick = e => { e.stopPropagation(); m.style.display = 'none'; };
}
document.addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c && S) { e.stopPropagation(); skillPopup(S.skills[c.dataset.k]); } }, true);

// ---------- 画面の部品 ----------
function renderSide(phase) {
  $('#side').style.display = 'block';
  if (phase) $('#phase').innerHTML = phase;
  swapArt($('#face'), playerArt());
  gauge('#pGauge', S.hp / S.maxHp);
  $('#hpNum').textContent = `${fmt(S.hp)}/${fmt(S.maxHp)}`;
  $('#stats').innerHTML = SUBJ.map(s => { const up = statMul(s) > 1; return `<div><span style="color:${COLOR[s]}">${s}</span><span style="color:${up ? '#ffd54a' : COLOR[s]}">${up ? '▲' : ''}${eff(s)}</span></div>`; }).join('');
  $('#items').innerHTML = `<div class="ol">所持アイテム ${S.skills.length}/${MAX_ITEMS}</div>` + (S.skills.length ? S.skills.map((k, i) => `<div class="it ol" data-k="${i}">${iHtml(k)}</div>`).join('') : '<div class="it ol" style="text-decoration:none;opacity:.6">なし</div>');
}
function renderInfo() {
  $('#info').style.display = 'block';
  const d = S.day, w = dowOf(d);
  const dowColor = w === 5 ? '#4f6bff' : w === 6 ? '#ff3b4f' : '#fff';
  $('#dayN').innerHTML = d === FINAL_DAY ? '<span class="box" style="font-size:34px">FINAL</span>' : `<span class="box">${d}日目</span>`;
  $('#dow').innerHTML = d === FINAL_DAY ? '<span style="font-size:28px">ファイナルデー</span>' : `<span style="color:${dowColor}">${DOW[w]}</span>`;
  let next = S.extreme ? '<span style="color:#e879f9">💀EXTREME</span><br>' : S.grade === 0 ? '<span style="color:#ff5252">🔥HARD</span><br>' : '';
  if (B) {
    const good = strongAgainst(S.bossEl);
    next += `${bName()}<br><span style="color:${COLOR[good]}">${good}</span>が弱点`;
  } else if (d < FINAL_DAY) {
    const nb = nextBossDay(d), el = S.bossEls[weekOf(nb)];
    next += `次回のボス<br>${nb - d === 0 ? '今日！' : `${nb - d}日後`}<br>${bossData(el).name}<br><span style="color:${COLOR[strongAgainst(el)]}">${strongAgainst(el)}</span>が弱点`;
  }
  $('#next').innerHTML = next;
}
// キャラの入れかえ：ちがうキャラになったときだけ「ジワ〜っと」あらわれる
function swapArt(el, html) {
  const key = (html.match(/src="([^"]+)"/) || [])[1] || html;
  if (html && el.dataset.key === key && el.innerHTML) return;
  el.dataset.key = key; el.innerHTML = html;
  const a = el.firstElementChild; if (a && html && !a.classList.contains('slidein')) a.classList.add('appear');
}
function setChara(html) { swapArt($('#chara'), html); }
// 撃破：明滅してから崩れ落ちる
function defeatFx() {
  const ba = $('#bossArt'); if (!ba) return;
  ba.classList.add('defeat'); $('#chara').dataset.key = '';
  setTimeout(() => { const p = bossPoint(); particles({ x: p.x, y: p.y + 120 }, ['✦', '·', '◆'], '#cbd5e1', 18, 22, 160); }, 900 * SPD);
}
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
    if (opt.auto2) { const btns = [...$('#choices').children]; shuffle(btns.map((b, i) => i).filter(i => !order[i].ok)).slice(0, Math.max(0, order.length - 2)).forEach(i => btns[i].classList.add('hide')); }
    if (opt.auto1) { const btns = [...$('#choices').children]; btns.forEach((b, i) => { if (!order[i].ok) b.classList.add('hide'); }); }
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
// ---------- パスワードロック（セーブなし：ページを開き直すとロックにもどる） ----------
const PASSWORD = { hard: '961', extreme: '621' };   // 961＝くろい、621＝むずい
const UNLOCK = { hard: false, extreme: false };   // 解除はブラウザに保存（下の store から読みこむ）
const LOCK_HINT = {
  hard: '<b style="display:inline;font-size:22px">解禁条件</b><br>ノーマル（4〜6年）を<br>ノーコンティニューでクリア',
  extreme: '<b style="display:inline;font-size:22px">解禁条件</b><br>ハードを<br>ノーコンティニューでクリア',
};
function lockNotice(html) {
  const m = $('#modal'); m.style.display = 'flex';
  m.innerHTML = `<div class="modalBox pop"><div style="font-size:60px;line-height:1.1">🔒</div><p style="line-height:1.6">${html}</p><button class="btn" style="margin-top:12px">とじる</button></div>`;
  m.onclick = () => { m.style.display = 'none'; m.onclick = null; };
}
function passScreen() {
  const d = [0, 0, 0];
  $('#panelIn').innerHTML = `
    <h2 class="ol" style="font-size:34px;margin:0 0 6px">🔑 パスワード</h2>
    <p style="text-align:center;margin:0 0 10px">▲▼で3けたの数字を合わせて「確定！」</p>
    <div class="dial">${[0, 1, 2].map(i => `<div class="dcol"><button class="dbtn" data-i="${i}" data-v="1">▲</button><div class="dgt" id="dn${i}">0</div><button class="dbtn" data-i="${i}" data-v="-1">▼</button></div>`).join('')}</div>
    <div id="passMsg" class="passmsg">&nbsp;</div>
    <div class="row"><button class="btn gold" id="passOk" style="font-size:28px;padding:10px 50px">確定！</button><button class="btn gray" id="passBack">もどる</button></div>`;
  $('#panelIn').querySelectorAll('.dbtn').forEach(b => b.onclick = () => {
    const i = +b.dataset.i; d[i] = (d[i] + +b.dataset.v + 10) % 10;
    const n = $('#dn' + i); n.textContent = d[i]; anim('#dn' + i, 'dspin');
  });
  $('#passBack').onclick = () => title();
  $('#passOk').onclick = () => {
    const code = d.join(''), pm = $('#passMsg');
    const hit = code === PASSWORD.extreme ? 'extreme' : code === PASSWORD.hard ? 'hard' : null;
    if (!hit) { pm.className = 'passmsg ng'; pm.textContent = 'にんしょうしっぱい・・・'; anim('.dial', 'shake'); return; }
    UNLOCK.hard = true; if (hit === 'extreme') UNLOCK.extreme = true;
    store.unlock = { ...UNLOCK }; persist();
    pm.className = 'passmsg ok'; pm.textContent = hit === 'extreme' ? 'エクストリームが解除されました！' : 'ハードが解除されました！';
    $('#passOk').disabled = true;
    setTimeout(() => title(hit), 1400);
  };
}
// ---------- 1日3回の挑戦・遊べる時間・セーブ（ブラウザの中だけに保存） ----------
const PLAY_HOURS = [8, 20];            // 8時〜20時だけ遊べる（竜がおきている時間）
const CONT_SCORE = 0.5;                // コンティニューしたときの最終スコア倍率
const CONT_RANK_MAX = 'C';             // コンティニューしたときのランク上限
const NOLIMIT = !!window.FAST;         // 自動テスト中は制限なし・保存なし
const SKEY = 'manabiDragon.v1';
const store = (() => { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } })();
if (store.unlock) Object.assign(UNLOCK, store.unlock);
if (NOLIMIT) Object.assign(UNLOCK, { hard: true, extreme: true });
function persist() { if (NOLIMIT) return; try { localStorage.setItem(SKEY, JSON.stringify(store)); } catch (e) {} }
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const awake = () => { if (NOLIMIT) return true; const h = new Date().getHours(); return h >= PLAY_HOURS[0] && h < PLAY_HOURS[1]; };
const DAILY_PLAYS = 3;                 // 1日に挑戦できる回数（ためられない）
const playsLeft = () => NOLIMIT ? 99 : Math.max(0, DAILY_PLAYS - (store.plays && store.plays.date === today() ? store.plays.n : 0));
const playedToday = () => playsLeft() <= 0;
// --- 状態を保存できる形に変える（問題・アイテムは名前で記録） ---
const ALL_ITEMS = () => [...SKILLS, ...SKILLS_HARD, ...SKILLS_SR, ...SKILLS_LR];
let PK = null;   // 保存中だけ使う検索用セット
function pack(v) {
  if (!PK) { PK = { q: new Set(DB), k: new Set(ALL_ITEMS()) }; try { return pack(v); } finally { PK = null; } }
  if (v instanceof Set) return { __set: [...v].map(pack) };
  if (Array.isArray(v)) return v.map(pack);
  if (v && typeof v === 'object') {
    if (PK.q.has(v)) return { __q: v.q };
    if (PK.k.has(v)) return { __k: v.id };
    const o = {}; for (const k in v) o[k] = pack(v[k]); return o;
  }
  return v;
}
function unpack(v) {
  if (Array.isArray(v)) return v.map(unpack).filter(x => x !== undefined);
  if (v && typeof v === 'object') {
    if (v.__set) return new Set(v.__set.map(unpack));
    if (v.__q !== undefined) return DB.find(q => q.q === v.__q);
    if (v.__k !== undefined) return ALL_ITEMS().find(k => k.id === v.__k);
    const o = {}; for (const k in v) o[k] = unpack(v[k]); return o;
  }
  return v;
}
function stOf(b) { return b.phase3 ? LAST3 : b.idx === 4 ? KUROGANE : S.grade === 0 ? { ...STAGES[b.idx], ...HARD_PAT[b.idx], hp: STAGES[b.idx].hp * DIFF().hp, hp2: STAGES[b.idx].hp2 && STAGES[b.idx].hp2 * DIFF().hp } : STAGES[b.idx]; }
// where：'day'（その日の最初から）／'lesson'（教科えらび）／'battle'（バトル中）
function saveGame(where) {
  if (NOLIMIT || !S || S.over) return;
  const st = { ...S, t0: undefined, elapsed: S.t0 ? Date.now() - S.t0 : 0 };
  const b = B ? { ...B, st: undefined } : null;
  store.save = { where, S: pack(st), B: pack(b), at: Date.now() };
  persist();
}
function clearSave() { delete store.save; persist(); }
// 遊べる時間がおわったら、その場で中断してタイトルへ
async function sleepCheck() {
  if (awake()) return false;
  clearChoices(); hideSuspend();
  await say(`${ASSETS.master.name}「竜がねむくなってきたようだ…。つづきは明日の${PLAY_HOURS[0]}時から${PLAY_HOURS[1]}時のあいだにしよう。」`, 0);
  title(); return true;
}
function showSuspend() { if (!NOLIMIT) $('#suspendBtn').style.display = 'block'; }
function hideSuspend() { $('#suspendBtn').style.display = 'none'; }
function suspendGame() {
  hideSuspend(); clearChoices();
  title(); toast('中断しました。「つづきから」で再開できます');
}
async function resumeGame() {
  const sv = store.save; if (!sv) return title();
  $('#panel').style.display = 'none'; $('#panel').classList.remove('title');
  S = unpack(sv.S); S.t0 = Date.now() - (S.elapsed || 0);
  B = sv.B ? unpack(sv.B) : null; if (B) B.st = stOf(B);
  $('#msgbar').style.display = 'flex';
  if (sv.where === 'battle' && B) {
    const bg = B.phase3 ? '' : B.idx === 4 ? ASSETS.bg.result : B.idx === 3 ? (B.phase2 ? ASSETS.bg.last2 : ASSETS.bg.last) : ASSETS.bg.battle[B.idx];
    setBg(bg, B.phase3 ? 'linear-gradient(#fff,#fff)' : GRAD[B.idx === 4 ? 0 : B.idx]);
    $('#bossHp').style.display = 'block'; $('#intent').style.display = 'block';
    drawBoss(); renderSide(B.idx === 4 ? '最後の<br>試練' : B.idx === 3 ? 'ファイナル<br>バトル' : '教科ボス<br>バトル'); renderInfo(); updateUI();
    await say('▶ つづきから再開！', 900);
    if (S.pendQ) return doTurn(S.pendQ.s);
    return showCmd();
  }
  if (sv.where === 'lesson') { await say('▶ つづきから再開！', 900); if (S.pendQ) { lessonScene('教科強化<br>フェーズ'); return lesson(S.pendQ.s); } return lessonDay(); }
  await say('▶ つづきから再開！', 900);
  dayBody(S.day);
}
// 前回の結果（その日の挑戦が終わったあとに見られる）
function showLastResult() {
  const L = store.lastResult; if (!L) return;
  $('#panelIn').classList.add('resmode'); $('#panelIn').innerHTML = L.html;
  $('#panel').classList.remove('title'); $('#panel').onclick = null;
  $('#again').onclick = () => title();
  $('#copy').onclick = () => { navigator.clipboard ? navigator.clipboard.writeText(L.share).then(() => toast('コピーしました'), () => prompt('コピーしてね', L.share)) : prompt('コピーしてね', L.share); };
}
// ---------- 冒険の記録（モードごとのハイスコア＋前回の記録） ----------
const MODES = [['4', '4年生'], ['5', '5年生'], ['6', '6年生'], ['hard', '🔥 ハード'], ['extreme', '💀 エクストリーム']];
const modeOf = () => S.grade ? String(S.grade) : S.extreme ? 'extreme' : 'hard';
function recordScreen() {
  const best = store.best || {}, RC = { SSS: '#fff7ae', SS: '#7dd3fc', S: '#ffd54a', A: '#f472b6', B: '#38bdf8', C: '#4ade80', D: '#cbd5e1' };
  $('#panel').classList.remove('title'); $('#panel').onclick = null; $('#panelIn').classList.remove('resmode');
  $('#panelIn').innerHTML = `<h2 class="ol" style="font-size:32px;margin:0 0 8px">📜 冒険の記録</h2>
    <table class="rectbl"><tr><th>モード</th><th>ハイスコア</th><th>ランク</th><th>けっか</th><th>日付</th><th></th></tr>
    ${MODES.map(([k, n]) => { const r = best[k]; return r ? `<tr><td>${n}</td><td class="num">${fmt(r.score)}</td><td><b style="color:${RC[r.rank]}">${r.rank}</b></td><td>${r.label}</td><td>${r.date}</td><td><button class="btn gray recv" data-k="${k}">見る</button></td></tr>`
      : `<tr class="none"><td>${n}</td><td colspan="5">まだ記録がないよ</td></tr>`; }).join('')}</table>
    <div class="row" style="margin-top:12px">${store.lastResult ? '<button class="btn" id="lastBtn">前回の記録を見る</button>' : ''}<button class="btn gray" id="recBack">もどる</button></div>`;
  $('#panelIn').querySelectorAll('.recv').forEach(b => b.onclick = () => showResultSnap(best[b.dataset.k]));
  if ($('#lastBtn')) $('#lastBtn').onclick = () => showResultSnap(store.lastResult);
  $('#recBack').onclick = () => title();
  $('#panel').style.display = 'flex';
}
function showResultSnap(L) {
  if (!L) return;
  $('#panelIn').classList.add('resmode'); $('#panelIn').innerHTML = L.html;
  $('#again').textContent = '記録にもどる'; $('#again').onclick = recordScreen;
  $('#copy').onclick = () => { navigator.clipboard ? navigator.clipboard.writeText(L.share).then(() => toast('コピーしました'), () => prompt('コピーしてね', L.share)) : prompt('コピーしてね', L.share); };
}
function confirmStart(grade, extreme) { newRun(grade, extreme); }
// タイトルの状態：ねている／つづきから／今日はおわり／えらべる
function titleMode() { return awake() && !store.save && !playedToday(); }
function titleState() {
  const last = '';
  if (!awake()) return `<div class="tstate">💤 竜はねむっている…<br><small>${PLAY_HOURS[0]}時〜${PLAY_HOURS[1]}時にまた来よう！</small></div><div class="row">${last}</div>`;
  if (store.save) { const v = store.save.S; return `<div class="row"><button class="btn gold" id="contBtn" style="font-size:28px;padding:12px 40px">▶ つづきから（${v.grade ? v.grade + '年' : v.extreme ? 'エクストリーム' : 'ハード'}・${v.day}日目）</button>${last}</div>`; }
  if (playedToday()) return `<div class="tstate">🌙 今日の挑戦はおわり！<br><small>また明日、${PLAY_HOURS[0]}時〜${PLAY_HOURS[1]}時に挑戦しよう</small></div><div class="row">${last}</div>`;
  return `<h2>学年をえらぶ <small style="font-size:16px">（今日はあと${playsLeft()}回挑戦できるよ）</small></h2>${last ? `<div class="row" style="margin:-4px 0 4px">${last}</div>` : ''}`;
}
function title(justUnlocked) {
  $('#panelIn').classList.remove('resmode');
  S = null; B = null; hideSuspend();
  setBg(ASSETS.bg.title, GRAD[0]);
  ['#side', '#info', '#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none');
  setChara(''); clearChoices(); msg('');
  $('#msgbar').style.display = 'none';
  const cnt = SUBJ.map(s => `<span class="chip" style="background:${BTNC[s]}">${s} ${DB.filter(q => q.s === s).length}</span>`).join('');
  $('#panelIn').innerHTML = `
    <img src="${R(ASSETS.logo)}" alt="まなびドラゴン" class="logo" onerror="this.outerHTML='<h1 class=&quot;ol&quot;>まなびドラゴン</h1>'">
    <p style="text-align:center">勉強して竜を育て、3週間後の天使をたおせ！</p>
    ${titleState()}
    <div class="row" ${titleMode() ? '' : 'style="display:none"'}><button class="btn" data-g="4">4年生</button><button class="btn" data-g="5">5年生</button><button class="btn" data-g="6">6年生</button><button class="btn${UNLOCK.hard ? '' : ' locked'}${justUnlocked === 'hard' || justUnlocked === 'extreme' ? ' unlocked' : ''}" data-g="0" data-lock="hard" style="background:#b91c1c">${UNLOCK.hard ? '' : '🔒'}🔥 ハード</button><button class="btn${UNLOCK.extreme ? '' : ' locked'}${justUnlocked === 'extreme' ? ' unlocked' : ''}" data-g="0" data-x="1" data-lock="extreme" style="background:linear-gradient(135deg,#4c1d95,#111)">${UNLOCK.extreme ? '' : '🔒'}💀 エクストリーム</button></div>
    <p style="text-align:center;font-size:15px;margin-top:4px">ハード：4〜6年の全問題／与ダメ↓・被ダメ↑／スコア1.5倍　💀エクストリーム：さらにきびしい／スコア2倍</p>
    
    <div class="chips" style="margin-top:12px">${cnt}</div>
    <div class="row"><button class="btn gray" id="recBtn" style="font-size:20px;padding:8px 22px">📜 冒険の記録</button></div>`;
  $('#panel').style.display = 'flex'; $('#panel').classList.add('title');
  $('#panelIn').querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const L = b.dataset.lock; if (L && !UNLOCK[L]) return lockNotice(LOCK_HINT[L]); confirmStart(+b.dataset.g, !!b.dataset.x); });
  if ($('#contBtn')) $('#contBtn').onclick = resumeGame;
  // かくしコマンド：「保健」のチップを20回おすとパスワード入力（デバッグ用）
  { let n = 0; const c = $('#panelIn .chips .chip:last-child'); if (c) c.onclick = () => { if (++n >= 20) passScreen(); }; }
  if (!justUnlocked && store.newUnlock) { justUnlocked = store.newUnlock; delete store.newUnlock; persist(); return title(justUnlocked); }
  if (justUnlocked) {
    fxAdd('<div class="flash" style="background:#fff"></div>', 900); anim('#panelIn', 'shakeBig');
    $('#panelIn').insertAdjacentHTML('afterbegin', `<div class="unlockMsg">🔓 ${justUnlocked === 'extreme' ? 'エクストリーム' : 'ハード'}が解禁されました！</div>`);
  }
  $('#recBtn').onclick = recordScreen;
}

// ---------- チュートリアル（1画面・1クリックで1日目へ） ----------
function tutorial() {
  $('#panelIn').classList.remove('resmode');
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
      <div class="thead">② 教科の相性（矢印の先の敵に <b style="color:#fde047">2倍</b> ダメージ／逆向きは ½）</div>
      <div class="tcycle">
        ${node('算数', '水')}<span class="arr">▶</span>${node('国語', '炎')}<span class="arr">▶</span>${node('社会', '雷')}<span class="arr">▶</span>${node('理科', '草')}<span class="arr">▶</span>${node('算数', '水')}
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
    <div class="row" style="margin-top:6px;align-items:center"><button class="btn gray" id="tback" style="font-size:20px;padding:8px 22px">◀ もどる</button><button class="btn gold" id="tgo" style="font-size:26px;padding:8px 60px">1日目へ ▶</button></div>
    <p style="text-align:center;font-size:14px;margin:2px 0 0">${NOLIMIT ? '' : `「1日目へ」で今日の挑戦を1回使うよ（あと${playsLeft()}回）／`}コンティニューは<b style="color:#fde047;display:inline;font-size:14px">1回だけ</b>（挑戦を1回使う・スコア半分）</p>
  </div>`;
  P.style.display = 'flex';
  const go = () => {
    P.style.display = 'none';
    if (!NOLIMIT) { const t = today(); store.plays = { date: t, n: (store.plays && store.plays.date === t ? store.plays.n : 0) + 1 }; persist(); }
    goDay(1);
  };
  P.onclick = null; $('#tgo').onclick = go; $('#tback').onclick = () => { S = null; title(); };
}

// ---------- 1日の進行 ----------
async function goDay(d) {
  if (d === 1 && !S.t0) S.t0 = Date.now();   // 1日目の開始からタイマー（画面には出さない）
  const from = S.day; S.day = d;
  const wk = weekOf(d);
  if (wk < 3) S.bossEl = S.bossEls[wk];
  if (dowOf(d) === 0 && d < FINAL_DAY) S.weekSeen = [];
  await dateCut(from, d);
  $('#msgbar').style.display = 'flex';
  S.pendQ = null; saveGame('day');
  if (await sleepCheck()) return;
  dayBody(d);
}
async function dayBody(d) {
  $('#msgbar').style.display = 'flex';
  if (d === FINAL_DAY) return finalDay();
  if (dowOf(d) === 6) return battleStart();
  if (dowOf(d) === 5) return saturday();
  if (dowOf(d) === 2 && S.wedDone !== d) { S.wedDone = d; saveGame('day'); lessonScene('ランダム<br>イベント'); await wedEvent(); }
  lessonDay();
}
const dim = on => $('#dim').classList.toggle('on', on);
// 水曜のキャラ：暗転中もキャラだけは明るく見せる
function eventChara(c) { setChara(imgArt([c.img], c.emoji)); $('#chara').classList.add('lit'); }
function eventCharaOff() { $('#chara').classList.remove('lit'); }
async function wedEvent() {
  const x = Math.random(), M = ASSETS.master.name;
  if (x < 0.3) {                                   // 拾った！：スカウトのハヤテが落としていく
    const C = ASSETS.scout;
    setChara(imgArt([C.img], C.emoji, 'slidein'));
    await say(`${C.name}「${pick(C.lines.hello)}」`, 0);
    const ch = $('#chara .art, #chara .emo'); if (ch) ch.classList.add('runaway');
    await wait(600); setChara('');
    const k = skillChoices(1)[0];
    await say('…あれ？ ハヤテが何か落としていったぞ！', 1200);
    await gainItem(k, '拾った');
    await say(`${C.name}（遠くから）「${pick(C.lines.after)}」`, 0);
  } else if (x < 0.6) {                            // 師匠からのおくりもの（暗転なし）
    const top = ['国語', '算数', '理科', '社会', '英語'].reduce((a, s) => eff(s) > eff(a) ? s : a, '国語');
    const k = emblemGift(top);
    await say(`${M}「がんばっている君に、これを」`, 0);
    await gainItem(k, 'もらった');
  } else if (x < 0.9) {                            // くじびき：おみくじ娘ミコト
    const C = ASSETS.omikuji;
    dim(true); eventChara(C); await wait(400);
    await say('🎐 くじびきイベント！', 1100);
    await say(`${C.name}「${pick(C.lines.hello)}」`, 0);
    await new Promise(res => {
      msg(`${C.name}「……3つのうち、ひとつ。」`);
      setChoices('c3', skillChoices(3).map(k => ({
        html: `<button class="skcard pop${rCls(k)}"><span class="skic">${skIcon(k)}</span>${skTitle(k)}${k.desc}</button>`,
        on: async () => { clearChoices(); await gainItem(k, 'くじで当たった'); res(); },
      })));
    });
    await say(`${C.name}「${pick(C.lines.after)}」`, 0);
    eventCharaOff(); dim(false);
  } else {                                         // 悪魔のささやき：悪魔公ヴァルツ
    const D = ASSETS.devil;
    dim(true); eventChara(D); await wait(400);
    await say('😈 悪魔のささやき…', 1200);
    await say(`${D.name}「${pick(D.lines.hello)}」`, 0);
    const yes = await new Promise(res => {
      msg(`<div>${D.name}「今持っているアイテムを<b style="color:#fca5a5">すべて捨てれば</b>、かわりにアイテムを<b style="color:#fca5a5">${MAX_ITEMS}個</b>くれてやろう…<br>ただし、おまえの<b style="color:#fca5a5">一番高い力</b>を少しいただくがな…」</div><div class="sub">左のリストをクリックすると、今のアイテムの効果を確認できるよ</div>`);
      setChoices('c2', [
        { html: '<button class="skcard pop" style="text-align:center"><b style="color:#7c3aed">はい</b>すべて捨てて、ランダムに6個もらう<br>（一番高いステータスが×0.9）</button>', on: () => res(true) },
        { html: '<button class="skcard pop" style="text-align:center"><b>いいえ</b>今のアイテムのままにする</button>', on: () => res(false) },
      ]);
    });
    clearChoices();
    if (yes) {
      await say(`${D.name}「${pick(D.lines.yes)}」`, 0);
      S.skills = []; renderSide();
      await say('アイテムが闇にのみこまれた…！ そして…', 1300);
      const mx = Math.max(...SUBJ.map(x => S.st[x])), top = pick(SUBJ.filter(x => S.st[x] === mx)); // 同値ならランダム
      const b0 = eff(top); S.st[top] = Math.max(1, Math.floor(S.st[top] * 0.9)); renderSide(); anim('#face', 'hurt');
      await say(`😈 <span style="color:${COLOR[top]}">${top}</span>の力をうばわれた！ ${b0} → ${eff(top)}${ofTxt(top)}`, 1400);
      for (let i = 0; i < MAX_ITEMS; i++) await gainItem(skillChoices(1, 'devil')[0], '悪魔からもらった');
    } else await say(`${D.name}「${pick(D.lines.no)}」`, 0);
    eventCharaOff(); dim(false);
  }
  await wait(300);
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
    for (const t of ST('day1')) await say(`${ASSETS.master.name}「${t}」`, 0);
  }
  const good = strongAgainst(S.bossEl);
  msg(`${ASSETS.master.name}「今日はどの教科を勉強する？」`);
  S.pendQ = null; saveGame('lesson'); showSuspend();
  setChoices('c3', SUBJ.map(s => {
    const tag = s === good ? 'ボスに2倍' : s === '保健' ? 'HP最大値UP' : s === '英語' ? 'いつでも等倍' : '';
    return { html: `<button class="sbtn pop" style="background:${BTNC[s]}">${ICON[s]} ${s}<small>${eff(s)}</small>${tag ? `<span class="tag">${tag}</span>` : ''}</button>`, on: () => lesson(s) };
  }));
}
async function lesson(s) {
  hideSuspend();
  const P = S.pendQ && S.pendQ.kind === 'lesson' && S.pendQ.q ? S.pendQ : null;   // 再開：同じ問題・同じ答えのまま続ける
  const q = P ? P.q : drawLessonQ(s);
  S.pendQ = P || { kind: 'lesson', s, q }; saveGame('lesson');
  if (!S.weekSeen.includes(q)) S.weekSeen.push(q);
  if (!S.allSeen.includes(q)) S.allSeen.push(q);
  const tierBefore = plTier(), topBefore = plTop();
  const r = S.pendQ.r || await ask(q, { head: `${ICON[s]} ${s}レッスン` });
  S.pendQ.r = r; saveGame('lesson');
  S.total++;
  let gain;
  if (r.ok) { S.correct++; gain = (500 + rnd(301) + (has('scholar') ? 200 : 0)) * (has('h_ougi') ? 1.8 : 1) * (has('sr_helm') ? 2 : 1); }
  else { gain = has('h_ougi') ? 0 : has('master') ? 400 + rnd(151) : 150 + rnd(101); if (!S.wrong.includes(q)) S.wrong.push(q); }
  if (!r.ok && has('sr_helm')) { S.st[s] = Math.max(1, Math.floor(S.st[s] * 0.8)); gain = 0; await say(`🎓 賢者の兜の反動… ${s}のステータスが×0.8！`, 1100); }
  const before = eff(s); S.st[s] = cap(S.st[s] + gain); gain = eff(s) - before;
  let extra = '';
  if (s === '保健') { const hp = r.ok ? HP_UP[0] : HP_UP[1]; S.maxHp += hp; S.hp += hp; extra = `　HP最大値 +${hp}`; }
  renderSide();
  const up = `<span style="color:${COLOR[s]}">${s} +${gain}</span>${r.ok ? ' だいアップ！' : ' すこしアップ'}${ofTxt(s)}${extra}`;
  if (r.ok) await say(`⭕ せいかい！　${up}`, 1500);
  else await say(explainHTML(q, `❌ ざんねん…　${up}　<span class="sub">（この問題はボス戦でも出るよ）</span>`), 0);
  if (plTier() > tierBefore) { anim('#face', 'hurt'); await say(`✨ ${ASSETS.player.name}が進化した！ ✨`, 1500); }
  else if (plTier() > 0 && plTop() !== topBefore) await say(`${ASSETS.player.name}のすがたが「${plTop()}」タイプに変わった！`, 1300);
  if (Math.random() < SKILL_DROP) { clearChoices(); const k = skillChoices(1)[0]; await say(`🎁 アイテム「${iName(k)}」をひろった！`, 900); await gainItem(k, 'ひろった'); }
  clearChoices();
  goDay(S.day + 1);
}
function saturday() {
  lessonScene('ルリの<br>おみせ');
  const R = ASSETS.merchant;
  setChara(imgArt([R.img], R.emoji));
  const hello = weekOf(S.day) === 2 ? R.lines.helloLast : pick(R.lines.hello);
  msg(`<div>${R.name}「${hello}」</div><div class="sub">ひとつえらんでね（無料！）</div>`);
  if (!S.shop || S.shop.day !== S.day) { S.shop = { day: S.day, ch: weekOf(S.day) === 2 ? ruriLastChoices() : skillChoices(3) }; saveGame('day'); }
  const ch = S.shop.ch; showSuspend();
  setChoices('c3', ch.map(k => ({
    html: `<button class="skcard pop${rCls(k)}"><span class="skic">${skIcon(k)}</span>${skTitle(k)}${k.desc}</button>`,
    on: async () => { clearChoices(); hideSuspend(); await gainItem(k, 'ルリからもらった'); await say(`${ASSETS.merchant.name}「${pick(ASSETS.merchant.lines.thanks)}」`, 0); goDay(S.day + 1); },
  })));
}
async function finalDay() {
  lessonScene('ファイナル<br>デー');
  setBg(ASSETS.bg.last, GRAD[3]);
  for (const t of ST('final')) await say(`${ASSETS.master.name}「${t}」`, 0);
  await say(`${ASSETS.master.name}「やつは属性を変えて戦う。たおしても油断するな…闇の力で復活するかもしれん。カウントダウン大技はブレイクで止めるのだ！」`, 0);
  battleStart();
}

// =================== ボス戦 ===================
function battleStart(special) {
  const kuro = special === 'kurogane';
  const idx = kuro ? 4 : weekOf(S.day), last = idx === 3;
  const st = kuro ? KUROGANE : S.grade === 0 ? { ...STAGES[idx], ...HARD_PAT[idx], hp: STAGES[idx].hp * DIFF().hp, hp2: STAGES[idx].hp2 && STAGES[idx].hp2 * DIFF().hp } : STAGES[idx];
  if (last || kuro) S.bossEl = ROTATE_EL[0];
  B = {
    idx, st, key: kuro ? 'kurogane' : last ? 'last' : S.bossEl, sealed: false, tailUsed: false,
    rematch: idx < 3 && S.bossEls.slice(0, idx).includes(S.bossEl), hp: st.hp, max: st.hp, atk: st.atk, atkMul: 1, turn: 0, pi: 0,
    combo: 0, half: has('half') ? 3 : 0, lastQ: null, cd: 0, brk: 0, brkNeed: 0, broken: false,
    forced: null, interrupt: false, pGuard: false, pWeak: false, phase2: false,
  };
  setBg(kuro ? ASSETS.bg.result : last ? ASSETS.bg.last : ASSETS.bg.battle[idx], GRAD[kuro ? 0 : idx]);
  $('#bossHp').style.display = 'block'; $('#intent').style.display = 'block';
  drawBoss(); renderSide(kuro ? '最後の<br>試練' : last ? 'ファイナル<br>バトル' : '教科ボス<br>バトル'); renderInfo();
  B.intent = nextIntent(); updateUI();
  say(`${bName()}があらわれた！`, 1300).then(() => { const L = LN(B.key); return say(`${bName()}「${B.rematch && L.rematch ? L.rematch : pickLine(L.intro)}」`, 0); }).then(showCmd);
}
// 難易度ごとのセリフ（assets.js の modeLines で上書き。なければ通常のセリフ）
const modeKey = () => S && S.extreme ? 'extreme' : S && S.grade === 0 ? 'hard' : null;
const ML = () => (ASSETS.modeLines || {})[modeKey()] || {};
const LN = key => ({ ...ASSETS.lines[key], ...((ML().lines || {})[key] || {}) });
const ST = name => (ML().story || {})[name] || ASSETS.story[name];
const pickLine = v => Array.isArray(v) ? pick(v) : v;
function bName() { const b = bossData(B.key); return B.phase3 && b.name3 ? b.name3 : B.phase2 && b.name2 ? b.name2 : b.name; }
function drawBoss() { const b = bossData(B.key); setChara(`<div id="bossArt" style="position:relative">${B.phase3 ? imgArt([b.img3], '👼') : bossArt(B.key, B.phase2)}</div>`); }

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
  absorb:    () => ({ t: '🩸 吸収こうげき（与えたぶん回復）' }),
  seal:      () => ({ t: '🔒 封印（次のターン保健が使えない）', danger: 1 }),
  issen:     () => ({ t: '⚔ 奥義・一閃！ 今のHPの9割を斬る', danger: 1 }),
};
function nextIntent() {
  let type;
  if (B.forced) { type = B.forced; B.forced = null; }
  else if (B.cd > 0) type = 'count';
  else {
    const pat = B.phase2 && B.st.pat2 ? B.st.pat2 : B.st.pat;
    type = pat[B.pi++ % pat.length];
    if (type === 'attack' && B.idx >= 1 && Math.random() < (S.extreme ? 0.55 : S.grade === 0 ? 0.45 : 0.3)) type = 'multi';
  }
  if (type === 'shift') B.shiftTo = pick(EL.filter(e => e !== S.bossEl));
  return { type, ...INTENT[type]() };
}
function updateUI() {
  $('#bName').innerHTML = `${bName()} <span class="chip" style="background:${BTNC[S.bossEl]}">${S.bossEl}</span>`;
  $('#bStat').innerHTML = `${B.atkMul > 1 ? ` <span class="chip" style="background:#7f1d1d">攻×${B.atkMul.toFixed(1)}</span>` : ''}${B.sanct > 0 ? ` <span class="chip" style="background:#7c3aed">✨聖域 あと${B.sanct}ターン</span>` : ''}${B.armor ? ' <span class="chip" style="background:#0369a1">🛡よろい</span>' : ''}`;
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
  if (B.armor && armorMul(s) < 1) return `よろい×${armorTops().length > 1 ? '1/5' : '1/3'}`;
  if (B.sanct > 0) return '聖域×1/3';
  if (B.intent.type === 'charge' && m === 2) return 'ひるませる！';
  return m === 2 ? 'ばつぐん×2' : m === 0.5 ? 'いまひとつ×½' : '×1';
}
function showCmd() {
  S.pendQ = null; saveGame('battle');
  if (!awake()) { sleepCheck(); return; }
  showSuspend();
  const it = B.intent.type;
  msg(it === 'guard' ? '🛡 ボスはガード中！攻撃はほぼ効かない。回復のチャンス'
    : it === 'big' ? '💥 大ダメージが来る！保健でガードすると半分'
    : it === 'charge' ? '💢 ばつぐんの教科で攻撃すると、ためを止められる'
    : it === 'count' ? `⏳ あと ${fmt(Math.max(0, B.brkNeed - B.brk))} ダメージでブレイク！`
    : it === 'issen' ? '⚔ 一閃が来る！保健でガードすると半分' : it === 'stun' ? '😵 大チャンス！ダメージ2倍'
    : B.sealed ? '🔒 保健が封印されている！' : B.subSeal && Object.keys(B.subSeal).length ? `🔒 封印中：${Object.keys(B.subSeal).join('・')}` : 'どの教科でたたかう？');
  setChoices('c3', SUBJ.map(s => {
    const sealed = (B.sealed && s === '保健') || !!(B.subSeal && B.subSeal[s]);
    return { html: `<button class="sbtn pop" style="background:${BTNC[s]}${sealed ? ';opacity:.35;cursor:not-allowed' : ''}" ${sealed ? 'disabled' : ''}>${ICON[s]} ${s}<small>${eff(s)}</small><span class="tag">${sealed ? (B.subSeal && B.subSeal[s] ? `🔒あと${B.subSeal[s]}` : '🔒封印中') : tagFor(s)}</span></button>`, on: sealed ? null : () => doTurn(s) };
  }));
}

// ----- エフェクト -----
function center(sel) {   // ステージ内の座標（回転・拡大に影響されない）
  let e = $(sel), x = e.offsetWidth / 2, y = e.offsetHeight / 2;
  while (e && e !== stage) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y };
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
  hideSuspend();
  const it = B.intent;
  const P = S.pendQ && S.pendQ.kind === 'battle' && S.pendQ.q ? S.pendQ : null;   // 再開：同じ問題・同じ答えのまま続ける
  const q = P ? P.q : drawBattleQ(s);
  const wasWrong = S.wrong.includes(q);
  B.sealed = false;
  S.pendQ = P || { kind: 'battle', s, q }; saveGame('battle');
  const r = S.pendQ.r || await ask(q, {
    head: `${ICON[s]} ${s}で${s === '保健' ? '回復' : 'こうげき'}！${wasWrong ? '　<span style="color:#fde047">★前に間違えた問題</span>' : ''}`,
    limit: has('lr_hermes') ? 4 : has('sr_idaten') ? 6 : it.type === 'haste' || has('h_godboots') ? 8 : 0, quick: has('quick'), auto2: has('h_sage'), auto1: has('sr_glasses') && Math.random() < 0.3,
  });
  S.pendQ.r = r; saveGame('battle');
  S.total++;
  if (!r.ok) await say(explainHTML(q, r.timeout ? '⏱ 時間切れ！' : '❌ ざんねん…'), 0);
  clearChoices();
  // --- 自分の行動 ---
  if (r.ok) {
    S.correct++; B.combo++;
    if (wasWrong) {
      S.wrong = S.wrong.filter(x => x !== q); S.overcome++;
      const b0 = eff(s); S.st[s] = cap(S.st[s] + OVERCOME * (has('h_ougi') ? 1.2 : 1) * (has('sr_helm') ? 1.5 : 1)); renderSide();
      await say(`★苦手こくふく！ <span style="color:${COLOR[s]}">${s}</span>の力が +${eff(s) - b0}！${ofTxt(s)}`, 1000);
    }
    if (s === '保健') {
      const heal = has('lr_elixir') ? S.maxHp : Math.round((150 + Math.min(MAXST, S.st.保健) * 0.25) * (has('herb') ? 1.5 : 1) * (has('h_elixir') ? 2.5 : 1) * (has('sr_elixir') ? 4 : 1) * (has('h_vamp') ? 0.5 : 1) * (has('sr_chimera') ? 0.25 : 1));
      const real = Math.min(heal, S.maxHp - S.hp); S.hp += real; B.pGuard = true;
      fxHeal('#face', real); updateUI();
      await say(`💗 HPが${fmt(real)}回復！ ガードのかまえ！`);
    } else {
      const m = mult(s, S.bossEl);
      let d = (60 + eff(s) * 0.5) * DMG_MUL * (S.grade === 0 ? DIFF().dmg : 1) * m;
      if (has('combo')) d *= 1 + Math.min(1, 0.25 * (B.combo - 1));
      if (has('quick') && r.sec <= 5) d *= 1.5;
      if (has('breaker') && B.cd > 0) d *= 1.5;
      // ハード専用アイテム
      if (has('h_inferno')) d *= 1 + Math.min(2, 0.4 * (B.combo - 1));
      if (has('h_sage')) d *= 0.7;
      if (has('h_bigshield')) d *= 0.75;
      if (has('h_godboots') && r.sec <= 3) d *= 2.5;
      if (has('h_fang')) d *= B.cd > 0 ? 2.5 : 0.8;
      if (has('h_haisui')) d *= S.hp <= S.maxHp * 0.5 ? 2.5 : 0.9;
      // 激レア・レジェンド
      if (has('sr_blackfire')) d *= 1 + Math.min(3, 0.5 * (B.combo - 1));
      if (has('lr_inferno')) d *= 1 + 0.5 * (B.combo - 1);
      if (has('sr_glasses')) d *= 0.7;
      if (has('sr_aegis')) d *= 0.7;
      if (has('sr_idaten') && r.sec <= 2) d *= 3;
      if (has('lr_hermes') && r.sec <= 1.5) d *= 3;
      if (has('sr_beast')) d *= B.cd > 0 ? 5 : 0.7;
      if (has('lr_beastking')) d *= B.cd > 0 ? 10 : 0.6;
      if (has('sr_haisui')) d *= S.hp <= S.maxHp * 0.8 ? 3 : 0.75;
      if (has('lr_vampire')) d *= S.hp <= S.maxHp * 0.8 ? 5 : 0.6;
      let rollTxt = '';
      if (has('h_bighorn')) { const x = Math.random(); if (x < 0.4) { d *= 2; rollTxt = '大会心！ '; } else if (x < 0.6) { d *= 0.3; rollTxt = '逆会心… '; } }
      if (has('sr_ichigeki')) { const x = Math.random(); if (x < 0.2) { d *= 5; rollTxt += '一撃必殺！ '; } else if (x < 0.4) { d *= 0.1; rollTxt += '刻印が沈黙… '; } }
      if (has('lr_haja')) { if (Math.random() < 0.5) { d *= 10; rollTxt += '覇者の一撃！！ '; } else { d *= 0.1; rollTxt += '覇気が空回り… '; } }
      const crit = has('crit') && Math.random() < 0.2; if (crit) d *= 2;
      if (it.type === 'guard') d *= 0.15;
      if (B.sanct > 0) d /= 3;                 // ワスレーヌ第2形態：サンクチュアリ（全教科1/3）
      if (B.armor) d *= armorMul(s);           // クロガネ：せいなるよろい（一番高い教科1/3、同値が複数なら1/5）
      if (it.type === 'stun') d *= 2;
      d = Math.max(1, Math.round(d)); B.hp = Math.max(0, B.hp - d); S.dmg += d;
      if (B.cd > 0) B.brk += d;
      fxHit(s, d, m); await wait(350); updateUI();
      let t = `${rollTxt}${crit ? 'かいしんの一撃！ ' : ''}${it.type === 'guard' ? 'ガードされた… ' : m === 2 ? 'こうかはばつぐんだ！ ' : m === 0.5 ? 'いまひとつ… ' : ''}${fmt(d)}のダメージ！`;
      const dr = Math.max(has('drain') ? 0.1 : 0, has('h_vamp') ? 0.3 : 0, has('sr_chimera') ? 0.5 : 0);
      if (dr) { const h = Math.min(Math.round(d * dr), S.maxHp - S.hp); if (h > 0) { S.hp += h; t += `（HP+${fmt(h)}）`; } }
      await say(t); updateUI();
      if (B.cd > 0 && !B.broken && B.brk >= B.brkNeed) { B.broken = true; anim('#stage', 'shakeBig'); updateUI(); await say('💥 ブレイク！ 大技を止めた！'); }
      if (B.hp > 0 && B.hp <= B.max / 2 && !B.pinched) {
        B.pinched = true; const L = LN(B.key), line = B.phase3 ? L.pinch3 : B.phase2 && L.pinch2 ? L.pinch2 : pickLine(L.pinch);
        if (line) { anim('#chara', 'hurt'); await say(`${bName()}「${line}」`, 0); }
      }
      if (B.idx === 3 && B.phase2 && !B.sanctUsed && B.hp > 0 && B.hp <= B.max / 2) {
        B.sanctUsed = true; B.sanct = 3; B.sanctNew = true; anim('#stage', 'shakeBig');
        fxAdd('<div class="flash" style="background:#c4b5fd"></div>', 700); updateUI();
        await say(`${bName()}「${ASSETS.lines.last.sanct}」`, 0);
        await say('✨ サンクチュアリ発動！ 3ターンの間、すべての攻撃のダメージが1/3になる！', 1600);
      }
      if (B.idx === 4 && !B.armor && B.hp > 0 && B.hp <= B.max / 2) {
        B.armor = true; anim('#stage', 'shakeBig'); fxAdd('<div class="flash" style="background:#bae6fd"></div>', 700); updateUI();
        const tops = armorTops();
        await say(`${bName()}「${LN('kurogane').armor}」`, 0);
        await say(`🛡 せいなるよろい！ ${tops.join('・')}の攻撃ダメージが${tops.length > 1 ? '1/5' : '1/3'}になる！`, 1800);
      }
      if (it.type === 'charge' && m === 2) { B.interrupt = true; await say('ばつぐんの一撃でボスがひるんだ！ ためが消えた！'); }
    }
  } else {
    B.combo = 0;
    if (!S.wrong.includes(q)) S.wrong.push(q);
    B.pWeak = true; updateUI();
    await say(`${s}の${s === '保健' ? '回復' : 'こうげき'}は失敗… すきをつかれた！`, 900);
    // ハード専用アイテムの反動
    let recoil = 0; const why = [];
    const hc = count('h_holy_' + s); if (hc) { recoil += 0.2 * hc; why.push(`${s}の聖紋章`); }
    if (has('h_inferno')) { recoil += 0.25; why.push('連続正解の業火'); }
    if (has('h_elixir') && s === '保健') { recoil += 0.2; why.push('霊薬ポーチ'); }
    const sc = count('sr_holy_' + s); if (sc) { recoil += 0.5 * sc; why.push(`${s}の神聖紋章`); }
    const lc = count('lr_robe_' + s); if (lc) { recoil += 0.75 * lc; why.push(`${s}の法衣`); }
    if (has('sr_blackfire')) { recoil += 0.5; why.push('黒炎'); }
    if (has('lr_inferno')) { recoil += 0.75; why.push('インフェルノ'); }
    if (has('sr_elixir') && s === '保健') { recoil += 0.5; why.push('秘薬'); }
    if (has('lr_elixir') && s === '保健') { recoil += 0.9; why.push('古の秘薬'); }
    if (recoil) {
      const d = Math.round(S.maxHp * Math.min(recoil > 0.6 ? 1 : 0.6, recoil)); S.hp = Math.max(1, S.hp - d); // 反動ではたおれない（HP1残る）
      fxHurt(d); await wait(350); updateUI();
      await say(`🔥 ${why.join('・')}の反動！ ${fmt(d)}のダメージ！`, 1100);
      if (S.hp <= 0 && !(await survive())) return;
    }
  }
  if (B.hp <= 0 && B.idx === 3 && !B.phase2) return lastRevive();
  if (B.hp <= 0 && B.idx === 3 && !B.phase3 && S.extreme) return lastRevive3();
  if (B.hp <= 0) return victory();
  // --- ボスの行動 ---
  await bossAct(it);
  if (S.hp <= 0 && !(await survive())) return;
  B.pGuard = false; B.pWeak = false; B.turn++;
  if (B.sanct > 0) { if (B.sanctNew) B.sanctNew = false; else if (--B.sanct === 0) { updateUI(); await say('サンクチュアリの光が消えた！', 1100); } }
  if (B.phase3) {                          // 第3形態：教科封印（2ターンで解除・同時に2つまで）
    B.subSeal = B.subSeal || {};
    for (const k of Object.keys(B.subSeal)) if (--B.subSeal[k] <= 0) delete B.subSeal[k];
    if (Object.keys(B.subSeal).length < 2 && Math.random() < LAST3.seal) {
      const x = pick(SUBJ.filter(k => !B.subSeal[k])); B.subSeal[x] = 2; anim('#face', 'hurt'); updateUI();
      await say(`🔒 ${bName()}が<span style="color:${COLOR[x]}">${x}</span>を封印した！（2ターン使えない）`, 1200);
    }
  }
  if (B.idx >= 3) {
    S.bossEl = B.phase3 ? pick(EL.filter(e => e !== S.bossEl)) : ROTATE_EL[(ROTATE_EL.indexOf(S.bossEl) + 1) % 4]; updateUI(); anim('#chara', 'hurt');
    await say(`🔄 ${bName()}の弱点が「<span style="color:${COLOR[strongAgainst(S.bossEl)]}">${strongAgainst(S.bossEl)}</span>」に変わった！`, 900);
  }
  B.intent = nextIntent(); updateUI(); showCmd();
}
// せいなるよろい：攻撃教科（国算理社英）の中で一番高いステータス
function armorTops() { const A = ['国語', '算数', '理科', '社会', '英語'], mx = Math.max(...A.map(eff)); return A.filter(x => eff(x) === mx); }
function armorMul(s) { const t = armorTops(); return t.includes(s) ? (t.length > 1 ? 1 / 5 : 1 / 3) : 1; }
function continuePrompt() {
  return new Promise(res => {
    msg(`<div>コンティニューする？</div><div class="sub">コンティニューすると<b style="color:#fca5a5">今日の挑戦を1回使う</b>よ（今日はあと${playsLeft()}回→${playsLeft() - 1}回）。1回の挑戦で1回だけ・最終スコアは${CONT_SCORE * 100}%・ランクは${CONT_RANK_MAX}まで・次の難易度は解禁されない</div>`);
    setChoices('c2', [
      { html: '<button class="skcard pop" style="text-align:center"><b style="color:#b45309">コンティニュー</b>HP全回復でたたかいを続ける</button>', on: () => { clearChoices(); res(true); } },
      { html: '<button class="skcard pop" style="text-align:center"><b>あきらめる</b>ここで終わりにする</button>', on: () => { clearChoices(); res(false); } },
    ]);
  });
}
async function survive() {
  if (has('revive') && !S.reviveUsed) { S.reviveUsed = true; S.hp = Math.ceil(S.maxHp / 2); fxHeal('#face', S.hp); updateUI(); await say('🪶 不死鳥の羽でふっかつした！'); return true; }
  for (const [id, hp, nm] of [['lr_phoenix', 100, '不死鳥のはく製'], ['sr_blood', 50, '不死鳥の血'], ['h_tail', 1, '不死鳥の尾羽']]) {
    if (!has(id) || !B || (B.used = B.used || {})[id]) continue;
    B.used[id] = true; SUBJ.forEach(x => S.st[x] = Math.max(1, Math.floor(S.st[x] * 0.8))); S.hp = Math.min(hp, S.maxHp); fxHeal('#face', S.hp); updateUI();
    await say(`🪶 ${nm}が燃え上がった！ HP${S.hp}で踏みとどまった！（全ステータス×0.8）`, 1600); return true;
  }
  if (B.idx === 4) { await say(`${ASSETS.player.name}はひざをついた…`, 1200); await say(`${bName()}「${LN('kurogane').lose}」`, 0); await ending('kuroLose'); result(true); return false; }
  await say(`${ASSETS.player.name}はたおれてしまった…`, 1500);
  if (!NOLIMIT && !S.continues && playsLeft() > 0 && await continuePrompt()) {
    const t = today(); store.plays = { date: t, n: (store.plays && store.plays.date === t ? store.plays.n : 0) + 1 }; persist();
    S.continues = (S.continues || 0) + 1; S.hp = S.maxHp; B.pGuard = false; B.pWeak = false;
    fxHeal('#face', S.maxHp); updateUI();
    await say(`💫 コンティニュー！ ${ASSETS.player.name}は立ち上がった！ HPが全回復した！`, 1400);
    return true;
  }
  result(false); return false;
}
async function hitP(raw, label, noWeak, pure) {
  let d = raw * (S.grade === 0 && !pure ? DIFF().hurt : 1); if (B.pGuard) d *= 0.5; if (has('shield')) d *= 0.7; if (has('h_bigshield')) d *= 0.5; if (has('sr_aegis')) d *= 0.35; if (B.pWeak && !noWeak && !pure) d *= 1.3;
  d = Math.round(d); S.hp = Math.max(0, S.hp - d);
  fxHurt(d); await wait(350); updateUI();
  await say(`${label}${B.pGuard ? '（ガード）' : ''} ${fmt(d)}のダメージ！`, 1000);
  return d;
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
      return hitP(S.maxHp * 0.9, B.idx === 4 ? '☄ 秘剣・星落とし！ 最大HPの9割のダメージ' : '☄ 大技！ 最大HPの9割のダメージ', true, true);
    case 'stun': return say(`${name}はふらふらしている…`, 900);
    case 'absorb': { const d = await hitP(atk * 0.8, `${name}の吸収こうげき！`); const h = Math.min(d * 2, B.max - B.hp); if (h > 0) { B.hp += h; fxHeal('#chara', h); updateUI(); await say(`${name}はHPを${fmt(h)}吸収した！`, 900); } return; }
    case 'seal': B.sealed = true; anim('#chara', 'hurt'); await hitP(atk * 0.5, `${name}の封印の術！`); return say('🔒 次のターン、保健が封印された！', 1100);
    case 'issen': fxAdd('<div class="flash" style="background:#fff"></div>', 500); await wait(200); return hitP(Math.floor(S.hp * 0.9), '⚔ 奥義・一閃！', true, true);
    case 'shift': S.bossEl = B.shiftTo; updateUI(); anim('#chara', 'hurt'); return say(`🔄 ${name}の属性が「${S.bossEl}」に変わった！`);
  }
}
async function lastRevive() {
  S.beaten++; S.turnBonus += Math.max(0, 12 - B.turn) * 300;
  anim('#stage', 'shakeBig'); $('#intent').style.display = 'none'; $('#cdBox').style.display = 'none';
  await say(`🎉 ${bName()}をたおした…！`, 1500);
  defeatFx();
  await say('……', 900);
  await say('…いや、まだだ！ 闇の気配がふくれあがっていく…！', 1500);
  B.phase2 = true; B.pinched = false; B.hp = B.max = B.st.hp2; B.atkMul = 1.3; B.pi = 0; B.cd = 0; B.brk = 0; B.broken = false;
  B.forced = null; B.interrupt = false; B.pGuard = false; B.pWeak = false; B.combo = 0; B.turn = 0;
  if (B.half < 3 && has('half')) B.half = 3;
  setBg(ASSETS.bg.last2, GRAD[3]); fxAdd('<div class="flash" style="background:#fff"></div>', 700);
  drawBoss(); anim('#stage', 'shakeBig');
  B.intent = nextIntent(); $('#intent').style.display = 'block'; updateUI();
  await say(`${bName()}「${ASSETS.lines.last.phase2}」`, 0);
  await say(`${bName()}として復活した！ HP全回復・攻撃力アップ！`, 1600);
  showCmd();
}
// エクストリームのみ：第3形態（ブラックアウト→真っ白な世界）
async function lastRevive3() {
  S.beaten++; S.turnBonus += Math.max(0, 12 - B.turn) * 300;
  anim('#stage', 'shakeBig'); $('#intent').style.display = 'none'; $('#cdBox').style.display = 'none'; clearChoices();
  await say(`${bName()}「${ASSETS.lines.last.defeat}」`, 0);
  defeatFx();
  fxAdd(`<div class="blackout" style="animation-duration:${6 * SPD}s"></div>`, 6000 * SPD + 200);
  await wait(1600);
  B.phase3 = true; B.st = LAST3; B.pinched = false; B.hp = B.max = LAST3.hp; B.atk = LAST3.atk; B.atkMul = 1; B.pi = 0; B.cd = 0; B.brk = 0; B.broken = false;
  B.forced = null; B.interrupt = false; B.pGuard = false; B.pWeak = false; B.combo = 0; B.turn = 0; B.sanct = 0; B.subSeal = {};
  if (B.half < 3 && has('half')) B.half = 3;
  $('#bossHp').style.display = 'none'; $('#msgbar').style.display = 'none';
  setBg('', 'linear-gradient(#fff,#fff)'); drawBoss();
  await wait(4400);
  $('#msgbar').style.display = 'flex'; $('#bossHp').style.display = 'block';
  B.intent = nextIntent(); $('#intent').style.display = 'block'; updateUI();
  await say(`${bName()}「${ASSETS.lines.last.intro3}」`, 0);
  await say(`${bName()}「${ASSETS.lines.last.pinch3}」`, 0);
  showCmd();
}
async function victory() {
  S.beaten++; S.turnBonus += Math.max(0, 12 - B.turn) * 600;
  const last = B.idx === 3;
  anim('#stage', 'shakeBig'); defeatFx();
  $('#intent').style.display = 'none'; $('#cdBox').style.display = 'none';
  const DL = LN(B.key);
  if (B.rematch && DL.rematchDefeat) await say(`${bName()}「${DL.rematchDefeat}」`, 0);   // 再会して倒したとき
  if (B.idx === 2 && DL.final) await say(`${bName()}「${DL.final}」`, 0);                  // 21日目：あのお方の復活
  else if (B.phase3) await say(`${bName()}「${DL.defeat3}」`, 0);
  else if (!B.rematch) await say(`${bName()}「${pickLine(DL.defeat)}」`, 0);
  await say(`🎉 ${bName()}をたおした！（${B.turn + 1}ターン）`, 1800);
  if (B.idx === 4) { S.kuroWin = true; await ending('kuroWin'); return result(true); }
  if (B.phase3) { S.trueWin = true; await ending('extreme'); return result(true); }
  if (last && S.grade === 0 && !S.extreme) return trialIntro();
  if (last) { await ending('clear'); return result(true); }
  S.hp = S.maxHp; renderSide();
  await say('HPが全回復した！', 900);
  B = null; $('#bossHp').style.display = 'none';
  goDay(S.day + 1);
}

// ---------- エンディング：師匠のほめ言葉 ----------
async function ending(type) {
  ['#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none'); clearChoices();
  setBg(ASSETS.bg.result, GRAD[0]); fxAdd('<div class="flash" style="background:#fff"></div>', 900);
  setChara(type === 'kuroWin' ? imgArt([ASSETS.kuroganeUp.img], ASSETS.kuroganeUp.emoji) : masterArt()); S.hp = S.maxHp; renderSide('エンディング');
  for (const t of ASSETS.story.ending[type]) await say(t.startsWith('「') ? `${ASSETS.master.name}${t}` : t, 0);
}

// ---------- 裏ボス：最後の試練（ハードのみ） ----------
async function trialIntro() {
  B = null;
  ['#bossHp', '#intent', '#cdBox'].forEach(s => $(s).style.display = 'none');
  setBg(ASSETS.bg.result, GRAD[0]); fxAdd('<div class="flash" style="background:#fff"></div>', 900);
  setChara(masterArt());
  S.hp = S.maxHp; renderSide('最後の<br>試練');
  for (const t of ST('trial')) await say(t.startsWith('「') ? `${ASSETS.master.name}${t}` : t, 0);
  battleStart('kurogane');
}

// ---------- 結果 ----------
// リザルト演出：1項目ずつ「ドン！」と表示し、合計スコアをカウントアップ、最後にランクをハンコのように押す
async function resultShow(rows, total) {
  const P = $('#panel'), box = $('#panelIn'), els = [...box.querySelectorAll('.rrow')], sc = $('#rScore');
  let skip = false, cur = 0;
  const finish = () => {
    skip = true; els.forEach(e => e.classList.add('on')); sc.textContent = fmt(total);
    $('#rRank').classList.add('on'); document.querySelectorAll('.rfade').forEach(e => e.style.opacity = 1); $('#rSkip').style.display = 'none';
  };
  P.onclick = e => { if (!e.target.closest('button')) finish(); };
  const count = (from, to, ms) => new Promise(res => {
    const t0 = performance.now();
    const step = t => { if (skip) return res(); const r = Math.min(1, (t - t0) / ms); sc.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - r, 3))); r < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
  await wait(500);
  for (let i = 0; i < rows.length && !skip; i++) {
    els[i].classList.add('on'); anim('#panelIn', 'shake');
    sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
    await count(cur, cur + rows[i][1], rows[i][1] > 0 ? 450 : 150); cur += rows[i][1];
    if (!skip) await wait(rows[i][1] > 0 ? 200 : 80);
  }
  if (skip) return;
  sc.textContent = fmt(total); await wait(400); if (skip) return;
  $('#rRank').classList.add('on'); anim('#panelIn', 'shakeBig');
  await wait(700); if (skip) return;
  finish();
}
function result(clear) {
  S.over = true; clearSave(); hideSuspend();
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
  if (S.kuroWin) rows.push(['⚔ 剣聖クロガネに勝利', 50000]);
  if (S.trueWin) rows.push(['☆ 無垢なるワスレーヌに勝利', 100000]);
  // クリア時のみ：クリアタイムとごく小さなボーナス（30分より速いほど1秒につき1点）
  const sec = clear && S.t0 ? Math.round((Date.now() - S.t0) / 1000) : 0;
  const clock = `${Math.floor(sec / 60)}分${String(sec % 60).padStart(2, '0')}秒`;
  if (clear) rows.push([`クリアタイム ${clock}`, Math.max(0, TIME_BONUS_SEC - sec)]);
  if (S.grade === 0) rows.push([`${S.extreme ? 'エクストリーム' : 'ハードモード'}ボーナス ×${DIFF().score}`, Math.round(rows.reduce((a, r) => a + r[1], 0) * (DIFF().score - 1))]);
  if (S.continues) rows.push([`コンティニュー ${S.continues}回 ×${CONT_SCORE}`, -Math.round(rows.reduce((a, r) => a + r[1], 0) * (1 - CONT_SCORE))]);
  const score = rows.reduce((a, r) => a + r[1], 0);
  const base = score / (S.grade === 0 ? DIFF().score : 1);
  let rank = base >= RANK.S ? 'S' : base >= RANK.A ? 'A' : base >= RANK.B ? 'B' : base >= RANK.C ? 'C' : 'D';
  if (rank === 'S' && !(clear && acc >= RANK.sAcc)) rank = 'A';
  if (!clear && (rank === 'S' || rank === 'A')) rank = 'B';
  if (rank === 'S') rank = score >= RANK.SSS ? 'SSS' : score >= RANK.SS ? 'SS' : 'S';
  const ORDER = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D'];
  if (S.continues && ORDER.indexOf(rank) < ORDER.indexOf(CONT_RANK_MAX)) rank = CONT_RANK_MAX;
  // ノーコンティニューでクリアしたら、次の難易度を自動で解禁（タイトルにもどったときに知らせる）
  const unlockKey = !clear || S.continues ? null : S.grade > 0 ? 'hard' : !S.extreme ? 'extreme' : null;
  let pass = '';
  if (unlockKey && !UNLOCK[unlockKey]) {
    UNLOCK.hard = true; if (unlockKey === 'extreme') UNLOCK.extreme = true;
    store.unlock = { ...UNLOCK }; store.newUnlock = unlockKey; persist();
    pass = `<div class="rpass">🔓 ${unlockKey === 'extreme' ? 'エクストリーム' : 'ハード'}が解禁された！<br><small>タイトル画面で選べるようになったよ</small></div>`;
  }
  const sNote = S.continues ? `<p class="rnote">コンティニューしたので、ランクは${CONT_RANK_MAX}まで・次の難易度は解禁されません</p>` : rank.startsWith('S') ? '' : `<p class="rnote">Sランクの条件：クリア・正答率${RANK.sAcc}%以上・${fmt(RANK.S * (S.grade === 0 ? DIFF().score : 1))}点以上</p>`;
  const gname = S.grade ? S.grade + '年' : S.extreme ? 'エクストリーム' : 'ハードモード';
  const share = `【まなびドラゴン】${gname} ${S.trueWin ? '真・完全勝利！' : S.kuroWin ? '完全勝利！' : clear ? 'クリア！' : `${S.day}日目でたおれた`} スコア${fmt(score)}（ランク${rank}）正答率${acc}%${clear ? ` タイム${clock}` : ''}${S.continues ? ` コンティニュー${S.continues}回` : ''}\n${SUBJ.map(s => `${s}${eff(s)}`).join(' ')} HP${S.maxHp}${S.skills.length ? `\nアイテム：${S.skills.map(k => skLabel(k)).join('・')}` : ''}`;
  const RCOL = { SSS: '#fff7ae', SS: '#7dd3fc', S: '#ffd54a', A: '#f472b6', B: '#38bdf8', C: '#4ade80', D: '#cbd5e1' };
  const W = S.wrong, PER = 5, pages = Math.max(1, Math.ceil(W.length / PER));
  $('#panelIn').classList.add('resmode');
  $('#panelIn').innerHTML = `
    <div class="rgrid">
      <div class="rleft">
        <h1 class="ol">${S.trueWin ? '☆ 真・完全勝利！' : S.kuroWin ? '⚔ 完全勝利！' : clear ? '🏆 ゲームクリア！' : '💀 ゲームオーバー'}</h1>
        ${S.trueWin ? '<p class="rsub">ワスレーヌの本当の姿をたおした！</p>' : S.kuroWin ? '<p class="rsub">剣聖クロガネの試練をのりこえた！</p>' : ''}
        <p class="rsub">${gname}　正答率 ${acc}%${clear ? `　⏱ ${clock}` : ''}</p>
        <div class="rchar"><div class="rart">${playerArt('width:130px;height:130px;font-size:96px')}</div>
          <div class="rstat">${SUBJ.map(s => `<span style="color:${COLOR[s]}">${s}</span><b>${fmt(eff(s))}</b>`).join('')}<span style="color:#f87171">HP</span><b>${fmt(S.maxHp)}</b>
            ${S.skills.length ? `<div class="ritems">${S.skills.map(k => `<span title="${esc(skLabel(k))}">${skIcon(k)}</span>`).join('')}</div>` : ''}</div></div>
        <div id="rScore" class="rscore">0</div>
        <div id="rRank" class="rrank r-${rank}" style="color:${RCOL[rank]}">${rank}</div>
        <div class="rfade">${pass}${sNote}
          <div class="rbtns"><button class="btn gold" id="again">タイトルへ</button><button class="btn gray" id="copy">結果をコピー</button></div></div>
      </div>
      <div class="rright">
        <div class="rlist">${rows.map(r => `<div class="rrow"><span>${r[0]}</span><b>${fmt(r[1])}</b></div>`).join('')}</div>
        <div class="rfade rreview">
          <div class="rrhead"><b>📝 ふりかえり${W.length ? `（まだ苦手な問題 ${W.length}問）` : ''}</b>
            ${pages > 1 ? '<span class="rpager"><button id="rPrev">◀</button><span id="rPage"></span><button id="rNext">▶</button></span>' : ''}</div>
          <div id="rWrong">${W.length ? '' : '<p style="text-align:center;margin-top:30px;font-size:22px">苦手な問題はぜんぶこくふくした！🎉</p>'}</div>
        </div>
      </div>
    </div>
    <p class="rskip" id="rSkip">クリックでスキップ</p>`;
  let page = 0;
  const showPage = () => {
    if (!W.length) return;
    $('#rWrong').innerHTML = W.slice(page * PER, page * PER + PER).map(q => `<div class="exl">${esc(q.q)}　→ こたえ：<b style="color:#c2410c">${esc(q.c[0])}</b>${q.e ? `<br><span class="rexp">💡${esc(q.e)}</span>` : ''}</div>`).join('');
    if (pages > 1) $('#rPage').textContent = `${page + 1} / ${pages}`;
  };
  showPage();
  // 前回の記録として保存（アニメーションなしの完成形）
  { const t = document.createElement('div'); t.innerHTML = $('#panelIn').innerHTML;
    t.querySelectorAll('.rrow').forEach(e => e.classList.add('on')); t.querySelector('#rRank').classList.add('on');
    t.querySelectorAll('.rfade').forEach(e => e.style.opacity = 1); t.querySelector('#rScore').textContent = fmt(score);
    t.querySelectorAll('.rskip,.rpager').forEach(e => e.remove());
    const d = new Date(), snap = { share, html: t.innerHTML, score, rank, date: `${d.getMonth() + 1}/${d.getDate()}`,
      label: S.trueWin ? '真・完全勝利' : S.kuroWin ? '完全勝利' : clear ? 'クリア' : `${S.day}日目でたおれた` };
    store.lastResult = snap; store.best = store.best || {};
    const k = modeOf(); if (!store.best[k] || score > store.best[k].score) { store.best[k] = snap; $('#rRank').insertAdjacentHTML('afterend', '<div class="rfade newbest">🎉 ハイスコア更新！</div>'); } }
  persist();
  if (pages > 1) {
    $('#rPrev').onclick = e => { e.stopPropagation(); page = (page + pages - 1) % pages; showPage(); };
    $('#rNext').onclick = e => { e.stopPropagation(); page = (page + 1) % pages; showPage(); };
  }
  resultShow(rows, score);
  $('#panel').style.display = 'flex';
  $('#again').onclick = () => title();
  $('#copy').onclick = () => { navigator.clipboard ? navigator.clipboard.writeText(share).then(() => toast('コピーしました'), () => prompt('コピーしてね', share)) : prompt('コピーしてね', share); };
}

// 画像の先読み（ゲーム中の読み込み待ちをなくす）
(function preload() {
  const A = ASSETS, list = [A.logo, A.master.img, A.merchant.img, A.kuroganeUp.img, ...Object.values(A.boss).flatMap(b => [b.img, b.img2, b.img3]), A.devil.img, A.omikuji.img, A.scout.img,
    ...Object.values(A.bg).flat()];
  const P = A.player, keys = Object.values(A.romaji).concat('base');
  for (const k of keys) for (let t = 0; t < 3; t++) list.push(`${P.dir}${k}_${t}.png`);
  list.push(P.ultimate);
  window.__pre = [...new Set(list.filter(p => p && (!window.__IMG || window.__IMG[p])))].map(src => { const i = new Image(); i.src = R(src); return i; });
})();
title();
