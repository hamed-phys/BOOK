# كيفية تحديث كتاب موجود

## أقل عدد من النقرات

1. افتح `tools/update-helper.html` على الموقع المنشور.
2. حمّل أحدث نسخ البيانات المنشورة.
3. اختر الكتاب وعدّل حقوله الحالية.
4. أضف حدثًا جديدًا إذا كان هناك إصدار/تصحيح/تقدم/تغيير حالة يستحق التسجيل.
5. تحقق ثم نزّل الملفين كاملين.
6. GitHub → repository → `data` → **Add file → Upload files** → ارفع `books.json` و`updates.json` معًا → راجع الاستبدال → **Commit changes**.

ارفع الأغلفة الجديدة أولًا قبل رفع JSON حتى لا تشير البيانات إلى ملف غير موجود.

## التعديل اليدوي

لتغيير الرابط أو الإصدار أو الحالة أو التقدم أو الوصف أو الغلاف:

**repository → data → books.json → Edit (القلم) → ابحث عن `"id": "..."` → عدّل الحقول → Commit changes**

الحقول الحالية تأتي فقط من `books.json`:

```text
version
status
progress
drive_url
description
cover
```

## مثال قبل/بعد مع إصدار جديد

قبل التحديث في `books.json`:

```json
{
  "id": "cheng-field-wave-2",
  "title_ar": "المجالات والموجات الكهرومغناطيسية",
  "title_en": "Field and Wave Electromagnetics",
  "author": "مؤلف مثال",
  "category": "كهرومغناطيسية",
  "cover": "assets/covers/cheng-field-wave-2.webp",
  "status": "review",
  "version": "v1.0",
  "progress": 40,
  "last_updated": "2026-09-01",
  "description": "النسخة الأولى قيد المراجعة.",
  "drive_url": "https://drive.google.com/file/d/OLD_FILE_ID/view?usp=sharing",
  "enabled": true,
  "demo": false
}
```

بعد إنشاء PDF جديد ورفعه كملف Drive جديد:

```json
{
  "id": "cheng-field-wave-2",
  "title_ar": "المجالات والموجات الكهرومغناطيسية",
  "title_en": "Field and Wave Electromagnetics",
  "author": "مؤلف مثال",
  "category": "كهرومغناطيسية",
  "cover": "assets/covers/cheng-field-wave-2.webp",
  "status": "final_review",
  "version": "v1.1",
  "progress": 85,
  "last_updated": "2026-09-11",
  "description": "نسخة مصححة بعد الجولة الأولى، وهي الآن في المراجعة النهائية.",
  "drive_url": "https://drive.google.com/file/d/NEW_FILE_ID/view?usp=sharing",
  "enabled": true,
  "demo": false
}
```

أضف في **بداية** `updates.json`:

```json
{
  "id": "cheng-field-wave-2-2026-09-11-01",
  "book_id": "cheng-field-wave-2",
  "date": "2026-09-11",
  "version": "v1.1",
  "type": "release",
  "title": "نشر النسخة المصححة v1.1",
  "description": "تطبيق ملاحظات الجولة الأولى وفتح مراجعة نهائية.",
  "drive_url": "https://drive.google.com/file/d/NEW_FILE_ID/view?usp=sharing"
},
```

لا تحذف الأحداث الأقدم. حدث الإصدار `v1.0` يجب أن يبقى حاملًا رابط `OLD_FILE_ID`، وليس رابط النسخة الجديدة.

## كيف أضيف تحديثًا وأحتفظ بالقديم؟

`updates.json` مصفوفة. الصق السجل الجديد مباشرة بعد `[` ثم ضع فاصلة بعده قبل السجل القديم الأول. مثال مختصر:

```json
[
  {
    "id": "new-event-2026-09-11-01",
    "book_id": "cheng-field-wave-2",
    "date": "2026-09-11",
    "version": "v1.1",
    "type": "correction",
    "title": "تصحيحات جديدة",
    "description": "تفاصيل التصحيح.",
    "drive_url": ""
  },
  {
    "id": "older-event-2026-09-01-01",
    "book_id": "cheng-field-wave-2",
    "date": "2026-09-01",
    "version": "v1.0",
    "type": "release",
    "title": "الإصدار الأول",
    "description": "بداية الجولة السابقة.",
    "drive_url": "https://drive.google.com/file/d/OLD_FILE_ID/view?usp=sharing"
  }
]
```

عند تساوي التاريخ، الموقع يحافظ على ترتيب المصفوفة، لذلك ضع الأحدث إداريًا أولًا.

## متى أغير `last_updated`؟

- إذا عدّلت بيانات الكتاب نفسها في `books.json`، غيّر `last_updated` إلى تاريخ ذلك التعديل.
- إذا أضفت حدثًا فقط إلى `updates.json` ولم تغيّر بيانات الكتاب، لا تحتاج إلى تكرار التاريخ في `last_updated`. الموقع يعرض تلقائيًا الأكبر بين `book.last_updated` وكل تواريخ أحداثه الصالحة.
- حدث قديم لا يستطيع تغيير `version` أو `status` أو `progress` أو `drive_url` الحالي؛ هذه دائمًا من `books.json`.

## PDF جديد مقابل تصحيح رابط

### إذا كان PDF جديدًا فعلًا

1. تأكد أن رابط النسخة القديمة موجود في حدث الإصدار القديم.
2. احتفظ بملف Drive القديم وتعليقاته.
3. ارفع ملفًا جديدًا واضبط مشاركته.
4. حدّث `books.json` بالرابط والإصدار الحاليين.
5. أضف `release` جديدًا مع رابط الملف الجديد.

### إذا أخطأت فقط في كتابة رابط الإصدار الحالي

صحح الرابط في `books.json` و`last_updated`. إذا كان هناك حدث `release` لنفس الإصدار وكان رابط الحدث نفسه مكتوبًا خطأ، صححه إلى رابط **ذلك الإصدار نفسه**. لا تجعل حدثًا قديمًا يشير بصمت إلى ملف إصدار أحدث.

## تغيير الغلاف

1. GitHub → `assets` → `covers` → **Add file → Upload files** → Commit.
2. ثم GitHub → `data` → `books.json` → **Edit**.
3. غيّر `cover` إلى المسار الجديد، مثل `assets/covers/cheng-v11.webp`.
4. حدّث `last_updated` ثم Commit.

## استرجاع خطأ في ملف واحد

افتح الملف → **History** → اختر commit معروفًا بأنه سليم → **Raw** → انسخ المحتوى → ارجع للملف الحالي على `main` → **Edit** → استبدل المحتوى → **Commit changes**. بهذه الطريقة لا تعيد بقية المستودع إلى الوراء.
