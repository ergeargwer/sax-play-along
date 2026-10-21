# 開發進度與接續指南

更新：2026-10-21 17:42（Asia/Taipei）。專案：`/home/sweet/.gemini/antigravity/scratch/sax-play-along`。

## 目前狀態

已完成播放修正、37 份 MusicXML 結構評估、四首離線試轉，以及接近原譜的音符繪製與英文音名簡化。四首保存在 `data/trials/musicxml/`，尚未加入正式 `data/songs/`。本次存檔建立本機 Git 開發檢查點，不推送遠端。

最近啟動的預覽網址：http://127.0.0.1:5001 。這是開發行程，工作階段或機器結束後需重新啟動；重新載入樣式請按 Ctrl+Shift+R。

## 已完成與開發歷程

### 1. 播放與換曲修正

- 修正循環提前兩拍跳回，依音訊時間預排下一輪首音。
- 暫停、停止時取消已建立的發聲節點。
- 修正預備拍結束首音可能漏播。
- 換曲時重設速度、循環狀態與控制項。
- 加入 `npm test` 與實際 Scheduler 回歸測試 `test_playback.test.mjs`，更新 README。

### 2. MusicXML 評估

使用者要求評估 `/home/sweet/樂譜/開源格式/*.musicxml` 擴充曲目。37 份皆可解析，分類為 24 份優先候選、5 份需額外處理、8 份先校對原譜。皆缺少速度與移調資訊，沒有來源 harmony。11 份小節長度不符，包含正常弱起及需校對的時值疑點。

- 工具：`tools/audit_musicxml.py`。
- 逐曲報告：`docs/musicxml-import-assessment.md`。
- 機器可讀結果：`docs/musicxml-audit.json`。

### 3. 四首試轉

使用者指定 Amazing Grace、台北今夜冷清清、淡水暮色、鑼聲若響。用 `tools/trial_musicxml.py` 轉為既有平面 song JSON；只含旋律導奏與節拍器，未推定和弦或貝斯。

| 曲目 | 小節 | 事件數（含休止） | 暫定實際調性 |
|---|---:|---:|---|
| Amazing Grace | 32 | 78 | Eb |
| 台北今夜冷清清 | 21 | 101 | Db |
| 淡水暮色 | 16 | 71 | Bb |
| 鑼聲若響 | 12 | 64 | Eb |

暫定來源為中音薩克斯風寫定音高，輸出減 9 半音；練習速度為 80 BPM。Amazing Grace、鑼聲若響缺少調號，暫以來源 C 調解讀。這些假設尚未由原譜確認。台北今夜冷清清、鑼聲若響各有 4 音超出建議寫定音域 60–81，但仍在 58–89 範圍內。

### 4. 譜面外觀與音名

使用者要求音符更接近原譜，且英文標示 G5 改為 G。

- 試轉事件新增 `notation`，保留音符類型、附點、符幹方向、連桿及寫定音名拼法；播放仍讀取 midi/start/dur。
- `static/js/score.js` 採用來源時值、附點、符幹方向，並以第一層連桿標記建立分組。次層連桿由 VexFlow 排版。
- 來源寫定音高相符時採用來源音名拼法。
- 英文標示採 `.name`，顯示 G、F#、Bb，保留數字簡譜開關。
- 不保證與原 PDF 的 hook、間距及換行完全一致；尚未處理通用三連音、跨小節延音線與變拍。

## 驗證紀錄

- `npm test`：前端四個測試檔通過。
- `.venv/bin/python test_phase1.py`：54 項後端測試通過。
- 四首通過現有 `validate_song`、時值連續性、總時值及寫定音域檢查。
- 四首試轉清單、單曲 API 與首頁成功回應。
- Chromium 實際繪製四首：314 個音符／休止符，沒有繪製錯誤，已產生連桿，沒有帶八度數字的英文音名。
- `node --check static/js/score.js`、Python 語法編譯及 `git diff --check` 通過。
- 尚未完成與來源 PDF 的逐音校對、逐項外觀比對或實際聆聽驗證。

## 重建及啟動

從專案根目錄執行：

```bash
python3 tools/trial_musicxml.py /home/sweet/樂譜/開源格式 data/trials/musicxml --tempo 80 --transpose -9
```

啟動四首預覽：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5001, debug=False)
PY
```

正式內建曲目仍以 `.venv/bin/python app.py` 啟動。修改試轉 JSON 後需重啟預覽，因為曲目存在記憶體中。

## 下一步

1. 由使用者確認四首的音高基準、調性與練習速度。
2. 對照來源 PDF 校對辨譜結果，並試聽、檢查跟譜與符幹／連桿。
3. 確認後將選定曲目加入正式清單；保留獨立 id，避免覆寫內建 Amazing Grace。
4. 再擴充三連音、跨小節延音線、變拍、反覆順序及四重奏逐聲部移調。

目前沒有待執行的遠端推送或部署。
