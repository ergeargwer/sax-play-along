# 《炮仔聲》MusicXML 匯入測試

來源：`/home/sweet/樂譜/開源格式/炮仔聲.musicxml`，由 Audiveris / ProxyMusic 辨識產生。原 PDF：`/home/sweet/樂譜/炮仔聲.pdf`。

試轉檔：`data/trials/musicxml/pao-a-sia-musicxml-trial.json`。獨立預覽：http://127.0.0.1:5002 。原有正式曲庫預覽 http://127.0.0.1:5001 維持原狀；此次未將歌曲加入正式曲庫。

## 結構與音高

- 單一樂器、聲部 1，37 小節、4/4 拍；174 個事件（含休止符）。
- 來源調號為 3 個升記號，按 A 大調試轉。PDF 明確標示「For Eb Sax」，因此採中音薩克斯風寫定音高，轉實音減 9 半音，輸出 `keyConcert: C`；網頁寫定譜回到 A 大調。
- 寫定 MIDI 範圍 62–81，實音 53–72。
- 來源沒有速度，練習速度暫設 80 BPM，可在網頁調整。總長 148 拍，約 111 秒（不含預備拍／殘響）。
- 無反覆、延音線、三連音、轉調與原有和弦資訊；37 個和弦代號由現有大調啟發式產生，屬練習建議。
- 自動套用鋼琴、原聲貝斯與輕柔木吉他背景伴奏；保留原有音名、簡譜及和弦名稱開關。

## 對照 PDF 修正兩個節奏辨識錯誤

原始第 6、7 小節各為 4.5 拍。逐一對照 PDF 第一行末兩小節，兩小節第 5 個音均有八分音符旗：

| 小節 | 音符 | 原 MusicXML | 試轉時修正 | 修正後小節總長 |
| --- | --- | --- | --- | --- |
| 6 | 第 5 音 G#4 | 四分音符，duration 4 | 八分音符，duration 2 | 4 拍 |
| 7 | 第 5 音 A4 | 四分音符，duration 4 | 八分音符，duration 2 | 4 拍 |

來源 divisions 為 4，因此上述 duration 4／2 分別代表 1 拍／半拍。原始 MusicXML 與 PDF 都未修改；僅在試轉程式記憶體內套用修正，同時保留修正紀錄於輸出 JSON 的 `importInfo.noteCorrections`。

修正清單：`data/trials/corrections/pao-a-sia.json`。每個項目包含小節、音符序號、預期原值、替換值與 PDF 校對理由；原值不符就拒絕套用，避免未來來源檔更新時誤修。

此檢查確認了節奏超拍原因與音高基準，未代表已逐音完成整首 PDF 校對或專業和聲／聆聽評分。

## 重建

```bash
.venv/bin/python tools/trial_musicxml.py \
  /home/sweet/樂譜/開源格式/炮仔聲.musicxml data/trials/musicxml \
  --song-id pao-a-sia-musicxml-trial --tempo 80 --transpose -9 \
  --corrections data/trials/corrections/pao-a-sia.json
```

`trial_musicxml.py` 現支援單檔模式；原有整個目錄重建四首的指令仍可使用。未提供明確修正時，此來源仍會因第 6 小節超拍而拒絕，不會自動刪音或壓縮時值。

獨立啟動本首預覽：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
songs = app.load_songs()
app._songs = {'pao-a-sia-musicxml-trial': songs['pao-a-sia-musicxml-trial']}
app.app.run(host='127.0.0.1', port=5002, debug=False)
PY
```

來源結構、SHA256 與試轉統計見 [機器可讀報告](pao-a-sia-import-test.json)。

## 驗證

- 37 小節修正後均恰好 4 拍；174 個事件連續、不重疊，通過 `validate_song`。
- 新增單檔 CLI、明確修正、原檔不變、來源原值不符拒絕及非法輸出 id 測試。
- `python -m unittest test_musicxml_import test_harmonizer test_phase1`：72 項測試通過；`npm test` 六個前端測試檔通過。
- Chromium 桌面及 540px 手機版實際繪製 174 個事件與 37 個和弦代號，和弦顯示開關、播放／暫停與小節範圍控制正常，無繪製或瀏覽器錯誤。
- 整首約 111.7 秒（含尾音）的旋律導奏、鋼琴、貝斯與吉他離線輸出皆為有效數值，峰值約 0.49、RMS 約 0.061，未削波；此為技術驗證，未進行真人聆聽校對。
- 視覺檢查發現部分八分音符密集的小節同時顯示英文音名與簡譜時，標記間距偏擠；可先關閉其中一項。此版未調整既有每行小節數，也未宣稱排版與 PDF 完全一致。
