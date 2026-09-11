# تقرير الاختبار

تاريخ الاختبار: `2026-09-11`

هذا التقرير يفرّق بين الاختبارات التي نُفذت فعليًا، والفحص الساكن، والخطوات التي تحتاج حساب GitHub/Google Drive حقيقيًا.

## ملخص

- **PASSED**: بنية المشروع، JSON، منطق التحقق، المسارات، البحث والمرشحات والفرز، صفحة الكتاب، الحالات الفارغة، تعطيل الكتب، سجل التحديثات، أداة الصيانة، التصدير وإعادة الاستيراد، العمل عند جذر الموقع وعند مسار مشروع فرعي، وأحجام العرض الأساسية.
- **FAILED**: لا توجد حالات فشل معروفة بعد الإصلاحات النهائية.
- **NOT RUN**: نشر فعلي على حساب GitHub، صلاحيات Google Drive الحقيقية، واختبار يدوي كامل بقارئ شاشة/Zoom متصفح حقيقي 200%.

## الاختبارات المنفذة

| الاختبار | النتيجة | الدليل المختصر |
|---|---|---|
| وجود كل الملفات المطلوبة | PASSED | فحص آلي لكل المسارات الثابتة المطلوبة، بما فيها `.nojekyll`. |
| تحليل `site.json`, `books.json`, `updates.json` | PASSED | `JSON.parse`/Python JSON نجح على الملفات النهائية. |
| الحقول المطلوبة والأنواع | PASSED | `validateDataset()` على البيانات النهائية بلا أخطاء. |
| تواريخ تقويمية حقيقية | PASSED | قبل `2024-02-29` ورفض `2026-02-29` و`2026-02-30`. |
| معرفات فريدة | PASSED | fixture مكرر رُفض ولم يُختَر سجل عشوائي. |
| enums للحالة ونوع التحديث | PASSED | التحقق المشترك يرفض القيم غير المعروفة. |
| progress من 0 إلى 100 أو `null` | PASSED | fixtures لـ `0`, `100`, `null` نجحت، والقيمة `101` رُفضت. |
| update/book relationships | PASSED | تحديث orphan بمعرف كتاب غير موجود رُفض. |
| روابط Drive الآمنة | PASSED | قُبل HTTPS على `drive.google.com` مع query parameters، ورُفض HTTP وhostname مشابه خادع. |
| مسارات الأغلفة | PASSED | قُبل `assets/covers/...` ورُفض `../` والرابط الخارجي. |
| fallback لغلاف مفقود | PASSED | Chromium test أعاد الصورة إلى `placeholder.svg` ووضع guard لمنع loop. |
| latest date | PASSED | ظهر الحد الأقصى بين `last_updated` وأحداث الكتاب؛ حدث update-only قدّم التاريخ المعروض. |
| ترتيب التاريخ | PASSED | تنازلي؛ وعند التاريخ نفسه يحافظ التنفيذ على ترتيب المصفوفة. |
| البحث العربي | PASSED | Chromium test تحقّق من تجاهل التشكيل/التطويل وتوحيد أشكال الألف للبحث فقط. |
| بحث + category + status معًا | PASSED | Chromium test شغّل تركيبة أعطت no-results ثم Reset أعاد الكتب. |
| Sort: latest/name/progress | PASSED | Chromium test شغّل الأنماط الثلاثة؛ `null` ظهر أخيرًا في progress. |
| Category options ديناميكية | PASSED | أضيف كتاب مؤقت بتخصص جديد وظهر الخيار دون تعديل HTML/JS. |
| disabled book exclusion | PASSED | fixture لكتاب `enabled:false` اختفى من البطاقات والمرشحات. |
| Recent updates | PASSED | ظهرت 6 أحداث للبيانات النهائية ومن الكتب المفعلة فقط. |
| فشل `updates.json` | PASSED | الكتالوج بقي يعمل وظهرت رسالة أن سجل التحديثات غير متاح. |
| فشل `books.json` | PASSED | ظهرت رسالة عربية قابلة للقراءة وزر إعادة المحاولة. |
| صفحة كتاب صالح | PASSED | Chromium test عرض metadata والتاريخ الكامل وحدّث `document.title`. |
| `#updates` anchor | PASSED | القسم موجود وثابت، ونفذت آلية scroll-after-render في harness. |
| ID مفقود/مجهول | PASSED | ظهرت `الكتاب غير موجود` مع رابط رئيسية صحيح. |
| historical/current links | PASSED | رابط حالي صالح ظهر؛ حدث تاريخي بلا رابط لم يأخذ الرابط الحالي؛ الإصدار الأقدم ذو الرابط ظهر باسم `نسخة سابقة`. |
| unavailable Drive | PASSED | لا ينشأ anchor عند الرابط الفارغ/غير الصالح. |
| Western digits | PASSED | تواريخ ونسب الاختبار احتوت 0–9 ولم تحتو أرقامًا عربية شرقية. |
| mixed RTL/LTR | PASSED | العناوين الإنجليزية والإصدارات معزولة `dir=ltr`؛ بقية النصوص تستخدم `dir=auto` عند الحاجة. |
| Root site `/` | PASSED | browser harness عمل على base تجريبي `https://example.test/`. |
| Project subpath `/book-review/` | PASSED | browser harness عمل على base تجريبي `https://example.test/book-review/` بما فيها التفاصيل والأداة. |
| HTTP file availability | PASSED | خادم Python مؤقت + `curl`: الصفحة والـJSON والـJS/helper أعادت HTTP 200. |
| Mobile 320/375، Tablet 768، Desktop 1440 | PASSED | Chromium harness: لا horizontal overflow بعد الرندر. |
| 200% zoom تقريبًا | PASSED | CSS zoom 2× في harness لم ينتج horizontal overflow. هذا ليس بديلًا كاملًا لZoom المتصفح الحقيقي. |
| reduced motion | PASSED | فحص CSS وجد `prefers-reduced-motion`. |
| focus visibility | PASSED (static) | فحص CSS وجد `:focus-visible` بحد واضح؛ عناصر الإدخال والأزرار قابلة للتركيز. |
| contrast للألوان الأساسية | PASSED (static calculation) | نسب مختارة كانت تقريبًا 5.67:1 إلى 15.52:1 للنصوص الأساسية/المساعدة والحالات المختبرة. |
| helper: published load | PASSED | Chromium harness حمّل الملفين المنشورين معًا. |
| helper: load failure safety | PASSED | فشل ملف واحد لم يُحوّل الحالة إلى `[]` ولم ينتج JSON قابلًا للتنزيل. |
| helper: edit book | PASSED | التعديل حافظ على بقية الكتب وكل history. |
| helper: unknown fields | PASSED | field مؤقت غير معروف بقي بعد تعديل سجل موجود. |
| helper: add book | PASSED | أضيف كتاب رابع وتخصص جديد داخل الذاكرة. |
| helper: add update first | PASSED | الحدث الجديد أصبح أول عنصر في `updates.json`. |
| helper: duplicate/orphan invalid | PASSED | validation منع الحالة غير الصالحة وعطّل export. |
| helper: export filenames | PASSED | تنزيلان باسم `books.json` و`updates.json` بالضبط. |
| helper: re-import export | PASSED | الملفات المولّدة أُعيد استيرادها، وبقيت السجلات غير المعدلة والتاريخ. |
| XSS/raw HTML approach | PASSED (inspection + browser) | العرض الديناميكي يستخدم `textContent`/DOM methods؛ لا يوجد interpolation لبيانات المستخدم عبر `innerHTML`. |
| ZIP content policy | PASSED بعد التغليف النهائي | الفحص النهائي يتأكد من عدم وجود PDF أو credentials أو caches أو dependency folders. |

## ملاحظات عن اختبار المتصفح

تعذر على Chromium في هذه البيئة الانتقال مباشرة إلى `http://127.0.0.1` بسبب سياسة إدارية (`ERR_BLOCKED_BY_ADMINISTRATOR`). لذلك استُخدم **Chromium حقيقي عبر Playwright** مع صفحة in-memory وأصل HTTPS تجريبي، واعتراض طلبات الملفات وتغذيتها من نفس ملفات المشروع. هذا سمح بتنفيذ JavaScript الفعلي والتفاعل مع النماذج والمرشحات والروابط وأداة الصيانة، لكنه ليس نشر GitHub Pages حقيقيًا.

## NOT RUN — يتطلب حسابك أو فحصًا يدويًا خارجيًا

| الاختبار | النتيجة | السبب |
|---|---|---|
| GitHub Pages production deployment | NOT RUN | لا توجد بيانات حساب/تعليمات نشر مصادق عليها. |
| رابط الموقع الحقيقي `site_url` | NOT RUN | غير معروف حتى تنشئ المستودع وتفتح URL الذي يعرضه GitHub. |
| Drive Viewer/Commenter permissions | NOT RUN | تحتاج ملف Drive حقيقيًا وحساب قارئ منفصل. |
| منع download/print/copy على حسابك | NOT RUN | يعتمد على نوع الحساب وسياسة المسؤول. |
| تعليق PDF فعلي | NOT RUN | يحتاج ملف PDF ورابط مشاركة فعليًا. |
| قارئ شاشة حقيقي | NOT RUN | لم يُشغّل NVDA/VoiceOver في البيئة. |
| Browser UI zoom الحقيقي 200% | NOT RUN | استُخدم CSS zoom 2× كاختبار layout، وليس Zoom المتصفح نفسه. |

## فحوص يدوية موصى بها بعد النشر

1. افتح الموقع من هاتف حقيقي بعرض صغير ومن متصفح سطح مكتب.
2. جرّب Tab عبر الرأس، البحث، المرشحات، الأزرار، وروابط البطاقات.
3. فعّل Zoom المتصفح إلى 200% وتأكد أن المحتوى يبقى قابلًا للاستخدام بلا تمرير أفقي للصفحة.
4. افتح رابط Drive من حساب قارئ منفصل واختبر التعليق قبل مشاركة الرابط مع المجموعة.
5. بعد أول تعديل حقيقي، جرّب الاسترجاع من GitHub History على ملف تجريبي صغير حتى تعرف المسار قبل الحاجة إليه.
