#!/usr/bin/env python3
"""画面の Go ボタンからの合図を待つ。届いたら設定を表示して終わる。

使い方:
  python3 wait_go.py --key "開始キー" --minutes 10

開始キーから合図用の名前を計算し、そこへ届く最初の合図を待つ。
時間内に届かなければ、終了コード 2 で終わる。
"""
import argparse
import hashlib
import json
import sys
import time
import urllib.request


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--key", required=True)
    p.add_argument("--minutes", type=float, default=10)
    a = p.parse_args()

    topic = "bothack-ctl-" + hashlib.sha256(a.key.encode("utf-8")).hexdigest()[:16]
    start = int(time.time())
    deadline = time.time() + a.minutes * 60
    print(f"合図を待っています（最長 {a.minutes:g} 分）", flush=True)
    while time.time() < deadline:
        try:
            url = f"https://ntfy.sh/{topic}/json?poll=1&since={start}"
            with urllib.request.urlopen(url, timeout=15) as r:
                for line in r.read().decode("utf-8").splitlines():
                    o = json.loads(line)
                    if o.get("event") != "message":
                        continue
                    try:
                        m = json.loads(o["message"])
                    except Exception:
                        continue
                    if m.get("type") == "go":
                        print("合図が届きました。次の設定で開始してください。\n")
                        print(m.get("text") or json.dumps(m.get("config"), ensure_ascii=False, indent=2))
                        return
        except Exception as e:
            print(f"読み取りに失敗（続けます）: {e}", flush=True)
        time.sleep(3)
    print("時間内に合図は届きませんでした")
    sys.exit(2)


if __name__ == "__main__":
    main()
