# 多 AI 階段板

更新：2026-10-22。專案：`/home/sweet/.gemini/antigravity/scratch/sax-play-along`。

這份文件給沒有先前聊天紀錄的 AI。一次只做一張認領，做完就更新本板與 [認領表](import-claims.md)。長篇格式仍以 [AI 匯入規範](AI_IMPORT_GUIDE.md) 為準。程式若已改，以程式與測試為準，並改本板的「系統限制」。

不要讀完整個 [開發進度](DEVELOPMENT_PROGRESS.md)。只讀該檔開頭的「目前狀態」。下面的舊段落會寫著當時尚未完成，不能當成現況。

## 系統是什麼

這是 Eb 中音薩克斯風的單旋律跟奏練習器。歌曲以實音存放，網頁再加 9 個半音顯示寫定譜。它不是總譜瀏覽器，不能整包呈現 `/home/sweet/樂譜/開源格式` 的 490 份 MusicXML。

## 系統限制（2026-10-22 程式）

可以直接試轉：

- 單一聲部、voice 1。多個 part 時必須用 `--part` 指定一個，不能畫成總譜。
- 分母為 4 的拍號。分子可以逐小節不同，輸出 `measureBeats`。
- 休止、附點、連桿、符幹。
- 同音高且時間相接的延音線。譜面用 VexFlow 5 的 `firstNote`／`lastNote`。播放合成一聲。
- 小節末尾、後面沒有音符的 `backup` 可忽略。原始檔不改。

必須拒絕，不能刪標記硬轉：

- 反覆、房號、三連音、中途轉調、同拍疊音、`forward`、裝飾音。
- `backup` 後面還有音符的第二聲部。
- 分母不是 4 的拍號。
- 小節拍數總和與拍號不符。弱起不能自行補拍或砍音。
- 來源 `<harmony>`。目前曲庫幾乎沒有這個標記。

和聲：

- `harmonize_song` 只自動處理大調。`mode` 不是 `major` 時會拒絕，載入器保留檔案裡已經寫好的和弦。
- 小調要另設計練習和弦，`source` 標 `manual`，並寫明不是原譜和聲。不要把 `keyConcert` 改成大調來騙過自動配和弦。
- `keyConcert` 只能填大調名稱。空調和弦號用相對大調名稱，例如 0 個升降號寫 `C`，同時把模式寫進 `mode` 與報告。

音高：

- 每首單獨判斷實音或 Eb 寫定譜。PDF 寫 For Eb Sax 才用 `-9`。Audiveris 的 Voice／Voice Oohs 不是證據。
- 不能把某一首的移調套到整個資料夾。
- `notation.writtenPitch` 與「實音 MIDI + 9」不一致時，渲染器會改用計算拼法。不要為了拼法去改播放音高。

## 2026-10-22 來源盤點

目錄 `/home/sweet/樂譜/開源格式` 有 490 份 `.musicxml`。以下是當日以 `--transpose 0 --tempo 80` 呼叫 `convert()` 的分類，不是聽過、也不是逐音校對。

| 分類 | 份數 | 下一手可以做的事 |
| --- | ---: | --- |
| 結構上可試轉 | 223 | 仍須每首決定音高與速度。其中 137 份有調號且拍號不變；78 份沒有調號；約 9 份是分母 4 的變拍 |
| 只有小節拍數或延音線問題 | 86 | 對照 PDF 做有原值檢查的修正，或標成 blocked |
| 只有三連音 | 26 | 先擴充匯入器與測試，再匯入 |
| 只有反覆 | 21 | 同上。另有更多檔同時含反覆與其他問題，合計約 94 份含反覆 |
| 只有轉調 | 17 | 同上 |
| 只有同拍疊音 | 13 | 不要壓成單音。合計約 36 份含疊音 |
| 多個問題 | 104 | 不要挑一個問題刪掉其餘標記 |

舊評估 [musicxml-import-assessment.md](musicxml-import-assessment.md) 只涵蓋 37 份，不能拿來代表現在的 490 份。

## 下一輪可認領的轉換

[import-queue.md](import-queue.md) 列出 137 份有調號、拍號穩定的單旋律。下一手只認領其中一列，先轉到 `data/trials/musicxml/` 驗證，成功後依 [通用處理指令](AI_WORKER_PROMPT.md)「收尾」直接加入正式曲庫 `data/songs/`（2026-11-13 起的長期指示）。不要整批轉換。清單裡的 `transpose 0` 只是結構掃描，每首仍要單獨判斷音高。貼給任何 AI 的文字用 [通用處理指令](AI_WORKER_PROMPT.md)，不要各寫一份。

## 已完成，不要重做

| 位置 | id | 說明 |
| --- | --- | --- |
| 正式 | `amazing-grace`、`auld-lang-syne`、`ode-to-joy`、`detective-conan` | 原有四首 |
| 正式 | `pao-a-sia` | 自試轉複製。試轉 id 仍是 `pao-a-sia-musicxml-trial` |
| 正式 | `shede-wo-nanguo` | 自試轉複製，含 29 個人工 A 小調和弦 |
| 試轉 | `amazing-grace-musicxml-trial`、`taipei-tonight-trial`、`tamsui-twilight-trial`、`gong-sounds-trial` | 移調 `-9` 仍是暫定 |
| 試轉 | `pao-a-sia-musicxml-trial` | PDF 標 For Eb Sax，兩處節奏已依修正清單處理 |
| 試轉 | `shede-wo-nanguo-musicxml-trial` | 實音、`mode=minor`、29 個 manual 和弦。不要刪回成無伴奏 |
| 試轉 | `a-time-for-us-musicxml-trial` | 實音 transpose 0。PDF 未標 For Eb Sax。`mode=minor`，35 個 manual D 小調練習和弦。未做全曲逐音與真人聆聽 |

正式曲庫預覽是 http://127.0.0.1:5001 。改 JSON 後要重啟該行程。開始前用 `ss -ltnp` 看 5001–5005，不要停掉別人正在用的連接埠。

## 認領規則

1. 讀 [import-claims.md](import-claims.md)。同一首或同一項功能已有 `claimed` 或 `done`，就停止，不要另做一份。
2. 狀態是 `blocked` 時，先讀原因。用同一種刪標記、改拍或改調的方法重試，視同重複錯誤。
3. 開始前先加一列 `claimed`。一次只認領一首歌，或一項匯入器功能，不要兩件一起做，也不要認領整個資料夾。
4. 結束時把該列改成 `done` 或 `blocked`，寫上輸出路徑與驗證範圍。沒寫進認領表，就等於沒完成。
5. 歌曲先寫 `data/trials/musicxml/` 驗證。2026-11-13 起，使用者長期指示：處理成功（`done`）的歌曲直接複製進 `data/songs/`，規則見 [通用處理指令](AI_WORKER_PROMPT.md)「收尾」。`blocked` 的歌曲絕不寫入 `data/songs/`。2026-11-13 前完成的 trial 曲已由網頁載入器一併顯示為正式（`load_all_songs()`），檔案仍在試轉目錄。
6. 不要執行會重寫原四首的整目錄批次命令，除非任務明確點名那四首。單檔命令要帶 `--song-id`。
7. 不要把稽核 JSON、修正清單放進 `data/songs/` 或 `data/trials/musicxml/`。
8. 不要推送、部署，也不要還原別人未提交的改動。

## 已經犯過、不要再犯

- 看到舊曲用 `-9`，就把新檔也減 9。炮仔聲有 PDF 依據；妳怎麼捨得我難過沒有。
- 為了通過轉換器而刪掉延音線、反覆、三連音或疊音。
- 小調假標成大調，讓自動和弦成功。
- 小節拍數加總正確，就寫成已逐音校對。單元測試通過，就寫成已在瀏覽器播放或已真人聆聽。
- 掃描 PDF 只看了開頭和結尾，卻寫成全曲已對過。
- VexFlow 延音線寫成 `first_note`。這個版本要 `firstNote`／`lastNote`。
- 把 Audiveris 的樂器名當成實音或薩克斯風證據。
- 空的 `composer` 在畫面上會顯示「傳統樂曲」。沒有角色的署名要在報告說明，不要另外查作者填進去。
- 試轉說明若與 JSON 衝突，以 JSON 為準，不要把已補上的和弦刪掉。

## 一輪結束要改哪些檔

- 認領表的那一列。
- 有匯入歌曲時：`docs/<id>-import-test.md`。
- 曲目數量有變時：只改開發進度開頭的「目前狀態」，不要改寫舊歷程。
- 轉換器行為有變時：改匯入規範的支援表，並補回歸測試。
- 限制或已完成清單有變時：改本板。本板與程式衝突時，先改本板。
