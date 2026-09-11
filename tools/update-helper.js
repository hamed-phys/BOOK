import {
  STATUS_MAP,
  UPDATE_TYPE_MAP,
  VERSION_RE,
  ID_RE,
  cloneJson,
  getSafeDriveUrl,
  isSafeCoverPath,
  isValidDateString,
  loadJson,
  setBaseLinks,
  validateDataset
} from "../assets/js/common.js";

const state = { books: null, updates: null, source: "" };
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

function init() {
  setBaseLinks();
  fillSelects();
  bindEvents();
  loadPublished();
}

function fillSelects() {
  for (const [value, label] of Object.entries(STATUS_MAP)) $("book-status").appendChild(new Option(label, value));
  for (const [value, label] of Object.entries(UPDATE_TYPE_MAP)) $("update-type").appendChild(new Option(label, value));
}

function bindEvents() {
  $("reload-published").addEventListener("click", loadPublished);
  $("import-both").addEventListener("click", importLocalFiles);
  $("book-mode").addEventListener("change", syncBookMode);
  $("book-select").addEventListener("change", fillBookFormFromSelection);
  $("book-form").addEventListener("submit", saveBook);
  $("update-form").addEventListener("submit", addUpdate);
  $("validate-all").addEventListener("click", validateAndRender);
  $("download-books").addEventListener("click", () => downloadJson("books.json", state.books));
  $("download-updates").addEventListener("click", () => downloadJson("updates.json", state.updates));
  $("copy-books").addEventListener("click", () => copyOutput("books-output"));
  $("copy-updates").addEventListener("click", () => copyOutput("updates-output"));
  $("refresh-output").addEventListener("click", renderOutputs);
}

async function loadPublished() {
  setStatus("جاري تحميل النسخ المنشورة…", "info");
  disableEditing(true);
  try {
    const [books, updates] = await Promise.all([loadJson("data/books.json"), loadJson("data/updates.json")]);
    acceptArrays(books, updates, "النسخ المنشورة");
  } catch (error) {
    state.books = null;
    state.updates = null;
    renderOutputs();
    setStatus(`فشل التحميل: ${error.message} لم يتم استبدال البيانات بمصفوفات فارغة. أصلح المشكلة أو استورد الملفين معًا.`, "error");
  }
}

async function importLocalFiles() {
  const booksFile = $("books-file").files[0];
  const updatesFile = $("updates-file").files[0];
  if (!booksFile || !updatesFile) {
    setStatus("اختر books.json و updates.json معًا قبل الاستيراد.", "error");
    return;
  }
  try {
    const [books, updates] = await Promise.all([readJsonFile(booksFile), readJsonFile(updatesFile)]);
    acceptArrays(books, updates, "ملفان محليان");
  } catch (error) {
    setStatus(`تعذر الاستيراد: ${error.message}`, "error");
  }
}

function readJsonFile(file) {
  return file.text().then((text) => {
    try { return JSON.parse(text); }
    catch { throw new Error(`${file.name} ليس JSON صالحًا.`); }
  });
}

function acceptArrays(books, updates, source) {
  const result = validateDataset(books, updates);
  if (!result.valid) {
    state.books = null;
    state.updates = null;
    renderValidation(result.errors);
    renderOutputs();
    setStatus(`لم يتم قبول ${source} لأن التحقق فشل.`, "error");
    return;
  }
  state.books = cloneJson(books);
  state.updates = cloneJson(updates);
  state.source = source;
  renderValidation([]);
  populateBookSelectors();
  syncBookMode();
  renderOutputs();
  disableEditing(false);
  setStatus(`تم تحميل ${source} بنجاح. التعديلات التالية محلية في الذاكرة فقط حتى تنزيل الملفات ورفعها إلى GitHub.`, "success");
}

function disableEditing(disabled) {
  for (const id of ["book-fieldset", "update-fieldset", "validate-all", "download-books", "download-updates", "refresh-output"]) {
    const el = $(id);
    if (el) el.disabled = disabled;
  }
}

function populateBookSelectors() {
  const bookSelect = $("book-select");
  const updateBook = $("update-book-id");
  bookSelect.replaceChildren();
  updateBook.replaceChildren();
  if (!state.books) return;
  for (const book of state.books) {
    bookSelect.appendChild(new Option(`${book.title_ar} — ${book.id}`, book.id));
    updateBook.appendChild(new Option(`${book.title_ar} — ${book.id}`, book.id));
  }
}

function syncBookMode() {
  const edit = $("book-mode").value === "edit";
  $("book-select-wrap").hidden = !edit;
  $("book-id").readOnly = edit;
  $("book-id-help").textContent = edit ? "المعرّف مقفول أثناء التعديل العادي لأنه دائم." : "استخدم أحرفًا إنجليزية صغيرة وأرقامًا وشرطات، ولا تغيّره لاحقًا.";
  if (edit) fillBookFormFromSelection(); else clearBookForm();
}

function fillBookFormFromSelection() {
  if (!state.books) return;
  const book = state.books.find((item) => item.id === $("book-select").value);
  if (!book) return;
  const fields = ["id", "title_ar", "title_en", "author", "category", "cover", "status", "version", "last_updated", "description", "drive_url"];
  for (const field of fields) $(`book-${field.replaceAll("_", "-")}`).value = book[field] ?? "";
  $("book-progress").value = book.progress === null || book.progress === undefined ? "" : String(book.progress);
  $("book-enabled").checked = book.enabled;
  $("book-demo").checked = book.demo;
}

function clearBookForm() {
  $("book-form").reset();
  $("book-mode").value = "add";
  $("book-enabled").checked = true;
  $("book-demo").checked = false;
  $("book-id").readOnly = false;
}

function bookFromForm() {
  const progressRaw = $("book-progress").value.trim();
  return {
    id: $("book-id").value.trim(),
    title_ar: $("book-title-ar").value.trim(),
    title_en: $("book-title-en").value.trim(),
    author: $("book-author").value.trim(),
    category: $("book-category").value.trim(),
    cover: $("book-cover").value.trim(),
    status: $("book-status").value,
    version: $("book-version").value.trim(),
    progress: progressRaw === "" ? null : Number(progressRaw),
    last_updated: $("book-last-updated").value,
    description: $("book-description").value.trim(),
    drive_url: $("book-drive-url").value.trim(),
    enabled: $("book-enabled").checked,
    demo: $("book-demo").checked
  };
}

function saveBook(event) {
  event.preventDefault();
  if (!state.books || !state.updates) return;
  const next = bookFromForm();
  const mode = $("book-mode").value;
  const draftBooks = cloneJson(state.books);

  if (mode === "edit") {
    const index = draftBooks.findIndex((book) => book.id === $("book-select").value);
    if (index < 0) return setStatus("تعذر العثور على الكتاب المحدد.", "error");
    draftBooks[index] = { ...draftBooks[index], ...next, id: draftBooks[index].id };
  } else {
    draftBooks.push(next);
  }

  const result = validateDataset(draftBooks, state.updates);
  if (!result.valid) {
    renderValidation(result.errors);
    setStatus("لم يتم حفظ التعديل لأن التحقق فشل.", "error");
    return;
  }
  state.books = draftBooks;
  renderValidation([]);
  populateBookSelectors();
  $("book-mode").value = "edit";
  $("book-select").value = next.id;
  syncBookMode();
  renderOutputs();
  setStatus(mode === "edit" ? "تم تعديل الكتاب في الذاكرة مع الحفاظ على الحقول غير المعروفة وسجل التحديثات." : "تمت إضافة الكتاب في الذاكرة. تذكّر إضافة حدث release عند نشر أول PDF حقيقي.", "success");
}

function updateFromForm() {
  return {
    id: $("update-id").value.trim(),
    book_id: $("update-book-id").value,
    date: $("update-date").value,
    version: $("update-version").value.trim(),
    type: $("update-type").value,
    title: $("update-title").value.trim(),
    description: $("update-description").value.trim(),
    drive_url: $("update-drive-url").value.trim()
  };
}

function addUpdate(event) {
  event.preventDefault();
  if (!state.books || !state.updates) return;
  const next = updateFromForm();
  const draftUpdates = [next, ...cloneJson(state.updates)];
  const result = validateDataset(state.books, draftUpdates);
  if (!result.valid) {
    renderValidation(result.errors);
    setStatus("لم تتم إضافة التحديث لأن التحقق فشل.", "error");
    return;
  }
  state.updates = draftUpdates;
  renderValidation([]);
  renderOutputs();
  $("update-form").reset();
  populateBookSelectors();
  setStatus("تمت إضافة التحديث في بداية updates.json داخل الذاكرة، مع الاحتفاظ بكل السجل السابق.", "success");
}

function validateAndRender() {
  if (!state.books || !state.updates) return;
  const result = validateDataset(state.books, state.updates);
  renderValidation(result.errors);
  setStatus(result.valid ? "التحقق الكامل نجح. يمكنك تنزيل الملفين البديلين." : "التحقق فشل. أصلح الأخطاء قبل التنزيل.", result.valid ? "success" : "error");
  toggleDownloads(result.valid);
}

function renderValidation(errors) {
  const box = $("validation-errors");
  box.replaceChildren();
  if (!errors.length) {
    box.appendChild(document.createTextNode("لا توجد أخطاء تحقق حاليًا."));
    box.className = "validation-box success-box";
    toggleDownloads(Boolean(state.books && state.updates));
    return;
  }
  const ul = document.createElement("ul");
  for (const error of errors) {
    const li = document.createElement("li");
    li.textContent = error;
    ul.appendChild(li);
  }
  box.appendChild(ul);
  box.className = "validation-box error-box";
  toggleDownloads(false);
}

function toggleDownloads(enabled) {
  $("download-books").disabled = !enabled;
  $("download-updates").disabled = !enabled;
}

function renderOutputs() {
  $("books-output").value = state.books ? `${JSON.stringify(state.books, null, 2)}\n` : "";
  $("updates-output").value = state.updates ? `${JSON.stringify(state.updates, null, 2)}\n` : "";
}

function downloadJson(filename, value) {
  if (!value) return;
  const result = validateDataset(state.books, state.updates);
  if (!result.valid) {
    renderValidation(result.errors);
    return setStatus("تم منع التنزيل لأن البيانات الحالية غير صالحة.", "error");
  }
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyOutput(id) {
  const textarea = $(id);
  try {
    await navigator.clipboard.writeText(textarea.value);
    setStatus("تم نسخ JSON إلى الحافظة.", "success");
  } catch {
    textarea.focus();
    textarea.select();
    setStatus("تعذر الوصول إلى الحافظة تلقائيًا. تم تحديد النص؛ استخدم Ctrl+C أو Copy يدويًا.", "info");
  }
}

function setStatus(message, kind) {
  const box = $("helper-status");
  box.textContent = message;
  box.dataset.kind = kind;
}
