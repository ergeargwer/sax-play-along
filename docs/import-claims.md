# 匯入認領表

下一手開始前先讀 [階段板](AI_STAGE_BOARD.md)。待轉換的 134 首在 [工作清單](import-queue.md)，只認領一列 `open`。同一「項目」已有 `claimed` 或 `done` 時不要重做。`blocked` 要先讀原因，不能用同一種硬轉再試一次。

狀態只使用 `claimed`、`done`、`blocked`。日期用 `YYYY-MM-DD`。項目用 song id、來源檔名，或一個功能名稱。輸出路徑沒有就寫「無」。

| 日期 | 項目 | 狀態 | 輸出 | 範圍與未做事項 |
| --- | --- | --- | --- | --- |
| 2026-10-22 | pao-a-sia-musicxml-trial | done | data/trials/musicxml/pao-a-sia-musicxml-trial.json；正式副本 data/songs/pao-a-sia.json | PDF 標 For Eb Sax，移調 -9。第 6、7 小節節奏已修正。未做全曲逐音與真人聆聽 |
| 2026-10-22 | shede-wo-nanguo-musicxml-trial | done | data/trials/musicxml/shede-wo-nanguo-musicxml-trial.json；正式副本 data/songs/shede-wo-nanguo.json | 實音、mode=minor、29 個 manual A 小調和弦。不要刪回無伴奏。未做全曲逐音與真人聆聽 |
| 2026-10-22 | amazing-grace-musicxml-trial | done | data/trials/musicxml/amazing-grace-musicxml-trial.json | 移調 -9 為暫定，尚未對照原譜確認 |
| 2026-10-22 | taipei-tonight-trial | done | data/trials/musicxml/taipei-tonight-trial.json | 移調 -9 為暫定，尚未對照原譜確認 |
| 2026-10-22 | tamsui-twilight-trial | done | data/trials/musicxml/tamsui-twilight-trial.json | 移調 -9 為暫定，尚未對照原譜確認 |
| 2026-10-22 | gong-sounds-trial | done | data/trials/musicxml/gong-sounds-trial.json | 移調 -9 為暫定，尚未對照原譜確認 |
| 2026-10-22 | A Time For Us.musicxml | done | data/trials/musicxml/a-time-for-us-musicxml-trial.json | 實音 transpose 0。PDF 未標 For Eb Sax。mode=minor，35 個 manual D 小調練習和弦。瀏覽器數到 104 個譜面事件。未做全曲逐音、播放操作、音訊測量與真人聆聽 |
| 2026-11-05 | All By Myself.musicxml | done | data/trials/musicxml/all-by-myself-musicxml-trial.json | song id all-by-myself-musicxml-trial。移調 -9 依音域推定（PDF 未標 For Eb Sax，原值 0 會使顯示音高達 94）。大調、速度 80 為暫定練習速度、23 個自動和弦。瀏覽器數到 136 個譜面事件。未做全曲逐音、播放操作、音訊測量與真人聆聽。報告 docs/all-by-myself-import-test.md |
| 2026-11-05 | All By Myself2.musicxml | done | data/trials/musicxml/all-by-myself2-musicxml-trial.json | song id all-by-myself2-musicxml-trial。移調 -9：PDF 標「Alto-Sax／Eb 調樂器」。大調、速度 80 為暫定練習速度、24 個自動和弦。瀏覽器數到 141 個譜面事件。未做全曲逐音、播放操作、音訊測量與真人聆聽。報告 docs/all-by-myself2-import-test.md |
| 2026-11-05 | Ana I Love You So.musicxml | done | data/trials/musicxml/ana-i-love-you-so-musicxml-trial.json | song id ana-i-love-you-so-musicxml-trial。移調 -9 依音域推定（PDF 未標樂器，原值 0 會使顯示音高達 90）。大調、速度 80 為暫定練習速度、40 個自動和弦。瀏覽器數到 149 個譜面事件。未做全曲逐音、播放操作、音訊測量與真人聆聽。報告 docs/ana-i-love-you-so-import-test.md |
| 2026-11-05 | Are You Lonesome Tonight.musicxml | claimed | 無 | song id are-you-lonesome-tonight-musicxml-trial，進行中 |
