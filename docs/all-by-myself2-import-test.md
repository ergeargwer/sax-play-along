# All By Myself2 匯入測試（2026-11-05）

- 來源：`/home/sweet/樂譜/開源格式/All By Myself2.musicxml`
- SHA256：`b2f04e41ac99fcbfe1af294c680fd278c39534c320293d688191df93d74cf614`（轉換前後相同）
- PDF：`/home/sweet/樂譜/All By Myself2.pdf`（1 頁掃描圖，無文字層）
- 輸出：`data/trials/musicxml/all-by-myself2-musicxml-trial.json`，id `all-by-myself2-musicxml-trial`。未寫入 `data/songs/`。
- 結果：24 小節、4/4、141 個旋律事件、24 個自動大調和弦。
- 與 `all-by-myself-musicxml-trial` 是同曲不同來源檔（寫定 D 大調，另一份為 A 大調），互不取代。

## 重建命令

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/home/sweet/樂譜/開源格式/All By Myself2.musicxml" data/trials/musicxml \
  --song-id all-by-myself2-musicxml-trial --tempo 80 --transpose -9
```

## 移調證據：-9

- PDF 左上角寫「Alto-Sax」與「Eb 調樂器可以配合影片練習」。這不是「For Eb Sax」的原字，但明確標示是 Eb 中音薩克斯風的寫定譜，因此採用 -9。
- 音域佐證：來源旋律 MIDI 61–78；若當實音（0）顯示會到 87，偏高。-9 後實音 52–69，顯示 61–78。
- 調性：PDF 與 XML 為 2 個升記號，寫定 D 大調，終止在 D 全音符。-9 後實音 F 大調，`keyConcert=F`。
- 大小調：以 D 主音收尾，判為大調，沿用自動大調和弦。XML 沒有 `<mode>`。
- MusicXML 的 part-name 是 `Voice`，不當作證據。

## 速度

來源 MusicXML 沒有 `<sound tempo>`，PDF 也沒有速度記號。`tempo=80` 是暫定的練習速度。

## 做過的檢查

| 項目 | 結果 |
| --- | --- |
| validate_song | 錯誤清單為空 |
| 拍數加總 | 事件從 0 連續到 96.0，無空洞、無重疊，等於 24 × 4 |
| 單元測試 | `unittest test_musicxml_import test_harmonizer test_phase1`：76 項通過 |
| 和聲重複處理 | `harmonize_song` 重跑結果相同，仍為 24 個和弦，驗證通過 |
| 原檔雜湊 | `sha256sum -c` 通過 |
| 結構檢查 | XML 無反覆、房號、三連音、裝飾音、forward、chord；有 66 個 `<tie>` 標記，轉換器保留同音高延音線 |
| 瀏覽器載入（headless Chromium，playwright-core） | 5012 埠載入後數到 141 個譜面事件、24 個譜表、35 個延音線元素，與 JSON 事件數相符。無 JS 例外，另有 1 個 404 資源請求 |
| PDF 核對範圍 | 只看第 1 頁整體：樂器標示、D 大調、無反覆記號、結尾 D 全音符 |

## 未做的檢查

- 未逐音校對全曲；PDF 只核對音高基準、調號與結尾。
- 未在瀏覽器操作播放、暫停、循環，也未做音訊測量。
- 未做真人聆聽，和弦為自動大調配法，未校對。
- 未逐一核對延音線：XML 有 66 個 `<tie>` 標記（start＋stop），瀏覽器畫出 35 個延音線元素。
- `composer` 留空。PDF 右上角寫有 Ajax Hsieh，沒有標明角色，因此沒有填入。畫面會顯示「傳統樂曲」。

## 預覽

http://127.0.0.1:5012 ，只載入這一首。啟動方式見 AI_IMPORT_GUIDE 第 13 節，id 換成 `all-by-myself2-musicxml-trial`、port 換成 5012。
