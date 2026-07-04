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

## 2026-07-04（續 5）

**嘗試做的事情**：一次處理 6 項需求——改密碼、導覽選單與口味選項可編輯新增、修正「首頁」連結失效、離開/重載未儲存提醒、contenteditable 打字空行被吃掉的 bug、新增文字顏色功能。

**做法**：
1. 密碼常數從 `tastiway2026` 改成 `2026`（`edit-mode.js` 裡的 `EDIT_PASSWORD`）。
2. **空行被吃掉的排查與修正**：懷疑是瀏覽器在 `<p contenteditable>` 裡按 Enter 時，插入了不合法的巢狀 `<div>`（`<p>` 不能合法包住 `<div>`），這種不合法結構在存回 Firestore 或讀出來 sanitize 時可能被瀏覽器的 HTML parser 悄悄修正掉，導致空行消失。修法：進入編輯模式時執行 `document.execCommand('defaultParagraphSeparator', false, 'br')`，強制 Enter 一律插入 `<br>`；同時把 DOMPurify 的允許標籤清單加上 `div`/`p` 當作保險，避免萬一某些瀏覽器沒有遵守 defaultParagraphSeparator 設定時，換行結構被整個濾掉。（這個修正沒辦法 100% 保證在所有瀏覽器都測試過，如果之後還是遇到空行問題，要回來這裡記錄。）
3. **導覽選單改成資料驅動**：原本 3 個頁面各自寫死一份幾乎一樣的 `<nav>` HTML，改成每個頁面的 `<nav class="main-nav"><ul></ul></nav>` 都是空的，由 JS 的 `renderNav()` 統一渲染——資料來源是 Firestore 的 `pages/nav` 文件（欄位 `items`），沒有資料時 fallback 用 `firebase-content.js` 裡新增的 `DEFAULT_NAV` 常數（內容對應目前的選單結構）。這個改動**順便修好了「首頁」連結在產品頁面點了沒反應的問題**——因為 `DEFAULT_NAV` 的首頁項目 `href` 設為空字串，渲染時會自動補上 `window.PAGE_ROOT`（首頁是 `./`，產品頁是 `../../`），不再是寫死的 `#`。
4. 導覽選單與口味選項（`flavor-tags`）都做成「編輯模式下可以直接點文字修改、按 × 刪除、按 ＋ 新增」，資料結構分別存在 `pages/nav` 的 `items` 陣列，跟各頁面文件的 `flavors` 陣列欄位。
5. **未儲存變更提醒**：加了一個全域 `isDirty` 旗標，只要在編輯模式下打字（`input` 事件）就設成 true，成功存檔後才設回 false。監聽 `beforeunload`（重新整理/關分頁會跳出瀏覽器原生確認框）跟攔截所有 `<a>` 點擊（跳確認對話框，取消就 `preventDefault()`），以及「結束編輯」按鈕點擊時也會先確認。
6. **文字顏色功能**：工具列新增一個「🎨」按鈕，點了展開一排顏色色塊（7 種預設色，仿 Notion 的固定色盤而非任意選色），點選後用 Range API 包一個 `<span style="color:...">` 套用到選取的文字。

**結果**：✅ 成功，已 commit + push（commit `cc7d0ee`）。

**此路不通／需要注意的取捨**：
- 導覽選單的「新增項目」目前只能設定文字，新增的項目一律連到 `#`（還沒有對應頁面可以連），沒有做「輸入自訂連結網址」的 UI——如果之後要讓新增的選單項目能連到真正的頁面，需要再加一個輸入連結的介面，這次先沒做，範疇原本就沒有要求到這麼細。
- 空行修正是基於「已知的 contenteditable 巢狀標籤問題」去推論修正，**還沒有實際在多種瀏覽器（Chrome/Safari/Firefox）分別驗證過**，如果使用者之後測試發現某個瀏覽器還是會吃掉空行，要再回來查。

**目前狀態／待辦**：
- 已上線：https://albatron0523.github.io/test/ ，編輯密碼改為 `2026`。
- **使用者需要重新到 Firebase 主控台更新 Firestore 規則**（PROJECT.md 第 3 節新版規則，多加了 `nav` 這個允許寫入的 pageId），否則導覽選單的編輯會存不進去、一直跳回原本內容。
- 待使用者實際測試：空行問題是否真的修好、導覽選單編輯是否符合預期、顏色功能好不好用。

---

## 2026-07-04（續 6）

**嘗試做的事情**：口味標籤移到「產品介紹」上方、文字改深藍色、所有區塊標題（h2）改為可編輯、回答「能不能請你把圖片放進 images/ 資料夾」的問題。

**做法**：
1. 把 `.flavor-tags` 從「產品介紹」section 內部，搬到 h1 產品標題正下方、獨立用一個 `.section` 包住（維持一致的版面寬度/間距），呈現在「產品介紹」文字之前。
2. `.flavor-tags span` 的 CSS 加上 `color: #16305c;`（深藍色）與 `font-weight: 600`。
3. 三個頁面所有 `<h2>` 區塊標題都補上 `data-field`（例如 `introHeading`、`coreAdvantagesHeading`、`certHeading`...），讓標題文字在編輯模式下也能直接修改，行為跟其他文字欄位一致（存到 Firestore 對應頁面文件裡）。

**結果**：✅ 成功，已 commit + push（commit `b6d74d0`）。

**圖片上傳的回答**（不是程式問題，是能力範圍說明，已在對話中回覆使用者）：如果使用者本機已經有圖片檔案、能提供檔案路徑，我可以直接用 PowerShell 把檔案複製進 `images/` 資料夾並 commit + push，不需要使用者自己操作 git。但如果是「直接把圖片貼在對話框裡」這種方式，我目前的工具沒有辦法把對話裡看到的圖片存成檔案寫進專案——只能讀取/查看，沒有「另存新檔」的工具。所以精確的答案是：**有本機檔案路徑可以，純貼圖不行**，貼圖的情況需要使用者自己先存成檔案。

---

## 2026-07-04（續 7）

**嘗試做的事情**：這次需求量很大，一次處理：(1) 讓「任何打開編輯模式的人」都能直接在網頁上傳自己的圖片/影片檔案（回應上一輪「圖片上傳」的問題，從根本解決，不用再手動放進 `images/` 資料夾）(2) 文字顏色新增粉色 (3) 口味標籤字級太小要放大 (4) 文字區塊（例如「包裝資訊」整個）可以刪除或上下搬移 (5) 圖片欄位也要能刪除／新增／搬移，並且能在圖片下方或右方加圖說文字。

**做法**：
1. **改用 Firebase Storage 做真正的檔案上傳**：串接 `firebase-storage.js`（CDN），編輯模式下點圖片框的「⬆」按鈕會跳出瀏覽器原生的檔案選擇視窗，選好圖片/影片後直接 `uploadBytes()` 上傳到 Storage 的 `uploads/` 路徑，拿到 `getDownloadURL()` 回傳的網址後存進 Firestore（不再是存「檔名」去拼 `images/` 資料夾路徑那種舊做法，是真正上傳到雲端）。前端限制單檔 20MB、只能是 image/video 類型。
2. 舊的 `isSafeFilename` 匯出保留（回傳恆為 true）只是為了不要讓還沒改的呼叫端炸掉，實際上已經不再需要檔名檢查邏輯了（因為現在存的是 Storage 網址，不是使用者手打的檔名）。
3. 文字顏色調色盤 (`TEXT_COLORS`) 加入粉色 `#e64980`。
4. `.flavor-tags span` 字級從 0.8rem 加大到 1.15rem，padding 也加大配合。
5. **文字區塊可刪除／搬移**：幫每個 `<section>` 加上 `data-section-id`（例如 `intro`、`coreAdvantages`、`process`、`packaging`...），編輯模式下每個區塊右上角會有 ▲▼🗑 三個按鈕，刪除/搬移後把目前「還留著的區塊 id 順序」存成 Firestore 的 `sectionOrder` 陣列欄位，讀取頁面時依照這個陣列決定顯示哪些區塊、用什麼順序（不在陣列裡的視為已刪除，直接隱藏）。
6. **圖片欄位可刪除／新增／搬移＋圖說**：
   - 單張圖片（像 Hero banner、製程說明圖）：右上角按鈕組改成 ⬆ 上傳 / T 圖說 / 🗑 刪除三顆，刪除是清空該欄位（Firestore 存空字串）。
   - 多張圖片的網格（認證、獲獎、產品應用）：把整個網格標成 `data-media-list`，改成一個可管理的清單，每張圖有 ⬆ 上傳 / T 圖說 / ◀▶ 左右搬移 / 🗑 刪除，網格最後放一個「＋ 新增圖片」按鈕可以加新的空白格。
   - 圖說（caption）用 `prompt()` 輸入文字，另外用 `confirm()` 問是否要顯示在右側（取消＝顯示在下方），存成 `{欄位}_caption` 和 `{欄位}_captionPos` 兩個 Firestore 欄位（清單型的圖說則存在陣列的物件裡）。

**結果**：✅ 成功，已 commit + push（commit `731e81f`）。

**重要的安全性/成本考量（不是在問使用者，是主動告知的風險揭露）**：因為這個網站完全沒有接 Firebase Auth，「進入編輯模式的密碼」只是前端 UI 提示，不是真正的登入驗證。開放「任何進入編輯模式的人都能上傳檔案」這個功能後，代表任何打開瀏覽器開發者工具、知道密碼（寫死在前端 JS 裡，並不是真正保密）的人都能對 Storage 上傳任意檔案，沒有身分驗證也沒有人工審核，可能被濫用（上傳不當內容、或大量檔案增加 Firebase 帳單）。這件事已經寫進 PROJECT.md 的技術棧章節，**如果這個網站要正式對外公開讓客戶使用，強烈建議之後補上 Firebase Auth**，目前先以「功能可用、範疇不過度擴張」為主。

**此路不通／未做的部分**：
- 沒有做「拖曳排序（drag-and-drop）」，文字區塊跟圖片清單的搬移都是用 ▲▼／◀▶ 按鈕，一次移動一格——如果之後想要更直覺的拖曳排序，需要額外實作，這次先用按鈕達到同樣效果、風險/複雜度低很多。
- 刪除文字區塊目前只是「從 `sectionOrder` 陣列拿掉」，HTML 本身還在，理論上重新整理頁面後如果 `sectionOrder` 沒有正確存到，可能會讓被刪除的區塊又跑出來——這是已知的資料一致性邊界情況，還沒有特別加防護，如果使用者實測發現「刪除後重新整理又出現」，要回來這裡查。
- Logo（`logo-placeholder`）目前沒有給明確的 `data-img-field` 名稱，用的是自動編號，三個頁面編號可能對不上、也不會互相同步——如果需要三個頁面共用同一個 Logo，要另外處理（目前每個頁面要各自上傳一次 Logo）。

**目前狀態／待辦**：
- 已上線：https://albatron0523.github.io/test/
- **使用者需要在 Firebase 主控台新增 Storage 安全規則**（PROJECT.md 第 3 節新增的 Storage 規則區塊），因為這是第一次用到 Storage，之前只設定過 Firestore 的規則。
- 待使用者實際測試：上傳圖片/影片、刪除/搬移文字區塊、圖片清單的新增/搬移/圖說，這些都是這次新做的功能，還沒有機會被使用者實測過。

---

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
