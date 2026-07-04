# LOG.md — 操作日誌

> 記錄每次實際操作的嘗試與結果。失敗的嘗試務必記錄錯誤訊息原文與「此路不通」的結論；
> 成功的解法要跟失敗的嘗試明確分開標記，方便之後接手的人快速掌握哪些路已經試過。

---

## 2026-07-04

**嘗試做的事情**：建立專案骨架，調查來源網站 https://www.tastiway.com/product/freeze-dried-fruits/ 的結構，撰寫 PROJECT.md 與 LOG.md。

**做法**：
1. 在桌面建立 `TastiwayCN` 資料夾作為專案根目錄。
2. 用 WebFetch 分別抓取「Freeze Dried Fruits」產品頁與首頁，確認頁面結構、導覽選單、頁尾內容、技術棧線索。
3. 依調查結果撰寫 `PROJECT.md`。

**結果**：✅ 成功。

**發現**：
- 網站確認為 WordPress + WooCommerce 建構（路徑含 `/wp-content/uploads/`、`woocommerce-placeholder-600x600.png`、RevSlider 外掛路徑），非前端框架 SPA。
- 已完整記錄首頁與 Freeze Dried Fruits 頁面的區塊結構、導覽列/頁尾連結。
- 其餘 8 個產品子分類頁面（優格咬、即食食品等）**尚未逐一實際開啟核對**，僅推測結構與已調查頁面類似，已在 PROJECT.md 中標註為待確認事項。

**目前狀態／待辦**：
- 尚未下載任何圖片、影片、Logo 等素材檔案，也還沒查看網頁原始碼取得確切素材網址。
- 尚未與需求方確認中文版是否需要真的電商下單功能，此點會影響後續技術棧選擇（純靜態 vs. 完整 WooCommerce 重建）。
- 下一步預計：逐頁核對其餘產品分類頁面結構 → 抓取素材網址清單。

---

## 2026-07-04（續）

**嘗試做的事情**：在 GitHub 建立公開 repo `test`，並上傳「凍乾水果」產品頁的版面骨架，透過 GitHub Pages 讓使用者可直接用網址瀏覽。

**做法**：
1. 檢查本機是否有 GitHub CLI (`gh`)，發現未安裝。
2. 用 `winget install --id GitHub.cli` 安裝，**第一次安裝時系統管理員權限視窗被取消，安裝失敗**（exit code 12 / 1602，使用者按錯選項）。
3. 重新執行同一個 `winget install` 指令，這次順利完成安裝。
4. 執行 `gh auth login --hostname github.com --git-protocol https --web`，由於此指令需要瀏覽器互動登入，會卡住等待輸入，改用背景執行（`run_in_background`），取得一次性驗證碼後請使用者自行到瀏覽器完成登入，登入完成後用 `gh auth status` 確認成功（帳號 albatron0523）。
5. `git init` + `git add` + `git commit` 建立本地 repo，用 `gh repo create test --public --source=. --remote=origin --push` 一次建立遠端 repo 並 push。
6. 撰寫版面骨架：`index.html`（首頁）、`product/freeze-dried-fruits/index.html`（產品頁）、`style.css`。**重要決策：文字與圖片全部使用中性佔位內容，不重製原網站的實際文案／產品照片／Logo／認證圖示**，原因是無法確認客戶與 Tastiway 的授權合約範圍是否涵蓋「公開上傳逐字複製版本」這種使用方式；已跟使用者確認過這個做法（選項：用占位內容建架構）。
7. 用 `gh api -X POST repos/albatron0523/test/pages -f "source[branch]=main" -f "source[path]=/"` 啟用 GitHub Pages，輪詢 `gh api repos/albatron0523/test/pages` 直到 `status` 變成 `built`。

**結果**：✅ 成功。

**此路不通（第一次嘗試）**：`winget install --id GitHub.cli` 第一次執行時，UAC 系統管理員權限視窗被關閉／取消，導致安裝程式回傳「您取消了安裝」，exit code 1602。**原因**：使用者當下誤觸取消，非程式或指令本身的問題。**解法**：原指令不變，重新執行一次，這次在 UAC 視窗點「是」即可正常安裝，之後沒有再遇到這個問題。

**最終解法**：
- GitHub CLI 安裝：`winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements`（第二次執行成功）。
- 登入：`gh auth login --hostname github.com --git-protocol https --web`，因為需要使用者在瀏覽器輸入一次性驗證碼，此指令必須用背景模式執行，並把輸出裡的驗證碼／網址轉告使用者手動完成，無法全自動化。
- 建立並推送 repo：`gh repo create <name> --public --source=. --remote=origin --push` 可以一步完成建立遠端 repo、設定 remote、push 三件事，比手動在網頁建立再 `git remote add` 快。
- 啟用 Pages：`gh api -X POST repos/<owner>/<repo>/pages -f "source[branch]=main" -f "source[path]=/"`，啟用後不會立即生效，需要輪詢 `gh api repos/<owner>/<repo>/pages` 直到 `status` 從 `null`/`building` 變成 `built`，通常等待約 20 秒內完成。

**目前狀態／待辦**：
- 已上線：https://albatron0523.github.io/test/ （首頁）與 https://albatron0523.github.io/test/product/freeze-dried-fruits/ （產品頁骨架）。
- 目前頁面全部是佔位文字與灰底佔位圖框，尚未套用任何正式授權的翻譯文案或素材圖片。
- 下一步待使用者決定：是否提供實際授權素材（文案、圖片）以便替換佔位內容；若要替換為正式內容並保留公開瀏覽，需重新評估 repo 是否要改為 private。

---

## 2026-07-04（續 2）

**嘗試做的事情**：修正導覽選單問題並簡化選單項目。
1. 使用者反應：滑鼠沒有滑到「產品」等按鈕上時，子選單細項就已經直接列出來，畫面很亂。
2. 導覽列頂層只留「首頁」「關於我們」「產品」「聯絡我們」四項，移除「代工與原料供應」「電子商店」「職涯」。
3. 「產品」子選單只留「凍乾水果」「凍乾優格咬」兩項。

**排查過程**：檢查 `style.css`，發現 `.submenu { display: none; }` 雖然有寫，但 `.main-nav ul { display: flex; ... }` 這條規則的 CSS 選擇器權重（specificity: 1 class + 1 element = 11）比 `.submenu`（1 class = 10）還高，而且 `.submenu` 這個 `<ul>` 本身也是 `.main-nav` 底下的 `ul`，所以會被 `.main-new ul` 的 `display:flex` 蓋過去，導致子選單永遠是顯示狀態，hover 完全不會發生作用。

**此路不通**：一開始以為只是漏寫 `:hover` 規則，但檢查後發現 `:hover` 規則其實已經存在（`.main-nav .has-submenu:hover .submenu { display: block; }`），問題不在有沒有寫 hover 規則，而是「預設隱藏」那條規則的權重不夠、被別的規則蓋掉，純粹是 CSS specificity 的問題。

**最終解法**：把預設隱藏的選擇器從 `.submenu` 改成 `.main-nav .submenu`（2 個 class，權重 20），權重超過 `.main-nav ul`（11），子選單才會真正預設隱藏，再靠 `:hover` 規則（權重更高）顯示。

**結果**：✅ 成功。同時新增了「凍乾優格咬」骨架頁面（`product/freeze-dried-yogurt-bites/index.html`），讓簡化後的產品選單連結不會 404，並更新首頁頁面清單、footer 產品分類連結。

**目前狀態／待辦**：已 commit + push（commit `4dda537`），GitHub Pages 會自動重新部署。「關於我們」的子選單目前維持原本 5 個項目沒有變動（使用者這次只要求簡化頂層與「產品」子選單）。

---

## 2026-07-04（續 3）

**嘗試做的事情**：把網站接上 Firebase Firestore，並建立首頁完整骨架、修正下拉選單動畫。

**做法**：
1. 使用者已在 Firebase 主控台手動建立新專案 `tastiwaycn` 並啟用 Firestore（測試模式），提供了 `firebaseConfig`。
2. 原本打算用 `firebase-tools` CLI（`npm install -g firebase-tools`）建立/管理專案，執行 `firebase login --no-localhost`。
3. 建立 `firebase-content.js`：用 CDN 方式（`https://www.gstatic.com/firebasejs/12.0.0/...`）以 ES module 初始化 Firebase App + Firestore，並寫了 `loadPageContent(pageId)` 函式，讀取 `pages/{pageId}` 文件，把欄位套進頁面上帶 `data-field` 屬性的元素。
4. 在首頁與兩個產品頁的 `<script type="module">` 裡呼叫 `loadPageContent("home" / "freeze-dried-fruits" / "freeze-dried-yogurt-bites")`。
5. 建立首頁完整骨架（原本首頁只是兩行連結清單），區塊包含：Hero banner、主標語、品牌簡介、產品分類（依使用者要求只放 2 項）、核心價值、活動展覽、認證、獲獎、國際據點、型錄下載、共用頁尾。
6. 修正下拉選單「一開始就直接出現、不美觀」的問題：把 `display:none/block` 切換方式改成 `opacity` + `transform` + `transition`，讓子選單變成淡入淡出＋輕微上滑的動畫效果。

**結果**：⚠️ 部分成功。

**此路不通**：`firebase login --no-localhost` 與 `firebase login:ci --no-localhost` 都直接報錯 `Cannot run login in non-interactive mode.` / `Cannot run login:ci in non-interactive mode.`，在指令一開始就被拒絕，沒有機會進入任何互動流程（跟稍早 `gh auth login` 不一樣——`gh` 是先印出驗證碼才等待，`firebase` CLI 則是偵測到沒有 TTY 就直接整個拒絕執行，`--help` 裡也沒有找到可以強制略過這個檢查的參數）。**原因**：這個工具執行環境沒有附加真正的互動式終端機（TTY），而 firebase-tools 的登入指令會主動偵測並拒絕在這種環境下執行，跟 gh CLI 的容忍度不同。

**最終解法**：放棄用 firebase-tools CLI 建立/管理 Firebase 專案，改成請使用者自己到 **Firebase 主控台網頁**手動建立專案、啟用 Firestore、註冊 Web App 拿到 `firebaseConfig`，再把設定貼給我，由我把設定寫進 `firebase-content.js`。前端讀取 Firestore的部分完全不需要 CLI，用瀏覽器端 SDK（CDN 版）即可，所以 CLI 登入卡關並不影響最終功能的完成。

**目前狀態／待辦**：
- 已 commit + push（commit `340de43`），GitHub Pages 會自動重新部署。
- Firestore 目前**還沒有任何實際文件**（`pages/home`、`pages/freeze-dried-fruits`、`pages/freeze-dried-yogurt-bites` 都不存在），所以現在網站顯示的還是 HTML 裡寫死的佔位文字（程式已確認：文件不存在時會 fallback 顯示原本文字，不會報錯或空白）。
- 待使用者依教學步驟到 Firestore 主控台手動建立第一份文件測試，確認「改 Firestore 資料 → 網站顯示跟著變」這個循環真的有跑通。
- Firestore 安全規則已提供新版本（`pages` collection 公開讀、禁止寫入），待使用者貼到主控台的規則分頁發布，取代原本的「測試模式」規則（測試模式規則 30 天後會失效）。

---

## 2026-07-04（續 4）

**嘗試做的事情**：
1. 確認使用者反應「首頁還是只有頁面清單」的問題。
2. 新增完整的「編輯模式」：左上角編輯按鈕、文字可直接輸入並有 Notion 風格工具列（粗體/斜體/底線/字級）、圖片框右上角圓形按鈕可輸入檔名更換圖片，變更即時存回 Firestore。

**排查「首頁只有頁面清單」**：用 WebFetch 直接抓取 https://albatron0523.github.io/test/ 確認，發現首頁其實**已經是完整骨架**（Hero banner、品牌簡介、產品分類、核心價值、認證、獲獎、國際據點、型錄下載等都在），不是只有頁面清單。**結論**：這應該是使用者瀏覽器快取到上一版內容，建議之後遇到「明明改了但看不到」的狀況，先請使用者硬刷新（Ctrl+Shift+R）或開無痕視窗再確認，不要急著懷疑是部署失敗。

**做法**：
1. 因為文字內容現在要保留粗體/字級等格式，`firebase-content.js` 的讀取方式從 `textContent` 改成 `innerHTML`。**這帶出一個資安考量**：Firestore 目前沒有接 Firebase Auth，寫入權限本質上是對外開放的（見下方規則），如果直接把 Firestore 存的字串塞進 `innerHTML`，惡意使用者理論上可以寫入 `<script>` 或帶惡意屬性的標籤造成 XSS，影響所有訪客。
2. 引入 **DOMPurify**（CDN：`cdn.jsdelivr.net/npm/dompurify@3.2.4`），讀取時用白名單（只允許 `b/i/u/span` 標籤與 `style` 屬性）過濾後才塞進 `innerHTML`，從根本降低風險。
3. 圖片欄位設計成存「檔名」而不是完整網址（例如 `hero-banner.jpg`），並限制檔名字元（只能英數字/底線/破折號/點，不能有 `/` 或 `..`），避免路徑穿越或塞入 `javascript:` 之類的內容。實際圖片檔案要放在專案的 `images/` 資料夾。
4. 建立 `edit-mode.js`：密碼保護的編輯模式切換按鈕、contentEditable 文字區塊、選取文字彈出的浮動工具列（用 Range API 自己包 `<span style="font-size:...">`，粗體/斜體/底線則用瀏覽器原生的 `document.execCommand`）、圖片框的圓形按鈕與 prompt 輸入。
5. 更新 Firestore 規則，把原本「完全禁止寫入」改成「只允許對 `home`／`freeze-dried-fruits`／`freeze-dried-yogurt-bites` 這三份已知文件寫入」，否則編輯模式無法真的存檔。

**結果**：✅ 成功（程式碼已 commit + push，commit `28348f2`），但有清楚記錄一個已知限制，不算是「完全解決」：

**已知限制／未解決**：目前的「編輯密碼」只是前端 JavaScript 裡的一個字串比對（`tastiway2026`），純粹是防止一般訪客手滑點到編輯按鈕，**不是真正的身分驗證**。因為 Firestore 規則本身允許任何人對這三份文件寫入（不然編輯功能存不了檔），技術上有心人士還是可以繞過網頁介面、直接呼叫 Firestore API 竄改內容，密碼擋不住這種攻擊。這個限制已經寫進 PROJECT.md 的技術棧章節。**如果之後要真正防止惡意竄改，必須加上 Firebase Auth（例如 Google 登入）＋依登入身分限制寫入的規則**，目前為了先求功能可用、範疇不要無限擴大，先不做這塊。

**目前狀態／待辦**：
- 已上線：https://albatron0523.github.io/test/ ，三個頁面左上角都有「✎ 編輯模式」按鈕，密碼是 `tastiway2026`。
- 使用者需要把新版 Firestore 規則（PROJECT.md 第 3 節）貼到 Firebase 主控台發布，否則編輯模式的存檔會被規則擋掉。
- `images/` 資料夾目前是空的（只有一個說明用的 README.md），使用者要放真正的授權圖片檔案進去，編輯模式才能選到真的圖片。
- 待確認：使用者是否需要更完整的 Notion 式編輯體驗（例如區塊拖曳排序、標題階層、插入清單等），目前只做了粗體/斜體/底線/字級，選字後出現浮動工具列這個基本版本。

---

<!--
新增記錄範本（複製此區塊填寫）：

## YYYY-MM-DD HH:MM

**嘗試做的事情**：

**結果**：✅ 成功 / ❌ 失敗 / ⚠️ 部分成功

**錯誤訊息原文**（若失敗，貼上完整錯誤訊息）：
```
```

**此路不通的原因**（若嘗試了某方法但行不通）：

**最終解法**（跟上面失敗的嘗試明確分開標記）：

**目前狀態／待辦**：

-->
