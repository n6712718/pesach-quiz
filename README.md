# חידון הלכות פסח – ישיבת בני עקיבא עלי

## הקמה מהירה

### 1. התקנת תלויות
```bash
cd pesach-quiz
npm install
```

### 2. הגדרת Supabase
1. לך ל-[supabase.com](https://supabase.com) → צור פרויקט חדש (חינמי)
2. ב-SQL Editor – הרץ את הקובץ `supabase/schema.sql`
3. ב-Database > Replication – הפעל Realtime על טבלת `participants`

### 3. הגדרת משתני סביבה
```bash
cp .env.local.example .env.local
```
ערוך את `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_ADMIN_PASSWORD=הסיסמה-הסודית-שלך
NEXT_PUBLIC_START_DATE=2025-04-13   # יום תחילת החידון
```

### 4. הרצה מקומית
```bash
npm run dev
```
פתח [http://localhost:3000](http://localhost:3000)

### 5. פריסה ל-Vercel
```bash
npm install -g vercel
vercel --prod
```
הוסף משתני סביבה ב-Vercel Dashboard.

---

## מבנה הפרויקט
```
app/
  page.tsx          – דף הבית
  register/         – הרשמה / כניסה
  learn/            – לימוד יומי + שאלון
  leaderboard/      – לוח מובילים בזמן אמת
  admin/            – פאנל ניהול (סיסמה נדרשת)
lib/
  supabase.ts       – חיבור ל-Supabase
  types.ts          – טיפוסי TypeScript
  data.ts           – קובץ ראשי לתוכן
  data-part1..5.ts  – 20 יום × 10 שאלות
supabase/
  schema.sql        – טבלאות ומדיניות
```

## פאנל ניהול
כתובת: `/admin`
סיסמה: כפי שהגדרת ב-`NEXT_PUBLIC_ADMIN_PASSWORD`

## תכונות
- ✅ הרשמה עם שם + כיתה + אימייל
- ✅ 20 יום × 10 שאלות מפניני הלכה
- ✅ צבירת נקודות + שמירת streak
- ✅ לוח מובילים עם עדכון בזמן אמת
- ✅ הגרלות ידניות (רגילה + גדולה)
- ✅ פאנל ניהול מאובטח
- ✅ עיצוב RTL מלא, מותאם לנייד
