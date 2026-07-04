// 共用的 Firebase 初始化、內容讀取與寫入模組
// 每個頁面的 <script type="module"> 都會 import 這個檔案來讀取／寫入 Firestore 內容

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBP9F-EN0Gqbd7jxqA73Fl97fpgBywB3UM",
  authDomain: "tastiwaycn.firebaseapp.com",
  projectId: "tastiwaycn",
  storageBucket: "tastiwaycn.firebasestorage.app",
  messagingSenderId: "671061247973",
  appId: "1:671061247973:web:b8b1b1ae8c60320700910c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 文字欄位允許保留的格式標籤／樣式（其餘一律過濾掉，避免公開可寫入的 Firestore
// 資料被拿來做 XSS 攻擊——這個網站的編輯功能沒有真正的登入驗證，只有前端密碼
// 提示，Firestore 規則本身仍允許任何人寫入，所以「讀取時」一定要做這層過濾）
// 註：div/p 也放進允許清單，是為了避免瀏覽器在 contenteditable 裡按 Enter 產生的
// 換行用區塊被整個濾掉，導致「打字時空行被吃掉」的問題。
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "span", "br", "div", "p"],
  ALLOWED_ATTR: ["style"],
};

function sanitizeHtml(html) {
  if (typeof window.DOMPurify === "undefined") {
    // DOMPurify 沒載入成功時，寧可完全不顯示格式化內容，也不要冒風險直接塞 innerHTML
    console.error("[安全性] DOMPurify 未載入，為避免 XSS 風險，改用純文字顯示。");
    const tmp = document.createElement("div");
    tmp.textContent = html;
    return tmp.textContent;
  }
  return window.DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

// 圖片欄位存的是「檔名」，不是完整網址（避免使用者貼任意外部網址／javascript: 之類的內容）。
// 檔名只允許英數字、底線、破折號、點（單一），不允許 / \ 或 ..，避免跳出 images/ 資料夾範圍。
const SAFE_FILENAME_RE = /^[A-Za-z0-9._-]+$/;

export function isSafeFilename(filename) {
  return SAFE_FILENAME_RE.test(filename) && !filename.includes("..");
}

// 導覽選單的預設結構（Firestore 裡的 pages/nav 文件還沒建立時使用這份 fallback，
// 讓每個頁面都是透過同一個 renderNav() 畫出來，而不是各自寫死 HTML，
// 這樣「編輯模式」改了選單之後，才能真正對所有頁面都生效）。
// href 是「相對於網站根目錄」的路徑，實際連結會自動補上 window.PAGE_ROOT 前綴。
export const DEFAULT_NAV = [
  { label: "首頁", href: "" },
  {
    label: "關於我們",
    href: "#",
    submenu: [
      { label: "我們的成長", href: "#" },
      { label: "獲獎紀錄", href: "#" },
      { label: "認證", href: "#" },
      { label: "活動與展覽", href: "#" },
      { label: "集團公司", href: "#" },
    ],
  },
  {
    label: "產品",
    href: "#",
    submenu: [
      { label: "凍乾水果", href: "product/freeze-dried-fruits/" },
      { label: "凍乾優格咬", href: "product/freeze-dried-yogurt-bites/" },
    ],
  },
  { label: "聯絡我們", href: "#" },
];

function resolveNavHref(href) {
  if (!href || href === "#") return "#";
  return (window.PAGE_ROOT || "./") + href;
}

// 依照 items 陣列重新畫出 .main-nav > ul 的內容
export function renderNav(items) {
  const ul = document.querySelector(".main-nav > ul");
  if (!ul || !Array.isArray(items)) return;
  ul.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.label;
    a.href = resolveNavHref(item.href);
    a.dataset.navHref = item.href || "#";
    li.appendChild(a);
    if (item.submenu && item.submenu.length) {
      li.classList.add("has-submenu");
      const subUl = document.createElement("ul");
      subUl.className = "submenu";
      item.submenu.forEach((sub) => {
        const subLi = document.createElement("li");
        const subA = document.createElement("a");
        subA.textContent = sub.label;
        subA.href = resolveNavHref(sub.href);
        subA.dataset.navHref = sub.href || "#";
        subLi.appendChild(subA);
        subUl.appendChild(subLi);
      });
      li.appendChild(subUl);
    }
    ul.appendChild(li);
  });
}

// 讀取共用的導覽選單資料（存在 pages/nav 這份文件裡）
export async function loadNav() {
  try {
    const snap = await getDoc(doc(db, "pages", "nav"));
    if (!snap.exists()) return null;
    return snap.data().items || null;
  } catch (err) {
    console.error("[Firestore] 讀取導覽選單失敗：", err);
    return null;
  }
}

export async function saveNav(items) {
  return saveField("nav", "items", items);
}

// 讀取 pages/{pageId} 這份文件，把裡面的欄位套進畫面上所有
// 帶有 data-field / data-img-field / data-list-field 屬性的元素，
// 並套用共用的導覽選單。（找不到文件或欄位就維持 HTML 裡原本的佔位內容）
export async function loadPageContent(pageId) {
  const navItems = await loadNav();
  renderNav(navItems || DEFAULT_NAV);

  try {
    const snap = await getDoc(doc(db, "pages", pageId));
    if (!snap.exists()) {
      console.info(`[Firestore] pages/${pageId} 尚未建立文件，目前顯示的是 HTML 裡的佔位內容。`);
      return;
    }
    const data = snap.data();

    document.querySelectorAll("[data-field]").forEach((el) => {
      const field = el.dataset.field;
      if (data[field] !== undefined) {
        el.innerHTML = sanitizeHtml(data[field]);
      }
    });

    document.querySelectorAll("[data-img-field]").forEach((el) => {
      const field = el.dataset.imgField;
      const filename = data[field];
      if (filename && isSafeFilename(filename)) {
        el.dataset.imgFilename = filename;
        applyImageToBox(el, filename);
      }
    });

    document.querySelectorAll("[data-list-field]").forEach((el) => {
      const field = el.dataset.listField;
      if (Array.isArray(data[field])) {
        renderTagList(el, data[field]);
      }
    });
  } catch (err) {
    console.error("[Firestore] 讀取內容失敗：", err);
  }
}

// 把一組文字陣列畫成 .flavor-tags 裡面的 <span> 清單（用於「口味選項」這類可增減的標籤列表）
export function renderTagList(container, items) {
  container.querySelectorAll(":scope > span").forEach((s) => s.remove());
  const addBtn = container.querySelector(":scope > .tag-add-btn");
  items.forEach((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    if (addBtn) {
      container.insertBefore(span, addBtn);
    } else {
      container.appendChild(span);
    }
  });
}

// 把圖片檔名套用到一個 .placeholder-box 元素上（清空原本的佔位文字，改顯示圖片）
// 檔名會拼上 window.IMAGE_BASE_PATH（每個頁面在自己的 HTML 裡設定，因為路徑深度不同）
export function applyImageToBox(el, filename) {
  el.innerHTML = "";
  el.classList.add("has-image");
  const img = document.createElement("img");
  img.src = (window.IMAGE_BASE_PATH || "images/") + filename;
  img.alt = "";
  el.appendChild(img);
}

// 把單一欄位寫回 Firestore（merge，不影響其他欄位）
export async function saveField(pageId, field, value) {
  try {
    await setDoc(doc(db, "pages", pageId), { [field]: value, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] 寫入欄位 ${field} 失敗：`, err);
    return false;
  }
}
