# 優勝作をGitHubに置き、UIで見せる　設計案（Bot側→UI側）

## 1. 全体の流れ
1. ELONOVAが発表（kind=発表）を記録する。
2. Bot側が、その回の優勝作・準優勝作・記録を、リポジトリ kou-uni/grokbot-playground の main に1コミットで push する。
3. Vercel が main の push で自動デプロイする（公開URL: https://grokbot-playground.vercel.app/）。
4. Bot側が、公開が済んだことを中継（いつもの topic）に kind=公開 の1件で流す。
5. UIは kind=公開 を受けたら、作品のURLを開けるボタンを出す。過去分は works/index.json から一覧にする。

## 2. リポジトリでの置き場所
```
works/
  index.json                      … 全回の一覧（UIが読む）
  run3/
    winner/index.html             … 優勝作（チームのHTMLをそのまま）
    winner/shot.png               … 画面写真（無ければ Bot側が撮って入れる）
    runner-up/index.html
    runner-up/shot.png
    log.jsonl                     … その回の記録の原本（/hackathon/log.jsonl）
    result.json                   … その回の結果（下の形）
```
- 回の番号: 第1回=run1、第2回=run2、第3回=run3…。Bot側が数える。
- 作品のHTMLは中身を変えない（相対パスの画像などがあれば同じフォルダに一緒に置く）。
- 公開URL: `https://grokbot-playground.vercel.app/works/run3/winner/index.html`

### result.json の形
```json
{
  "run": 3,
  "started": 1791703411,
  "ended": 1791703699,
  "theme": "Botがハッカソンを回す ― …（お題の1行目）",
  "winner":    {"team": "ULTRAVIOLET", "title": "審査員の分身スパーリング", "members": ["GLITCH","SPARK"], "html": "winner/index.html", "shot": "winner/shot.png"},
  "runner_up": {"team": "EMBER", "title": "呼び出し票 ― 発表待ちをゼロに", "members": ["BLITZ","ATLAS"], "html": "runner-up/index.html", "shot": "runner-up/shot.png"},
  "votes": {"ULTRAVIOLET": 1, "EMBER": 1},
  "note": "審査・価値は時間切れ。同票のため合計点で決定",
  "log": "log.jsonl"
}
```
時刻は Unix 秒。パスは result.json のあるフォルダからの相対パス。

### works/index.json の形
```json
{"runs": [
  {"run": 3, "ended": 1791703699, "winner": "ULTRAVIOLET", "title": "審査員の分身スパーリング", "path": "works/run3/"},
  {"run": 2, "ended": 1791700340, "winner": "EMBER", "title": "バトン票 ― 復唱チェック", "path": "works/run2/"}
]}
```
新しい回を先頭に足す。

## 3. 中継に流す「公開」の1件
いつもの topic（bothack-1ceb05905be5e956）に、post.py と同じ形で流す。
```json
{"id":"…","ts":1791703760,"from":"ELONOVA","to":"全員","round":4,"kind":"公開",
 "body":"第3回の作品を公開しました\n優勝: https://grokbot-playground.vercel.app/works/run3/winner/index.html\n準優勝: https://grokbot-playground.vercel.app/works/run3/runner-up/index.html\n結果: https://grokbot-playground.vercel.app/works/run3/result.json"}
```
- 公開URLが実際に開ける（HTTP 200）のを Bot側が確かめてから流す。Vercel のデプロイを最長3分待つ。
- 開けなかったら kind=公開 は流さず、kind=進行 で「公開に失敗しました（理由）」と流す。

## 4. UI側にお願いしたいこと
1. post.py の KINDS に「公開」を足す（いまは足さないと post.py が受け付けない）。
2. kind=公開 を受けたら、本文のURLを開けるボタンにする（行頭の「優勝:」「準優勝:」「結果:」で見分ける）。
3. 過去の回の一覧が要るなら works/index.json を読む。
4. 作品を画面の中に埋め込む場合は iframe で同じドメインから読むので、そのまま表示できるはず（作品は外部の通信をしない作りになっている前提。保証はできない）。
5. vercel.json などで /works/ を配信対象から外していないか確認する。

## 5. Bot側（私）がやること
- 公開用の小さなスクリプト /hackathon/publish.py を作る（コピー、result.json と index.json の作成、push、公開URLの確認、kind=公開 の送信）。
- ELONOVAの手順の最後（発表のあと）で publish.py を実行させる。

## 6. 決めてほしいこと（UI側・リポジトリ側）
1. **push の方法**: 私のコンピューターからは今 GitHub に push できない（ログインしていない。連携ツールにはファイルを書き込む機能がない）。
   - 案A（おすすめ）: このリポジトリだけに書き込める細かい権限のトークン（Fine-grained PAT、Contents: Read and write、期限は短め）を発行して私に渡す。発表から1〜2分で公開できる。
   - 案B: 毎回クラウドのコーディングエージェントにプルリクエストを作らせ、人がマージする。数分以上かかり、ライブには向かない。
2. **main に直接 push してよいか**。だめなら works ブランチに push し、Vercel のプレビューURLを使う（URLが毎回変わるのでUIの対応が要る）。
3. **公開するのは優勝作だけか、準優勝作も含めるか**（案では両方）。
4. **第1〜2回の分もさかのぼって works/ に入れるか**（第2回は /hackathon/runs/ に残っている。第1回は形が違うので対象外を提案）。
5. 作品には「非公式・ハッカソン作品」と書かれている前提で、そのまま公開してよいか。
