# 《妳怎麼捨得我難過》MusicXML 匯入測試

日期：2026-10-22。

**和弦補作更新**：現已保存 29 個人工設計的 A 小調練習和弦及鋼琴／貝斯，播放時生成木吉他。下方初次匯入表格與音訊數據保留為歷史紀錄；不代表補作後的音訊驗證。新版重建必須執行文末的伴奏指令。

2026-10-22 已依要求把這份試轉複製到正式曲庫 `data/songs/shede-wo-nanguo.json`（id `shede-wo-nanguo`，標題「妳怎麼捨得我難過」）。試轉檔保留，沒有推送。

試轉檔：`data/trials/musicxml/shede-wo-nanguo-musicxml-trial.json`。id：`shede-wo-nanguo-musicxml-trial`。獨立預覽：http://127.0.0.1:5004 。正式曲庫 5001 與《炮仔聲》5002 沒有停掉。

## 任務與產物

| 項目 | 結果 |
| --- | --- |
| 來源 MusicXML | `/home/sweet/樂譜/開源格式/你怎麼捨得我難過.musicxml` |
| 來源 PDF | `/home/sweet/樂譜/你怎麼捨得我難過.pdf`（掃描圖，一頁） |
| 來源 SHA256（匯入前／後） | `b15dde7abf9ce632a6352b04a3208844cfbf892ba86f4ec023c53ba2631e96e6`，前後相同 |
| PDF SHA256 | `9e3ecd2bc2bb51edc7ab1a027b9089fa41c8395e691a005f385b0fa919b81c8a` |
| 辨識軟體 | Audiveris 5.11.0、ProxyMusic 4.0.3 |
| 修正清單 | 無 |
| 結構數據 | [shede-wo-nanguo-import-test.json](shede-wo-nanguo-import-test.json) |
| 正式曲庫 | 未更動 |

## 來源結構與基準判定

PDF 是高音譜、4/4、沒有調號，標題為「妳怎麼捨得我難過」，右上只印 Ajax Hsieh。沒有 For Eb Sax、Alto Sax 或移調記號。MusicXML 的 part-name 是 Voice，instrument-name 是 OMR 預設的 Voice Oohs，沒有 `<transpose>`、速度、`<harmony>`、反覆、三連音或第二聲部。

因此這次暫按實音處理，`--transpose 0`。網頁仍把旋律加 9 個半音，畫成 Eb 中音薩克斯風寫定譜，所以畫面上的音比 PDF 高一個大六度，調號是 3 個升記號（寫定 A，和實音 A 自然小調移調後的 F# 小調共用調號）。`notation.writtenPitch` 留的是來源實音拼法，不等於播放 MIDI 加 9，渲染器改用計算拼法。沒有為了對上拼法而改播放音高。

來源沒有 `<key>` 或 `<mode>`。第 4、12 小節停在 E 全音符，第 17 小節與結尾停在 A，音高集合是 A 自然小調再加第 23 小節一個降 E。`keyConcert` 只能填大調名稱，所以用相對大調 `C` 代表 0 個升降號，並把 `mode` 設為 `minor`。畫面仍寫「C 大調」，那是介面固定加上「大調」，不是這次把曲子判成 C 大調。轉換器曾依 C 大調做出 25 個和弦與貝斯軌，寫檔前已刪除，沒有當成原譜和聲。

速度沒有標記，練習速度暫設 80 BPM。100 拍，不含預備拍約 75 秒。

第 23 小節最後有一個 `duration` 16 的 `<backup>`，後面沒有音符。以 divisions 4 計算，它只是把游標退回小節開頭，沒有第二聲部。PDF 同一行是單旋律，而且看得到那個降 E。試轉忽略這個空的 backup，沒有改原始檔。若 backup 後面還有音符，轉換器會拒絕。

48 個 `<tie>` 都是同音高、時間相接的 start／stop。輸出 21 條延音線（其中 3 個音同時是前一條的結束與下一條的開始）。播放把每一條合成一次發聲，最長 7.5 拍，發聲次數 142。

## 輸出統計

| 項目 | 結果 |
| --- | --- |
| 實音 keyConcert／模式 | C，mode `minor`；畫面寫定調號為 A（3 個升記號） |
| 拍號／tempo | 4/4，80 |
| 小節／總拍 | 25 小節，100 拍，每小節都是 4 拍 |
| 旋律事件／休止 | 172／6 |
| 實音 MIDI／寫定 MIDI | 64–77／73–86 |
| 寫定音域 | 56 個音高於建議區間 81，沒有音超出 58–89 |
| 和弦代號 | 0。沒有鋼琴、貝斯、木吉他軌 |
| 儲存音軌 | melody-guide 0.6、metronome 0.7 |

## 校對修正

無。沒有改音高、時值或附點。

對過掃描譜的範圍：第一行的節奏與延音、第 23 小節的降 E，以及最後一行到終止線的節奏。沒有做完全曲 166 個音的逐音校對。原始 MusicXML 與 PDF 都沒有改。

## 驗證結果

| 檢查 | 結果 |
| --- | --- |
| JSON／validate_song | 通過 |
| 小節總長、連續、重疊 | 25 小節都是 4 拍，事件連續、發聲音不重疊 |
| 音軌 notes | 沒有 notes 型音軌 |
| notation 時值／writtenPitch | 時值與附點相符；writtenPitch 等於實音 MIDI，因此不拿來當 Eb 寫定拼法 |
| harmonize_song | `mode=minor` 時拒絕，錯誤為需要 major。載入仍保留這首，記憶體裡沒有補出和弦 |
| 原始檔雜湊 | 匯入前後相同 |
| Python 測試 | `.venv/bin/python -m unittest test_musicxml_import test_harmonizer test_phase1`：76 項通過。新增同音高延音線保留、懸空延音線拒絕、空 backup 可忽略、backup 後還有音符則拒絕 |
| Node 測試 | `npm test`：31 項通過 |
| API | `GET /api/songs` 只有這首；單曲 172 事件、沒有 chordSymbols |
| 桌面／手機譜面 | Chromium。1280px：172 個音符、25 條延音線、7 行、每行 3 個升記號。540px：172 個音符、27 條延音線。沒有「繪製失敗」 |
| 標記開關 | 英文音名、簡譜、唱名、和弦名稱都切過，音符數維持 172。和弦標籤為 0 |
| 播放／暫停／停止 | 播放會先載入音色；暫停後可再播放；停止後播放鍵恢復。循環第 23–25 小節時看得到預備拍 |
| Mute／Solo／音量 | 旋律導奏可靜音並把音量調到 30%，節拍可獨奏 |
| 換曲 | 未做。這個預覽只載入一首 |
| 音訊 | OfflineAudioContext，44100 Hz、雙聲道、77 秒。只有旋律導奏，音量 0.6，不含節拍器、預備拍、鋼琴、貝斯、吉他。每 8 個樣本取一次：峰值約 0.244、RMS 約 0.035、沒有非有限值、未超過 1 |
| PDF 全曲逐音 | 未做 |
| 真人聆聽／和聲校對 | 未做。這首沒有配和弦 |

譜面第一次繪製時，延音線全部失敗：VexFlow 5 要 `firstNote`／`lastNote`，程式當時寫了 `first_note`。已改 `static/js/score.js`，重測後桌面 25 條、手機 27 條，主控台不再有延音線錯誤。剩下的 404 是既有的 `/favicon.ico`，不是這首曲子。

音名和簡譜同時開啟時，十六分音符那幾小節仍然很擠。這是既有排版限制。

## 重建與啟動

在專案根目錄執行。這段會重寫試轉 JSON，並在寫入前拿掉大調自動和弦：

```bash
cd /home/sweet/.gemini/antigravity/scratch/sax-play-along
.venv/bin/python - <<'PY'
import hashlib, json
from pathlib import Path
from tools.trial_musicxml import convert
src = Path('/home/sweet/樂譜/開源格式/你怎麼捨得我難過.musicxml')
pdf = Path('/home/sweet/樂譜/你怎麼捨得我難過.pdf')
song = convert(src, 'shede-wo-nanguo-musicxml-trial', 80, 0)
song['title'] = '妳怎麼捨得我難過（MusicXML 試轉）'
song['composer'] = 'Ajax Hsieh'
song['mode'] = 'minor'
song['tracks'] = [t for t in song['tracks'] if t['id'] in ('melody-guide', 'metronome')]
song.pop('chordSymbols', None)
song['importInfo'] = {
    'source': str(src),
    'sourceSha256': hashlib.sha256(src.read_bytes()).hexdigest(),
    'pdf': str(pdf),
    'pdfSha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
    'pitchBasis': 'PDF 未標 For Eb Sax，暫按實音，transpose 0',
    'tempoBasis': '來源未標速度，暫設 80',
    'modeBasis': '無調號；終止在 A，依 A 自然小調記錄。keyConcert 用相對大調名稱 C',
    'noteCorrections': [],
}
path = Path('data/trials/musicxml/shede-wo-nanguo-musicxml-trial.json')
path.write_text(json.dumps(song, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(path, song['measures'], len(song['melody']))
PY
```

只跑 `trial_musicxml.py` 而不做後面的欄位調整，會得到檔名標題、空的 composer，以及一組 C 大調自動和弦。那不是這次保存的檔案。上面的指令會重寫較短的 `importInfo`；目前 JSON 裡的長說明仍以檔案內容為準。

預覽：

```bash
.venv/bin/python -u - <<'PY'
from pathlib import Path
import app
app.SONGS_DIR = Path('data/trials/musicxml').resolve()
songs = app.load_songs()
song_id = 'shede-wo-nanguo-musicxml-trial'
app._songs = {song_id: songs[song_id]}
app.app.run(host='127.0.0.1', port=5004, debug=False)
PY
```

開啟 http://127.0.0.1:5004 。改 JSON 後要重啟這個行程。

## 已知限制

- 音高基準是暫定。若這張譜其實已是未標示的 Eb 薩克斯風寫定譜，應改用 `--transpose -9` 重建，畫面才會與 PDF 同高。目前寫定音有 56 個高於建議練習音 81。
- 沒有小調自動和弦。預覽只有旋律導奏和節拍器。頁面開頭那句木吉他說明是共用文字，這首沒有吉他軌。
- 介面把調性顯示成「C 大調」，唱名也以 C 為 Do。以這次的小調判斷，主音 A 會顯示成 La／6。
- PDF 右上的 Ajax Hsieh 沒有角色，composer 只是沿用這個署名。檔名用「你」，譜題用「妳」。
- 尚未全曲逐音校對，也還沒有真人聆聽。


## 2026-10-22：補作 A 小調練習伴奏（目前版本）

初次匯入只保留旋律，原因是大調自動和聲不適用，沒有另設計小調伴奏。此次新增 `tools/arrange_shede.py`，依旋律設計 29 個和弦事件，`source:manual`，不是來源原有和弦，也不宣稱還原原曲編曲。正式曲庫未變。

| 小節 | 實音和弦（兩個和弦各佔兩拍） |
| --- | --- |
| 1–4 | Am · Dm · G7 · C |
| 5–8 | Dm · C · Am · E7 |
| 9–12 | Am · Dm · G7 · C |
| 13–17 | Dm · C · Am/E7（兩個事件，非 slash chord） · Am · Am |
| 18–21 | Dm · Am · Dm/E7（兩個事件） · Am |
| 22–25 | Dm · Am · Dm/E7（兩個事件） · E7/Am（兩個事件） |

前後相似樂句使用相同和聲。第 4、12 小節長 E 以 C 和弦三音承接；第 8 小節長 B 以 E7 屬和弦承接。第 16–17 小節 A 停留回到 Am。第 18、22 小節 F、D 較多使用 Dm；第 23 小節降 E 暫當作 E 到 D 的半音經過音，保留原旋律，配 Am。第 24 小節後半 B 交給 E7，第 25 小節第三拍回 Am，讓末音 A 穩定收束。E7 的 G# 是新增伴奏中的和聲小調導音，不更動旋律。

儲存音軌：melody-guide 0.6、metronome 0.7、chords 0.35（29 音組）、bass 0.4（29 事件）。不保存空 guitar，前端柔和編排生成木吉他 0.25。實測編排輸出鋼琴 98、貝斯 50、吉他 98 個事件；Eb 寫定末和弦顯示 F#m。

補作檢查：validate_song 通過；29 個和弦連續覆蓋 100 拍；儲存與編排音軌拍位、時長及 MIDI 範圍通過；反覆執行 arrange 結果一致；旋律與補作前完全相同；來源 MusicXML SHA256 仍為本報告上列值。原始檔與正式曲庫未改。備份：`.backups/shede-manual-harmony/before.json`。

重建：先執行上方旋律匯入指令，**接著必須執行**：

```bash
.venv/bin/python tools/arrange_shede.py
```

目前小調 `harmonize_song` 仍會拒絕自動分析；載入器捕捉此錯誤並保留已儲存的人工和弦與音軌。此補作流程以 `arrange` 的重複執行與 API 載入保留檢查代替小調自動補和聲測試。介面仍以相對大調 C／寫定 A 顯示調名、以 A 為 La；本次未擴充小調調名與唱名系統。

補作後尚未做瀏覽器實際播放、音訊 peak/RMS 或真人聆聽／專業和聲校對；上方 77 秒音訊數據只適用初次匯入的旋律獨奏。刷新舊 5004 服務不會重讀 JSON，需重啟或另開新單曲預覽。


本次回歸：76 項 Python 測試與七個 Node 測試檔通過，`git diff --check` 通過。Flask test client 確認曲庫載入與單曲 API 均保留 29 個人工和弦及四個儲存音軌。

補作版已啟動獨立預覽：http://127.0.0.1:5005 。原 5004 未停止，其記憶體仍可能是無伴奏版本。重啟補作版時沿用上方單曲預覽指令，將 port 改為 5005。
