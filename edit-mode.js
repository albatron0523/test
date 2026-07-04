// 共用的「編輯模式」模組：每個頁面 import 這個檔案並呼叫 initEditMode()
//
// 安全性提醒：這裡的「密碼」只是前端提示用，防止一般訪客誤觸編輯功能，
// 並不是真正的身分驗證——任何知道網址的人只要打開瀏覽器開發者工具，
// 都能繞過這個密碼直接呼叫 Firestore／Storage API。目前也還沒有限制
// 「誰能上傳檔案」，開放編輯模式的人都能上傳圖片／影片到 Firebase Storage，
// 沒有身分驗證、也沒有人工審核，這點請自行評估風險（例如可能被上傳
// 不當內容或大量檔案增加費用）。如果之後要防止濫用，需要加上 Firebase
// Auth 並修改 Storage／Firestore 規則。

import {
  saveField,
  saveNav,
  applyImageToBox,
  clearImageBox,
  renderTagList,
  renderMediaList,
  uploadMedia,
  applySectionOrder,
  getCurrentSectionOrder,
} from "./firebase-content.js";

const EDIT_PASSWORD = "2026";
const TEXT_COLORS = ["#e03131", "#f08c00", "#2f9e44", "#1971c2", "#9c36b5", "#e64980", "#495057", "#000000"];

let editModeOn = false;
let isDirty = false;
let toolbarEl = null;
let activeField = null;
let savedRange = null;

export function initEditMode() {
  injectToggleButton();
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

  try {
    document.execCommand("defaultParagraphSeparator", false, "br");
  } catch (e) {}

  document.querySelectorAll("[data-field]").forEach((el) => {
    el.setAttribute("contenteditable", "true");
    el.classList.add("is-editable");
    el.addEventListener("input", markDirty);
    el.addEventListener("blur", onFieldBlur);
  });

  injectSingleImageControls();
  injectMediaListEditing();
  injectNavEditing();
  injectTagListEditing();
  injectSectionControls();

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

  document.querySelectorAll(".img-controls, .media-item-controls").forEach((b) => b.remove());
  document.querySelectorAll(".media-add-btn").forEach((b) => b.remove());
  removeNavEditing();
  removeTagListEditing();
  removeSectionControls();

  document.removeEventListener("selectionchange", handleSelectionChange);
  window.removeEventListener("beforeunload", handleBeforeUnload);
  hideToolbar();
}

async function onFieldBlur(e) {
  const el = e.currentTarget;
  const ok = await saveField(window.PAGE_ID, el.dataset.field, el.innerHTML);
  if (ok) markClean();
}

// ---- 單張圖片／影片欄位：上傳、刪除、圖說 ----

function injectSingleImageControls() {
  document.querySelectorAll(".placeholder-box[data-img-field]").forEach((box) => {
    if (box.querySelector(":scope > .img-controls")) return;

    const controls = document.createElement("div");
    controls.className = "img-controls";

    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.className = "img-btn img-upload-btn";
    uploadBtn.textContent = "⬆";
    uploadBtn.title = "上傳圖片／影片";
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerUpload(box, box.dataset.imgField);
    });

    const captionBtn = document.createElement("button");
    captionBtn.type = "button";
    captionBtn.className = "img-btn img-caption-btn";
    captionBtn.textContent = "T";
    captionBtn.title = "新增／編輯圖說";
    captionBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      editCaptionForSingleImage(box);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "img-btn img-delete-btn";
    deleteBtn.textContent = "🗑";
    deleteBtn.title = "刪除圖片";
    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!window.confirm("確定要刪除這張圖片嗎？")) return;
      clearImageBox(box);
      injectSingleImageControls();
      markDirty();
      const ok = await saveField(window.PAGE_ID, box.dataset.imgField, "");
      if (ok) markClean();
    });

    controls.appendChild(uploadBtn);
    controls.appendChild(captionBtn);
    controls.appendChild(deleteBtn);
    box.appendChild(controls);
  });
}

function triggerUpload(box, field, onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,video/*";
  input.style.display = "none";
  document.body.appendChild(input);
  input.addEventListener("change", async () => {
    const file = input.files[0];
    input.remove();
    if (!file) return;
    box.classList.add("is-uploading");
    const result = await uploadMedia(file, `${window.PAGE_ID}-${field}`);
    box.classList.remove("is-uploading");
    if (!result) return;
    applyImageToBox(box, result.url, result.mediaType);
    box.dataset.imgUrl = result.url;
    box.dataset.mediaType = result.mediaType;
    if (onDone) {
      onDone(result);
    } else {
      markDirty();
      const ok1 = await saveField(window.PAGE_ID, field, result.url);
      const ok2 = await saveField(window.PAGE_ID, field + "_type", result.mediaType);
      if (ok1 && ok2) markClean();
      if (box.querySelectorAll(":scope > .img-controls").length === 0) injectSingleImageControls();
    }
  });
  input.click();
}

async function editCaptionForSingleImage(box) {
  const field = box.dataset.imgField;
  const current = box.querySelector(":scope > .media-caption");
  const currentText = current ? current.textContent : "";
  const text = window.prompt("圖說文字（留空可移除圖說）：", currentText);
  if (text === null) return;
  const position = window.confirm("圖說要顯示在圖片右方嗎？（取消＝顯示在下方）") ? "right" : "below";

  if (!text.trim()) {
    if (current) current.remove();
    box.classList.remove("caption-right", "caption-below");
  } else {
    let capEl = box.querySelector(":scope > .media-caption");
    if (!capEl) {
      capEl = document.createElement("div");
      capEl.className = "media-caption";
      box.appendChild(capEl);
    }
    capEl.textContent = text.trim();
    box.classList.toggle("caption-right", position === "right");
    box.classList.toggle("caption-below", position !== "right");
  }
  markDirty();
  const ok1 = await saveField(window.PAGE_ID, field + "_caption", text.trim());
  const ok2 = await saveField(window.PAGE_ID, field + "_captionPos", position);
  if (ok1 && ok2) markClean();
}

// ---- 圖片／影片清單（data-media-list：多張圖的網格，可新增／刪除／搬移） ----

function serializeMediaList(container) {
  return Array.from(container.querySelectorAll(":scope > .media-item")).map((box) => {
    const cap = box.querySelector(":scope > .media-caption");
    return {
      url: box.dataset.imgUrl || "",
      mediaType: box.dataset.mediaType || "image",
      caption: cap ? cap.textContent : "",
      captionPos: box.classList.contains("caption-right") ? "right" : "below",
    };
  });
}

async function saveMediaList(container) {
  const items = serializeMediaList(container);
  const ok = await saveField(window.PAGE_ID, container.dataset.mediaList, items);
  if (ok) markClean();
}

function setupMediaItemControls(box, container) {
  if (box.querySelector(":scope > .media-item-controls")) return;
  const controls = document.createElement("div");
  controls.className = "media-item-controls";

  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "img-btn";
  uploadBtn.textContent = "⬆";
  uploadBtn.title = "上傳圖片／影片";
  uploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerUpload(box, container.dataset.mediaList, () => saveMediaList(container));
  });

  const captionBtn = document.createElement("button");
  captionBtn.type = "button";
  captionBtn.className = "img-btn";
  captionBtn.textContent = "T";
  captionBtn.title = "新增／編輯圖說";
  captionBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = box.querySelector(":scope > .media-caption");
    const text = window.prompt("圖說文字（留空可移除圖說）：", current ? current.textContent : "");
    if (text === null) return;
    const position = window.confirm("圖說要顯示在圖片右方嗎？（取消＝顯示在下方）") ? "right" : "below";
    if (!text.trim()) {
      if (current) current.remove();
      box.classList.remove("caption-right", "caption-below");
    } else {
      let capEl = current;
      if (!capEl) {
        capEl = document.createElement("div");
        capEl.className = "media-caption";
        box.appendChild(capEl);
      }
      capEl.textContent = text.trim();
      box.classList.toggle("caption-right", position === "right");
      box.classList.toggle("caption-below", position !== "right");
    }
    markDirty();
    await saveMediaList(container);
  });

  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.className = "img-btn";
  leftBtn.textContent = "◀";
  leftBtn.title = "往前移";
  leftBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = box.previousElementSibling;
    if (prev && prev.classList.contains("media-item")) {
      container.insertBefore(box, prev);
      markDirty();
      await saveMediaList(container);
    }
  });

  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.className = "img-btn";
  rightBtn.textContent = "▶";
  rightBtn.title = "往後移";
  rightBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = box.nextElementSibling;
    if (next && next.classList.contains("media-item")) {
      container.insertBefore(next, box);
      markDirty();
      await saveMediaList(container);
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "img-btn img-delete-btn";
  deleteBtn.textContent = "🗑";
  deleteBtn.title = "刪除";
  deleteBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("確定要刪除這個項目嗎？")) return;
    box.remove();
    markDirty();
    await saveMediaList(container);
  });

  controls.appendChild(leftBtn);
  controls.appendChild(uploadBtn);
  controls.appendChild(captionBtn);
  controls.appendChild(rightBtn);
  controls.appendChild(deleteBtn);
  box.appendChild(controls);
}

function injectMediaListEditing() {
  document.querySelectorAll("[data-media-list]").forEach((container) => {
    container.querySelectorAll(":scope > .placeholder-box").forEach((box) => {
      box.classList.add("media-item");
      if (!box.dataset.imgUrl) box.dataset.imgUrl = "";
      setupMediaItemControls(box, container);
    });

    if (!container.querySelector(":scope > .media-add-btn")) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "media-add-btn placeholder-box";
      addBtn.textContent = "＋ 新增圖片";
      addBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const box = document.createElement("div");
        box.className = "placeholder-box media-item";
        box.dataset.imgUrl = "";
        box.textContent = "（空白圖片格）";
        container.insertBefore(box, addBtn);
        setupMediaItemControls(box, container);
        markDirty();
        await saveMediaList(container);
      });
      container.appendChild(addBtn);
    }
  });
}

// ---- 口味選項等「清單」的編輯 ----

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
  renderTagList(container, items);
  injectTagListEditing();
}

// ---- 文字區塊（section）：刪除／上下移動 ----

function injectSectionControls() {
  document.querySelectorAll("[data-section-id]").forEach((section) => {
    if (section.querySelector(":scope > .section-controls")) return;
    const controls = document.createElement("div");
    controls.className = "section-controls";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.textContent = "▲";
    upBtn.title = "往上移";
    upBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const prev = section.previousElementSibling;
      if (prev && prev.hasAttribute("data-section-id")) {
        section.parentElement.insertBefore(section, prev);
        markDirty();
        await saveField(window.PAGE_ID, "sectionOrder", getCurrentSectionOrder());
        markClean();
      }
    });

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.textContent = "▼";
    downBtn.title = "往下移";
    downBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const next = section.nextElementSibling;
      if (next && next.hasAttribute("data-section-id")) {
        section.parentElement.insertBefore(next, section);
        markDirty();
        await saveField(window.PAGE_ID, "sectionOrder", getCurrentSectionOrder());
        markClean();
      }
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "🗑 刪除此區塊";
    delBtn.className = "section-delete-btn";
    delBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!window.confirm("確定要刪除整個區塊嗎？（可以之後重新整理頁面把它救回來——除非再次儲存其他變更）")) return;
      section.style.display = "none";
      markDirty();
      await saveField(window.PAGE_ID, "sectionOrder", getCurrentSectionOrder());
      markClean();
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(delBtn);
    section.style.position = section.style.position || "relative";
    section.appendChild(controls);
  });
}

function removeSectionControls() {
  document.querySelectorAll(".section-controls").forEach((c) => c.remove());
}

// ---- 導覽選單（列表）編輯 ----

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
    if (editModeOn) e.preventDefault();
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
    btn.addEventListener("mousedown", (e) => e.preventDefault());
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
