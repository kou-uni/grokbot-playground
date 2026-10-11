#!/usr/bin/env python3
"""新しい回を始める前に、前の回の記録と作品を退避する。

使い方（新しい回の開始の直前に1回）:
  python3 new_run.py

- log.jsonl を runs/<開始時刻>/log.jsonl へ移す。log.jsonl は空から始まる。
  （そのままにすると、wait_until.py が前の回の発言まで数えてしまう）
- teams/ の中の作品を runs/<開始時刻>/teams/ へ移し、teams/ を空のフォルダに戻す。
- state.json を初期の状態に戻す。
何も消さない。前の回のものは、すべて runs/ に残る。
"""
import json
import os
import shutil
import time

TEAMS = ["COBALT", "EMBER", "VIRIDIAN", "ULTRAVIOLET"]


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    log = os.path.join(root, "log.jsonl")
    lines = sum(1 for _ in open(log, encoding="utf-8")) if os.path.exists(log) else 0
    stamp = time.strftime("%Y%m%d-%H%M%S")
    dest = os.path.join(root, "runs", stamp)
    moved = []
    if lines:
        os.makedirs(dest, exist_ok=True)
        shutil.move(log, os.path.join(dest, "log.jsonl"))
        moved.append(f"log.jsonl（{lines}行）")
    for t in TEAMS:
        d = os.path.join(root, "teams", t)
        if os.path.isdir(d) and os.listdir(d):
            os.makedirs(os.path.join(dest, "teams"), exist_ok=True)
            shutil.move(d, os.path.join(dest, "teams", t))
            moved.append(f"teams/{t}")
        os.makedirs(d, exist_ok=True)
    open(log, "a", encoding="utf-8").close()
    with open(os.path.join(root, "state.json"), "w", encoding="utf-8") as f:
        json.dump({"round": 0, "phase": "準備", "finalists": [], "winner": None}, f, ensure_ascii=False)
    if moved:
        print(f"前の回を runs/{stamp}/ へ退避しました: " + "、".join(moved))
    else:
        print("退避するものはありませんでした")
    print("新しい回を始められます（log.jsonl は空、state.json は初期の状態）")


if __name__ == "__main__":
    main()
