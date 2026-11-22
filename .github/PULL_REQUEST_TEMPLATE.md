## Summary / الملخص

<!-- Describe what this PR adds or fixes (e.g., new lecture PDF, quiz fix, schedule update, UI improvement). -->

## Type of Change / نوع التعديل

- [ ] Study material (`files/` + `data/subjects.json`) / إضافة محاضرة أو ملخص أو أسئلة
- [ ] Question bank or schedule (`data/questions/`, `data/schedule.json`) / تحديث بنك الأسئلة أو الجدول
- [ ] UI / Frontend bug fix (`index.html`, `assets/`) / إصلاح واجهة أو خطأ برمجي
- [ ] Documentation / التوثيق

## Checklist / قائمة التحقق

- [ ] Ran `node scripts/build.mjs --fix` (or `node scripts/build.mjs`) to update `data/subjects.json` and `assets/data.js`
- [ ] Ran `node scripts/build.mjs --check` and `node scripts/check-pr.mjs` locally with zero errors
- [ ] Single files added to `files/` are under 50 MB and compressed cleanly if scanned/large
- [ ] No private student data, secrets/tokens, or unauthorized copyrighted textbooks are included
- [ ] For major UI or architecture changes, an Issue was opened and discussed first
