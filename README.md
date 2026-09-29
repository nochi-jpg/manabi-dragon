# まなびドラゴン（ブラウザゲーム）

`index.html` をダブルクリックするだけで遊べます（サーバー不要・オフラインOK）。

## ゲームの流れ
- 1日目＝月曜。月〜金：教科レッスン（1日1問）。正解で能力+500〜800、不正解でも+150〜250（最大9999）
- 土：スキルを3つから1つ選ぶ ／ 日：ボス戦（7・14・21日目）→ 22日目「ファイナルデー」にラスボス。ボス戦後は全回復
- 間違えた問題は「苦手リスト」へ。ボス戦で正解すると「苦手こくふく」で、最初に正解した場合との差（+450）が能力に加わる
- セーブなし・スコアアタック

## ボスの行動（毎ターン「次のこうどう」を予告）
| 行動 | 内容 | 対策 |
|---|---|---|
| こうげき／3回れんぞく | 通常ダメージ | 間違えると1.3倍くらう |
| 身を守る | こちらの攻撃がほぼ効かない | 保健で回復のチャンス |
| 力をためる→ため攻撃 | 次のターンに3倍ダメージ | ためているときに「ばつぐん」で当てるとひるむ／保健ガードで半減 |
| おたけび | 攻撃力アップ（重なる） | 早めに倒す |
| 回復 | ボスが最大HPの8%回復 | ― |
| 8秒以内に答えろ | 制限時間つき問題＋攻撃 | 時間切れは不正解 |
| カウントダウン | 3ターン後に最大HPの9割ダメージ | 期限内に一定ダメージで「ブレイク」→次ターンダメージ2倍 |
| 属性チェンジ | ラスボスが属性を変える | 予告を見て教科を切りかえ |

ステージ：1面＝基本だけ／2面＋連続・おたけび／3面＋カウントダウン・時間制限・回復／ラスボス＝全部＋属性チェンジ、一度たおすと第2形態（堕天使）として全回復で復活
バランス調整は `game.js` 冒頭の `STAGES`（HP・攻撃力・行動の順番）で。

## ファイル
| ファイル | 役割 |
|---|---|
| index.html | 画面・エフェクトのデザイン |
| game.js | ゲーム本体 |
| questions.js | 問題DB（先頭の選択肢が正解） |
| assets.js | 画像のパス・キャラ名・進化のしきい値 |
| questions_template.csv | CSV読み込み用ひな形（教科,学年,問題,正解,ハズレ1〜3,解説） |

## 必要なグラフィック一覧（images/ に置くだけで差し替わる）
画面は横 **1280×720**。キャラは**背景透過PNG**。無い画像は絵文字とグラデーションで表示されるので、少しずつ置いてOK。

### 背景 `images/bg/`（1280×720）
| ファイル | 場面 | イメージ |
|---|---|---|
| title.png | タイトル | 明るいファンタジーの学校 |
| lesson1.png / lesson2.png / lesson3.png | 1〜3週目の強化パート（師匠の部屋） | きれい → 少し荒れる → 荒廃 |
| battle1.png / battle2.png / battle3.png | 1〜3面のボス戦 | 草原 → 夕暮れの荒野 → 暗い廃墟 |
| last.png | ファイナルデー | 火山・溶岩 |
| result.png | 結果画面 | 夜明け・お祝い |
画面の左220pxはステータス欄、右250pxは日付欄、下150pxは問題バーが重なります。中央が主役の見せ場です。

### 師匠 `images/master.png`（縦長 約640×640、画面中央に大きく表示）

### 自キャラの顔 `images/player/`（正方形 256×256、左上の顔枠に表示）
段階0＝全能力1000未満、段階1＝どれかが1000以上、段階2＝どれかが5000以上
| ファイル | 内容 |
|---|---|
| base_0.png | 基本の顔（**これ1枚でまず全場面に出る**） |
| base_1.png / base_2.png | 教科別がないときの成長版・最終形態 |
| kokugo_1/2, sansu_1/2, rika_1/2, shakai_1/2, eigo_1/2, hoken_1/2 | 一番伸びた教科ごとの成長版・最終形態 |

### ボス `images/boss/`（約640×640、画面中央に大きく表示／日付画面にも小さく出る）
| ファイル | 名前（assets.jsで変更可） |
|---|---|
| kokugo.png / sansu.png / rika.png / shakai.png | 各属性のボス（週ごとにランダムで登場） |
| last.png / last2.png | ラスボス／第2形態 |

### フォント
ドット風フォント「DotGothic16」をネット経由で読み込みます。オフラインで使うときは Google Fonts から DotGothic16-Regular.ttf をダウンロードして `fonts/` に置いてください。

### Stable Diffusion プロンプト例
- 自キャラ：`cute chibi baby dragon, big eyes, (red scroll and brush motif:1.2), game character, full body, facing right, simple background` → 段階が上がるほど `young dragon, armor, glowing aura, majestic` を足す
- ボス：`giant centipede made of scrolls and kanji, rpg boss monster, cute but menacing, full body, facing left, simple background`
- 背景：`fantasy grassland battlefield, anime background, no people, vertical composition` → `ruined, dusk` → `dark ruins, purple sky` → `volcano, lava, red sky`

## 問題の差し替え
- CSV：タイトル画面の「問題CSVを読みこむ」（Excel保存のShift-JISもOK。ブラウザを閉じると元に戻る）
- 常に使う問題：`questions.js` を書き換え
