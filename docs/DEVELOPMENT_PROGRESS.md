# 開發進度與接續指南

更新：2026-10-22（Asia/Taipei）。專案：`/home/sweet/.gemini/antigravity/scratch/sax-play-along`。

## 目前狀態

正式曲庫有 4 首，MusicXML 試轉曲庫有 5 首，兩者分開儲存。已完成自動和弦、離線鋼琴／貝斯／木吉他伴奏、四種標記開關，以及《炮仔聲》單檔試轉與兩處有 PDF 依據的節奏修正。

| 預覽 | 本次使用網址 | 載入資料 |
| --- | --- | --- |
| 正式曲庫 | http://127.0.0.1:5001 | `data/songs/` 四首 |
| 炮仔聲單曲測試 | http://127.0.0.1:5002 | 從試轉曲庫篩選 `pao-a-sia-musicxml-trial` |
| 五首試轉共同預覽（另行啟動） | http://127.0.0.1:5003 | `data/trials/musicxml/` 全部五首 |

以上是本機開發行程，工作階段或機器結束後需重啟；程式預設入口 `app.py` 使用 5000，與本次啟動的 5001 不同。更新頁面請按 Ctrl+Shift+R；修改歌曲 JSON 後需重啟對應服務。

本輪功能開發的起始 Git 檢查點為 `50124fe`。此文件記錄功能與測試狀態；目前提交及遠端同步狀態請以 `git log`、`git status` 為準。下方歷程保留當時的曲目與測試數量，以「目前狀態」及「最新驗證」為準。

## AI 匯入格式與交接文件

新增 [AI 匯入規範](AI_IMPORT_GUIDE.md)，供不同 AI 不依賴聊天紀錄接手。涵蓋實音／寫定音高、拍位、song JSON、notation、音軌與和弦格式、來源限制、具原值檢查的修正、驗證、預覽與交接，並附可直接複製的 AI 任務提示。

- [歌曲 JSON 範例](examples/song-import-template.json)：兩小節 C／F 實音和聲，附 Eb 薩克斯風寫定拼法；放在文件目錄，不自動載入曲庫。
- [匯入報告範本](examples/import-report-template.md)：來源與雜湊、假設、修正、實測結果、重建指令及未驗證事項；所有測試預設標示未執行。
- 本次僅增加文件與範例，不擴充匯入器支援範圍。已驗證文件連結、JSON／指令語法、範例的 validate_song、實音／寫定拼法、和聲重複處理及鋼琴／貝斯／吉他編排。

## 測試完成後的專案清理

- 清除專案根目錄與 tools 的 7 個 Python 快取，以及已非空工具目錄中的 `tools/.gitkeep`。
- 原和弦回填備份的 9 個檔案已壓縮並移出專案：`/home/sweet/.local/state/sax-play-along/archives/harmony-20261022-090552-446136-cleanup-20261022-111044.tar.gz`。歸檔後逐檔比對 SHA256，再移除舊目錄；封存檔約 6.3 KiB。
- 共從專案移除 17 個檔案、約 251 KiB 檔案內容；資料備份仍可從專案外的封存還原。
- 清理前後比對 131 個保留檔案的 SHA256，程式、曲目、音色及原有文件內容均保持原樣；本節與相關備份位置說明另行更新。
- 保留正式四首與試轉五首、回歸測試、匯入工具、格式範本、頁面引用的試聽音檔，以及執行中的 `.venv`；未變更播放功能或曲庫範圍。

## 固定柔和伴奏

依最新需求移除「伴奏編排」選單、原始節奏模式與切換程式，播放固定使用柔和伴奏。鋼琴、貝斯、木吉他及其他音軌的音量／靜音／獨奏保留。下方歷程提到的編排切換為舊版功能。

## 首調唱名顯示

「標記顯示」新增獨立的「唱名 Do Re Mi（首調）」開關，預設關閉。Do/Re/Mi/Fa/Sol/La/Si 對應簡譜 1–7，與數字簡譜共用調性、變化音及八度點；休止顯示「休止」。切換不更動播放，換曲與縮放保留本頁設定。

## 開發歷程

### 初期：練習網站與播放功能

- 建立 Flask 曲目清單／單曲 API、JSON 驗證與四首正式曲庫：歡樂頌、奇異恩典、友誼萬歲、名偵探柯南主題曲。
- 建立 VexFlow SVG 譜面、Eb 寫定／實音移調、英文音名與數字簡譜。
- 實作 Lookahead 排程、一小節預備拍、變速、小節循環、跟譜及音軌 Mute/Solo／音量控制。

### 2026-10-21：播放回歸修正與 MusicXML 評估

- 修正循環提前兩拍跳回，依音訊時間預排下一輪首音。
- 暫停與停止會取消已建立的發聲節點；修正預備拍結束首音可能漏播。
- 換曲重設速度、循環與控制項；加入 `test_playback.test.mjs` 及 `npm test`。
- 唯讀評估 `/home/sweet/樂譜/開源格式/` 37 份 MusicXML：24 份優先候選、5 份需額外處理、8 份先校對；11 份小節時值不符，包含弱起與待校對問題。
- 工具及報告：[結構評估](musicxml-import-assessment.md)、[逐曲 JSON](musicxml-audit.json)、`tools/audit_musicxml.py`。

### 2026-10-21：原四首 MusicXML 試轉與譜面外觀

原四首輸出到 `data/trials/musicxml/`，起初只有旋律導奏與節拍器，當時尚未推定和弦／貝斯。

| 曲目 | 小節 | 事件數（含休止） | 暫定實音調性 | 寫定 MIDI 範圍 |
| --- | ---: | ---: | --- | --- |
| Amazing Grace | 32 | 78 | Eb | 67–79 |
| 台北今夜冷清清 | 21 | 101 | Db | 62–82 |
| 淡水暮色 | 16 | 71 | Bb | 62–81 |
| 鑼聲若響 | 12 | 64 | Eb | 64–84 |

- 暫以中音薩克斯風寫定音高解讀，轉實音減 9 半音，練習速度 80 BPM。Amazing Grace、鑼聲若響缺調號，暫按來源 C 調解讀；以上假設尚未全部由 PDF 確認。
- 台北今夜冷清清、鑼聲若響各有 4 音超出建議練習音域 60–81，但仍在寫定 58–89 範圍內。
- `notation` 保留來源時值、附點、符幹、連桿與寫定音名拼法；英文標示改為 G、F#、Bb，不帶八度數字。
- Chromium 繪製原四首共 314 事件，沒有小節繪製錯誤。當時前端四個測試檔、後端 54 項測試通過。
- 建立既有本機 Git 檢查點 `50124fe`；未推送遠端。

### 2026-10-22：自動和弦與回填

- 新增 `harmonizer.py`，於歌曲載入與 MusicXML 試轉時補和聲。
- 正式四首保留原有伴奏並辨識代號；原四首試轉新增和弦／貝斯；當時八首共 144 個和弦代號。
- 譜面代號配合 Eb 薩克斯風移調，伴奏播放實音；已有同小節多和弦則照常保留。
- 新增 `tools/add_harmony.py`：預設預覽，`--write` 才備份後回填，重複處理不新增資料。
- 原八首首次備份當時位於 `.backups/harmony-20261022-090552-446136/`，manifest 記錄對應；目前已封存至專案外，見上方清理紀錄。原始 MusicXML 未修改。
- 詳細規則與限制：[自動和弦說明](auto-harmony.md)。

### 2026-10-22：取樣鋼琴／貝斯及柔和編排

- 和弦、貝斯原先使用純正弦波；改以本機 FluidR3 GM 製成 34 份鋼琴與 10 份原聲貝斯取樣，導奏亦改為鋼琴。
- 加入 3/4 輕和弦、4/4 分解和弦、平順轉位、句尾收束、低比例殘響與動態壓縮。
- 提供柔和伴奏／原始節奏切換，僅改播放時音軌，不覆寫來源歌曲資料。
- 音量／Mute/Solo 即時作用；停止清除殘響，載入音色中取消或換曲不會突然播放。
- 奇異恩典加入約 21 秒、響度對齊的前後比較試聽；示範與練習播放互斥。

### 2026-10-22：和弦顯示開關與木吉他背景

- 新增「和弦名稱」勾選框，與英文音名、數字簡譜獨立控制。換曲與視窗縮放沿用本頁設定，不改伴奏。
- 新增 26 份尼龍弦木吉他取樣，完整音色包共 70 份、約 4.6 MB，附 FluidR3 MIT 授權。
- 柔和伴奏加入拍點間的輕撥與末小節輕刷，吉他預設音量 25%，可獨立調音量、靜音與獨奏。
- 原始編排不另產生吉他；切回柔和編排會恢復吉他混音偏好。來源已有 guitar 聲部則保留。
- 《柯南》保留原有鋼琴／貝斯節奏，另加較疏的吉他點綴。
- 詳細資料、重建方式及驗證：[取樣伴奏說明](sampled-accompaniment.md)。

### 2026-10-22：《炮仔聲》單檔匯入測試

- 來源 `/home/sweet/樂譜/開源格式/炮仔聲.musicxml`：37 小節、4/4、174 事件、37 個自動和弦代號。
- PDF 標示 For Eb Sax，確認寫定 A 大調減 9 半音為實音 C 大調；來源未標速度，練習速度暫設 80 BPM。
- 對照 PDF，確認第 6、7 小節第 5 音本為八分音符，MusicXML 誤辨為四分音符，造成各多半拍；只在試轉記憶體內修正，原檔不變。
- 修正清單位於 `data/trials/corrections/pao-a-sia.json`，包含預期原值及替換值，來源不符會拒絕套用。
- `trial_musicxml.py` 新增單檔 `--song-id` 與 `--corrections`，保留原四首批次模式。
- 保存於試轉曲庫，獨立預覽 5002；未加入正式曲庫。
- 詳見 [匯入報告](pao-a-sia-import-test.md) 與 [結構／輸出數據](pao-a-sia-import-test.json)。

## 最新驗證與已知限制

- `.venv/bin/python -m unittest test_musicxml_import test_harmonizer test_phase1`：72 項測試通過。
- `npm test`：七個前端測試檔通過，包含伴奏編排、音色快取／失敗重試、和弦移調、播放／循環與混音。
- 實際瀏覽器驗證取樣播放、三種標記開關、Mute/Solo／音量、暫停／繼續、停止、編排切換、比較試聽互斥與手機版面。
- 五首試轉共 488 個譜面事件、118 個和弦代號；連同正式四首共 181 個和弦代號。
- 木吉他更新後，原八首各前 10 秒（含導奏、未含節拍器）音訊峰值約 0.36–0.62，未削波。
- 炮仔聲 37 小節修正後均為 4 拍；桌面／手機顯示 174 事件、37 和弦，整曲含尾音約 111.7 秒，音訊峰值約 0.49、RMS 約 0.061，無削波或瀏覽器錯誤。
- 上述為預設音量的技術檢查，未涵蓋任意音量設定或真人聆聽評分；自動配和弦仍待專業校對。
- 原四首仍待核對音高基準、來源缺調號與速度；炮仔聲只確認 Eb 譜基準及兩處節奏修正，尚未全曲逐音核對。
- 匯入器限制單樂器／聲部 1、固定四分音符拍號與完整小節，不支援來源 harmony、多聲部、延音線、三連音、變拍及反覆等結構。
- 密集小節同時顯示音名／簡譜時偏擠；排版未完全重現 PDF 的間距、換行與 hook。可先關閉其中一種標記。

## 重建與啟動

以下指令從專案根目錄執行。正式曲庫 5001：

```bash
.venv/bin/python -u - <<'PY'
import app
app.app.config['TEMPLATES_AUTO_RELOAD'] = True
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5001, debug=False)
PY
```

原四首 MusicXML 重建（不處理或刪除新增的炮仔聲）：

```bash
.venv/bin/python tools/trial_musicxml.py /home/sweet/樂譜/開源格式 data/trials/musicxml --tempo 80 --transpose -9
```

炮仔聲單檔重建：

```bash
.venv/bin/python tools/trial_musicxml.py \
  /home/sweet/樂譜/開源格式/炮仔聲.musicxml data/trials/musicxml \
  --song-id pao-a-sia-musicxml-trial --tempo 80 --transpose -9 \
  --corrections data/trials/corrections/pao-a-sia.json
```

炮仔聲單曲預覽 5002：

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

五首試轉共同預覽 5003：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
app._songs = app.load_songs()
app.app.run(host='127.0.0.1', port=5003, debug=False)
PY
```

和弦回填工具 `tools/add_harmony.py` 預設只預覽，`--write` 才備份後寫入。木吉他為播放時生成，不寫回歌曲 JSON。

取樣重建工具 `tools/build_instrument_samples.py` 需要本機 FluidR3、libfluidsynth 及 ffmpeg，可加 `--instrument nylon-guitar` 僅重建吉他；正常網站播放無需這些工具。歌曲在啟動時載入記憶體，改 JSON 後需重啟相應服務。

## 下一步

1. 實際聆聽鋼琴／貝斯／木吉他比例，依歌曲風格微調；校對自動配和弦的樂句與終止式。
2. 完成五首與來源 PDF 的逐音核對，確認原四首的音高基準、調號與速度。
3. 改善密集小節的標記間距與每行小節數，保留三種標記開關。
4. 使用者確認後再將選定試轉歌曲加入正式曲庫，保留獨立 id，避免覆寫既有版本。
5. 依需求擴充延音線、三連音、變拍、反覆、多聲部及來源和弦解析；目前尚無瀏覽器上傳、通用 MIDI／MSCZ 匯入。

本輪已依使用者要求準備提交並同步至 GitHub；此次不包含部署。實際遠端同步結果以 Git 狀態及操作回覆為準。
