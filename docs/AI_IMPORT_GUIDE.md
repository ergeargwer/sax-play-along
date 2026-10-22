# AI 樂譜匯入規範與交接指南

版本：1.0，2026-10-22。適用專案：`sax-play-along`。

本文件供 Codex、Claude、Gemini、ChatGPT 或其他 AI 在沒有先前聊天紀錄時接續匯入。程式若已更新，以當前實作與測試為準，並同步修訂本文件。這是專案格式與操作規範，不是特定 AI 的 skill，也不要求使用特定服務或修改全域 AI 設定。

## 1. 先讀什麼、交付什麼

接手時依序閱讀：

1. [主 README](../README.md) 與 [開發進度](DEVELOPMENT_PROGRESS.md)。
2. 本文件、[可解析的歌曲 JSON 範例](examples/song-import-template.json)、[匯入報告範本](examples/import-report-template.md)。
3. 現有實作：`app.py`、`tools/trial_musicxml.py`、`tools/audit_musicxml.py`、`harmonizer.py`。
4. 譜面／音高與播放：`static/js/pitch.js`、`score.js`、`harmony.js`、`accompaniment.js`、`tracks.js`。
5. 有修正需求時參考 [炮仔聲案例](pao-a-sia-import-test.md)。

每次匯入的交付至少包含：歌曲 JSON、來源與假設紀錄、必要的修正清單、可重跑的指令、驗證結果及可開啟的預覽網址。範本放在 `docs/examples/`，不會被曲庫載入。

## 2. 不變的資料約定

- 歌曲 JSON 的 `melody[].midi`、音軌 `notes[].midi`、`keyConcert`、`chordSymbols` **一律使用實際音高（concert pitch）**。
- 網頁自行將旋律與和弦提高 9 半音顯示 Eb 中音薩克斯風寫定譜；不要先把播放資料提高 9 半音，否則會重複移調。
- `notation.writtenPitch` 是顯示用的寫定拼法，可以與實音 MIDI 不同；不可用它取代播放 MIDI。
- 本版可直接支援的時間模型為固定拍號、分母 4，`start`／`dur` 單位是四分音符拍數，從 0 起算。
- 保留來源檔。辨譜修正只施加於記憶體或獨立衍生檔，留下證據與原值檢查；不要直接改原 MusicXML／PDF。
- 既有和弦、貝斯或吉他內容有來源依據時優先保留，不可無聲覆寫成 AI 猜測。
- 依使用者本次任務決定輸出位置：僅「匯入測試」放試轉曲庫；若已要求正式加入，驗證後依要求處理，不必重複要求同一授權。

## 3. 路徑、命名與曲庫邊界

| 用途 | 路徑／規則 |
| --- | --- |
| 正式曲庫 | `data/songs/<id>.json` |
| 匯入測試 | `data/trials/musicxml/<id>.json` |
| PDF 校對修正 | `data/trials/corrections/<id>.json` |
| 報告 | `docs/<id>-import-test.md`；結構數據可另存 `.json` |
| 範本 | `docs/examples/`，不得當成正式歌曲安裝 |
| 原始來源 | 使用任務指定的絕對路徑，保持不變 |

`id` 採小寫英文字母、數字、連字號或底線；單檔 CLI 僅接受這些字元。建議 `<song-slug>-musicxml-trial`。同一曲的不同來源／版本使用不同 id，檔名為 `<id>.json`；標題仍可用中文。

載入器只掃描指定目錄第一層的 `*.json`，僅特別略過 `index.json`，不遞迴。**不要把修正清單、稽核報告或任意 JSON 放進歌曲目錄**，否則會被當成歌曲驗證。寫檔前檢查 id 與檔名是否已存在；更新既有檔案時先確認任務範圍並備份，轉換 CLI 本身不會自動備份。

## 4. 來源分析與目前支援範圍

先執行唯讀盤點，不能只因 XML 可以解析就宣稱能匯入：

```bash
.venv/bin/python tools/audit_musicxml.py "/ABS/PATH/source-directory" > /tmp/musicxml-audit.json
```

也可只分析單一檔案：

```bash
.venv/bin/python - <<'PY'
import json
from pathlib import Path
from tools.audit_musicxml import audit
print(json.dumps(audit(Path('/ABS/PATH/song.musicxml')), ensure_ascii=False, indent=2))
PY
```

| 項目 | 本版直接支援／處理方式 |
| --- | --- |
| 單一 `<part>`、聲部 1 | 支援；未標 voice 時試轉器按 1 處理 |
| 固定 2/4、3/4、4/4 等分母 4 拍號 | 支援，仍需檢查每小節總長 |
| 固定大調調號 | 支援；缺調號或 mode 不明須記錄假設 |
| 休止、附點、一般連桿、符幹 | 支援；檢查來源時值與 notation 是否相符 |
| 不足／超拍、真實弱起小節 | 轉換器拒絕；需要有來源依據的處理，不能任意補拍或裁音 |
| `backup`、`forward`、`chord`、`grace` | 轉換器拒絕 |
| `tie`、`time-modification` | 轉換器拒絕；不能刪掉標記假裝已支援 |
| `transpose`、`repeat`、`ending`、`harmony` | 轉換器拒絕；應另行擴充與驗證，或回報不支援 |
| 變拍、多聲部、轉調、小調 | 不屬於目前完整支援流程；不能硬轉成 C 大調或 4/4 |
| MIDI、MSCZ、PDF 直接匯入 | 沒有通用匯入器；PDF 可用於核對，MSCZ／MIDI 需先有經驗證的轉換流程 |

稽核工具列出結構，但不判定所有語意。**目前試轉器沒有讀取 `<mode>` 來識別小調，也沒有自動採用來源速度**，AI 必須另外檢查；不能因程式未報錯就認為來源是大調或速度已保留。

不支援的結構要列出具體小節與原因。若任務同時要求擴充匯入器，先建立有意義的回歸驗證，再宣稱支援；不要只輸出能通過最小驗證、卻丟失原譜語意的 JSON。

## 5. 音高與調性判定

| 來源基準 | 轉成此專案實音的半音數 | 證據要求 |
| --- | ---: | --- |
| 已是實音譜 | 0 | 樂器／檔案說明可確認 |
| Eb 中音薩克斯風寫定譜 | -9 | 例如 PDF 標示 For Eb Sax |
| 其他移調樂器或來源不明 | 不套用固定值 | 先分析樂器、八度與移調資訊，必要時記錄暫定假設 |

不能只見三個升記號就推論是 Eb 薩克斯風譜；調號、樂器基準與大小調是不同問題。原有四首試轉的 -9 假設不能自動套用所有新檔案。來源已有 `<transpose>` 時也不能再疊加 -9；目前簡易轉換器會拒絕此結構。

本版大調計算：`sourceTonicPc = (7 * fifths) mod 12`，`concertTonicPc = (sourceTonicPc + transpose) mod 12`。這個公式**不能區分同調號的大小調**。例如炮仔聲 PDF 為 Eb Sax、寫定 A 調，A 的音高類別 9 減 9 得到實音 C；網頁寫定譜再回到 A。

目前前後端共同可用的 `keyConcert` 大調名稱：

`C, C#, Db, D, Eb, E, F, F#, Gb, G, Ab, A, Bb, B, Cb`

不要自行填 `A minor`、`Am`、`C major` 或前端未支援的調名。若來源是小調，應回報功能差距，不要假標 major 來強行配和弦。

## 6. song JSON 頂層格式

使用 UTF-8、合法 JSON：不能有註解、尾逗號、NaN、Infinity；數字不能用字串或布林值代替。範例見 [song-import-template.json](examples/song-import-template.json)。

| 欄位 | 必要 | 型別與約定 |
| --- | --- | --- |
| `id` | 是 | 唯一、非空字串，命名依第 3 節 |
| `title` | 是 | 非空字串，試轉建議加「（MusicXML 試轉）」 |
| `composer` | 是 | 字串；未知填空字串，不編造作者 |
| `license` | 是 | 有來源依據的字串；使用者檔案試轉通常為 `user-imported` |
| `keyConcert` | 是 | 實音大調名稱，使用第 5 節列出的值 |
| `timeSignature` | 是 | `[分子, 4]`，正整數；本版時間模型限分母 4 |
| `tempo` | 是 | 有限正數，四分音符 BPM；來源沒有時可暫設 80 並註明 |
| `measures` | 是 | 正整數，不含預備拍 |
| `melody` | 是 | 單旋律事件陣列，含明確休止與來源順序 |
| `tracks` | 是 | 音軌陣列，id 不重複，基本至少 melody-guide 與 metronome |
| `chordSymbols` | 否 | 和弦代號事件；沒有來源可省略，再交既有分析器補齊 |
| `mode` | 否 | 本流程僅支援 `major`；缺省時分析器按 major，不能藉此隱瞞不明調性 |
| `importInfo` | 否 | 來源、音高／速度依據、假設與修正；為文件化的擴充 metadata，不是 app 強制欄位 |

本文件的匯入要求比現有 `validate_song()` 更嚴謹；例如它尚未完整檢查 id／調名與音軌拍位。**驗證通過不代表已滿足全部規範**。

## 7. 旋律事件與拍位

```json
{"midi": 60, "start": 0, "dur": 1}
```

- `midi`：單一整數；0 表休止，發聲音為實音 MIDI 21–108。旋律不可放 MIDI 陣列。
- `start`：有限非負數，四分音符拍位；第 1 小節起點是 0，第 2 小節起點是拍號分子。
- `dur`：有限正數，同樣以四分音符為單位。事件結束為 `start + dur`。
- 依 start 排序，非休止音不可重疊；本匯入流程也要求休止／音符形成連續旋律，不留無紀錄的空洞。
- `totalBeats = measures * timeSignature[0]`；所有事件不能超出總長，來源完整小節各自的時值總和應等於拍號分子。
- 事件窗口採 `[start, end)`，不要在相鄰小節重複計入邊界音。
- MusicXML 的 `duration / divisions` 就是四分音符拍數；先用 Fraction 計算，再在輸出小數時保留合理精度（現工具為 6 位小數）。
- 範例時值：quarter=1、eighth=0.5、16th=0.25、附點 quarter=1.5、附點 half=3。不要把 MusicXML duration 原始整數直接當拍數。
- 6/8 在四分音符單位是每小節 3 拍，但現程式以拍號分子算邊界，**不能直接填 `[6,8]` 後宣稱支援**。
- 跨小節長音／延音線、三連音、真實弱起需要完整的記譜與時間邊界支援；不要僅切音、刪 tie、改成一般八分音符或縮放整小節。

實音 MIDI 合法不代表薩克斯風音域合適。報告同時列實音與寫定音域；寫定 60–81 為本專案建議練習區間、58–89 為先前使用的較寬檢查區間，均不是自動移八度的理由。極高實音加 9 後也可能超出目前音名函式的範圍，需另外驗證。

## 8. notation：顯示資料與播放分開

```json
{
  "midi": 60,
  "start": 0,
  "dur": 1,
  "notation": {
    "type": "quarter",
    "dots": 0,
    "stem": "up",
    "beams": [],
    "writtenPitch": {"step": "A", "alter": 0, "octave": 4}
  }
}
```

這個例子播放實音 C4，譜面顯示 Eb 中音薩克斯風的 A4，兩者沒有矛盾。

| 欄位 | 約定 |
| --- | --- |
| `type` | `whole`, `half`, `quarter`, `eighth`, `16th`, `32nd`, `64th` |
| `dots` | 非負整數；必須與實際 `dur` 相符 |
| `stem` | 來源的 `up`／`down`；未知可為 null，不編造 |
| `beams` | 陣列，例如 `[{"number":1,"value":"begin"}]`；保留來源 begin/continue/end 等標記 |
| `writtenPitch` | 發聲音才有；step 為 A–G，alter 為整數升降、octave 為整數 |

檢查 `12*(octave+1) + natural(step) + alter == midi + 9` 後才能讓 writtenPitch 作為目前 Eb 譜的來源拼法。實音來源的原始拼法未必等於顯示用寫定拼法；不符時目前渲染器會回退到計算拼法，AI 必須解釋而不是改播放音高湊合。

首調唱名是網頁從調性與 MIDI 計算的顯示選項（Do/Re/Mi/Fa/Sol/La/Si 對應簡譜 1–7），不要在 JSON 另存或以唱名字串取代 midi。

休止符用 `midi:0`，不給 writtenPitch。不要把音高字母直接取代 MIDI、把畫面音名加進 JSON 的 midi，或把拍號、升降記號只寫在圖片上。

## 9. tracks、和弦與木吉他

| 保留 id | type | 功能／典型初始音量 |
| --- | --- | --- |
| `melody-guide` | `melody` | 共用頂層 melody，0.6 |
| `metronome` | `click` | 節拍，0.7；內部混音另有平衡 |
| `chords` | `notes` | 實音和弦音組，生成時 0.35 |
| `bass` | `notes` | 實音低音，生成時 0.4 |
| `guitar` | `notes` | 有來源的吉他可存；自動木吉他通常只在柔和編排時生成，0.25 |

每個音軌必填 `id, name, type, volume`。volume 是 0–1，不是百分比整數。`type:notes` 必須有 notes 陣列，例如：

```json
{
  "id":"chords", "name":"和弦", "type":"notes", "volume":0.35,
  "notes":[{"midi":[48,52,55],"start":0,"dur":3,"velocity":0.6}]
}
```

notes 的 midi 可為整數或非空整數陣列，均為實音 MIDI 21–108；音軌休止通常以不排事件表示，不用空陣列或假音高。每個音符需 start／dur，所有值有限且正確落在歌曲內；velocity 可選，建議 0–1 的力度值。單旋律與貝斯不得把音組字串 `"C,E,G"` 當 MIDI。

新匯入不要另寫合成器、增加外部音色 CDN，或把木吉他指型圖當作伴奏資料。沿用現有本機鋼琴／貝斯／吉他取樣。**不要為了「預留」而新增空 guitar 軌**：編排器視既有 guitar 為權威，連空軌都會保留，將抑制自動吉他生成。

播放固定使用柔和編排，沒有編排選單；會在播放時改排鋼琴／貝斯並加入吉他，來源 JSON 不變。不要把柔和播放事件重新寫回來源，造成下一次反覆改排。

和弦代號格式：

```json
{"symbol":"C", "root":0, "quality":"", "start":0, "dur":3, "source":"manual"}
```

- symbol 為非空實音和弦名稱；root 為 0–11 的音高類別，不是 MIDI 音高，例如 C=0、Eb=3。
- quality 支援 `""`（大三）、`m`、`7`、`maj7`、`m7`、`dim`、`aug`；標記與 root／quality 必須一致。
- source 建議記錄 `manual`、`existing-notes` 或 `automatic`，不要把推定偽裝成來源原有。
- 名稱可顯示不代表能完整實現該和弦。未知品質與 slash chord 的伴奏／低音不能只依字串猜成大三和弦。
- 優先序為既有代號 → 既有和弦音符辨識 → 沒有和聲的整小節依旋律推定；同小節已有和聲區間就不另加競爭配法。
- 自動候選 I、IV、V7、vi、ii，並非完整編曲／和聲分析；來源含 harmony 也不能由簡易 XML 匯入器直接處理，目前它會拒絕。

建議在 Python 使用 `harmonize_song(song)` 後再驗證與寫出；它回傳副本，重複處理應不產生重複資料。`load_songs()` 的補和聲只作用於記憶體。批次持久化工具 `tools/add_harmony.py` 預設預覽，`--write` 才備份後改檔。

## 10. OMR 修正清單與禁止的捷徑

先核對原 PDF／可信樂譜，明確列出「小節、音符、原值、新值、證據」。沒有證據時保留問題並回報，不能為通過驗證而任意改拍。

目前修正格式只支援既有 note 的 `duration`、`type`，不是通用修譜工具：

```json
[
  {
    "measure":"6",
    "note":5,
    "expected":{"duration":"4","type":"quarter"},
    "replacement":{"duration":"2","type":"eighth"},
    "reason":"本例來自炮仔聲 PDF：該音有八分音符旗；來源 divisions=4。不可直接套用別首歌曲。"
  }
]
```

measure 比對 XML `<measure number>` 字串；note 是該小節所有 `<note>` 的 **1 起算序號，包含休止符**，不是 MIDI pitch 或畫面全域索引。expected 和 replacement 必須有相同鍵，原值不符立即失敗。duration 是來源 MusicXML divisions 單位，不是專案拍數；修正 type 也要確認既有 dots、beam 等仍一致。需要改 dots、音高、缺音或小節結構時，應擴充有測試的修正流程，不能偽稱此格式已支援。

禁止整首乘比例湊拍、截斷尾音、隨意刪除休止／反覆／延音線、默默改成別的調、或直接覆寫來源檔。

## 11. 標準匯入操作

先確認工作目錄與既有改動，不要覆蓋其他人的工作：

```bash
cd /home/sweet/.gemini/antigravity/scratch/sax-play-along
git status --short
```

對已確認為 Eb Sax 寫定音高、未標速度且可直接支援的來源：

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/ABS/PATH/song.musicxml" data/trials/musicxml \
  --song-id new-song-musicxml-trial --tempo 80 --transpose -9
```

實音來源使用 `--transpose 0`。有依據的修正另外加：

```bash
.venv/bin/python tools/trial_musicxml.py \
  "/ABS/PATH/song.musicxml" data/trials/musicxml \
  --song-id new-song-musicxml-trial --tempo 80 --transpose -9 \
  --corrections data/trials/corrections/new-song.json
```

`/ABS/PATH/...`、new-song 與移調／速度是要替換的參數，不是能照抄到每首歌曲的預設答案。目錄模式只重建工具內 FILES 列出的原四首，**不會自動匯入資料夾全部 MusicXML**；新歌使用單檔模式，不必修改該固定清單。

## 12. 必做驗證與「完成」定義

### 資料驗證

依序檢查：

1. JSON 格式、必要欄位、唯一 id、有限數值、調名、分母 4。
2. 調用 `validate_song`，錯誤清單須為空；另查音軌 notes 範圍，因目前驗證器尚未完整涵蓋它。
3. 非休止旋律不重疊、事件依序連續，完整小節各自恰為正確拍數；總長不超過 measures × 拍號分子。對人工 JSON 不可只把 measures 填大掩蓋超拍。
4. notation 的時值／附點與 dur 相符、writtenPitch 與實音 +9 相符，或記錄為何回退拼法。
5. 原始檔 SHA256 前後相同；只有有證據的修正，匯出註明原值與原因。
6. 對 harmonize_song 重複執行，結果應一致；不新增重複音軌／和弦，來源伴奏未被覆寫。

最小格式驗證（替換路徑）：

```bash
.venv/bin/python - <<'PY'
import json
from pathlib import Path
from app import validate_song
from harmonizer import harmonize_song
path = Path('data/trials/musicxml/new-song-musicxml-trial.json')
song = json.loads(path.read_text(encoding='utf-8'))
errors = validate_song(song, path.name)
assert not errors, errors
enriched = harmonize_song(song)
assert not validate_song(enriched, path.name)
assert harmonize_song(enriched) == enriched
print('基本格式與和聲重複處理檢查通過；仍需時值、譜面與播放驗證')
PY
```

若實作匯入程式或播放邏輯變更，執行相關回歸測試：

```bash
.venv/bin/python -m unittest test_musicxml_import test_harmonizer test_phase1
npm test
git diff --check
```

本文件建立時為 72 項 Python 測試與六個前端測試檔；接手時以實際執行結果為準，不能照抄歷史數字當成本次驗證。

### 預覽與音訊驗證

- 用新連接埠或新曲庫進行測試，不要為了匯入任意停止使用者正在使用的服務。原有工作階段使用正式曲庫 5001、炮仔聲單曲 5002，先檢查可用連接埠。
- API 清單／單曲正確，桌面與手機譜面事件數合理、沒有繪製錯誤；四種標記開關、縮放與換曲正常。
- 開頭、修正小節、曲尾均核對；音符連桿、附點、升降記號不應只因「SVG 有畫出來」就算正確。
- 實際測試取樣載入、預備拍、播放／暫停／停止、小節循環、音軌 Mute/Solo 與音量。吉他應作背景，不需要指型圖或 Capo。
- 音訊可用 OfflineAudioContext 測量 peak、RMS、是否為有限值／是否削波；清楚註明是全曲或特定秒數、是否含導奏／節拍器、使用的音量。
- 瀏覽器驗證工具依當前環境決定，不要假設 `/tmp` 的上一輪測試腳本仍存在；Node／Python 單元測試也不能替代瀏覽器真正播放。
- 技術音訊檢查與真人聆聽、PDF 逐音校對、專業和聲評分分開記錄；未做的項目明列未做。

若缺工具或遇到不支援結構，仍交付已完成的盤點、阻礙、可重跑指令與待驗證項目，不能把未驗證的匯入標成全部完成。

## 13. 單曲預覽啟動範例

先替換 id 並選擇空閒連接埠；5004 僅為範例，不保證空閒。啟動前須已通過資料驗證：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
songs = app.load_songs()
song_id = 'new-song-musicxml-trial'
app._songs = {song_id: songs[song_id]}
app.app.run(host='127.0.0.1', port=5004, debug=False)
PY
```

這只修改該行程的曲庫，不會把試轉歌加入正式曲庫。歌曲啟動時載入記憶體，改 JSON 後需要重啟該預覽。純靜態檔更新可重新整理；模板是否更新取決於伺服器的模板快取設定。

## 14. 可直接交給任意 AI 的任務提示

```text
請在 sax-play-along 專案協助匯入以下歌曲。

專案路徑：/home/sweet/.gemini/antigravity/scratch/sax-play-along
先閱讀：README.md、docs/DEVELOPMENT_PROGRESS.md、docs/AI_IMPORT_GUIDE.md
來源 MusicXML：<絕對路徑>
核對 PDF（若有）：<絕對路徑或無>
指定 song id：<唯一 id>
任務範圍：<僅試轉／正式加入／另含匯入器擴充>
已知音高基準：<Eb Sax 寫定／實音／不明，請分析>
已知速度：<來源標記或未標；若暫用練習速度請註明>
預覽：<沿用已授權服務或新空閒連接埠>

請先唯讀分析，不要假設所有來源都要 -9 半音。
輸出沿用現有 song JSON 格式，播放為實音、顯示由網頁移調。
保留原檔與既有改動；修正須有依據、expected 原值檢查與紀錄。
不支援的弱起／延音線／反覆／來源 harmony 等請明確回報，勿刪標記硬轉。
沿用現有和弦與鋼琴／貝斯／木吉他背景伴奏，不另寫合成器。
完成資料與實際預覽驗證，明列做過／未做過的檢查，提供可重跑指令。
最後更新本曲匯入報告及相關 README／開發歷程，不自行推送或部署。
```

## 15. AI 完成回覆與交接最小清單

- 來源檔／SHA256、輸出檔與唯一 id。
- 寫定／實音調性、移調半音數與證據、速度與假設。
- 拍號、小節數、旋律事件／休止數、實音／寫定音域、和弦代號數。
- 每處修正的原值、新值、PDF 證據與修正清單位置；原始檔是否保持不變。
- 資料驗證、回歸測試、瀏覽器／手機、實際播放／音訊檢查的實際結果。
- 預覽網址與啟動／重建指令；正式或試轉曲庫是否有更動。
- 已知限制與未完成事項，尤其是尚未逐音校對／真人聆聽／和聲校對。

對使用者的最終回覆可簡短，完整證據寫入曲目報告。不要把「單元測試通過」「聽起來自然」「忠於原 PDF」當成同一種完成狀態。
