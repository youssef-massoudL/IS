# خطة التنفيذ الهندسية الكاملة (DeepSeek Implementation Blueprint — Study Hub v1)

> [!IMPORTANT]
> **طريقة الاستخدام مع DeepSeek:**
> الخطة دي مكتوبة كـ **Technical Specification جاهزة للنسخ واللصق (Copy-Paste)** لـ DeepSeek على **4 مراحل (Phases)** مستقلة.
> انسخ لكل مرحلة الجزء الخاص بيها وابعته لـ DeepSeek، وبعد ما يخلص كل مرحلة هات الكود هنا عشان أراجعه كـ **Senior Software Architect & Code Reviewer** وأشغّل عليه اختبارات الفحص الآلي قبل ما ننقل على المرحلة اللي بعدها.

---

## 0. System Prompt & Golden Rules (انسخ الجزء ده لـ DeepSeek في بداية الشات)

````markdown
You are implementing v1 upgrades for "Study Hub" (منصة المواد الدراسية — الفرقة الثالثة نظم معلومات، كلية الحاسبات والمعلومات جامعة المنصورة).

### Architecture & Non-Negotiable Constraints (GOLDEN RULES)
1. **Static Zero-Dependency Stack**: HTML5 + Vanilla CSS (`assets/styles.css`) + Vanilla JS (`assets/app.js`, `assets/quiz.js`) + Node.js build scripts (`scripts/build.mjs`). No npm runtime dependencies, no bundlers, no frameworks.
2. **Mandatory `file://` Compatibility**:
   - The site MUST work both over HTTP (GitHub Pages) AND when opened directly via `file:///.../index.html` double-click.
   - NEVER use ES Module `import`/`export` in browser scripts (`assets/*.js`). All browser scripts must be classic `<script defer>` scripts sharing `window.*` globals.
   - `fetch()` fails on `file://` due to CORS. Therefore, `scripts/build.mjs` MUST embed `data/subjects.json`, `data/schedule.json`, and `data/questions/*.json` into `assets/data.js` as:
     - `window.__SITE_DATA__`
     - `window.__SITE_SCHEDULE__`
     - `window.__SITE_QUESTIONS__`
3. **Preserve Existing Behaviors**:
   - Clicking a file row (`<li class="file-row">`) triggers direct download (`downloadRow()`).
   - Clicking the eye button (`.preview-btn`) opens the in-page preview modal (`openPreview()`).
   - Existing accordion state uses `localStorage` keys prefixed with `section:<subjectId>:<sectionId>`. Do NOT collide with `section:*`.
   - All new `localStorage` keys MUST use the `hub:` prefix (`hub:mySection`, `hub:studied`, `hub:mistakes`, `hub:viewMode`, `hub:examState:<subjectId>`) and MUST be wrapped in `try / catch`.
4. **Reserved Hash Routes**:
   - Subject routes: `#<subject-id>` (e.g., `#system-analysis`, `#database-2`, `#information-theory`, `#research-methods`, `#computer-networks`, `#general`).
   - Feature routes: `#schedule` (الجدول الدراسي والميدترم), `#practice` (بنك الأسئلة والامتحانات التفاعلية), `#mistakes` (بنك أخطائي).
   - Student section selection (`1..11`) uses query param `?sec=N` + `localStorage['hub:mySection']`, NEVER the URL hash.
5. **RTL First**: All layouts are Arabic RTL (`dir="rtl"`). Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) and existing CSS variables (`--bg`, `--surface`, `--text`, `--accent`, `--border`, etc.).
````

---

## المرحلة الأولى (Phase 1): هيكلة البيانات، مزامنة الملفات، وتحديث `scripts/build.mjs`

### الهدف من المرحلة الأولى
1. إنشاء ملف `data/schedule.json` بكل بيانات الجداول، الفترات، الميدترم، الدكاترة، المعيدين، وتوزيع الـ 11 سكشن المستخرجة رسمياً.
2. تحديث `scripts/build.mjs` ليقوم بـ:
   - تصنيف كل ملف في `data/subjects.json` تلقائياً بحقول:
     - `lecture`: رقم المحاضرة (`1..12` أو `null` للملفات العامة).
     - `kind`: واحد من 6 أنواع (`"lecture"` | `"summary"` | `"questions"` | `"solution"` | `"review"` | `"book"`).
     - `keywords`: مصفوفة كلمات مفتاحية بالعربي والإنجليزي لتحسين البحث.
   - تضمين `data/subjects.json` + `data/schedule.json` + `data/questions/*.json` داخل `assets/data.js` عشان الموقع يشتغل 100% على `file://`.

### 1.1 الملف المطلوب إنشاؤه: `data/schedule.json`
انسخ هذا الـ JSON الكامل (مستخرج ومُراجع من ملفات الجداول الرسمية للكلية):

```json
{
  "term": "الفصل الدراسي الأول 2026-2027",
  "faculty": "كلية الحاسبات والمعلومات — جامعة المنصورة",
  "department": "قسم نظم المعلومات — الفرقة الثالثة",
  "studyStartDate": "2026-09-19",
  "calendar": [
    { "id": "study-start", "title": "بداية الدراسة للفصل الدراسي الأول", "startDate": "2026-09-19", "endDate": "2026-09-19", "note": "الأسبوع الأول (فردي)" },
    { "id": "midterm-week", "title": "امتحانات الميدترم (الأسبوع التاسع)", "startDate": "2026-11-14", "endDate": "2026-11-19", "note": "تستمر الدراسة بالتوازي مع الاختبارات" },
    { "id": "practical-oral", "title": "الامتحانات العملية والشفوية", "startDate": "2026-12-19", "endDate": "2026-12-31", "note": "الأسبوع 14 و15" },
    { "id": "final-exams", "title": "امتحانات نهاية الفصل الدراسي الأول (النظري)", "startDate": "2027-01-02", "endDate": "2027-01-21", "note": "حسب الجدول المعلن" },
    { "id": "midyear-break", "title": "إجازة نصف العام", "startDate": "2027-01-23", "endDate": "2027-02-04", "note": "أسبوعان" }
  ],
  "periods": [
    { "id": 1, "label": "الفترة الأولى", "start": "08:30", "end": "10:10" },
    { "id": 2, "label": "الفترة الثانية", "start": "10:20", "end": "12:00" },
    { "id": 3, "label": "الفترة الثالثة", "start": "12:20", "end": "14:00" },
    { "id": 4, "label": "الفترة الرابعة", "start": "14:10", "end": "15:50" },
    { "id": 5, "label": "الفترة الخامسة", "start": "16:00", "end": "17:40" },
    { "id": 6, "label": "الفترة السادسة", "start": "17:50", "end": "19:30" }
  ],
  "midterms": [
    {
      "subjectId": "system-analysis",
      "subjectName": "تحليل النظم والتصميم المنطقي",
      "date": "2026-11-14",
      "dayAr": "السبت",
      "startTime": "11:00",
      "endTime": "11:30",
      "venue": "مراكز الاختبارات الإلكترونية بكلية الحقوق والهندسة",
      "studentsCount": 403,
      "marks": 10,
      "lecturesInScope": [1, 2, 3, 4, 5],
      "scopeNote": "أول 5 محاضرات"
    },
    {
      "subjectId": "research-methods",
      "subjectName": "أساليب البحث العلمي",
      "date": "2026-11-15",
      "dayAr": "الأحد",
      "startTime": "11:00",
      "endTime": "11:30",
      "venue": "مراكز الاختبارات الإلكترونية بكلية الحقوق والهندسة",
      "studentsCount": 410,
      "marks": 15,
      "marksNote": "15 درجة ميدترم + 10 درجات Presentation البحث (أو 25 درجة حسب التوزيع النهائي)",
      "lecturesInScope": [1, 2, 3, 4, 5],
      "scopeNote": "أول 4 أو 5 محاضرات"
    },
    {
      "subjectId": "information-theory",
      "subjectName": "نظرية المعلومات",
      "date": "2026-11-16",
      "dayAr": "الاثنين",
      "startTime": "11:00",
      "endTime": "11:30",
      "venue": "مراكز الاختبارات الإلكترونية بكلية الحقوق والهندسة",
      "studentsCount": 427,
      "marks": 25,
      "lecturesInScope": [1, 2, 3, 4, 5, 6, 7],
      "scopeNote": "أول 6 أو 7 محاضرات"
    },
    {
      "subjectId": "database-2",
      "subjectName": "قواعد بيانات 2",
      "date": "2026-11-17",
      "dayAr": "الثلاثاء",
      "startTime": "11:00",
      "endTime": "11:30",
      "venue": "مراكز الاختبارات الإلكترونية بكلية الحقوق والهندسة",
      "studentsCount": 433,
      "marks": 10,
      "lecturesInScope": [1, 2, 3, 4, 5, 6],
      "scopeNote": "أول 6 محاضرات"
    },
    {
      "subjectId": "computer-networks",
      "subjectName": "شبكات الحاسب",
      "date": "2026-11-18",
      "dayAr": "الأربعاء",
      "startTime": "11:00",
      "endTime": "11:30",
      "venue": "مراكز الاختبارات الإلكترونية بكلية الحقوق والهندسة",
      "studentsCount": 428,
      "marks": 10,
      "lecturesInScope": [1, 2, 3, 4, 5, 6, 7],
      "scopeNote": "أول 7 محاضرات (متاح منها 6 ملفات لأن محاضرة 3 و4 مدمجين)"
    }
  ],
  "coursesMeta": {
    "system-analysis": {
      "code": "IS312P",
      "doctors": ["أ.د/ سمير عبدالرازق"],
      "midtermMarks": "10 درجات",
      "midtermLectures": [1, 2, 3, 4, 5],
      "midtermScopeText": "من المحاضرة 1 إلى المحاضرة 5"
    },
    "database-2": {
      "code": "IS313P",
      "doctors": ["أ.د/ أميرة رزق"],
      "midtermMarks": "10 درجات",
      "midtermLectures": [1, 2, 3, 4, 5, 6],
      "midtermScopeText": "من المحاضرة 1 إلى المحاضرة 6"
    },
    "information-theory": {
      "code": "IS311T",
      "doctors": ["د/ إسراء جمال"],
      "midtermMarks": "25 درجة",
      "midtermLectures": [1, 2, 3, 4, 5, 6, 7],
      "midtermScopeText": "من المحاضرة 1 إلى المحاضرة 7"
    },
    "research-methods": {
      "code": "IS315T",
      "doctors": ["د/ هالة عكاشة"],
      "midtermMarks": "15 درجة (+ 10 درجات عرض البحث)",
      "midtermLectures": [1, 2, 3, 4, 5],
      "midtermScopeText": "من المحاضرة 1 إلى المحاضرة 5"
    },
    "computer-networks": {
      "code": "IS314P",
      "doctors": ["أ.د/ أحمد عطوان", "أ.د/ محمد محفوظ"],
      "midtermMarks": "10 درجات",
      "midtermLectures": [1, 2, 3, 4, 5, 6, 7],
      "midtermScopeText": "أول 7 محاضرات"
    }
  },
  "sharedLectures": [
    { "day": "الأحد", "periods": [1, 2], "sections": [1, 2, 3, 4, 5, 6], "subjectId": "computer-networks", "title": "محاضرة شبكات الحاسب", "instructor": "أ.د/ أحمد عطوان، أ.د/ محمد محفوظ", "room": "مدرج 3", "type": "lecture" },
    { "day": "الأحد", "periods": [2, 3], "sections": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "subjectId": "research-methods", "title": "محاضرة أساليب البحث العلمي", "instructor": "د/ هالة عكاشة", "room": "مدرج 2", "type": "lecture" },
    { "day": "الأحد", "periods": [3, 4], "sections": [7, 8, 9, 10, 11], "subjectId": "computer-networks", "title": "محاضرة شبكات وأمن الحاسبات", "instructor": "أ.د/ أحمد عطوان، أ.د/ محمد محفوظ", "room": "مدرج 3", "type": "lecture" },
    { "day": "الاثنين", "periods": [1, 2], "sections": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "subjectId": "system-analysis", "title": "محاضرة تحليل النظم والتصميم المنطقي", "instructor": "أ.د/ سمير عبدالرازق", "room": "مدرج 3", "type": "lecture" },
    { "day": "الاثنين", "periods": [3, 4], "sections": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "subjectId": "information-theory", "title": "محاضرة نظرية المعلومات", "instructor": "د/ إسراء جمال", "room": "مدرج 3", "type": "lecture" },
    { "day": "الخميس", "periods": [1, 2], "sections": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "subjectId": "database-2", "title": "محاضرة قواعد بيانات 2", "instructor": "أ.د/ أميرة رزق", "room": "مدرج 2", "type": "lecture" }
  ],
  "sectionsTimetable": {
    "1": [
      { "day": "السبت", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ نورمين لطفي", "room": "قاعة 2", "type": "section" },
      { "day": "السبت", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ أحمد كرد", "room": "B4 (Hardware)", "type": "section" },
      { "day": "الاثنين", "periods": [4, 5], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ مروة جمال", "room": "C6", "type": "section" },
      { "day": "الاثنين", "periods": [5, 6], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أمنية المنزلاوي", "room": "مدرج 3", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ محمد البربير", "room": "B5", "type": "section" }
    ],
    "2": [
      { "day": "السبت", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ نورمين لطفي", "room": "قاعة 2", "type": "section" },
      { "day": "الأحد", "periods": [3, 4], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ أحمد كرد", "room": "B3", "type": "section" },
      { "day": "الأحد", "periods": [5, 6], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ محمد البربير", "room": "B5", "type": "section" },
      { "day": "الاثنين", "periods": [5, 6], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أمنية المنزلاوي", "room": "مدرج 3", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ مروة جمال", "room": "B2 (Hardware)", "type": "section" }
    ],
    "3": [
      { "day": "الاثنين", "periods": [4, 5], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أمنية المنزلاوي", "room": "قاعة 1", "type": "section" },
      { "day": "الاثنين", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ أحمد كرد", "room": "D1", "type": "section" },
      { "day": "الثلاثاء", "periods": [2, 3], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ مروة جمال", "room": "D1", "type": "section" },
      { "day": "الثلاثاء", "periods": [3, 4], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ آلاء جلال", "room": "B2 (Hardware)", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 6", "type": "section" }
    ],
    "4": [
      { "day": "الأحد", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ نهى عاطف", "room": "B3", "type": "section" },
      { "day": "الاثنين", "periods": [5, 6], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أمنية المنزلاوي", "room": "قاعة 1", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 6", "type": "section" },
      { "day": "الخميس", "periods": [4, 5], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ مروة جمال", "room": "C2", "type": "section" },
      { "day": "الخميس", "periods": [5, 6], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ آلاء جلال", "room": "B3", "type": "section" }
    ],
    "5": [
      { "day": "الاثنين", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ أحمد كرد", "room": "C7", "type": "section" },
      { "day": "الاثنين", "periods": [6, 6], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ منة الله سراج", "room": "A4", "type": "section" },
      { "day": "الثلاثاء", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 6", "type": "section" },
      { "day": "الثلاثاء", "periods": [4, 5], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ آلاء جلال", "room": "C6", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أحمد عماد الدين", "room": "قاعة 1", "type": "section" }
    ],
    "6": [
      { "day": "الأحد", "periods": [1, 2], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ آلاء جلال", "room": "B4 (Hardware)", "type": "section" },
      { "day": "الأحد", "periods": [3, 4], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ منة الله سراج", "room": "D8", "type": "section" },
      { "day": "الثلاثاء", "periods": [3, 4], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 6", "type": "section" },
      { "day": "الثلاثاء", "periods": [4, 5], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ محمود سعيد، م/ هداية عادل", "room": "B5", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أحمد عماد الدين", "room": "قاعة 1", "type": "section" }
    ],
    "7": [
      { "day": "السبت", "periods": [3, 4], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ هداية عادل", "room": "B2 (Hardware)", "type": "section" },
      { "day": "السبت", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ عبير الخميسي، م/ محمود سعيد", "room": "B1", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ منة الله سراج", "room": "C1", "type": "section" },
      { "day": "الخميس", "periods": [4, 5], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 2", "type": "section" },
      { "day": "الخميس", "periods": [5, 6], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أحمد عماد الدين", "room": "قاعة 3 (Hardware)", "type": "section" }
    ],
    "8": [
      { "day": "السبت", "periods": [5, 6], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ عبير الخميسي، م/ محمود سعيد", "room": "C6", "type": "section" },
      { "day": "الأحد", "periods": [3, 4], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ آلاء جلال", "room": "B2 (Hardware)", "type": "section" },
      { "day": "الأحد", "periods": [4, 5], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ منة الله سراج", "room": "B5", "type": "section" },
      { "day": "الخميس", "periods": [4, 5], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ آية عياد", "room": "قاعة 2", "type": "section" },
      { "day": "الخميس", "periods": [5, 6], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ أحمد عماد الدين", "room": "قاعة 3 (Hardware)", "type": "section" }
    ],
    "9": [
      { "day": "السبت", "periods": [1, 2], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ نورمين لطفي", "room": "B1", "type": "section" },
      { "day": "الأحد", "periods": [3, 4], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ طاهر العدلي", "room": "قاعة 2", "type": "section" },
      { "day": "الأحد", "periods": [4, 5], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ محمود سعيد، م/ نهى عاطف", "room": "B2 (Hardware)", "type": "section" },
      { "day": "الأحد", "periods": [5, 6], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ محمد سعد", "room": "C6", "type": "section" },
      { "day": "الأربعاء", "periods": [1, 2], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ كرم محمد", "room": "B2 (Hardware)", "type": "section" }
    ],
    "10": [
      { "day": "السبت", "periods": [1, 2], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ نورمين لطفي", "room": "B1", "type": "section" },
      { "day": "الأحد", "periods": [3, 4], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ طاهر العدلي", "room": "قاعة 2", "type": "section" },
      { "day": "الأحد", "periods": [4, 5], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ محمد سعد", "room": "D7", "type": "section" },
      { "day": "الأربعاء", "periods": [2, 3], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ كرم محمد", "room": "B3", "type": "section" },
      { "day": "الأربعاء", "periods": [4, 5], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ عبير الخميسي", "room": "B4 (Hardware)", "type": "section" }
    ],
    "11": [
      { "day": "الأحد", "periods": [1, 1], "subjectId": "information-theory", "title": "سكشن نظرية المعلومات", "instructor": "م/ طاهر العدلي", "room": "قاعة 2", "type": "section" },
      { "day": "الأحد", "periods": [2, 2], "subjectId": "research-methods", "title": "سكشن أساليب البحث العلمي", "instructor": "م/ ريهام الباز", "room": "A4", "type": "section" },
      { "day": "الثلاثاء", "periods": [3, 4], "subjectId": "system-analysis", "title": "سكشن تحليل النظم والتصميم المنطقي", "instructor": "م/ محمود سعيد، م/ هداية عادل", "room": "D7", "type": "section" },
      { "day": "الثلاثاء", "periods": [4, 5], "subjectId": "database-2", "title": "سكشن قواعد بيانات 2", "instructor": "م/ محمد عبدالسلام", "room": "D1", "type": "section" },
      { "day": "الخميس", "periods": [3, 4], "subjectId": "computer-networks", "title": "سكشن شبكات الحاسب", "instructor": "م/ كرم محمد", "room": "B4 (Hardware)", "type": "section" }
    ]
  }
}
```

### 1.2 قواعد التصنيف التلقائي في `scripts/build.mjs`
عدّل `scripts/build.mjs` ليضيف دالة `classifyItem(subjectId, sectionId, item)` تشتغل أثناء البناء وتملأ `item.lecture` و`item.kind` و`item.keywords` تلقائياً لو مش موجودين:

1. **استخراج رقم المحاضرة (`extractLectureNumber(item)`)**:
   - افحص `item.path` و`item.title` بالترتيب:
   - لو المسار أو العنوان فيه مدى محاضرات للمراجعة النهائية أو الميدترم (مثل `1-to-6`, `1-to-4`, `lec-1-to-7`, `first-6-lectures`, `5_Lectures`, `1 - 5 Lectures`) أو جوه فولدر `midterm-revision`:
     - خلي `lecture = null` و`kind = "review"` (عشان يظهر في بلوك **"مراجعات الميدترم وبنوك الأسئلة الشاملة"** في أعلى المادة وميتكررش جوه محاضرة واحدة).
   - غير كده، التقط رقم المحاضرة من الأنماط:
     - `/lecture[-_\s]*0*(\d+)/i` أو `/lec[-_\s]*0*(\d+)/i`
     - أو من العربي: `/المحاضره\s*(\d+)/` أو `/محاضره\s*(\d+)/` أو المسميات الترتيبية (`الأولى`→1، `الثانية`→2، `الثالثة`→3، `الرابعة`→4، `الخامسة`→5، `السادسة`→6، `السابعة`→7، `الثامنة`→8، `التاسعة`→9، `العاشرة`→10).
   - **حالة خاصة في شبكات الحاسب (`computer-networks`)**: الملف `computer-networks-lecture-3-4-data-link-layer.pdf` يحمل `lecture: 3` مع `lectureSpan: [3, 4]` عشان يظهر في صف المحاضرة 3 والمحاضرة 4.

2. **تحديد نوع الملف (`inferKind(sectionId, item)`)**:
   - لو `sectionId === "midterm-revision"`: يرجع `"review"`.
   - لو الاسم أو المسار فيه `book` أو `كتاب` أو `reference`: يرجع `"book"`.
   - لو الاسم أو المسار فيه `unsolved` أو `بدون حل` أو (`question` / `أسئلة` / `اسئلة` بدون كلمة `solved` أو `حل` أو `إجابة`): يرجع `"questions"`.
   - لو الاسم أو المسار فيه `solved` أو `محلول` أو `إجابات` أو `اجابات` أو `حل` أو `answers` أو `solution`: يرجع `"solution"`.
   - لو `sectionId === "summaries"` أو الاسم فيه `summary` أو `ملخص` أو `mind-map` أو `خريطة ذهنية` أو `handwritten` أو `ملاحظات`: يرجع `"summary"`.
   - لو `sectionId === "lectures"` أو الاسم فيه `lecture` أو `محاضرة`: يرجع `"lecture"`.
   - الافتراضي: `"summary"`.

3. **توليد `assets/data.js` في `scripts/build.mjs`**:
   - اقرأ `data/subjects.json`، `data/schedule.json` (لو موجود)، وكل ملفات `data/questions/*.json` (لو موجودة).
   - اكتب في `assets/data.js`:
     ```js
     window.__SITE_DATA__ = /* subjects.json */;
     window.__SITE_SCHEDULE__ = /* schedule.json or null */;
     window.__SITE_QUESTIONS__ = /* { "system-analysis": [...], ... } */;
     ```
   - حافظ على `node scripts/build.mjs --check` شغّال بدون أخطاء.

---

## المرحلة الثانية (Phase 2): هيكلة المحاضرات الرباعية (4-Slot Lecture Matrix) + بانر السكشن والميدترم + صفحة الجدول (`#schedule`)

### الهدف من المرحلة الثانية
1. **اختيار السكشن (`سكشن 1` إلى `سكشن 11`)** في الهيدر مع حفظه في `localStorage['hub:mySection']` ودعم `?sec=N`.
2. **البانر الذكي المدمج (Smart Today & Midterm Strip)** أعلى الصفحة:
   - يعرض محاضرات وسكاشن **اليوم** (أو غداً لو اليوم خلص/إجازة) الخاصة بسكشن الطالب المختار فقط (شاملة المحاضرات المشتركة + سكاشن السكشن المختار).
   - يعرض **العد التنازلي لأقرب امتحان ميدترم قادم** (المادة، التاريخ، الساعة 11:00–11:30 ص، المكان، عدد المحاضرات الداخلة، والدرجة).
3. **بطاقة تعريف المادة (Course Info Bar)** أعلى كل مادة:
   - اسم الدكتور + اسم معيد السكشن المختار للطالب + درجة الميدترم + نطاق محاضرات الميدترم + زر **"اختبر نفسك في المادة (`#practice`)"**.
4. **عرض المحاضرات الرباعي (`4-Slot Lecture Matrix`)**:
   - لكل محاضرة `1..N` صف واضح مقسم لـ 4 خانات ثابتة:
     1. `المحاضرة` (`kind === "lecture"`)
     2. `الملخص` (`kind === "summary"`)
     3. `الأسئلة` (`kind === "questions"`)
     4. `الحل` (`kind === "solution"`)
   - لو الخانة فيها ملف واحد: يظهر زر التحميل المباشر + زر المعاينة (العين).
   - لو الخانة فيها أكتر من ملف (مثلاً ملخصين لنفس المحاضرة): تظهر قائمة الملفات داخل نفس الخانة.
   - لو الخانة فاضية: يظهر مكانها نص هادئ `"غير متاح حالياً"` بدون كسر شكل الجدول.
   - كل صف محاضرة داخلة في `midtermLectures` يظهر جنبه بادج واضح: `🔥 داخل في الميدترم`.
   - كل صف محاضرة فيه Checkbox صغير `"تمت المذاكرة"` يحفظ في `localStorage['hub:studied']` ويحدّث شريط التقدم للمادة.
   - أعلى جدول المحاضرات يظهر بلوك خاص ومميز لـ **"مراجعات الميدترم والملفات الشاملة"** (`kind === "review"` أو `"book"` أو `lecture === null`)، مع زر تشغيل مباشر لأي ملف `.html` تفاعلي أو فتح `#practice`.
   - زر تبديل طريقة العرض: `عرض كجدول محاضرات (الجديد)` ⇄ `عرض كأقسام كلاسيكية (القديم)`.
5. **صفحة الجدول الكامل (`#schedule`)**:
   - تبويب في القائمة الجانبية يفتح صفحة الجدول الكاملة فيها:
     - جدول الأسبوع الكامل لسكشن الطالب (أو كل السكاشن).
     - جدول امتحانات الميدترم الـ 5 بالتفصيل.
     - الخريطة الزمنية للترم ومواعيد الفترات (`مواعيد الفترات - خريف 2026`).

---

## المرحلة الثالثة (Phase 3): محرك البحث المتقدم والفلاتر اللحظية (Search by Words · Lectures · Subjects · Kind)

### الهدف من المرحلة الثالثة
بناء محرك بحث لحظي سريع داخل `assets/app.js` يدعم البحث بـ **الكلمات (عربي/إنجليزي)، رقم المحاضرة، المادة، ونوع الملف**، مع البحث داخل **بنك الأسئلة** في نفس الوقت.

### المواصفات التقنية لمحرك البحث
1. **دالة تطبيع النص العربي (`normalizeAr(str)`)**:
   ```js
   function normalizeAr(str) {
     return String(str || "")
       .toLowerCase()
       .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
       .replace(/[أإآٱ]/g, "ا")
       .replace(/ة/g, "ه")
       .replace(/ى/g, "ي")
       .replace(/ؤ/g, "و")
       .replace(/ئ/g, "ي")
       .replace(/[-_./\\()[\]]+/g, " ")
       .replace(/\s+/g, " ")
       .trim();
   }
   ```
2. **مرادفات ذكية ثنائية اللغة (`SYNONYM_MAP`)**:
   - كتابة `محاضرة 3` أو `lec 3` أو `lecture 3` أو `محاضره ٣` تطابق تلقائياً `lecture === 3`.
   - كتابة `ملخص` تطابق `kind === "summary"`، `اسئله`/`امتحان` تطابق `kind === "questions"` و`"review"`، `حل`/`اجابه` تطابق `kind === "solution"`.
   - كتابة `ميدترم` أو `midterm` تطابق ملفات المراجعات والمحاضرات الداخلة في الميدترم.
3. **شريط الفلاتر السريعة (Facet Chips Bar)** تحت مربع البحث مباشرة:
   - **فلتر المادة**: `الكل` | `تحليل النظم` | `قواعد بيانات 2` | `نظرية المعلومات` | `أساليب البحث` | `شبكات الحاسب`
   - **فلتر المحاضرة**: `كل المحاضرات` | `محاضرة 1` .. `محاضرة 7` | `مراجعات شاملة`
   - **فلتر النوع**: `الكل` | `📖 المحاضرة` | `📝 الملخص` | `❓ الأسئلة` | `✅ الحل` | `🔥 مراجعة ميدترم`
4. **نتائج البحث المجمعة (Grouped Search Results)**:
   - قسم 1: **الملفات المطابقة** (مع إظهار بادج المادة + رقم المحاضرة + نوع الملف + تظليل الكلمة المطابقة `<mark>`).
   - قسم 2: **الأسئلة المطابقة من بنك الامتحانات** (لو الطالب كتب مصطلح مثل `DFD` أو `Agile` أو `Normalization` أو `Entropy` أو `OSI` يظهر له الأسئلة اللي فيها المصطلح ده مع زر `"افتح في الاختبار"`).

---

## المرحلة الرابعة (Phase 4): محرك الامتحانات التفاعلي (`assets/quiz.js`) + بنوك أسئلة الـ 5 مواد + بنك الأخطاء (`#mistakes`)

### الهدف من المرحلة الرابعة
تحويل تجربة ملف `1 - 5 Lectures System Analysis Qestion.html` إلى محرك امتحانات قياسي يشتغل على **الـ 5 مواد كلها** مع تخصيص كامل حسب احتياج الطالب.

### 4.1 مواصفات محرك الامتحانات (`assets/quiz.js`)
يفتح من التبويب `#practice` (أو من زر `"اختبر نفسك"` داخل أي مادة):
1. **إعدادات الامتحان قبل البدء (Exam Builder Panel)**:
   - **اختيار المادة**: واحدة من الـ 5 مواد (أو مراجعة شاملة).
   - **اختيار المحاضرات**: Checkboxes (`محاضرة 1`، `محاضرة 2`، ... أو زر `"نطاق الميدترم بالكامل"` أو `"المنهج كله"`).
   - **اختيار المستوى (Difficulty)**:
     - `الكل (شامل)`
     - `🟢 المستوى الأول (تأسيس ومفاهيم مباشرة - Easy)`
     - `🟡 المستوى الثاني (فهم وتطبيق ومقارنات - Medium)`
     - `🔴 المستوى الثالث (أسئلة امتحانات ومواقف مركبة - Hard)`
   - **اختيار الوضع (Mode)**:
     - `وضع التدريب الفوري (Practice Mode)`: يظهر الصح والغلط والشرح (`explanation`) فور اختيار الإجابة.
     - `وضع محاكاة الميدترم (Timed Exam Mode)`: مؤقت زمني (مثلاً 30 دقيقة كالميدترم الحقيقي)، بدون إظهار الإجابات إلا بعد الضغط على `"تسليم الامتحان"`، ثم يعرض النتيجة النهائية وتقرير تفصيلي بكل سؤال.
   - **عدد الأسئلة**: `10` | `20` | `30` | `50` | `كل الأسئلة المتاحة` + خيار `"ترتيب عشوائي للأسئلة"`.

2. **بنك أخطائي الذكي (`#mistakes` & `localStorage['hub:mistakes']`)**:
   - أي سؤال يغلط فيه الطالب في وضع التدريب أو الامتحان يتسجل تلقائياً في `hub:mistakes` مع `wrongCount` وتاريخ آخر محاولة.
   - صفحة `#mistakes` تعرض كل الأسئلة اللي الطالب غلط فيها مجمعة بالمادة والمحاضرة، مع زر **"امتحن في أخطائي فقط"**.
   - لما الطالب يجاوب السؤال صح **مرتين متتاليتين (`streak >= 2`)** في امتحان الأخطاء، يظهر له إشعار `"تم إتقان السؤال 🎉"` ويتشال من قائمة الأخطاء النشطة.
   - أزرار **"تصدير تقدمي وأخطائي (JSON)"** و**"استيراد ملف تقدم"** عشان الطالب يقدر ينقل أخطاءه بين الموبايل واللابتوب.

### 4.2 مخطط ملفات الأسئلة (`data/questions/<subject-id>.json`)
يتم إنشاء 5 ملفات JSON في `data/questions/`:
1. `data/questions/system-analysis.json`: تحويل الـ **75 سؤال** الموجودة في `1 - 5 Lectures System Analysis Qestion.html` بالكامل (المحاضرات 1 إلى 5) مع إضافة حقل `difficulty` (`"easy"` | `"medium"` | `"hard"`) وشرح مختصر `explanation`.
2. `data/questions/research-methods.json`: أسئلة المحاضرات 1 إلى 4 من ملف `research-1-to-4-exam-questions-byamr-hesmam.pdf` (أنواع البحث، المتغيرات المستقلة والتابعة، الفروض، العينات، أدوات جمع البيانات).
3. `data/questions/information-theory.json`: أسئلة المحاضرات 1 إلى 7 من `information-theory-question-bank-full-solutions-amr-hesham.pdf` (كمية المعلومات $I(x)$، الإنتروبي $H(X)$، الـ Mutual Information، كود هافمان Huffman، قناة الاتصال، Shannon-Fano).
4. `data/questions/database-2.json`: أسئلة المحاضرات 1 إلى 6 من `database-previous-exam-questions-first-6-lectures-midterm-youssef.pdf` (System Catalog، Query Processing & Optimization، Transactions & ACID، Concurrency Control & Locking، Recovery & Log-based protocols).
5. `data/questions/computer-networks.json`: أسئلة المحاضرات 1 إلى 6 من `computer-networks-exam-bank-lectures-1-to-6.pdf` (OSI & TCP/IP Layers، Physical Layer & Transmission Media، Data Link Layer، Framing & Error Detection CRC/Checksums، MAC Protocols).

كل سؤال يتبع الـ Schema الموحد التالي:
```json
{
  "id": "sa-l1-001",
  "subjectId": "system-analysis",
  "lecture": 1,
  "difficulty": "easy",
  "type": "mcq",
  "q": "A system must have which of the following core characteristics?",
  "qAr": "أي من الخصائص الأساسية التالية يجب أن تتوفر في النظام؟",
  "options": [
    "Interdependent components working toward a common purpose",
    "Complete independence from its environment",
    "Absence of constraints and boundaries",
    "A single monolithic component"
  ],
  "answer": 0,
  "explanation": "النظام يتكون من مكونات مترابطة (Interdependent components) تعمل معاً لتحقيق هدف مشترك (Purpose) داخل حدود (Boundary) وبيئة (Environment)."
}
```

---

## 5. قائمة فحص المراجع الأول (Senior Architect Review Checklist)

بعد ما DeepSeek يخلص كل مرحلة وتجيب الكود هنا، هراجعه على **7 بوابات فحص صارمة (Quality Gates)**:

1. **بوابة البناء والتكامل (`Build & Manifest Gate`)**:
   - تشغيل `node scripts/build.mjs --check` والتأكد من تطابق `data/subjects.json` و`assets/data.js` بنسبة 100%.
2. **بوابة العمل بدون سيرفر (`file:// Offline Sandbox Gate`)**:
   - تشغيل الموقع داخل بيئة معزولة بدون `fetch()` والتأكد إن `window.__SITE_DATA__` و`window.__SITE_SCHEDULE__` و`window.__SITE_QUESTIONS__` بتتحمل فوراً وبدون أي `SyntaxError` أو `ReferenceError`.
3. **بوابة التقسيمة الرباعية (`4-Slot Matrix Accuracy Gate`)**:
   - فحص إن كل محاضرة في الـ 5 مواد مربوط فيها `المحاضرة · الملخص · الأسئلة · الحل` صح، وإن ملفات الميدترم الشاملة مفصولة في بلوك المراجعات ومش مبوظة أرقام المحاضرات.
4. **بوابة دقة الجداول والسكاشن (`11-Section Timetable Gate`)**:
   - اختبار اختيار السكاشن من `1` لـ `11` والتأكد إن كل سكشن بيعرض المعيد والقاعة والفترة الصح + العد التنازلي للميدترم الجاي.
5. **بوابة محرك البحث العربي/الإنجليزي (`Search & Normalization Gate`)**:
   - اختبار البحث بكلمات فيها همزات وتاء مربوطة وأرقام محاضرات ومصطلحات إنجليزي والتأكد من سرعة ودقة الفلترة.
6. **بوابة محرك الامتحانات وبنك الأخطاء (`Exam & Mistake Bank Gate`)**:
   - اختبار فلترة المحاضرات والمستويات (`Easy/Medium/Hard`)، وضع الـ `Practice` مقابل `Exam`، وحفظ الأخطاء في `hub:mistakes` واستبعادها بعد إجابتين صحيحتين.
7. **بوابة عدم كسر الميزات القديمة (`Zero-Regression Gate`)**:
   - التأكد إن الضغط على الصف بيحمّل الملف، والضغط على العين بيفتح المعاينة، والـ Dark/Light theme شغال، وتصميم الموبايل RTL سليم 100%.
