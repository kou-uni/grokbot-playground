#!/usr/bin/env python3
"""画面の「はじめる」からの合図を待つ。届いたら内容を表示して終わる。

使い方:
  python3 wait_go.py --key "開始キー" --minutes 3

- 開始キーから合図用の名前を計算し、そこへ届く最初の合図を待つ。
- 待っている間、「待ち受け中」の知らせを画面へ送る（画面に、いま押せるかどうかが出る）。
- 合図が届いたら、「受け取った」と画面へ返し、内容（お題の指定など）を表示して、終了コード 0 で終わる。
- 時間内に届かなければ、終了コード 2 で終わる。
中継は1本つなぎっぱなしで読む。何度も読みに行くと、中継の回数制限に当たって、発言の中継まで止まるため。
"""
import argparse
import hashlib
import json
import os
import socket
import sys
import time
import unicodedata
import urllib.request

BASE = "https://ntfy.sh/"


def post(topic, obj):
    try:
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        urllib.request.urlopen(urllib.request.Request(BASE + topic, data=data, method="POST"), timeout=10).read()
    except Exception as e:
        print(f"知らせを送れませんでした（待ち受けは続けます）: {e}", flush=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--key", required=True)
    p.add_argument("--minutes", type=float, default=3)
    p.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)))
    a = p.parse_args()

    key = unicodedata.normalize("NFKC", a.key).strip().lower()  # 画面側と同じ正規化
    topic = "bothack-ctl-" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    seen_file = os.path.join(a.dir, ".go_seen")
    seen = set(open(seen_file).read().split()) if os.path.exists(seen_file) else set()
    start = int(time.time())
    deadline = start + int(a.minutes * 60)
    print(f"合図を待っています（最長 {a.minutes:g} 分・照合コード {topic[-4:]}）", flush=True)
    post(topic, {"type": "listening", "until": deadline})
    last_beat = time.time()

    while time.time() < deadline:
        try:
            # 少し前（20秒）からの分も読む。待ち受けの切れ目に押された合図を落とさないため
            url = f"{BASE}{topic}/json?since={start - 20}"
            with urllib.request.urlopen(url, timeout=50) as r:
                while time.time() < deadline:
                    line = r.readline()
                    if not line:
                        break
                    if time.time() - last_beat > 45:
                        post(topic, {"type": "listening", "until": deadline})
                        last_beat = time.time()
                    try:
                        o = json.loads(line)
                        m = json.loads(o["message"]) if o.get("event") == "message" else None
                    except Exception:
                        continue
                    if not m or m.get("type") != "go" or o["id"] in seen:
                        continue
                    with open(seen_file, "a") as f:
                        f.write(o["id"] + "\n")
                    post(topic, {"type": "ack", "go": o["id"]})
                    theme = str(m.get("theme") or "").strip()[:120]
                    print("合図が届きました。\n")
                    print("開始")
                    print("お題: " + (theme if theme else "おまかせ（主催者がXから決める）"))
                    return
        except (socket.timeout, TimeoutError):
            pass
        except Exception as e:
            print(f"読み取りに失敗（続けます）: {e}", flush=True)
            time.sleep(3)
    print("時間内に合図は届きませんでした")
    sys.exit(2)


if __name__ == "__main__":
    main()
