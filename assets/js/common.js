export const SITE_BASE = new URL("../../", import.meta.url);

export const DEFAULT_SITE = Object.freeze({
  title: "مشروع القراءة والمراجعة الجماعية",
  intro: "اختر كتابًا، واقرأ النسخة الحالية، وشارك بملاحظاتك وتصحيحاتك.",
  about: "مساحة للقراءة الجماعية ومراجعة الكتب في مختلف التخصصات.",
  github_url: "",
  site_url: ""
});

export const STATUS_MAP = Object.freeze({
  review: "قيد المراجعة",
  translation: "قيد الترجمة",
  correction: "قيد التصحيح",
  final_review: "مراجعة نهائية",
  complete: "مكتمل",
  paused: "متوقف مؤقتًا",
  coming_soon: "قريبًا"
});

export const UPDATE_TYPE_MAP = Object.freeze({
  release: "إصدار",
  correction: "تصحيح",
  progress: "تقدّم",
  status: "حالة",
  note: "ملاحظة"
});

export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VERSION_RE = /^v\d+\.\d+$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DRIVE_HOSTS = new Set(["drive.google.com"]);
const SENTINEL_LINK = "YOUR_GOOGLE_DRIVE_LINK_HERE";

const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-ca-gregory-nu-latn", {
  year: "numeric",
  month: "short",
  day: "numeric",
  calendar: "gregory",
  numberingSystem: "latn",
  timeZone: "UTC"
});

const numberFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  numberingSystem: "latn",
  maximumFractionDigits: 2
});

const collator = new Intl.Collator("ar", { sensitivity: "base", numeric: true });

export function siteUrl(path = "") {
  return new URL(path, SITE_BASE);
}

export function siteHref(path = "") {
  return siteUrl(path).href;
}

export function setBaseLinks(root = document) {
  root.querySelectorAll("[data-site-path]").forEach((node) => {
    const path = node.getAttribute("data-site-path") || "";
    node.setAttribute("href", siteHref(path));
  });
}

export async function loadJson(path) {
  const url = siteUrl(path);
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`تعذر الاتصال بملف ${path}.`);
  }
  if (!response.ok) {
    throw new Error(`تعذر تحميل ${path} (HTTP ${response.status}).`);
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`ملف ${path} ليس JSON صالحًا.`);
  }
}

export async function loadSiteConfig() {
  try {
    const raw = await loadJson("data/site.json");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_SITE };
    return {
      title: nonEmptyString(raw.title) ? raw.title.trim() : DEFAULT_SITE.title,
      intro: nonEmptyString(raw.intro) ? raw.intro.trim() : DEFAULT_SITE.intro,
      about: nonEmptyString(raw.about) ? raw.about.trim() : DEFAULT_SITE.about,
      github_url: safeGithubUrl(raw.github_url),
      site_url: normalizeSiteUrl(raw.site_url)
    };
  } catch (error) {
    console.warn(error.message);
    return { ...DEFAULT_SITE };
  }
}

export function safeHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function safeGithubUrl(value) {
  const safe = safeHttpsUrl(value);
  if (!safe) return "";
  const url = new URL(safe);
  return url.hostname.toLowerCase() === "github.com" ? url.href : "";
}

export function normalizeSiteUrl(value) {
  const safe = safeHttpsUrl(value);
  if (!safe) return "";
  const url = new URL(safe);
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.href;
}

export function getSafeDriveUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === SENTINEL_LINK) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function isSafeCoverPath(value) {
  if (value === "") return true;
  if (typeof value !== "string") return false;
  const path = value.trim();
  if (!path || path.startsWith("/") || path.includes("\\") || path.includes("://") || path.includes("?") || path.includes("#")) return false;
  if (!path.startsWith("assets/covers/")) return false;
  const segments = path.split("/");
  return !segments.some((segment) => !segment || segment === "." || segment === "..");
}

export function coverHref(book) {
  const path = isSafeCoverPath(book?.cover) && book.cover ? book.cover : "assets/covers/placeholder.svg";
  return siteHref(path);
}

export function isValidDateString(value) {
  if (typeof value !== "string") return false;
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function dateToUtc(value) {
  if (!isValidDateString(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(value) {
  const date = dateToUtc(value);
  return date ? dateFormatter.format(date) : "تاريخ غير صالح";
}

export function formatNumber(value) {
  return numberFormatter.format(value);
}

export function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

export function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .toLocaleLowerCase("en")
    .trim()
    .replace(/\s+/g, " ");
}

export function compareArabic(a, b) {
  return collator.compare(a ?? "", b ?? "");
}

export function statusLabel(key) {
  return STATUS_MAP[key] || key || "غير معروف";
}

export function updateTypeLabel(key) {
  return UPDATE_TYPE_MAP[key] || key || "غير معروف";
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCommonId(id, label, errors) {
  if (!nonEmptyString(id) || !ID_RE.test(id)) {
    errors.push(`${label}: يجب أن يكون معرفًا دائمًا بأحرف إنجليزية صغيرة وأرقام وشرطات فقط.`);
    return false;
  }
  return true;
}

function validateBook(book, index, errors) {
  const p = `books[${index}]`;
  if (!book || typeof book !== "object" || Array.isArray(book)) {
    errors.push(`${p}: السجل يجب أن يكون كائنًا JSON.`);
    return;
  }
  validateCommonId(book.id, `${p}.id`, errors);
  for (const field of ["title_ar", "author", "category", "description"]) {
    if (!nonEmptyString(book[field])) errors.push(`${p}.${field}: حقل نصي مطلوب وغير فارغ.`);
  }
  if (book.title_en !== undefined && typeof book.title_en !== "string") errors.push(`${p}.title_en: يجب أن يكون نصًا أو سلسلة فارغة.`);
  if (typeof book.cover !== "string" || !isSafeCoverPath(book.cover)) errors.push(`${p}.cover: يجب أن يكون مسارًا محليًا داخل assets/covers/ أو سلسلة فارغة.`);
  if (!Object.hasOwn(STATUS_MAP, book.status)) errors.push(`${p}.status: قيمة الحالة غير معروفة.`);
  if (typeof book.version !== "string" || !VERSION_RE.test(book.version)) errors.push(`${p}.version: استخدم الصيغة vMAJOR.MINOR مثل v1.0.`);
  if (!(book.progress === null || (typeof book.progress === "number" && Number.isFinite(book.progress) && book.progress >= 0 && book.progress <= 100))) {
    errors.push(`${p}.progress: يجب أن يكون رقمًا من 0 إلى 100 أو null.`);
  }
  if (!isValidDateString(book.last_updated)) errors.push(`${p}.last_updated: يجب أن يكون تاريخًا حقيقيًا بصيغة YYYY-MM-DD.`);
  if (typeof book.drive_url !== "string" || (book.drive_url.trim() && book.drive_url.trim() !== SENTINEL_LINK && !getSafeDriveUrl(book.drive_url))) {
    errors.push(`${p}.drive_url: استخدم رابط HTTPS صالحًا على drive.google.com أو سلسلة فارغة.`);
  }
  if (typeof book.enabled !== "boolean") errors.push(`${p}.enabled: يجب أن تكون true أو false بدون علامات اقتباس.`);
  if (typeof book.demo !== "boolean") errors.push(`${p}.demo: يجب أن تكون true أو false بدون علامات اقتباس.`);
}

function validateUpdate(update, index, errors) {
  const p = `updates[${index}]`;
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    errors.push(`${p}: السجل يجب أن يكون كائنًا JSON.`);
    return;
  }
  validateCommonId(update.id, `${p}.id`, errors);
  if (!nonEmptyString(update.book_id) || !ID_RE.test(update.book_id)) errors.push(`${p}.book_id: يجب أن يطابق معرف كتاب صالحًا.`);
  if (!isValidDateString(update.date)) errors.push(`${p}.date: يجب أن يكون تاريخًا حقيقيًا بصيغة YYYY-MM-DD.`);
  if (!(typeof update.version === "string" && (update.version === "" || VERSION_RE.test(update.version)))) errors.push(`${p}.version: استخدم vMAJOR.MINOR أو سلسلة فارغة.`);
  if (!Object.hasOwn(UPDATE_TYPE_MAP, update.type)) errors.push(`${p}.type: نوع التحديث غير معروف.`);
  for (const field of ["title", "description"]) {
    if (!nonEmptyString(update[field])) errors.push(`${p}.${field}: حقل نصي مطلوب وغير فارغ.`);
  }
  if (update.drive_url !== undefined && (typeof update.drive_url !== "string" || (update.drive_url.trim() && update.drive_url.trim() !== SENTINEL_LINK && !getSafeDriveUrl(update.drive_url)))) {
    errors.push(`${p}.drive_url: استخدم رابط HTTPS صالحًا على drive.google.com أو سلسلة فارغة.`);
  }
}

export function validateDataset(books, updates) {
  const errors = [];
  if (!Array.isArray(books)) errors.push("books.json: المستوى الأعلى يجب أن يكون مصفوفة [].");
  if (!Array.isArray(updates)) errors.push("updates.json: المستوى الأعلى يجب أن يكون مصفوفة [].");
  if (!Array.isArray(books) || !Array.isArray(updates)) return { valid: false, errors, duplicateBookIds: new Set(), duplicateUpdateIds: new Set() };

  books.forEach((book, index) => validateBook(book, index, errors));
  updates.forEach((update, index) => validateUpdate(update, index, errors));

  const bookCounts = new Map();
  for (const book of books) if (book && typeof book.id === "string") bookCounts.set(book.id, (bookCounts.get(book.id) || 0) + 1);
  const duplicateBookIds = new Set([...bookCounts].filter(([, count]) => count > 1).map(([id]) => id));
  duplicateBookIds.forEach((id) => errors.push(`books.json: معرف الكتاب مكرر: ${id}.`));

  const updateCounts = new Map();
  for (const update of updates) if (update && typeof update.id === "string") updateCounts.set(update.id, (updateCounts.get(update.id) || 0) + 1);
  const duplicateUpdateIds = new Set([...updateCounts].filter(([, count]) => count > 1).map(([id]) => id));
  duplicateUpdateIds.forEach((id) => errors.push(`updates.json: معرف التحديث مكرر: ${id}.`));

  const validBookIds = new Set(books.filter((book) => book && ID_RE.test(book.id || "") && !duplicateBookIds.has(book.id)).map((book) => book.id));
  updates.forEach((update, index) => {
    if (update && typeof update.book_id === "string" && ID_RE.test(update.book_id) && !validBookIds.has(update.book_id)) {
      errors.push(`updates[${index}].book_id: لا يوجد كتاب صالح بالمعرف ${update.book_id}.`);
    }
  });

  return { valid: errors.length === 0, errors, duplicateBookIds, duplicateUpdateIds };
}

export function sanitizeRuntimeData(books, updates) {
  const result = validateDataset(Array.isArray(books) ? books : [], Array.isArray(updates) ? updates : []);
  const duplicateBookIds = result.duplicateBookIds;
  const duplicateUpdateIds = result.duplicateUpdateIds;

  const validBooks = (Array.isArray(books) ? books : []).filter((book, index) => {
    if (!book || typeof book !== "object" || duplicateBookIds.has(book.id)) return false;
    const localErrors = [];
    validateBook(book, index, localErrors);
    return localErrors.length === 0;
  });
  const validBookIds = new Set(validBooks.map((book) => book.id));
  const validUpdates = (Array.isArray(updates) ? updates : []).filter((update, index) => {
    if (!update || typeof update !== "object" || duplicateUpdateIds.has(update.id)) return false;
    const localErrors = [];
    validateUpdate(update, index, localErrors);
    return localErrors.length === 0 && validBookIds.has(update.book_id);
  });

  return { books: validBooks, updates: validUpdates, warnings: result.errors };
}

export function relatedUpdates(bookId, updates) {
  return updates
    .map((update, index) => ({ update, index }))
    .filter(({ update }) => update.book_id === bookId)
    .sort((a, b) => b.update.date.localeCompare(a.update.date) || a.index - b.index)
    .map(({ update }) => update);
}

export function latestBookDate(book, updates) {
  let latest = isValidDateString(book.last_updated) ? book.last_updated : "";
  for (const update of updates) {
    if (update.book_id === book.id && isValidDateString(update.date) && update.date > latest) latest = update.date;
  }
  return latest;
}

export function createEl(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.text !== undefined) el.textContent = String(options.text);
  if (options.dir) el.dir = options.dir;
  if (options.attrs) for (const [name, value] of Object.entries(options.attrs)) el.setAttribute(name, String(value));
  return el;
}

export function appendText(container, text) {
  container.appendChild(document.createTextNode(String(text)));
}

export function createStatusBadge(status) {
  return createEl("span", {
    className: `status-badge status-${status}`,
    text: statusLabel(status),
    attrs: { "aria-label": `الحالة: ${statusLabel(status)}` }
  });
}

export function createProgress(progress) {
  if (progress === null || progress === undefined) return null;
  const wrap = createEl("div", { className: "progress-wrap" });
  const header = createEl("div", { className: "progress-label" });
  header.append(createEl("span", { text: "نسبة المراجعة" }), createEl("span", { className: "ltr", text: formatPercent(progress), dir: "ltr" }));
  const bar = createEl("div", {
    className: "progress-track",
    attrs: {
      role: "progressbar",
      "aria-label": "نسبة المراجعة، تقدير يدوي يحدّثه صاحب المشروع",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": String(progress)
    }
  });
  const fill = createEl("div", { className: "progress-fill" });
  fill.style.inlineSize = `${progress}%`;
  bar.appendChild(fill);
  wrap.append(header, bar, createEl("p", { className: "microcopy", text: "تقدير يحدّثه صاحب المشروع يدويًا." }));
  return wrap;
}

export function createCoverImage(book, { lazy = true } = {}) {
  const img = createEl("img", {
    className: "book-cover",
    attrs: {
      src: coverHref(book),
      alt: `غلاف ${book.title_ar}`,
      width: "600",
      height: "900",
      decoding: "async"
    }
  });
  if (lazy) img.loading = "lazy";
  img.addEventListener("error", () => {
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = siteHref("assets/covers/placeholder.svg");
  });
  return img;
}

export function createDriveAction(urlValue, label = "اقرأ وشارك في المراجعة") {
  const safe = getSafeDriveUrl(urlValue);
  if (!safe) return createEl("span", { className: "unavailable-link", text: "الرابط غير متاح حاليًا" });
  const link = createEl("a", {
    className: "button button-primary",
    text: label,
    attrs: {
      href: safe,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": `${label} — يفتح في علامة تبويب جديدة`
    }
  });
  return link;
}

export function decorateSite(site, { updateDocumentTitle = true } = {}) {
  document.querySelectorAll("[data-site-title]").forEach((node) => { node.textContent = site.title; });
  document.querySelectorAll("[data-site-intro]").forEach((node) => { node.textContent = site.intro; });
  document.querySelectorAll("[data-site-about]").forEach((node) => { node.textContent = site.about; });
  const github = document.querySelector("[data-github-link]");
  if (github) {
    const safe = safeGithubUrl(site.github_url);
    if (safe) {
      github.href = safe;
      github.hidden = false;
    } else {
      github.hidden = true;
    }
  }
  if (updateDocumentTitle) document.title = site.title;
  if (site.site_url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = site.site_url;
  }
}

export function announce(message) {
  const live = document.getElementById("live-region");
  if (live) live.textContent = message;
}

export function bookDetailUrl(id, withUpdates = false) {
  const url = siteUrl("book.html");
  url.searchParams.set("id", id);
  if (withUpdates) url.hash = "updates";
  return url.href;
}

export function truncateText(text, max = 150) {
  const value = String(text || "").trim();
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
