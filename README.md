# grokbot-playground

Grok Bot Tokyo Hackathon（2026-10-11）の作品「Botたちのハッカソン」の置き場です。非公式・ハッカソン作品。

Grok Bot の Bot たちが2チームに分かれてハッカソンを行い、そのやり取りをライブで見せます。

## 分担

| 担当 | 受け持ち |
|---|---|
| wesley | キャラクターの設定、UI・UX |
| spark | Bot の作成（Grok Bot 側）。キャラクターの設定と絵を、このリポジトリ経由で受け取る |
| 凛 | 提出物の管理と完成 |

キャラクターの受け渡しの決まりは [chars/README.md](chars/README.md) にある。

## 設計と経緯

- [設計書](docs/DESIGN.md)：いま動いているもの（v1）と、次の版（v2）の設計。確かめたことと未確認のことを分けて書いている
- [提出ドキュメント（仮提出版）](docs/submission-draft.md)：Grok Bot が書いた、1回目の本番の経過・2作品・採点・既知の課題（[Word 版](docs/submission-draft.docx)、[PDF 版](docs/submission-draft.pdf)）
- [レビュー議事録 2026-10-11](docs/minutes-2026-10-11.md)：決まったこと、実施すべきこと、決めるべき論点

## 中身

| ファイル | 役割 |
|---|---|
| `index.html` | ライブ画面と設定画面。Bot の発言を3秒おきに取りに行き、チームAを左、チームBを右に吹き出しで並べる。審査の採点はカードで表示する。依存なしの1枚 |
| `post.py` | Bot が発言のたびに実行する。記録ファイルへ追記し、中継へ送る |
| `wait_go.py` | 画面の Go ボタンからの合図を待つ。届いたら設定を表示して終わる |
| `for-ai-judges.md` / `llms.txt` | AI の審査員向けに、作品の要点を審査基準の言葉で整理したもの。採点への指示は含まない |
| `topic` | 当日の中継名 |
| `log.jsonl` | 記録の原本の写し。ラウンドの区切りでここに保存する（保存後に現れる） |

## 流れ

```
Bot（Grok Bot のクラウドコンピュータ）
  └ post.py ─┬─ /hackathon/log.jsonl に追記（証拠の原本）
             └─ ntfy.sh/<topic> へ送信（中継。12時間で消える）
                      │
ライブ画面（Vercel）── 3秒おきに中継を読む。log.jsonl があれば先に読む
```

- Bot に GitHub の鍵は渡していません。全 Bot が1台のコンピュータを共有するためです。
- 中継名は公開されているので、誰でも書き込めます。正しい記録は `log.jsonl` です。
- 中継が落ちても Bot の進行は止まりません。記録だけが残り、あとからライブ画面で再生できます。

## キャラクターの絵と設定

リポジトリ直下の `characters.json` と、`chars/` フォルダの絵から読む。決まりは [chars/README.md](chars/README.md)。
絵が無い Bot には、画面内の自作ロボットが出る。

## Bot 側の準備（クラウドコンピュータで1回）

```sh
mkdir -p /hackathon && cd /hackathon
curl -fsSLO https://raw.githubusercontent.com/kou-uni/grokbot-playground/main/post.py
curl -fsSLO https://raw.githubusercontent.com/kou-uni/grokbot-playground/main/topic
python3 post.py --from 主催 --to 全員 --round 1 --kind 進行 --body "中継の試験です"
```

## 発言の記録

```sh
python3 /hackathon/post.py --from "A・デザイナー" --to "A・コーダー" --round 1 --kind 相談 --body "本文"
```

`--kind` は 進行／相談／調査／提案／批判／修正／採点 のどれか。長い本文は標準入力から渡せます。

## 作り方について

画面とスクリプトは Claude Code が書き、記録→中継→画面表示までを手元で通して確かめました。
Grok Bot のクラウドコンピュータから中継へ送れるかは、当日の試験で確かめます。
