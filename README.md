# سنة تالتة — الترم الأول

موقع ثابت (static) لتنظيم ملازم ومحاضرات ومراجعات الترم، بواجهة عربية RTL:
تاب لكل مادة، أقسام قابلة للطي، معاينة داخل الموقع، تحميل ملف واحد أو المادة كاملة
أو كل الملفات، وأماكن جاهزة لروابط يوتيوب لكل محاضرة.

- بلا خادم، بلا قاعدة بيانات، بلا اعتماديات (npm install غير مطلوب).
- البيانات كلها في ملف واحد: `data/subjects.json`.
- يعمل على GitHub Pages مجانًا (المستودع يجب أن يكون Public في الخطة المجانية).

---

## 1) تشغيل محلي

```powershell
cd site
python -m http.server 8080
# افتح http://localhost:8080
```

يمكن أيضًا فتح `index.html` بالنقر المزدوج مباشرة: التابات والبحث والتحميل تعمل لأن
البيانات مضمّنة في `assets/data.js`. لكن المعاينة الداخلية والـ ZIPs تحتاج سيرفرًا
(المتصفح يمنع `fetch` وروابط `downloads/` عبر `file://` في بعض الحالات)، فالتشغيل
عبر السيرفر هو الطريقة الموصى بها.

> بعد أي تعديل يدوي على `data/subjects.json` شغّل `node scripts/build.mjs` لتحديث
> `assets/data.js` (النسخة العادية للتصفح المباشر).

للتأكد من أن المانيفست متطابق مع الملفات:

```powershell
node scripts/build.mjs --check
```

## 2) بنية المشروع

```
site/
├─ index.html
├─ robots.txt               ← يمنع الفهرسة (الموقع "غير مُدرج")
├─ .nojekyll                ← مطلوب حتى لا يتجاهل GitHub Pages مجلدات معيّنة
├─ assets/
│  ├─ app.js                ← كل الواجهة (تابات، بحث، معاينة، تحميل)
│  ├─ data.js               ← نسخة مضمّنة من المانيفست (تتولد تلقائيًا)
│  ├─ styles.css            ← التصميم + الوضع الليلي
│  └─ favicon.svg
├─ data/subjects.json       ← المصدر الوحيد للحقيقة
├─ files/<subject>/<section>/<slug>.pdf
├─ downloads/               ← ZIP مولّدة (غير مرفوعة للمستودع)
└─ scripts/
   ├─ import.mjs            ← استيراد أولي من مجلدات المواد الأصلية
   ├─ build.mjs             ← تحقق من المانيفست (+ --fix لتحديث الأحجام)
   ├─ build-zips.ps1        ← توليد كل ملفات ZIP
   └─ add-file.mjs          ← إضافة ملف جديد من سطر الأوامر
```

## 3) إضافة محاضرة أو ملف جديد

الطريقة الأسهل (بدون كود) من واجهة GitHub:

1. ارفع الـ PDF إلى `files/<المادة>/<القسم>/`.
2. افتح `data/subjects.json` وأضف عنصرًا داخل `files` للقسم:

```json
{
  "id": "lecture-07",
  "title": "المحاضرة 07",
  "original": "Lecture 07.pdf",
  "path": "files/computer-networks/lectures/lecture-07.pdf",
  "ext": "pdf",
  "size": 1234567,
  "youtube": "https://youtu.be/XXXXXXXXXXX"
}
```

3. Commit — سيعمل الـ Action تلقائيًا، يبني الـ ZIPs، وينشر الموقع.

أو من سطر الأوامر:

```powershell
node scripts/add-file.mjs --subject computer-networks --section lectures `
  --file "C:\path\to\Lecture 07.pdf" --title "المحاضرة 07" `
  --youtube "https://youtu.be/XXXXXXXXXXX"

powershell -ExecutionPolicy Bypass -File scripts/build-zips.ps1
```

`--subject` و`--section` هما الـ `id` في المانيفست. لو القسم غير موجود يُنشأ تلقائيًا.

## 4) روابط يوتيوب

- رابط المادة كاملة (قائمة تشغيل) → حقل `youtube` داخل المادة.
- رابط محاضرة واحدة → حقل `youtube` داخل الملف.

عند وجود رابط تظهر أيقونة تشغيل بجانب الملف، وزر «قائمة المحاضرات» في بطاقة المادة.

## 5) نشر الموقع على GitHub Pages

1. أنشئ مستودعًا **Public** جديدًا.
2. اجعل محتوى مجلد `site/` هو جذر المستودع:

```powershell
cd site
git init
git add .
git commit -m "initial site"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

3. في المستودع: `Settings → Pages → Build and deployment → Source: GitHub Actions`.
4. انتظر الـ workflow «Deploy study site»، ثم افتح `https://<user>.github.io/<repo>/`.

> الـ ZIPs لا تُرفع إلى git (انظر `.gitignore`) — يبنيها الـ Action وينشرها فقط.
> حجم الـ checkout عندك ~200MB، وحجم الموقع المنشور ~525MB (الحد الأقصى 1GB).

### حدود يجب معرفتها

- **الخطة المجانية = مستودع Public.** أي شخص لديه الرابط يرى الملفات. `robots.txt`
  و`noindex` يمنعان محركات البحث فقط، وليس الوصول المباشر. لو ده غير مقبول قانونيًا،
  الحل هو استضافة مع حماية (Cloudflare Pages + Access) أو مستودع خاص بخطة مدفوعة.
- **GitHub Pages لا يستقبل رفع ملفات من الواجهة.** الرفع = Commit في المستودع (قسم 3).
- الملف الواحد يجب أن يكون أقل من 100MB، وإجمالي الموقع أقل من 1GB.
- نطاق ترددي مجاني ~100GB/شهر: تحميل `all.zip` مرة واحدة ≈ 173MB.

## 6) ما بعد التسليم (أفكار)

- إضافة روابط يوتيوب الفعلية.
- صفحة `admin.html` للرفع بالسحب والإفلات عبر GitHub API (اختياري).
- تحويل ملفات PPTX إلى PDF لمعاينتها داخل الموقع.
