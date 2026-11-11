# Ana I Love You So 匯入測試（2026-11-05）

- 來源：`/home/sweet/樂譜/開源格式/Ana I Love You So.musicxml`
- SHA256：`1b41d5591fddcc253c317278c22692847792dce97ae6c801d46b54344151cd74`（轉換前後相同）
- PDF：`/home/sweet/樂譜/Ana I Love You So.pdf`（1 頁，無文字層；標題寫成 And I Love You So）
- 輸出：`data/trials/musicxml/ana-i-love-you-so-musicxml-trial.json`，id `ana-i-love-you-so-musicxml-trial`。未寫入 `data/songs/`。
- 結果：40 小節、4/4、149 個旋律事件、40 個自動大調和弦。

## 重建命令

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/home/sweet/樂譜/開源格式/Ana I Love You So.musicxml" data/trials/musicxml \
  --song-id ana-i-love-you-so-musicxml-trial --tempo 80 --transpose -9
```

## 移調證據：-9（依音域推定，PDF 沒有標樂器）

- PDF 只有標題、署名 Ajax Hsieh、1 個降記號，沒有「For Eb Sax」或其他樂器字樣。MusicXML 的 part-name 是 `Voice`，不當作證據。
- 來源旋律音高為 MIDI 65–81（F4–A5）。
- 若當實音（0）：網頁會顯示 74–90，超過先前使用的 58–89 寬檢查區間。
- 使用 -9：實音 56–72，顯示 65–81，落在 58–89 區間內。
- 因此 -9 是依音域所做的判斷，不是 PDF 的明確標示。若日後確認這份譜本來就是實音，需改用 0 重轉。
- 調性：寫定 F 大調（1 個降記號），終止在 F 全音符。-9 後實音為 Ab 大調，`keyConcert=Ab`。
- 大小調：以 F 主音收尾，判為大調，沿用自動大調和弦。XML 沒有 `<mode>`。

## 速度

來源 MusicXML 沒有 `<sound tempo>`，PDF 也沒有速度記號。`tempo=80` 是暫定的練習速度。

## 做過的檢查

| 項目 | 結果 |
| --- | --- |
| validate_song | 錯誤清單為空 |
| 拍數加總 | 事件從 0 連續到 160.0，無空洞、無重疊，等於 40 × 4 |
| 單元測試 | `unittest test_musicxml_import test_harmonizer test_phase1`：76 項通過 |
| 和聲重複處理 | `harmonize_song` 重跑結果相同，仍為 40 個和弦，驗證通過 |
| 原檔雜湊 | `sha256sum -c` 通過 |
| 結構檢查 | 轉換器未拒絕；XML 有 22 個 `<tie>` 標記，同音高延音線由轉換器保留 |
| 瀏覽器載入（headless Chromium，playwright-core） | 5013 埠載入後數到 149 個譜面事件、40 個譜表、14 個延音線元素，與 JSON 事件數相符。無 JS 例外，另有 1 個 404 資源請求 |
| PDF 核對範圍 | 只看整頁：1 個降記號、無反覆記號、結尾 F 全音符。沒有逐音比對 |

## 未做的檢查

- 未逐音校對全曲。
- 未在瀏覽器操作播放、暫停、循環，也未做音訊測量。
- 未做真人聆聽，和弦為自動大調配法，未校對。
- 未逐一核對延音線：XML 有 22 個 `<tie>` 標記（start＋stop），瀏覽器畫出 14 個延音線元素。
- `composer` 留空。PDF 寫有 Ajax Hsieh，沒有標明角色，因此沒有填入。畫面會顯示「傳統樂曲」。

## 預覽

http://127.0.0.1:5013 ，只載入這一首。啟動方式見 AI_IMPORT_GUIDE 第 13 節，id 換成 `ana-i-love-you-so-musicxml-trial`、port 換成 5013。
