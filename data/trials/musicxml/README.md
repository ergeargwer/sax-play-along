# MusicXML 試轉曲庫

交由其他 AI 匯入新歌前，先閱讀 [AI 匯入格式規範](../../../docs/AI_IMPORT_GUIDE.md)，不要直接套用既有曲目的音高假設或修正清單。

目前有五首獨立試轉歌曲，來源目錄為 `/home/sweet/樂譜/開源格式/`。本目錄不會由正式 `data/songs/` 曲庫自動載入；原四首於 2026-10-21 試轉，2026-10-22 補和聲，另加入《炮仔聲》。

| 曲目 | 小節 | 事件數（含休止） | 實音調性 | 寫定 MIDI 音域 |
| --- | ---: | ---: | --- | --- |
| Amazing Grace | 32 | 78 | Eb（暫定） | 67–79 |
| 台北今夜冷清清 | 21 | 101 | Db（暫定） | 62–82 |
| 淡水暮色 | 16 | 71 | Bb（暫定） | 62–81 |
| 鑼聲若響 | 12 | 64 | Eb（暫定） | 64–84 |
| 炮仔聲 | 37 | 174 | C（依 PDF 的 Eb 譜基準） | 62–81 |

共 488 個事件、118 個和弦代號。五首練習速度均暫設 80 BPM；來源未標速度，可於網頁調整。

## 音高與節奏校對狀態

原四首暫以中音薩克斯風寫定音高解讀，轉實音減 9 半音；來源沒有移調與和弦資訊。Amazing Grace、鑼聲若響缺調號，暫按來源 C 調解讀，輸出實音 Eb。這些假設尚待對照原譜確認。台北今夜冷清清與鑼聲若響各有 4 音超出建議練習音域 60–81，仍保留來源音高。

《炮仔聲》PDF 明確標示 For Eb Sax，因此按寫定 A 大調轉實音 C 大調。第 6、7 小節末音原為八分音符，MusicXML 誤辨為四分音符，造成各多半拍。試轉時依 `../corrections/pao-a-sia.json` 修正，37 小節均恢復 4 拍；原始 XML／PDF 未改動。詳見 [本首匯入測試報告](../../../docs/pao-a-sia-import-test.md)。

## 譜面與背景伴奏

- `notation` 保留音符類型、附點、符幹、連桿與寫定音名拼法；播放使用 midi/start/dur。
- 英文音名只顯示 G、F#、Bb 等，不帶八度數字；英文音名、數字簡譜與和弦名稱均可獨立開關。
- 歌曲 JSON 含旋律導奏、節拍器與自動補齊的和弦／貝斯；柔和播放編排另加入木吉他，預設音量 25%。
- 伴奏採實音，譜面與和弦代號採 Eb 薩克斯風寫定調；配和弦屬練習建議，尚未校對原作和聲。
- 原四首已檢查 314 個譜面事件；炮仔聲另檢查 174 個事件、37 個和弦，及整曲約 111.7 秒音訊輸出。未完成五首逐音 PDF 校對或真人聆聽評分。
- 密集小節同時開啟英文音名／簡譜時可能擁擠；可先關閉其中一項。排版未完全複製 PDF 的間距、換行或細節。

另見 [自動和弦說明](../../../docs/auto-harmony.md) 與 [取樣伴奏說明](../../../docs/sampled-accompaniment.md)。

## 重建

從專案根目錄重建原四首：

```bash
.venv/bin/python tools/trial_musicxml.py /home/sweet/樂譜/開源格式 data/trials/musicxml --tempo 80 --transpose -9
```

這個批次指令只處理原四首，不會重建或刪除炮仔聲。炮仔聲需以單檔模式執行：

```bash
.venv/bin/python tools/trial_musicxml.py \
  /home/sweet/樂譜/開源格式/炮仔聲.musicxml data/trials/musicxml \
  --song-id pao-a-sia-musicxml-trial --tempo 80 --transpose -9 \
  --corrections data/trials/corrections/pao-a-sia.json
```

## 預覽

本次《炮仔聲》單曲預覽網址為 http://127.0.0.1:5002 ，啟動指令見 [本首報告](../../../docs/pao-a-sia-import-test.md)。正式曲庫使用 5001；不要用試轉服務占用同一連接埠。

若要共同預覽五首，可另於 5003 啟動：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5003, debug=False)
PY
```

開啟 http://127.0.0.1:5003 。工作階段或機器結束後需重啟；改 JSON 後也需重啟服務。確認來源、音高與速度後，才將選定 JSON 複製至正式曲庫；試轉 Amazing Grace 使用獨立 id，不會覆寫內建版本。
