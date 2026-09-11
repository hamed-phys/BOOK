# كيفية إضافة كتاب جديد

## الطريقة الأسهل: أداة الصيانة

1. افتح `tools/update-helper.html` من الموقع المنشور.
2. انتظر تحميل `books.json` و`updates.json` المنشورين. إذا فشل التحميل، لا تكمل ببيانات فارغة؛ أصلح المشكلة أو استورد الملفين المحليين معًا.
3. اختر **إضافة كتاب جديد** واملأ الحقول.
4. عند نشر أول PDF حقيقي، أضف أيضًا تحديثًا من النوع `release` لنفس الكتاب.
5. اضغط **تحقق من الملفين**.
6. نزّل `books.json` و`updates.json`.
7. في GitHub افتح المستودع → `data` → **Add file → Upload files** → ارفع الملفين معًا → راجع الاستبدال → **Commit changes**.

الأداة لا ترفع ملفات Drive ولا تحفظ إلى GitHub بنفسها.

## رفع غلاف من GitHub

المسار الدقيق:

**repository → assets → covers → Add file → Upload files → اختر الصورة → Commit changes**

اسم جيد: `serway-physics-9.webp`. الحجم المقترح قرابة `600×900` وبنسبة غلاف عادية، ويفضل WebP/JPEG أقل من `150 KB`. لا تقص عنوان الغلاف. استخدم المسار داخل JSON هكذا:

```json
"cover": "assets/covers/serway-physics-9.webp"
```

لا تستخدم `/assets/...` ولا رابط صورة خارجي.

## إضافة الكتاب يدويًا

المسار:

**repository → data → books.json → Edit (أيقونة القلم) → أضف السجل → Commit changes**

قالب سجل صالح قابل لإعادة الاستخدام:

```json
{
  "id": "your-permanent-book-id",
  "title_ar": "عنوان الكتاب بالعربية",
  "title_en": "English Title",
  "author": "اسم المؤلف",
  "category": "التخصص",
  "cover": "assets/covers/your-cover.webp",
  "status": "review",
  "version": "v1.0",
  "progress": 0,
  "last_updated": "2026-09-11",
  "description": "وصف مختصر واضح للكتاب وحالة العمل عليه.",
  "drive_url": "https://drive.google.com/file/d/REAL_FILE_ID/view?usp=sharing",
  "enabled": true,
  "demo": false
}
```

### معنى الحقول

- `id`: مطلوب وفريد ودائم. أحرف إنجليزية صغيرة + أرقام + شرطات فقط. لا تغيّره عند تغيير العنوان.
- `title_ar`: العنوان العربي المعروض.
- `title_en`: اختياري؛ اتركه `""` إذا لم تحتجه.
- `author`: اسم المؤلف كنص.
- `category`: أي تسمية تخصص غير فارغة؛ إضافة تخصص جديد لا تحتاج تعديل JavaScript.
- `cover`: مسار محلي داخل `assets/covers/` أو `""` لاستخدام الغلاف العام.
- `status`: إحدى القيم: `review`, `translation`, `correction`, `final_review`, `complete`, `paused`, `coming_soon`.
- `version`: مثل `v1.0` أو `v1.2`.
- `progress`: رقم من `0` إلى `100`، أو `null` إذا كان غير معروف. لا تكتب `"65%"`.
- `last_updated`: تاريخ تغيير بيانات هذا الكتاب بصيغة `YYYY-MM-DD`.
- `drive_url`: رابط مشاركة HTTPS حقيقي على `drive.google.com` أو `""`.
- `enabled`: `true` يظهر الكتاب؛ `false` يخفيه من الموقع فقط، لكنه لا يجعل JSON خاصًا.
- `demo`: للكتاب الحقيقي استخدم `false`.

## مثال كامل لمصفوفة فيها كتابان

```json
[
  {
    "id": "serway-physics-9",
    "title_ar": "الفيزياء للعلماء والمهندسين",
    "title_en": "Physics for Scientists and Engineers",
    "author": "مؤلف مثال",
    "category": "فيزياء",
    "cover": "assets/covers/serway-physics-9.webp",
    "status": "review",
    "version": "v1.0",
    "progress": 0,
    "last_updated": "2026-09-11",
    "description": "مثال توضيحي على سجل كتاب حقيقي بعد استبدال بياناته بالبيانات الفعلية.",
    "drive_url": "https://drive.google.com/file/d/REAL_FILE_ID_1/view?usp=sharing",
    "enabled": true,
    "demo": false
  },
  {
    "id": "language-learning-notes",
    "title_ar": "ملاحظات تعلم اللغات",
    "title_en": "Language Learning Notes",
    "author": "مؤلف مثال",
    "category": "لغات",
    "cover": "",
    "status": "coming_soon",
    "version": "v1.0",
    "progress": null,
    "last_updated": "2026-09-11",
    "description": "كتاب ثان يوضح أن الغلاف والرابط ونسبة المراجعة يمكن أن تكون غير متاحة.",
    "drive_url": "",
    "enabled": true,
    "demo": false
  }
]
```

## درس JSON السريع

`books.json` مصفوفة، لذلك يبدأ بـ `[` وينتهي بـ `]`.

بين سجلين متجاورين هذا **خطأ**:

```text
} {
```

وهذا **صحيح**:

```text
}, {
```

لا تضع فاصلة بعد آخر سجل قبل `]`.

- النصوص بين علامتي اقتباس مزدوجتين: `"فيزياء"`.
- الرقم بلا اقتباس: `35`.
- عدم معرفة النسبة: `null` بلا اقتباس.
- القيم المنطقية: `true` و`false` بلا اقتباس.

## أضف حدث الإصدار الأول

عند نشر أول PDF فعلي، أضف في بداية `updates.json` حدثًا مثل:

```json
{
  "id": "serway-physics-9-2026-09-11-01",
  "book_id": "serway-physics-9",
  "date": "2026-09-11",
  "version": "v1.0",
  "type": "release",
  "title": "نشر أول نسخة للمراجعة",
  "description": "أول نسخة متاحة للمراجعة الجماعية.",
  "drive_url": "https://drive.google.com/file/d/REAL_FILE_ID_1/view?usp=sharing"
}
```

هذا يحفظ رابط الإصدار تاريخيًا. `books.json` يظل المصدر الوحيد للرابط والإصدار والحالة الحالية.
