#!/usr/bin/env python3
"""章の制限時間を計る。記録が出そろうか、時間が来たら終わる。

使い方（主催が、章の開始を告げた直後に実行する）:
  python3 wait_until.py --round 2 --kind 提案 --count 4 --seconds 120

log.jsonl を5秒おきに見て、その章・その種類の発言が --count 件そろったら、すぐ終わる。
そろわなくても --seconds 秒で終わる。最後に、誰が出したかを表示する。
"""
import argparse
import json
import os
import time


def read(log, rnd, kinds):
    out = []
    if os.path.exists(log):
        for line in open(log, encoding="utf-8"):
            try:
                r = json.loads(line)
            except Exception:
                continue
            if r.get("round") == rnd and r.get("kind") in kinds:
                out.append(r)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--round", type=int, required=True)
    p.add_argument("--kind", required=True, help="種類。複数はカンマ区切り")
    p.add_argument("--count", type=int, required=True)
    p.add_argument("--seconds", type=int, default=120)
    p.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)))
    a = p.parse_args()

    log = os.path.join(a.dir, "log.jsonl")
    kinds = a.kind.split(",")
    start = time.time()
    while True:
        got = read(log, a.round, kinds)
        waited = int(time.time() - start)
        if len(got) >= a.count:
            print(f"出そろいました（{len(got)}件、{waited}秒）")
            break
        if waited >= a.seconds:
            print(f"時間切れです（{len(got)}/{a.count}件、{waited}秒）")
            break
        time.sleep(5)
    for r in got:
        print(f"- {r.get('from')} → {r.get('to')}（{r.get('kind')}）")


if __name__ == "__main__":
    main()
