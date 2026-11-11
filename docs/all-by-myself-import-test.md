# All By Myself 匯入測試（2026-11-05）

- 來源：`/home/sweet/樂譜/開源格式/All By Myself.musicxml`
- SHA256：`335bed4c91c4b5268ed7bf7c68e1a71041287b521a8a02e0463f665bebbb51d9`（轉換前後相同）
- PDF：`/home/sweet/樂譜/All By Myself.pdf`（掃描圖，無文字層）
- 輸出：`data/trials/musicxml/all-by-myself-musicxml-trial.json`，id `all-by-myself-musicxml-trial`。未寫入 `data/songs/`。
- 結果：24 小節、4/4、136 個旋律事件、23 個自動大調和弦。

## 重建命令

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/home/sweet/樂譜/開源格式/All By Myself.musicxml" data/trials/musicxml \
  --song-id all-by-myself-musicxml-trial --tempo 80 --transpose -9
```

## 移調證據：-9（依音域推定，PDF 沒有標 For Eb Sax）

- PDF 第 1 頁為高音譜號、3 個升記號，沒有「For Eb Sax」字樣，也沒有樂器標示。MusicXML 的 part-name 是 `Voice`，這不算證據。
- 來源旋律音高為 MIDI 64–85（E4–C#6）。
- 若當實音（0）：網頁會顯示 73–94，高於先前使用的 58–89 寬檢查區間，不適合中音薩克斯風。
- 使用 -9：實音 55–76，顯示 64–85，落在寫定 58–89 區間內。
- 因此 -9 是依這份譜的音域所做的判斷，不是 PDF 的明確標示。若日後有人確認這份譜本來就是實音，需要改用 0 重轉。
- 調性：3 個升記號為 A 大調（寫定），-9 後實音為 C 大調，`keyConcert=C`。
- 大小調：旋律以 C#、B、E 為主，PDF 與 XML 最後都落在 A 主音全音符。判為大調，沿用自動大調和弦。XML 沒有 `<mode>`。

## 速度

來源 MusicXML 沒有 `<sound tempo>`，PDF 也未見速度記號。`tempo=80` 是暫定的練習速度。

## 做過的檢查

| 項目 | 結果 |
| --- | --- |
| validate_song | 錯誤清單為空 |
| 拍數加總 | 事件從 0 連續到 96.0，無空洞、無重疊，等於 24 × 4 |
| 單元測試 | `unittest test_musicxml_import test_harmonizer test_phase1`：76 項通過 |
| 和聲重複處理 | `harmonize_song` 重跑結果相同，仍為 23 個和弦 |
| 原檔雜湊 | `sha256sum -c` 通過 |
| 瀏覽器載入（headless Chromium，playwright-core） | 5011 埠載入後數到 136 個譜面事件、24 個譜表、33 個延音線元素，與 JSON 事件數相符。無 JS 例外，另有 1 個 404 資源請求 |
| PDF 核對範圍 | 只看第 1 頁整體：A 大調、高音譜號、無反覆記號、末小節為 A 全音符。整首共 24 小節，在頁面上看起來是 C 常拍號 |

## 未做的檢查

- 未逐音校對全曲；PDF 只核對音高基準、調號與結尾。
- 未在瀏覽器操作播放、暫停、循環，也未做音訊測量。
- 未做真人聆聽，和弦為自動大調配法，未校對。
- 未手動確認 33 個延音線元素與 XML 中 62 個 `<tie>` 標記（start＋stop）一一對應；同音高延音線由轉換器保留。
- `composer` 留空。PDF 右上角寫有 Ajax Hsieh，沒有標明是作曲或製譜，因此沒有填入。畫面會顯示「傳統樂曲」。

## 預覽

http://127.0.0.1:5011 ，只載入這一首。啟動方式見 AI_IMPORT_GUIDE 第 13 節，把 id 換成 `all-by-myself-musicxml-trial`、port 換成 5011。
