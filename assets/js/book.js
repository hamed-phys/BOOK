import {
  bookDetailUrl,
  createCoverImage,
  createDriveAction,
  createEl,
  createProgress,
  createStatusBadge,
  decorateSite,
  formatDate,
  latestBookDate,
  loadJson,
  loadSiteConfig,
  relatedUpdates,
  sanitizeRuntimeData,
  setBaseLinks,
  siteHref,
  updateTypeLabel
} from "./common.js";

const page = document.getElementById("book-page");
const stateBox = document.getElementById("book-state");
const dataWarning = document.getElementById("data-warning");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setBaseLinks();
  const site = await loadSiteConfig();
  decorateSite(site, { updateDocumentTitle: false });
  const id = new URLSearchParams(location.search).get("id") || "";

  let booksRaw;
  try {
    booksRaw = await loadJson("data/books.json");
  } catch (error) {
    renderLoadError(error.message, site.title);
    return;
  }

  let updatesRaw = [];
  let updatesAvailable = true;
  try {
    updatesRaw = await loadJson("data/updates.json");
  } catch (error) {
    updatesAvailable = false;
  }

  const clean = sanitizeRuntimeData(booksRaw, updatesRaw);
  if (clean.warnings.length) {
    dataWarning.hidden = false;
    dataWarning.textContent = "تم تجاهل بعض السجلات غير الصالحة. راجع ملفات JSON أو أداة الصيانة.";
    console.warn("Data validation warnings:", clean.warnings);
  }

  const matches = clean.books.filter((book) => book.enabled && book.id === id);
  if (matches.length !== 1) {
    renderMissing(site.title);
    return;
  }
  const book = matches[0];
  const updates = clean.updates.filter((update) => update.book_id === book.id);
  document.title = `${book.title_ar} — ${site.title}`;
  renderBook(book, updates, updatesAvailable);
  scrollToHashAfterRender();
}

function renderBook(book, updates, updatesAvailable) {
  stateBox.replaceChildren();
  page.replaceChildren();
  page.hidden = false;

  const hero = createEl("section", { className: "book-detail-hero" });
  const coverWrap = createEl("div", { className: "detail-cover" });
  coverWrap.appendChild(createCoverImage(book, { lazy: false }));
  const content = createEl("div", { className: "detail-content" });
  const chips = createEl("div", { className: "card-topline" });
  chips.append(createStatusBadge(book.status), createEl("span", { className: "category-chip", text: book.category }));
  if (book.demo) chips.appendChild(createEl("span", { className: "demo-chip", text: "بيانات تجريبية" }));
  content.append(chips, createEl("h1", { text: book.title_ar }));
  if (book.title_en) content.appendChild(createEl("p", { className: "detail-title-en ltr", text: book.title_en, dir: "ltr" }));
  content.appendChild(createEl("p", { className: "lead", text: book.description, dir: "auto" }));

  const facts = createEl("dl", { className: "detail-facts" });
  addFact(facts, "المؤلف", book.author);
  addFact(facts, "التخصص", book.category);
  addFact(facts, "الإصدار الحالي", book.version, true);
  addFact(facts, "آخر تحديث معروض", formatDate(latestBookDate(book, updates)));
  content.appendChild(facts);
  const progress = createProgress(book.progress);
  if (progress) content.appendChild(progress);
  const actions = createEl("div", { className: "detail-actions" });
  actions.appendChild(createDriveAction(book.drive_url));
  actions.appendChild(createEl("a", { className: "button button-secondary", text: "العودة إلى الكتب", attrs: { href: siteHref("index.html#books") } }));
  content.appendChild(actions);
  hero.append(coverWrap, content);

  const history = createEl("section", { className: "history-section", attrs: { id: "updates", "aria-labelledby": "history-title" } });
  history.appendChild(createEl("div", { className: "section-heading" }));
  history.firstChild.append(createEl("p", { className: "eyebrow", text: "السجل الكامل" }), createEl("h2", { text: "تحديثات الكتاب", attrs: { id: "history-title" } }));

  if (!updatesAvailable) {
    history.appendChild(createEl("div", { className: "error-box", text: "سجل التحديثات غير متاح حاليًا بسبب تعذر تحميل data/updates.json. بيانات الكتاب الحالية ما زالت معروضة من books.json." }));
  } else {
    const sorted = relatedUpdates(book.id, updates);
    if (!sorted.length) {
      history.appendChild(createEl("p", { className: "state-message", text: "لا توجد تحديثات تاريخية مسجلة لهذا الكتاب بعد." }));
    } else {
      const list = createEl("ol", { className: "timeline" });
      for (const update of sorted) list.appendChild(renderHistoryItem(update, book));
      history.appendChild(list);
    }
  }
  page.append(hero, history);
}

function renderHistoryItem(update, book) {
  const item = createEl("li", { className: "timeline-item" });
  const head = createEl("div", { className: "timeline-head" });
  const meta = createEl("p", { className: "update-eyebrow" });
  meta.append(createEl("span", { text: updateTypeLabel(update.type) }), document.createTextNode(" · "), createEl("span", { text: formatDate(update.date) }));
  if (update.version) meta.append(document.createTextNode(" · "), createEl("bdi", { className: "ltr", text: update.version, dir: "ltr" }));
  head.append(meta, createEl("h3", { text: update.title }));
  item.append(head, createEl("p", { text: update.description, dir: "auto" }));

  if (update.drive_url) {
    const older = update.version && update.version !== book.version;
    const label = older ? "نسخة سابقة" : "ملف هذا الإصدار";
    const action = createDriveAction(update.drive_url, label);
    if (action.tagName === "A") action.classList.add("button-small");
    item.appendChild(action);
  } else {
    item.appendChild(createEl("p", { className: "microcopy", text: "لا يوجد ملف تاريخي مرتبط بهذا الحدث." }));
  }
  return item;
}

function addFact(dl, label, value, ltr = false) {
  const wrap = createEl("div", { className: "fact-row" });
  wrap.append(createEl("dt", { text: label }), createEl("dd", { text: value, dir: ltr ? "ltr" : "auto", className: ltr ? "ltr" : "" }));
  dl.appendChild(wrap);
}

function renderMissing(siteTitle) {
  document.title = `الكتاب غير موجود — ${siteTitle}`;
  page.hidden = true;
  const box = createEl("div", { className: "empty-page" });
  box.append(
    createEl("h1", { text: "الكتاب غير موجود" }),
    createEl("p", { text: "قد يكون المعرّف مفقودًا أو غير صحيح، أو أن الكتاب معطّل حاليًا في الكتالوج." }),
    createEl("a", { className: "button button-primary", text: "العودة إلى الصفحة الرئيسية", attrs: { href: siteHref("index.html") } })
  );
  stateBox.replaceChildren(box);
}

function renderLoadError(message, siteTitle) {
  document.title = `تعذر تحميل الكتاب — ${siteTitle}`;
  page.hidden = true;
  const box = createEl("div", { className: "empty-page error-box" });
  box.append(
    createEl("h1", { text: "تعذر تحميل بيانات الكتب" }),
    createEl("p", { text: message }),
    createEl("button", { className: "button button-secondary", text: "إعادة المحاولة", attrs: { type: "button" } }),
    createEl("a", { className: "text-link", text: "الصفحة الرئيسية", attrs: { href: siteHref("index.html") } })
  );
  box.querySelector("button").addEventListener("click", () => location.reload());
  stateBox.replaceChildren(box);
}

function scrollToHashAfterRender() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" })));
}
