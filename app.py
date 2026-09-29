# -*- coding: utf-8 -*-
"""
sax-play-along -- Flask 入口與 API

提供主頁面、曲目清單與單首曲目 JSON。
啟動時掃描 data/songs/ 並驗證格式,不合格檔案記錄日誌但不中斷啟動。
"""

import json
import logging
import os
import sys
from pathlib import Path

from flask import Flask, jsonify, render_template, abort

# ---------------------------------------------------------------------------
# 設定
# ---------------------------------------------------------------------------

SONGS_DIR = Path(__file__).resolve().parent / "data" / "songs"

app = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("sax-play-along")

# 已通過驗證的曲目,啟動時載入
_songs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# 曲目 JSON 驗證
# ---------------------------------------------------------------------------

def validate_song(data: dict, filename: str) -> list[str]:
    """驗證曲目 JSON 是否符合規格,回傳所有錯誤訊息清單(空清單代表通過)。"""
    errors: list[str] = []

    # -- 必要欄位 --
    required_fields = [
        "id", "title", "composer", "license",
        "keyConcert", "timeSignature", "tempo", "measures",
        "melody", "tracks",
    ]
    for field in required_fields:
        if field not in data:
            errors.append(f"缺少必要欄位: {field}")
    # 若缺少關鍵欄位,後續驗證無法進行
    if errors:
        return errors

    # -- 型別檢查 --
    ts = data["timeSignature"]
    if (not isinstance(ts, list) or len(ts) != 2
            or not isinstance(ts[0], int) or not isinstance(ts[1], int)
            or ts[0] <= 0 or ts[1] <= 0):
        errors.append(
            f"timeSignature 須為 [正整數, 正整數],目前為: {ts}"
        )

    tempo = data["tempo"]
    if not isinstance(tempo, (int, float)) or tempo <= 0:
        errors.append(f"tempo 須為正數,目前為: {tempo}")

    measures = data["measures"]
    if not isinstance(measures, int) or measures <= 0:
        errors.append(f"measures 須為正整數,目前為: {measures}")

    # 計算總拍數上限
    if isinstance(ts, list) and len(ts) == 2 and isinstance(measures, int):
        beats_per_measure = ts[0]
        max_beats = measures * beats_per_measure
    else:
        max_beats = None

    # -- melody 驗證 --
    melody = data.get("melody")
    if not isinstance(melody, list):
        errors.append("melody 須為陣列")
    else:
        note_intervals: list[tuple[float, float]] = []
        for i, note in enumerate(melody):
            prefix = f"melody[{i}]"
            # 必要子欄位
            if not isinstance(note, dict):
                errors.append(f"{prefix}: 須為物件")
                continue
            for key in ("midi", "start", "dur"):
                if key not in note:
                    errors.append(f"{prefix}: 缺少欄位 {key}")
            if any(k not in note for k in ("midi", "start", "dur")):
                continue

            midi_val = note["midi"]
            start_val = note["start"]
            dur_val = note["dur"]

            # midi 型別與範圍
            if not isinstance(midi_val, int):
                errors.append(f"{prefix}: midi 須為整數,目前為 {midi_val}")
            elif midi_val != 0 and (midi_val < 21 or midi_val > 108):
                errors.append(
                    f"{prefix}: midi 須為 0(休止符)或 21-108,目前為 {midi_val}"
                )

            # start
            if not isinstance(start_val, (int, float)) or start_val < 0:
                errors.append(f"{prefix}: start 須為 >= 0 的數值,目前為 {start_val}")

            # dur
            if not isinstance(dur_val, (int, float)) or dur_val <= 0:
                errors.append(f"{prefix}: dur 須為正數,目前為 {dur_val}")

            # 總長檢查
            if (max_beats is not None
                    and isinstance(start_val, (int, float))
                    and isinstance(dur_val, (int, float))):
                end_beat = start_val + dur_val
                if end_beat > max_beats + 0.001:  # 浮點容差
                    errors.append(
                        f"{prefix}: 音符結束於第 {end_beat} 拍,"
                        f"超過總拍數上限 {max_beats}"
                    )

            # 收集非休止符區間,供重疊檢查
            if (isinstance(midi_val, int) and midi_val != 0
                    and isinstance(start_val, (int, float))
                    and isinstance(dur_val, (int, float))):
                note_intervals.append((float(start_val), float(start_val + dur_val)))

        # 重疊檢查:依 start 排序後,比較相鄰區間
        note_intervals.sort()
        for j in range(1, len(note_intervals)):
            prev_end = note_intervals[j - 1][1]
            curr_start = note_intervals[j][0]
            if curr_start < prev_end - 0.001:  # 浮點容差
                errors.append(
                    f"melody 音符重疊: 區間 [{note_intervals[j-1][0]}, {prev_end})"
                    f" 與 [{curr_start}, {note_intervals[j][1]})"
                )

    # -- tracks 驗證 --
    tracks = data.get("tracks")
    allowed_types = {"melody", "notes", "click"}
    if not isinstance(tracks, list):
        errors.append("tracks 須為陣列")
    else:
        for i, track in enumerate(tracks):
            prefix = f"tracks[{i}]"
            if not isinstance(track, dict):
                errors.append(f"{prefix}: 須為物件")
                continue
            for key in ("id", "name", "type", "volume"):
                if key not in track:
                    errors.append(f"{prefix}: 缺少欄位 {key}")

            t_type = track.get("type")
            if t_type is not None and t_type not in allowed_types:
                errors.append(
                    f"{prefix}: type 須為 {allowed_types} 之一,目前為 '{t_type}'"
                )

            vol = track.get("volume")
            if vol is not None:
                if not isinstance(vol, (int, float)) or vol < 0.0 or vol > 1.0:
                    errors.append(
                        f"{prefix}: volume 須為 0.0 至 1.0,目前為 {vol}"
                    )

            # notes 類型軌道須有 notes 陣列
            if t_type == "notes":
                trk_notes = track.get("notes")
                if not isinstance(trk_notes, list):
                    errors.append(f"{prefix}: type 為 'notes' 時須包含 notes 陣列")
                else:
                    for k, tn in enumerate(trk_notes):
                        tn_prefix = f"{prefix}.notes[{k}]"
                        if not isinstance(tn, dict):
                            errors.append(f"{tn_prefix}: 須為物件")
                            continue
                        for key in ("midi", "start", "dur"):
                            if key not in tn:
                                errors.append(f"{tn_prefix}: 缺少欄位 {key}")
                        tn_midi = tn.get("midi")
                        # midi 可為整數或整數陣列(和弦)
                        if tn_midi is not None:
                            if isinstance(tn_midi, list):
                                for m_idx, m_val in enumerate(tn_midi):
                                    if not isinstance(m_val, int):
                                        errors.append(
                                            f"{tn_prefix}.midi[{m_idx}]: 須為整數"
                                        )
                            elif not isinstance(tn_midi, int):
                                errors.append(f"{tn_prefix}: midi 須為整數或整數陣列")

    return errors


# ---------------------------------------------------------------------------
# 曲目載入
# ---------------------------------------------------------------------------

def load_songs() -> dict[str, dict]:
    """掃描 data/songs/ 並載入通過驗證的曲目。"""
    songs: dict[str, dict] = {}

    if not SONGS_DIR.is_dir():
        logger.warning("曲目目錄不存在: %s", SONGS_DIR)
        return songs

    for filepath in sorted(SONGS_DIR.glob("*.json")):
        if filepath.name == "index.json":
            continue
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as exc:
            logger.error("曲目檔案 JSON 解析失敗 [%s]: %s", filepath.name, exc)
            continue
        except OSError as exc:
            logger.error("曲目檔案讀取失敗 [%s]: %s", filepath.name, exc)
            continue

        validation_errors = validate_song(data, filepath.name)
        if validation_errors:
            logger.error(
                "曲目檔案驗證失敗 [%s]:\n  %s",
                filepath.name,
                "\n  ".join(validation_errors),
            )
            continue

        song_id = data["id"]
        if song_id in songs:
            logger.error(
                "曲目 ID 重複: '%s'(檔案 %s 與先前載入者衝突,跳過此檔）",
                song_id, filepath.name,
            )
            continue

        songs[song_id] = data
        logger.info("已載入曲目: %s (%s)", data["title"], filepath.name)

    return songs


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """主頁面。"""
    return render_template("index.html")


@app.route("/api/songs")
def api_songs_list():
    """回傳曲目清單(精簡資訊）。"""
    result = []
    for song_id, song in _songs.items():
        result.append({
            "id": song["id"],
            "title": song["title"],
            "keyConcert": song["keyConcert"],
            "tempo": song["tempo"],
            "timeSignature": song["timeSignature"],
            "composer": song["composer"],
        })
    return jsonify(result)


@app.route("/api/songs/<song_id>")
def api_song_detail(song_id: str):
    """回傳單首曲目完整 JSON。"""
    song = _songs.get(song_id)
    if song is None:
        return jsonify({"error": f"找不到曲目: {song_id}"}), 404
    return jsonify(song)


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "找不到請求的資源"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "伺服器內部錯誤"}), 500


# ---------------------------------------------------------------------------
# 啟動
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _songs = load_songs()
    if not _songs:
        logger.warning("沒有載入任何曲目,請確認 data/songs/ 目錄內容")
    else:
        logger.info("共載入 %d 首曲目", len(_songs))

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
