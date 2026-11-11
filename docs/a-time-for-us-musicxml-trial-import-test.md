# A Time For Us 匯入紀錄

## 任務與產物

| 項目 | 結果 |
| --- | --- |
| 日期／執行工具 | 2026-10-22。`.venv/bin/python tools/trial_musicxml.py`，再把自動大調和弦換成 manual |
| 任務範圍 | 僅試轉。未加入正式曲庫，未改匯入器 |
| 來源 MusicXML | `/home/sweet/樂譜/開源格式/A Time For Us.musicxml` |
| 來源 PDF | `/home/sweet/樂譜/A Time For Us.pdf`（1 頁） |
| 來源 SHA256（匯入前／後） | MusicXML `178237e7ffa090e2090102acd4c7347f3ba17bca079cda44aa5174fdfee72698`，寫入歌曲 JSON 前後相同。PDF `7c59bbf5744f850e074f8c8e8d3c59224ebd793848e47cd075be97084a40bedd` |
| song id | `a-time-for-us-musicxml-trial` |
| 輸出歌曲 JSON | `data/trials/musicxml/a-time-for-us-musicxml-trial.json` |
| 修正清單 | 無 |
| 結構稽核 | 單 part、35 小節、3/4、fifths -1、無速度、4 個延音線標記、無反覆／三連音／轉調／和弦／拍數不符 |
| 正式曲庫的更動 | 未更動 |

## 來源結構與基準判定

| 項目 | 來源事實 | 採用方式／證據 |
| --- | --- | --- |
| 樂器與音高基準 | PDF 是高音譜單旋律。標題下只見署名 Ching Feng, Hsieh。沒有 For Eb Sax、薩克斯風或移調樂器字樣 | transpose 0，譜面音高當實音。Audiveris 的 Voice／Voice Oohs 與 midi-program 54 不採用 |
| 樂器／聲部數 | 一個 part、voice 1 | 整 part 匯入 |
| 調號／mode | fifths=-1，沒有 mode。音高集合 D E F G A Bb C。第 8、29、35 小節停在 D，開頭 D–F–E–A | D 自然小調。`keyConcert` 維持 `F`（一個降號的相對大調名稱），`mode` 為 `minor` |
| 拍號與變拍 | 全曲 3/4 | `[3, 4]` |
| 速度 | MusicXML 無 sound／metronome，PDF 無速度 | 練習速度 80 BPM |
| 反覆／弱起／延音線／三連音等 | 無反覆、房號、三連音、轉調、疊音。第 1 小節有休止，拍數仍是 3。第 13–14 與第 34–35 小節各有一條同音高 D 延音線 | 延音線保留。沒有刪標記 |
| 來源和弦 | 無 | 35 個 `source=manual` 的 D 小調練習和弦，不是原譜和聲 |
| 原小節時值不符 | 無。轉換器未拒絕 | 未改拍 |

採用移調：0。理由：PDF 沒有 For Eb Sax，不能用 -9。印出音域是 F4–Bb5（MIDI 65–82），沒有 `<transpose>`。這不是沿用其他曲的移調。

`keyConcert` 沒有改成 D，也沒有改成大調去通過 `harmonize_song`。畫面仍會寫「F 大調」，和弦代號也會再加 9 個半音顯示（Dm 顯示成 Bm）。那是 Eb 寫定譜介面，不是小調主音。

## 輸出統計

| 項目 | 實測結果 |
| --- | --- |
| 寫定調性／實音 keyConcert | 實音調號一個降號，`keyConcert=F`，`mode=minor`，聽感主音 D。畫面寫定調是 D 大調（兩個升號） |
| 拍號／tempo | 3/4，80 BPM（練習速度） |
| 小節數／總拍數 | 35 小節，105 拍 |
| 旋律事件數／其中休止數 | 104／2 |
| 實音 MIDI 範圍／寫定 MIDI 範圍 | 65–82／74–91。寫定高音超過先前較寬區間 58–89，沒有因此移八度 |
| 和弦代號數／來源或自動推定 | 35 個 manual。轉換器先產生的 35 個 F 調 automatic 和弦已整段替換，沒有留在檔內 |
| 儲存音軌／播放時生成音軌 | 檔內有 melody-guide、metronome、chords、bass。播放時柔和編排會改排鋼琴與貝斯並加上木吉他；木吉他沒有寫進 JSON |
| 總秒數 | 以 80 BPM 計算旋律約 78.75 秒，不含預備拍。沒有測量音訊 |

練習和弦，每小節一個，重音是和弦音。第 8、29、35 小節的長 D 用 Dm：

`Dm Am Bb Am Gm Am Am Dm / Gm Am F F Dm Dm / F C Bb F C Bb C / Dm Am Bb Am Gm Am Am Dm / Gm Am F F Dm Dm`

## 校對修正

無。原始 MusicXML 與 PDF 都沒有改。

| 小節／note 序號 | 欄位原值 | 欄位新值 | PDF／可信來源證據 | 修正清單位置 |
| --- | --- | --- | --- | --- |
| 無 | 無 | 無 | 無 | 無 |

## 驗證結果

| 檢查 | 結果 | 指令／證據／範圍 |
| --- | --- | --- |
| JSON／validate_song | 通過 | `validate_song` 錯誤清單為空 |
| 完整小節總長／連續性／重疊 | 通過 | 35 小節各覆蓋 3 拍；旋律首尾相接；發聲音不重疊 |
| 音軌 notes 拍位與範圍 | 通過 | chords、bass 的 MIDI 在 21–108，拍位落在 105 拍內 |
| notation 時值／writtenPitch | 通過時值。writtenPitch 等於實音 MIDI，不等於實音加 9 | 渲染器改用計算出的 Eb 拼法。沒有為拼法改播放音高 |
| harmonize_song 重複處理 | 拒絕，且載入後仍保留 manual 和弦 | `mode=minor` 時丟出 Automatic harmony currently requires major mode。`load_songs` 記錄警告後仍載入 35 個 manual 和弦 |
| 原始檔雜湊比對 | 通過 | 見上表 SHA256 |
| Python／Node 回歸測試 | 未執行 | 沒有改轉換器或前端 |
| API／單曲預覽 | API 通過。瀏覽器數到事件 | `GET /api/songs/a-time-for-us-musicxml-trial` 為 35 小節、104 個旋律事件、35 個和弦。Headless Chromium 點「進入練習」後，標題為 A Time For Us（MusicXML 試轉） (Ching Feng, Hsieh)，35 個五線譜、104 個 StaveNote，頁面沒有錯誤文字。視窗約 780×493 |
| 桌面／手機譜面 | 未做手機 | 只看了上述一個視窗 |
| 四種標記開關／換曲／縮放 | 未執行 | 只用頁面預設勾選渲染一次 |
| 載入／預備拍／播放／暫停／停止 | 未執行 | 沒有按播放 |
| 修正小節／循環／曲尾 | 未執行 | 沒有修正，也沒有操作循環 |
| Mute/Solo／音量 | 未執行 | |
| 音訊數據 | 未執行 | |
| PDF 全曲逐音校對 | 未執行 | PDF 只用來確認音高基準，以及頁面上沒有反覆、房號、三連音。沒有逐音對過 35 小節 |
| 真人聆聽／專業和聲校對 | 未執行 | manual 和弦不是原譜和聲 |

`composer` 用 PDF 右上的 Ching Feng, Hsieh。頁面沒有寫作曲或編曲。沒有另查原作者。空作曲欄才會顯示「傳統樂曲」，這次畫面上是這個署名。

## 重建與啟動

只重跑轉換器會覆蓋 manual 和弦，變回 F 調 automatic 配法。要回到這份試轉，轉換後必須再套用報告裡的 35 個 manual 和弦，並設 `mode` 為 `minor`、`keyConcert` 維持 `F`。

```bash
cd /home/sweet/.gemini/antigravity/scratch/sax-play-along
.venv/bin/python tools/trial_musicxml.py \
  "/home/sweet/樂譜/開源格式/A Time For Us.musicxml" data/trials/musicxml \
  --song-id a-time-for-us-musicxml-trial --tempo 80 --transpose 0
```

預覽只含這一首，不改正式曲庫。5001、5004、5005 已有服務，這次用 5006：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
songs = app.load_songs()
song_id = 'a-time-for-us-musicxml-trial'
app._songs = {song_id: songs[song_id]}
app.app.run(host='127.0.0.1', port=5006, debug=False)
PY
```

預覽：http://127.0.0.1:5006 。改 JSON 後要重啟這個行程。

## 已知限制與交接

- 音高是依 PDF 沒有 For Eb Sax 所做的實音判斷，尚未由逐音或演奏確認。
- 小調練習和弦是依旋律重音設計的，不是原曲和聲。
- 畫面調名是 F 大調，唱名的 Do 也跟著 `keyConcert`，不是 D。
- 寫定音域 MIDI 74–91，高音超出常用練習音域。
- 未做播放、音訊測量、手機版面、標記開關、單元測試、全曲逐音與真人聆聽。
- 下一步若要加入正式曲庫，需另一次明確授權。不要用 -9 重轉這一首，除非新的 PDF 證據寫明 For Eb Sax。
