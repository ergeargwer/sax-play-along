# 通用處理指令

每一輪新開一個沒有舊聊天紀錄的工作階段，只貼下面圍欄裡的文字。一輪只處理一首。Codex、Claude、Gemini、ChatGPT、Grok 都使用同一段，不要依工具改寫規則。

```text
你在沒有先前聊天紀錄的情況下，接手 sax-play-along 的一首試轉。不要詢問該做哪一首，依規則自行認領。

專案路徑：/home/sweet/.gemini/antigravity/scratch/sax-play-along
來源目錄：/home/sweet/樂譜/開源格式
PDF 若存在：/home/sweet/樂譜/<與 MusicXML 同名的 .pdf>

先依序閱讀，讀完再改任何檔案：
1. docs/AI_STAGE_BOARD.md
2. docs/import-claims.md
3. docs/import-queue.md
4. README.md
5. docs/DEVELOPMENT_PROGRESS.md 只讀開頭「目前狀態」。後面的舊段落不是現況。
6. docs/AI_IMPORT_GUIDE.md
程式若與文件衝突，以目前程式與測試為準，並在本輪結束時改正文件。

認領：
- 只處理 import-queue.md 裡狀態為 open 的一列。
- 動手之前重新讀該列，以及認領表。只要其中一處已是 claimed 或 done，就改選另一列 open。沒有 open 就停止，不要改檔。
- 狀態是 blocked 時不要用同一種刪標記、改拍或改調的方法再試。
- 先把工作清單該列改成 claimed，填上今天日期與 song id；再在 import-claims.md 加一列 claimed，項目用來源檔名。兩處都寫完，才開始轉換。
- 一次只做這一首。不要做第二首，不要整批，不要擴充匯入器。

轉換：
- 來源檔使用該列的檔名，路徑在來源目錄。不要改 MusicXML 或 PDF。
- 輸出只寫 data/trials/musicxml/<id>.json。不要寫入 data/songs/。
- id 用該列建議值。若格子是「認領時另訂」，自訂小寫英數與連字號，後綴 -musicxml-trial；先確認正式曲庫、試轉曲庫、認領表和工作清單都沒有這個 id。
- 用單檔命令並帶 --song-id。不要執行整目錄的 trial_musicxml.py。
- 工作清單的 transpose 0 只是結構掃描。PDF 明確寫 For Eb Sax 才使用 --transpose -9。否則依這份譜的樂器、調號與音域決定一個半音數，把證據寫進報告。Audiveris 的 Voice 或 Voice Oohs 不是證據。不要因為舊曲用過 -9 就沿用。
- 來源有速度就用來源。沒有就暫用 80，並註明是練習速度。
- 調號 fifths 不是大小調結論。終止與音高集合像小調時，設 mode 為 minor，另寫 source 為 manual 的練習和弦，並註明不是原譜和聲。不要改 keyConcert 去騙過自動大調配和弦。大調可保留轉換器產生的和弦。
- 同音高延音線保留。反覆、房號、三連音、轉調、同拍疊音、第二聲部，或小節拍數不符時，不要刪標記、補拍或砍音。把兩處狀態改成 blocked，寫明原因後停止。
- 有 PDF 時只核對音高基準，以及轉換器會拒絕的那幾小節。沒有逐音看完，就不要寫成已逐音校對。

驗證：
- validate_song 必須通過。小節拍數連續、沒有重疊。原始 MusicXML 的 SHA256 在寫入前後相同。
- 預覽前先執行 ss -ltnp。5001 到 5005 已有服務就換一個空連接埠，不要把現有服務停掉。
- 在瀏覽器確認這首的事件數。做不到就寫未做，不要改寫成已測試。
- 單元測試通過、拍數加總正確、瀏覽器播放、真人聆聽，這四件事分開記錄。

收尾：
- 成功：工作清單與認領表都改成 done，寫上輸出路徑。新增 docs/<id>-import-test.md，包含重建命令、移調證據、做過與未做的檢查。
- 失敗：兩處都改成 blocked，寫上已試做法，以及下一手不可再試的做法。刪除不合格的歌曲 JSON，避免半成品被載入。
- 試轉曲數有變時，只改 DEVELOPMENT_PROGRESS.md 開頭的「目前狀態」。不要改寫下面的舊歷程。
- 不要推送、部署，也不要還原別人未提交的修改。

回覆只寫：來源檔、song id、移調半音數與證據、done 或 blocked、預覽網址、未做的檢查。
```
