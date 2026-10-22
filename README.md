# 中音薩克斯風演奏練習與多音軌伴奏系統

`sax-play-along` 是本機運行的 Eb 中音薩克斯風練習網站，提供五線譜、音名／簡譜／和弦顯示、可調速度、小節循環，以及鋼琴、貝斯與木吉他伴奏。

接續開發請先閱讀 [開發進度與歷程](docs/DEVELOPMENT_PROGRESS.md)。委託任何 AI 匯入新歌，請使用 [AI 匯入規範與任務範本](docs/AI_IMPORT_GUIDE.md)，並參考 [歌曲 JSON 範例](docs/examples/song-import-template.json)。

## 目前功能

- **Eb 移調**：歌曲以實際音高儲存與播放，譜面提高 9 半音顯示中音薩克斯風寫定音高，和弦代號同樣移調。
- **四種獨立標記開關**：英文音名（G、F#、Bb，不帶八度數字）、數字簡譜、首調唱名（Do Re Mi Fa Sol La Si）、和弦名稱。唱名預設關閉，主音為 Do，與簡譜音級一致；升降及高低八度沿用簡譜記號。換曲與視窗縮放沿用本次頁面的勾選狀態。
- **譜面與跟譜**：VexFlow SVG 五線譜、播放游標與音符高亮；MusicXML 試轉保留來源時值、附點、符幹、連桿及音名拼法。
- **練習控制**：一小節預備拍、播放／暫停／停止、50%–120% 速度調整、小節範圍循環。
- **自動和弦**：依現有和弦音符辨識名稱；沒有和聲的小節依旋律產生大調配和弦與伴奏。保留既有和弦／貝斯資料。
- **離線樂器取樣**：鋼琴、原聲貝斯、尼龍弦木吉他共 70 份取樣，約 4.6 MB，隨專案提供，播放不需連外。
- **柔和伴奏**：3/4 低音加輕和弦，4/4 慢歌採分解和弦；木吉他在拍點之間輕撥，預設音量 25%。《柯南》保留原有鋼琴／貝斯節奏，吉他採較疏點綴。
- **獨立音軌控制**：旋律導奏、和弦鋼琴、貝斯、節拍器，以及柔和編排產生的木吉他，均可調音量、靜音與獨奏。播放固定使用柔和伴奏，沒有編排選單。
- **前後試聽比較**：《奇異恩典》練習頁有約 21 秒的純伴奏比較，已做響度對齊；新版包含鋼琴、貝斯及木吉他。

功能細節見 [自動和弦](docs/auto-harmony.md)、[樂器取樣與伴奏](docs/sampled-accompaniment.md)。

## 曲庫與預覽

| 曲庫 | 曲目 | 資料位置 |
| --- | --- | --- |
| 正式曲庫（4 首） | 歡樂頌、奇異恩典、友誼萬歲、名偵探柯南主題曲 | `data/songs/` |
| MusicXML 試轉（5 首） | Amazing Grace、台北今夜冷清清、淡水暮色、鑼聲若響、炮仔聲 | `data/trials/musicxml/` |

本次工作階段使用的網址：

- 正式曲庫：[http://127.0.0.1:5001](http://127.0.0.1:5001)
- 《炮仔聲》獨立測試：[http://127.0.0.1:5002](http://127.0.0.1:5002)

這些是本機開發行程；關閉工作階段或重新開機後需重新啟動。頁面未更新時按 **Ctrl+Shift+R**。試轉歌曲維持獨立，不自動加入正式曲庫。

《炮仔聲》為 37 小節、4/4、174 個音符／休止事件。依 PDF 的「For Eb Sax」採寫定 A 大調轉實音 C 大調，練習速度暫設 80 BPM。對照 PDF 修正兩處節奏辨識錯誤，僅套用於試轉資料，原始 MusicXML 不變。[完整匯入測試報告](docs/pao-a-sia-import-test.md)

## 安裝與啟動

需求：Python 3.11+、Node.js 18+（執行前端測試時使用）、支援 Web Audio 的瀏覽器。

```bash
cd /home/sweet/.gemini/antigravity/scratch/sax-play-along
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

若本機已有 `.venv`，可直接使用。啟動正式曲庫的預設入口：

```bash
.venv/bin/python app.py
```

預設網址為 http://127.0.0.1:5000 。此入口是開發模式；要使用本次的 5001 連接埠、僅監聽本機且關閉 debug，可執行：

```bash
.venv/bin/python -u - <<'PY'
import app
app.app.config['TEMPLATES_AUTO_RELOAD'] = True
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5001, debug=False)
PY
```

《炮仔聲》單曲預覽：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
songs = app.load_songs()
song_id = 'pao-a-sia-musicxml-trial'
app._songs = {song_id: songs[song_id]}
app.app.run(host='127.0.0.1', port=5002, debug=False)
PY
```

五首試轉曲庫的共同預覽與重建方式見 [試轉曲庫 README](data/trials/musicxml/README.md)。歌曲在啟動時載入記憶體；更改 JSON 後需重啟對應服務。

## 匯入與自動和弦工具

目前透過命令列試轉單聲部 MusicXML，或將符合格式的 song JSON 放入曲庫。尚無瀏覽器上傳、通用 MIDI／MSCZ 匯入。

重新產生《炮仔聲》試轉檔：

```bash
.venv/bin/python tools/trial_musicxml.py \
  /home/sweet/樂譜/開源格式/炮仔聲.musicxml data/trials/musicxml \
  --song-id pao-a-sia-musicxml-trial --tempo 80 --transpose -9 \
  --corrections data/trials/corrections/pao-a-sia.json
```

修正項目會檢查預期原值；不符就拒絕套用。沒有提供修正時，此來源會因第 6 小節超拍而拒絕轉入。

回填既有歌曲的和弦代號／缺少的和聲：

```bash
# 僅預覽
.venv/bin/python tools/add_harmony.py
# 備份後寫入正式與試轉目錄
.venv/bin/python tools/add_harmony.py --write
```

修改前的檔案備份於 `.backups/harmony-時間/`，由 manifest 記錄對應；重複處理不新增重複資料。網站載入時也會補和弦，但僅更動記憶體。

## 測試與已知限制

```bash
# 全部前端回歸測試（七個測試檔）
npm test

# 後端、和弦與單檔匯入（目前 72 項測試）
.venv/bin/python -m unittest test_musicxml_import test_harmonizer test_phase1
```

已用 Chromium 驗證譜面、標記開關、取樣播放、音軌控制、手機版面及試聽播放器互斥。《炮仔聲》174 個譜面事件與 37 個和弦代號正常，整曲約 111.7 秒的含導奏音訊輸出峰值約 0.49，未削波。檢查範圍與數據詳見各功能報告。

目前限制：

- 自動和弦以大調、固定四分音符拍號與局部旋律評分為主，尚不分析小調、轉調與完整終止式；配法屬練習建議。
- 簡易 MusicXML 匯入器要求單樂器／聲部 1、固定拍號與完整小節，尚不支援來源 harmony、反覆、延音線、三連音及多聲部等結構。
- 原有四首試轉的音高基準／缺少調號假設尚未全部核對；《炮仔聲》確認了 Eb 譜基準與兩處節奏修正，仍未整首逐音校對。
- 部分密集小節同時顯示英文音名與簡譜時偏擠，可先關閉其中一項。排版未完全複製 PDF 的間距、換行與細節。
- 技術播放／音訊檢查不等於真人聆聽評分或專業和聲校對。

## 專案結構

```text
app.py                         Flask API、驗證與曲庫載入
harmonizer.py                  自動和弦、既有和聲辨識與補齊
data/songs/                    四首正式歌曲
data/trials/musicxml/          五首試轉歌曲與說明
data/trials/corrections/       有原值檢查的 PDF 校對修正清單
static/js/score.js             樂譜、標記開關與跟譜
static/js/pitch.js             Eb 移調、音名與簡譜
static/js/harmony.js           和弦代號移調與小節顯示
static/js/accompaniment.js     播放時的鋼琴／貝斯／吉他編排
static/js/instruments.js       本機取樣載入與選擇
static/js/tracks.js            樂器發聲、混音與音軌控制
static/js/scheduler*.js        播放排程與拍位計算
static/audio/instruments/      70 份取樣、manifest 與 MIT 授權
static/audio/previews/         奇異恩典前後比較音檔
static/vendor/                 本機 VexFlow 與音樂字型
templates/index.html           主介面
tools/trial_musicxml.py        批次／單檔試轉及明確修正
tools/add_harmony.py           具備份的和弦回填
tools/build_instrument_samples.py  離線重建樂器取樣
tools/audit_musicxml.py        唯讀 MusicXML 結構評估
docs/                         開發歷程、功能說明與匯入報告
test_*.test.mjs / test_*.py    前後端測試
```

技術：Flask、原生 JavaScript ES Modules、VexFlow 5、Web Audio（取樣播放、短殘響、動態壓縮與 Lookahead 排程）。正常播放不需 FluidSynth；僅重建取樣時需要 libfluidsynth 與 ffmpeg。

## 專案清理與維護

功能與曲目測試完成後，已清除專案 Python 快取及不再需要的工具占位檔；舊和弦回填備份已壓縮封存至 `~/.local/state/sax-play-along/archives/`，實際檔名見開發歷程。程式、九首曲目、取樣與頁面使用的試聽音檔、匯入工具、文件、回歸測試及 `.venv` 均保留。

`.gitignore` 會排除未來重新產生的快取與 `.backups/`。不要因檔案尚未提交而清除它；`git status` 中的新功能檔案仍是必要的專案內容。

## 音色與曲目來源

FluidR3 衍生樂器取樣採 MIT，完整作者／貢獻者及授權文字見 [音色授權](static/audio/instruments/LICENSE.txt)。各曲目的來源與授權以 JSON 的 `license` 欄位及匯入紀錄為準，`user-imported` 試轉曲目不視為公有領域作品。
