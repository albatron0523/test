// 共用的 Firebase 初始化與內容讀取模組
// 每個頁面的 <script type="module"> 都會 import 這個檔案來讀取 Firestore 內容

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

// 讀取 pages/{pageId} 這份文件，把裡面的欄位套進畫面上所有
// 帶有 data-field="欄位名稱" 屬性的元素（找不到文件或欄位就維持 HTML 裡原本的佔位文字）
export async function loadPageContent(pageId) {
  try {
    const snap = await getDoc(doc(db, "pages", pageId));
    if (!snap.exists()) {
      console.info(`[Firestore] pages/${pageId} 尚未建立文件，目前顯示的是 HTML 裡的佔位文字。`);
      return;
    }
    const data = snap.data();
    document.querySelectorAll("[data-field]").forEach((el) => {
      const field = el.dataset.field;
      if (data[field] !== undefined) {
        el.textContent = data[field];
      }
    });
  } catch (err) {
    console.error("[Firestore] 讀取內容失敗：", err);
  }
}
