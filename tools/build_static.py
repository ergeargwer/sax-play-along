#!/usr/bin/env python3
"""產生可放上 GitHub Pages 的靜態網站（預設輸出到 site/）。

做法：用 Flask test client 取得與本機網站完全相同的首頁、曲目清單與每首曲目
（含 load_all_songs() 的合併、去重與補和弦），寫成靜態檔，再複製 static/。
不修改 data/ 內任何檔案。

用法：
    .venv/bin/python tools/build_static.py [輸出目錄]
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import app as sax_app  # noqa: E402

META = '<meta name="song-api" content="static">'

# 線上版不公開的曲目 id（本機 Flask 版仍顯示，資料檔不動）。
# 用在合併、去重之後，所以被去重略過的試轉副本不會補上來。
EXCLUDE_ONLINE = {"pao-a-sia", "pao-a-sia-musicxml-trial"}


def build(out: Path) -> int:
    if out.exists():
        shutil.rmtree(out)
    (out / "api" / "songs").mkdir(parents=True)

    sax_app._songs = {
        sid: song for sid, song in sax_app.load_all_songs().items()
        if sid not in EXCLUDE_ONLINE
    }
    if not sax_app._songs:
        raise SystemExit("沒有可用的曲目，停止建置")
    client = sax_app.app.test_client()

    html = client.get("/").get_data(as_text=True)
    if "<head>" not in html:
        raise SystemExit("首頁沒有 <head>，無法加入靜態模式標記")
    (out / "index.html").write_text(html.replace("<head>", "<head>\n  " + META, 1), encoding="utf-8")

    listing = client.get("/api/songs")
    (out / "api" / "songs.json").write_bytes(listing.data)
    for song in listing.get_json():
        detail = client.get(f"/api/songs/{song['id']}")
        if detail.status_code != 200:
            raise SystemExit(f"曲目 {song['id']} 取得失敗")
        (out / "api" / "songs" / f"{song['id']}.json").write_bytes(detail.data)

    shutil.copytree(ROOT / "static", out / "static")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    return len(listing.get_json())


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "site"
    count = build(target.resolve())
    print(f"已輸出 {count} 首曲目到 {target}")
