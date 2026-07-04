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
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "span", "br"],
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

// 讀取 pages/{pageId} 這份文件，把裡面的欄位套進畫面上所有
// 帶有 data-field="欄位名稱" 或 data-img-field="欄位名稱" 屬性的元素
// （找不到文件或欄位就維持 HTML 裡原本的佔位內容）
export async function loadPageContent(pageId) {
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
  } catch (err) {
    console.error("[Firestore] 讀取內容失敗：", err);
  }
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
