#!/usr/bin/env python3
"""Botの発言を1件、記録して中継する。

使い方:
  python3 post.py --from "A・デザイナー" --to "A・コーダー" --round 2 --kind 相談 --body "本文"
  echo "長い本文" | python3 post.py --from 審査 --to 全員 --round 3 --kind 採点

やること:
  1. <dir>/log.jsonl に1行追記する（ロックを取る。これが証拠の原本）
  2. 中継先（ntfy）へ送る。長い本文は分割する
中継に失敗しても 0 で終わる。原本は log.jsonl に残っているため。
"""
import argparse
import fcntl
import json
import os
import sys
import time
import urllib.request
import uuid

KINDS = ["進行", "お題", "相談", "調査", "提案", "批判", "修正", "採点", "発表"]
CHUNK = 1000  # 1通あたりの文字数。ntfy の上限 4096 バイトに収める


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="src", required=True)
    p.add_argument("--to", dest="dst", required=True)
    p.add_argument("--round", type=int, required=True)
    p.add_argument("--kind", required=True, choices=KINDS)
    p.add_argument("--body")
    p.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)))
    a = p.parse_args()

    body = a.body if a.body is not None else sys.stdin.read()
    body = body.strip()
    if not body:
        sys.exit("本文が空です")

    rec = {
        "id": uuid.uuid4().hex[:10],
        "ts": int(time.time()),
        "from": a.src,
        "to": a.dst,
        "round": a.round,
        "kind": a.kind,
        "body": body,
    }

    log = os.path.join(a.dir, "log.jsonl")
    with open(log, "a", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        f.flush()
        fcntl.flock(f, fcntl.LOCK_UN)
    print(f"記録しました: {log} ({rec['id']})")

    topic = os.environ.get("HACK_TOPIC")
    tf = os.path.join(a.dir, "topic")
    if not topic and os.path.exists(tf):
        topic = open(tf, encoding="utf-8").read().strip()
    if not topic:
        print("中継先が未設定です（topic ファイルなし）。記録だけ残しました")
        return

    parts = [body[i:i + CHUNK] for i in range(0, len(body), CHUNK)]
    for i, part in enumerate(parts):
        msg = dict(rec, body=part, i=i, n=len(parts))
        data = json.dumps(msg, ensure_ascii=False).encode("utf-8")
        try:
            req = urllib.request.Request(f"https://ntfy.sh/{topic}", data=data, method="POST")
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as e:  # 中継は落ちても進行を止めない
            print(f"中継に失敗しました（記録は残っています）: {e}")
            return
        if len(parts) > 1:
            time.sleep(0.3)
    print(f"中継しました: {len(parts)}通")


if __name__ == "__main__":
    main()
