# 單旋律試轉工作清單

更新：2026-10-22。共 137 份。其中 3 份已試轉，134 份狀態為 `open`，可供下一手認領。

篩選條件：單一聲部、有調號、拍號分母為 4 且全曲不變、`convert(transpose=0, tempo=80)` 沒有丟出結構錯誤，而且沒有反覆、房號、三連音、轉調、同拍疊音或第二聲部。這只表示拍數加得起來。不表示辨譜正確，也不表示應該使用移調 0。

`調號 fifths` 是 MusicXML 的升降號數：正數為升、負數為降、0 為無升降。它不是實音調名。每首仍要單獨判斷實音或 Eb 寫定譜，不能整批使用 `-9`。

## 如何認領

1. 重讀本檔與 [認領表](import-claims.md)。只選一列 `open`。
2. 把該列改成 `claimed`，填認領日期與確定的 song id。建議 id 若寫「認領時另訂」，不可沿用別人的 id。
3. 在認領表加一列 `claimed`，項目用來源檔名。
4. 依 [階段板](AI_STAGE_BOARD.md) 試轉到 `data/trials/musicxml/`。本次清單沒有授權加入正式曲庫。
5. 結束時把本列與認領表改成 `done` 或 `blocked`，寫上輸出路徑與未做的檢查。
6. 兩處狀態衝突時，以認領表為準，不要再開始該檔。

## 清單

| 狀態 | 來源檔 | 小節 | 調號 fifths | 拍號 | 建議 id | 認領日期 | 輸出 |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| done | `A Time For Us.musicxml` | 35 | -1 | 3/4 | `a-time-for-us-musicxml-trial` | 2026-10-22 | data/trials/musicxml/a-time-for-us-musicxml-trial.json |
| done | `All By Myself.musicxml` | 24 | 3 | 4/4 | `all-by-myself-musicxml-trial` | 2026-11-05 | data/trials/musicxml/all-by-myself-musicxml-trial.json |
| done | `All By Myself2.musicxml` | 24 | 2 | 4/4 | `all-by-myself2-musicxml-trial` | 2026-11-05 | data/trials/musicxml/all-by-myself2-musicxml-trial.json |
| done | `Ana I Love You So.musicxml` | 40 | -1 | 4/4 | `ana-i-love-you-so-musicxml-trial` | 2026-11-05 | data/trials/musicxml/ana-i-love-you-so-musicxml-trial.json |
| claimed | `Are You Lonesome Tonight.musicxml` | 32 | 1 | 3/4 | `are-you-lonesome-tonight-musicxml-trial` | 2026-11-05 |  |
| open | `Beasame Mucho.musicxml` | 40 | 3 | 4/4 | `beasame-mucho-musicxml-trial` |  |  |
| open | `Becutiful Sunday.musicxml` | 32 | 1 | 4/4 | `becutiful-sunday-musicxml-trial` |  |  |
| open | `Beyond-不再猶豫.musicxml` | 43 | 4 | 4/4 | `認領時另訂` |  |  |
| open | `Blue Moon.musicxml` | 32 | 3 | 4/4 | `blue-moon-musicxml-trial` |  |  |
| open | `Bon Jovi-All about loving you.musicxml` | 21 | 4 | 4/4 | `bon-jovi-all-about-loving-you-musicxml-trial` |  |  |
| open | `David Sanborn - The Dream.musicxml` | 28 | -2 | 4/4 | `david-sanborn-the-dream-musicxml-trial` |  |  |
| open | `Don't Cry For Me Argentina.musicxml` | 59 | 1 | 4/4 | `don-t-cry-for-me-argentina-musicxml-trial` |  |  |
| open | `Emily-Dave Koz.musicxml` | 28 | 2 | 4/4 | `emily-dave-koz-musicxml-trial` |  |  |
| open | `EUROPA.musicxml` | 16 | -1 | 4/4 | `europa-musicxml-trial` |  |  |
| open | `First Love.musicxml` | 29 | -1 | 4/4 | `first-love-musicxml-trial` |  |  |
| open | `Fly Me To The Moon.musicxml` | 31 | 2 | 4/4 | `fly-me-to-the-moon-musicxml-trial` |  |  |
| open | `Gundam 00 op 1 daybreak's bell.musicxml` | 53 | 4 | 4/4 | `gundam-00-op-1-daybreak-s-bell-musicxml-trial` |  |  |
| open | `Have Yourself a Merry Little Christmas.musicxml` | 36 | 2 | 4/4 | `have-yourself-a-merry-little-christmas-musicxml-trial` |  |  |
| open | `How Long Has This Been Going On.musicxml` | 56 | 2 | 4/4 | `how-long-has-this-been-going-on-musicxml-trial` |  |  |
| open | `I Saw Mummy Kissing Santa Claus.musicxml` | 32 | 3 | 4/4 | `i-saw-mummy-kissing-santa-claus-musicxml-trial` |  |  |
| open | `I Was Born To Love You.musicxml` | 135 | -1 | 4/4 | `i-was-born-to-love-you-musicxml-trial` |  |  |
| open | `JAMBALAYA.musicxml` | 49 | -1 | 4/4 | `jambalaya-musicxml-trial` |  |  |
| open | `Janne Da Arc-月光花.musicxml` | 27 | 5 | 4/4 | `janne-da-arc-musicxml-trial` |  |  |
| open | `Jeff Kashiwa - Hyde Park.musicxml` | 24 | -2 | 4/4 | `jeff-kashiwa-hyde-park-musicxml-trial` |  |  |
| open | `Just The Way You Are _ Sax Solo.musicxml` | 18 | 1 | 4/4 | `just-the-way-you-are-sax-solo-musicxml-trial` |  |  |
| open | `Kaori Kobayashi (小林香織) - Kira-Kira.musicxml` | 33 | -3 | 4/4 | `kaori-kobayashi-kira-kira-musicxml-trial` |  |  |
| open | `Kenny Rogers - Carzy(只有一半版).musicxml` | 21 | -3 | 4/4 | `kenny-rogers-carzy-musicxml-trial` |  |  |
| open | `Kobayashi Kaori (小林香織) - Heart of Mine.musicxml` | 20 | 1 | 4/4 | `kobayashi-kaori-heart-of-mine-musicxml-trial` |  |  |
| open | `L.O.V.E.musicxml` | 32 | 2 | 4/4 | `l-o-v-e-musicxml-trial` |  |  |
| open | `la vie en rose.musicxml` | 20 | 1 | 4/4 | `la-vie-en-rose-musicxml-trial` |  |  |
| open | `MARIO(瑪莉兄弟).musicxml` | 50 | 2 | 4/4 | `mario-musicxml-trial` |  |  |
| open | `Moon River.musicxml` | 37 | 2 | 3/4 | `moon-river-musicxml-trial` |  |  |
| open | `Only Love.musicxml` | 30 | -1 | 4/4 | `only-love-musicxml-trial` |  |  |
| open | `Please Mr. Postman.musicxml` | 20 | 1 | 4/4 | `please-mr-postman-musicxml-trial` |  |  |
| open | `Que Sera Sera.musicxml` | 36 | 1 | 3/4 | `que-sera-sera-musicxml-trial` |  |  |
| open | `Santa Claus Is Coming To Town.musicxml` | 32 | 3 | 4/4 | `santa-claus-is-coming-to-town-musicxml-trial` |  |  |
| open | `Sleigh Ride.musicxml` | 48 | 2 | 4/4 | `sleigh-ride-musicxml-trial` |  |  |
| open | `Slent Night.musicxml` | 23 | -1 | 3/4 | `slent-night-musicxml-trial` |  |  |
| open | `Songbird簡化版.musicxml` | 25 | 3 | 4/4 | `songbird-musicxml-trial` |  |  |
| open | `Spirited Away ／ 千 千尋 神隱.musicxml` | 35 | -1 | 3/4 | `spirited-away-musicxml-trial` |  |  |
| open | `Sunset Ocean.musicxml` | 62 | -1 | 4/4 | `sunset-ocean-musicxml-trial` |  |  |
| open | `That Old Feeling.musicxml` | 32 | -2 | 4/4 | `that-old-feeling-musicxml-trial` |  |  |
| open | `The Christmas Song(白色聖誕，用高音就跟ＣＤ同調，KENNY G 那一版).musicxml` | 38 | -1 | 4/4 | `the-christmas-song-kenny-g-musicxml-trial` |  |  |
| open | `The Girl From Ipanema.musicxml` | 40 | 2 | 4/4 | `the-girl-from-ipanema-musicxml-trial` |  |  |
| open | `The Last Waltz.musicxml` | 32 | 1 | 3/4 | `the-last-waltz-musicxml-trial` |  |  |
| open | `Timbaland-Apologize.musicxml` | 26 | 1 | 4/4 | `timbaland-apologize-musicxml-trial` |  |  |
| open | `Top Of The World.musicxml` | 32 | 1 | 4/4 | `top-of-the-world-musicxml-trial` |  |  |
| open | `What A Wonderful World.musicxml` | 32 | 1 | 4/4 | `what-a-wonderful-world-musicxml-trial` |  |  |
| open | `When I Need You.musicxml` | 47 | -2 | 3/4 | `when-i-need-you-musicxml-trial` |  |  |
| open | `White Christmas.musicxml` | 31 | 1 | 4/4 | `white-christmas-musicxml-trial` |  |  |
| open | `Yesterday Once More.musicxml` | 48 | 1 | 4/4 | `yesterday-once-more-musicxml-trial` |  |  |
| open | `You'll Shine Again.musicxml` | 28 | -2 | 4/4 | `you-ll-shine-again-musicxml-trial` |  |  |
| open | `一號皇庭.musicxml` | 31 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `一顆不變心.musicxml` | 24 | 4 | 4/4 | `認領時另訂` |  |  |
| open | `不是因為寂寞才想你.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `世上只有.musicxml` | 18 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `京華春夢.musicxml` | 24 | 5 | 4/4 | `認領時另訂` |  |  |
| open | `今宵多珍重 SAX SOLO.musicxml` | 17 | 7 | 4/4 | `sax-solo-musicxml-trial` |  |  |
| open | `今生今世.musicxml` | 18 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `伍思凱 - 生日快樂.musicxml` | 36 | 4 | 4/4 | `認領時另訂` |  |  |
| open | `何日君再來.musicxml` | 24 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `你是我的眼.musicxml` | 33 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `你是我的花朵.musicxml` | 26 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `你的眼神.musicxml` | 19 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `像我這樣的朋友.musicxml` | 20 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `再回首(憑著愛).musicxml` | 22 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `勇氣.musicxml` | 16 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `千言萬語.musicxml` | 24 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `可憐戀花再會吧.musicxml` | 16 | 2 | 4/4 | `認領時另訂` |  |  |
| done | `台北今夜冷清清.musicxml` | 21 | -2 | 4/4 | `taipei-tonight-trial` | 2026-10-22 | data/trials/musicxml/taipei-tonight-trial.json |
| open | `哭砂.musicxml` | 28 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `唯一.musicxml` | 28 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `唯獨你是不可取替.musicxml` | 33 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `啟程.musicxml` | 19 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `夜空.musicxml` | 27 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `夢醒時分-Intro.musicxml` | 4 | -1 | 4/4 | `intro-musicxml-trial` |  |  |
| open | `天使 - 五月天.musicxml` | 21 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `如果雲知道.musicxml` | 51 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `如紅酒般醉人的爵士樂.musicxml` | 25 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `孤單北半球.musicxml` | 33 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `專屬天使.musicxml` | 25 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `小丑.musicxml` | 23 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `就是愛你.musicxml` | 25 | -2 | 4/4 | `認領時另訂` |  |  |
| open | `就算世界無童話.musicxml` | 32 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `川流不息(雙手的溫柔).musicxml` | 35 | 4 | 4/4 | `認領時另訂` |  |  |
| open | `思慕的人.musicxml` | 24 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `情書(海角七號).musicxml` | 18 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `想厝的人.musicxml` | 28 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `愛如潮水.musicxml` | 26 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `感恩的心.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `愫.musicxml` | 29 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `懷念的播音員.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `我只在乎你.musicxml` | 21 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `我比誰都清楚.musicxml` | 34 | 4 | 4/4 | `認領時另訂` |  |  |
| open | `我要快樂.musicxml` | 21 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `我願意.musicxml` | 34 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `把悲傷留給自己.musicxml` | 33 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `新不了情簡易版Solo.musicxml` | 9 | 4 | 4/4 | `solo-musicxml-trial` |  |  |
| open | `星晴.musicxml` | 41 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `昴.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `月亮代表我的心.musicxml` | 33 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `望你早歸.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `望月想愛人.musicxml` | 25 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `查某人.musicxml` | 65 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `柯南主題曲-如果有你.musicxml` | 30 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `楊千嬅 - 撈月亮的人.musicxml` | 25 | -4 | 4/4 | `認領時另訂` |  |  |
| open | `死了都要愛.musicxml` | 33 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `浪子心聲.musicxml` | 34 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `海闊天空(Beyond).musicxml` | 25 | -1 | 4/4 | `認領時另訂` |  |  |
| done | `淡水暮色.musicxml` | 16 | 1 | 4/4 | `tamsui-twilight-trial` | 2026-10-22 | data/trials/musicxml/tamsui-twilight-trial.json |
| open | `無樂不做.musicxml` | 33 | 3 | 4/4 | `認領時另訂` |  |  |
| open | `無聲的相辭.musicxml` | 44 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `牙關.musicxml` | 21 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `牛仔很忙.musicxml` | 25 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `祝你幸福.musicxml` | 16 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `祝壽歌.musicxml` | 8 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `神奇寶貝_奧拉席翁_草笛(亂抓未整理版).musicxml` | 18 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `神隱少女 inochi no namae.musicxml` | 26 | 3 | 4/4 | `inochi-no-namae-musicxml-trial` |  |  |
| open | `約定.musicxml` | 34 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `純情青春夢.musicxml` | 32 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `紙船.musicxml` | 16 | -2 | 4/4 | `認領時另訂` |  |  |
| open | `結婚進行曲.musicxml` | 17 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `老情歌.musicxml` | 25 | -2 | 4/4 | `認領時另訂` |  |  |
| open | `老鷹之歌(El Condor Pasa) Corcorado(Quiet Nights) Beauty And The Beast 追.musicxml` | 45 | 2 | 4/4 | `el-condor-pasa-corcorado-quiet-nights-beauty-and-musicxml-trial` |  |  |
| open | `舊情綿綿.musicxml` | 16 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `花若離枝.musicxml` | 31 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `苦海女神龍.musicxml` | 11 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `藍雨.musicxml` | 33 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `親愛的小孩.musicxml` | 22 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `輕閉雙眼.musicxml` | 33 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `隱形的翅膀.musicxml` | 25 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `雙人枕頭.musicxml` | 24 | -1 | 4/4 | `認領時另訂` |  |  |
| open | `離人.musicxml` | 34 | -2 | 4/4 | `認領時另訂` |  |  |
| open | `非你莫屬.musicxml` | 38 | 2 | 4/4 | `認領時另訂` |  |  |
| open | `香水有毒.musicxml` | 44 | 1 | 4/4 | `認領時另訂` |  |  |
| open | `鬼新娘.musicxml` | 31 | -5 | 4/4 | `認領時另訂` |  |  |
| open | `黯淡的月.musicxml` | 21 | -1 | 4/4 | `認領時另訂` |  |  |
