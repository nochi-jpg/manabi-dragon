// ===== 画像設定 =====
// 画像を置けば自動で差し替わります。見つからないときは絵文字＋色で表示。
// フォルダ：images/bg/ 背景（1280×720）、images/player/ 自キャラ顔、images/boss/ ボス、images/master.png 師匠
window.ASSETS = {
  logo: 'images/logo.png',          // タイトルロゴ
  player: {
    name: 'まなドラ',
    dir: 'images/player/',          // {教科}_{段階}.png → 例 kokugo_1.png（なければ base_{段階}.png → base_0.png）
    tiers: [1000, 5000],            // 一番高いステータスがこの値を超えると段階1、段階2へ進化
    sumTier: 12000,                 // ステータス合計がこの値を超えても段階2（最終進化）へ
    emoji: ['🐣', '🐲', '🐉'],      // 画像がないときの段階ごとの絵文字
  },
  master: { img: 'images/master.png', emoji: '🧙', name: '師匠クロガネ' },   // 強化パートの師匠
  // 教科ごとのファイル名（player / boss 共通）
  romaji: { 国語: 'kokugo', 算数: 'sansu', 理科: 'rika', 社会: 'shakai', 英語: 'eigo', 保健: 'hoken' },
  boss: {
    国語: { img: 'images/boss/kokugo.png', emoji: '📜', name: '炎の魔女コトハ' },
    算数: { img: 'images/boss/sansu.png',  emoji: '🧮', name: '水の博士カズマ' },
    理科: { img: 'images/boss/rika.png',   emoji: '🧪', name: '草の少女ミドリ' },
    社会: { img: 'images/boss/shakai.png', emoji: '🏯', name: '雷の少年ライト' },
    last: { img: 'images/boss/last.png', img2: 'images/boss/last2.png', emoji: '👹', name: '忘却の天使ワスレーヌ', name2: '堕天使ワスレーヌ' }, // 一度たおすと img2・name2 の第2形態で全回復して復活
  },
  bg: {
    title:  'images/bg/space.png',     // タイトル（ブラックホール）
    lesson: ['images/bg/lesson1.png', 'images/bg/lesson2.png', 'images/bg/lesson3.png'], // 週ごと（だんだん荒廃）
    battle: ['images/bg/battle1.png', 'images/bg/battle2.png', 'images/bg/battle3.png'],
    last:   'images/bg/last.png',     // ファイナルデー（火山）
    last2:  'images/bg/space.png',    // ラスボス第2形態（宇宙・ブラックホール）
    result: 'images/bg/result.png',   // クリア画面（夕日の山）
    gameover: 'images/bg/battle3.png', // ゲームオーバー画面
  },
  // ===== シナリオ（セリフは自由に書きかえOK） =====
  story: {
    day1: [   // 1日目の師匠のセリフ
      'よく来たな、若きドラゴンよ。わたしはクロガネ。',
      '忘却の天使ワスレーヌが目覚めた。21日後、世界中の「知識」が消え去り、この世界は崩壊する。',
      'ワスレーヌをとめられるのは、学びの力を宿したおまえだけだ。',
      'どうか21日後の崩壊をくいとめて、世界をすくってほしい。さあ、修行をはじめよう！',
    ],
    final: [  // ファイナルデーの師匠のセリフ
      'ついにこの日が来た…。空が、世界が、忘れられていく。',
      '四天王をたおしたおまえなら、きっと勝てる。学んだすべてをぶつけてこい！',
    ],
  },
  lines: {    // 登場時 intro ／ 撃破時 defeat（四天王）、ラスボスは phase2 も
    国語: { intro: 'あらあら、かわいいドラゴンちゃん。四天王が一人、炎の魔女コトハ。あなたの言葉、ぜんぶ灰にしてあげる♪',
            defeat: 'ふふ…やるじゃない。でも覚えておきなさい。あのお方の「忘却の炎」は、こんなものじゃないわ…' },
    算数: { intro: '四天王、水の博士カズマだ。計算によると、君が勝つ確率は0.01%。…無駄な抵抗はやめたまえ。',
            defeat: 'ありえない…計算外だ。だが、あのお方の前では、どんな答えも水の泡と消える…' },
    理科: { intro: 'やっほー！四天王のミドリだよっ！あんたの知識、根っこまでぜーんぶ引っこ抜いてあげる！',
            defeat: 'いたたた…負けちゃった〜。でもね、ワスレーヌ様はもーっと、もーっと強いんだから！' },
    社会: { intro: '四天王のライト。君のデータはもう解析済みだよ。…ぼくのパソコンから逃げられると思わないでね。',
            defeat: 'エラー…？ぼくが負けるなんて…。でも手おくれさ。あのお方の「忘却プログラム」は、もう起動している…' },
    last: { intro: 'よくぞここまで。わたしは忘却の天使ワスレーヌ。苦しい勉強も、つらい記憶も…すべてやさしく忘れさせてあげましょう。',
            phase2: '…なぜ、忘れないの？ならば闇ごと、すべてを消し去るまで！',
            defeat: 'これが…学ぶ力…。忘れられない想いが、こんなにも、まぶしいなんて…' },
  },
};
