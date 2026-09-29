# -*- coding: utf-8 -*-
"""
階段 1 驗證測試

涵蓋範圍:
  - API 路由正確性
  - 曲目 JSON 格式與資料完整性
  - 驗證邏輯(正常與異常案例)
  - 伺服器錯誤處理
"""

import json
import os
import sys
import unittest
from pathlib import Path

# 確保能載入 app 模組
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import app, validate_song, load_songs, SONGS_DIR


class TestValidateSong(unittest.TestCase):
    """驗證邏輯測試"""

    def _make_valid_song(self):
        """產生一份最小合格的曲目資料"""
        return {
            "id": "test",
            "title": "測試曲",
            "composer": "Test",
            "license": "public-domain",
            "keyConcert": "C",
            "timeSignature": [4, 4],
            "tempo": 120,
            "measures": 1,
            "melody": [
                {"midi": 60, "start": 0, "dur": 1},
                {"midi": 62, "start": 1, "dur": 1},
            ],
            "tracks": [
                {"id": "melody-guide", "name": "旋律導奏", "type": "melody", "volume": 0.6},
                {"id": "metronome", "name": "節拍", "type": "click", "volume": 0.7},
            ],
        }

    # ---- 正常案例 ----

    def test_valid_song_passes(self):
        """合格的曲目資料應通過驗證"""
        song = self._make_valid_song()
        errors = validate_song(song, "test.json")
        self.assertEqual(errors, [], f"不應有錯誤,但收到: {errors}")

    def test_rest_note_midi_zero(self):
        """midi=0 代表休止符,應通過驗證"""
        song = self._make_valid_song()
        song["melody"] = [
            {"midi": 0, "start": 0, "dur": 2},
            {"midi": 60, "start": 2, "dur": 2},
        ]
        errors = validate_song(song, "test.json")
        self.assertEqual(errors, [])

    def test_fractional_beats(self):
        """小數拍(如附點節奏)應正常處理"""
        song = self._make_valid_song()
        song["melody"] = [
            {"midi": 60, "start": 0, "dur": 1.5},
            {"midi": 62, "start": 1.5, "dur": 0.5},
            {"midi": 64, "start": 2, "dur": 2},
        ]
        errors = validate_song(song, "test.json")
        self.assertEqual(errors, [])

    # ---- 缺少欄位 ----

    def test_missing_required_field(self):
        """缺少必要欄位應報錯"""
        song = self._make_valid_song()
        del song["id"]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("id" in e for e in errors))

    def test_missing_multiple_fields(self):
        """同時缺少多個欄位應全部報出"""
        song = self._make_valid_song()
        del song["id"]
        del song["title"]
        del song["tempo"]
        errors = validate_song(song, "test.json")
        self.assertGreaterEqual(len(errors), 3)

    # ---- 型別錯誤 ----

    def test_time_signature_not_list(self):
        """timeSignature 非陣列應報錯"""
        song = self._make_valid_song()
        song["timeSignature"] = "4/4"
        errors = validate_song(song, "test.json")
        self.assertTrue(any("timeSignature" in e for e in errors))

    def test_time_signature_wrong_length(self):
        """timeSignature 長度不為 2 應報錯"""
        song = self._make_valid_song()
        song["timeSignature"] = [4]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("timeSignature" in e for e in errors))

    def test_time_signature_non_integer(self):
        """timeSignature 含非整數應報錯"""
        song = self._make_valid_song()
        song["timeSignature"] = [4.0, 4]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("timeSignature" in e for e in errors))

    def test_tempo_negative(self):
        """tempo 為負數應報錯"""
        song = self._make_valid_song()
        song["tempo"] = -10
        errors = validate_song(song, "test.json")
        self.assertTrue(any("tempo" in e for e in errors))

    def test_tempo_zero(self):
        """tempo 為零應報錯"""
        song = self._make_valid_song()
        song["tempo"] = 0
        errors = validate_song(song, "test.json")
        self.assertTrue(any("tempo" in e for e in errors))

    def test_measures_zero(self):
        """measures 為零應報錯"""
        song = self._make_valid_song()
        song["measures"] = 0
        errors = validate_song(song, "test.json")
        self.assertTrue(any("measures" in e for e in errors))

    def test_measures_float(self):
        """measures 為浮點數應報錯"""
        song = self._make_valid_song()
        song["measures"] = 2.5
        errors = validate_song(song, "test.json")
        self.assertTrue(any("measures" in e for e in errors))

    # ---- melody 驗證 ----

    def test_melody_midi_out_of_range(self):
        """MIDI 號碼超出鋼琴音域(21-108)應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 200, "start": 0, "dur": 1}]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("midi" in e and "21-108" in e for e in errors))

    def test_melody_midi_below_range(self):
        """MIDI 號碼低於 21(且非 0)應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 10, "start": 0, "dur": 1}]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("midi" in e for e in errors))

    def test_melody_negative_start(self):
        """start 為負數應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 60, "start": -1, "dur": 1}]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("start" in e for e in errors))

    def test_melody_zero_duration(self):
        """dur 為零應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 60, "start": 0, "dur": 0}]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("dur" in e for e in errors))

    def test_melody_negative_duration(self):
        """dur 為負數應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 60, "start": 0, "dur": -1}]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("dur" in e for e in errors))

    def test_melody_exceeds_total_beats(self):
        """音符結束拍超過 measures*beats_per_measure 應報錯"""
        song = self._make_valid_song()
        song["measures"] = 1  # 4 拍
        song["melody"] = [{"midi": 60, "start": 0, "dur": 5}]  # 超過 4 拍
        errors = validate_song(song, "test.json")
        self.assertTrue(any("超過" in e or "拍" in e for e in errors))

    def test_melody_overlap(self):
        """旋律音符重疊應報錯"""
        song = self._make_valid_song()
        song["measures"] = 2
        song["melody"] = [
            {"midi": 60, "start": 0, "dur": 3},
            {"midi": 62, "start": 2, "dur": 2},  # 與前一音重疊
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("重疊" in e for e in errors))

    def test_melody_rest_does_not_cause_overlap(self):
        """休止符(midi=0)不應觸發重疊檢查"""
        song = self._make_valid_song()
        song["measures"] = 2
        song["melody"] = [
            {"midi": 60, "start": 0, "dur": 3},
            {"midi": 0, "start": 2, "dur": 2},   # 休止符,即使時間重疊也不算
            {"midi": 64, "start": 4, "dur": 2},
        ]
        errors = validate_song(song, "test.json")
        overlap_errors = [e for e in errors if "重疊" in e]
        self.assertEqual(overlap_errors, [])

    def test_melody_adjacent_notes_no_overlap(self):
        """緊鄰的音符不應被判定為重疊"""
        song = self._make_valid_song()
        song["melody"] = [
            {"midi": 60, "start": 0, "dur": 2},
            {"midi": 62, "start": 2, "dur": 2},
        ]
        errors = validate_song(song, "test.json")
        overlap_errors = [e for e in errors if "重疊" in e]
        self.assertEqual(overlap_errors, [])

    def test_melody_missing_subfield(self):
        """音符缺少子欄位(如 dur)應報錯"""
        song = self._make_valid_song()
        song["melody"] = [{"midi": 60, "start": 0}]  # 缺少 dur
        errors = validate_song(song, "test.json")
        self.assertTrue(any("dur" in e for e in errors))

    # ---- tracks 驗證 ----

    def test_track_unknown_type(self):
        """軌道 type 不在允許清單應報錯"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "t1", "name": "test", "type": "drum", "volume": 0.5},
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("type" in e for e in errors))

    def test_track_volume_over_one(self):
        """volume 超過 1.0 應報錯"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "t1", "name": "test", "type": "melody", "volume": 1.5},
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("volume" in e for e in errors))

    def test_track_volume_negative(self):
        """volume 為負數應報錯"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "t1", "name": "test", "type": "melody", "volume": -0.1},
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("volume" in e for e in errors))

    def test_track_notes_type_missing_notes(self):
        """type 為 notes 卻沒有 notes 陣列應報錯"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "t1", "name": "test", "type": "notes", "volume": 0.5},
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("notes" in e for e in errors))

    def test_track_missing_required_field(self):
        """軌道缺少必要欄位應報錯"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "t1", "name": "test"},  # 缺少 type 和 volume
        ]
        errors = validate_song(song, "test.json")
        self.assertTrue(any("type" in e or "volume" in e for e in errors))

    def test_track_chord_midi_array(self):
        """和弦軌道使用 MIDI 陣列應通過"""
        song = self._make_valid_song()
        song["tracks"] = [
            {"id": "melody-guide", "name": "旋律導奏", "type": "melody", "volume": 0.6},
            {
                "id": "chords", "name": "和弦", "type": "notes", "volume": 0.5,
                "notes": [{"midi": [48, 52, 55], "start": 0, "dur": 4}],
            },
        ]
        errors = validate_song(song, "test.json")
        self.assertEqual(errors, [])

    # ---- 多個錯誤同時回報 ----

    def test_multiple_errors_reported_at_once(self):
        """多個不同類型的錯誤應全部回報,不在第一個就停止"""
        song = self._make_valid_song()
        song["tempo"] = -1
        song["measures"] = 0
        song["tracks"] = [
            {"id": "t1", "name": "test", "type": "unknown", "volume": 2.0},
        ]
        errors = validate_song(song, "test.json")
        # 至少應有: tempo 錯誤 + measures 錯誤 + type 錯誤 + volume 錯誤
        self.assertGreaterEqual(len(errors), 4,
                                f"預期至少 4 個錯誤,但只有 {len(errors)}: {errors}")


class TestSongDataIntegrity(unittest.TestCase):
    """三首曲目 JSON 資料完整性測試"""

    @classmethod
    def setUpClass(cls):
        cls.songs = {}
        for name in ("ode-to-joy", "amazing-grace", "auld-lang-syne"):
            filepath = SONGS_DIR / f"{name}.json"
            with open(filepath, "r", encoding="utf-8") as f:
                cls.songs[name] = json.load(f)

    def test_all_songs_pass_validation(self):
        """三首曲目全部通過驗證"""
        for name, data in self.songs.items():
            errors = validate_song(data, f"{name}.json")
            self.assertEqual(errors, [],
                             f"{name} 驗證失敗: {errors}")

    def test_each_song_has_four_tracks(self):
        """每首曲目應有四條軌道"""
        for name, data in self.songs.items():
            self.assertEqual(len(data["tracks"]), 4,
                             f"{name} 應有 4 條軌道,實際 {len(data['tracks'])}")

    def test_track_ids_correct(self):
        """四條軌道的 id 應為 melody-guide、chords、bass、metronome"""
        expected_ids = {"melody-guide", "chords", "bass", "metronome"}
        for name, data in self.songs.items():
            actual_ids = {t["id"] for t in data["tracks"]}
            self.assertEqual(actual_ids, expected_ids,
                             f"{name} 軌道 ID 不符: {actual_ids}")

    def test_track_types_correct(self):
        """軌道類型對應正確"""
        expected = {
            "melody-guide": "melody",
            "chords": "notes",
            "bass": "notes",
            "metronome": "click",
        }
        for name, data in self.songs.items():
            for track in data["tracks"]:
                self.assertEqual(track["type"], expected[track["id"]],
                                 f"{name} 軌道 {track['id']} 類型應為 {expected[track['id']]}")

    def test_ode_to_joy_key_and_time(self):
        """歡樂頌:C 大調, 4/4 拍"""
        s = self.songs["ode-to-joy"]
        self.assertEqual(s["keyConcert"], "C")
        self.assertEqual(s["timeSignature"], [4, 4])
        self.assertEqual(s["measures"], 8)

    def test_amazing_grace_key_and_time(self):
        """奇異恩典:G 大調, 3/4 拍"""
        s = self.songs["amazing-grace"]
        self.assertEqual(s["keyConcert"], "G")
        self.assertEqual(s["timeSignature"], [3, 4])

    def test_auld_lang_syne_key_and_time(self):
        """友誼萬歲:G 大調, 4/4 拍"""
        s = self.songs["auld-lang-syne"]
        self.assertEqual(s["keyConcert"], "G")
        self.assertEqual(s["timeSignature"], [4, 4])
        self.assertEqual(s["measures"], 8)

    def test_melody_within_beat_limits(self):
        """所有旋律音符不超出小節總拍數"""
        for name, data in self.songs.items():
            max_beats = data["measures"] * data["timeSignature"][0]
            for i, note in enumerate(data["melody"]):
                end = note["start"] + note["dur"]
                self.assertLessEqual(
                    end, max_beats + 0.001,
                    f"{name} melody[{i}] 結束於 {end} 拍,超出上限 {max_beats}"
                )

    def test_melody_no_overlap(self):
        """所有旋律中非休止符的音符不重疊"""
        for name, data in self.songs.items():
            intervals = []
            for note in data["melody"]:
                if note["midi"] != 0:
                    intervals.append((note["start"], note["start"] + note["dur"]))
            intervals.sort()
            for j in range(1, len(intervals)):
                self.assertGreaterEqual(
                    intervals[j][0], intervals[j - 1][1] - 0.001,
                    f"{name} 旋律重疊: {intervals[j-1]} 與 {intervals[j]}"
                )

    def test_all_midi_in_valid_range(self):
        """所有 MIDI 號碼在合法範圍(0 或 21-108)"""
        for name, data in self.songs.items():
            for i, note in enumerate(data["melody"]):
                m = note["midi"]
                self.assertTrue(
                    m == 0 or 21 <= m <= 108,
                    f"{name} melody[{i}] MIDI {m} 超出範圍"
                )

    def test_license_is_public_domain(self):
        """所有曲目授權應為 public-domain"""
        for name, data in self.songs.items():
            self.assertEqual(data["license"], "public-domain",
                             f"{name} 授權應為 public-domain")


class TestFlaskAPI(unittest.TestCase):
    """Flask API 路由測試"""

    @classmethod
    def setUpClass(cls):
        app.config["TESTING"] = True
        # 手動載入曲目到 app 模組
        import app as app_module
        app_module._songs = load_songs()
        cls.client = app.test_client()

    def test_index_returns_html(self):
        """GET / 應回傳 HTML"""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("text/html", resp.content_type)

    def test_index_contains_title(self):
        """主頁面應包含標題文字"""
        resp = self.client.get("/")
        self.assertIn("薩克斯風", resp.data.decode("utf-8"))

    def test_api_songs_list(self):
        """GET /api/songs 應回傳曲目清單"""
        resp = self.client.get("/api/songs")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 3)

    def test_api_songs_list_fields(self):
        """曲目清單每筆應包含精簡欄位"""
        resp = self.client.get("/api/songs")
        data = resp.get_json()
        required_keys = {"id", "title", "keyConcert", "tempo", "timeSignature", "composer"}
        for item in data:
            self.assertTrue(
                required_keys.issubset(item.keys()),
                f"缺少欄位: {required_keys - item.keys()}"
            )

    def test_api_songs_list_no_melody(self):
        """曲目清單不應包含 melody 或 tracks(精簡回傳)"""
        resp = self.client.get("/api/songs")
        data = resp.get_json()
        for item in data:
            self.assertNotIn("melody", item)
            self.assertNotIn("tracks", item)

    def test_api_song_detail_ode_to_joy(self):
        """GET /api/songs/ode-to-joy 應回傳完整資料"""
        resp = self.client.get("/api/songs/ode-to-joy")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["id"], "ode-to-joy")
        self.assertIn("melody", data)
        self.assertIn("tracks", data)

    def test_api_song_detail_amazing_grace(self):
        """GET /api/songs/amazing-grace 應回傳完整資料"""
        resp = self.client.get("/api/songs/amazing-grace")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["id"], "amazing-grace")

    def test_api_song_detail_auld_lang_syne(self):
        """GET /api/songs/auld-lang-syne 應回傳完整資料"""
        resp = self.client.get("/api/songs/auld-lang-syne")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["id"], "auld-lang-syne")

    def test_api_song_not_found(self):
        """不存在的曲目應回傳 404"""
        resp = self.client.get("/api/songs/not-exist")
        self.assertEqual(resp.status_code, 404)

    def test_api_song_not_found_has_error_message(self):
        """404 回應應包含 error 訊息"""
        resp = self.client.get("/api/songs/not-exist")
        data = resp.get_json()
        self.assertIn("error", data)

    def test_api_song_not_found_json_format(self):
        """404 回應應為 JSON 格式"""
        resp = self.client.get("/api/songs/not-exist")
        self.assertIn("application/json", resp.content_type)


class TestLoadSongs(unittest.TestCase):
    """曲目載入流程測試"""

    def test_load_songs_returns_three(self):
        """load_songs() 應載入三首曲目"""
        songs = load_songs()
        self.assertEqual(len(songs), 3)

    def test_load_songs_keys_are_ids(self):
        """回傳字典的鍵應為曲目 id"""
        songs = load_songs()
        expected_ids = {"ode-to-joy", "amazing-grace", "auld-lang-syne"}
        self.assertEqual(set(songs.keys()), expected_ids)

    def test_no_emoji_in_code(self):
        """程式碼與曲目資料中不得包含 emoji"""
        # 檢查 app.py
        app_path = Path(__file__).resolve().parent / "app.py"
        with open(app_path, "r", encoding="utf-8") as f:
            content = f.read()
        for char in content:
            # emoji 範圍(簡化檢查)
            if ord(char) > 0x1F000:
                self.fail(f"app.py 包含 emoji 字元: U+{ord(char):04X}")

        # 檢查曲目 JSON
        for name in ("ode-to-joy", "amazing-grace", "auld-lang-syne"):
            filepath = SONGS_DIR / f"{name}.json"
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            for char in content:
                if ord(char) > 0x1F000:
                    self.fail(f"{name}.json 包含 emoji 字元: U+{ord(char):04X}")


if __name__ == "__main__":
    # 使用繁體中文測試摘要
    print("=" * 60)
    print("階段 1 驗證測試")
    print("=" * 60)
    unittest.main(verbosity=2)
