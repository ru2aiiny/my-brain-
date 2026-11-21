import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Target,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  Edit3,
  Sparkles,
  Clock,
  ShieldAlert,
  RotateCcw,
  Sun,
  Moon,
  Bell,
  BarChart3,
  ArrowRight,
  Layers,
  CalendarDays,
  Calendar,
  PlayCircle,
  Terminal,
  FileCheck,
  Award,
  Plus,
  X,
  SlidersHorizontal,
  FastForward,
  AlertTriangle,
  ShieldCheck,
  Menu
} from 'lucide-react';

// ============================================================================
// 1. أدوات التواريخ والثوابت المشتركة بتوقيت السعودية (Asia/Riyadh)
// ============================================================================
const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const getIsoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// دالة استخراج تاريخ اليوم الحالي بتوقيت المملكة العربية السعودية (Asia/Riyadh) بصيغة YYYY-MM-DD
const getSaudiTodayIso = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
  } catch (e) {}
  // احتياطي بتوقيت UTC+3 (توقيت السعودية الثابت)
  const now = new Date();
  const saudiMs = now.getTime() + now.getTimezoneOffset() * 60000 + 3 * 3600000;
  return getIsoDate(new Date(saudiMs));
};

const addDaysIso = (isoStr, days) => {
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return getIsoDate(dt);
};

const getDatesBetween = (startIso, endIso) => {
  const dates = [];
  let curr = startIso;
  let guard = 0;
  while (curr <= endIso && guard < 180) {
    dates.push(curr);
    curr = addDaysIso(curr, 1);
    guard++;
  }
  return dates.length > 0 ? dates : [startIso];
};

const countDaysInclusive = (startIso, endIso) => {
  if (!startIso || !endIso) return 1;
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const sUtc = Date.UTC(sy, sm - 1, sd);
  const eUtc = Date.UTC(ey, em - 1, ed);
  return Math.max(1, Math.floor((eUtc - sUtc) / 86400000) + 1);
};

const calcDaysRemaining = (targetIso, fromIso) => {
  if (!targetIso || !fromIso) return 0;
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const fUtc = Date.UTC(fy, fm - 1, fd);
  const tUtc = Date.UTC(ty, tm - 1, td);
  return Math.ceil((tUtc - fUtc) / 86400000);
};

const formatArabicDate = (isoDateStr) => {
  if (!isoDateStr) return '';
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${ARABIC_DAYS[dt.getDay()]}، ${d} ${ARABIC_MONTHS[dt.getMonth()]} ${y}`;
};

const formatShortArabicDate = (isoDateStr) => {
  if (!isoDateStr) return '';
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${ARABIC_DAYS[dt.getDay()]} ${d} ${ARABIC_MONTHS[dt.getMonth()]}`;
};

const clampIsoDate = (dateIso, minIso, maxIso) => {
  if (!dateIso) return minIso;
  if (minIso && dateIso < minIso) return minIso;
  if (maxIso && dateIso > maxIso) return maxIso;
  return dateIso;
};

// ============================================================================
// 2. منطق وبيانات القسم الأول: حفظ القرآن الكريم كاملاً (المعتمد)
// ============================================================================
const getJuz = (p) => (p <= 21 ? 1 : Math.min(30, Math.floor((p - 2) / 20) + 1));

const formatRange = (a, b) =>
  a === b
    ? `ص ${a} · جزء ${getJuz(a)}`
    : `ص ${a}–${b} · ${getJuz(a) === getJuz(b) ? 'جزء ' + getJuz(a) : 'جزء ' + getJuz(a) + '–' + getJuz(b)}`;

function buildQuranPlan(qState) {
  const HD = [];
  for (let a = qState.sp; a <= 76; a += qState.p1) HD.push([a, Math.min(a + qState.p1 - 1, 76)]);
  for (let a = Math.max(77, qState.sp); a <= 604; a += qState.p2) HD.push([a, Math.min(a + qState.p2 - 1, 604)]);
  const N = HD.length;
  const W = Math.max(1, Math.ceil(N / 5));
  const FW = W <= 30 ? 2 : 3;
  return {
    HD,
    N,
    W,
    FW,
    TW: W + FW,
    pre: qState.sp - 1,
    sig: `${qState.p1}-${qState.p2}-${qState.sp}`
  };
}

function getQuranTasksForDay(P, wi, di) {
  const o = [];
  const w = wi + 1;
  const add = (t, l, r) => o.push({ t, l, r });
  const bl = (wk) => [P.HD[5 * (wk - 1)][0], P.HD[Math.min(5 * wk, P.N) - 1][1]];

  if (wi >= P.W) {
    const k = (wi - P.W) * 7 + di;
    const per = Math.ceil(604 / (P.FW * 7));
    add('full', `ختمة مراجعة – يوم ${k + 1} من ${P.FW * 7}`, [k * per + 1, Math.min(k * per + per, 604)]);
    return o;
  }
  if (di < 5) {
    const n = wi * 5 + di;
    if (n >= P.N) {
      add('near', 'مراجعة عامة لكتلة الأسبوع', bl(w));
      return o;
    }
    add('new', 'حفظ جديد', P.HD[n]);
    [[1, 'مراجعة أمس'], [3, 'مراجعة قبل ٣ أيام'], [7, 'مراجعة قبل ٧ أيام']].forEach(([d, l]) => {
      if (n >= d) add('near', l, P.HD[n - d]);
    });
    if (P.pre > 0 && w <= 16) {
      const c = Math.ceil(P.pre / 5);
      const a = di * c + 1;
      if (a <= P.pre) add('far', `مراجعة المحفوظ السابق (ص ١–${P.pre})`, [a, Math.min(a + c - 1, P.pre)]);
    }
  } else if (di === 5) {
    add('near', 'مراجعة كتلة هذا الأسبوع + تسميع', bl(w));
    [[2, 'قبل أسبوعين'], [8, 'قبل ٨ أسابيع'], [24, 'قبل ٢٤ أسبوعًا']].forEach(([l, t]) => {
      if (w > l) add('far', `تكرار ${t}`, bl(w - l));
    });
  } else {
    [[4, '٤ أسابيع'], [12, '١٢ أسبوعًا'], [16, '١٦ أسبوعًا'], [36, '٣٦ أسبوعًا']].forEach(([l, t]) => {
      if (w > l) add('far', `تكرار قبل ${t}`, bl(w - l));
    });
    if (w > 16) {
      const e = P.HD[Math.min(5 * (w - 16), P.N) - 1][1];
      const a = ((w - 1) * 20) % e + 1;
      add('far', 'مراجعة دوّارة للمحفوظ القديم', [a, Math.min(a + 19, e)]);
    }
    if (w <= 4) add('near', 'مراجعة عامة لكل ما حُفظ', [1, bl(w)[1]]);
  }
  return o;
}

const getInitialQuranPlan = () => ({
  start: '2026-11-15', // الأحد بداية الأسبوع الحالي
  end: '2027-05-14',
  p1: 1,
  p2: 2,
  sp: 30,
  done: {},
  weak: {},
  deferredDates: {},
  carryOverTasks: {},
  taskOverrides: {},
  emergencyBackup: null
});

// ============================================================================
// 3. منطق وبيانات القسم الثاني: دبلوم كاوست للمعلوماتية الحيوية (المعتمد)
// ============================================================================
const KAUST_TYPE_META = {
  video: { label: 'فيديو', color: 'bg-sky-500/15 text-sky-700', icon: PlayCircle },
  reading: { label: 'قراءة', color: 'bg-amber-500/15 text-amber-700', icon: BookOpen },
  lab: { label: 'مختبر عملي', color: 'bg-purple-500/15 text-purple-700', icon: Terminal },
  quiz: { label: 'اختبار', color: 'bg-rose-500/15 text-rose-700', icon: FileCheck },
  project: { label: 'مشروع', color: 'bg-emerald-500/15 text-emerald-700', icon: Award }
};

const INITIAL_KAUST_COURSES = [
  {
    id: 'c1',
    title: 'الدورة الأولى: أساسيات برمجة بايثون',
    provider: 'Rice University — أكاديمية كاوست',
    badge: 'Python Basics',
    modules: [
      {
        id: 'c1_m1',
        title: 'الوحدة 1: بايثون كآلة حاسبة',
        description: 'ستعرفك هذه الوحدة على لغة Python حتى تتمكن من تشغيل أول برامجك البسيطة وحساب نتائج التعبيرات الحسابية.',
        items: [
          { id: 'c1_m1_1', title: 'أهلاً وسهلاً بك!', type: 'video', duration: 5, done: true },
          { id: 'c1_m1_2', title: 'نظرة عامة على الدورة', type: 'video', duration: 3, done: true },
          { id: 'c1_m1_3', title: 'مرحباً أيها العالم!', type: 'video', duration: 3, done: true },
          { id: 'c1_m1_4', title: 'بيئات تطوير بايثون', type: 'video', duration: 9, done: false },
          { id: 'c1_m1_5', title: 'استخدام CodeSkulptor3', type: 'reading', duration: 10, done: false },
          { id: 'c1_m1_6', title: 'الأرقام', type: 'video', duration: 6, done: false },
          { id: 'c1_m1_7', title: 'التعبيرات البسيطة', type: 'video', duration: 7, done: false },
          { id: 'c1_m1_8', title: 'التعبيرات المركبة', type: 'video', duration: 7, done: false },
          { id: 'c1_m1_9', title: 'المتغيرات والتعيين', type: 'video', duration: 8, done: false },
          { id: 'c1_m1_10', title: 'معالجة الأخطاء في بايثون', type: 'video', duration: 10, done: false },
          { id: 'c1_m1_11', title: 'دليل مختصر للأخطاء الشائعة في بايثون', type: 'reading', duration: 10, done: false },
          { id: 'c1_m1_12', title: 'التمرين التدريبي على التعبيرات', type: 'reading', duration: 10, done: false },
          { id: 'c1_m1_13', title: 'تمارين تدريبية للمتغيرات والواجبات', type: 'reading', duration: 10, done: false },
          { id: 'c1_m1_14', title: 'اختبار: بناء جملة بايثون الأساسية', type: 'quiz', duration: 14, done: false }
        ]
      },
      {
        id: 'c1_m2',
        title: 'الوحدة 2: الوظائف (Functions)',
        description: 'ستعلمك هذه الوحدة كيفية تعريف الدوال واستدعائها لكتابة شيفرة مرة واحدة وتنفيذها مراراً وتكراراً.',
        items: [
          { id: 'c1_m2_1', title: 'ما هي الوظيفة؟', type: 'video', duration: 6, done: false },
          { id: 'c1_m2_2', title: 'وظائف الاتصال', type: 'video', duration: 6, done: false },
          { id: 'c1_m2_3', title: 'تعريف الوظائف', type: 'video', duration: 11, done: false },
          { id: 'c1_m2_4', title: 'المتغيرات المحلية', type: 'video', duration: 4, done: false },
          { id: 'c1_m2_5', title: 'الوظائف - مادة للقراءة', type: 'reading', duration: 10, done: false },
          { id: 'c1_m2_6', title: 'فهم تقييم الوظائف', type: 'video', duration: 8, done: false },
          { id: 'c1_m2_7', title: 'استخدام الطباعة والإرجاع في الوظائف', type: 'video', duration: 6, done: false },
          { id: 'c1_m2_8', title: 'تمارين تدريبية للوظائف', type: 'reading', duration: 10, done: false },
          { id: 'c1_m2_9', title: 'اختبار: الوظائف', type: 'quiz', duration: 14, done: false }
        ]
      },
      {
        id: 'c1_m3',
        title: 'الوحدة 3: المنطق والشروط',
        description: 'استخدام المنطق والشروط لتغيير سلوك البرنامج بناءً على القيم الموجودة داخل البرنامج.',
        items: [
          { id: 'c1_m3_1', title: 'المنطق المنطقي', type: 'video', duration: 5, done: false },
          { id: 'c1_m3_2', title: 'التعبيرات المنطقية', type: 'video', duration: 4, done: false },
          { id: 'c1_m3_3', title: 'المقارنات', type: 'video', duration: 6, done: false },
          { id: 'c1_m3_4', title: 'الشروط', type: 'video', duration: 8, done: false },
          { id: 'c1_m3_5', title: 'المزيد من الشروط', type: 'video', duration: 9, done: false },
          { id: 'c1_m3_6', title: 'الشروط في بايثون', type: 'reading', duration: 10, done: false },
          { id: 'c1_m3_7', title: 'استخدام وثائق بايثون', type: 'video', duration: 9, done: false },
          { id: 'c1_m3_8', title: 'اتباع معايير الترميز', type: 'video', duration: 9, done: false },
          { id: 'c1_m3_9', title: 'معايير البرمجة والأسلوب', type: 'reading', duration: 10, done: false },
          { id: 'c1_m3_10', title: 'تمارين تدريبية على المنطق والشروط', type: 'reading', duration: 10, done: false },
          { id: 'c1_m3_11', title: 'اختبار: المنطق والشروط', type: 'quiz', duration: 14, done: false }
        ]
      },
      {
        id: 'c1_m4',
        title: 'الوحدة 4: وحدات بايثون',
        description: 'مفهوم الوحدات النمطية لتقسيم الشيفرة البرمجية إلى ملفات مختلفة وإعادة استخدامها وبناء مشروع التواريخ.',
        items: [
          { id: 'c1_m4_1', title: 'وحدات بايثون (فيديو)', type: 'video', duration: 6, done: false },
          { id: 'c1_m4_2', title: 'وحدات بايثون (مادة للقراءة)', type: 'reading', duration: 10, done: false },
          { id: 'c1_m4_3', title: 'وحدة التواريخ والوقت', type: 'video', duration: 6, done: false },
          { id: 'c1_m4_4', title: 'مرجع سريع لوحدة التواريخ والوقت', type: 'reading', duration: 10, done: false },
          { id: 'c1_m4_5', title: 'ترميز مشروع الممارسة - الجزء 1', type: 'video', duration: 9, done: false },
          { id: 'c1_m4_6', title: 'ترميز مشروع الممارسة - الجزء 2', type: 'video', duration: 9, done: false },
          { id: 'c1_m4_7', title: 'مشروع تدريبي: حجر-ورقة-مقص-سحلية-سبوك', type: 'reading', duration: 10, done: false },
          { id: 'c1_m4_8', title: 'فيديو RPSLS ونصائحه', type: 'video', duration: 21, done: false },
          { id: 'c1_m4_9', title: 'فيديو المشروع ووصفه و OwlTest', type: 'reading', duration: 33, done: false },
          { id: 'c1_m4_10', title: 'المشروع النهائي: العمل مع التواريخ', type: 'project', duration: 60, done: false }
        ]
      }
    ]
  },
  {
    id: 'c2',
    title: 'الدورة الثانية: المهارات الأساسية في المعلوماتية الحيوية',
    provider: 'KAUST — جامعة الملك عبدالله للعلوم والتقنية',
    badge: 'Bioinformatics Core',
    modules: [
      {
        id: 'c2_m1',
        title: 'الوحدة 1: مقدمة للبرمجة (باستخدام R)',
        description: 'العمل في R و RStudio وفهم أنواع البيانات والحلقات والشروط واستخدام rMarkdown.',
        items: [
          { id: 'c2_m1_1', title: 'مقدمة موجزة للدورة والبرمجة والبحث', type: 'video', duration: 7, done: false },
          { id: 'c2_m1_2', title: 'إعداد R و RStudio وأول اتصال', type: 'reading', duration: 38, done: false },
          { id: 'c2_m1_3', title: 'مقدمة لمسابقة R (تقييم)', type: 'quiz', duration: 20, done: false },
          { id: 'c2_m1_4', title: 'أنواع وهياكل البيانات في R (محاضرات)', type: 'video', duration: 10, done: false },
          { id: 'c2_m1_5', title: 'اختبار أنواع البيانات في R Quiz', type: 'quiz', duration: 15, done: false },
          { id: 'c2_m1_6', title: 'ترميز: المتجهات، القوائم، المصفوفات، إطارات البيانات', type: 'video', duration: 38, done: false },
          { id: 'c2_m1_7', title: 'التحكم في التدفق والحلقات وعبارات IF', type: 'video', duration: 26, done: false },
          { id: 'c2_m1_8', title: 'التحكم في التدفق في مسابقة R (تقييم)', type: 'quiz', duration: 30, done: false },
          { id: 'c2_m1_9', title: 'التحميل والكتابة في R (محاضرة + ترميز)', type: 'video', duration: 23, done: false },
          { id: 'c2_m1_10', title: 'التحميل والكتابة في مسابقة R + مجموعات البيانات', type: 'quiz', duration: 44, done: false }
        ]
      },
      {
        id: 'c2_m2',
        title: 'الوحدة 2: مقدمة للبرمجة II (باستخدام R)',
        description: 'المتجهات المنطقية، مراقبة جودة البيانات، التحليل الاستكشافي EDA، الارتباط، النماذج الخطية، واختبار t و ANOVA.',
        items: [
          { id: 'c2_m2_1', title: 'القيم والمتجهات المنطقية في R (محاضرات + قراءة)', type: 'video', duration: 42, done: false },
          { id: 'c2_m2_2', title: 'مهمة البرمجة: التشغيل باستخدام القيم والمصفوفات المنطقية', type: 'project', duration: 90, done: false },
          { id: 'c2_m2_3', title: 'مراقبة جودة البيانات (محاضرة + مهمة برمجة)', type: 'project', duration: 53, done: false },
          { id: 'c2_m2_4', title: 'تحليل البيانات الاستكشافية EDA والتصور في R', type: 'quiz', duration: 52, done: false },
          { id: 'c2_m2_5', title: 'تحليل الارتباط (محاضرة + مهمة برمجة)', type: 'project', duration: 47, done: false },
          { id: 'c2_m2_6', title: 'النماذج الخطية (محاضرات + مهمة برمجة)', type: 'project', duration: 48, done: false },
          { id: 'c2_m2_7', title: 'اختبار تي وأنوفا t-test & ANOVA (محاضرات + مهمة)', type: 'project', duration: 62, done: false },
          { id: 'c2_m2_8', title: 'التدريب العملي على تحليل البيانات وحزم CRAN/Bioconductor', type: 'project', duration: 62, done: false }
        ]
      },
      {
        id: 'c2_m3',
        title: 'الوحدة 3: البرمجة بلغة بايثون (NumPy & Pandas)',
        description: 'مقارنة Python و R وتعلم صيغة بايثون والعمل مع مكتبتي التحليل الرئيسيتين: NumPy و Pandas.',
        items: [
          { id: 'c2_m3_1', title: 'لمحة عامة وإعداد بيئة بايثون ومختبر جوبيتر', type: 'video', duration: 50, done: false },
          { id: 'c2_m3_2', title: 'قيم بايثون البدائية وهياكل البيانات (محاضرات)', type: 'video', duration: 26, done: false },
          { id: 'c2_m3_3', title: 'تقييم ومهمة برمجة: هياكل بيانات بايثون', type: 'quiz', duration: 40, done: false },
          { id: 'c2_m3_4', title: 'صيغة بايثون: الحلقات والشروط والوظائف', type: 'video', duration: 22, done: false },
          { id: 'c2_m3_5', title: 'تقييم ومهمة برمجة: تدفق التحكم في بايثون', type: 'quiz', duration: 40, done: false },
          { id: 'c2_m3_6', title: 'مكتبة NumPy (محاضرات + اختبار + مهمة برمجة)', type: 'project', duration: 52, done: false },
          { id: 'c2_m3_7', title: 'مكتبة الباندا Pandas لاستكشاف البيانات (محاضرات)', type: 'video', duration: 23, done: false },
          { id: 'c2_m3_8', title: 'تقييم ومهمة برمجة: باقة الباندا', type: 'quiz', duration: 40, done: false },
          { id: 'c2_m3_9', title: 'التصور مع حزمة الباندا (فيديو + معمل عملي)', type: 'lab', duration: 54, done: false }
        ]
      },
      {
        id: 'c2_m4',
        title: 'الوحدة 4: دراسة حالة المعلوماتية الحيوية (RNA-seq)',
        description: 'تحليل بيانات تسلسل الحمض النووي الريبي بالجملة في R وأحادي الخلية scRNA-seq في Python ودمج النتائج.',
        items: [
          { id: 'c2_m4_1', title: 'نظرة عامة ومقدمة لدراسة الحالة', type: 'video', duration: 3, done: false },
          { id: 'c2_m4_2', title: 'تسلسل RNA-seq بالجملة في R: التطبيع و PCA والتعبير التفاضلي', type: 'video', duration: 68, done: false },
          { id: 'c2_m4_3', title: 'مهمة البرمجة: تحليل بيانات الخلايا التائية RNAseq CD4+', type: 'project', duration: 30, done: false },
          { id: 'c2_m4_4', title: 'تسلسل scRNA-seq أحادي الخلية: التمثيل وإدارة anndata', type: 'project', duration: 56, done: false },
          { id: 'c2_m4_5', title: 'المعالجة المسبقة لـ scRNA-seq مع الحزمة scanpy', type: 'project', duration: 54, done: false },
          { id: 'c2_m4_6', title: 'UMAP والتجميع وتحديد نوع الخلية في Python و R', type: 'project', duration: 70, done: false },
          { id: 'c2_m4_7', title: 'الذكاء الاصطناعي الحيوي والفيديو النهائي', type: 'video', duration: 12, done: false }
        ]
      }
    ]
  },
  {
    id: 'c3',
    title: 'الدورة الثالثة: مقدمة عملية لأوامر لينكس والبرمجة النصية',
    provider: 'IBM — أكاديمية كاوست',
    badge: 'Linux & Shell Scripting',
    modules: [
      {
        id: 'c3_m1',
        title: 'الوحدة 1: مقدمة في لينكس',
        description: 'أساسيات نظام التشغيل لينكس والتوزيعات والمحطة الطرفية وتحرير النصوص باستخدام nano و Vim.',
        items: [
          { id: 'c3_m1_1', title: 'مقدمة الدورة والتعريف بلينكس وتوزيعاته وبنيته', type: 'video', duration: 22, done: false },
          { id: 'c3_m1_2', title: 'نظرة عامة وتصفح المحطة الطرفية ونصائحها', type: 'reading', duration: 31, done: false },
          { id: 'c3_m1_3', title: 'مختبر عملي: البدء باستخدام محطة لينكس الطرفية', type: 'lab', duration: 15, done: false },
          { id: 'c3_m1_4', title: 'إنشاء ملفات نصية وتحريرها + مختبر تحرير النصوص', type: 'lab', duration: 51, done: false },
          { id: 'c3_m1_5', title: 'تثبيت البرامج والتحديثات + ورقة الغش والملخص', type: 'reading', duration: 18, done: false },
          { id: 'c3_m1_6', title: 'الاختبار التدريبي والاختبار المتدرج: مقدمة في Linux', type: 'quiz', duration: 40, done: false }
        ]
      },
      {
        id: 'c3_m2',
        title: 'الوحدة 2: مقدمة في أوامر لينكس',
        description: 'الأوامر المعلوماتية والملاحية وإدارة الملفات والأذونات ومعالجة النصوص والشبكات والأرشفة.',
        items: [
          { id: 'c3_m2_1', title: 'الأوامر الإعلامية والتنقل وإدارة الملفات (فيديوهات + قراءة)', type: 'video', duration: 36, done: false },
          { id: 'c3_m2_2', title: 'مختبرات: الأوامر الإعلامية والتنقل والتحكم في الوصول', type: 'lab', duration: 85, done: false },
          { id: 'c3_m2_3', title: 'معالجة الملفات النصية والشبكات والأرشفة (فيديوهات + قراءة)', type: 'video', duration: 30, done: false },
          { id: 'c3_m2_4', title: 'مختبرات: معالجة النصوص والشبكات والأرشفة', type: 'lab', duration: 85, done: false },
          { id: 'c3_m2_5', title: 'ملخص الوحدة وورقة الغش + اختبار متدرج: أوامر لينكس', type: 'quiz', duration: 48, done: false }
        ]
      },
      {
        id: 'c3_m3',
        title: 'الوحدة 3: مقدمة في البرمجة النصية للينكس (Shell Scripting)',
        description: 'أساسيات البرمجة النصية Bash والأنابيب والمرشحات والمتغيرات وجدولة المهام عبر Cron.',
        items: [
          { id: 'c3_m3_1', title: 'أساسيات البرمجة النصية ومتغيرات الصدفة + مختبر الشروع', type: 'lab', duration: 44, done: false },
          { id: 'c3_m3_2', title: 'الفلاتر والأنابيب واستخراج عناوين URL', type: 'reading', duration: 28, done: false },
          { id: 'c3_m3_3', title: 'ميزات Bash المتقدمة + مختبر البرمجة النصية المتقدمة', type: 'lab', duration: 55, done: false },
          { id: 'c3_m3_4', title: 'جدولة المهام باستخدام Cron ومختبر Crontab', type: 'lab', duration: 24, done: false },
          { id: 'c3_m3_5', title: 'ورقة الغش + اختبار متدرج: البرمجة النصية للقذيفة', type: 'quiz', duration: 45, done: false }
        ]
      },
      {
        id: 'c3_m4',
        title: 'الوحدة 4: المشروع النهائي والامتحان النهائي',
        description: 'بناء عملية ETL تلقائية لتوقعات الطقس وبرنامج نسخ احتياطي مجدول واجتياز الامتحان النهائي.',
        items: [
          { id: 'c3_m4_1', title: 'نظرة عامة ومختبر عملي: مشروع الممارسة ETL للطقس', type: 'lab', duration: 60, done: false },
          { id: 'c3_m4_2', title: 'مختبر التدريب العملي: المشروع النهائي', type: 'lab', duration: 90, done: false },
          { id: 'c3_m4_3', title: 'تسليم المشروع النهائي (تقييم الذكاء الاصطناعي / النظراء)', type: 'project', duration: 60, done: false },
          { id: 'c3_m4_4', title: 'الامتحان النهائي وملخص الدورة التدريبية', type: 'quiz', duration: 65, done: false }
        ]
      }
    ]
  }
];

function distributeKaustBalanced(courses, startDate, targetCloseDate, onlyUncompleted = false) {
  const days = getDatesBetween(startDate, targetCloseDate);
  const itemsToSchedule = [];

  courses.forEach((c) => {
    c.modules.forEach((m) => {
      m.items.forEach((it) => {
        if (!onlyUncompleted || !it.done) {
          itemsToSchedule.push(it);
        }
      });
    });
  });

  const totalMins = itemsToSchedule.reduce((acc, it) => acc + (it.duration || 10), 0);
  const targetDailyMins = Math.max(30, totalMins / days.length);

  const dateMap = {};
  let dayIdx = 0;
  let currDayMins = 0;

  itemsToSchedule.forEach((it) => {
    const dur = it.duration || 10;
    if (dayIdx < days.length - 1 && currDayMins > 0 && currDayMins + dur * 0.6 > targetDailyMins) {
      dayIdx++;
      currDayMins = 0;
    }
    dateMap[it.id] = days[dayIdx];
    currDayMins += dur;
  });

  return courses.map((c) => ({
    ...c,
    modules: c.modules.map((m) => ({
      ...m,
      items: m.items.map((it) => ({
        ...it,
        scheduledDate: dateMap[it.id] || it.scheduledDate || startDate
      }))
    }))
  }));
}

const getInitialKaustPlan = () => ({
  startDate: '2026-11-18',
  targetCloseDate: '2026-12-01',
  officialDeadline: '2026-12-05',
  courses: distributeKaustBalanced(INITIAL_KAUST_COURSES, '2026-11-18', '2026-12-01', false)
});

// ============================================================================
// 4. منطق وبيانات القسم الثالث: اختبار الهيئة السعودية SMLE (المعتمد)
// ============================================================================
const INITIAL_MEDICINE_VIDEOS = [
  // --- كورس أم القرى مدسن 2021 ---
  { id: 'med-2021-1', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Pulmonology', title: '1.0 Plumonology-1 - UQ-medicine course', duration: '2:56:26', seconds: 10586, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-2', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Pulmonology', title: '1.1 Plumonology-2 - UQ-medicine course', duration: '14:35', seconds: 875, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-3', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Neurology', title: '2. NEUROLOGY - UQ-medicine course', duration: '2:16:09', seconds: 8169, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-4', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Rheumatology', title: '3. Rheumatolgy - UQ-medicine course', duration: '2:56:27', seconds: 10587, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-5', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Cardiology', title: '4. Cardiology - UQ-medicine course', duration: '4:06:33', seconds: 14793, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-6', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Gastroenterology', title: '5. Gastroenterology - UQ-medicine course', duration: '4:12:31', seconds: 15151, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-7', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Endocrine & ID', title: '6. ENDOCRINE - UQ-medicine course', duration: '3:31:53', seconds: 12713, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-8', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Hematology', title: '7. Hematology - UQ-medicine course', duration: '3:59:54', seconds: 14394, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'med-2021-9', year: '2021', courseTitle: 'كورس أم القرى مدسن 2021', specialty: 'Nephrology', title: '8. NEPHROLOGY - UQ-medicine course', duration: '1:54:43', seconds: 6883, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  // --- كورس أم القرى ميدسن ٢٠٢٢ ---
  { id: 'med-2022-1', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Pulmonology', title: 'SMLE Review Course 2022 - Pleural effusion - Dr. Elaf Faisal', duration: '20:58', seconds: 1258, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-2', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Pulmonology', title: 'SMLE Review Course 2022 - Bronchiectasis - Dr. Elaf Faisal', duration: '09:15', seconds: 555, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-3', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Pulmonology', title: 'SMLE Review Course 2022 - Pulmonary Tuberculosis - Dr. Elaf Faisal', duration: '32:59', seconds: 1979, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-4', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Pulmonology', title: 'SMLE Review Course 2022 - Lung cancer - Dr. Elaf Faisal', duration: '11:22', seconds: 682, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-5', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Pulmonology', title: 'Pulmonary SMLE Course Review 2022', duration: '2:39:33', seconds: 9573, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-6', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Cardiology', title: 'Cardiology SMLE Course Review 2022', duration: '3:19:14', seconds: 11954, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-7', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Nephrology', title: 'SMLE course 2021 "Nephrology"', duration: '1:30:09', seconds: 5409, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-8', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Rheumatology', title: 'SMLE Review Course 2022 - Systemic lupus erythematosus - Dr. Elaf Faisal', duration: '50:26', seconds: 3026, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-9', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Rheumatology', title: 'SMLE Review Course 2022 - Polyarthralgia and Miscellaneous of Rheumatology - Dr. Elaf Faisal', duration: '43:16', seconds: 2596, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-10', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Rheumatology', title: 'SMLE Review Course 2022 - Monoarthritis - Dr. Elaf Faisal', duration: '16:54', seconds: 1014, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-11', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Endocrine & ID', title: 'Endocrine & ID SMLE Course Review 2022', duration: '3:35:18', seconds: 12918, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-12', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Dementia - Dr. Elaf Faisal', duration: '06:29', seconds: 389, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-13', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - GBS - Dr. Elaf Faisal', duration: '03:37', seconds: 217, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-14', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Headache - Dr. Elaf Faisal', duration: '21:15', seconds: 1275, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-15', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Parkinson disease - Dr. Elaf Faisal', duration: '04:22', seconds: 262, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-16', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Miscellaneous in Neurology - Dr. Elaf Faisal', duration: '06:14', seconds: 374, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-17', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Myasthenia gravis - Dr. Elaf Faisal', duration: '03:42', seconds: 222, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-18', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'SMLE Review Course 2022 - Meningitis - Dr. Elaf Faisal', duration: '20:49', seconds: 1249, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-19', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Neurology', title: 'Neurology SMLE Course Review 2022', duration: '30:30', seconds: 1830, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  { id: 'med-2022-20', year: '2022', courseTitle: 'كورس أم القرى مدسن 2022', specialty: 'Gastroenterology', title: 'Gastroenterology - SMLE Review Course 2022', duration: '1:47:16', seconds: 6436, url: 'https://youtube.com/playlist?list=PLdvsJxH2aLaSraVEQA7ez216nR-YhAcFQ', broken: false, done: false },
  // --- كورس أم القرى ميدسن ٢٠٢٣ ---
  { id: 'med-2023-1', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Nephrology', title: 'SMLE review course 2023 - Nephrology - Dr. Elaf Faisal', duration: '2:41:53', seconds: 9713, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-2', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Rheumatology', title: 'SMLE review course 2023 - Rheumatology and vasculitis - Dr. Elaf Faisal', duration: '57:42', seconds: 3462, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-3', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Cardiology', title: 'SMLE review course 2023 - Cardiology - Dr. Abdulrahman Al-Ahmadi', duration: '1:45:39', seconds: 6339, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-4', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Pulmonology', title: 'SMLE review course 2023 - Pulmonology - Dr. Elaf Faisal', duration: '58:09', seconds: 3489, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-5', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Endocrine & ID', title: 'SMLE review course 2023 - Endocrine and ID - Dr. Abdulrahman Al-Ahmadi', duration: '1:35:55', seconds: 5755, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-6', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Neurology', title: 'SMLE review course 2023 - Neurology - Dr. Elaf Faisal', duration: '30:51', seconds: 1851, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  { id: 'med-2023-7', year: '2023', courseTitle: 'كورس أم القرى مدسن 2023', specialty: 'Gastroenterology', title: 'SMLE review course 2023 - Gastroenterology - Dr. Abdulrahman Al-Ahmadi', duration: '1:26:55', seconds: 5215, url: 'https://youtube.com/playlist?list=PLQ6ITif0VSEo&si=0mH3kYBJZihZP3z9', broken: false, done: false },
  // --- كورس أم القرى ميدسن ٢٠٢٤ ---
  { id: 'med-2024-1', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Rheumatology', title: 'SMLE Review Course 2024 - Rheumatology', duration: '21:19', seconds: 1279, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-2', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Neurology', title: 'SMLE Review Course 2024 - Neurology', duration: '11:07', seconds: 667, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-3', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Pulmonology', title: 'SMLE Review Course 2024 - Pulmonology', duration: '15:07', seconds: 907, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-4', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Nephrology', title: 'SMLE review course 2024 - Nephrology', duration: '21:14', seconds: 1274, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-5', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Hematology', title: 'SMLE review course 2024 - Hematology', duration: '1:26:24', seconds: 5184, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-6', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Hematology', title: 'SMLE review course 2024 - Venous thromboembolism', duration: '58:37', seconds: 3517, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-7', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Hematology', title: 'SMLE review course 2024 - Anti-coagulant', duration: '11:48', seconds: 708, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-8', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Hematology', title: 'SMLE review course 2024 - Platelet disorders', duration: '14:29', seconds: 869, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-9', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Cardiology', title: 'SMLE review course 2024 - Cardiology - Dr. Abdulrahman Alahmadi', duration: '1:58:54', seconds: 7134, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-10', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Gastroenterology', title: 'SMLE Review Course 2024 - Gastroenterology - Dr. Abdulrahman Alahmadi', duration: '1:43:17', seconds: 6197, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  { id: 'med-2024-11', year: '2024', courseTitle: 'كورس أم القرى مدسن 2024', specialty: 'Endocrine & ID', title: 'SMLE review course 2024 - Endocrine & ID - Dr. Abdulrahman Alahmadi', duration: '1:51:49', seconds: 6709, url: 'https://youtube.com/playlist?list=PLGk9BrM-ZdG8&si=KJlrj7muDkwj3F0E', broken: false, done: false },
  // --- كورس أم القرى ميدسن ٢٠٢٥ ---
  { id: 'med-2025-1', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Rheumatology', title: 'Rheumatology SMLE review update 2025 - Dr. Elaf Faisal', duration: '09:26', seconds: 566, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-2', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Hematology', title: 'Hematology SMLE review 2025 updates - Dr. Elaf Faisal', duration: '22:45', seconds: 1365, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-3', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Neurology', title: 'Neurology SMLE review 2025 updates - Dr. Elaf Faisal', duration: '16:25', seconds: 985, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-4', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Nephrology', title: 'Nephrology SMLE review updates 2025 - Dr. Elaf Faisal', duration: '29:43', seconds: 1783, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-5', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Pulmonology', title: 'Pulmonology SMLE review 2025 updates - Dr. Elaf Faisal', duration: '16:59', seconds: 1019, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-6', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Cardiology', title: 'Cardiology SMLE Review 2025 Updates - Dr. Abdulrahman Alahmadi', duration: '1:01:22', seconds: 3682, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-7', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Endocrine & ID', title: 'ID SMLE review 2025 updates - Dr. Abdulrahman Alahmadi', duration: '38:17', seconds: 2297, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-8', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Gastroenterology', title: 'Gastro SMLE review 2025 updates - Dr. Abdulrahman Alahmadi', duration: '58:39', seconds: 3519, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  { id: 'med-2025-9', year: '2025', courseTitle: 'كورس أم القرى مدسن 2025', specialty: 'Endocrine & ID', title: 'Endocrine SMLE review 2025 updates - Dr. Abdulrahman Alahmadi', duration: '37:17', seconds: 2237, url: 'https://youtube.com/playlist?list=PLEwmuhXm-dec&si=rOBOaN0GzBnXktEk', broken: false, done: false },
  // --- مواضيع الريسبا المقسمة ---
  { id: 'resp-top-1', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'Bronchial asthma, COPD, Pneumonia, Miscellaneous (2020-2026 Qs)', duration: '1:15:00', seconds: 4500, url: 'https://youtu.be/XZUO3Vimn8k', broken: false, done: false },
  { id: 'resp-top-2', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'Lung cancer (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/_9mq1JiOlDw', broken: false, done: false },
  { id: 'resp-top-3', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'Pleural effusion (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/16zolXesbQ4', broken: false, done: false },
  { id: 'resp-top-4', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'Tuberculosis (2020-2026 Qs)', duration: '50:00', seconds: 3000, url: 'https://youtu.be/qV7vxw5jZvc', broken: false, done: false },
  { id: 'resp-top-5', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'Broncheictasis (2020-2026 Qs)', duration: '40:00', seconds: 2400, url: 'https://youtu.be/LPPkD4ZiksI', broken: false, done: false },
  { id: 'resp-top-6', year: '2023', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'New Qs in 2023 - Pulmonology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/jLzYJfQlryE?feature=share', broken: false, done: false },
  { id: 'resp-top-7', year: '2024', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'New Qs in 2024 - Pulmonology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/hPbTxTgFdis?si=g6wd3UvaBCLPOfnq', broken: false, done: false },
  { id: 'resp-top-8', year: '2025', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'New Qs in 2025 - Pulmonology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/lmT-QtBJ2zg?si=qnFmsZDvfoKVUBVp', broken: false, done: false },
  { id: 'resp-top-9', year: '2026', courseTitle: 'مواضيع الريسبا (سلايدات: t.me/Elaf_Faisal/995)', specialty: 'Pulmonology', title: 'New Qs in 2026 - Pulmonology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/_li33FlNTBE?si=eIvPYWb0jWuKJdBn', broken: false, done: false },

  // --- مواضيع النيفرو (Nephrology) المقسمة ---
  { id: 'neph-top-1', year: '2023', courseTitle: 'مواضيع النيفرو (سلايدات: t.me/Elaf_Faisal/994)', specialty: 'Nephrology', title: 'Nephrology SMLE review 2023 (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/RkX3L0ohxQw?feature=share', broken: false, done: false },
  { id: 'neph-top-2', year: '2024', courseTitle: 'مواضيع النيفرو (سلايدات: t.me/Elaf_Faisal/994)', specialty: 'Nephrology', title: 'New Qs in 2024 - Nephrology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/QW7sd4SRsik?si=jFZ_9ygx6NyaFYr5', broken: false, done: false },
  { id: 'neph-top-3', year: '2025', courseTitle: 'مواضيع النيفرو (سلايدات: t.me/Elaf_Faisal/994)', specialty: 'Nephrology', title: 'New Qs in 2025 - Nephrology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/8uZ-OZSP7t4?si=xMmXlU5FWdcuz375', broken: false, done: false },
  { id: 'neph-top-4', year: '2026', courseTitle: 'مواضيع النيفرو (سلايدات: t.me/Elaf_Faisal/994)', specialty: 'Nephrology', title: 'New Qs in 2026 - Nephrology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/hKtLncTY2qk?si=70qYdKltSUZqHyUo', broken: false, done: false },

  // --- مواضيع النيورو (Neurology) المقسمة ---
  { id: 'neuro-top-1', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Stroke, Multiple sclerosis, Epilepsy, Cranial nerves injury (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/59IaAidLqPk', broken: false, done: false },
  { id: 'neuro-top-2', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Headache (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/tPgGLtlLcHg', broken: false, done: false },
  { id: 'neuro-top-3', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Gullian Barre syndrome (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/pct6hEj41tM', broken: false, done: false },
  { id: 'neuro-top-4', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Myasthenia Gravis (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/BdKWYGDs7NM', broken: false, done: false },
  { id: 'neuro-top-5', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Meningitis (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/s1vOpBkMlgU', broken: false, done: false },
  { id: 'neuro-top-6', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Parkinson disease (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/qqZGsEyZEPU', broken: false, done: false },
  { id: 'neuro-top-7', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Dementia (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/9pa-smxRSNA', broken: false, done: false },
  { id: 'neuro-top-8', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'Miscellaneous (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/6e8wmrvK_Ng', broken: false, done: false },
  { id: 'neuro-top-9', year: '2023', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'New Qs in 2023 - Neurology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/F8-xmCrybTo?feature=share', broken: false, done: false },
  { id: 'neuro-top-10', year: '2024', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'New Qs in 2024 - Neurology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/M_dmoQn6TPs?si=Ku2ClGS9fx3UcZXT', broken: false, done: false },
  { id: 'neuro-top-11', year: '2025', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'New Qs in 2025 - Neurology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/8SeYlN4oXv4?si=eYCaSlDa4tynE2ZH', broken: false, done: false },
  { id: 'neuro-top-12', year: '2026', courseTitle: 'مواضيع النيورو (سلايدات: t.me/Elaf_Faisal/990)', specialty: 'Neurology', title: 'New Qs in 2026 - Neurology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/5xto6U-qwnA?si=RU8jwZz-aAZzuTF3', broken: false, done: false },

  // --- مواضيع الروماتولوجي (Rheumatology) المقسمة ---
  { id: 'rheum-top-1', year: '2026', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'Systemic lupus erythematosus (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/01-CdiyRq9I', broken: false, done: false },
  { id: 'rheum-top-2', year: '2026', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'Monoarthritis (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/kcAG0YZzOsg', broken: false, done: false },
  { id: 'rheum-top-3', year: '2026', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'Polyarthritis and Miscellaneous (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://youtu.be/gFa22RXmuLU', broken: false, done: false },
  { id: 'rheum-top-4', year: '2023', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'Vasculitis and new Qs in 2023', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/5WzmHYu-mv0?feature=share', broken: false, done: false },
  { id: 'rheum-top-5', year: '2024', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'New Qs in 2024 - Rheumatology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/nCGY8W9GuoI?si=41eu9MHRvDrjvjkX', broken: false, done: false },
  { id: 'rheum-top-6', year: '2025', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'New Qs in 2025 - Rheumatology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/L19JaUXj3Hk?si=WY8WPFVsgzHNQ23H', broken: false, done: false },
  { id: 'rheum-top-7', year: '2026', courseTitle: 'مواضيع الروماتولوجي (سلايدات: t.me/Elaf_Faisal/989)', specialty: 'Rheumatology', title: 'New Qs in 2026 - Rheumatology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/C8nEI8Nk9WI?si=q4Bh9XNDBUHcGeer', broken: false, done: false },

  // --- مواضيع الهيما (Hematology) المقسمة ---
  { id: 'heme-top-1', year: '2026', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'Anemia (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/jnvgh6uMS4M?si=VhW0XoSzREwQfIv_', broken: false, done: false },
  { id: 'heme-top-2', year: '2026', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'Venous thromboembolism (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/P2VQyYQHSVU?si=QSvTq1e9dd-zM8dL', broken: false, done: false },
  { id: 'heme-top-3', year: '2026', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'Anti-coagulant (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/rGOiNmxn0L0?si=aneGVF07EG-K__Yj', broken: false, done: false },
  { id: 'heme-top-4', year: '2026', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'Platelet disorders (2020-2026 Qs)', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/zzHD4QVrFvM?si=x_2QsjSf8Qz6tztG', broken: false, done: false },
  { id: 'heme-top-5', year: '2025', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'New Qs in 2025 - Hematology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/3vDDu0_Jfg4?si=DIUWEI-GSo2dlQpx', broken: false, done: false },
  { id: 'heme-top-6', year: '2026', courseTitle: 'مواضيع الهيما (سلايدات: t.me/Elaf_Faisal/988)', specialty: 'Hematology', title: 'New Qs in 2026 - Hematology', duration: '45:00', seconds: 2700, url: 'https://www.youtube.com/live/wM8Y2A-l5q8?si=M2ziESbWnV9KXN3e', broken: false, done: false }
];

const INITIAL_SURGERY_VIDEOS = [
  { id: 'surg-2023-1', year: '2023', courseTitle: 'كورس الجراحة 2023', specialty: 'General Surgery', title: '1.0 Plumonology-1 (Surgery Review)', duration: '2:56:26', seconds: 10586, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2023-2', year: '2023', courseTitle: 'كورس الجراحة 2023', specialty: 'General Surgery', title: '1.1 Plumonology-2 (Surgery Review)', duration: '14:35', seconds: 875, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2023-3', year: '2023', courseTitle: 'كورس الجراحة 2023', specialty: 'Neurosurgery', title: '2. NEUROLOGY (Neurosurgery Review)', duration: '2:16:09', seconds: 8169, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2023-4', year: '2023', courseTitle: 'كورس الجراحة 2023', specialty: 'Rheumatology', title: '3. Rheumatolgy (Surgical Review)', duration: '2:56:27', seconds: 10587, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2024-1', year: '2024', courseTitle: 'كورس الجراحة 2024', specialty: 'Cardiothoracic', title: '4. Cardiology (Surgical Review)', duration: '4:06:33', seconds: 14793, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2024-2', year: '2024', courseTitle: 'كورس الجراحة 2024', specialty: 'GI Surgery', title: '5. Gastroenterology (Surgical Review)', duration: '4:12:31', seconds: 15151, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2024-3', year: '2024', courseTitle: 'كورس الجراحة 2024', specialty: 'Endocrine Surgery', title: '6. ENDOCRINE (Surgical Review)', duration: '3:31:53', seconds: 12713, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2024-4', year: '2024', courseTitle: 'كورس الجراحة 2024', specialty: 'Hematology', title: '7. Hematology (Surgical Review)', duration: '3:59:54', seconds: 14394, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false },
  { id: 'surg-2024-5', year: '2024', courseTitle: 'كورس الجراحة 2024', specialty: 'Nephrology', title: '8. NEPHROLOGY (Surgical Review)', duration: '1:54:43', seconds: 6883, url: 'https://www.youtube.com/playlist?list=PLv6jAYxtHCnSqfuU_ZTQ6vyKM3WKn6Wh7', broken: false, done: false }
];

const SPECIALTIES = [
  { id: 'medicine', title: 'الباطنة (Internal Medicine)', short: 'مدسن', icon: '🩺' },
  { id: 'surgery', title: 'الجراحة (Surgery)', short: 'سيرجري', icon: '🔪' },
  { id: 'pediatrics', title: 'الأطفال (Pediatrics)', short: 'بيديا', icon: '🧸' },
  { id: 'obgyn', title: 'النساء والولادة (OB/GYN)', short: 'أوبقاين', icon: '🤰' },
  { id: 'ethics', title: 'الأخلاقيات الطبية (Ethics)', short: 'إثكس', icon: '⚖️' }
];

// متوسط الوقت المستغرق في الصفحة الواحدة من التجميعات: 5 دقائق (300 ثانية)
const MINS_PER_RECALL_PAGE = 5;
const SECONDS_PER_RECALL_PAGE = MINS_PER_RECALL_PAGE * 60;

const formatHoursMins = (sec) => {
  if (!sec || sec <= 0) return '0 دقيقة';
  const totalMins = Math.round(sec / 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h} س و ${m} د` : `${m} د`;
};

const formatShortMins = (sec) => {
  if (!sec || sec <= 0) return '0 دقيقة';
  const totalMins = Math.round(sec / 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h} س و ${m} د`;
  if (h > 0) return `${h} ساعة`;
  return `${m} دقيقة`;
};

const parseDurationToSeconds = (str) => {
  if (!str) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 60;
};

const computeBalancedVideoSchedule = (videosMap, startIso, endIso) => {
  const safeStart = startIso || '2026-11-11';
  const safeEnd = endIso && endIso >= safeStart ? endIso : safeStart;
  const totalDays = countDaysInclusive(safeStart, safeEnd);

  const validVideos = [];
  Object.values(videosMap).forEach((list) => {
    list.forEach((v) => {
      if (!v.broken && v.seconds > 0) validVideos.push(v);
    });
  });

  if (validVideos.length === 0) return {};

  const totalSec = validVideos.reduce((acc, v) => acc + v.seconds, 0);
  const targetDailySec = totalSec / totalDays;

  const schedule = {};
  let accumulatedSec = 0;

  validVideos.forEach((vid, idx) => {
    const midpointSec = accumulatedSec + vid.seconds * 0.5;
    let dayIndex = targetDailySec > 0 ? Math.floor(midpointSec / targetDailySec) : idx;
    dayIndex = Math.max(0, Math.min(totalDays - 1, dayIndex));

    schedule[vid.id] = addDaysIso(safeStart, dayIndex);
    accumulatedSec += vid.seconds;
  });

  return schedule;
};

const generateRecallDailyPlan = (files, recallStartIso, recallEndIso, existingItems = []) => {
  const effectiveStart = recallStartIso || '2026-11-11';
  const effectiveEnd = recallEndIso && recallEndIso >= effectiveStart ? recallEndIso : effectiveStart;
  const totalPlanDays = countDaysInclusive(effectiveStart, effectiveEnd);
  const fileIdsSet = new Set(files.map((f) => f.id));

  const completedItems = existingItems
    .filter((item) => item.done && fileIdsSet.has(item.fileId))
    .map((item) => ({
      ...item,
      date: clampIsoDate(item.date, effectiveStart, effectiveEnd),
      estimatedSeconds: Number(item.pageCount || 0) * SECONDS_PER_RECALL_PAGE
    }));

  const donePagesByFile = {};
  completedItems.forEach((item) => {
    donePagesByFile[item.fileId] = (donePagesByFile[item.fileId] || 0) + Number(item.pageCount || 0);
  });

  let totalRemainingPages = 0;
  files.forEach((f) => {
    const doneForFile = donePagesByFile[f.id] || 0;
    const remForFile = Math.max(0, Number(f.pages || 0) - doneForFile);
    totalRemainingPages += remForFile;
  });

  if (totalRemainingPages <= 0) {
    return completedItems.sort((a, b) => a.date.localeCompare(b.date));
  }

  const totalRemainingMinutes = totalRemainingPages * MINS_PER_RECALL_PAGE;
  const targetMinutesPerDay = Math.max(MINS_PER_RECALL_PAGE, totalRemainingMinutes / totalPlanDays);
  const targetPagesPerDay = Math.max(1, Math.round(targetMinutesPerDay / MINS_PER_RECALL_PAGE));

  const newUncompletedItems = [];
  let cumulativePagesAssigned = 0;

  files.forEach((file, fileIndex) => {
    const totalFilePages = Number(file.pages || 0);
    const alreadyDonePages = donePagesByFile[file.id] || 0;
    let currentPage = alreadyDonePages + 1;

    while (currentPage <= totalFilePages) {
      const endPage = Math.min(totalFilePages, currentPage + targetPagesPerDay - 1);
      const count = endPage - currentPage + 1;

      const dayRatio = cumulativePagesAssigned / Math.max(1, totalRemainingPages);
      const boundedDayIdx = Math.min(totalPlanDays - 1, Math.floor(dayRatio * totalPlanDays));
      const dateIso = addDaysIso(effectiveStart, boundedDayIdx);

      newUncompletedItems.push({
        id: `rec-day-${file.id}-${currentPage}-${fileIndex}-${newUncompletedItems.length}`,
        fileId: file.id,
        fileTitle: file.title,
        date: dateIso,
        fromPage: currentPage,
        toPage: endPage,
        pageCount: count,
        estimatedSeconds: count * SECONDS_PER_RECALL_PAGE,
        done: false
      });

      cumulativePagesAssigned += count;
      currentPage = endPage + 1;
    }
  });

  return [...completedItems, ...newUncompletedItems].sort((a, b) => a.date.localeCompare(b.date));
};

const getInitialSmlePlan = () => {
  const initialFiles = [
    { id: 'rec-1', title: 'ملف تجميعات ٢٠٢٦ - الدفعة الأولى', pages: 120 },
    { id: 'rec-2', title: 'ملف تجميعات ٢٠٢٦ - الدفعة الثانية', pages: 110 },
    { id: 'rec-3', title: 'ملف تسريبات الحالات السريرية المهمة', pages: 90 }
  ];
  return {
    planStartDate: '2026-11-11',
    planEndDate: '2026-12-30',
    dailyHours: 4,
    studyStartDate: '2026-11-11',
    studyEndDate: '2026-12-15',
    recallStartDate: '2026-11-20',
    recallEndDate: '2026-12-30',
    videosBySpec: {
      medicine: INITIAL_MEDICINE_VIDEOS,
      surgery: INITIAL_SURGERY_VIDEOS,
      pediatrics: [],
      obgyn: [],
      ethics: []
    },
    customStudyDates: {},
    customRecallDates: {},
    recallFiles: initialFiles,
    recallDailyItems: generateRecallDailyPlan(initialFiles, '2026-11-20', '2026-12-30')
  };
};

// ============================================================================
// 5. منطق وبيانات القسم الرابع: الروتين اليومي والإحصائيات (المعتمد)
// ============================================================================
const getInitialRoutineConfig = (initialTodayIso) => {
  const yesterday = addDaysIso(initialTodayIso, -1);
  const twoDaysAgo = addDaysIso(initialTodayIso, -2);
  const threeDaysAgo = addDaysIso(initialTodayIso, -3);

  return {
    coreHabits: [
      { id: 'duha', label: 'صلاة الضحى' },
      { id: 'baqarah', label: 'قراءة سورة البقرة' },
      { id: 'adhkar', label: 'أذكار الصباح والمساء' },
      { id: 'prayers', label: 'الصلوات الخمس في وقتها' },
      { id: 'witr', label: 'صلاة الوتر' },
      { id: 'dhikr', label: 'ذكر الله والاستغفار' }
    ],
    logs: {
      [initialTodayIso]: {
        completedHabits: ['duha', 'adhkar', 'prayers'],
        extraTasks: [{ id: 'ex1', text: 'شرب ٢ لتر ماء', done: true }]
      },
      [yesterday]: {
        completedHabits: ['duha', 'baqarah', 'adhkar', 'prayers', 'witr', 'dhikr'],
        extraTasks: [{ id: 'ex2', text: 'ترتيب المكتب', done: true }]
      },
      [twoDaysAgo]: {
        completedHabits: ['adhkar', 'prayers', 'witr', 'dhikr'],
        extraTasks: []
      },
      [threeDaysAgo]: {
        completedHabits: ['duha', 'baqarah', 'adhkar', 'prayers', 'dhikr'],
        extraTasks: []
      }
    }
  };
};

// ============================================================================
// 6. الحالة الابتدائية الموحدة للتطبيق بأكمله
// ============================================================================
const getInitialAppState = (initialTodayIso) => ({
  theme: 'light',
  quranPlan: getInitialQuranPlan(),
  kaustPlan: getInitialKaustPlan(),
  smlePlan: getInitialSmlePlan(),
  routineConfig: getInitialRoutineConfig(initialTodayIso),
  duaReminders: [
    {
      id: 'd1',
      text: 'لا تنسي الدعاء بين الأذان والإقامة بالجنة والرحمة والتوفيق في اختبار الهيئة وحفظ كتاب الله والبركة في الوقت 🤲'
    },
    {
      id: 'd2',
      text: 'اللهم بارك لي في وقتي وافتح عليّ فتوح العارفين واجعل علمي نافعاً خالصاً لوجهك الكريم'
    }
  ]
});

// ============================================================================
// 7. المكون الرئيسي للتطبيق (App)
// ============================================================================
export default function App() {
  // التاريخ الحي التلقائي بتوقيت المملكة العربية السعودية (Asia/Riyadh)
  const [todayIso, setTodayIso] = useState(() => getSaudiTodayIso());
  const tomorrowIso = useMemo(() => addDaysIso(todayIso, 1), [todayIso]);

  const [state, setState] = useState(() => {
    const initialSaudiDate = getSaudiTodayIso();
    try {
      const saved = localStorage.getItem('second_brain_unified_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return getInitialAppState(initialSaudiDate);
  });

  // التنقل بين الصفحات: 'dashboard' | 'quran' | 'kaust' | 'smle' | 'routine' | 'routine_stats'
  const [activePage, setActivePage] = useState('dashboard');
  const [goalsMenuOpen, setGoalsMenuOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // مراقبة دخول يوم جديد بتوقيت السعودية تلقائياً (كل 10 ثوانٍ + عند العودة للتبويب أو التركيز)
  useEffect(() => {
    const syncSaudiDate = () => {
      const currentSaudiDate = getSaudiTodayIso();
      setTodayIso((prevIso) => {
        if (currentSaudiDate !== prevIso) {
          showToast(`🌅 دخل يوم جديد بتوقيت السعودية: ${formatArabicDate(currentSaudiDate)}`);
          return currentSaudiDate;
        }
        return prevIso;
      });
    };

    syncSaudiDate();
    const intervalId = setInterval(syncSaudiDate, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSaudiDate();
      }
    };

    window.addEventListener('focus', syncSaudiDate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', syncSaudiDate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('second_brain_unified_v5', JSON.stringify(state));
    } catch (e) {}
  }, [state]);

  // ضمان وجود سجل لليوم الحالي بتوقيت السعودية في الروتين تلقائياً عند بداية كل يوم جديد
  useEffect(() => {
    setState((prev) => {
      if (!prev.routineConfig.logs[todayIso]) {
        return {
          ...prev,
          routineConfig: {
            ...prev.routineConfig,
            logs: {
              ...prev.routineConfig.logs,
              [todayIso]: { completedHabits: [], extraTasks: [] }
            }
          }
        };
      }
      return prev;
    });
  }, [todayIso]);

  // ==========================================================================
  // الحسابات الموحدة للقرآن الكريم (مهام اليوم + نسبة الإنجاز + الأيام المتبقية)
  // ==========================================================================
  const quranMetrics = useMemo(() => {
    const qp = state.quranPlan;
    const P = buildQuranPlan(qp);
    const doneMap = qp.done[P.sig] || {};
    const overrides = qp.taskOverrides || {};
    const [sy, sm, sd] = qp.start.split('-').map(Number);
    const startObj = new Date(sy, sm - 1, sd);
    const [ny, nm, nd] = todayIso.split('-').map(Number);
    const nowObj = new Date(ny, nm - 1, nd);

    const rawIdx = Math.floor((nowObj - startObj) / 86400000);
    const ti = Math.max(0, Math.min(P.TW * 7 - 1, rawIdx));
    const wi = Math.floor(ti / 7);
    const di = ti % 7;

    let memorizedPages = P.pre;
    for (let n = 0; n < P.N; n++) {
      if (doneMap[`${Math.floor(n / 5)}-${n % 5}-0`]) {
        memorizedPages += P.HD[n][1] - P.HD[n][0] + 1;
      }
    }
    const pct = Math.min(100, Math.round((memorizedPages / 604) * 100));
    const daysLeft = calcDaysRemaining(qp.end, todayIso);

    // استخراج مهام اليوم المتزامنة مع صفحة القرآن
    const todayTasks = [];
    const isDeferredToday = !!qp.deferredDates?.[todayIso];

    if (!isDeferredToday) {
      const defaultTasks = getQuranTasksForDay(P, wi, di);
      defaultTasks.forEach((t, idx) => {
        const taskKey = `${wi}-${di}-${idx}`;
        const ov = overrides[taskKey] || {};
        const effectiveDate = ov.date || todayIso;
        if (effectiveDate === todayIso) {
          todayTasks.push({
            taskKey,
            wIdx: wi,
            dIdx: di,
            tIdx: idx,
            label: ov.title || `${t.l} (${formatRange(t.r[0], t.r[1])})`,
            done: !!doneMap[taskKey]
          });
        }
      });

      // أي مهمة منقولة إلى اليوم يدوياً
      Object.entries(overrides).forEach(([taskKey, ov]) => {
        if (!ov || ov.date !== todayIso) return;
        const [wStr, dStr, iStr] = taskKey.split('-').map(Number);
        if (wStr === wi && dStr === di) return;
        const sourceTasks = getQuranTasksForDay(P, wStr, dStr);
        const t = sourceTasks[iStr];
        if (!t) return;
        todayTasks.push({
          taskKey,
          wIdx: wStr,
          dIdx: dStr,
          tIdx: iStr,
          label: ov.title || `${t.l} (${formatRange(t.r[0], t.r[1])})`,
          done: !!doneMap[taskKey]
        });
      });
    }

    // المهام المرحلة من وضع الطوارئ إلى اليوم
    (qp.carryOverTasks?.[todayIso] || []).forEach((ct) => {
      const [wStr, dStr, iStr] = ct.taskKey.split('-').map(Number);
      todayTasks.push({
        taskKey: ct.taskKey,
        wIdx: wStr,
        dIdx: dStr,
        tIdx: iStr,
        label: ct.text,
        done: !!doneMap[ct.taskKey]
      });
    });

    return { P, doneMap, ti, wi, di, memorizedPages, pct, daysLeft, todayTasks, isDeferredToday };
  }, [state.quranPlan, todayIso]);

  // ==========================================================================
  // الحسابات الموحدة لدورة كاوست (مهام اليوم + نسبة الإنجاز + الأيام المتبقية)
  // ==========================================================================
  const kaustMetrics = useMemo(() => {
    const kp = state.kaustPlan;
    let totalMins = 0;
    let doneMins = 0;
    const todayItems = [];

    kp.courses.forEach((c) => {
      c.modules.forEach((m) => {
        m.items.forEach((it) => {
          totalMins += it.duration || 0;
          if (it.done) doneMins += it.duration || 0;
          if (it.scheduledDate === todayIso) {
            todayItems.push({
              ...it,
              courseId: c.id,
              moduleId: m.id,
              courseBadge: c.badge
            });
          }
        });
      });
    });

    const pct = totalMins > 0 ? Math.round((doneMins / totalMins) * 100) : 0;
    const daysLeft = calcDaysRemaining(kp.targetCloseDate, todayIso);
    return { pct, daysLeft, todayItems, totalMins, doneMins };
  }, [state.kaustPlan, todayIso]);

  // ==========================================================================
  // الحسابات الموحدة لاختبار الهيئة SMLE (مهام اليوم + نسبة الإنجاز + الأيام المتبقية)
  // ==========================================================================
  const smleMetrics = useMemo(() => {
    const sp = state.smlePlan;
    const allVideos = Object.values(sp.videosBySpec).flat();
    const totalVideoSec = allVideos.reduce((s, v) => s + (v.seconds || 0), 0);
    const doneVideoSec = allVideos.filter((v) => v.done).reduce((s, v) => s + (v.seconds || 0), 0);

    const effectiveRecalls = sp.recallDailyItems.map((item) => ({
      ...item,
      date: sp.customRecallDates[item.id] || item.date
    }));

    const totalRecallPages = sp.recallFiles.reduce((a, f) => a + Number(f.pages || 0), 0);
    const doneRecallPages = effectiveRecalls
      .filter((r) => r.done)
      .reduce((a, r) => a + Number(r.pageCount || 0), 0);

    const totalSecAll = totalVideoSec + totalRecallPages * SECONDS_PER_RECALL_PAGE;
    const doneSecAll = doneVideoSec + doneRecallPages * SECONDS_PER_RECALL_PAGE;
    const pct = totalSecAll > 0 ? Math.round((doneSecAll / totalSecAll) * 100) : 0;
    const daysLeft = calcDaysRemaining(sp.planEndDate, todayIso);

    // مهام اليوم المجدولة في SMLE (فيديوهات + تجميعات)
    const baselineVideoDates = computeBalancedVideoSchedule(
      sp.videosBySpec,
      sp.studyStartDate,
      sp.studyEndDate
    );

    const todayVideos = [];
    Object.entries(sp.videosBySpec).forEach(([specId, list]) => {
      const specMeta = SPECIALTIES.find((s) => s.id === specId);
      list.forEach((vid) => {
        if (!vid.broken && vid.seconds > 0) {
          const assignedDate = sp.customStudyDates[vid.id] || baselineVideoDates[vid.id] || sp.studyStartDate;
          if (assignedDate === todayIso) {
            todayVideos.push({
              ...vid,
              specId,
              specShort: specMeta?.short || 'مدسن',
              specIcon: specMeta?.icon || '🩺'
            });
          }
        }
      });
    });

    const todayRecalls = effectiveRecalls.filter((r) => r.date === todayIso);

    return {
      pct,
      daysLeft,
      todayVideos,
      todayRecalls,
      totalRecallPages,
      doneRecallPages
    };
  }, [state.smlePlan, todayIso]);

  // ==========================================================================
  // الحسابات الموحدة للروتين اليومي وإحصائياته
  // ==========================================================================
  const routineMetrics = useMemo(() => {
    const habits = state.routineConfig.coreHabits;
    const logs = state.routineConfig.logs;
    const todayLog = logs[todayIso] || { completedHabits: [], extraTasks: [] };

    const todayPct =
      habits.length > 0 ? Math.round((todayLog.completedHabits.length / habits.length) * 100) : 0;

    // إحصائية آخر 7 أيام (الأسبوعية) + بيانات الرسم البياني
    const last7Dates = Array.from({ length: 7 }, (_, i) => addDaysIso(todayIso, -(6 - i)));
    const weeklyChart = last7Dates.map((dStr) => {
      const log = logs[dStr];
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const pct =
        log && habits.length > 0 ? Math.round((log.completedHabits.length / habits.length) * 100) : 0;
      return {
        date: dStr,
        dayShort: ARABIC_DAYS[dt.getDay()].slice(0, 3),
        pct,
        isToday: dStr === todayIso
      };
    });

    const weeklyAvgPct =
      weeklyChart.length > 0
        ? Math.round(weeklyChart.reduce((a, b) => a + b.pct, 0) / weeklyChart.length)
        : 0;

    // إحصائية الشهر الحالي بتوقيت السعودية
    const monthPrefix = todayIso.slice(0, 7);
    const monthDates = Object.keys(logs).filter((d) => d.startsWith(monthPrefix));
    const monthlyAvgPct =
      monthDates.length > 0 && habits.length > 0
        ? Math.round(
            monthDates.reduce(
              (acc, d) => acc + ((logs[d]?.completedHabits?.length || 0) / habits.length) * 100,
              0
            ) / monthDates.length
          )
        : 0;

    // المتبقي من أيام الشهر الحالي
    const [cy, cm, cd] = todayIso.split('-').map(Number);
    const daysInMonth = new Date(cy, cm, 0).getDate();
    const monthDaysLeft = Math.max(0, daysInMonth - cd);

    return {
      habits,
      todayLog,
      todayPct,
      weeklyAvgPct,
      monthlyAvgPct,
      weeklyChart,
      monthDaysLeft
    };
  }, [state.routineConfig, todayIso]);

  // ==========================================================================
  // دوال التزامن اللحظي من واجهة «خطة يومي»
  // ==========================================================================
  const toggleQuranTask = (wIdx, dIdx, tIdx) => {
    const key = `${wIdx}-${dIdx}-${tIdx}`;
    setState((prev) => {
      const sig = quranMetrics.P.sig;
      const nextDone = { ...(prev.quranPlan.done[sig] || {}) };
      if (nextDone[key]) delete nextDone[key];
      else nextDone[key] = 1;
      return {
        ...prev,
        quranPlan: {
          ...prev.quranPlan,
          done: { ...prev.quranPlan.done, [sig]: nextDone }
        }
      };
    });
  };

  const toggleKaustItem = (courseId, moduleId, itemId) => {
    setState((prev) => ({
      ...prev,
      kaustPlan: {
        ...prev.kaustPlan,
        courses: prev.kaustPlan.courses.map((c) =>
          c.id !== courseId
            ? c
            : {
                ...c,
                modules: c.modules.map((m) =>
                  m.id !== moduleId
                    ? m
                    : {
                        ...m,
                        items: m.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it))
                      }
                )
              }
        )
      }
    }));
  };

  const toggleSmleVideo = (specId, videoId) => {
    setState((prev) => ({
      ...prev,
      smlePlan: {
        ...prev.smlePlan,
        videosBySpec: {
          ...prev.smlePlan.videosBySpec,
          [specId]: prev.smlePlan.videosBySpec[specId].map((v) =>
            v.id === videoId ? { ...v, done: !v.done } : v
          )
        }
      }
    }));
  };

  const toggleSmleRecall = (itemId) => {
    setState((prev) => ({
      ...prev,
      smlePlan: {
        ...prev.smlePlan,
        recallDailyItems: prev.smlePlan.recallDailyItems.map((r) =>
          r.id === itemId ? { ...r, done: !r.done } : r
        )
      }
    }));
  };

  const toggleRoutineHabit = (dateStr, habitId) => {
    setState((prev) => {
      const log = prev.routineConfig.logs[dateStr] || { completedHabits: [], extraTasks: [] };
      const has = log.completedHabits.includes(habitId);
      const nextHabits = has
        ? log.completedHabits.filter((id) => id !== habitId)
        : [...log.completedHabits, habitId];
      return {
        ...prev,
        routineConfig: {
          ...prev.routineConfig,
          logs: {
            ...prev.routineConfig.logs,
            [dateStr]: { ...log, completedHabits: nextHabits }
          }
        }
      };
    });
  };

  const isDark = state.theme === 'dark';

  const navigateTo = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#121614] text-[#e8eee9]' : 'bg-[#f7f5f0] text-[#1f2421]'
      }`}
    >
      {/* إشعار عائم */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 bg-[#1d6b4f] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* شريط علوي للهواتف فقط */}
      <div
        className={`lg:hidden flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1d6b4f] text-white flex items-center justify-center font-bold text-sm">
            🧠
          </div>
          <span className="font-extrabold text-sm">عقلي الثاني</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 rounded-xl border ${
            isDark ? 'border-[#2a332e]' : 'border-[#e6e2d8]'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ======================================================================
          1. القائمة الجانبية المصغّرة والمرتبة (w-60 على الشاشات الكبيرة)
      ====================================================================== */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } lg:flex flex-col w-full lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-l p-3.5 gap-3 transition-all ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        {/* الهوية + زر تبديل الوضع */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1d6b4f] text-white flex items-center justify-center font-bold text-base shadow-xs">
              🧠
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight">عقلي الثاني</div>
              <div className="text-[10px] opacity-60">خطة يومي والأهداف</div>
            </div>
          </div>

          <button
            onClick={() => setState((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}
            className={`p-1.5 rounded-xl border transition ${
              isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
            }`}
            title="تبديل المظهر"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 pt-1">
          {/* 1. الرئيسية */}
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              activePage === 'dashboard'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : isDark
                ? 'hover:bg-[#232b27] text-slate-200'
                : 'hover:bg-[#f7f5f0] text-[#1f2421]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>الرئيسية</span>
          </button>

          {/* 2. الأهداف + سهم القائمة الفرعية */}
          <div className="space-y-1">
            <button
              onClick={() => setGoalsMenuOpen(!goalsMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold transition ${
                activePage === 'quran' || activePage === 'kaust'
                  ? isDark
                    ? 'bg-[#232b27] text-[#4fbf93]'
                    : 'bg-[#eaf4ef] text-[#1d6b4f]'
                  : isDark
                  ? 'hover:bg-[#232b27] text-slate-200'
                  : 'hover:bg-[#f7f5f0] text-[#1f2421]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-amber-600 shrink-0" />
                <span>الأهداف</span>
              </div>
              {goalsMenuOpen ? (
                <ChevronDown className="w-4 h-4 opacity-70" />
              ) : (
                <ChevronLeft className="w-4 h-4 opacity-70" />
              )}
            </button>

            {goalsMenuOpen && (
              <div className="pr-3 mr-2 border-r border-[#1d6b4f]/25 space-y-1">
                {/* أ: حفظ القرآن الكريم */}
                <button
                  onClick={() => navigateTo('quran')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                    activePage === 'quran'
                      ? 'bg-[#1d6b4f] text-white shadow-xs'
                      : isDark
                      ? 'hover:bg-[#232b27] text-slate-300'
                      : 'hover:bg-[#f7f5f0] text-[#4a473f]'
                  }`}
                >
                  <span className="truncate">حفظ القرآن الكريم</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      activePage === 'quran' ? 'bg-white/20 text-white' : 'bg-[#eaf4ef] text-[#1d6b4f]'
                    }`}
                  >
                    {quranMetrics.pct}%
                  </span>
                </button>

                {/* ب: دورة كاوست */}
                <button
                  onClick={() => navigateTo('kaust')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                    activePage === 'kaust'
                      ? 'bg-[#1d6b4f] text-white shadow-xs'
                      : isDark
                      ? 'hover:bg-[#232b27] text-slate-300'
                      : 'hover:bg-[#f7f5f0] text-[#4a473f]'
                  }`}
                >
                  <span className="truncate">دورة كاوست</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      activePage === 'kaust' ? 'bg-white/20 text-white' : 'bg-[#eaf4ef] text-[#1d6b4f]'
                    }`}
                  >
                    {kaustMetrics.pct}%
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 3. الدراسة: اختبار الهيئة */}
          <button
            onClick={() => navigateTo('smle')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              activePage === 'smle'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : isDark
                ? 'hover:bg-[#232b27] text-slate-200'
                : 'hover:bg-[#f7f5f0] text-[#1f2421]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">الدراسة: اختبار الهيئة</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0 ${
                activePage === 'smle' ? 'bg-white/20 text-white' : 'bg-[#eaf4ef] text-[#1d6b4f]'
              }`}
            >
              {smleMetrics.pct}%
            </span>
          </button>

          {/* 4. الروتين */}
          <button
            onClick={() => navigateTo('routine')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-extrabold transition ${
              activePage === 'routine' || activePage === 'routine_stats'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : isDark
                ? 'hover:bg-[#232b27] text-slate-200'
                : 'hover:bg-[#f7f5f0] text-[#1f2421]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>الروتين</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                activePage === 'routine' || activePage === 'routine_stats'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#eaf4ef] text-[#1d6b4f]'
              }`}
            >
              {routineMetrics.todayPct}%
            </span>
          </button>
        </nav>

        {/* تذييل مصغّر بالتاريخ الحي بتوقيت السعودية */}
        <div
          className={`pt-2.5 border-t text-[11px] text-center opacity-75 space-y-0.5 ${
            isDark ? 'border-[#2a332e]' : 'border-[#e6e2d8]'
          }`}
        >
          <div className="font-bold">{formatArabicDate(todayIso)}</div>
          <div className="text-[9px] opacity-70">بتوقيت السعودية (محدث تلقائياً)</div>
        </div>
      </aside>

      {/* ======================================================================
          2. المحتوى الرئيسي (المتغير حسب الصفحة المختارة)
      ====================================================================== */}
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
        {activePage === 'dashboard' && (
          <DailyPlanDashboard
            state={state}
            setState={setState}
            isDark={isDark}
            todayIso={todayIso}
            quranMetrics={quranMetrics}
            kaustMetrics={kaustMetrics}
            smleMetrics={smleMetrics}
            routineMetrics={routineMetrics}
            toggleQuranTask={toggleQuranTask}
            toggleKaustItem={toggleKaustItem}
            toggleSmleVideo={toggleSmleVideo}
            toggleSmleRecall={toggleSmleRecall}
            toggleRoutineHabit={toggleRoutineHabit}
            onNavigate={navigateTo}
          />
        )}

        {activePage === 'quran' && (
          <QuranFullView
            state={state}
            setState={setState}
            isDark={isDark}
            todayIso={todayIso}
            tomorrowIso={tomorrowIso}
            quranMetrics={quranMetrics}
            onBack={() => navigateTo('dashboard')}
            showToast={showToast}
          />
        )}

        {activePage === 'kaust' && (
          <KaustFullView
            state={state}
            setState={setState}
            isDark={isDark}
            todayIso={todayIso}
            onBack={() => navigateTo('dashboard')}
            showToast={showToast}
          />
        )}

        {activePage === 'smle' && (
          <SmleFullView
            state={state}
            setState={setState}
            isDark={isDark}
            todayIso={todayIso}
            tomorrowIso={tomorrowIso}
            onBack={() => navigateTo('dashboard')}
            showToast={showToast}
          />
        )}

        {activePage === 'routine' && (
          <RoutineFullView
            state={state}
            setState={setState}
            isDark={isDark}
            todayIso={todayIso}
            onOpenStats={() => navigateTo('routine_stats')}
            onBack={() => navigateTo('dashboard')}
            showToast={showToast}
          />
        )}

        {activePage === 'routine_stats' && (
          <RoutineStatsFullView
            state={state}
            isDark={isDark}
            todayIso={todayIso}
            onBackToRoutine={() => navigateTo('routine')}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 8. واجهة «خطة يومي الشاملة» (الصفحة الرئيسية — 3 أعمدة طولية + بطاقة الدعاء)
// ============================================================================
function DailyPlanDashboard({
  state,
  setState,
  isDark,
  todayIso,
  quranMetrics,
  kaustMetrics,
  smleMetrics,
  routineMetrics,
  toggleQuranTask,
  toggleKaustItem,
  toggleSmleVideo,
  toggleSmleRecall,
  toggleRoutineHabit,
  onNavigate
}) {
  const [newDuaText, setNewDuaText] = useState('');

  // حساب مؤشر الإنجاز اليومي العام عبر المسارات الأربعة
  const dailySummary = useMemo(() => {
    const qTotal = quranMetrics.todayTasks.length;
    const qDone = quranMetrics.todayTasks.filter((t) => t.done).length;

    const kTotal = kaustMetrics.todayItems.length;
    const kDone = kaustMetrics.todayItems.filter((t) => t.done).length;

    const sTotal = smleMetrics.todayVideos.length + smleMetrics.todayRecalls.length;
    const sDone =
      smleMetrics.todayVideos.filter((v) => v.done).length +
      smleMetrics.todayRecalls.filter((r) => r.done).length;

    const rTotal = routineMetrics.habits.length;
    const rDone = routineMetrics.todayLog.completedHabits.length;

    const totalAll = qTotal + kTotal + sTotal + rTotal;
    const doneAll = qDone + kDone + sDone + rDone;
    const pct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

    return { totalAll, doneAll, pct };
  }, [quranMetrics, kaustMetrics, smleMetrics, routineMetrics]);

  const handleAddDua = (e) => {
    e.preventDefault();
    if (!newDuaText.trim()) return;
    setState((prev) => ({
      ...prev,
      duaReminders: [
        ...prev.duaReminders,
        { id: 'dua-' + Date.now(), text: newDuaText.trim() }
      ]
    }));
    setNewDuaText('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* 1. الترويسة العلوية النظيفة */}
      <header
        className={`rounded-3xl border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#1d6b4f]">
            <Calendar className="w-4 h-4" />
            <span>{formatArabicDate(todayIso)}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            خطة يومي الشاملة
          </h1>
        </div>

        {/* مؤشر الإنجاز اليومي العام */}
        <div
          className={`rounded-2xl border px-4 py-3 flex items-center gap-4 min-w-[230px] ${
            isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
          }`}
        >
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="opacity-75">إنجاز مهام اليوم</span>
              <span className="text-[#1d6b4f]">
                {dailySummary.doneAll}/{dailySummary.totalAll} ({dailySummary.pct}%)
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#e6e2d8]'}`}>
              <div
                className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                style={{ width: `${dailySummary.pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. بطاقة «تذكير الدعاء بين الأذان والإقامة» */}
      <section
        className={`rounded-3xl border p-5 shadow-xs transition ${
          isDark
            ? 'bg-gradient-to-l from-[#1a2620] to-[#181e1b] border-[#2d3e36]'
            : 'bg-gradient-to-l from-[#eaf4ef] via-[#f4f8f5] to-white border-[#cde2d7]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2 text-[#1d6b4f]">
              <div className="w-8 h-8 rounded-xl bg-[#1d6b4f] text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm md:text-base">
                  تذكير الدعاء بين الأذان والإقامة
                </h2>
                <p className="text-[11px] opacity-70">
                  الدعاء لا يُردّ بين الأذان والإقامة — اجعلي أمنياتكِ وأهدافكِ حاضرة في دعائكِ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {state.duaReminders.map((dua) => (
                <div
                  key={dua.id}
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed flex items-start justify-between gap-2 border ${
                    isDark
                      ? 'bg-[#121614]/80 border-[#2a332e]'
                      : 'bg-white/90 border-[#dceae3]'
                  }`}
                >
                  <span className="font-medium">{dua.text}</span>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        duaReminders: prev.duaReminders.filter((d) => d.id !== dua.id)
                      }))
                    }
                    className="text-rose-500 opacity-50 hover:opacity-100 p-0.5 shrink-0"
                    title="حذف التذكير"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddDua} className="flex items-center gap-2 lg:w-80 shrink-0">
            <input
              type="text"
              value={newDuaText}
              onChange={(e) => setNewDuaText(e.target.value)}
              placeholder="أضيفي دعاءً أو تذكيراً..."
              className={`flex-1 text-xs px-3.5 py-2.5 rounded-2xl border outline-none ${
                isDark
                  ? 'bg-[#121614] border-[#2a332e] focus:border-[#4fbf93]'
                  : 'bg-white border-[#cde2d7] focus:border-[#1d6b4f]'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-[#1d6b4f] hover:bg-[#16543e] text-white text-xs font-extrabold transition shrink-0"
            >
              إضافة
            </button>
          </form>
        </div>
      </section>

      {/* 3. البورد الرئيسي المقسم لثلاثة أقسام بالطول (grid-cols-1 lg:grid-cols-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ==================================================================
            العمود الأول (بالطول): قسم الأهداف (حفظ القرآن + دورة كاوست)
        ================================================================== */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-base">قسم الأهداف</h2>
            </div>
            <span className="text-[11px] font-bold opacity-60">هدفان نشطان</span>
          </div>

          {/* أ: بطاقة هدف حفظ القرآن الكريم كاملاً */}
          <div
            className={`rounded-3xl border p-5 shadow-xs flex-1 flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => onNavigate('quran')}
                    className="font-extrabold text-sm md:text-base text-right hover:text-[#1d6b4f] transition flex items-center gap-1.5"
                  >
                    <span>📖 حفظ القرآن الكريم كاملاً</span>
                  </button>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {quranMetrics.daysLeft >= 0
                        ? `متبقي ${quranMetrics.daysLeft} يوم`
                        : `تجاوز الموعد بـ ${Math.abs(quranMetrics.daysLeft)} يوم`}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="opacity-75 text-[#6c685f]">
                      {quranMetrics.memorizedPages} / ٦٠٤ صفحة
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold shrink-0">
                  {quranMetrics.pct}%
                </span>
              </div>

              {/* شريط الإنجاز العام للقرآن */}
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                <div
                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                  style={{ width: `${quranMetrics.pct}%` }}
                />
              </div>

              {/* مهام اليوم الخاصة بحفظ القرآن */}
              <div
                className={`rounded-2xl p-3 space-y-2 ${
                  isDark ? 'bg-[#121614]' : 'bg-[#f8f6f1]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold opacity-75">
                  <span>
                    مهام اليوم ({quranMetrics.todayTasks.filter((t) => t.done).length}/
                    {quranMetrics.todayTasks.length})
                  </span>
                  <button
                    onClick={() => onNavigate('quran')}
                    className="text-[#1d6b4f] hover:underline"
                  >
                    فتح الخطة ←
                  </button>
                </div>

                {quranMetrics.todayTasks.length === 0 ? (
                  <p className="text-xs opacity-60 py-1">
                    {quranMetrics.isDeferredToday
                      ? 'تم ترحيل ورد اليوم إلى الغد.'
                      : 'لا توجد أوراد مجدولة لهذا اليوم.'}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {quranMetrics.todayTasks.map((task) => (
                      <label
                        key={task.taskKey}
                        onClick={() => toggleQuranTask(task.wIdx, task.dIdx, task.tIdx)}
                        className="flex items-start gap-2.5 text-xs cursor-pointer p-1.5 rounded-xl hover:bg-[#1d6b4f]/5 transition"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                        />
                        <span
                          className={`leading-snug font-medium ${
                            task.done ? 'line-through opacity-50' : ''
                          }`}
                        >
                          {task.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ب: بطاقة هدف دورة كاوست معلوماتية حيوية */}
          <div
            className={`rounded-3xl border p-5 shadow-xs flex-1 flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => onNavigate('kaust')}
                    className="font-extrabold text-sm md:text-base text-right hover:text-[#1d6b4f] transition flex items-center gap-1.5"
                  >
                    <span>🧬 دورة كاوست معلوماتية حيوية</span>
                  </button>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {kaustMetrics.daysLeft >= 0
                        ? `متبقي ${kaustMetrics.daysLeft} يوم`
                        : `تجاوز الموعد بـ ${Math.abs(kaustMetrics.daysLeft)} يوم`}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="opacity-75 text-[#6c685f]">٣ دورات • ١٢ وحدة</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold shrink-0">
                  {kaustMetrics.pct}%
                </span>
              </div>

              {/* شريط الإنجاز العام لدورة كاوست */}
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                <div
                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                  style={{ width: `${kaustMetrics.pct}%` }}
                />
              </div>

              {/* مهام اليوم الخاصة بدورة كاوست */}
              <div
                className={`rounded-2xl p-3 space-y-2 ${
                  isDark ? 'bg-[#121614]' : 'bg-[#f8f6f1]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold opacity-75">
                  <span>
                    مهام اليوم ({kaustMetrics.todayItems.filter((t) => t.done).length}/
                    {kaustMetrics.todayItems.length})
                  </span>
                  <button
                    onClick={() => onNavigate('kaust')}
                    className="text-[#1d6b4f] hover:underline"
                  >
                    فتح الدبلوم ←
                  </button>
                </div>

                {kaustMetrics.todayItems.length === 0 ? (
                  <p className="text-xs opacity-60 py-1">لا توجد دروس مجدولة لهذا اليوم.</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pl-1">
                    {kaustMetrics.todayItems.map((item) => (
                      <label
                        key={item.id}
                        onClick={() => toggleKaustItem(item.courseId, item.moduleId, item.id)}
                        className="flex items-start gap-2.5 text-xs cursor-pointer p-1.5 rounded-xl hover:bg-[#1d6b4f]/5 transition"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0 leading-snug">
                          <span className={`font-medium ${item.done ? 'line-through opacity-50' : ''}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] opacity-60 mr-1.5">({item.duration} د)</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            العمود الثاني (بالطول): قسم الدراسة — اختبار الهيئة (SMLE)
        ================================================================== */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-base">قسم الدراسة</h2>
            </div>
            <span className="text-[11px] font-bold opacity-60">اختبار الهيئة SMLE</span>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-xs flex-1 flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => onNavigate('smle')}
                    className="font-extrabold text-base text-right hover:text-[#1d6b4f] transition flex items-center gap-1.5"
                  >
                    <span>🩺 اختبار الهيئة السعودية (SMLE)</span>
                  </button>
                  <div className="flex items-center gap-2 mt-1 text-xs font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {smleMetrics.daysLeft >= 0
                        ? `متبقي ${smleMetrics.daysLeft} يوم`
                        : `تجاوز الموعد بـ ${Math.abs(smleMetrics.daysLeft)} يوم`}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="opacity-75 text-[#6c685f]">التخصصات + التجميعات</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold shrink-0">
                  {smleMetrics.pct}%
                </span>
              </div>

              {/* شريط الإنجاز العام لاختبار SMLE */}
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                <div
                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                  style={{ width: `${smleMetrics.pct}%` }}
                />
              </div>

              {/* قائمة مهام اليوم الخاصة بـ SMLE (محاضرات + تجميعات) */}
              <div
                className={`rounded-2xl p-3.5 space-y-2.5 ${
                  isDark ? 'bg-[#121614]' : 'bg-[#f8f6f1]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold opacity-80">
                  <span>
                    مهام اليوم (
                    {smleMetrics.todayVideos.filter((v) => v.done).length +
                      smleMetrics.todayRecalls.filter((r) => r.done).length}
                    /{smleMetrics.todayVideos.length + smleMetrics.todayRecalls.length})
                  </span>
                  <button
                    onClick={() => onNavigate('smle')}
                    className="text-[#1d6b4f] hover:underline text-[11px]"
                  >
                    فتح جدول SMLE ←
                  </button>
                </div>

                {smleMetrics.todayVideos.length === 0 && smleMetrics.todayRecalls.length === 0 ? (
                  <p className="text-xs opacity-60 py-2">
                    لا توجد محاضرات أو تجميعات مجدولة لليوم — يمكنكِ ضبط التوزيع من صفحة SMLE.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
                    {/* محاضرات اليوم */}
                    {smleMetrics.todayVideos.map((vid) => (
                      <label
                        key={vid.id}
                        onClick={() => toggleSmleVideo(vid.specId, vid.id)}
                        className="flex items-start gap-2.5 text-xs cursor-pointer p-2 rounded-xl hover:bg-[#1d6b4f]/5 transition border border-transparent hover:border-[#1d6b4f]/15"
                      >
                        <input
                          type="checkbox"
                          checked={vid.done}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0 leading-snug space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-[#eaf4ef] text-[#1d6b4f] text-[10px] font-bold">
                              {vid.specIcon} {vid.specShort}
                            </span>
                            <span className="text-[10px] opacity-60">
                              ({formatShortMins(vid.seconds)})
                            </span>
                          </div>
                          <div className={`font-bold ${vid.done ? 'line-through opacity-50' : ''}`}>
                            {vid.title}
                          </div>
                        </div>
                      </label>
                    ))}

                    {/* ورد التجميعات لليوم */}
                    {smleMetrics.todayRecalls.map((rec) => {
                      const recSec = Number(rec.pageCount || 0) * SECONDS_PER_RECALL_PAGE;
                      return (
                        <label
                          key={rec.id}
                          onClick={() => toggleSmleRecall(rec.id)}
                          className="flex items-start gap-2.5 text-xs cursor-pointer p-2 rounded-xl hover:bg-amber-500/5 transition border border-transparent hover:border-amber-500/20"
                        >
                          <input
                            type="checkbox"
                            checked={rec.done}
                            onChange={() => {}}
                            className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0 leading-snug space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#b45309] text-[10px] font-bold">
                                📝 تجميعات
                              </span>
                              <span className="text-[10px] font-bold text-[#b45309]">
                                ~{formatShortMins(recSec)}
                              </span>
                            </div>
                            <div className={`font-bold ${rec.done ? 'line-through opacity-50' : ''}`}>
                              {rec.fileTitle} — ص {rec.fromPage} إلى {rec.toPage} ({rec.pageCount} ص)
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            العمود الثالث (بالطول): قسم الروتين اليومي وإحصائياته
        ================================================================== */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-base">قسم الروتين وإحصائياته</h2>
            </div>
            <span className="text-[11px] font-bold opacity-60">متجدد يومياً</span>
          </div>

          <div
            className={`rounded-3xl border p-5 shadow-xs flex-1 flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="space-y-4">
              {/* رأس بطاقة الروتين */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button
                    onClick={() => onNavigate('routine')}
                    className="font-extrabold text-base text-right hover:text-[#1d6b4f] transition flex items-center gap-1.5"
                  >
                    <span>🌿 الروتين والأوراد اليومية</span>
                  </button>
                  <div className="flex items-center gap-2 mt-1 text-xs font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>متبقي {routineMetrics.monthDaysLeft} يوم في الشهر</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold shrink-0">
                  {routineMetrics.todayPct}%
                </span>
              </div>

              {/* شريط إنجاز روتين اليوم */}
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                <div
                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                  style={{ width: `${routineMetrics.todayPct}%` }}
                />
              </div>

              {/* قائمة أوراد وعادات اليوم */}
              <div
                className={`rounded-2xl p-3 space-y-1.5 ${
                  isDark ? 'bg-[#121614]' : 'bg-[#f8f6f1]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold opacity-75 mb-1">
                  <span>
                    أوراد اليوم ({routineMetrics.todayLog.completedHabits.length}/
                    {routineMetrics.habits.length})
                  </span>
                  <button
                    onClick={() => onNavigate('routine')}
                    className="text-[#1d6b4f] hover:underline"
                  >
                    جدول الروتين ←
                  </button>
                </div>

                <div className="space-y-1.5">
                  {routineMetrics.habits.map((habit) => {
                    const checked = routineMetrics.todayLog.completedHabits.includes(habit.id);
                    return (
                      <label
                        key={habit.id}
                        onClick={() => toggleRoutineHabit(todayIso, habit.id)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition ${
                          checked
                            ? isDark
                              ? 'bg-[#1d6b4f]/20 text-[#4fbf93] font-bold'
                              : 'bg-[#eaf4ef] text-[#1d6b4f] font-bold'
                            : 'hover:bg-[#1d6b4f]/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer"
                          />
                          <span className={checked ? 'line-through opacity-75' : 'font-medium'}>
                            {habit.label}
                          </span>
                        </div>
                        {checked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ملخص إحصائيات الروتين مدمج داخل البطاقة + رسم بياني مصغر */}
            <div
              className={`rounded-2xl border p-3.5 space-y-3 ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#1d6b4f]" />
                  <span>ملخص إحصائيات الروتين</span>
                </span>
                <button
                  onClick={() => onNavigate('routine_stats')}
                  className="text-[11px] font-extrabold text-[#1d6b4f] hover:underline"
                >
                  الإحصائيات التفصيلية ←
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div
                  className={`rounded-xl py-2 px-2 border ${
                    isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                  }`}
                >
                  <div className="text-[10px] opacity-65 font-bold">الالتزام الأسبوعي</div>
                  <div className="text-sm font-extrabold text-[#1d6b4f] mt-0.5">
                    {routineMetrics.weeklyAvgPct}%
                  </div>
                </div>

                <div
                  className={`rounded-xl py-2 px-2 border ${
                    isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                  }`}
                >
                  <div className="text-[10px] opacity-65 font-bold">الالتزام الشهري</div>
                  <div className="text-sm font-extrabold text-amber-600 mt-0.5">
                    {routineMetrics.monthlyAvgPct}%
                  </div>
                </div>
              </div>

              {/* رسم بياني مصغر بالأعمدة لأداء الأسبوع */}
              <div className="pt-1">
                <div className="h-20 flex items-end justify-between gap-1.5 px-1">
                  {routineMetrics.weeklyChart.map((bar) => (
                    <div
                      key={bar.date}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                      title={`${bar.date}: ${bar.pct}%`}
                    >
                      <span className="text-[9px] font-bold opacity-70">{bar.pct}%</span>
                      <div className="w-full max-w-[22px] h-11 rounded-t-md bg-slate-400/15 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            bar.isToday ? 'bg-amber-500' : 'bg-[#1d6b4f]'
                          }`}
                          style={{ height: `${Math.max(8, bar.pct)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-bold ${
                          bar.isToday ? 'text-[#1d6b4f]' : 'opacity-65'
                        }`}
                      >
                        {bar.dayShort}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// 9. الصفحة التفصيلية الأولى: حفظ القرآن الكريم كاملاً (كاملة بجميع ميزاتها)
// ============================================================================
const QURAN_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function QuranFullView({
  state,
  setState,
  isDark,
  todayIso,
  tomorrowIso,
  quranMetrics,
  onBack,
  showToast
}) {
  const qp = state.quranPlan;
  const { P, doneMap, wi, memorizedPages, pct, daysLeft, isDeferredToday } = quranMetrics;

  const [selectedWeek, setSelectedWeek] = useState(wi);
  const [editingTaskKey, setEditingTaskKey] = useState(null);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [editDateVal, setEditDateVal] = useState('');
  const [selectedPageInfo, setSelectedPageInfo] = useState(
    'اضغطي على أي مربع في خريطة المصحف لمعرفة حالة الصفحة.'
  );

  useEffect(() => {
    setSelectedWeek(wi);
  }, [wi]);

  const updateQuranSetting = (patch) => {
    setState((prev) => ({
      ...prev,
      quranPlan: { ...prev.quranPlan, ...patch }
    }));
  };

  const toggleWeekTask = (wIdx, dIdx, tIdx) => {
    const key = `${wIdx}-${dIdx}-${tIdx}`;
    setState((prev) => {
      const nextDone = { ...(prev.quranPlan.done[P.sig] || {}) };
      if (nextDone[key]) delete nextDone[key];
      else nextDone[key] = 1;
      return {
        ...prev,
        quranPlan: {
          ...prev.quranPlan,
          done: { ...prev.quranPlan.done, [P.sig]: nextDone }
        }
      };
    });
  };

  const toggleWeak = (rangeKey, label) => {
    setState((prev) => {
      const nextWeak = { ...prev.quranPlan.weak };
      if (nextWeak[rangeKey]) delete nextWeak[rangeKey];
      else nextWeak[rangeKey] = label;
      return {
        ...prev,
        quranPlan: { ...prev.quranPlan, weak: nextWeak }
      };
    });
  };

  const getResolvedTasksForDate = (targetIso, defaultWi, defaultDi) => {
    const overrides = qp.taskOverrides || {};
    const [sy, sm, sd] = qp.start.split('-').map(Number);
    const planStartObj = new Date(sy, sm - 1, sd);
    const results = [];

    const defaultTasks = getQuranTasksForDay(P, defaultWi, defaultDi);
    defaultTasks.forEach((t, idx) => {
      const taskKey = `${defaultWi}-${defaultDi}-${idx}`;
      const ov = overrides[taskKey] || {};
      const effectiveDate = ov.date || targetIso;
      if (effectiveDate === targetIso) {
        results.push({
          taskKey,
          baseTitle: `${t.l} (${formatRange(t.r[0], t.r[1])})`,
          customTitle: ov.title || null,
          label: t.l,
          range: t.r,
          type: t.t,
          effectiveDate,
          isMovedHere: false
        });
      }
    });

    Object.entries(overrides).forEach(([taskKey, ov]) => {
      if (!ov || ov.date !== targetIso) return;
      const [wStr, dStr, iStr] = taskKey.split('-').map(Number);
      if (wStr === defaultWi && dStr === defaultDi) return;
      const sourceTasks = getQuranTasksForDay(P, wStr, dStr);
      const t = sourceTasks[iStr];
      if (!t) return;
      const origDateObj = new Date(planStartObj);
      origDateObj.setDate(origDateObj.getDate() + wStr * 7 + dStr);
      results.push({
        taskKey,
        baseTitle: `${t.l} (${formatRange(t.r[0], t.r[1])})`,
        customTitle: ov.title || null,
        label: t.l,
        range: t.r,
        type: t.t,
        effectiveDate: targetIso,
        isMovedHere: true,
        origDateIso: getIsoDate(origDateObj)
      });
    });

    return results;
  };

  // زر الطوارئ مرة واحدة لليوم + زر الإعادة
  const triggerQuranEmergency = () => {
    if (qp.deferredDates?.[todayIso] || (qp.emergencyBackup && qp.emergencyBackup.date === todayIso)) {
      return;
    }

    const todayResolved = getResolvedTasksForDate(todayIso, wi, quranMetrics.di);
    const uncompletedToday = todayResolved
      .filter((item) => !doneMap[item.taskKey])
      .map((item) => ({
        taskKey: item.taskKey,
        text: item.customTitle || item.baseTitle,
        type: item.type
      }));

    const carriedFromYesterday = (qp.carryOverTasks?.[todayIso] || []).filter(
      (item) => !doneMap[item.taskKey]
    );

    const allToMoveTomorrow = [...carriedFromYesterday, ...uncompletedToday];

    setState((prev) => ({
      ...prev,
      quranPlan: {
        ...prev.quranPlan,
        emergencyBackup: {
          date: todayIso,
          prevDeferred: !!prev.quranPlan.deferredDates?.[todayIso],
          prevTodayCarry: prev.quranPlan.carryOverTasks?.[todayIso] || [],
          prevTomorrowCarry: prev.quranPlan.carryOverTasks?.[tomorrowIso] || []
        },
        deferredDates: { ...(prev.quranPlan.deferredDates || {}), [todayIso]: true },
        carryOverTasks: {
          ...(prev.quranPlan.carryOverTasks || {}),
          [todayIso]: [],
          [tomorrowIso]: [
            ...(prev.quranPlan.carryOverTasks?.[tomorrowIso] || []),
            ...allToMoveTomorrow
          ]
        }
      }
    }));
    showToast('🚨 تم نقل ورد اليوم إلى الغد (مرة واحدة لليوم). يمكنكِ الضغط على «إعادة» للتراجع.');
  };

  const undoQuranEmergency = () => {
    const backup = qp.emergencyBackup;
    if (!backup) return;
    const targetTomorrow = addDaysIso(backup.date, 1);
    setState((prev) => {
      const nextDeferred = { ...(prev.quranPlan.deferredDates || {}) };
      if (backup.prevDeferred) nextDeferred[backup.date] = true;
      else delete nextDeferred[backup.date];

      return {
        ...prev,
        quranPlan: {
          ...prev.quranPlan,
          deferredDates: nextDeferred,
          carryOverTasks: {
            ...(prev.quranPlan.carryOverTasks || {}),
            [backup.date]: backup.prevTodayCarry,
            [targetTomorrow]: backup.prevTomorrowCarry
          },
          emergencyBackup: null
        }
      };
    });
    showToast('↩️ تمت إعادة ورد اليوم وأُعيد تفعيل زر الطوارئ بنجاح!');
  };

  const startEditingTask = (task) => {
    setEditingTaskKey(task.taskKey);
    setEditTitleVal(task.customTitle || task.baseTitle);
    setEditDateVal(task.effectiveDate);
  };

  const saveTaskOverride = (taskKey, defaultDateIso) => {
    const trimmedTitle = editTitleVal.trim();
    const chosenDate = editDateVal || defaultDateIso;

    setState((prev) => {
      const nextOverrides = { ...(prev.quranPlan.taskOverrides || {}) };
      nextOverrides[taskKey] = {
        ...(nextOverrides[taskKey] || {}),
        title: trimmedTitle || undefined,
        date: chosenDate
      };
      return {
        ...prev,
        quranPlan: {
          ...prev.quranPlan,
          taskOverrides: nextOverrides
        }
      };
    });

    setEditingTaskKey(null);
    showToast('✅ تم تحديث المهمة وتاريخها بشكل مستقل دون التأثير على الخطة.');
  };

  const pageMapData = useMemo(() => {
    const mem = new Array(605).fill(0);
    const rv = new Array(605).fill(0);
    for (let p = 1; p <= P.pre; p++) mem[p] = 1;
    for (let w = 0; w < P.TW; w++) {
      for (let d = 0; d < 7; d++) {
        getQuranTasksForDay(P, w, d).forEach((t, j) => {
          if (!doneMap[`${w}-${d}-${j}`]) return;
          for (let p = t.r[0]; p <= t.r[1]; p++) {
            if (t.t === 'new') mem[p] = 1;
            else rv[p]++;
          }
        });
      }
    }
    return { mem, rv };
  }, [P, doneMap]);

  const isEmergencyUsedToday = !!(
    isDeferredToday ||
    (qp.emergencyBackup && qp.emergencyBackup.date === todayIso)
  );
  const hasEmergencyBackup = !!(qp.emergencyBackup && qp.emergencyBackup.date === todayIso);

  const [sy, sm, sd] = qp.start.split('-').map(Number);
  const startDateObj = new Date(sy, sm - 1, sd);
  const autoFinDateObj = new Date(sy, sm - 1, sd);
  autoFinDateObj.setDate(autoFinDateObj.getDate() + P.TW * 7 - 1);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* رأس الصفحة + أزرار الطوارئ والإعادة */}
      <div
        className={`rounded-3xl border p-4 md:p-5 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border ${
              isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
            }`}
            title="العودة لخطة يومي"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold">📖 حفظ القرآن الكريم كاملاً</h1>
            <p className="text-xs opacity-65 mt-0.5">
              خطة الحفظ والمراجعة المتباعدة + خريطة المصحف الـ ٦٠٤ صفحة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerQuranEmergency}
            disabled={isEmergencyUsedToday}
            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition ${
              isEmergencyUsedToday
                ? 'bg-rose-500/20 text-rose-500 cursor-not-allowed opacity-75'
                : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isEmergencyUsedToday ? '🚨 طوارئ (مُفعّل لليوم)' : '🚨 طوارئ'}</span>
          </button>

          {hasEmergencyBackup && (
            <button
              onClick={undoQuranEmergency}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>↩️ إعادة</span>
            </button>
          )}
        </div>
      </div>

      {/* ملخص الإنجاز وشريط الأجزاء الـ 30 */}
      <div
        className={`rounded-3xl border p-5 space-y-3 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1d6b4f]" />
            <span className="font-extrabold text-sm">
              المحفوظ: {memorizedPages} / ٦٠٤ صفحة ({pct}%)
            </span>
            {daysLeft !== null && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#eaf4ef] text-[#1d6b4f] font-bold">
                {daysLeft >= 0 ? `متبقي ${daysLeft} يوم` : `تجاوز الموعد بـ ${Math.abs(daysLeft)} يوم`}
              </span>
            )}
          </div>
          <span className="text-xs opacity-75">
            الختم الحسابي حسب الوتيرة:{' '}
            <strong>
              {autoFinDateObj.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </span>
        </div>

        <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
          <div className="h-full bg-[#1d6b4f] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] opacity-60 ml-1 font-bold">الأجزاء:</span>
          {Array.from({ length: 30 }, (_, i) => {
            const doneJuz = memorizedPages >= Math.min(604, 20 * (i + 1) + 1);
            return (
              <span
                key={i}
                title={`الجزء ${i + 1}`}
                className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center border transition ${
                  doneJuz
                    ? 'bg-[#1d6b4f] text-white border-[#1d6b4f] font-bold'
                    : isDark
                    ? 'border-[#2a332e] opacity-50'
                    : 'border-[#e6e2d8] opacity-65'
                }`}
              >
                {i + 1}
              </span>
            );
          })}
        </div>
      </div>

      {/* إعدادات الخطة والتنقل بين الأسابيع */}
      <div
        className={`rounded-3xl border p-4 space-y-3 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 font-bold text-[#1d6b4f]">
            <span>📅 البداية:</span>
            <input
              type="date"
              value={qp.start}
              onChange={(e) => {
                if (!e.target.value) return;
                const [a, b, c] = e.target.value.split('-').map(Number);
                const d = new Date(a, b - 1, c);
                d.setDate(d.getDate() - d.getDay());
                updateQuranSetting({ start: getIsoDate(d) });
              }}
              className={`px-2.5 py-1 rounded-xl border font-normal ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            />
          </label>

          <label className="flex items-center gap-1.5 font-bold text-amber-600">
            <span>🏁 النهاية:</span>
            <input
              type="date"
              value={qp.end || getIsoDate(autoFinDateObj)}
              onChange={(e) => updateQuranSetting({ end: e.target.value })}
              className={`px-2.5 py-1 rounded-xl border font-normal ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            />
          </label>

          <label className="flex items-center gap-1.5">
            <span>البقرة وآل عمران:</span>
            <select
              value={qp.p1}
              onChange={(e) => updateQuranSetting({ p1: +e.target.value })}
              className={`px-2 py-1 rounded-xl border ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            >
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ص/يوم
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span>باقي السور:</span>
            <select
              value={qp.p2}
              onChange={(e) => updateQuranSetting({ p2: +e.target.value })}
              className={`px-2 py-1 rounded-xl border ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ص/يوم
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span>بداية الحفظ من صفحة:</span>
            <input
              type="number"
              min={1}
              max={604}
              value={qp.sp}
              onChange={(e) =>
                updateQuranSetting({ sp: Math.max(1, Math.min(604, +e.target.value || 1)) })
              }
              className={`w-16 px-2 py-1 rounded-xl border ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            />
          </label>

          <div className="mr-auto flex items-center gap-1.5">
            <button
              onClick={() => setSelectedWeek((w) => Math.max(0, w - 1))}
              disabled={selectedWeek === 0}
              className={`px-2.5 py-1 rounded-xl border disabled:opacity-40 ${
                isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
              }`}
            >
              السابق
            </button>
            <span className="px-2 font-extrabold text-[#1d6b4f]">
              أسبوع {selectedWeek + 1} / {P.TW}
            </span>
            <button
              onClick={() => setSelectedWeek((w) => Math.min(P.TW - 1, w + 1))}
              disabled={selectedWeek >= P.TW - 1}
              className={`px-2.5 py-1 rounded-xl border disabled:opacity-40 ${
                isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
              }`}
            >
              التالي
            </button>
            <button
              onClick={() => setSelectedWeek(wi)}
              className="px-2.5 py-1 rounded-xl bg-[#1d6b4f] text-white font-bold"
            >
              اليوم
            </button>
          </div>
        </div>
      </div>

      {/* شبكة الأيام السبعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {Array.from({ length: 7 }, (_, di) => {
          const dayDate = new Date(startDateObj);
          dayDate.setDate(dayDate.getDate() + selectedWeek * 7 + di);
          const dayIso = getIsoDate(dayDate);
          const dayTasks = getResolvedTasksForDate(dayIso, selectedWeek, di);
          const isTodayCard = dayIso === todayIso;
          const isDeferredDay = !!qp.deferredDates?.[dayIso];
          const carriedItems = qp.carryOverTasks?.[dayIso] || [];

          return (
            <div
              key={di}
              className={`rounded-3xl border p-4 flex flex-col justify-between transition ${
                isTodayCard
                  ? 'border-2 border-[#1d6b4f] shadow-sm'
                  : isDark
                  ? 'bg-[#181e1b] border-[#2a332e]'
                  : 'bg-white border-[#e6e2d8]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1d6b4f]/15">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm">{QURAN_DAYS[di]}</span>
                      {isTodayCard && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1d6b4f] text-white font-bold">
                          اليوم
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] opacity-60">{dayIso}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#eaf4ef] text-[#1d6b4f] font-bold">
                    {dayTasks.some((t) => t.type === 'new') ? 'حفظ + مراجعة' : 'مراجعة فقط'}
                  </span>
                </div>

                {carriedItems.length > 0 && (
                  <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-amber-700 block">
                      ↪ ورد مرحّل من وضع الطوارئ:
                    </span>
                    {carriedItems.map((ct) => {
                      const checked = !!doneMap[ct.taskKey];
                      return (
                        <div
                          key={ct.taskKey}
                          onClick={() => {
                            const [wStr, dStr, tStr] = ct.taskKey.split('-');
                            toggleWeekTask(Number(wStr), Number(dStr), Number(tStr));
                          }}
                          className={`flex items-start gap-2 text-xs cursor-pointer ${
                            checked ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="mt-0.5 accent-amber-600"
                          />
                          <span className="leading-snug">{ct.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isDeferredDay ? (
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 text-xs leading-relaxed">
                    🚨 تم تفعيل وضع الطوارئ لهذا اليوم ونقل الورد إلى الغد.
                  </div>
                ) : dayTasks.length === 0 ? (
                  <div className="p-2.5 rounded-2xl bg-[#1d6b4f]/5 text-xs opacity-60 text-center">
                    لا توجد مهام مجدولة في هذا التاريخ.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map((t) => {
                      const [wStr, dStr, iStr] = t.taskKey.split('-').map(Number);
                      const checked = !!doneMap[t.taskKey];
                      const rangeKey = `${t.range[0]}-${t.range[1]}`;
                      const isWeak = !!qp.weak[rangeKey];
                      const isEditingThis = editingTaskKey === t.taskKey;
                      const colorClass =
                        t.type === 'new'
                          ? 'text-emerald-600'
                          : t.type === 'near'
                          ? 'text-sky-600'
                          : t.type === 'far'
                          ? 'text-amber-600'
                          : 'text-purple-600';

                      if (isEditingThis) {
                        return (
                          <div
                            key={t.taskKey}
                            className={`p-2.5 rounded-2xl border space-y-2 ${
                              isDark ? 'bg-[#121614] border-[#4fbf93]' : 'bg-[#f8f6f1] border-[#1d6b4f]'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-[#1d6b4f]">
                              ✏️ تعديل عنوان المهمة وتاريخها:
                            </div>
                            <input
                              type="text"
                              value={editTitleVal}
                              onChange={(e) => setEditTitleVal(e.target.value)}
                              className={`w-full text-xs px-2 py-1.5 rounded-xl border outline-none ${
                                isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                              }`}
                            />
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="opacity-70">التاريخ:</span>
                              <input
                                type="date"
                                value={editDateVal}
                                onChange={(e) => setEditDateVal(e.target.value)}
                                className={`flex-1 px-2 py-1 rounded-xl border outline-none ${
                                  isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                                }`}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setEditingTaskKey(null)}
                                className="px-2 py-1 rounded-lg text-[11px] border border-slate-400/30 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                <span>إلغاء</span>
                              </button>
                              <button
                                onClick={() => saveTaskOverride(t.taskKey, dayIso)}
                                className="px-2.5 py-1 rounded-lg text-[11px] bg-[#1d6b4f] text-white font-bold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>حفظ</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={t.taskKey}
                          className={`flex items-start gap-2 text-xs p-1.5 rounded-xl transition hover:bg-[#1d6b4f]/5 ${
                            checked ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWeekTask(wStr, dStr, iStr)}
                            className="mt-0.5 accent-[#1d6b4f]"
                          />
                          <div
                            onClick={() => toggleWeekTask(wStr, dStr, iStr)}
                            className="flex-1 cursor-pointer leading-snug"
                          >
                            {t.customTitle ? (
                              <>
                                <span className={`font-bold block ${colorClass}`}>{t.customTitle}</span>
                                <span className="text-[10px] opacity-60 block">
                                  {formatRange(t.range[0], t.range[1])}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className={`font-bold block ${colorClass}`}>{t.label}</span>
                                <span className="text-[11px] opacity-75">
                                  {formatRange(t.range[0], t.range[1])}
                                </span>
                              </>
                            )}
                            {t.isMovedHere && (
                              <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 font-medium">
                                ↪ منقولة من {t.origDateIso}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => startEditingTask(t)}
                              title="تعديل عنوان المهمة أو نقل تاريخها"
                              className="text-xs px-1.5 py-0.5 rounded opacity-50 hover:opacity-100 hover:bg-[#1d6b4f]/10 text-[#1d6b4f] transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                toggleWeak(rangeKey, `${formatRange(t.range[0], t.range[1])} (${t.label})`)
                              }
                              title="تحديد كموضع يحتاج تقوية"
                              className={`text-xs px-1 py-0.5 rounded transition ${
                                isWeak
                                  ? 'opacity-100 text-rose-500 bg-rose-500/10 font-bold'
                                  : 'opacity-35 hover:opacity-80'
                              }`}
                            >
                              ⚠
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* خريطة صفحات المصحف الـ 604 + قائمة المواضع التي تحتاج تقوية */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          className={`lg:col-span-2 rounded-3xl border p-5 ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-extrabold text-sm">🗺️ خريطة صفحات المصحف (٦٠٤ صفحة)</h3>
            <div className="flex items-center gap-2 text-[10px] opacity-75">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1d6b4f]/30 border border-[#1d6b4f] inline-block" /> محفوظة
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1d6b4f]/65 border border-[#1d6b4f] inline-block" /> مراجعة ١–٢
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#1d6b4f] border border-[#1d6b4f] inline-block" /> متقنة ٣+
              </span>
            </div>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pl-1">
            {Array.from({ length: 30 }, (_, jIdx) => {
              const j = jIdx + 1;
              const a = j === 1 ? 1 : 20 * (j - 1) + 2;
              const b = j === 30 ? 604 : 20 * j + 1;
              return (
                <div key={j} className="flex items-center gap-2">
                  <span className="w-5 text-[10px] opacity-60 text-center font-bold">{j}</span>
                  <div className="flex flex-wrap gap-0.5 flex-1">
                    {Array.from({ length: b - a + 1 }, (_, offset) => {
                      const p = a + offset;
                      const m = pageMapData.mem[p];
                      const r = pageMapData.rv[p];
                      return (
                        <span
                          key={p}
                          onClick={() =>
                            setSelectedPageInfo(
                              `ص ${p} (جزء ${j}): ${m ? `محفوظة · مرات المراجعة: ${r}` : 'لم تُحفظ بعد'}`
                            )
                          }
                          title={`ص ${p} - جزء ${j}`}
                          className={`w-3 h-3 rounded-[2px] cursor-pointer border transition-transform hover:scale-125 ${
                            !m
                              ? isDark
                                ? 'bg-[#232b27] border-[#2a332e]'
                                : 'bg-[#eeeae0] border-[#e0dbd0]'
                              : r >= 3
                              ? 'bg-[#1d6b4f] border-[#1d6b4f]'
                              : r >= 1
                              ? 'bg-[#1d6b4f]/65 border-[#1d6b4f]'
                              : 'bg-[#1d6b4f]/30 border-[#1d6b4f]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#1d6b4f] font-bold mt-3 pt-2 border-t border-[#1d6b4f]/10">
            {selectedPageInfo}
          </p>
        </div>

        <div
          className={`rounded-3xl border p-5 ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <h3 className="font-extrabold text-sm mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>قائمة المواضع التي تحتاج تقوية</span>
          </h3>
          {Object.keys(qp.weak).length === 0 ? (
            <p className="text-xs opacity-60 leading-relaxed">
              لا توجد مواضع مُعلَّمة حالياً. اضغطي على علامة <span className="font-bold">⚠</span> بجانب أي ورد لإضافته هنا.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(qp.weak).map(([k, label]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-2xl bg-rose-500/10 text-rose-700"
                >
                  <span className="leading-snug">{label}</span>
                  <button
                    onClick={() => toggleWeak(k, label)}
                    className="px-2.5 py-1 rounded-xl bg-white text-emerald-700 font-bold text-[11px] shrink-0 shadow-xs"
                  >
                    ✓ أتقنتها
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. الصفحة التفصيلية الثانية: دبلوم كاوست للمعلوماتية الحيوية (كاملة)
// ============================================================================
function KaustFullView({ state, setState, isDark, todayIso, onBack, showToast }) {
  const planState = state.kaustPlan;
  const [viewTab, setViewTab] = useState('courses');
  const [openCourses, setOpenCourses] = useState({ c1: true, c2: false, c3: false });
  const [openModules, setOpenModules] = useState({ c1_m1: true });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', duration: 10, scheduledDate: '' });
  const [addingToModuleId, setAddingToModuleId] = useState(null);
  const [newItemDraft, setNewItemDraft] = useState({
    title: '',
    type: 'video',
    duration: 10,
    scheduledDate: planState.startDate
  });

  const updateKaust = (updater) => {
    setState((prev) => ({
      ...prev,
      kaustPlan: typeof updater === 'function' ? updater(prev.kaustPlan) : { ...prev.kaustPlan, ...updater }
    }));
  };

  const stats = useMemo(() => {
    let totalItems = 0;
    let doneItems = 0;
    let totalMins = 0;
    let doneMins = 0;

    planState.courses.forEach((c) => {
      c.modules.forEach((m) => {
        m.items.forEach((it) => {
          totalItems++;
          totalMins += it.duration || 0;
          if (it.done) {
            doneItems++;
            doneMins += it.duration || 0;
          }
        });
      });
    });

    const pct = totalMins > 0 ? Math.round((doneMins / totalMins) * 100) : 0;
    const remMins = Math.max(0, totalMins - doneMins);
    const activeDays = getDatesBetween(planState.startDate, planState.targetCloseDate).length;
    const dailyAvgMins = activeDays > 0 ? Math.round(remMins / activeDays) : remMins;

    return { totalItems, doneItems, totalMins, doneMins, remMins, pct, activeDays, dailyAvgMins };
  }, [planState]);

  const toggleItemDone = (courseId, moduleId, itemId) => {
    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id !== courseId
          ? c
          : {
              ...c,
              modules: c.modules.map((m) =>
                m.id !== moduleId
                  ? m
                  : {
                      ...m,
                      items: m.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it))
                    }
              )
            }
      )
    }));
  };

  const postponeItem = (courseId, moduleId, itemId, days = 1) => {
    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id !== courseId
          ? c
          : {
              ...c,
              modules: c.modules.map((m) =>
                m.id !== moduleId
                  ? m
                  : {
                      ...m,
                      items: m.items.map((it) =>
                        it.id === itemId
                          ? { ...it, scheduledDate: addDaysIso(it.scheduledDate || prev.startDate, days) }
                          : it
                      )
                    }
              )
            }
      )
    }));
    showToast('تم تأجيل المحاضرة +١ يوم في جدولكِ الزمني 📅');
  };

  const deleteItem = (courseId, moduleId, itemId) => {
    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id !== courseId
          ? c
          : {
              ...c,
              modules: c.modules.map((m) =>
                m.id !== moduleId ? m : { ...m, items: m.items.filter((it) => it.id !== itemId) }
              )
            }
      )
    }));
    showToast('تم حذف العنصر من الخطة 🗑️');
  };

  const saveEditedItem = (courseId, moduleId, itemId) => {
    if (!editDraft.title.trim()) return;
    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id !== courseId
          ? c
          : {
              ...c,
              modules: c.modules.map((m) =>
                m.id !== moduleId
                  ? m
                  : {
                      ...m,
                      items: m.items.map((it) =>
                        it.id === itemId
                          ? {
                              ...it,
                              title: editDraft.title.trim(),
                              duration: Math.max(1, Number(editDraft.duration) || 5),
                              scheduledDate: editDraft.scheduledDate || it.scheduledDate
                            }
                          : it
                      )
                    }
              )
            }
      )
    }));
    setEditingItemId(null);
    showToast('تم حفظ التعديلات بنجاح ✅');
  };

  const addNewItemToModule = (courseId, moduleId) => {
    if (!newItemDraft.title.trim()) return;
    const created = {
      id: 'custom_' + Date.now(),
      title: newItemDraft.title.trim(),
      type: newItemDraft.type,
      duration: Math.max(1, Number(newItemDraft.duration) || 10),
      scheduledDate: newItemDraft.scheduledDate || planState.startDate,
      done: false
    };

    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id !== courseId
          ? c
          : {
              ...c,
              modules: c.modules.map((m) =>
                m.id !== moduleId ? m : { ...m, items: [...m.items, created] }
              )
            }
      )
    }));
    setAddingToModuleId(null);
    setNewItemDraft({ title: '', type: 'video', duration: 10, scheduledDate: planState.startDate });
    showToast('تمت إضافة المحاضرة/المهمة الجديدة للوحدة ✨');
  };

  const handleAutoRedistribute = () => {
    updateKaust((prev) => ({
      ...prev,
      courses: distributeKaustBalanced(prev.courses, prev.startDate, prev.targetCloseDate, true)
    }));
    showToast(`تم إعادة توزيع جميع المحاضرات المتبقية بذكاء حتى ${formatShortArabicDate(planState.targetCloseDate)} 🎯`);
  };

  const postponeSpecificDate = (dateIso) => {
    updateKaust((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => ({
        ...c,
        modules: c.modules.map((m) => ({
          ...m,
          items: m.items.map((it) =>
            !it.done && it.scheduledDate === dateIso
              ? { ...it, scheduledDate: addDaysIso(dateIso, 1) }
              : it
          )
        }))
      }))
    }));
    showToast(`تم ترحيل مهام يوم ${formatShortArabicDate(dateIso)} المتبقية إلى اليوم التالي ⏩`);
  };

  const allScheduleDates = useMemo(
    () => getDatesBetween(planState.startDate, planState.officialDeadline),
    [planState.startDate, planState.officialDeadline]
  );

  const itemsByDate = useMemo(() => {
    const map = {};
    allScheduleDates.forEach((d) => (map[d] = []));
    planState.courses.forEach((c) => {
      c.modules.forEach((m) => {
        m.items.forEach((it) => {
          const d = it.scheduledDate || planState.startDate;
          if (!map[d]) map[d] = [];
          map[d].push({
            ...it,
            courseId: c.id,
            courseTitle: c.title,
            moduleId: m.id,
            moduleTitle: m.title
          });
        });
      });
    });
    return map;
  }, [planState, allScheduleDates]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* الترويسة ولوحة التواريخ */}
      <div
        className={`rounded-3xl border p-5 space-y-4 shadow-xs ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border mt-0.5 ${
                isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
              }`}
              title="العودة لخطة يومي"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf4ef] text-[#1d6b4f]">
                  أكاديمية كاوست KAUST Academy
                </span>
                <span className="text-xs opacity-60">٣ دورات تدريبية • ١٢ وحدة تعليمية</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold mt-1">
                🧬 خطة مذاكرة دبلوم المعلوماتية الحيوية
              </h1>
            </div>
          </div>
        </div>

        {/* التواريخ الثلاثة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          >
            <label className="text-[11px] font-bold opacity-70 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#1d6b4f]" />
              <span>تاريخ البداية</span>
            </label>
            <input
              type="date"
              value={planState.startDate}
              onChange={(e) => updateKaust({ startDate: e.target.value })}
              className="w-full text-xs font-bold bg-transparent outline-none"
            />
          </div>

          <div
            className={`p-3 rounded-2xl border-2 border-[#1d6b4f] ${
              isDark ? 'bg-[#1d6b4f]/10' : 'bg-[#eaf4ef]'
            }`}
          >
            <label className="text-[11px] font-extrabold text-[#1d6b4f] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تاريخ الإغلاق المستهدف (هدفكِ الشخصي)</span>
            </label>
            <input
              type="date"
              value={planState.targetCloseDate}
              onChange={(e) => updateKaust({ targetCloseDate: e.target.value })}
              className="w-full text-xs font-extrabold bg-transparent outline-none text-[#1d6b4f]"
            />
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          >
            <label className="text-[11px] font-bold opacity-70 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>الموعد النهائي الرسمي (أيام أمان ومراجعة)</span>
            </label>
            <input
              type="date"
              value={planState.officialDeadline}
              onChange={(e) => updateKaust({ officialDeadline: e.target.value })}
              className="w-full text-xs font-bold bg-transparent outline-none"
            />
          </div>
        </div>

        {/* شريط معدل الإنجاز */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-[#1d6b4f]">
                الإنجاز الكلي للدبلوم: {stats.pct}%
              </span>
              <span className="opacity-70">
                ({stats.doneItems} من {stats.totalItems} عنصر • {stats.doneMins} من {stats.totalMins} دقيقة)
              </span>
            </div>
            <div className="font-bold text-amber-700">
              المعدل اليومي المقترح: ~{stats.dailyAvgMins} دقيقة/يوم ({stats.activeDays} يوم)
            </div>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
            <div
              className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        {/* أزرار التبديل */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1d6b4f]/15">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('courses')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition ${
                viewTab === 'courses'
                  ? 'bg-[#1d6b4f] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#232b27] text-slate-300'
                  : 'bg-[#f8f6f1] text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>عرض الدورات والوحدات</span>
            </button>

            <button
              onClick={() => setViewTab('schedule')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition ${
                viewTab === 'schedule'
                  ? 'bg-[#1d6b4f] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#232b27] text-slate-300'
                  : 'bg-[#f8f6f1] text-slate-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>الخطة الزمنية اليومية</span>
            </button>
          </div>

          <button
            onClick={handleAutoRedistribute}
            className="px-3.5 py-2 rounded-2xl bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>إعادة توزيع المتبقي تلقائياً حتى الإغلاق</span>
          </button>
        </div>
      </div>

      {/* التبويب الأول: الدورات والوحدات */}
      {viewTab === 'courses' && (
        <div className="space-y-4">
          {planState.courses.map((course) => {
            const isCourseOpen = !!openCourses[course.id];
            let cTotalMins = 0;
            let cDoneMins = 0;
            let cTotalItems = 0;
            let cDoneItems = 0;

            course.modules.forEach((m) =>
              m.items.forEach((it) => {
                cTotalMins += it.duration || 0;
                cTotalItems++;
                if (it.done) {
                  cDoneMins += it.duration || 0;
                  cDoneItems++;
                }
              })
            );
            const cPct = cTotalMins > 0 ? Math.round((cDoneMins / cTotalMins) * 100) : 0;

            return (
              <div
                key={course.id}
                className={`rounded-3xl border overflow-hidden transition ${
                  isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                }`}
              >
                <div
                  onClick={() => setOpenCourses((p) => ({ ...p, [course.id]: !p[course.id] }))}
                  className={`p-4 md:p-5 cursor-pointer flex flex-wrap items-center justify-between gap-4 transition ${
                    isDark ? 'hover:bg-[#1f2622]' : 'hover:bg-[#faf8f3]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-[#eaf4ef] text-[#1d6b4f] flex items-center justify-center shrink-0">
                      {isCourseOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-extrabold text-base md:text-lg">{course.title}</h2>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#eaf4ef] text-[#1d6b4f] font-bold">
                          {course.badge}
                        </span>
                      </div>
                      <p className="text-xs opacity-65 mt-0.5">
                        {course.provider} • {cDoneItems}/{cTotalItems} عنصر ({cDoneMins}/{cTotalMins} دقيقة)
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-48 shrink-0">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="opacity-70">إنجاز الدورة</span>
                      <span className="text-[#1d6b4f]">{cPct}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                      <div
                        className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                        style={{ width: `${cPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isCourseOpen && (
                  <div
                    className={`p-4 md:p-5 pt-2 space-y-3 border-t ${
                      isDark ? 'border-[#2a332e] bg-[#141916]' : 'border-[#ece8de] bg-[#fbfaf7]'
                    }`}
                  >
                    {course.modules.map((mod) => {
                      const isModOpen = !!openModules[mod.id];
                      const mTotalMins = mod.items.reduce((a, b) => a + (b.duration || 0), 0);
                      const mDoneMins = mod.items
                        .filter((i) => i.done)
                        .reduce((a, b) => a + (b.duration || 0), 0);
                      const mDoneCount = mod.items.filter((i) => i.done).length;
                      const mPct = mTotalMins > 0 ? Math.round((mDoneMins / mTotalMins) * 100) : 0;

                      return (
                        <div
                          key={mod.id}
                          className={`rounded-2xl border overflow-hidden ${
                            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                          }`}
                        >
                          <div
                            onClick={() => setOpenModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                            className="p-3.5 cursor-pointer flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <div className="mt-0.5 text-[#1d6b4f]">
                                {isModOpen ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronLeft className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-sm">{mod.title}</h3>
                                  <span className="text-[11px] opacity-60">
                                    ({mDoneCount}/{mod.items.length} مهام • {mTotalMins} دقيقة)
                                  </span>
                                </div>
                                <p className="text-xs opacity-65 mt-0.5 line-clamp-2">{mod.description}</p>
                              </div>
                            </div>

                            <div className="w-full sm:w-44 shrink-0">
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span className="opacity-70">معدل إنجاز الوحدة</span>
                                <span className="text-[#1d6b4f]">{mPct}%</span>
                              </div>
                              <div
                                className={`h-2 rounded-full overflow-hidden ${
                                  isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'
                                }`}
                              >
                                <div
                                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                                  style={{ width: `${mPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {isModOpen && (
                            <div
                              className={`p-3.5 pt-2 border-t space-y-2 ${
                                isDark ? 'border-[#2a332e]' : 'border-[#ece8de]'
                              }`}
                            >
                              {mod.items.map((item) => {
                                const meta = KAUST_TYPE_META[item.type] || KAUST_TYPE_META.video;
                                const IconComp = meta.icon;
                                const isEditing = editingItemId === item.id;

                                return (
                                  <div
                                    key={item.id}
                                    className={`p-2.5 rounded-2xl border text-xs transition ${
                                      item.done
                                        ? darkCard(isDark, true)
                                        : darkCard(isDark, false)
                                    }`}
                                  >
                                    {isEditing ? (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <input
                                          type="text"
                                          value={editDraft.title}
                                          onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                                          className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-xl border bg-transparent"
                                        />
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={1}
                                            value={editDraft.duration}
                                            onChange={(e) =>
                                              setEditDraft((p) => ({ ...p, duration: e.target.value }))
                                            }
                                            className="w-16 px-2 py-1.5 rounded-xl border bg-transparent"
                                          />
                                          <span>دقيقة</span>
                                        </div>
                                        <input
                                          type="date"
                                          value={editDraft.scheduledDate}
                                          onChange={(e) =>
                                            setEditDraft((p) => ({ ...p, scheduledDate: e.target.value }))
                                          }
                                          className="px-2 py-1.5 rounded-xl border bg-transparent"
                                        />
                                        <button
                                          onClick={() => saveEditedItem(course.id, mod.id, item.id)}
                                          className="px-2.5 py-1.5 rounded-xl bg-[#1d6b4f] text-white font-bold flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>حفظ</span>
                                        </button>
                                        <button
                                          onClick={() => setEditingItemId(null)}
                                          className="p-1.5 rounded-xl border"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => toggleItemDone(course.id, mod.id, item.id)}
                                            className="w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                                          />
                                          <span
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 ${meta.color}`}
                                          >
                                            <IconComp className="w-3 h-3" />
                                            <span>{meta.label}</span>
                                          </span>
                                          <span
                                            onClick={() => toggleItemDone(course.id, mod.id, item.id)}
                                            className={`font-bold cursor-pointer leading-snug ${
                                              item.done ? 'line-through' : ''
                                            }`}
                                          >
                                            {item.title}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[11px] opacity-70 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {item.duration} د
                                          </span>

                                          <span className="px-2 py-0.5 rounded-lg bg-[#eaf4ef] text-[#1d6b4f] text-[10px] font-bold">
                                            📅 {formatShortArabicDate(item.scheduledDate)}
                                          </span>

                                          <button
                                            onClick={() => postponeItem(course.id, mod.id, item.id, 1)}
                                            className="px-2 py-1 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[10px] font-bold"
                                          >
                                            تأجيل +١ي
                                          </button>

                                          <button
                                            onClick={() => {
                                              setEditingItemId(item.id);
                                              setEditDraft({
                                                title: item.title,
                                                duration: item.duration,
                                                scheduledDate: item.scheduledDate
                                              });
                                            }}
                                            className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-slate-500/10"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            onClick={() => deleteItem(course.id, mod.id, item.id)}
                                            className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-rose-500/10 text-rose-500"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {addingToModuleId === mod.id ? (
                                <div className="p-2.5 rounded-2xl border border-dashed border-[#1d6b4f] flex flex-wrap items-center gap-2 text-xs">
                                  <input
                                    type="text"
                                    value={newItemDraft.title}
                                    onChange={(e) => setNewItemDraft((p) => ({ ...p, title: e.target.value }))}
                                    placeholder="اسم المحاضرة أو المراجعة..."
                                    className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-xl border bg-transparent"
                                  />
                                  <select
                                    value={newItemDraft.type}
                                    onChange={(e) => setNewItemDraft((p) => ({ ...p, type: e.target.value }))}
                                    className={`px-2 py-1.5 rounded-xl border ${
                                      isDark ? 'bg-[#121614]' : 'bg-white'
                                    }`}
                                  >
                                    <option value="video">فيديو</option>
                                    <option value="reading">قراءة</option>
                                    <option value="lab">مختبر عملي</option>
                                    <option value="quiz">اختبار</option>
                                    <option value="project">مشروع</option>
                                  </select>
                                  <input
                                    type="number"
                                    min={1}
                                    value={newItemDraft.duration}
                                    onChange={(e) => setNewItemDraft((p) => ({ ...p, duration: e.target.value }))}
                                    className="w-16 px-2 py-1.5 rounded-xl border bg-transparent"
                                  />
                                  <span>دقيقة</span>
                                  <input
                                    type="date"
                                    value={newItemDraft.scheduledDate}
                                    onChange={(e) =>
                                      setNewItemDraft((p) => ({ ...p, scheduledDate: e.target.value }))
                                    }
                                    className="px-2 py-1.5 rounded-xl border bg-transparent"
                                  />
                                  <button
                                    onClick={() => addNewItemToModule(course.id, mod.id)}
                                    className="px-3 py-1.5 rounded-xl bg-[#1d6b4f] text-white font-bold"
                                  >
                                    إضافة
                                  </button>
                                  <button
                                    onClick={() => setAddingToModuleId(null)}
                                    className="px-2 py-1.5 rounded-xl border"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAddingToModuleId(mod.id);
                                    setNewItemDraft({
                                      title: '',
                                      type: 'video',
                                      duration: 15,
                                      scheduledDate: planState.startDate
                                    });
                                  }}
                                  className="text-xs text-[#1d6b4f] font-extrabold flex items-center gap-1 pt-1 hover:underline"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>إضافة محاضرة أو مهمة مخصصة لهذه الوحدة</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* التبويب الثاني: الخطة الزمنية اليومية */}
      {viewTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScheduleDates.map((dateIso, idx) => {
            const dayItems = itemsByDate[dateIso] || [];
            const isBufferDay = dateIso > planState.targetCloseDate;
            const isTargetCloseDay = dateIso === planState.targetCloseDate;
            const isTodayCard = dateIso === todayIso;
            const dayTotalMins = dayItems.reduce((a, b) => a + (b.duration || 0), 0);
            const dayDoneMins = dayItems.filter((i) => i.done).reduce((a, b) => a + (b.duration || 0), 0);
            const dayPct = dayTotalMins > 0 ? Math.round((dayDoneMins / dayTotalMins) * 100) : 0;

            return (
              <div
                key={dateIso}
                className={`rounded-3xl border p-4 flex flex-col justify-between transition ${
                  isTodayCard || isTargetCloseDay
                    ? 'border-2 border-[#1d6b4f] shadow-sm'
                    : isBufferDay
                    ? isDark
                      ? 'bg-[#191d1b] border-amber-500/30'
                      : 'bg-[#fdfbf5] border-amber-300/60'
                    : isDark
                    ? 'bg-[#181e1b] border-[#2a332e]'
                    : 'bg-white border-[#e6e2d8]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#1d6b4f]/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm">
                          اليوم {idx + 1} • {formatShortArabicDate(dateIso)}
                        </span>
                        {isTodayCard && (
                          <span className="px-2 py-0.5 rounded-md bg-[#1d6b4f] text-white text-[10px] font-bold">
                            اليوم
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] opacity-60 block">{dateIso}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTargetCloseDay && (
                        <span className="px-2 py-0.5 rounded-md bg-[#1d6b4f] text-white text-[10px] font-bold">
                          🎯 الإغلاق
                        </span>
                      )}
                      {isBufferDay && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 text-[10px] font-bold">
                          🛡️ أمان
                        </span>
                      )}
                      {dayItems.some((i) => !i.done) && (
                        <button
                          onClick={() => postponeSpecificDate(dateIso)}
                          className="p-1.5 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                          title="ترحيل مهام هذا اليوم المتبقية إلى الغد"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="opacity-70">
                      المهام: {dayItems.filter((i) => i.done).length}/{dayItems.length}
                    </span>
                    <span className="font-bold text-[#1d6b4f]">{dayTotalMins} دقيقة</span>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="py-6 text-center text-xs opacity-60">
                      {isBufferDay
                        ? 'يوم احتياطي للمراجعة النهائية أو تعويض أي تأخير ✨'
                        : 'لا توجد محاضرات مجدولة في هذا اليوم'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pl-1">
                      {dayItems.map((it) => {
                        const meta = KAUST_TYPE_META[it.type] || KAUST_TYPE_META.video;
                        return (
                          <div
                            key={it.id}
                            className={`p-2.5 rounded-2xl border text-xs flex items-start justify-between gap-2 ${
                              it.done
                                ? 'opacity-55 line-through'
                                : isDark
                                ? 'bg-[#121614] border-[#2a332e]'
                                : 'bg-[#f8f6f1] border-[#ece8de]'
                            }`}
                          >
                            <label
                              onClick={() => toggleItemDone(it.courseId, it.moduleId, it.id)}
                              className="flex items-start gap-2 cursor-pointer flex-1"
                            >
                              <input
                                type="checkbox"
                                checked={it.done}
                                onChange={() => {}}
                                className="mt-0.5 accent-[#1d6b4f]"
                              />
                              <div>
                                <span className="font-bold block leading-snug">{it.title}</span>
                                <span className="text-[10px] opacity-60">
                                  {meta.label} • {it.duration} د
                                </span>
                              </div>
                            </label>

                            {!it.done && (
                              <button
                                onClick={() => postponeItem(it.courseId, it.moduleId, it.id, 1)}
                                className="text-[10px] px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 shrink-0 font-bold"
                              >
                                +١ي
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {dayItems.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-[#1d6b4f]/10">
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-300/30">
                      <div
                        className="h-full bg-[#1d6b4f] transition-all duration-300"
                        style={{ width: `${dayPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function darkCard(isDark, done) {
  if (done) {
    return isDark
      ? 'bg-[#121614]/60 border-[#2a332e] opacity-65'
      : 'bg-[#f4f7f5] border-[#cce3d8] opacity-75';
  }
  return isDark
    ? 'bg-[#121614] border-[#2a332e]'
    : 'bg-[#f8f6f1] border-[#ece8de]';
}

// ============================================================================
// 11. الصفحة التفصيلية الثالثة: اختبار الهيئة السعودية SMLE (كاملة)
// ============================================================================
function SmleFullView({ state, setState, isDark, todayIso, tomorrowIso, onBack, showToast }) {
  const spState = state.smlePlan;

  const updateSmle = (updater) => {
    setState((prev) => ({
      ...prev,
      smlePlan: typeof updater === 'function' ? updater(prev.smlePlan) : { ...prev.smlePlan, ...updater }
    }));
  };

  const [mainTab, setMainTab] = useState('study');
  const [activeSpecialty, setActiveSpecialty] = useState('medicine');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSubSpec, setSelectedSubSpec] = useState('ALL');
  const [newRecall, setNewRecall] = useState({ title: '', pages: '' });
  const [unifiedFilter, setUnifiedFilter] = useState('ALL');
  const [unifiedSearch, setUnifiedSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({
    year: '2025',
    courseTitle: 'كورس أم القرى 2025',
    specialty: 'General',
    title: '',
    duration: '30:00',
    url: ''
  });
  const [newStudyFile, setNewStudyFile] = useState({
    year: '2025',
    specialty: 'General',
    title: '',
    pages: ''
  });
  const [editingVideo, setEditingVideo] = useState(null);

  const effectiveRecallDailyItems = useMemo(() => {
    return spState.recallDailyItems
      .map((item) => ({
        ...item,
        date: spState.customRecallDates[item.id] || item.date
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [spState.recallDailyItems, spState.customRecallDates]);

  const metrics = useMemo(() => {
    const allVideos = Object.values(spState.videosBySpec).flat();
    const totalVideoSeconds = allVideos.reduce((sum, v) => sum + (v.seconds || 0), 0);
    const doneVideoSeconds = allVideos.filter((v) => v.done).reduce((sum, v) => sum + (v.seconds || 0), 0);
    const remainingVideoSeconds = Math.max(0, totalVideoSeconds - doneVideoSeconds);

    const totalRecallPages = spState.recallFiles.reduce((a, f) => a + Number(f.pages || 0), 0);
    const doneRecallPages = effectiveRecallDailyItems
      .filter((item) => item.done)
      .reduce((a, item) => a + Number(item.pageCount || 0), 0);
    const remainingRecallPages = Math.max(0, totalRecallPages - doneRecallPages);

    const totalRecallSeconds = totalRecallPages * SECONDS_PER_RECALL_PAGE;
    const remainingRecallSeconds = remainingRecallPages * SECONDS_PER_RECALL_PAGE;

    const totalHoursNum = ((totalVideoSeconds + totalRecallSeconds) / 3600).toFixed(1);
    const remainingHoursNum = ((remainingVideoSeconds + remainingRecallSeconds) / 3600).toFixed(1);

    const effectivePlanEnd =
      spState.planEndDate && spState.planEndDate >= spState.planStartDate
        ? spState.planEndDate
        : spState.planStartDate;
    const planDays = countDaysInclusive(spState.planStartDate, effectivePlanEnd);

    const neededDays =
      spState.dailyHours > 0
        ? Math.max(
            1,
            Math.ceil((remainingVideoSeconds + remainingRecallSeconds) / 3600 / spState.dailyHours)
          )
        : 0;

    const expectedEnd = new Date(spState.planStartDate);
    expectedEnd.setDate(expectedEnd.getDate() + Math.max(0, neededDays - 1));
    const expectedEndStr = expectedEnd.toISOString().split('T')[0];

    const recallDays = countDaysInclusive(spState.recallStartDate, spState.recallEndDate);
    const recallPagesPerDay = recallDays > 0 ? Math.ceil(totalRecallPages / recallDays) : 0;
    const recallMinsPerDay = recallPagesPerDay * MINS_PER_RECALL_PAGE;
    const recallPct = totalRecallPages > 0 ? Math.round((doneRecallPages / totalRecallPages) * 100) : 0;

    return {
      totalHoursNum,
      remainingHoursNum,
      planDays,
      neededDays,
      expectedEndStr,
      recallPagesPerDay,
      recallMinsPerDay,
      totalRecallPages,
      doneRecallPages,
      totalRecallSeconds,
      recallPct
    };
  }, [spState, effectiveRecallDailyItems]);

  const currentList = spState.videosBySpec[activeSpecialty] || [];
  const currentStats = useMemo(() => {
    const totSec = currentList.reduce((a, b) => a + (b.seconds || 0), 0);
    const donSec = currentList.filter((b) => b.done).reduce((a, b) => a + (b.seconds || 0), 0);
    const remSec = Math.max(0, totSec - donSec);
    const pct = totSec > 0 ? Math.round((donSec / totSec) * 100) : 0;
    const doneCount = currentList.filter((b) => b.done).length;
    return { totSec, donSec, remSec, pct, doneCount, totalCount: currentList.length };
  }, [currentList]);

  const availableYears = useMemo(() => Array.from(new Set(currentList.map((v) => v.year))), [currentList]);
  const availableSubSpecs = useMemo(
    () => Array.from(new Set(currentList.map((v) => v.specialty).filter((s) => s && s !== 'General'))),
    [currentList]
  );

  const groupedByCourse = useMemo(() => {
    const filtered = currentList.filter((v) => {
      const matchSearch =
        !searchQuery.trim() ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.specialty && v.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchYear = selectedYear === 'ALL' || v.year === selectedYear;
      const matchSub = selectedSubSpec === 'ALL' || v.specialty === selectedSubSpec;
      return matchSearch && matchYear && matchSub;
    });

    const groups = {};
    filtered.forEach((item) => {
      const key = item.courseTitle || `كورس سنة ${item.year}`;
      if (!groups[key]) {
        groups[key] = { courseTitle: key, year: item.year, items: [] };
      }
      groups[key].items.push(item);
    });
    return Object.values(groups);
  }, [currentList, searchQuery, selectedYear, selectedSubSpec]);

  const handleMainPlanRangeChange = (nextStart, nextEnd) => {
    const safeStart = nextStart || spState.planStartDate;
    const safeEnd = nextEnd && nextEnd >= safeStart ? nextEnd : safeStart;
    updateSmle({ planStartDate: safeStart, planEndDate: safeEnd });
  };

  const handleStudyRangeChange = (nextStart, nextEnd) => {
    const safeStart = nextStart || spState.studyStartDate;
    const safeEnd = nextEnd && nextEnd >= safeStart ? nextEnd : safeStart;
    const freshVideoSchedule = computeBalancedVideoSchedule(spState.videosBySpec, safeStart, safeEnd);
    updateSmle({
      studyStartDate: safeStart,
      studyEndDate: safeEnd,
      customStudyDates: freshVideoSchedule
    });
  };

  const handleRecallRangeChange = (nextStart, nextEnd) => {
    const safeStart = nextStart || spState.recallStartDate;
    const safeEnd = nextEnd && nextEnd >= safeStart ? nextEnd : safeStart;
    updateSmle((prev) => ({
      ...prev,
      recallStartDate: safeStart,
      recallEndDate: safeEnd,
      customRecallDates: {},
      recallDailyItems: generateRecallDailyPlan(prev.recallFiles, safeStart, safeEnd, prev.recallDailyItems)
    }));
  };

  const handleDistributePlanToEnd = () => {
    const safeStudyStart = spState.studyStartDate || spState.planStartDate;
    const safeStudyEnd =
      spState.studyEndDate && spState.studyEndDate >= safeStudyStart
        ? spState.studyEndDate
        : spState.planEndDate;

    const safeRecallStart = spState.recallStartDate || spState.planStartDate;
    const safeRecallEnd =
      spState.recallEndDate && spState.recallEndDate >= safeRecallStart
        ? spState.recallEndDate
        : spState.planEndDate;

    const freshStudyDates = computeBalancedVideoSchedule(
      spState.videosBySpec,
      safeStudyStart,
      safeStudyEnd
    );

    updateSmle((prev) => ({
      ...prev,
      customStudyDates: freshStudyDates,
      customRecallDates: {},
      recallDailyItems: generateRecallDailyPlan(
        prev.recallFiles,
        safeRecallStart,
        safeRecallEnd,
        prev.recallDailyItems
      )
    }));

    showToast('✨ تم توزيع المذاكرة والتجميعات بالتوازن حتى تاريخ النهاية المستهدف!');
  };

  const toggleVideoDoneAnySpec = (specId, videoId) => {
    updateSmle((prev) => ({
      ...prev,
      videosBySpec: {
        ...prev.videosBySpec,
        [specId]: prev.videosBySpec[specId].map((v) =>
          v.id === videoId ? { ...v, done: !v.done } : v
        )
      }
    }));
  };

  const handleSaveEditVideo = (e) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.title.trim()) return;
    const updatedSeconds = parseDurationToSeconds(editingVideo.duration);
    updateSmle((prev) => ({
      ...prev,
      videosBySpec: {
        ...prev.videosBySpec,
        [activeSpecialty]: prev.videosBySpec[activeSpecialty].map((v) =>
          v.id === editingVideo.id
            ? {
                ...v,
                title: editingVideo.title.trim(),
                year: editingVideo.year.trim() || v.year,
                specialty: editingVideo.specialty.trim() || 'General',
                duration: editingVideo.duration.trim() || '00:00',
                seconds: updatedSeconds,
                url: editingVideo.url.trim(),
                broken: Boolean(editingVideo.broken)
              }
            : v
        )
      }
    }));
    setEditingVideo(null);
    showToast('✅ تم حفظ تعديلات المحاضرة بنجاح.');
  };

  const handleDeleteFromEditModal = (id) => {
    updateSmle((prev) => ({
      ...prev,
      videosBySpec: {
        ...prev.videosBySpec,
        [activeSpecialty]: prev.videosBySpec[activeSpecialty].filter((v) => v.id !== id)
      }
    }));
    setEditingVideo(null);
    showToast('🗑️ تم حذف المقطع من القائمة.');
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideo.title.trim()) return;
    const sec = parseDurationToSeconds(newVideo.duration);
    const created = {
      id: `${activeSpecialty}-${Date.now()}`,
      year: newVideo.year || '2025',
      courseTitle: newVideo.courseTitle || `كورس سنة ${newVideo.year || '2025'}`,
      specialty: newVideo.specialty || 'General',
      title: newVideo.title.trim(),
      duration: newVideo.duration || '00:00',
      seconds: sec,
      url: newVideo.url.trim(),
      broken: false,
      done: false
    };
    const updatedMap = {
      ...spState.videosBySpec,
      [activeSpecialty]: [...spState.videosBySpec[activeSpecialty], created]
    };
    updateSmle({
      videosBySpec: updatedMap,
      customStudyDates: computeBalancedVideoSchedule(
        updatedMap,
        spState.studyStartDate,
        spState.studyEndDate
      )
    });
    setNewVideo((prev) => ({ ...prev, title: '', url: '' }));
    setShowAddForm(false);
    showToast('✅ تمت إضافة المحاضرة الجديدة وتوزيعها ضمن فترة المذاكرة.');
  };

  const handleAddStudyFile = (e) => {
    e.preventDefault();
    if (!newStudyFile.title.trim() || !newStudyFile.pages || Number(newStudyFile.pages) <= 0) return;
    const pagesNum = Number(newStudyFile.pages);
    const estimatedSeconds = pagesNum * SECONDS_PER_RECALL_PAGE;
    const hours = Math.floor(estimatedSeconds / 3600);
    const mins = Math.floor((estimatedSeconds % 3600) / 60);
    const formattedDuration =
      hours > 0
        ? `${hours}:${String(mins).padStart(2, '0')}:00`
        : `${String(mins).padStart(2, '0')}:00`;

    const createdFileItem = {
      id: `${activeSpecialty}-file-${Date.now()}`,
      year: newStudyFile.year.trim() || '2025',
      courseTitle: `ملفات ${SPECIALTIES.find((s) => s.id === activeSpecialty)?.short || ''} ${
        newStudyFile.year.trim() || '2025'
      }`,
      specialty: newStudyFile.specialty.trim() || 'General',
      title: `📄 ${newStudyFile.title.trim()} (${pagesNum} صفحة)`,
      duration: formattedDuration,
      seconds: estimatedSeconds,
      url: '',
      broken: false,
      done: false,
      isFile: true,
      pages: pagesNum
    };

    const updatedMap = {
      ...spState.videosBySpec,
      [activeSpecialty]: [...spState.videosBySpec[activeSpecialty], createdFileItem]
    };
    updateSmle({
      videosBySpec: updatedMap,
      customStudyDates: computeBalancedVideoSchedule(
        updatedMap,
        spState.studyStartDate,
        spState.studyEndDate
      )
    });
    setNewStudyFile((prev) => ({ ...prev, title: '', pages: '' }));
    setShowAddForm(false);
    showToast('✅ تمت إضافة الملف الدراسي وتوزيعه ضمن فترة المذاكرة.');
  };

  const handleAddRecallFile = (e) => {
    e.preventDefault();
    if (!newRecall.title.trim() || !newRecall.pages || Number(newRecall.pages) <= 0) return;
    const pagesCount = Number(newRecall.pages);
    const updatedFiles = [
      ...spState.recallFiles,
      { id: `rec-${Date.now()}`, title: newRecall.title.trim(), pages: pagesCount }
    ];
    updateSmle((prev) => ({
      ...prev,
      recallFiles: updatedFiles,
      customRecallDates: {},
      recallDailyItems: generateRecallDailyPlan(
        updatedFiles,
        prev.recallStartDate,
        prev.recallEndDate,
        prev.recallDailyItems
      )
    }));
    setNewRecall({ title: '', pages: '' });
    showToast(`✅ تمت إضافة الملف (${pagesCount} صفحة) وتوزيعه على الخطة.`);
  };

  const handleRemoveRecallFile = (fileId) => {
    const updatedFiles = spState.recallFiles.filter((f) => f.id !== fileId);
    updateSmle((prev) => ({
      ...prev,
      recallFiles: updatedFiles,
      customRecallDates: {},
      recallDailyItems: generateRecallDailyPlan(
        updatedFiles,
        prev.recallStartDate,
        prev.recallEndDate,
        prev.recallDailyItems
      )
    }));
  };

  const toggleRecallDayItem = (itemId) => {
    updateSmle((prev) => ({
      ...prev,
      recallDailyItems: prev.recallDailyItems.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      )
    }));
  };

  const postponeVideoByOneDay = (videoId, currentIsoDate) => {
    const nextDate = addDaysIso(currentIsoDate, 1);
    updateSmle((prev) => ({
      ...prev,
      customStudyDates: { ...prev.customStudyDates, [videoId]: nextDate }
    }));
    showToast(`⏭️ تم ترحيل المحاضرة إلى ${formatArabicDate(nextDate)}.`);
  };

  const postponeRecallByOneDay = (itemId, currentIsoDate) => {
    const nextDate = addDaysIso(currentIsoDate, 1);
    updateSmle((prev) => ({
      ...prev,
      customRecallDates: { ...prev.customRecallDates, [itemId]: nextDate }
    }));
    showToast(`⏭️ تم ترحيل ورد التجميعات إلى ${formatArabicDate(nextDate)}.`);
  };

  const unifiedScheduleDays = useMemo(() => {
    const daysMap = {};
    const ensureDay = (dateIso) => {
      if (!daysMap[dateIso]) {
        daysMap[dateIso] = {
          date: dateIso,
          videos: [],
          recalls: [],
          totalVideoSeconds: 0,
          totalRecallSeconds: 0
        };
      }
      return daysMap[dateIso];
    };

    const baselineVideoDates = computeBalancedVideoSchedule(
      spState.videosBySpec,
      spState.studyStartDate,
      spState.studyEndDate
    );

    Object.entries(spState.videosBySpec).forEach(([specId, list]) => {
      const specMeta = SPECIALTIES.find((s) => s.id === specId);
      list.forEach((vid) => {
        if (!vid.broken && vid.seconds > 0) {
          const assignedDate =
            spState.customStudyDates[vid.id] || baselineVideoDates[vid.id] || spState.studyStartDate;
          const bucket = ensureDay(assignedDate);
          bucket.videos.push({
            ...vid,
            specId,
            specShort: specMeta?.short || 'مدسن',
            specIcon: specMeta?.icon || '🩺'
          });
          bucket.totalVideoSeconds += vid.seconds;
        }
      });
    });

    effectiveRecallDailyItems.forEach((recItem) => {
      const bucket = ensureDay(recItem.date);
      const sec = Number(recItem.pageCount || 0) * SECONDS_PER_RECALL_PAGE;
      bucket.recalls.push({ ...recItem, estimatedSeconds: sec });
      bucket.totalRecallSeconds += sec;
    });

    return Object.values(daysMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((dayObj) => {
        let filteredVideos = dayObj.videos;
        let filteredRecalls = dayObj.recalls;

        if (unifiedFilter === 'REMAINING') {
          filteredVideos = filteredVideos.filter((v) => !v.done);
          filteredRecalls = filteredRecalls.filter((r) => !r.done);
        }

        if (unifiedSearch.trim()) {
          const q = unifiedSearch.toLowerCase();
          filteredVideos = filteredVideos.filter(
            (v) =>
              v.title.toLowerCase().includes(q) ||
              v.specShort.toLowerCase().includes(q) ||
              dayObj.date.includes(q)
          );
          filteredRecalls = filteredRecalls.filter(
            (r) => r.fileTitle.toLowerCase().includes(q) || dayObj.date.includes(q)
          );
        }

        const activeVideoSeconds = filteredVideos.reduce((acc, v) => acc + v.seconds, 0);
        const activeRecallSeconds = filteredRecalls.reduce(
          (acc, r) => acc + Number(r.pageCount || 0) * SECONDS_PER_RECALL_PAGE,
          0
        );

        return {
          ...dayObj,
          videos: filteredVideos,
          recalls: filteredRecalls,
          activeVideoSeconds,
          activeRecallSeconds,
          activeTotalSeconds: activeVideoSeconds + activeRecallSeconds
        };
      })
      .filter((dayObj) => {
        if (unifiedFilter === 'TODAY' && dayObj.date !== todayIso) return false;
        return dayObj.videos.length > 0 || dayObj.recalls.length > 0;
      });
  }, [spState, effectiveRecallDailyItems, unifiedFilter, unifiedSearch, todayIso]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* 1. الترويسة العلوية بنفس التصميم والألوان */}
      <header
        className={`rounded-3xl border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition ${
              isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f8f6f1]'
            }`}
            title="العودة لخطة يومي"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg md:text-2xl font-extrabold tracking-tight">
                🩺 خطة مذاكرة اختبار الهيئة السعودية (SMLE)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#eaf4ef] text-[#1d6b4f]">
                توزيع ذكي متكامل
              </span>
            </div>
            <p className="text-xs opacity-65 mt-1">
              تنظيم المحاضرات والملفات حسب التخصصات الخمسة + جدولة التجميعات والتسريبات (٥ دقائق/صفحة)
            </p>
          </div>
        </div>

        <button
          onClick={handleDistributePlanToEnd}
          className="px-5 py-3 rounded-2xl bg-[#1d6b4f] hover:bg-[#16543e] text-white text-xs md:text-sm font-extrabold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
        >
          <span>✨ توزيع على الخطة حتى تاريخ النهاية</span>
        </button>
      </header>

      {/* 2. لوحة التواريخ والمؤشرات (صفّان من ٤ بطاقات بنفس الألوان الباستيل) */}
      <section
        className={`rounded-3xl border p-5 space-y-3.5 shadow-xs ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        {/* الصف الأول: 4 بطاقات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. تاريخ البداية العام */}
          <div
            className={`rounded-2xl border p-4 text-center flex flex-col justify-center gap-1.5 ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          >
            <label className="text-xs font-bold opacity-75 flex items-center justify-center gap-1.5">
              <span>🗓️</span>
              <span>تاريخ البداية العام</span>
            </label>
            <input
              type="date"
              value={spState.planStartDate}
              onChange={(e) => handleMainPlanRangeChange(e.target.value, spState.planEndDate)}
              className="w-full text-center text-sm md:text-base font-extrabold bg-transparent outline-none cursor-pointer"
            />
          </div>

          {/* 2. تاريخ النهاية المستهدف (مميز بإطار أخضر زمردي وخلفية نعناعية) */}
          <div
            className={`rounded-2xl border-2 border-[#1d6b4f] p-4 text-center flex flex-col justify-center gap-1.5 ${
              isDark ? 'bg-[#1d6b4f]/15' : 'bg-[#eff7f3]'
            }`}
          >
            <label className="text-xs font-extrabold text-[#1d6b4f] flex items-center justify-center gap-1.5">
              <span>🎯</span>
              <span>تاريخ النهاية المستهدف</span>
            </label>
            <input
              type="date"
              value={spState.planEndDate}
              min={spState.planStartDate}
              onChange={(e) => handleMainPlanRangeChange(spState.planStartDate, e.target.value)}
              className="w-full text-center text-sm md:text-base font-extrabold bg-transparent outline-none text-[#1d6b4f] cursor-pointer"
            />
          </div>

          {/* 3. ساعات المذاكرة اليومية */}
          <div
            className={`rounded-2xl border p-4 text-center flex flex-col justify-center gap-1.5 ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          >
            <label className="text-xs font-bold opacity-75 flex items-center justify-center gap-1.5">
              <span>⏱️</span>
              <span>ساعات المذاكرة اليومية</span>
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => updateSmle({ dailyHours: Math.max(1, spState.dailyHours - 0.5) })}
                className="w-6 h-6 rounded-lg border border-slate-400/30 text-xs font-extrabold hover:bg-[#1d6b4f]/10 cursor-pointer"
              >
                -
              </button>
              <span className="text-base md:text-lg font-extrabold min-w-[2.5rem]">
                {spState.dailyHours}
              </span>
              <button
                type="button"
                onClick={() => updateSmle({ dailyHours: Math.min(14, spState.dailyHours + 0.5) })}
                className="w-6 h-6 rounded-lg border border-slate-400/30 text-xs font-extrabold hover:bg-[#1d6b4f]/10 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* 4. متى أغلقه (المتوقع)؟ */}
          <div
            className={`rounded-2xl border p-4 text-center flex flex-col justify-center gap-1.5 ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          >
            <div className="text-xs font-bold opacity-75 flex items-center justify-center gap-1.5">
              <span>🏁</span>
              <span>متى أغلقه (المتوقع)؟</span>
            </div>
            <div className="text-sm md:text-base font-extrabold text-[#c26d18]">
              {metrics.expectedEndStr} ({metrics.neededDays} يوم)
            </div>
          </div>
        </div>

        {/* الصف الثاني: 4 بطاقات إحصائية بألوان باستيل ناعمة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            className={`rounded-2xl p-3.5 text-center font-extrabold text-xs md:text-sm ${
              isDark ? 'bg-[#1d6b4f]/20 text-[#6ee7b7]' : 'bg-[#eaf4ef] text-[#1d6b4f]'
            }`}
          >
            إجمالي الساعات: {metrics.totalHoursNum} ساعة
          </div>

          <div
            className={`rounded-2xl p-3.5 text-center font-extrabold text-xs md:text-sm ${
              isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-[#fdf2e4] text-[#b86214]'
            }`}
          >
            المتبقي: {metrics.remainingHoursNum} ساعة
          </div>

          <div
            className={`rounded-2xl p-3.5 text-center font-extrabold text-xs md:text-sm ${
              isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-[#e8f4fa] text-[#1b6b93]'
            }`}
          >
            أيام الخطة: {metrics.planDays} يوم
          </div>

          <div
            className={`rounded-2xl p-3.5 text-center font-extrabold text-xs md:text-sm ${
              isDark ? 'bg-purple-500/15 text-purple-300' : 'bg-[#f3ebfa] text-[#6d3b9e]'
            }`}
          >
            ورد التجميعات: {metrics.recallPagesPerDay} ص/يوم (~{metrics.recallMinsPerDay} دقيقة)
          </div>
        </div>
      </section>

      {/* 3. شريط التبويبات الرئيسية الثلاث (حاوية بيضاء ملمومة في المنتصف/اليمين) */}
      <div className="flex justify-center md:justify-start">
        <nav
          className={`inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border shadow-2xs ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <button
            onClick={() => setMainTab('study')}
            className={`py-2.5 px-5 rounded-xl text-xs md:text-sm font-extrabold transition cursor-pointer ${
              mainTab === 'study'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : 'opacity-75 hover:bg-[#1d6b4f]/10'
            }`}
          >
            ١. قسم المذاكرة (الأقسام الخمسة)
          </button>
          <button
            onClick={() => setMainTab('recalls')}
            className={`py-2.5 px-5 rounded-xl text-xs md:text-sm font-extrabold transition cursor-pointer ${
              mainTab === 'recalls'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : 'opacity-75 hover:bg-[#1d6b4f]/10'
            }`}
          >
            ٢. قسم التجميعات والتسريبات ({metrics.totalRecallPages} صفحة)
          </button>
          <button
            onClick={() => setMainTab('unified')}
            className={`py-2.5 px-5 rounded-xl text-xs md:text-sm font-extrabold transition cursor-pointer ${
              mainTab === 'unified'
                ? 'bg-[#1d6b4f] text-white shadow-xs'
                : 'opacity-75 hover:bg-[#1d6b4f]/10'
            }`}
          >
            ٣. جدول زمني موحد بين التجميعات والمذاكرة
          </button>
        </nav>
      </div>

      {/* التبويب ١: قسم المذاكرة (الأقسام الخمسة) */}
      {mainTab === 'study' && (
        <div className="space-y-4">
          {/* بطاقات التخصصات الخمسة بنفس التوزيع والألوان */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {SPECIALTIES.map((spec) => {
              const list = spState.videosBySpec[spec.id] || [];
              const tot = list.reduce((a, b) => a + (b.seconds || 0), 0);
              const don = list.filter((b) => b.done).reduce((a, b) => a + (b.seconds || 0), 0);
              const doneCnt = list.filter((b) => b.done).length;
              const pct = tot > 0 ? Math.round((don / tot) * 100) : 0;
              const isActive = activeSpecialty === spec.id;

              return (
                <button
                  key={spec.id}
                  onClick={() => {
                    setActiveSpecialty(spec.id);
                    setSelectedYear('ALL');
                    setSelectedSubSpec('ALL');
                    setSearchQuery('');
                  }}
                  className={`p-4 rounded-3xl border text-right transition cursor-pointer flex flex-col justify-between min-h-[126px] ${
                    isActive
                      ? 'bg-[#1d6b4f] text-white border-[#1d6b4f] shadow-sm'
                      : isDark
                      ? 'bg-[#181e1b] border-[#2a332e] hover:border-[#1d6b4f]/50'
                      : 'bg-white border-[#e6e2d8] hover:border-[#1d6b4f]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">{spec.icon}</span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#eaf4ef] text-[#1d6b4f]'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="font-extrabold text-sm md:text-base leading-snug">
                      {spec.title}
                    </div>
                    <div
                      className={`text-xs mt-1 font-medium ${
                        isActive ? 'text-white/85' : 'opacity-65'
                      }`}
                    >
                      {doneCnt}/{list.length} مقطع متاح
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* بطاقة محتوى التخصص المختار */}
          <div
            className={`rounded-3xl border p-5 md:p-6 space-y-4 shadow-xs ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            {/* رأس بطاقة التخصص */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-2xl">
                    {SPECIALTIES.find((s) => s.id === activeSpecialty)?.icon}
                  </span>
                  <h2 className="text-lg md:text-xl font-extrabold">
                    {SPECIALTIES.find((s) => s.id === activeSpecialty)?.title}
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold">
                    إجمالي الساعات: {formatShortMins(currentStats.totSec)}
                  </span>
                </div>
                <p className="text-xs opacity-70 mt-1.5">
                  المُنجز: <strong>{formatHoursMins(currentStats.donSec)}</strong> ({currentStats.pct}%) • المتبقي:{' '}
                  <strong>{formatHoursMins(currentStats.remSec)}</strong>
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`px-4 py-2.5 rounded-2xl border text-xs md:text-sm font-extrabold transition cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#121614] border-[#2a332e] hover:border-[#4fbf93]'
                    : 'bg-[#f8f6f1] border-[#dcd6c8] hover:bg-[#eaf4ef] hover:text-[#1d6b4f]'
                }`}
              >
                {showAddForm ? '✕ إغلاق الإضافة' : '+ إضافة مقطع / ملف'}
              </button>
            </div>

            {/* ضبط فترة مذاكرة المحاضرات */}
            <div
              className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            >
              <span className="font-bold opacity-80">
                📅 فترة توزيع محاضرات وملفات التخصصات ({countDaysInclusive(spState.studyStartDate, spState.studyEndDate)} يوم):
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5">
                  <span className="opacity-70">من:</span>
                  <input
                    type="date"
                    value={spState.studyStartDate}
                    onChange={(e) => handleStudyRangeChange(e.target.value, spState.studyEndDate)}
                    className={`rounded-xl border px-2.5 py-1 outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="opacity-70">إلى:</span>
                  <input
                    type="date"
                    value={spState.studyEndDate}
                    min={spState.studyStartDate}
                    onChange={(e) => handleStudyRangeChange(spState.studyStartDate, e.target.value)}
                    className={`rounded-xl border px-2.5 py-1 outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                </label>
              </div>
            </div>

            {showAddForm && (
              <div
                className={`p-4 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                }`}
              >
                <form
                  onSubmit={handleAddVideo}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
                >
                  <div className="lg:col-span-6 text-xs font-extrabold text-[#1d6b4f]">
                    🎬 إضافة محاضرة / فيديو جديد:
                  </div>
                  <input
                    type="text"
                    placeholder="عنوان المحاضرة *"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className={`lg:col-span-2 rounded-xl border px-3 py-2 text-xs outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="السنة (مثلاً 2025)"
                    value={newVideo.year}
                    onChange={(e) => setNewVideo({ ...newVideo, year: e.target.value })}
                    className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="المدة (مثال 1:25:00)"
                    value={newVideo.duration}
                    onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                    className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="التخصص الفرعي (Cardiology...)"
                    value={newVideo.specialty}
                    onChange={(e) => setNewVideo({ ...newVideo, specialty: e.target.value })}
                    className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1d6b4f] text-white text-xs font-bold py-2 px-4 cursor-pointer hover:bg-[#16543e]"
                  >
                    حفظ المحاضرة
                  </button>
                  <input
                    type="url"
                    placeholder="رابط الفيديو على يوتيوب (اختياري)"
                    value={newVideo.url}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    className={`lg:col-span-6 rounded-xl border px-3 py-2 text-xs outline-none ${
                      isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                    }`}
                  />
                </form>

                <div className="border-t border-[#1d6b4f]/15 pt-3">
                  <form
                    onSubmit={handleAddStudyFile}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
                  >
                    <div className="lg:col-span-6 text-xs font-extrabold text-[#b45309]">
                      📄 إضافة ملف / مذكرة PDF (يُحسب تلقائياً بواقع ٥ دقائق لكل صفحة):
                    </div>
                    <input
                      type="text"
                      placeholder="اسم الملف (مثلاً: ملخص الباطنة السريع) *"
                      value={newStudyFile.title}
                      onChange={(e) => setNewStudyFile({ ...newStudyFile, title: e.target.value })}
                      className={`lg:col-span-2 rounded-xl border px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                      }`}
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="عدد الصفحات *"
                      value={newStudyFile.pages}
                      onChange={(e) => setNewStudyFile({ ...newStudyFile, pages: e.target.value })}
                      className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                      }`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="السنة (2025)"
                      value={newStudyFile.year}
                      onChange={(e) => setNewStudyFile({ ...newStudyFile, year: e.target.value })}
                      className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="التخصص الفرعي"
                      value={newStudyFile.specialty}
                      onChange={(e) => setNewStudyFile({ ...newStudyFile, specialty: e.target.value })}
                      className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                        isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
                      }`}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-[#b45309] text-white text-xs font-bold py-2 px-4 cursor-pointer hover:bg-[#92400e]"
                    >
                      حفظ الملف
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* شريط البحث + أزرار السنوات + أزرار التخصصات الفرعية بنفس التصميم */}
            {currentList.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* الصف الأول: حقل البحث + أزرار السنوات */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ابحثي باسم المحاضرة أو التخصص..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-2.5 text-xs outline-none ${
                        isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                      }`}
                    />
                  </div>

                  {availableYears.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedYear('ALL')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                          selectedYear === 'ALL'
                            ? 'bg-[#1d6b4f] text-white border-[#1d6b4f]'
                            : isDark
                            ? 'bg-[#121614] border-[#2a332e] hover:border-[#1d6b4f]'
                            : 'bg-white border-[#e6e2d8] hover:border-[#1d6b4f]'
                        }`}
                      >
                        الكل
                      </button>
                      {availableYears.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setSelectedYear(y)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                            selectedYear === y
                              ? 'bg-[#1d6b4f] text-white border-[#1d6b4f]'
                              : isDark
                              ? 'bg-[#121614] border-[#2a332e] hover:border-[#1d6b4f]'
                              : 'bg-white border-[#e6e2d8] hover:border-[#1d6b4f]'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* الصف الثاني: أزرار التخصصات الفرعية */}
                {availableSubSpecs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold opacity-70 ml-1">التخصصات:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubSpec('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        selectedSubSpec === 'ALL'
                          ? 'bg-[#1d6b4f] text-white border-[#1d6b4f]'
                          : isDark
                          ? 'bg-[#121614] border-[#2a332e] hover:border-[#1d6b4f]'
                          : 'bg-white border-[#e6e2d8] hover:border-[#1d6b4f]'
                      }`}
                    >
                      جميع التخصصات
                    </button>
                    {availableSubSpecs.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSelectedSubSpec(sub)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          selectedSubSpec === sub
                            ? 'bg-[#1d6b4f] text-white border-[#1d6b4f]'
                            : isDark
                            ? 'bg-[#121614] border-[#2a332e] hover:border-[#1d6b4f]'
                            : 'bg-white border-[#e6e2d8] hover:border-[#1d6b4f]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* قائمة المحاضرات مجمعة حسب الكورس */}
            {groupedByCourse.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="text-3xl">📂</div>
                <p className="text-sm font-bold opacity-70">
                  لا توجد محاضرات مضافة لهذا التخصص حالياً.
                </p>
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                {groupedByCourse.map((group) => {
                  const groupSec = group.items.reduce((a, b) => a + (b.seconds || 0), 0);
                  const groupDoneSec = group.items
                    .filter((b) => b.done)
                    .reduce((a, b) => a + (b.seconds || 0), 0);
                  return (
                    <div
                      key={group.courseTitle}
                      className={`rounded-2xl border overflow-hidden ${
                        isDark ? 'border-[#2a332e]' : 'border-[#e6e2d8]'
                      }`}
                    >
                      <div
                        className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
                          isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#1d6b4f] text-white text-[11px] font-bold">
                            {group.year}
                          </span>
                          <span className="font-extrabold text-xs md:text-sm">{group.courseTitle}</span>
                        </div>
                        <span className="text-[11px] opacity-70">
                          {group.items.filter((i) => i.done).length} / {group.items.length} منجز •{' '}
                          {formatHoursMins(groupDoneSec)} من {formatHoursMins(groupSec)}
                        </span>
                      </div>

                      <div className="divide-y divide-[#1d6b4f]/10">
                        {group.items.map((video) => (
                          <div
                            key={video.id}
                            className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                              video.done
                                ? 'opacity-55'
                                : isDark
                                ? 'hover:bg-[#121614]/60'
                                : 'hover:bg-[#f8f6f1]/70'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={video.done}
                                onChange={() => toggleVideoDoneAnySpec(activeSpecialty, video.id)}
                                className="mt-1 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    onClick={() => toggleVideoDoneAnySpec(activeSpecialty, video.id)}
                                    className={`text-xs sm:text-sm font-bold cursor-pointer leading-snug ${
                                      video.done ? 'line-through' : ''
                                    }`}
                                  >
                                    {video.title}
                                  </span>
                                  {video.specialty && video.specialty !== 'General' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaf4ef] text-[#1d6b4f] font-semibold">
                                      {video.specialty}
                                    </span>
                                  )}
                                  {video.broken && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold">
                                      ⚠️ رابط معطوب
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 mr-7 sm:mr-0">
                              <span
                                className={`text-xs font-mono px-2.5 py-1 rounded-xl border ${
                                  isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                                }`}
                              >
                                ⏱ {video.duration}
                              </span>

                              {video.url && (
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-xl bg-[#1d6b4f] hover:bg-[#16543e] text-white text-xs font-bold transition"
                                >
                                  ▶ مشاهدة
                                </a>
                              )}

                              <button
                                onClick={() => setEditingVideo({ ...video })}
                                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-xs font-bold transition cursor-pointer"
                              >
                                ✏️ تعديل
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* التبويب ٢: خطة التجميعات */}
      {mainTab === 'recalls' && (
        <div className="space-y-4">
          <div
            className={`rounded-3xl border p-4 md:p-5 space-y-4 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-extrabold">
                  📝 خطة التجميعات ({metrics.doneRecallPages} / {metrics.totalRecallPages} صفحة •{' '}
                  {metrics.recallPct}%)
                </h2>
                <p className="text-xs opacity-65 mt-0.5">
                  متوسط الصفحة الواحدة = <strong>٥ دقائق</strong> (إجمالي الوقت المقدر للتجميعات:{' '}
                  <strong>{formatHoursMins(metrics.totalRecallSeconds)}</strong>)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] opacity-65 mb-1">بداية التجميعات</label>
                  <input
                    type="date"
                    value={spState.recallStartDate}
                    onChange={(e) => handleRecallRangeChange(e.target.value, spState.recallEndDate)}
                    className={`rounded-xl border px-3 py-1.5 text-xs outline-none ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] opacity-65 mb-1">نهاية التجميعات</label>
                  <input
                    type="date"
                    value={spState.recallEndDate}
                    min={spState.recallStartDate}
                    onChange={(e) => handleRecallRangeChange(spState.recallStartDate, e.target.value)}
                    className={`rounded-xl border px-3 py-1.5 text-xs outline-none ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
              <div
                className="h-full bg-[#1d6b4f] transition-all duration-300"
                style={{ width: `${metrics.recallPct}%` }}
              />
            </div>

            <form
              onSubmit={handleAddRecallFile}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1d6b4f]/15"
            >
              <input
                type="text"
                placeholder="اسم ملف التجميعات (مثلاً: تجميعات مايو 2026) *"
                value={newRecall.title}
                onChange={(e) => setNewRecall({ ...newRecall, title: e.target.value })}
                className={`sm:col-span-2 rounded-2xl border px-3.5 py-2 text-xs outline-none ${
                  isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                }`}
                required
              />
              <input
                type="number"
                min="1"
                placeholder="عدد الصفحات *"
                value={newRecall.pages}
                onChange={(e) => setNewRecall({ ...newRecall, pages: e.target.value })}
                className={`rounded-2xl border px-3.5 py-2 text-xs outline-none ${
                  isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                }`}
                required
              />
              <button
                type="submit"
                className="rounded-2xl bg-[#1d6b4f] hover:bg-[#16543e] text-white text-xs font-extrabold py-2 px-4 cursor-pointer transition"
              >
                ➕ إضافة الملف وتوزيعه
              </button>
            </form>

            {spState.recallFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {spState.recallFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  >
                    <span className="font-bold">📄 {file.title}</span>
                    <span className="text-[#1d6b4f] font-extrabold">
                      ({file.pages} ص • ~{formatShortMins(file.pages * SECONDS_PER_RECALL_PAGE)})
                    </span>
                    <button
                      onClick={() => handleRemoveRecallFile(file.id)}
                      className="text-rose-500 hover:bg-rose-500/10 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={`rounded-3xl border p-4 md:p-5 space-y-3 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1d6b4f]/15">
              <h3 className="font-extrabold text-sm md:text-base">
                📆 الجدول اليومي للتجميعات ({effectiveRecallDailyItems.length} ورد يومي)
              </h3>
              <span className="text-xs px-3 py-1 rounded-full bg-[#eaf4ef] text-[#1d6b4f] font-bold">
                المعدل اليومي: ~{metrics.recallPagesPerDay} صفحة/يوم (~
                {formatShortMins(metrics.recallMinsPerDay * 60)})
              </span>
            </div>

            {effectiveRecallDailyItems.length === 0 ? (
              <p className="text-center text-xs opacity-60 py-8">
                أضيفي ملفات التجميعات بالأعلى ليتم تقسيم صفحاتها تلقائياً على الأيام.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {effectiveRecallDailyItems.map((item) => {
                  const isToday = item.date === todayIso;
                  const itemSeconds = Number(item.pageCount || 0) * SECONDS_PER_RECALL_PAGE;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                        isToday ? 'border-2 border-[#1d6b4f]' : ''
                      } ${
                        item.done
                          ? 'opacity-55'
                          : isDark
                          ? 'bg-[#121614] border-[#2a332e]'
                          : 'bg-[#f8f6f1] border-[#e6e2d8]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleRecallDayItem(item.id)}
                            className="mt-1 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-[#1d6b4f]">
                                {formatArabicDate(item.date)}
                              </span>
                              {isToday && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1d6b4f] text-white font-bold">
                                  اليوم
                                </span>
                              )}
                            </div>
                            <div
                              onClick={() => toggleRecallDayItem(item.id)}
                              className={`text-xs font-extrabold mt-1 cursor-pointer ${
                                item.done ? 'line-through' : ''
                              }`}
                            >
                              {item.fileTitle}
                            </div>
                            <div className="text-[11px] opacity-75 mt-0.5">
                              من صفحة <strong>{item.fromPage}</strong> إلى صفحة{' '}
                              <strong>{item.toPage}</strong> ({item.pageCount} ص) •{' '}
                              <strong className="text-[#b45309]">
                                ~{formatShortMins(itemSeconds)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!item.done && (
                        <div className="flex justify-end pt-1 border-t border-[#1d6b4f]/10">
                          <button
                            onClick={() => postponeRecallByOneDay(item.id, item.date)}
                            className="text-[11px] px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold cursor-pointer"
                          >
                            ⏭️ ترحيل للغد (+١ يوم)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* التبويب ٣: الخطة الكاملة اليومية (المذاكرة + التجميعات معاً) */}
      {mainTab === 'unified' && (
        <div className="space-y-4">
          <div
            className={`rounded-3xl border p-4 md:p-5 space-y-3 ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-extrabold">
                  🗓️ الخطة الكاملة اليومية (المذاكرة + التجميعات في جدول واحد)
                </h2>
                <p className="text-xs opacity-65 mt-0.5">
                  كل بطاقة تمثل يوماً كاملاً بمهامه وإجمالي الساعات والدقائق المطلوبة فيه
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setUnifiedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    unifiedFilter === 'ALL'
                      ? 'bg-[#1d6b4f] text-white'
                      : 'bg-[#eaf4ef] text-[#1d6b4f]'
                  }`}
                >
                  جميع الأيام
                </button>
                <button
                  onClick={() => setUnifiedFilter('TODAY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    unifiedFilter === 'TODAY'
                      ? 'bg-[#1d6b4f] text-white'
                      : 'bg-[#eaf4ef] text-[#1d6b4f]'
                  }`}
                >
                  مهام اليوم فقط
                </button>
                <button
                  onClick={() => setUnifiedFilter('REMAINING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    unifiedFilter === 'REMAINING'
                      ? 'bg-[#1d6b4f] text-white'
                      : 'bg-[#eaf4ef] text-[#1d6b4f]'
                  }`}
                >
                  غير المنجز فقط
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="🔍 ابحثي بالتاريخ (مثال: 2026-11-21) أو اسم المحاضرة أو التجميعات..."
              value={unifiedSearch}
              onChange={(e) => setUnifiedSearch(e.target.value)}
              className={`w-full rounded-2xl border px-3.5 py-2 text-xs outline-none ${
                isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
              }`}
            />
          </div>

          {unifiedScheduleDays.length === 0 ? (
            <div
              className={`rounded-3xl border p-10 text-center space-y-2 ${
                isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
              }`}
            >
              <div className="text-3xl">🗓️</div>
              <p className="text-sm font-bold opacity-75">
                لا توجد مهام مطابقة للتصفية الحالية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unifiedScheduleDays.map((dayObj) => {
                const isToday = dayObj.date === todayIso;
                const isTomorrow = dayObj.date === tomorrowIso;
                const totalTasksCount = dayObj.videos.length + dayObj.recalls.length;
                const doneTasksCount =
                  dayObj.videos.filter((v) => v.done).length +
                  dayObj.recalls.filter((r) => r.done).length;
                const dayProgress =
                  totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

                return (
                  <div
                    key={dayObj.date}
                    className={`rounded-3xl border p-4 md:p-5 flex flex-col justify-between gap-3 ${
                      isToday
                        ? 'border-2 border-[#1d6b4f] shadow-sm'
                        : isDark
                        ? 'bg-[#181e1b] border-[#2a332e]'
                        : 'bg-white border-[#e6e2d8]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#1d6b4f]/15">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm md:text-base">
                              {formatArabicDate(dayObj.date)}
                            </span>
                            {isToday && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1d6b4f] text-white font-bold">
                                اليوم
                              </span>
                            )}
                            {isTomorrow && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 font-bold">
                                الغد
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] opacity-65 mt-1">
                            المنجز: <strong>{doneTasksCount}</strong> من{' '}
                            <strong>{totalTasksCount}</strong> ({dayProgress}%)
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-extrabold">
                            ⏱ {formatHoursMins(dayObj.activeTotalSeconds)}
                          </span>
                        </div>
                      </div>

                      {dayObj.videos.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#1d6b4f]">
                            <span>📚 محاضرات المذاكرة ({dayObj.videos.length})</span>
                            <span>{formatHoursMins(dayObj.activeVideoSeconds)}</span>
                          </div>
                          <div className="space-y-1.5">
                            {dayObj.videos.map((vid) => (
                              <div
                                key={vid.id}
                                className={`p-2.5 rounded-2xl border flex items-start justify-between gap-2 text-xs ${
                                  vid.done
                                    ? 'opacity-50 line-through'
                                    : isDark
                                    ? 'bg-[#121614] border-[#2a332e]'
                                    : 'bg-[#f8f6f1] border-[#e6e2d8]'
                                }`}
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={vid.done}
                                    onChange={() => toggleVideoDoneAnySpec(vid.specId, vid.id)}
                                    className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.2 rounded bg-[#eaf4ef] text-[#1d6b4f] text-[10px] font-bold">
                                        {vid.specIcon} {vid.specShort}
                                      </span>
                                      <span className="text-[10px] opacity-65">
                                        ({formatShortMins(vid.seconds)})
                                      </span>
                                    </div>
                                    <div
                                      onClick={() => toggleVideoDoneAnySpec(vid.specId, vid.id)}
                                      className="font-bold mt-0.5 cursor-pointer leading-snug"
                                    >
                                      {vid.title}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {vid.url && (
                                    <a
                                      href={vid.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 rounded-lg bg-[#1d6b4f] text-white text-[10px] font-bold"
                                    >
                                      ▶
                                    </a>
                                  )}
                                  {!vid.done && (
                                    <button
                                      onClick={() => postponeVideoByOneDay(vid.id, dayObj.date)}
                                      className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 text-[10px] font-bold cursor-pointer"
                                    >
                                      +١ي
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dayObj.recalls.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#b45309]">
                            <span>📝 ورد التجميعات ({dayObj.recalls.length})</span>
                            <span>~{formatHoursMins(dayObj.activeRecallSeconds)}</span>
                          </div>
                          <div className="space-y-1.5">
                            {dayObj.recalls.map((rec) => {
                              const recSec = Number(rec.pageCount || 0) * SECONDS_PER_RECALL_PAGE;
                              return (
                                <div
                                  key={rec.id}
                                  className={`p-2.5 rounded-2xl border flex items-start justify-between gap-2 text-xs ${
                                    rec.done
                                      ? 'opacity-50 line-through'
                                      : isDark
                                      ? 'bg-[#121614] border-[#2a332e]'
                                      : 'bg-[#fffbeb] border-[#fde68a]'
                                  }`}
                                >
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={rec.done}
                                      onChange={() => toggleRecallDayItem(rec.id)}
                                      className="mt-0.5 w-4 h-4 accent-[#1d6b4f] rounded cursor-pointer shrink-0"
                                    />
                                    <div
                                      onClick={() => toggleRecallDayItem(rec.id)}
                                      className="cursor-pointer min-w-0"
                                    >
                                      <div className="font-bold leading-snug">{rec.fileTitle}</div>
                                      <div className="text-[11px] opacity-80 mt-0.5">
                                        ص <strong>{rec.fromPage}</strong> إلى{' '}
                                        <strong>{rec.toPage}</strong> ({rec.pageCount} ص) •{' '}
                                        <strong className="text-[#b45309]">
                                          ~{formatShortMins(recSec)}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>

                                  {!rec.done && (
                                    <button
                                      onClick={() => postponeRecallByOneDay(rec.id, dayObj.date)}
                                      className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-800 text-[10px] font-bold cursor-pointer shrink-0"
                                    >
                                      +١ي
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`h-1.5 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'
                      }`}
                    >
                      <div
                        className="h-full bg-[#1d6b4f] transition-all duration-300"
                        style={{ width: `${dayProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* نافذة تعديل المحاضرة */}
      {editingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingVideo(null)}
        >
          <div
            className={`w-full max-w-lg rounded-3xl border p-5 md:p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1d6b4f]/15">
              <h3 className="font-extrabold text-base md:text-lg">✏️ تعديل بيانات المحاضرة</h3>
              <button
                onClick={() => setEditingVideo(null)}
                className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditVideo} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 opacity-80">عنوان المحاضرة *</label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${
                    isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 opacity-80">المدة (س:د:ث)</label>
                  <input
                    type="text"
                    value={editingVideo.duration}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 font-mono outline-none ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 opacity-80">السنة</label>
                  <input
                    type="text"
                    value={editingVideo.year}
                    onChange={(e) => setEditingVideo({ ...editingVideo, year: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 opacity-80">التخصص الفرعي</label>
                  <input
                    type="text"
                    value={editingVideo.specialty}
                    onChange={(e) => setEditingVideo({ ...editingVideo, specialty: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${
                      isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 opacity-80">رابط المحاضرة (YouTube URL)</label>
                <input
                  type="url"
                  value={editingVideo.url || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${
                    isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                  }`}
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingVideo.broken)}
                  onChange={(e) => setEditingVideo({ ...editingVideo, broken: e.target.checked })}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span className="font-bold text-rose-500">
                  تمييز كرابط معطوب (يُستثنى من التوزيع اليومي)
                </span>
              </label>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#1d6b4f]/15">
                <button
                  type="button"
                  onClick={() => handleDeleteFromEditModal(editingVideo.id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-extrabold cursor-pointer"
                >
                  🗑️ حذف المحاضرة
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="px-4 py-2 rounded-xl border border-slate-400/30 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1d6b4f] hover:bg-[#16543e] text-white font-extrabold cursor-pointer"
                  >
                    💾 حفظ التعديلات
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 12. الصفحة التفصيلية الرابعة: جدول الروتين والعادات اليومية (كاملة)
// ============================================================================
function RoutineFullView({ state, setState, isDark, todayIso, onOpenStats, onBack, showToast }) {
  const [selectedMonth, setSelectedMonth] = useState(() => todayIso.slice(0, 7));
  const [newHabitText, setNewHabitText] = useState('');
  const [newExtraTexts, setNewExtraTexts] = useState({});

  const habits = state.routineConfig.coreHabits;
  const logs = state.routineConfig.logs;

  const monthDaysList = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const daysCount = new Date(y, m, 0).getDate();
    return Array.from({ length: daysCount }, (_, idx) => {
      const dayNum = idx + 1;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dt = new Date(y, m - 1, dayNum);
      return {
        dateStr,
        dayNum,
        dayName: ARABIC_DAYS[dt.getDay()],
        isToday: dateStr === todayIso
      };
    });
  }, [selectedMonth, todayIso]);

  const toggleHabit = (dateStr, habitId) => {
    setState((prev) => {
      const existing = prev.routineConfig.logs[dateStr] || { completedHabits: [], extraTasks: [] };
      const has = existing.completedHabits.includes(habitId);
      const nextHabits = has
        ? existing.completedHabits.filter((id) => id !== habitId)
        : [...existing.completedHabits, habitId];
      return {
        ...prev,
        routineConfig: {
          ...prev.routineConfig,
          logs: {
            ...prev.routineConfig.logs,
            [dateStr]: { ...existing, completedHabits: nextHabits }
          }
        }
      };
    });
  };

  const addExtraTask = (dateStr) => {
    const txt = (newExtraTexts[dateStr] || '').trim();
    if (!txt) return;
    setState((prev) => {
      const existing = prev.routineConfig.logs[dateStr] || { completedHabits: [], extraTasks: [] };
      return {
        ...prev,
        routineConfig: {
          ...prev.routineConfig,
          logs: {
            ...prev.routineConfig.logs,
            [dateStr]: {
              ...existing,
              extraTasks: [
                ...(existing.extraTasks || []),
                { id: 'ex-' + Date.now(), text: txt, done: false }
              ]
            }
          }
        }
      };
    });
    setNewExtraTexts((p) => ({ ...p, [dateStr]: '' }));
  };

  const toggleExtraTask = (dateStr, taskId) => {
    setState((prev) => {
      const existing = prev.routineConfig.logs[dateStr] || { completedHabits: [], extraTasks: [] };
      return {
        ...prev,
        routineConfig: {
          ...prev.routineConfig,
          logs: {
            ...prev.routineConfig.logs,
            [dateStr]: {
              ...existing,
              extraTasks: (existing.extraTasks || []).map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              )
            }
          }
        }
      };
    });
  };

  const handleAddCoreHabit = (e) => {
    e.preventDefault();
    if (!newHabitText.trim()) return;
    setState((prev) => ({
      ...prev,
      routineConfig: {
        ...prev.routineConfig,
        coreHabits: [
          ...prev.routineConfig.coreHabits,
          { id: 'hab-' + Date.now(), label: newHabitText.trim() }
        ]
      }
    }));
    setNewHabitText('');
    showToast('✅ تمت إضافة العادة إلى أعمدة جدول المتابعة.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div
        className={`rounded-3xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border ${
              isDark ? 'border-[#2a332e] hover:bg-[#232b27]' : 'border-[#e6e2d8] hover:bg-[#f7f5f0]'
            }`}
            title="العودة لخطة يومي"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold">
              🌿 جدول الروتين والعادات اليومية
            </h1>
            <p className="text-xs opacity-65 mt-0.5">
              سجل شهري متكامل لمتابعة الأوراد والعادات والمهام الإضافية اليومية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold outline-none ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          />

          <button
            onClick={onOpenStats}
            className="px-4 py-2 rounded-2xl bg-[#1d6b4f] hover:bg-[#16543e] text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition"
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 إحصائيات الروتين</span>
          </button>
        </div>
      </div>

      {/* إدارة الأعمدة الثابتة */}
      <div
        className={`rounded-3xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold opacity-75 ml-1">الأعمدة الثابتة:</span>
          {habits.map((h) => (
            <span
              key={h.id}
              className="px-2.5 py-1 rounded-xl bg-[#eaf4ef] text-[#1d6b4f] text-xs font-bold flex items-center gap-1.5"
            >
              <span>{h.label}</span>
              <button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    routineConfig: {
                      ...prev.routineConfig,
                      coreHabits: prev.routineConfig.coreHabits.filter((item) => item.id !== h.id)
                    }
                  }))
                }
                className="text-rose-500 hover:opacity-100 opacity-60 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddCoreHabit} className="flex items-center gap-2">
          <input
            type="text"
            value={newHabitText}
            onChange={(e) => setNewHabitText(e.target.value)}
            placeholder="إضافة عادة جديدة للجدول..."
            className={`text-xs px-3 py-1.5 rounded-xl border outline-none ${
              isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
            }`}
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#1d6b4f] text-white text-xs font-bold"
          >
            + إضافة
          </button>
        </form>
      </div>

      {/* الجدول الشهري المتكامل */}
      <div
        className={`rounded-3xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isDark ? 'bg-[#121614] border-[#2a332e]' : 'bg-[#f8f6f1] border-[#e6e2d8]'
                }`}
              >
                <th className="p-3 font-extrabold sticky right-0 z-10 bg-inherit min-w-[140px]">
                  التاريخ واليوم
                </th>
                {habits.map((h) => (
                  <th key={h.id} className="p-3 font-extrabold text-center min-w-[100px]">
                    {h.label}
                  </th>
                ))}
                <th className="p-3 font-extrabold min-w-[220px]">مهام إضافية</th>
                <th className="p-3 font-extrabold text-center min-w-[90px]">الإنجاز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d6b4f]/10">
              {monthDaysList.map((d) => {
                const log = logs[d.dateStr] || { completedHabits: [], extraTasks: [] };
                const dayPct =
                  habits.length > 0 ? Math.round((log.completedHabits.length / habits.length) * 100) : 0;

                return (
                  <tr
                    key={d.dateStr}
                    className={`transition ${
                      d.isToday
                        ? isDark
                          ? 'bg-[#1d6b4f]/20'
                          : 'bg-[#eaf4ef]/80'
                        : isDark
                        ? 'hover:bg-[#121614]/50'
                        : 'hover:bg-[#f8f6f1]/70'
                    }`}
                  >
                    <td className="p-3 font-bold sticky right-0 z-10 bg-inherit">
                      <div className="flex items-center gap-1.5">
                        <span>{d.dayName}</span>
                        {d.isToday && (
                          <span className="px-1.5 py-0.2 rounded bg-[#1d6b4f] text-white text-[10px]">
                            اليوم
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] opacity-60 block">{d.dateStr}</span>
                    </td>

                    {habits.map((h) => {
                      const isDone = log.completedHabits.includes(h.id);
                      return (
                        <td key={h.id} className="p-3 text-center">
                          <button
                            onClick={() => toggleHabit(d.dateStr, h.id)}
                            className={`w-7 h-7 rounded-xl inline-flex items-center justify-center border transition ${
                              isDone
                                ? 'bg-[#1d6b4f] border-[#1d6b4f] text-white shadow-xs'
                                : isDark
                                ? 'border-[#2a332e] hover:border-[#4fbf93]'
                                : 'border-[#d6d1c4] hover:border-[#1d6b4f]'
                            }`}
                          >
                            {isDone && <Check className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-3">
                      <div className="space-y-1.5">
                        {(log.extraTasks || []).map((ex) => (
                          <div
                            key={ex.id}
                            onClick={() => toggleExtraTask(d.dateStr, ex.id)}
                            className={`flex items-center gap-1.5 cursor-pointer text-[11px] ${
                              ex.done ? 'line-through opacity-55' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={ex.done}
                              onChange={() => {}}
                              className="accent-[#1d6b4f]"
                            />
                            <span>{ex.text}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newExtraTexts[d.dateStr] || ''}
                            onChange={(e) =>
                              setNewExtraTexts((p) => ({ ...p, [d.dateStr]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && addExtraTask(d.dateStr)}
                            placeholder="+ مهمة لليوم..."
                            className="w-full text-[11px] px-2 py-1 rounded-lg border border-dashed border-[#1d6b4f]/30 bg-transparent outline-none"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center font-extrabold">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] ${
                          dayPct === 100
                            ? 'bg-[#1d6b4f] text-white'
                            : dayPct >= 50
                            ? 'bg-amber-500/15 text-amber-700'
                            : 'opacity-65'
                        }`}
                      >
                        {dayPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 13. الصفحة التفصيلية الخامسة: إحصائيات الروتين
// ============================================================================
function RoutineStatsFullView({ state, isDark, todayIso, onBackToRoutine }) {
  const habits = state.routineConfig.coreHabits;
  const logs = state.routineConfig.logs;

  const analytics = useMemo(() => {
    const todayLog = logs[todayIso] || { completedHabits: [] };
    const dailyPct =
      habits.length > 0 ? Math.round((todayLog.completedHabits.length / habits.length) * 100) : 0;

    const last7Dates = Array.from({ length: 7 }, (_, i) => addDaysIso(todayIso, -(6 - i)));
    const weeklyData = last7Dates.map((dStr) => {
      const log = logs[dStr];
      const pct =
        log && habits.length > 0 ? Math.round((log.completedHabits.length / habits.length) * 100) : 0;
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return {
        date: dStr,
        dayName: ARABIC_DAYS[dt.getDay()],
        pct
      };
    });

    const weeklyAvg =
      weeklyData.length > 0
        ? Math.round(weeklyData.reduce((a, b) => a + b.pct, 0) / weeklyData.length)
        : 0;

    const monthPrefix = todayIso.slice(0, 7);
    const monthDates = Object.keys(logs).filter((d) => d.startsWith(monthPrefix));
    const monthlyAvg =
      monthDates.length > 0 && habits.length > 0
        ? Math.round(
            monthDates.reduce(
              (acc, d) => acc + ((logs[d]?.completedHabits?.length || 0) / habits.length) * 100,
              0
            ) / monthDates.length
          )
        : 0;

    const perHabitStats = habits.map((h) => {
      const count = monthDates.filter((d) => logs[d]?.completedHabits?.includes(h.id)).length;
      const pct = monthDates.length > 0 ? Math.round((count / monthDates.length) * 100) : 0;
      return { ...h, count, totalDays: monthDates.length, pct };
    });

    return { dailyPct, weeklyAvg, monthlyAvg, weeklyData, perHabitStats };
  }, [habits, logs, todayIso]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div
        className={`rounded-3xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <div>
          <h1 className="text-lg md:text-2xl font-extrabold">
            📊 إحصائيات الروتين ومعدلات الالتزام
          </h1>
          <p className="text-xs opacity-65 mt-0.5">
            قراءة تحليلية لمعدل إنجازكِ اليومي والأسبوعي والشهري
          </p>
        </div>

        <button
          onClick={onBackToRoutine}
          className="px-4 py-2 rounded-2xl bg-[#1d6b4f] text-white text-xs font-extrabold flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لجدول الروتين</span>
        </button>
      </div>

      {/* بطاقات المؤشرات الثلاث */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-3xl border p-5 text-center space-y-1.5 ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <span className="text-xs font-bold opacity-65">معدل إنجاز اليوم</span>
          <div className="text-3xl font-extrabold text-[#1d6b4f]">{analytics.dailyPct}%</div>
        </div>

        <div
          className={`rounded-3xl border p-5 text-center space-y-1.5 ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <span className="text-xs font-bold opacity-65">متوسط الالتزام الأسبوعي (آخر ٧ أيام)</span>
          <div className="text-3xl font-extrabold text-amber-600">{analytics.weeklyAvg}%</div>
        </div>

        <div
          className={`rounded-3xl border p-5 text-center space-y-1.5 ${
            isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
          }`}
        >
          <span className="text-xs font-bold opacity-65">متوسط الالتزام الشهري</span>
          <div className="text-3xl font-extrabold text-sky-600">{analytics.monthlyAvg}%</div>
        </div>
      </div>

      {/* الرسم البياني الأسبوعي */}
      <div
        className={`rounded-3xl border p-5 space-y-4 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <h2 className="font-extrabold text-sm">📈 منحنى الالتزام خلال آخر ٧ أيام</h2>
        <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
          {analytics.weeklyData.map((item) => (
            <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-extrabold text-[#1d6b4f]">{item.pct}%</span>
              <div className="w-full max-w-[42px] h-32 rounded-t-2xl bg-[#1d6b4f]/10 flex items-end overflow-hidden">
                <div
                  className="w-full bg-[#1d6b4f] rounded-t-2xl transition-all duration-300"
                  style={{ height: `${Math.max(6, item.pct)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold block">{item.dayName}</span>
                <span className="text-[10px] opacity-55">{item.date.slice(5)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* تفصيل الالتزام لكل عادة */}
      <div
        className={`rounded-3xl border p-5 space-y-3 ${
          isDark ? 'bg-[#181e1b] border-[#2a332e]' : 'bg-white border-[#e6e2d8]'
        }`}
      >
        <h2 className="font-extrabold text-sm">🏅 معدل الثبات لكل ورد وعادة هذا الشهر</h2>
        <div className="space-y-3">
          {analytics.perHabitStats.map((h) => (
            <div key={h.id} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>{h.label}</span>
                <span className="text-[#1d6b4f]">
                  {h.count} من {h.totalDays} أيام مسجلة ({h.pct}%)
                </span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#232b27]' : 'bg-[#ece8de]'}`}>
                <div
                  className="h-full bg-[#1d6b4f] rounded-full transition-all duration-300"
                  style={{ width: `${h.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

