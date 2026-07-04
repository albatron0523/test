// 共用的「編輯模式」模組：每個頁面 import 這個檔案並呼叫 initEditMode()
//
// 功能：
// 1. 頁面左上角固定一個「✎ 編輯模式」按鈕，點擊後要求輸入密碼才能進入編輯模式
// 2. 進入編輯模式後，所有 [data-field] 文字區塊變成可直接輸入（像 Notion 一樣），
//    選取文字時會跳出一個小工具列，可以設定粗體／斜體／底線／字級
// 3. 每個 .placeholder-box（圖片佔位框）右上角會出現一個小圓形按鈕，
//    點擊後可以輸入圖片檔名，套用並存檔
// 4. 所有變更會即時寫回 Firestore（透過 firebase-content.js 的 saveField）
//
// 安全性提醒：這裡的「密碼」只是前端提示用，防止一般訪客誤觸編輯功能，
// 並不是真正的身分驗證——Firestore 規則本身仍允許任何人對這幾份文件寫入
// （因為目前沒有串接 Firebase Auth）。如果之後要防止惡意訪客竄改內容，
// 需要另外加上 Firebase Auth + 對應的 Firestore 規則，而不能只靠這個密碼提示。

import { saveField } from "./firebase-content.js";
import { applyImageToBox, isSafeFilename } from "./firebase-content.js";

const EDIT_PASSWORD = "tastiway2026";

let editModeOn = false;
let toolbarEl = null;
let activeField = null;
let savedRange = null;

export function initEditMode() {
  injectToggleButton();
}

function injectToggleButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "edit-mode-toggle";
  btn.textContent = "✎ 編輯模式";
  btn.addEventListener("click", onToggleClick);
  document.body.appendChild(btn);
}

function onToggleClick() {
  if (editModeOn) {
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
  document.getElementById("edit-mode-toggle").textContent = "✓ 結束編輯";
  document.getElementById("edit-mode-toggle").classList.add("is-active");

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.classList.add("is-editable");
    el.addEventListener("blur", onFieldBlur);
  });

  injectImageButtons();
  document.addEventListener("selectionchange", handleSelectionChange);
}

function disableEditMode() {
  editModeOn = false;
  document.getElementById("edit-mode-toggle").textContent = "✎ 編輯模式";
  document.getElementById("edit-mode-toggle").classList.remove("is-active");

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.classList.remove("is-editable");
    el.removeEventListener("blur", onFieldBlur);
  });

  document.querySelectorAll(".img-edit-btn").forEach((b) => b.remove());
  document.removeEventListener("selectionchange", handleSelectionChange);
  hideToolbar();
}

function onFieldBlur(e) {
  const el = e.currentTarget;
  saveField(window.PAGE_ID, el.dataset.field, el.innerHTML);
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
    btn.addEventListener("click", (e) => {
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
      saveField(window.PAGE_ID, box.dataset.imgField, trimmed);
    });
    box.appendChild(btn);
  });
}

// ---- Notion 風格文字工具列（粗體／斜體／底線／字級） ----

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
  if (toolbarEl) toolbarEl.style.display = "none";
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
  saveField(window.PAGE_ID, activeField.dataset.field, activeField.innerHTML);
}
