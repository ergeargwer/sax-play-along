# Are You Lonesome Tonight 匯入測試（2026-11-05 轉換，2026-11-11 收尾驗證）

- 來源：`/home/sweet/樂譜/開源格式/Are You Lonesome Tonight.musicxml`
- SHA256：`6297b7af6c41abac9cfd217cd197a4ab5960803a98c01f3b0570d0c7e7e11c2d`（轉換前後相同）
- PDF：`/home/sweet/樂譜/Are You Lonesome Tonight.pdf`（1 頁，無文字層）
- 輸出：`data/trials/musicxml/are-you-lonesome-tonight-musicxml-trial.json`，id `are-you-lonesome-tonight-musicxml-trial`。未寫入 `data/songs/`。
- 結果：32 小節、3/4、92 個旋律事件、32 個自動大調和弦。

## 重建命令

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/home/sweet/樂譜/開源格式/Are You Lonesome Tonight.musicxml" data/trials/musicxml \
  --song-id are-you-lonesome-tonight-musicxml-trial --tempo 80 --transpose -9
```

## 移調證據：-9（依音域推定，PDF 沒有標樂器）

- PDF 只有標題、署名 Ajax Hsieh、1 個升記號與 3/4 拍號，沒有「For Eb Sax」或其他樂器字樣。MusicXML 的 part-name 是 `Voice`，不當作證據。
- 來源旋律音高為 MIDI 69–83（A4–B5）。
- 若當實音（0）：網頁會顯示 78–92，超過寫定 58–89 的寬檢查區間。
- 使用 -9：實音 60–74，顯示 69–83，落在區間內。
- 因此 -9 是依音域所做的判斷，不是 PDF 的明確標示。若日後確認這份譜本來就是實音，需改用 0 重轉。
- 調性：寫定 G 大調（1 個升記號），終止在 G 附點二分音符。-9 後實音為 Bb 大調，`keyConcert=Bb`。
- 大小調：以 G 主音收尾，判為大調，沿用自動大調和弦。XML 沒有 `<mode>`。

## 速度

來源 MusicXML 沒有 `<sound tempo>`，PDF 也沒有速度記號。`tempo=80` 是暫定的練習速度。

## 做過的檢查

| 項目 | 結果 |
| --- | --- |
| validate_song | 錯誤清單為空 |
| 拍數加總 | 事件從 0 連續到 96.0，無空洞、無重疊，等於 32 × 3 |
| 單元測試 | `unittest test_musicxml_import test_harmonizer test_phase1`：76 項通過；`npm test`：31 項通過（2026-11-11，推送前） |
| 和聲重複處理 | `harmonize_song` 重跑結果相同，仍為 32 個和弦，驗證通過 |
| 原檔雜湊 | 2026-11-11 重新計算，與轉換前相同 |
| 結構檢查 | 轉換器未拒絕；XML 有 2 個 `<tie>` 標記，JSON 中有 2 個事件帶 tie 記號 |
| 瀏覽器載入（headless Chromium，playwright-core） | 5014 埠載入後數到 92 個譜面事件、32 個譜表、2 個延音線元素，與 JSON 事件數相符。無 JS 例外，另有 1 個 404 資源請求 |
| PDF 核對範圍 | 只看整頁：1 個升記號、3/4、無反覆記號、結尾 G 附點二分音符。沒有逐音比對 |

## 未做的檢查

- 未逐音校對全曲。
- 未在瀏覽器操作播放、暫停、循環，也未做音訊測量。
- 未做真人聆聽，和弦為自動大調配法，未校對。
- 延音線只核對數量：XML 有 2 個 `<tie>` 標記，JSON 有 2 個事件帶 tie，瀏覽器畫出 2 個延音線元素；未逐一比對位置。
- `composer` 留空。PDF 寫有 Ajax Hsieh，沒有標明角色，因此沒有填入。畫面會顯示「傳統樂曲」。

## 預覽

http://127.0.0.1:5014 ，只載入這一首。啟動方式見 AI_IMPORT_GUIDE 第 13 節，id 換成 `are-you-lonesome-tonight-musicxml-trial`、port 換成 5014。
