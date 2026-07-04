# PROJECT.md — Tastiway 中文版複製專案

> 已簽約取得原網站授權，進行合法複製與中文化，非侵權行為。

## 1. 來源網站資訊

- **原網址（起點頁面）**：https://www.tastiway.com/product/freeze-dried-fruits/
- **網站根網址**：https://www.tastiway.com/
- **網站/公司名稱**：TASTIWAY SDN BHD（馬來西亞公司，公司註冊號 199201008775 (240278-T)）
- **網站功能與目的**：
  馬來西亞食品廠商 Tastiway 的官方形象暨電商導購網站。主打「凍乾水果（Freeze Dried Fruits）」等健康零食產品，網站內容涵蓋：
  - 品牌介紹（成立於 2000 年）與企業成長歷程
  - 完整產品線展示（凍乾水果、優格咬、即食食品、飲品、兒童零食等 9 大類）
  - OEM／原料代工服務介紹
  - 認證與獲獎紀錄展示（HACCP、GMP、ISO 22000、Halal、Kosher、BRC Food、SEDEX、MESTI 等）
  - 導購至第三方電商平台（Shopee、Lazada、TikTok）與官方 e-Shop
  - 徵才與聯絡資訊
- **總部地址**：No.165 & 166, Jalan BSG 4, Bandar Stargate, Alor Setar, Kedah, Malaysia
- **工廠地址**：No.88, Jalan Bukit Wang, 06000 Jitra, Kedah, Malaysia
- **聯絡方式**：電話 +604-771 9988／傳真 +604-772 5588／info@tastiway.com／ecommerce@tastiway.com

## 2. 頁面結構清單

### 主要導覽頁面
- [ ] 首頁 Home
- [ ] 關於我們 About（總覽）
  - [ ] Our Growth 我們的成長
  - [ ] Our Awards 獲獎紀錄
  - [ ] Certifications 認證
  - [ ] Our Events & Exhibitions 活動與展覽
  - [ ] Group of Companies 集團公司
- [ ] OEM & Raw Supply（代工與原料供應）
- [ ] 產品分類頁 Product（總覽／分類列表）
  - [ ] Freeze Dried Fruits 凍乾水果 ← 本次已詳細分析的起點頁面
  - [ ] Freeze Dried Yogurt Bites 凍乾優格咬
  - [ ] Instant Food 即食食品
  - [ ] Kids & Baby Selections 兒童嬰幼兒選擇
  - [ ] General Health & Wellness 健康與保健
  - [ ] Beverages 飲品
  - [ ] Ready To Drink Beverages 即飲飲品
  - [ ] Fruit's Cream Wafers 水果奶油威化餅
  - [ ] Sugar Free Lozenges 無糖錠劑
- [ ] e-Shop（電子商店）
  - [ ] What's New 最新消息
- [ ] Shop+（導向外部平台，可能只需做導流連結，不需重建頁面）
  - [ ] Shopee 連結
  - [ ] Lazada 連結
  - [ ] TikTok 連結
- [ ] Careers 職涯
- [ ] Contact 聯絡我們

### 「Freeze Dried Fruits」產品頁區塊清單（已詳細調查）
- [ ] 麵包屑導航（Home / FREEZE DRIED FRUITS / Freeze Dried Fruits）
- [ ] 產品介紹區（13 種水果口味：Apple、Dragon Fruit、Pineapple、Mulberry、Dates、Mango 等）
- [ ] 核心優勢說明（保留營養、無添加糖／防腐劑）
- [ ] 製程說明區（-40°C 冷凍乾燥技術說明）
- [ ] 包裝資訊區（鋁箔包裝、夾鏈設計、延長保存期限）
- [ ] 產品應用圖示區（熱帶水果／進口莓果／實際產品，三張分類圖）
- [ ] 嵌入宣傳影片（生活風格影片，.mov 格式）
- [ ] 認證標章區（9 項認證圖示）
- [ ] 獲獎區（5 項獎項徽章）
- [ ] 頁尾（Footer，見下方共用區塊）

### 全站共用區塊
- [ ] 頁首導覽列 Header/Navbar（含各下拉選單）
- [ ] 頁尾 Footer
  - [ ] 產品分類連結（10 項）
  - [ ] 總部／工廠聯絡資訊
  - [ ] 社群媒體連結（Facebook／Instagram／YouTube／TikTok）
  - [ ] 公司註冊號等法律資訊
- [ ] 首頁專屬區塊（如與其他頁不共用，需個別列出）
  - [ ] Hero Banner「Real Fruits Real Taste」
  - [ ] 品牌簡介（2000 年成立背景）
  - [ ] 活動展覽區塊
  - [ ] 獎項成就區塊
  - [ ] 認證資訊區塊
  - [ ] 產品分類展示（9 大類網格）
  - [ ] OEM 代工服務介紹
  - [ ] 核心價值（Safety／Quality／Health）
  - [ ] 社群媒體成長版塊
  - [ ] 國際分支據點（新加坡／中國／美國）
  - [ ] 品牌組合展示（9 個品牌標誌）
  - [ ] 型錄下載區

> 註：以上頁面/區塊清單目前僅針對首頁與「Freeze Dried Fruits」頁面實際瀏覽確認過，其餘產品子分類頁面（優格咬、即食食品等）結構應與此頁類似（同一套 WooCommerce 產品頁模板），但尚未逐一實際開啟核對，建議在「待辦事項」的素材抓取階段逐頁確認並勾選更新。

## 3. 技術棧記錄

- **CMS 平台**：WordPress
- **電商功能**：WooCommerce（產品頁面路徑與結構符合 WooCommerce 慣例，如 `woocommerce-placeholder-600x600.png`）
- **輪播/橫幅套件**：RevSlider（`wp-content/plugins/revslider/`）
- **證據來源**：
  - 圖片路徑含 `/wp-content/uploads/`
  - RevSlider 資源路徑 `revslider/sr6/assets/`
- **判斷結果**：這是傳統 WordPress + WooCommerce 網站，**非** React/Vue/Next.js 等前端框架構建。
- **重建方式建議**：
  - 若只需要靜態展示（不需要真的電商下單功能），建議用**純 HTML/CSS + 少量 JS**或輕量框架（如 Vite + React，比照我們另一個 Silerune 專案的做法）重建，會比架設 WordPress/WooCommerce 環境更簡單、部署更容易（可直接上 GitHub Pages / Vercel 等靜態託管）。
  - 若客戶未來需要在中文版網站上也能真的下單／串金流，才需要考慮完整重建 WooCommerce 環境。
  - **待確認**：跟需求方確認中文版是否需要保留購物車/結帳功能，或只需做導流連結到現有電商平台（Shopee/Lazada/TikTok）。此決定會直接影響技術棧選擇，請盡快確認並回填本節。

### 本專案（中文版）實際採用的技術棧

- **前端**：純 HTML + CSS + 少量原生 JavaScript（無 build 工具，無 npm/Vite）
- **內容資料庫**：Firebase Firestore（專案 ID：`tastiwaycn`，與 Silerune 使用的 `silerune-ee33e` 是不同的獨立 Firebase 專案）
  - 資料結構：collection `pages`，每個頁面一份文件（`pages/home`、`pages/freeze-dried-fruits`、`pages/freeze-dried-yogurt-bites`），另外還有一份共用的 `pages/nav`，存整個網站共用的導覽選單結構（`items` 欄位，陣列）
  - 每份頁面文件裡的欄位（如 `introText`、`coreAdvantagesText`、`processText`、`packagingText`、`heroTagline`、`brandIntroText`、`productTitle`、`flavors`（口味選項陣列），以及每個圖片框對應的 `img_0`、`img_1`...）對應頁面上 `data-field`／`data-img-field`／`data-list-field` 的元素，頁面載入時透過 `firebase-content.js` 讀取並套用；若 Firestore 還沒有對應文件/欄位，畫面會維持 HTML 裡寫死的佔位內容（不會出錯或空白）
  - 導覽選單（`pages/nav`）沒有資料時，會 fallback 用 `firebase-content.js` 裡的 `DEFAULT_NAV` 常數渲染（跟目前網站結構一致）
  - 圖片欄位存的是**檔名**（例如 `hero-banner.jpg`），不是完整網址，實際圖片檔案要放在專案的 `images/` 資料夾底下
- **編輯模式**（`edit-mode.js`）：每個頁面左上角有「✎ 編輯模式」按鈕，密碼是 `2026`，輸入後可以：
  - 直接點擊文字區塊輸入（`contenteditable`），選取文字會跳出工具列可設定粗體／斜體／底線／字級／**文字顏色**（Notion 風格的輕量版工具列，非完整的區塊編輯器）
  - 點擊每個圖片佔位框右上角的圓形按鈕，輸入 `images/` 資料夾裡的檔名來更換圖片
  - **導覽選單**：可直接編輯選單文字、新增／刪除頂層選單或子選單項目（新增的項目預設連到 `#`，還沒有對應頁面）
  - **口味選項（`flavor-tags`）**：可直接編輯文字、新增／刪除選項
  - 進入編輯模式後按 Enter 換行一律用 `<br>`（`document.execCommand('defaultParagraphSeparator', false, 'br')`），修正之前「打內文時空行被刪掉」的問題（原因是瀏覽器可能在 `<p contenteditable>` 裡插入巢狀 `<div>`，不合法的巢狀結構在存回/讀出時可能被壓縮掉）
  - 有未儲存的變更時，離開編輯模式、點擊任何連結、或重新整理／關閉分頁都會跳出確認提醒（`beforeunload` + 攔截連結點擊）
  - 上述變更會即時寫回 Firestore（呼叫 `firebase-content.js` 的 `saveField()` / `saveNav()`）
  - 文字內容用 `innerHTML` 顯示以保留格式，讀取時會用 **DOMPurify**（CDN 引入）過濾，只允許 `b/strong/i/em/u/span/br/div/p` 標籤與 `style` 屬性，避免被寫入惡意 HTML/script 造成 XSS
  - ⚠️ **安全性限制**：目前沒有接 Firebase Auth，「密碼」只是前端 UI 提示、防止一般訪客誤觸，**不是真正的身分驗證**。Firestore 規則層級允許任何人對這幾份頁面文件寫入（見下方規則），所以理論上有心人士仍可繞過網頁介面直接呼叫 Firestore API 竄改內容。如果未來要防止惡意竄改，需要另外導入 Firebase Auth + 依登入身分限制寫入的規則。
- **Firebase SDK 載入方式**：透過 CDN 直接 `import`（`https://www.gstatic.com/firebasejs/12.0.0/...`），不需要 npm install，適合這種沒有 build 流程的靜態網站
- **部署**：GitHub Pages（repo：https://github.com/albatron0523/test ）

**Firestore 安全規則**（已更新為允許寫入這幾份已知的頁面文件，新增了 `nav`）：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /pages/{pageId} {
      allow read: if true;
      allow write: if pageId in ['home', 'freeze-dried-fruits', 'freeze-dried-yogurt-bites', 'nav'];
    }
  }
}
```
（`nav` 是共用導覽選單資料，`home`/`freeze-dried-fruits`/`freeze-dried-yogurt-bites` 是各頁面內容。如果之前已經貼過舊版規則，這次要記得重新到 Firebase 主控台貼上新版並發布，不然導覽選單的編輯會存不進去。）

## 4. 素材清單

| 素材類型 | 說明 | 來源網址／路徑 | 狀態 |
|---|---|---|---|
| 企業 Logo | 頁首與頁尾共用 | 待抓取（`/wp-content/uploads/` 底下） | [ ] 待下載 |
| Hero Banner 主視覺 | 首頁「Real Fruits Real Taste」，約 1800×1000px | 待抓取 | [ ] 待下載 |
| 產品主視覺橫幅 | Freeze Dried Fruits 頁面頂部，約 1800×1000px | 待抓取 | [ ] 待下載 |
| 製程說明圖 | 約 1800×400px | 待抓取 | [ ] 待下載 |
| 產品實拍圖 | 約 800×800px，13 種口味各一張 | 待抓取 | [ ] 待下載 |
| 產品應用分類圖 | 熱帶水果／進口莓果／實際產品，共 3 張 | 待抓取 | [ ] 待下載 |
| 宣傳影片 | 產品生活風格影片，`.mov` 格式 | 待抓取確切網址 | [ ] 待下載 |
| 認證標章 | HACCP、GMP、ISO 22000、Halal、Kosher、BRC Food、SEDEX、Green Electricity Tariff、MESTI，共 9 個圖示 | 待抓取 | [ ] 待下載 |
| 獎項徽章 | Enterprise 50 Award、Honesty Enterprise Keris Award、Power Brand Awards、Malaysia Best Brand 2022 等，共 5 個 | 待抓取 | [ ] 待下載 |
| 品牌組合 Logo | 首頁「品牌組合展示」9 個品牌標誌 | 待抓取 | [ ] 待下載 |
| 型錄 PDF | 首頁「型錄下載」連結的檔案 | 待抓取 | [ ] 待下載 |
| 字型 | 尚未檢查網站實際使用的 Web Font（Google Fonts／自架字型檔） | 待確認 | [ ] 待確認 |

> 目前僅完成「文字內容與頁面結構」層級的調查，**尚未實際下載任何圖片/影片檔案**，也還沒查看網頁原始碼中確切的圖片/字型檔案網址。素材清單的網址欄位待「抓取素材」階段逐一補齊。務必確認取得授權範圍是否包含這些素材本身的重製使用權，而不只是頁面架構的重製權。

## 5. 翻譯對照表

> 以下為預留表格，翻譯進行時逐行填入。建議依「頁面」分區塊記錄，方便追蹤各頁進度。

### Freeze Dried Fruits 產品頁

| 原文（英文） | 中文翻譯 | 狀態 |
|---|---|---|
| Freeze Dried Fruits | | [ ] |
| Real Fruits Real Taste | | [ ] |
| (製程說明段落原文，待逐句填入) | | [ ] |
| (包裝說明段落原文，待逐句填入) | | [ ] |

### 全站共用（導覽列／頁尾）

| 原文（英文） | 中文翻譯 | 狀態 |
|---|---|---|
| Home | | [ ] |
| About | | [ ] |
| OEM & Raw Supply | | [ ] |
| Product | | [ ] |
| e-Shop | | [ ] |
| Careers | | [ ] |
| Contact | | [ ] |

*（其餘頁面翻譯對照表待各頁面開始翻譯時，依同樣格式新增區塊）*

## 6. 待辦事項清單

- [ ] 確認需求：中文版是否需要真的電商下單功能，或僅需靜態展示＋導流連結
- [ ] 逐頁瀏覽並確認其餘產品子分類頁面的結構是否與「Freeze Dried Fruits」頁一致，更新第 2 節頁面清單
- [ ] 確認素材授權範圍（是否可重製圖片/影片/Logo，或需自行重新拍攝製作）
- [ ] 建立網站骨架（依技術棧決策，用 Vite/React 或純 HTML 建立專案結構、路由）
- [ ] 抓取／下載所有素材（圖片、影片、Logo、認證標章、型錄 PDF），依第 4 節素材清單逐一取得並存放於專案內
- [ ] 逐頁提取原文文字內容，填入第 5 節翻譯對照表
- [ ] 逐頁翻譯成中文，更新翻譯對照表狀態
- [ ] 依翻譯內容套版，重建各頁面 HTML/元件結構
- [ ] 樣式調整（RWD 響應式排版、字體、色彩、間距，比對原站視覺）
- [ ] 內部連結／導覽列串接（確保頁面間連結、下拉選單正確）
- [ ] 跨瀏覽器／裝置測試
- [ ] 部署上線
- [ ] 上線後與原網站逐頁核對，確認無遺漏或翻譯錯誤

---

*最後更新：本檔案為專案啟動時建立，後續請隨進度勾選並更新對應章節。*
