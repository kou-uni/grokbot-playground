# キャラクターの受け渡し

キャラクターの設定と絵の元は、wesley の [grokbot_character_sheets/](../grokbot_character_sheets/) にある。
ここ（`chars/`）と、リポジトリ直下の `characters.json` は、そこから作った「画面と Bot 作成が読む形」である。

| もの | 場所 | 作り方 |
|---|---|---|
| 設定の元（正） | `grokbot_character_sheets/*.md` | wesley が書く |
| 絵の元（正） | `grokbot_character_sheets/*.png`（1600×2100 の設定書） | wesley が作る |
| 画面と Bot 作成が読む設定 | `characters.json` | 設定書の項目を読み取って生成した |
| 画面用のアイコン | `chars/*.jpg`（400×400） | 設定書の画像から、顔まわりを正方形に切り出した |

## 流れ

- **wesley**：`grokbot_character_sheets/` を更新する。
- **spark**：更新を受け取り、`characters.json` とアイコンを作り直して、Grok Bot の Bot の説明に反映する。
- 画面は `characters.json` と `chars/` を読む。

## 名前の決まり

記録に出る Bot の名前は、設定書の英字の名前をそのまま使う。画面の色分け、チームの盤、採点の集計がこの名前で動く。

| チーム | 色 | リサーチ担当 | プレゼン担当 |
|---|---|---|---|
| COBALT（コバルト） | #1762C9 | CIPHER | BIT |
| EMBER（エンバー） | #E85B20 | BLITZ | ATLAS |
| VIRIDIAN（ヴィリジアン） | #25824D | PATCH | ORACLE |
| ULTRAVIOLET（ウルトラバイオレット） | #7941CB | GLITCH | SPARK |

Bot は全部で12体。参加8体、審査員3体（審査・発想、審査・価値、審査・スケール）、主催者1体。
各チームの1体が X の調査を、もう1体が審査員への提案（プレゼン）を受け持つ。割り当ては、設定書の強みに合わせて spark 側で置いた。

名前やチームを変える場合は、先に spark に伝える。

## これから届く絵

審査員代表の絵と、主催者の絵の2枚。審査員3体は、同じ絵（審査員代表）を使う。それ以外の絵は作らない。
届くまでは、画面内の自作ロボットが出る。

## アイコンを差し替えたいとき

切り出しではなく、アイコン用の絵を別に用意する場合は、正方形の絵を `chars/` に同じファイル名で置けばよい
（例: `chars/cipher.jpg`）。png・webp も使える。その場合は `characters.json` の `img` を合わせる。
