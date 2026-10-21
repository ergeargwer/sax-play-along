# 中音薩克斯風演奏練習與多音軌伴奏系統 (sax-play-along)

開發接續請先閱讀 [開發進度與歷程](docs/DEVELOPMENT_PROGRESS.md)；四首 MusicXML 試轉的設定與啟動方式見 [試轉說明](data/trials/musicxml/README.md)。

![License](https://img.shields.io/badge/License-Public%20Domain-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-green.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-blue.svg)
![VexFlow](https://img.shields.io/badge/VexFlow-5.0.0-orange.svg)
![Web%20Audio](https://img.shields.io/badge/Web%20Audio-API-red.svg)

專為**中音薩克斯風 (Eb Alto Saxophone)** 演奏者設計的高質感 Web 練習與伴奏平台。整合樂譜繪製、Eb 移調、英文音名與數字簡譜雙標記顯示、Web Audio Lookahead 排程器、動態變速、小節區域循環與多音軌控音面板（靜音 Mute / 獨奏 Solo）。

---

## ✨ 核心特色功能

- 🎷 **中音薩克斯風 Eb 移調與五線譜渲染**：
  - 自動處理 Eb 寫定音高 (Written Pitch) 與協奏音高 (Concert Pitch) 移調轉換（+9 半音）。
  - 基於 VexFlow 5.0.0 渲染高解析度 SVG 五線譜。
- 🏷️ **雙標記顯示與手動開關設定**：
  - 每顆音符同時提供**英文音名 (如 C5)** 與**數字簡譜 (如 1, 3, 5)** 輔助對照。
  - 控制面板提供獨立勾選框，可依個人偏好人工隱藏或顯示英文音名與數字簡譜。
- 🎛️ **多音軌 Web Audio 合成與獨立控音面板 (Phase 4)**：
  - 四條獨立音軌：**旋律導奏 (melody-guide)**、**和弦伴奏 (chords)**、**貝斯 (bass)** 與 **節拍器 (metronome)**。
  - 每條音軌皆具備獨立**音量控制滑桿 (0% - 100%)**、**M (Mute) 靜音**與 **S (Solo) 獨奏**切換按鈕。
- ⏱️ **Web Audio Lookahead 排程器 (無漂移、無漏拍)**：
  - 以 `AudioContext.currentTime` 為唯一時間基準，使用 25ms 輪詢視窗 Lookahead 預排程未來 100ms 音樂事件，確保長時間播放零累積時間漂移。
  - 提供倒數 1 小節大字倒數預備拍 (Count-in)。
- 🔂 **動態變速與小節範圍無縫循環**：
  - 支援 50% ~ 120% 播放速度即時動態微調（維持拍位連續性不跳位，不影響音高）。
  - 支援自訂小節範圍（如第 1 至第 8 小節）無縫重覆循環練習。
- 🎯 **視覺跟譜與音符高亮**：
  - 使用 `requestAnimationFrame` 搭配音訊延遲補償 (`outputLatency`) 實時進行音符高亮變色與垂直游標追蹤。
- 🎶 **豐富內建曲目庫**：
  - 歡樂頌 (*Ode to Joy*)
  - 奇異恩典 (*Amazing Grace*)
  - 友誼萬歲 (*Auld Lang Syne*)
  - 名偵探柯南主題曲 (*Detective Conan Main Theme*) -- 支援 MusicXML/MIDI 匯入轉換

---

## 🛠️ 技術棧 (Technology Stack)

- **前端 Frontend**：Vanilla JavaScript (ES Modules), HTML5, CSS3 Glassmorphism 深色風格 UI, VexFlow 5.0.0 (Bravura 字型)
- **後端 Backend**：Python 3, Flask RESTful API
- **音訊與動效 Audio & Animation**：Web Audio API (OscillatorNode, GainNode ADSR 包絡線, Lookahead Scheduler), requestAnimationFrame
- **測試框架 Testing**：Node.js Built-in Test Runner (`node --test`), Python `unittest`

---

## 🚀 快速開始 (Quick Start)

### 1. 複製專案庫

```bash
git clone https://github.com/ergeargwer/sax-play-along.git
cd sax-play-along
```

### 2. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

### 3. 啟動 Flask 伺服器

```bash
python3 app.py
```

開啟瀏覽器造訪 **`http://127.0.0.1:5000`** 即可開始練習！

---

## 🧪 自動化測試 (Automated Testing)

專案包含完整的後端與前端單元測試套件：

```bash
# 執行全部前端測試（Node.js 18+，含播放循環回歸測試）
npm test

# 執行後端 API 與曲目 JSON 資料結構完整性驗證 (54 項測試)
python3 test_phase1.py

# 執行 Eb 移調、音名與簡譜轉換測試 (23 項測試)
node test_pitch.test.mjs

# 執行 Web Audio Lookahead 排程器與 5 分鐘假時鐘無漂移測試 (6 項測試)
node test_scheduler.test.mjs

# 執行多音軌狀態、Mute/Solo 增益解析與 Lookahead 區間搜尋測試 (4 項測試)
node test_tracks.test.mjs
```

---

## 📁 專案目錄結構 (Project Structure)

```text
sax-play-along/
├── app.py                   # Flask 後端入口與 API Routes
├── requirements.txt         # Python 依賴套件清單
├── data/
│   └── songs/               # 曲目 JSON 資料庫
│       ├── ode-to-joy.json
│       ├── amazing-grace.json
│       ├── auld-lang-syne.json
│       └── detective-conan.json
├── static/
│   ├── css/
│   │   └── style.css        # 現代化 UI 與樂譜高亮樣式
│   ├── js/
│   │   ├── main.js          # 主進入點與事件綁定
│   │   ├── songLoader.js    # 曲目 API 異步載入
│   │   ├── pitch.js         # Eb 移調、音名與簡譜轉換邏輯
│   │   ├── score.js         # VexFlow 樂譜渲染與音符高亮
│   │   ├── schedulerMath.js # 純拍位計算與假時鐘數學邏輯
│   │   ├── scheduler.js     # Web Audio Lookahead 排程核心
│   │   ├── tracks.js        # 多音軌合成與 Mute/Solo 控制
│   │   └── ui.js            # 介面視圖切換與音軌面板動態渲染
│   └── vendor/
│       ├── vexflow.js       # VexFlow 5.0.0 本地離線檔案
│       └── bravura.woff2    # Bravura 音樂字型檔
├── templates/
│   └── index.html           # 主頁面 HTML 模板
├── test_phase1.py           # Phase 1 後端單元測試
├── test_pitch.test.mjs      # Phase 2 移調單元測試
├── test_scheduler.test.mjs  # Phase 3 排程器單元測試
└── test_tracks.test.mjs     # Phase 4 音軌單元測試
```

---

## 📄 授權 (License)

本專案及內建公有領域曲目皆採用 **Public Domain / MIT** 授權，歡迎自由學習、修改與擴充。
