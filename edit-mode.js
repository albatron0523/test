// 共用的「編輯模式」模組：每個頁面 import 這個檔案並呼叫 initEditMode()
//
// 功能：
// 1. 頁面左上角固定一個「✎ 編輯模式」按鈕，點擊後要求輸入密碼才能進入編輯模式
// 2. 進入編輯模式後，所有 [data-field] 文字區塊變成可直接輸入（像 Notion 一樣），
//    選取文字時會跳出一個小工具列，可以設定粗體／斜體／底線／字級／文字顏色
// 3. 每個 .placeholder-box（圖片佔位框）右上角會出現一個小圓形按鈕，
//    點擊後可以輸入圖片檔名，套用並存檔
// 4. 導覽選單（列表）跟口味選項這類「清單」可以直接編輯文字、新增、刪除項目
// 5. 有未儲存的變更時，離開編輯模式／重新整理／點擊連結都會跳出確認提醒
// 6. 所有變更會即時寫回 Firestore（透過 firebase-content.js 的 saveField / saveNav）
//
// 安全性提醒：這裡的「密碼」只是前端提示用，防止一般訪客誤觸編輯功能，
// 並不是真正的身分驗證——Firestore 規則本身仍允許任何人對這幾份文件寫入
// （因為目前沒有串接 Firebase Auth）。如果之後要防止惡意訪客竄改內容，
// 需要另外加上 Firebase Auth + 對應的 Firestore 規則，而不能只靠這個密碼提示。

import { saveField, saveNav, applyImageToBox, isSafeFilename, renderTagList } from "./firebase-content.js";

const EDIT_PASSWORD = "2026";
const TEXT_COLORS = ["#e03131", "#f08c00", "#2f9e44", "#1971c2", "#9c36b5", "#495057", "#000000"];

let editModeOn = false;
let isDirty = false;
let toolbarEl = null;
let activeField = null;
let savedRange = null;

export function initEditMode() {
  injectToggleButton();
  // 連結攔截：不管有沒有在編輯模式，只要有未儲存變更就攔下點擊
  document.addEventListener("click", handleLinkClick, true);
}

function injectToggleButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "edit-mode-toggle";
  btn.textContent = "✎ 編輯模式";
  btn.addEventListener("click", onToggleClick);
  document.body.appendChild(btn);
}

function markDirty() {
  isDirty = true;
}

function markClean() {
  isDirty = false;
}

function confirmLeaveIfDirty(message) {
  if (!isDirty) return true;
  return window.confirm(message || "你有尚未儲存的變更，確定要離開嗎？（未儲存的內容可能會遺失）");
}

function handleBeforeUnload(e) {
  if (editModeOn && isDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
}

function handleLinkClick(e) {
  if (!editModeOn || !isDirty) return;
  const a = e.target.closest("a");
  if (!a) return;
  if (!confirmLeaveIfDirty()) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function onToggleClick() {
  if (editModeOn) {
    if (!confirmLeaveIfDirty("你有尚未儲存的變更，確定要結束編輯嗎？")) return;
    disableEditMode();
    return;
  }
  const pw = window.prompt("請輸入編輯密碼：");
  if (pw === null) return;
  if (pw !== EDIT_PASSWORD) {
    window.alert("密碼錯誤");
    return;
  }
  enableEditMode();
}

function enableEditMode() {
  editModeOn = true;
  markClean();
  document.getElementById("edit-mode-toggle").textContent = "✓ 結束編輯";
  document.getElementById("edit-mode-toggle").classList.add("is-active");

  // Enter 換行一律用 <br>，避免瀏覽器插入巢狀 <div>/<p> 導致空行被壓縮或整段被過濾掉
  try {
    document.execCommand("defaultParagraphSeparator", false, "br");
  } catch (e) {
    /* 部分瀏覽器可能不支援，忽略即可 */
  }

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.classList.add("is-editable");
    el.addEventListener("input", markDirty);
    el.addEventListener("blur", onFieldBlur);
  });

  injectImageButtons();
  injectNavEditing();
  injectTagListEditing();

  document.addEventListener("selectionchange", handleSelectionChange);
  window.addEventListener("beforeunload", handleBeforeUnload);
}

function disableEditMode() {
  editModeOn = false;
  markClean();
  document.getElementById("edit-mode-toggle").textContent = "✎ 編輯模式";
  document.getElementById("edit-mode-toggle").classList.remove("is-active");

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.classList.remove("is-editable");
    el.removeEventListener("input", markDirty);
    el.removeEventListener("blur", onFieldBlur);
  });

  document.querySelectorAll(".img-edit-btn").forEach((b) => b.remove());
  removeNavEditing();
  removeTagListEditing();

  document.removeEventListener("selectionchange", handleSelectionChange);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  hideToolbar();
}

async function onFieldBlur(e) {
  const el = e.currentTarget;
  const ok = await saveField(window.PAGE_ID, el.dataset.field, el.innerHTML);
  if (ok) markClean();
}

// ---- 圖片編輯（每個 .placeholder-box 右上角的小圓圈按鈕） ----

function injectImageButtons() {
  document.querySelectorAll(".placeholder-box").forEach((box, idx) => {
    if (!box.dataset.imgField) {
      box.dataset.imgField = `img_${idx}`;
    }
    if (box.querySelector(":scope > .img-edit-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "img-edit-btn";
    btn.textContent = "✎";
    btn.title = "更換圖片";
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = box.dataset.imgFilename || "";
      const filename = window.prompt(
        "請輸入圖片檔名（會從本專案的 images/ 資料夾讀取，例如：hero-banner.jpg）：",
        current
      );
      if (filename === null) return;
      const trimmed = filename.trim();
      if (trimmed === "") return;
      if (!isSafeFilename(trimmed)) {
        window.alert("檔名只能包含英數字、底線、破折號、點，且不能包含路徑符號。");
        return;
      }
      box.dataset.imgFilename = trimmed;
      applyImageToBox(box, trimmed);
      injectImageButtons(); // applyImageToBox 會清空 box 內容，按鈕要重新插入
      const ok = await saveField(window.PAGE_ID, box.dataset.imgField, trimmed);
      if (ok) markClean();
    });
    box.appendChild(btn);
  });
}

// ---- 口味選項等「清單」的編輯（新增／刪除／改文字） ----

function injectTagListEditing() {
  document.querySelectorAll("[data-list-field]").forEach((container) => {
    container.querySelectorAll(":scope > span").forEach((span) => {
      span.setAttribute("contenteditable", "true");
      span.classList.add("is-editable-tag");
      span.addEventListener("input", markDirty);
      span.addEventListener("blur", () => saveTagList(container));
      if (!span.querySelector(".tag-remove-btn")) {
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "tag-remove-btn";
        rm.textContent = "×";
        rm.title = "刪除";
        rm.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          span.remove();
          saveTagList(container);
        });
        span.appendChild(rm);
      }
    });

    if (!container.querySelector(":scope > .tag-add-btn")) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "tag-add-btn";
      addBtn.textContent = "＋ 新增";
      addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const span = document.createElement("span");
        span.textContent = "新選項";
        span.setAttribute("contenteditable", "true");
        span.classList.add("is-editable-tag");
        span.addEventListener("input", markDirty);
        span.addEventListener("blur", () => saveTagList(container));
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "tag-remove-btn";
        rm.textContent = "×";
        rm.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          span.remove();
          saveTagList(container);
        });
        span.appendChild(rm);
        container.insertBefore(span, addBtn);
        markDirty();
        span.focus();
        document.execCommand("selectAll", false, null);
      });
      container.appendChild(addBtn);
    }
  });
}

function removeTagListEditing() {
  document.querySelectorAll("[data-list-field]").forEach((container) => {
    container.querySelectorAll(":scope > span").forEach((span) => {
      span.removeAttribute("contenteditable");
      span.classList.remove("is-editable-tag");
      const rm = span.querySelector(".tag-remove-btn");
      if (rm) rm.remove();
    });
    const addBtn = container.querySelector(":scope > .tag-add-btn");
    if (addBtn) addBtn.remove();
  });
}

async function saveTagList(container) {
  const items = Array.from(container.querySelectorAll(":scope > span")).map((span) => {
    const clone = span.cloneNode(true);
    clone.querySelectorAll(".tag-remove-btn").forEach((b) => b.remove());
    return clone.textContent.trim();
  }).filter((t) => t !== "");
  const field = container.dataset.listField;
  const ok = await saveField(window.PAGE_ID, field, items);
  if (ok) markClean();
  // 重新畫過，確保畫面跟實際存檔的內容一致（例如刪掉空白項目後）
  renderTagList(container, items);
  injectTagListEditing();
}

// ---- 導覽選單（列表）編輯：改文字、新增、刪除項目 ----

function injectNavEditing() {
  const ul = document.querySelector(".main-nav > ul");
  if (!ul) return;

  ul.querySelectorAll(":scope > li").forEach((li) => {
    setupNavLink(li.querySelector(":scope > a"));
    addNavRemoveButton(li, ul);

    let subUl = li.querySelector(":scope > ul.submenu");
    if (li.classList.contains("has-submenu") && subUl) {
      subUl.querySelectorAll(":scope > li").forEach((subLi) => {
        setupNavLink(subLi.querySelector(":scope > a"));
        addNavRemoveButton(subLi, subUl);
      });
      addNavAddButton(subUl, true);
    }
  });

  addNavAddButton(ul, false);
}

function setupNavLink(a) {
  if (!a || a.dataset.navEditable === "true") return;
  a.dataset.navEditable = "true";
  a.setAttribute("contenteditable", "true");
  a.addEventListener("click", (e) => {
    if (editModeOn) e.preventDefault(); // 編輯模式中點選單文字是要編輯，不是要導覽
  });
  a.addEventListener("input", markDirty);
  a.addEventListener("blur", () => saveNavFromDom());
}

function addNavRemoveButton(li, parentUl) {
  if (li.querySelector(":scope > .nav-remove-btn")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-remove-btn";
  btn.textContent = "×";
  btn.title = "刪除此選單項目";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("確定要刪除這個選單項目嗎？")) return;
    li.remove();
    saveNavFromDom();
  });
  li.appendChild(btn);
}

function addNavAddButton(ul, isSubmenu) {
  if (ul.querySelector(":scope > .nav-add-btn")) return;
  const li = document.createElement("li");
  li.className = "nav-add-btn";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = isSubmenu ? "＋ 新增子選單" : "＋ 新增選單";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newLi = document.createElement("li");
    const newA = document.createElement("a");
    newA.textContent = "新選單項目";
    newA.href = "#";
    newA.dataset.navHref = "#";
    newLi.appendChild(newA);
    ul.insertBefore(newLi, li);
    setupNavLink(newA);
    addNavRemoveButton(newLi, ul);
    markDirty();
    newA.focus();
    document.execCommand("selectAll", false, null);
    saveNavFromDom();
  });
  li.appendChild(btn);
  ul.appendChild(li);
}

function removeNavEditing() {
  const ul = document.querySelector(".main-nav > ul");
  if (!ul) return;
  ul.querySelectorAll("a[data-nav-editable]").forEach((a) => {
    a.removeAttribute("contenteditable");
    a.removeAttribute("data-nav-editable");
  });
  ul.querySelectorAll(".nav-remove-btn, .nav-add-btn").forEach((el) => el.remove());
}

function serializeNav() {
  const ul = document.querySelector(".main-nav > ul");
  const items = [];
  ul.querySelectorAll(":scope > li").forEach((li) => {
    if (li.classList.contains("nav-add-btn")) return;
    const a = li.querySelector(":scope > a");
    if (!a) return;
    const item = { label: a.textContent.trim(), href: a.dataset.navHref || "#" };
    const subUl = li.querySelector(":scope > ul.submenu");
    if (subUl) {
      item.submenu = [];
      subUl.querySelectorAll(":scope > li").forEach((subLi) => {
        if (subLi.classList.contains("nav-add-btn")) return;
        const subA = subLi.querySelector(":scope > a");
        if (!subA) return;
        item.submenu.push({ label: subA.textContent.trim(), href: subA.dataset.navHref || "#" });
      });
    }
    items.push(item);
  });
  return items;
}

async function saveNavFromDom() {
  const items = serializeNav();
  const ok = await saveNav(items);
  if (ok) markClean();
}

// ---- Notion 風格文字工具列（粗體／斜體／底線／字級／顏色） ----

function ensureToolbar() {
  if (toolbarEl) return toolbarEl;

  toolbarEl = document.createElement("div");
  toolbarEl.className = "rte-toolbar";
  toolbarEl.innerHTML = `
    <button type="button" data-cmd="bold" title="粗體"><b>B</b></button>
    <button type="button" data-cmd="italic" title="斜體"><i>I</i></button>
    <button type="button" data-cmd="underline" title="底線"><u>U</u></button>
    <select data-cmd="fontsize" title="字級">
      <option value="">字級</option>
      <option value="14px">小</option>
      <option value="16px">中</option>
      <option value="20px">大</option>
      <option value="28px">特大</option>
    </select>
    <button type="button" class="rte-color-toggle" title="文字顏色">🎨</button>
    <div class="rte-color-palette">
      ${TEXT_COLORS.map((c) => `<button type="button" data-color="${c}" style="background:${c}"></button>`).join("")}
    </div>
  `;
  document.body.appendChild(toolbarEl);

  toolbarEl.querySelectorAll("button[data-cmd]").forEach((btn) => {
    btn.addEventListener("mousedown", (e) => e.preventDefault()); // 避免點按鈕時選取範圍被清掉
    btn.addEventListener("click", () => {
      restoreSelection();
      document.execCommand(btn.dataset.cmd);
      refreshSavedRange();
      saveActiveField();
    });
  });

  const sizeSelect = toolbarEl.querySelector('select[data-cmd="fontsize"]');
  sizeSelect.addEventListener("change", () => {
    const val = sizeSelect.value;
    restoreSelection();
    if (val) wrapSelectionWithStyle("fontSize", val);
    sizeSelect.value = "";
    saveActiveField();
  });

  const colorToggle = toolbarEl.querySelector(".rte-color-toggle");
  const palette = toolbarEl.querySelector(".rte-color-palette");
  colorToggle.addEventListener("mousedown", (e) => e.preventDefault());
  colorToggle.addEventListener("click", () => {
    palette.classList.toggle("is-open");
  });
  palette.querySelectorAll("button[data-color]").forEach((swatch) => {
    swatch.addEventListener("mousedown", (e) => e.preventDefault());
    swatch.addEventListener("click", () => {
      restoreSelection();
      wrapSelectionWithStyle("color", swatch.dataset.color);
      palette.classList.remove("is-open");
      saveActiveField();
    });
  });

  return toolbarEl;
}

function handleSelectionChange() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    hideToolbar();
    return;
  }
  const anchorEl = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  const editableParent = anchorEl ? anchorEl.closest('[data-field][contenteditable="true"]') : null;
  if (!editableParent) {
    hideToolbar();
    return;
  }
  activeField = editableParent;
  savedRange = sel.getRangeAt(0).cloneRange();
  showToolbarNear(savedRange);
}

function showToolbarNear(range) {
  const toolbar = ensureToolbar();
  const rect = range.getBoundingClientRect();
  toolbar.style.display = "flex";
  toolbar.style.top = `${window.scrollY + rect.top - 44}px`;
  toolbar.style.left = `${window.scrollX + rect.left}px`;
}

function hideToolbar() {
  if (toolbarEl) {
    toolbarEl.style.display = "none";
    toolbarEl.querySelector(".rte-color-palette").classList.remove("is-open");
  }
}

function restoreSelection() {
  if (!savedRange) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
}

function refreshSavedRange() {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0).cloneRange();
  }
}

function wrapSelectionWithStyle(cssProp, value) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.style[cssProp] = value;
  try {
    range.surroundContents(span);
  } catch (e) {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);
  savedRange = newRange.cloneRange();
}

function saveActiveField() {
  if (!activeField) return;
  markDirty();
  saveField(window.PAGE_ID, activeField.dataset.field, activeField.innerHTML).then((ok) => {
    if (ok) markClean();
  });
}
