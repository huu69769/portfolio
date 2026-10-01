# LUO JIAWEN ポートフォリオ

「作業机（カッティングマット）」をテーマにしたポートフォリオサイトです。
机の上に作品が散らばっていて、手に取る（押す）とウィンドウで開きます。

- 開始の演出：印刷の版（CMYK）がずれて → ぴたっと合う（押すとスキップ）
- 真ん中の名札が自己紹介。まわりの小物が作品の入口
- PC：小物はドラッグで動かせて、位置はブラウザに保存（定規の「並べ直す」で元に戻る）
- PC：ウィンドウは複数開けて、動かせる。下の定規に開いているものが並ぶ。`Esc` で一番手前を閉じる
- スマホ：小物は3列に並び、ウィンドウは全画面。下のバーで「もどる・ホーム」

ビルド不要の静的サイトです。GitHub Pages にそのまま push すれば動きます。

## 中身を変えたいとき

**`assets/js/data.js` だけ**を書き換えれば OK です（作品・文章・机の上の位置がすべてここにあります）。

| やりたいこと | data.js のどこ |
| --- | --- |
| Web制作の作品を足す・直す | `WEB` |
| ゲームを足す・直す | `GAMES`（`control` は `'keyboard'` か `'touch'`） |
| UI/UX・大学時代・イラストの画像 | `UIUX` / `UNIV` / `ILLUST` |
| 自己紹介・経歴・メール | `PROFILE` / `EXPERIENCE` |
| 机の上の置き場所 | `DESK`（`x`, `y` は 0〜1） |
| カルーセルの切り替え間隔 | `CAROUSEL_INTERVAL` |
| 画像の置き場所 | `BASE`（`'assets/'` ⇔ 旧サイトのURL を1行で切り替え） |

※ ゲームを新しく足したら、`DESK` にも `{ id: 'game:ゲームのid', label: '…', x: …, y: … }` を1行足すと机の上に置かれます。

## 画像について

- `assets/img/` … 元の画像
- `assets/img/md/` … ビューア用の軽い版（WebP・長辺2000px）
- `assets/img/sm/` … サムネイル用の軽い版（WebP・長辺720px）

新しい画像を足したときに軽い版を作らなくても、自動で元の画像が表示されます。
軽い版を作る場合（ImageMagick）：

```bash
convert assets/img/新しい画像.jpg -strip -resize '2000x2000>' -quality 80 assets/img/md/新しい画像.webp
convert assets/img/新しい画像.jpg -strip -resize '720x720>'   -quality 72 assets/img/sm/新しい画像.webp
```

## ファイル

```
index.html            # ページの骨組み（名札・定規）
assets/js/data.js     # ★ 中身（ここだけ触ればOK）
assets/js/main.js     # 動き
assets/css/style.css  # 見た目（色は先頭の :root で変えられます）
assets/shots/         # Web制作・ゲームのスクリーンショット
assets/og.png         # SNS でシェアされたときの画像
games/snake/          # サンプルゲーム（キーボード）
games/tap/            # サンプルゲーム（タッチ）
```

ローカルで確認するとき：`python3 -m http.server 8000` → http://localhost:8000
