import React, { useState } from 'react';
import {
  X,
  Palette,
  Eye,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Check,
  Layers,
  Layout,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { applyAppTheme } from '../utils/themeEngine';

interface CustomUiDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export interface DesignReferenceItem {
  id: string;
  titleFa: string;
  subtitleFa: string;
  imagePath: string;
  designer: string;
  styleTags: string[];
  featuresFa: string[];
  recommendedIndustryFa: string;
  category: 'FINANCIAL' | 'CRM' | 'MOBILE' | 'EXECUTIVE' | 'DARK' | 'WORKFLOW';
  colorScheme: {
    bg: string;
    card: string;
    primary: string;
    badge: string;
  };
}

export const DESIGN_REFERENCES: DesignReferenceItem[] = [
  {
    id: 'acru_lime_financial',
    titleFa: '۱. الگوی مالی و حسابداری ACRU (سفید پاکیزه با زرد لیمویی و زمردی)',
    subtitleFa: 'داشبورد مالی شیک با گیج‌چارت سلامت مالی، کارت‌های سفید منسجم و دکمه افزودن ویجت',
    imagePath: '/assets/aistudio/1d60937832a1a7f4028b1737834740f2_fac5347a.webp',
    designer: 'ACRU Financial UI',
    category: 'FINANCIAL',
    styleTags: ['لیمویی زمردی (Lime)', 'نمودار گیج (Gauge)', 'کارت‌های سفید خلوت', 'تراکنش‌های تفکیک‌شده'],
    featuresFa: [
      'نمودار گیج ۷۵٪ سلامت مالی و تحلیل هزینه‌ها',
      'کارت کارت‌خوان و کارت بانکی سبز با دکمه‌های انتقال سریع',
      'نمودار میله‌ای مقایسه‌ای درآمد، پس‌انداز و هزینه‌ها',
      'نوار جستجوی بالا با آیکون‌های تنظیمات و اعلان‌ها',
    ],
    recommendedIndustryFa: 'حسابداری فروشگاهی، مدیریت مالی، بانکداری و صرافی',
    colorScheme: {
      bg: 'bg-[#f3f4f6]',
      card: 'bg-white shadow-xs rounded-2xl border border-slate-200/80',
      primary: 'bg-lime-600',
      badge: 'bg-lime-100 text-lime-900',
    },
  },
  {
    id: 'conceptzilla_orange_crm',
    titleFa: '۲. الگوی CRM و سرنخ‌های فروش Conceptzilla (نارنجی و سفید پاک)',
    subtitleFa: 'رابط کاربری مدرن مدیریت مشتریان با تب‌های بیضی‌شکل، نوار آیکونی و بج‌های امبر',
    imagePath: '/assets/aistudio/8601eed85c98c6c01f57cc314eb77094_8e0cc480.webp',
    designer: 'Conceptzilla UI',
    category: 'CRM',
    styleTags: ['نارنجی پرانرژی', 'تب‌های بیضی (Pill Tabs)', 'آیکون‌بار باریک', 'میزان امتیاز Score Bar'],
    featuresFa: [
      'تب‌های ناوبری بیضی شکل نارنجی (All, Favourite, New)',
      'ستون‌های اطلاعات سرنخ‌ها با درصد خروجی و نمودار مینی خطی',
      'نوار ابزار اکشن (Share Access / Add Lead) با هایلایت نارنجی',
      'لیست اشخاص و طرف‌حساب‌ها با دکمه چک‌باکس و وضعیت',
    ],
    recommendedIndustryFa: 'مدیریت ارتباط با مشتریان (CRM)، بازاریابی و فروش شرکتی',
    colorScheme: {
      bg: 'bg-[#f8fafc]',
      card: 'bg-white shadow-xs rounded-2xl border border-slate-200',
      primary: 'bg-orange-600',
      badge: 'bg-orange-50 text-orange-700',
    },
  },
  {
    id: 'salesforce_glass_gradient',
    titleFa: '۳. الگوی استارت‌آپی مدرن Salesforce (کارت‌های گلاس‌مورفیک گرادیان)',
    subtitleFa: 'داشبورد آینده‌نگرانه با کارت‌های گرادیانی فیروزه‌ای، بنفش و نارنجی و تب‌های مشکی',
    imagePath: '/assets/aistudio/ca0f2dfe4f5f419f0dd8939d2a1ea538_80cf89e5.webp',
    designer: 'Salesforce Startup',
    category: 'EXECUTIVE',
    styleTags: ['کارت‌های شیشه‌ای (Glassmorphism)', 'گرادیان فیروزه‌ای-بنفش', 'تب‌های مشکی بیضی', 'ویجت دستیار هوشمند'],
    featuresFa: [
      'کارت‌های شاخص‌های درآمدی با پس‌زمینه شیشه‌ای رنگین‌کمانی',
      'تب‌های ناوبری محتوایی بالا (Opportunities, Quotes, Reports)',
      'پانل شناور جستجوی سرمایه‌گذاران و دستیار قلم نوری',
      'نمودارهای دایره‌ای تلاقی مبالغ و فرصت‌های فروش',
    ],
    recommendedIndustryFa: 'شرکت‌های فناوری، پروژه‌های سرمایه‌گذاری و هوش تجاری مدیران',
    colorScheme: {
      bg: 'bg-[#e2e8f0]',
      card: 'bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg',
      primary: 'bg-indigo-600',
      badge: 'bg-purple-100 text-purple-900',
    },
  },
  {
    id: 'chaapline_print_mobile',
    titleFa: '۴. الگوی اپلیکیشن چاپ و سفارشات موبایل Chaapline (فارسی RTL)',
    subtitleFa: 'رابط کاربری موبایل مرجع فارسی با دکمه‌های مرجانی قرمز، شناور سفارش و فرم‌های تمیز',
    imagePath: '/assets/aistudio/mzwvn77j6bcg_0d531898.webp',
    designer: 'Chaapline Design',
    category: 'MOBILE',
    styleTags: ['فارسی RTL کامل', 'دکمه مرجانی قرمز', 'دکمه شناور سفارش (+)', 'کادر قیمت نقطه چین'],
    featuresFa: [
      'فرم محاسبه و صدور فاکتور با کادر قیمت کل نقطه‌چین متای قرمز',
      'دکمه اصلی ثبت سفارش مرجانی قرمز و ذخیره برای بعد',
      'انتخاب‌گرهای رادیویی و چک‌باکس‌های مستطیلی نرم',
      'منوی ناوبری پایینی موبایل با آیکون زرد شناور ثبت سفارش جدید',
    ],
    recommendedIndustryFa: 'خدمات چاپ و بسته‌بندی، سفارشات موبایل و فرم‌های صدور فاکتور سریع',
    colorScheme: {
      bg: 'bg-[#f8fafc]',
      card: 'bg-white shadow-xs rounded-2xl border border-slate-200',
      primary: 'bg-rose-600',
      badge: 'bg-rose-50 text-rose-700',
    },
  },
  {
    id: 'bingx_education_blue',
    titleFa: '۵. الگوی پرتال آموزشی و خدمات موبایل BingX / NooLearn (آبی الکتریک)',
    subtitleFa: 'طراحی اپلیکیشن موبایل با بنر سرمایه‌گذاری آبی پررنگ، آیکون‌های خدماتی و ورود سریع',
    imagePath: '/assets/aistudio/NooLearn-1_83703392.png',
    designer: 'BingX NooLearn',
    category: 'MOBILE',
    styleTags: ['آبی الکتریک (Royal Blue)', 'بنر تبلیغاتی هدر', 'شبکه آیکون‌های ۶ تایی', 'صفحه ورود خلوت'],
    featuresFa: [
      'بنر گرادیانی آبی هدر ویژه معرفی خدمات و پیشنهادهای ویژه',
      'شبکه آیکون‌های ۶ تایی با خطوط باریک و آیکون‌های بنفش-آبی',
      'فرم ورود همراه با فیلد شماره تلفن و دکمه ارسال کد ورود',
      'نوار ناوبری پایین با حالت فعال آبی و بج‌های جستجو',
    ],
    recommendedIndustryFa: 'پرتال‌های آموزشی، اپلیکیشن خدمات آنلاین و صرافی‌های ارز دیجیتال',
    colorScheme: {
      bg: 'bg-[#f1f5f9]',
      card: 'bg-white shadow-xs rounded-2xl border border-slate-200',
      primary: 'bg-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
  },
  {
    id: 'workspace_lime_timeline',
    titleFa: '۶. الگوی ورک‌استیشن و مدیریت وظایف Workspace (هدر سبز لیمویی)',
    subtitleFa: 'رابط کاربری پیشرفته با تایم‌لاین زمان‌بندی لیمویی بالا، کارت‌های کارمندان و تماس تصویری',
    imagePath: '/assets/aistudio/original-3a56625a4628f6fc8dccec71fd023d56_4af86af3.webp',
    designer: 'Workspace CRM',
    category: 'WORKFLOW',
    styleTags: ['نوار زمان‌بندی لیمویی', 'کارت‌های منحنی متمایز', 'پرتال ویدیوکال شناور', 'فیلتر سرنخ‌ها'],
    featuresFa: [
      'نوار تایم‌لاین بالا با نمایش تقویم زمان‌بندی جلسه و آواتار اعضا',
      'کارت‌های کارمندان و سرنخ‌ها با آیکون میانبر تماس و ایمیل',
      'پانل شناور خلاصه‌سازی جلسات ویدئویی و اسناد مرتبط',
      'دکمه‌های فیلتر سریع (Hot Client, Great Interest, Medium)',
    ],
    recommendedIndustryFa: 'مدیریت پروژه‌ها، کارتابل وظایف، شرکت‌های مشاوره و تیم‌های فنی',
    colorScheme: {
      bg: 'bg-[#eef2f6]',
      card: 'bg-white shadow-xs rounded-3xl border border-slate-200/90',
      primary: 'bg-lime-500',
      badge: 'bg-lime-100 text-lime-900',
    },
  },
  {
    id: 'volvo_luxury_minimalist',
    titleFa: '۷. الگوی لوکس و مینیمال Volvo EX30 (طوسی روشن با دکمه‌های زمردی)',
    subtitleFa: 'طراحی فوق‌العاده باکلاس و مینیمال با رنگ طوسی آتلیه‌ای، دستیار هوش مصنوعی و فونت‌های مدرن',
    imagePath: '/assets/aistudio/original-6ee13307b63c8aa53f3c6d75cfbc85c3_0704dc2b.webp',
    designer: 'Volvo UX Studio',
    category: 'EXECUTIVE',
    styleTags: ['طوسی آتلیه‌ای (Studio Gray)', 'دستیار AI شناور', 'دکمه سبز زمردی', 'تایپوگرافی لوکس'],
    featuresFa: [
      'پس‌زمینه مات طوسی روشن با احساس نرمی آتلیه‌ای',
      'ویجت اختصاصی دستیار هوشمند AI با کلیدهای میانبر سریع',
      'کنترل‌های بیضی رادیویی فوق مینیمال (Rent, Buy, Sell)',
      'کارت‌های تقویم و انتخاب تاریخ با ساعت فونت بزرگ',
    ],
    recommendedIndustryFa: 'کسب‌وکارهای لوکس، نمایشگاه خودرو، املاک، تجهیزات صنعتی و برندینگ',
    colorScheme: {
      bg: 'bg-[#e5e7eb]',
      card: 'bg-[#f3f4f6] shadow-xs rounded-3xl border border-slate-300/60',
      primary: 'bg-emerald-600',
      badge: 'bg-emerald-100 text-emerald-900',
    },
  },
  {
    id: 'cyber_dark_neon',
    titleFa: '۸. الگوی تاریک و گیمینگ Cyber Dark Hub (سرمه‌ای تیره با آیکون‌های ۳D)',
    subtitleFa: 'محیط دارک‌مود دارایی‌ها با کارت‌های سه‌بعدی رنگی، چارت نیئون و چت‌باکس زنده',
    imagePath: '/assets/aistudio/original-82f6e4f7f4a36b9f4a7c7f9786854116_493c5e2a.webp',
    designer: 'Cyber Gaming SaaS',
    category: 'DARK',
    styleTags: ['حالت دارک‌مود کامل', 'آیکون‌های ۳D برجسته', 'نمودار نیئون آبی', 'پانل چت زنده'],
    featuresFa: [
      'پس‌زمینه یکپارچه سرمه‌ای تیره مناسب کار در شب و کاهش خستگی چشم',
      'کارت‌های ۳D رنگی آبی، بنفش و قرمز ویژه پیشنهادهای ویژه و آمارها',
      'نمودار خطی نیئونی با ضریب محاسباتی زنده (۲.۵۴x)',
      'پانل کناری چت و رویدادهای زنده با دکمه ارسال پیام',
    ],
    recommendedIndustryFa: 'داشبورد دارک‌مود، نرم‌افزارهای نظارتی، پایش شبکه و ترید',
    colorScheme: {
      bg: 'bg-[#0f172a]',
      card: 'bg-[#1e293b] shadow-lg rounded-3xl border border-slate-700/80',
      primary: 'bg-blue-500',
      badge: 'bg-blue-900/60 text-blue-300',
    },
  },
  {
    id: 'sugarcrm_journey_nodes',
    titleFa: '۹. الگوی گردش کار و فرایندها SugarCRM (دیاگرام نودها و تب‌های بیضی)',
    subtitleFa: 'طراحی نودهای فرایندی و نقشه راه مشتری با نشانگر اعضای تیم و وضعیت تکالیف',
    imagePath: '/assets/aistudio/original-b94dc14825242b117649e09e0ab66543_e9cbec32.webp',
    designer: 'SugarCRM Design',
    category: 'WORKFLOW',
    styleTags: ['دیالوگ نودها Node Graph', 'تب‌های بالای مشکی', 'آواتار گروهی اعضا', 'کارت وضعیت پاسخگویی'],
    featuresFa: [
      'نمایش نودهای ارجاع کار و گام‌های انجام پروژه با خطوط ارتباطی',
      'آواتار کارمندان مسئول به همراه عدد اولویت پرونده',
      'تب‌های بالای صفحه اصلی برای سوئیچ بین پرونده‌ها و گزارش‌ها',
      'پانل پیشنهادی بانک دانش و تیکت‌های پشتیبانی در پایین صفحه',
    ],
    recommendedIndustryFa: 'مرکز امکانات، گردش کارهای ارجاعی، پیگیری تعهدات و تیکتینگ مشتریان',
    colorScheme: {
      bg: 'bg-[#e2e8f0]',
      card: 'bg-white shadow-xs rounded-3xl border border-slate-200',
      primary: 'bg-slate-900',
      badge: 'bg-slate-100 text-slate-800',
    },
  },
  {
    id: 'isee_smart_hub',
    titleFa: '۱۰. الگوی دکوراتیو iSee Smart Hub (کارت‌های ۳XL با آیکون‌های پاستلی)',
    subtitleFa: 'کارت‌های سفید مینیمال با لبه‌های گرد ۳XL، آیکون‌های پاستلی و کارت تصویری هدر',
    imagePath: '/assets/aistudio/isee_84f63901.png',
    designer: 'Samad Sepehr (SepehrPlus)',
    category: 'EXECUTIVE',
    styleTags: ['کارت‌های Rounded-3XL', 'رنگ‌های پاستلی', 'کنترل‌های سوئیچی', 'سایه‌های ملایم Soft Shadow'],
    featuresFa: [
      'کارت‌های اختصاصی دستگاه‌ها و سناریوها با سوییچ روشن/خاموش',
      'بنر تصویری هدر مکان/پروژه با قابلیت تغییر تصویر زمینه',
      'دسته ویجت‌های لوازم، روشنایی، دما و امنیت با نشانگر آنلاین',
    ],
    recommendedIndustryFa: 'سیستم‌های نظارتی، هوشمندسازی ساختمان، دوربین مداربسته و اتوماسیون',
    colorScheme: {
      bg: 'bg-[#f4f6f9]',
      card: 'bg-white shadow-xs rounded-3xl',
      primary: 'bg-blue-600',
      badge: 'bg-indigo-50 text-indigo-700',
    },
  },
  {
    id: 'khodrox_retail_shop',
    titleFa: '۱۱. الگوی فروشگاهی Khodrox Retail (هدر چسبان و کاتالوگ محصولات)',
    subtitleFa: 'طراحی ای‌کامرس مدرن با هدر چسبان، فیلترهای کناری تاشو و کارت‌های محصول',
    imagePath: '/assets/aistudio/khodrox-shop2_0ae4214e.png',
    designer: 'Samad Sepehr (SepehrPlus)',
    category: 'CRM',
    styleTags: ['ویترین لمسی کالا', 'فیلتر دامنه قیمت', 'بج‌های تخفیف پاستلی', 'دکمه‌های تسویه سرمه‌ای'],
    featuresFa: [
      'هدر ناوبری یکپارچه با کادر جستجوی مرکز و دسته محصولات',
      'فیلتر هوشمند قیمت، محبوب‌ترین، جدیدترین و پرفروش‌ترین‌ها',
      'کارت‌های کالا با بج درصد تخفیف و قیمت نهایی به تومان',
    ],
    recommendedIndustryFa: 'فروشگاه قطعات خودرو، فروشگاه آنلاین کالا، بنکداری و پخش مویرگی',
    colorScheme: {
      bg: 'bg-[#f8fafc]',
      card: 'bg-white shadow-sm rounded-2xl',
      primary: 'bg-blue-600',
      badge: 'bg-rose-50 text-rose-700',
    },
  },
  {
    id: 'mobile_service_portal',
    titleFa: '۱۲. الگوی اپلیکیشن و پرتال وظایف موبایل (Task Portal)',
    subtitleFa: 'واسط کاربری Clean Mobile با شبکه میانبرهای دکمه‌ای، جستجو و وضعیت‌بندی',
    imagePath: '/assets/aistudio/ksefe7f8iknb_9eb24edc.webp',
    designer: 'Samad Sepehr',
    category: 'MOBILE',
    styleTags: ['کارت‌های موبایل ۳۶۰px', 'شبکه دکمه‌های خدمات', 'فرم ورود سورمه‌ای', 'لیست با تگ فعال'],
    featuresFa: [
      'فرم ورود مدرن با دکمه اصلی سورمه‌ای تیره و لوگوی منحنی',
      'شبکه ۱۲ تایی آیکون‌های میانبر (پروفایل، پیام‌ها، تنظیمات، تراکنش‌ها)',
      'فهرست کارهای ثبت شده با بار جستجو و فیلتر تگ‌های پاستلی سبز',
    ],
    recommendedIndustryFa: 'اپلیکیشن همراه، پرتال نصابان، خدمات فنی در محل و مدیریت مشتریان',
    colorScheme: {
      bg: 'bg-[#f1f5f9]',
      card: 'bg-white shadow-sm rounded-2xl',
      primary: 'bg-slate-900',
      badge: 'bg-emerald-50 text-emerald-700',
    },
  },
];

export const CustomUiDesignsModal: React.FC<CustomUiDesignsModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredDesigns = DESIGN_REFERENCES.filter((d) => {
    if (activeCategoryFilter === 'ALL') return true;
    return d.category === activeCategoryFilter;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden dir-rtl">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>مرکز الگوها و تم‌های گرافیکی اختصاصی (UI Themes Gallery)</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  شامل ۱۴ الگوی استخراج‌شده از عکس‌های ارسالی
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                شما می‌توانید تم گرافیکی مورد نظر خود را فوراً روی نرم‌افزار فعال کنید یا درخواست بازطراحی کامل لایه‌بندی بدهید.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Explanation Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>راهنمای نحوه اعمال تم‌ها و نحوه تایید بازطراحی لایه‌بندی:</span>
            </div>
            <div className="text-xs text-slate-700 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/80">
                <span className="font-bold text-indigo-900 block mb-1">۱. اعمال تم زنده و آنی (بدون تغییر ساختار):</span>
                با کلیک روی دکمه «انتخاب این تم»، پالت رنگی، انحنای کارت‌ها، آیکون‌ها و استایل تمام جداول نرم‌افزار به این سبک تغییر می‌یابد و اطلاعات شما کاملاً محفوظ می‌ماند.
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-purple-100/80">
                <span className="font-bold text-purple-900 block mb-1">۲. بازطراحی کامل لایه‌بندی (Full Redesign):</span>
                اگر تمایل دارید چیدمان اصلی ماژول‌ها و هدر طبق دقیقا همان عکس باشد، الگوی مد نظر خود را به من اطلاع دهید تا پس از تایید شما، ساختار لایه‌بندی را بازطراحی نمایم.
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/80">
            <span className="text-xs font-extrabold text-slate-500 ml-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>دسته تم‌ها:</span>
            </span>
            {[
              { id: 'ALL', label: 'همه الگوها (۱۴ عکس)' },
              { id: 'EXECUTIVE', label: 'مدیریتی و تجاری' },
              { id: 'FINANCIAL', label: 'مالی و حسابداری' },
              { id: 'CRM', label: 'فروش و مشتریان' },
              { id: 'MOBILE', label: 'اپلیکیشن موبایل' },
              { id: 'WORKFLOW', label: 'فرایند و پروژه' },
              { id: 'DARK', label: 'دارک‌مود و گیمینگ' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Design Reference Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map((design) => {
              const isSelected = activeTheme === design.id;

              return (
                <div
                  key={design.id}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Image Preview Banner */}
                    <div className="relative group bg-slate-900 aspect-4/3 overflow-hidden cursor-pointer">
                      <img
                        src={design.imagePath}
                        alt={design.titleFa}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = design.imagePath.replace('/assets/', '/public/assets/');
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewImage(design.imagePath)}
                          className="px-3 py-1.5 bg-white/95 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs hover:bg-white"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>بزرگ‌نمایی تصویر</span>
                        </button>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>تم فعال نرم‌افزار</span>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                        {design.designer}
                      </div>
                    </div>

                    {/* Card Text Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 leading-snug">
                          {design.titleFa}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {design.subtitleFa}
                        </p>
                      </div>

                      {/* Style Tags */}
                      <div className="flex flex-wrap gap-1">
                        {design.styleTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Key Extracted Features List */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-700">ویژگی‌های ظاهری الگوی تصویری:</p>
                        <ul className="space-y-1">
                          {design.featuresFa.map((feat, idx) => (
                            <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                      {design.recommendedIndustryFa}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        applyAppTheme(design.id);
                        onSelectTheme(design.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>فعال است</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>انتخاب این تم</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>نکته: با انتخاب هر تم، تمام فرم‌ها، جداول، کارت‌ها و ویجت‌های نرم‌افزار فورا به سبک همان تم درمی‌آیند.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
          >
            تایید و بستن گالری
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Image Zoom */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-60 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-6xl max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={selectedPreviewImage}
              alt="بزرگ‌نمایی تصویر طرح UI"
              className="max-w-full max-h-[90vh] object-contain mx-auto"
            />
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
