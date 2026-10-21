# MusicXML 曲目擴充評估

評估日期：2026-10-21。來源：`/home/sweet/樂譜/開源格式/*.musicxml`，共 37 份，皆可解析。此報告為結構檢查，尚未對照 PDF 校對音高、節奏與音域，也未建立正式曲目。

## 結論

可以擴充，但現有程式只有 JSON 載入，尚無 MusicXML 轉換工具。37 份皆由 Audiveris 5.11.0 / ProxyMusic 4.0.3 輸出；聲部均標為 Voice，沒有 transpose、sound tempo、metronome 或 harmony。不能從檔案確認是實際音高還是中音薩克斯風寫定音高，需由原譜確認，並提供練習速度。缺少調號時不能把推定的 C 調當作已確認資訊。

11 份存在小節長度不符；其中若干為明示 implicit=yes 的弱起，可補前置休止，其餘不可自行補拍或截短。此檢查以 backup/forward/note 游標的最遠結束位置對照拍號，不能取代逐聲部重疊與連續性驗證。

## 現有系統需補強之處

- 新增 MusicXML → 現有平面 song JSON 的離線轉換器；AI 回應外層 format/song/chords 不能直接放進 data/songs。
- 匯入參數需明確指定音高基準與速度；written 中音薩克斯風轉 concert 減 9 半音，concert 原值保留。四重奏須逐聲部確認樂器及移調。
- 用分數計算時值、處理 divisions/backup/forward/chord/rest/grace/tie；先驗證每小節與聲部，再轉為數值。
- 合併延音供播放時，譜面仍需跨小節拆音與繪製連結線；現有 score.js 只依開始拍分組，會把長音全放在起始小節。
- pitch.js 將三連音映成一般音符，score.js 未建立 Tuplet；必須補三連音繪製才可正確呈現。
- 海波浪、舞女有變拍；現有 schema 只有單一 timeSignature，應先分段或擴充拍號事件。
- 反覆與房號先採印刷順序並顯示提醒，或由使用者提供播放順序；不可從 OMR 結果直接假定正確展開。
- 無 harmony 的來源先提供旋律導奏與節拍器即可；和弦及貝斯需另製，不應宣稱來源已有完整伴奏。

## 逐曲結果

以下「優先候選」僅表示小節長度與基本結構較單純，仍需確認音高基準、速度與原譜。正常長度不代表辨譜完全正確。

| 檔名 | 小節數（各聲部） | 分類 | 注意事項 |
|---|---|---|---|
| Amazing Grace.musicxml | 32 | 優先候選 | 無額外結構問題 |
| Bengawan Solo 美麗的梭羅.musicxml | 29 | 需額外處理 | 三連音／連音組；反覆／房號；延音線；P1 小節 0：1/4 拍（弱起） |
| Beyond-不再猶豫.musicxml | 43 | 優先候選 | 延音線 |
| Dragon Ball Z Opening(七龍珠).musicxml | 56 | 先校對原譜 | 延音線；P1 小節 2：9/2/4 拍；P1 小節 10：9/2/4 拍 |
| I Love You So(郭富城).musicxml | 26 | 先校對原譜 | 三連音／連音組；延音線；P1 小節 3：7/2/4 拍；P1 小節 11：7/2/4 拍 |
| Janne Da Arc-月光花.musicxml | 27 | 優先候選 | 延音線 |
| KENNY 眼紅館 LIVE.musicxml | 15 | 需額外處理 | 延音線；P1 小節 0：2/4 拍（弱起） |
| Kaori Kobayashi (小林香織) - Kira-Kira.musicxml | 33 | 優先候選 | 延音線 |
| Kaori Kobayashi Sunshine 小林香織.musicxml | 24 | 優先候選 | 延音線 |
| Kenny Rogers - Carzy(只有一半版).musicxml | 21 | 優先候選 | 延音線 |
| Kobayashi Kaori (小林香織) - Heart of Mine.musicxml | 20 | 優先候選 | 延音線 |
| 你著忍耐.musicxml | 22 | 優先候選 | 延音線 |
| 可憐戀花再會吧.musicxml | 16 | 優先候選 | 延音線 |
| 台北今夜冷清清.musicxml | 21 | 優先候選 | 無額外結構問題 |
| 安平追想曲.musicxml | 18 | 優先候選 | 延音線 |
| 家後.musicxml | 37 | 優先候選 | 延音線 |
| 思慕的人.musicxml | 24 | 優先候選 | 延音線 |
| 想厝的人.musicxml | 28 | 優先候選 | 延音線 |
| 愛拼才會贏.musicxml | 20 | 需額外處理 | 延音線；P1 小節 0：1/4 拍（弱起） |
| 望春風.musicxml | 15 | 先校對原譜 | P1 小節 12：3/4 拍 |
| 望月想愛人.musicxml | 25 | 優先候選 | 延音線 |
| 查某人.musicxml | 65 | 優先候選 | 延音線 |
| 歡喜就好薩克斯四重奏.musicxml | 180, 180, 180, 180 | 先校對原譜 | 多聲部，需選主旋律與逐軌移調；延音線；P1 小節 88：3/4 拍；P2 小節 16：3/4 拍；P2 小節 88：3/4 拍；P3 小節 88：3/4 拍；P4 小節 88：3/4 拍 |
| 浪子心聲.musicxml | 34 | 優先候選 | 延音線 |
| 海波浪.musicxml | 17 | 需額外處理 | 變拍；反覆／房號 |
| 淡水暮色.musicxml | 16 | 優先候選 | 無額外結構問題 |
| 炮仔聲.musicxml | 37 | 先校對原譜 | P1 小節 6：9/2/4 拍；P1 小節 7：9/2/4 拍 |
| 空笑夢.musicxml | 17 | 優先候選 | 延音線 |
| 純情青春夢.musicxml | 32 | 優先候選 | 延音線 |
| 舊情綿綿.musicxml | 16 | 優先候選 | 延音線 |
| 舞女.musicxml | 27 | 需額外處理 | 變拍；延音線 |
| 苦海女神龍.musicxml | 11 | 優先候選 | 延音線 |
| 落雨聲.musicxml | 34 | 先校對原譜 | 延音線；P1 小節 27：5/4 拍 |
| 請你麥擱卡.musicxml | 36 | 先校對原譜 | 延音線；P1 小節 22：9/2/4 拍；P1 小節 30：5/4 拍 |
| 鑼聲若響.musicxml | 12 | 優先候選 | 無額外結構問題 |
| 黃昏的故鄉.musicxml | 17 | 先校對原譜 | 延音線；P1 小節 0：1/4 拍（弱起）；P1 小節 3：9/2/4 拍 |
| 黯淡的月.musicxml | 21 | 優先候選 | 延音線 |

分類數量：優先候選 24 份；需額外處理 5 份；先校對原譜 8 份。

## 建議執行順序

1. 先用 Amazing Grace、台北今夜冷清清、淡水暮色、鑼聲若響試轉：小節時值完整，無連音組或反覆；Amazing Grace 與既有曲目須用不同 id，避免覆寫。
2. 確認每曲音高基準與速度後，轉出 melody-guide / metronome，標記 license=user-imported；此標記是匯入分類，不代表已取得公開發佈授權。
3. 以既有 validate_song 加上總長、連續性、音域及重複 id 驗證，並在瀏覽器逐曲驗證跟譜及實際聆聽。
4. 修正辨譜問題後再處理三連音、變拍、反覆及四重奏。

## 重現掃描

```bash
python3 tools/audit_musicxml.py /home/sweet/樂譜/開源格式 > docs/musicxml-audit.json
```

機器可讀細節見 `musicxml-audit.json`。掃描工具只讀取來源，不修改任何樂譜或正式曲目。
