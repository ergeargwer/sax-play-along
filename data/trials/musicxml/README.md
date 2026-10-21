# MusicXML 四首試轉

來源：`/home/sweet/樂譜/開源格式/`。產生日期：2026-10-21。

這些是試轉曲目，不會由正式曲目掃描自動載入。所有檔案暫以來源為中音薩克斯風寫定音高（轉實際音高 -9 半音）、80 BPM 處理。來源沒有速度、移調或和弦資訊；Amazing Grace、鑼聲若響沒有調號，暫以來源 C 調解讀，故輸出實際調性 Eb。以上假設尚待對照原譜確認。

| 曲目 | 小節 | 事件數（含休止） | 暫定實際調性 | 寫定 MIDI 音域 |
|---|---:|---:|---|---|
| Amazing Grace | 32 | 78 | Eb | 67–79 |
| 台北今夜冷清清 | 21 | 101 | Db | 62–82 |
| 淡水暮色 | 16 | 71 | Bb | 62–81 |
| 鑼聲若響 | 12 | 64 | Eb | 64–84 |

四首皆通過現有 validate_song、逐音連續性、總時值及中音薩克斯風寫定 MIDI 58–89 音域檢查。台北今夜冷清清與鑼聲若響各有 4 個音超出建議練習音域 60–81，保留來源音高。尚未對照 PDF 校對或在瀏覽器聆聽。只提供旋律導奏與節拍器；沒有推定和弦或貝斯。

每個旋律事件的 `notation` 保留來源音符類型、附點數、符幹方向、連桿及寫定音名拼法，供譜面繪製使用；播放仍使用 midi/start/dur。英文標示只顯示 G、F#、Bb 等音名，不顯示八度數字。連桿依來源第一層分組，次層連桿由 VexFlow 排版，無法保證每個 hook、間距或換行均與原譜一致。寫定音高與來源拼法相符時才採用來源拼法。全曲排版依視窗寬度調整，不複製原譜頁面。

已以本機 Chromium 實際繪製四首：314 個音符／休止符，沒有小節繪製錯誤，連桿已產生，未出現帶八度數字的英文音名。此檢查未涵蓋與原 PDF 的逐項視覺比對或播放聆聽。

從專案根目錄重建：

```bash
python3 tools/trial_musicxml.py /home/sweet/樂譜/開源格式 data/trials/musicxml --tempo 80 --transpose -9
```

在獨立連接埠預覽這四首（不修改正式曲目）：

```bash
.venv/bin/python - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5001)
PY
```

開啟 http://127.0.0.1:5001 。Amazing Grace 使用獨立 id，不會覆寫內建版本。確認音高基準與速度後，才將選定 JSON 複製至 `data/songs/`。
