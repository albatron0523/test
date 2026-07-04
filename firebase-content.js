// 共用的 Firebase 初始化、內容讀取與寫入模組
// 每個頁面的 <script type="module"> 都會 import 這個檔案來讀取／寫入 Firestore 內容

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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
export const storage = getStorage(app);

// 文字欄位允許保留的格式標籤／樣式（其餘一律過濾掉，避免公開可寫入的 Firestore
// 資料被拿來做 XSS 攻擊——這個網站的編輯功能沒有真正的登入驗證，只有前端密碼
// 提示，Firestore 規則本身仍允許任何人寫入，所以「讀取時」一定要做這層過濾）
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "span", "br", "div", "p"],
  ALLOWED_ATTR: ["style"],
};

function sanitizeHtml(html) {
  if (typeof window.DOMPurify === "undefined") {
    console.error("[安全性] DOMPurify 未載入，為避免 XSS 風險，改用純文字顯示。");
    const tmp = document.createElement("div");
    tmp.textContent = html;
    return tmp.textContent;
  }
  return window.DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB，跟 Storage 規則的限制對齊

// 把檔案上傳到 Firebase Storage，回傳 { url, mediaType }
export async function uploadMedia(file, pathHint) {
  if (!file) return null;
  if (file.size > MAX_UPLOAD_BYTES) {
    window.alert("檔案太大了（上限 20MB），請換一個較小的檔案。");
    return null;
  }
  if (!/^image\/|^video\//.test(file.type)) {
    window.alert("只能上傳圖片或影片檔案。");
    return null;
  }
  const mediaType = file.type.startsWith("video/") ? "video" : "image";
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const path = `uploads/${pathHint}-${Date.now()}-${safeName}`;
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, mediaType };
  } catch (err) {
    console.error("[Storage] 上傳失敗：", err);
    window.alert("上傳失敗，請檢查網路連線或 Storage 規則設定。");
    return null;
  }
}

// 導覽選單的預設結構（Firestore 裡的 pages/nav 文件還沒建立時使用這份 fallback）
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

// ---- 文字區塊（section）順序／顯示狀態 ----
// sectionOrder 存目前「還留著」的 section id，依畫面上的順序排列；
// 沒有在陣列裡的 section 一律隱藏（代表被刪除了）
export function applySectionOrder(order) {
  if (!Array.isArray(order)) return;
  const sections = {};
  document.querySelectorAll("[data-section-id]").forEach((s) => {
    sections[s.dataset.sectionId] = s;
    s.style.display = "none";
  });
  let anchor = null;
  order.forEach((id) => {
    const s = sections[id];
    if (!s) return;
    s.style.display = "";
    if (anchor) {
      anchor.after(s);
    }
    anchor = s;
  });
}

export function getCurrentSectionOrder() {
  return Array.from(document.querySelectorAll("[data-section-id]"))
    .filter((s) => s.style.display !== "none")
    .map((s) => s.dataset.sectionId);
}

// ---- 單張圖片／影片欄位（data-img-field） ----

export function applyImageToBox(el, url, mediaType) {
  el.innerHTML = "";
  el.classList.add("has-image");
  const media = document.createElement(mediaType === "video" ? "video" : "img");
  media.src = url;
  if (mediaType === "video") {
    media.controls = true;
  } else {
    media.alt = "";
  }
  el.appendChild(media);
}

export function clearImageBox(el) {
  el.innerHTML = "";
  el.classList.remove("has-image");
}

function renderCaption(container, text, position) {
  let capEl = container.querySelector(":scope > .media-caption");
  if (!text) {
    if (capEl) capEl.remove();
    return;
  }
  if (!capEl) {
    capEl = document.createElement("div");
    capEl.className = "media-caption";
    container.appendChild(capEl);
  }
  capEl.textContent = text;
  container.classList.toggle("caption-right", position === "right");
  container.classList.toggle("caption-below", position !== "right");
}

// ---- 圖片／影片清單（data-media-list，例如認證區、獲獎區這類多張圖的網格） ----

export function renderMediaList(container, items) {
  container.querySelectorAll(":scope > .media-item").forEach((el) => el.remove());
  const addBtn = container.querySelector(":scope > .media-add-btn");
  (items || []).forEach((item) => {
    const box = document.createElement("div");
    box.className = "placeholder-box media-item";
    if (item.url) {
      applyImageToBox(box, item.url, item.mediaType);
    } else {
      box.textContent = "（空白圖片格）";
    }
    if (item.caption) {
      renderCaption(box, item.caption, item.captionPos);
    }
    if (addBtn) container.insertBefore(box, addBtn);
    else container.appendChild(box);
  });
}

// ---- 讀取／套用頁面內容 ----

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
      const url = data[field];
      if (url) {
        el.dataset.imgUrl = url;
        el.dataset.mediaType = data[field + "_type"] || "image";
        applyImageToBox(el, url, el.dataset.mediaType);
      }
      const caption = data[field + "_caption"];
      if (caption) {
        renderCaption(el, caption, data[field + "_captionPos"]);
      }
    });

    document.querySelectorAll("[data-list-field]").forEach((el) => {
      const field = el.dataset.listField;
      if (Array.isArray(data[field])) {
        renderTagList(el, data[field]);
      }
    });

    document.querySelectorAll("[data-media-list]").forEach((el) => {
      const field = el.dataset.mediaList;
      if (Array.isArray(data[field])) {
        renderMediaList(el, data[field]);
      }
    });

    if (Array.isArray(data.sectionOrder)) {
      applySectionOrder(data.sectionOrder);
    }
  } catch (err) {
    console.error("[Firestore] 讀取內容失敗：", err);
  }
}

export function renderTagList(container, items) {
  container.querySelectorAll(":scope > span").forEach((s) => s.remove());
  const addBtn = container.querySelector(":scope > .tag-add-btn");
  items.forEach((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    if (addBtn) container.insertBefore(span, addBtn);
    else container.appendChild(span);
  });
}

export async function saveField(pageId, field, value) {
  try {
    await setDoc(doc(db, "pages", pageId), { [field]: value, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] 寫入欄位 ${field} 失敗：`, err);
    return false;
  }
}

export const isSafeFilename = () => true; // 保留匯出名稱以相容舊呼叫（已改用真正上傳，不再需要檔名檢查）
