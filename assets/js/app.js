import {
  STATUS_MAP,
  announce,
  bookDetailUrl,
  compareArabic,
  createCoverImage,
  createDriveAction,
  createEl,
  createProgress,
  createStatusBadge,
  decorateSite,
  formatDate,
  formatNumber,
  latestBookDate,
  loadJson,
  loadSiteConfig,
  normalizeSearch,
  relatedUpdates,
  sanitizeRuntimeData,
  setBaseLinks,
  siteHref,
  truncateText,
  updateTypeLabel
} from "./common.js";

const state = {
  books: [],
  updates: [],
  updatesAvailable: true,
  site: null,
  query: "",
  category: "all",
  status: "all",
  sort: "latest"
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  setBaseLinks();
  state.site = await loadSiteConfig();
  decorateSite(state.site);
  bindControls();

  try {
    const booksRaw = await loadJson("data/books.json");
    let updatesRaw = [];
    try {
      updatesRaw = await loadJson("data/updates.json");
    } catch (error) {
      state.updatesAvailable = false;
      showUpdatesUnavailable(error.message);
    }
    const clean = sanitizeRuntimeData(booksRaw, updatesRaw);
    state.books = clean.books.filter((book) => book.enabled);
    state.updates = clean.updates.filter((update) => state.books.some((book) => book.id === update.book_id));
    if (clean.warnings.length) showDataWarnings(clean.warnings);
    populateFilters();
    renderCatalog();
    if (state.updatesAvailable) renderRecentUpdates();
  } catch (error) {
    showCatalogError(error.message);
    showUpdatesUnavailable("تعذر تحميل قائمة الكتب، لذلك لا يمكن عرض التحديثات الآن.");
  }
}

function cacheElements() {
  for (const id of ["search", "category-filter", "status-filter", "sort", "reset-filters", "catalog-grid", "result-count", "recent-updates", "catalog-state", "updates-state", "data-warning"]) {
    els[id] = document.getElementById(id);
  }
}

function bindControls() {
  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderCatalog();
  });
  els["category-filter"].addEventListener("change", () => {
    state.category = els["category-filter"].value;
    renderCatalog();
  });
  els["status-filter"].addEventListener("change", () => {
    state.status = els["status-filter"].value;
    renderCatalog();
  });
  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    renderCatalog();
  });
  els["reset-filters"].addEventListener("click", () => {
    els.search.value = "";
    els["category-filter"].value = "all";
    els["status-filter"].value = "all";
    els.sort.value = "latest";
    Object.assign(state, { query: "", category: "all", status: "all", sort: "latest" });
    renderCatalog();
    els.search.focus();
  });
}

function populateFilters() {
  const categories = [...new Set(state.books.map((book) => book.category))].sort(compareArabic);
  for (const category of categories) {
    els["category-filter"].appendChild(createEl("option", { text: category, attrs: { value: category } }));
  }
  const statuses = [...new Set(state.books.map((book) => book.status))];
  for (const key of Object.keys(STATUS_MAP)) {
    if (statuses.includes(key)) els["status-filter"].appendChild(createEl("option", { text: STATUS_MAP[key], attrs: { value: key } }));
  }
}

function getVisibleBooks() {
  const q = normalizeSearch(state.query);
  const filtered = state.books.filter((book) => {
    const haystack = normalizeSearch([book.title_ar, book.title_en, book.author, book.category].join(" "));
    return (!q || haystack.includes(q)) &&
      (state.category === "all" || book.category === state.category) &&
      (state.status === "all" || book.status === state.status);
  });

  return filtered.sort((a, b) => {
    if (state.sort === "name") return compareArabic(a.title_ar, b.title_ar) || a.id.localeCompare(b.id);
    if (state.sort === "progress") {
      const ap = a.progress === null || a.progress === undefined ? -Infinity : a.progress;
      const bp = b.progress === null || b.progress === undefined ? -Infinity : b.progress;
      return bp - ap || compareArabic(a.title_ar, b.title_ar) || a.id.localeCompare(b.id);
    }
    const ad = latestBookDate(a, state.updates);
    const bd = latestBookDate(b, state.updates);
    return bd.localeCompare(ad) || compareArabic(a.title_ar, b.title_ar) || a.id.localeCompare(b.id);
  });
}

function renderCatalog() {
  els["catalog-grid"].replaceChildren();
  els["catalog-state"].replaceChildren();
  const books = getVisibleBooks();
  els["result-count"].textContent = `${formatNumber(books.length)} نتيجة`;

  if (!state.books.length) {
    els["catalog-state"].appendChild(createEl("p", { className: "state-message", text: "لا توجد كتب منشورة حاليًا. أضف أول كتاب إلى data/books.json ثم حدّث الصفحة." }));
    announce("لا توجد كتب منشورة حاليًا.");
    return;
  }
  if (!books.length) {
    els["catalog-state"].appendChild(createEl("p", { className: "state-message", text: "لا توجد نتائج مطابقة. جرّب مسح البحث أو إعادة ضبط المرشحات." }));
    announce("لا توجد نتائج مطابقة للبحث والمرشحات الحالية.");
    return;
  }
  books.forEach((book) => els["catalog-grid"].appendChild(renderBookCard(book)));
  announce(`تم عرض ${books.length} كتاب.`);
}

function renderBookCard(book) {
  const article = createEl("article", { className: "book-card" });
  const media = createEl("div", { className: "book-card-media" });
  media.appendChild(createCoverImage(book));
  const body = createEl("div", { className: "book-card-body" });

  const top = createEl("div", { className: "card-topline" });
  top.append(createStatusBadge(book.status), createEl("span", { className: "category-chip", text: book.category }));
  if (book.demo) top.appendChild(createEl("span", { className: "demo-chip", text: "بيانات تجريبية" }));

  const title = createEl("h3", { className: "book-title", text: book.title_ar });
  body.append(top, title);
  if (book.title_en) body.appendChild(createEl("p", { className: "book-title-en ltr", text: book.title_en, dir: "ltr" }));
  body.appendChild(createEl("p", { className: "meta-line", text: `المؤلف: ${book.author}`, dir: "auto" }));

  const facts = createEl("dl", { className: "compact-facts" });
  addFact(facts, "الإصدار", book.version, true);
  addFact(facts, "آخر تحديث", formatDate(latestBookDate(book, state.updates)), false);
  const count = relatedUpdates(book.id, state.updates).length;
  addFact(facts, "سجل التحديثات", `${formatNumber(count)} حدث`, false);
  body.appendChild(facts);

  const progress = createProgress(book.progress);
  if (progress) body.appendChild(progress);
  body.appendChild(createEl("p", { className: "description", text: truncateText(book.description, 180), dir: "auto" }));

  const actions = createEl("div", { className: "card-actions" });
  actions.appendChild(createDriveAction(book.drive_url));
  actions.appendChild(createEl("a", { className: "button button-secondary", text: "تفاصيل الكتاب", attrs: { href: bookDetailUrl(book.id) } }));
  actions.appendChild(createEl("a", { className: "text-link", text: "سجل التحديثات", attrs: { href: bookDetailUrl(book.id, true) } }));
  body.appendChild(actions);
  article.append(media, body);
  return article;
}

function addFact(dl, label, value, ltr = false) {
  const wrap = createEl("div", { className: "fact-row" });
  wrap.append(createEl("dt", { text: label }), createEl("dd", { text: value, dir: ltr ? "ltr" : "auto", className: ltr ? "ltr" : "" }));
  dl.appendChild(wrap);
}

function renderRecentUpdates() {
  els["recent-updates"].replaceChildren();
  els["updates-state"].replaceChildren();
  const enabledIds = new Set(state.books.map((book) => book.id));
  const items = state.updates
    .map((update, index) => ({ update, index }))
    .filter(({ update }) => enabledIds.has(update.book_id))
    .sort((a, b) => b.update.date.localeCompare(a.update.date) || a.index - b.index)
    .slice(0, 6);

  if (!items.length) {
    els["updates-state"].appendChild(createEl("p", { className: "state-message", text: "لا توجد تحديثات مسجلة بعد." }));
    return;
  }

  const bookMap = new Map(state.books.map((book) => [book.id, book]));
  for (const { update } of items) {
    const book = bookMap.get(update.book_id);
    const article = createEl("article", { className: "update-card" });
    const eyebrow = createEl("p", { className: "update-eyebrow" });
    eyebrow.append(createEl("span", { text: updateTypeLabel(update.type) }), document.createTextNode(" · "), createEl("span", { text: formatDate(update.date) }));
    if (update.version) eyebrow.append(document.createTextNode(" · "), createEl("bdi", { className: "ltr", text: update.version, dir: "ltr" }));
    article.append(
      eyebrow,
      createEl("h3", { text: update.title }),
      createEl("p", { className: "book-reference", text: book.title_ar }),
      createEl("p", { text: truncateText(update.description, 170), dir: "auto" }),
      createEl("a", { className: "text-link", text: "افتح سجل الكتاب", attrs: { href: bookDetailUrl(book.id, true) } })
    );
    els["recent-updates"].appendChild(article);
  }
}

function showCatalogError(message) {
  els["catalog-grid"].replaceChildren();
  els["result-count"].textContent = "—";
  const box = createEl("div", { className: "error-box" });
  box.append(
    createEl("p", { text: "تعذر تحميل قائمة الكتب. تأكد من data/books.json ثم حاول مرة أخرى." }),
    createEl("p", { className: "microcopy", text: message }),
    createEl("button", { className: "button button-secondary", text: "إعادة المحاولة", attrs: { type: "button" } })
  );
  box.querySelector("button").addEventListener("click", () => location.reload());
  els["catalog-state"].replaceChildren(box);
}

function showUpdatesUnavailable(message) {
  els["recent-updates"].replaceChildren();
  els["updates-state"].replaceChildren(createEl("div", { className: "error-box", text: `تعذر تحميل سجل التحديثات. ما زال بإمكانك تصفح الكتب. ${message}` }));
}

function showDataWarnings(warnings) {
  if (!warnings.length) return;
  els["data-warning"].hidden = false;
  els["data-warning"].textContent = `تم تجاهل بعض السجلات غير الصالحة. راجع وحدة التحكم أو افتح أداة الصيانة للتحقق. عدد الملاحظات: ${formatNumber(warnings.length)}.`;
  console.warn("Data validation warnings:", warnings);
}
