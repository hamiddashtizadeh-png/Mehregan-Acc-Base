/**
 * Mehregan Business Suite - Dynamic UI Themes & Layout Engine
 * Allows instantaneous transformation of the application look, feel, color tokens,
 * card rounding, and layout arrangement based on user-provided design reference presets.
 */

export interface ThemeConfig {
  id: string;
  nameFa: string;
  subtitleFa: string;
  topBarColor: string;
  primaryColor: string;
  bgCanvasClass: string;
  cardClass: string;
  pillTagClass: string;
  heroVariant:
    | 'acru_gauge'
    | 'conceptzilla_crm'
    | 'salesforce_glass'
    | 'chaapline_pos'
    | 'workspace_timeline'
    | 'volvo_minimalist'
    | 'cyber_neon'
    | 'sugarcrm_nodes'
    | 'isee_hub'
    | 'khodrox_catalog'
    | 'bingx_tiles'
    | 'default';
  isDarkMode?: boolean;
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  acru_lime_financial: {
    id: 'acru_lime_financial',
    nameFa: 'الگوی مالی ACRU (لیمویی زمردی و سفید مینیمال)',
    subtitleFa: 'داشبورد مالی شیک با چارت گیج سلامت مالی، کارت‌های سفید و دکمه‌های لیمویی',
    topBarColor: '#84cc16',
    primaryColor: '#65a30d',
    bgCanvasClass: 'bg-[#f3f4f6]',
    cardClass: 'bg-white rounded-2xl border border-slate-200/90 shadow-xs',
    pillTagClass: 'bg-lime-100 text-lime-900 border-lime-200',
    heroVariant: 'acru_gauge',
  },
  conceptzilla_orange_crm: {
    id: 'conceptzilla_orange_crm',
    nameFa: 'الگوی CRM نارنجی Conceptzilla',
    subtitleFa: 'رابط کاربری مدرن مدیریت ارتباط با مشتریان با تب‌های بیضی نارنجی و امتیاز سرنخ‌ها',
    topBarColor: '#ea580c',
    primaryColor: '#ea580c',
    bgCanvasClass: 'bg-[#f8fafc]',
    cardClass: 'bg-white rounded-2xl border border-orange-100/80 shadow-xs',
    pillTagClass: 'bg-orange-100 text-orange-900 border-orange-200',
    heroVariant: 'conceptzilla_crm',
  },
  salesforce_glass_gradient: {
    id: 'salesforce_glass_gradient',
    nameFa: 'الگوی استارت‌آپی مدرن Salesforce (گلاس‌مورفیک گرادیان)',
    subtitleFa: 'داشبورد آینده‌نگرانه با کارت‌های شیشه‌ای مات و گرادیان فیروزه‌ای و بنفش',
    topBarColor: '#6366f1',
    primaryColor: '#4f46e5',
    bgCanvasClass: 'bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200',
    cardClass: 'bg-white/85 backdrop-blur-md rounded-3xl border border-white/70 shadow-lg',
    pillTagClass: 'bg-indigo-100/80 text-indigo-900 border-indigo-200',
    heroVariant: 'salesforce_glass',
  },
  chaapline_print_mobile: {
    id: 'chaapline_print_mobile',
    nameFa: 'الگوی سفارشات چاپ Chaapline (مرجانی و نقطه‌چین)',
    subtitleFa: 'رابط فارسی RTL با دکمه‌های مرجانی قرمز، کارت قیمت نقطه‌چین و شناور سفارش',
    topBarColor: '#ef4444',
    primaryColor: '#dc2626',
    bgCanvasClass: 'bg-[#fafafa]',
    cardClass: 'bg-white rounded-2xl border border-slate-200/80 shadow-xs',
    pillTagClass: 'bg-rose-100 text-rose-900 border-rose-200',
    heroVariant: 'chaapline_pos',
  },
  bingx_education_blue: {
    id: 'bingx_education_blue',
    nameFa: 'الگوی پرتال آموزشی و صرافی BingX (آبی الکتریک)',
    subtitleFa: 'بنر هدر سرمایه‌ای آبی با شبکه کاشی‌های ۶گانه میانبر و ورود سریع',
    topBarColor: '#2563eb',
    primaryColor: '#1d4ed8',
    bgCanvasClass: 'bg-[#f1f5f9]',
    cardClass: 'bg-white rounded-2xl border border-blue-100/60 shadow-xs',
    pillTagClass: 'bg-blue-100 text-blue-900 border-blue-200',
    heroVariant: 'bingx_tiles',
  },
  workspace_lime_timeline: {
    id: 'workspace_lime_timeline',
    nameFa: 'الگوی ورک‌استیشن Workspace (تایم‌لاین لیمویی)',
    subtitleFa: 'نوار زمان‌بندی جلسات لیمویی بالا با کارت‌های کارمندان و خلاصه تعاملات',
    topBarColor: '#a3e635',
    primaryColor: '#84cc16',
    bgCanvasClass: 'bg-[#edf2f7]',
    cardClass: 'bg-white rounded-3xl border border-slate-200 shadow-xs',
    pillTagClass: 'bg-lime-100 text-lime-950 border-lime-300',
    heroVariant: 'workspace_timeline',
  },
  volvo_luxury_minimalist: {
    id: 'volvo_luxury_minimalist',
    nameFa: 'الگوی لوکس و مینیمال Volvo (طوسی آتلیه‌ای با زمردی)',
    subtitleFa: 'طراحی مینیمال اسکاندیناوی با پس‌زمینه مات طوسی، دکمه‌های زمردی و کارت دارایی‌ها',
    topBarColor: '#059669',
    primaryColor: '#047857',
    bgCanvasClass: 'bg-[#e5e7eb]',
    cardClass: 'bg-[#f4f5f7] rounded-3xl border border-slate-300/80 shadow-xs',
    pillTagClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    heroVariant: 'volvo_minimalist',
  },
  cyber_dark_neon: {
    id: 'cyber_dark_neon',
    nameFa: 'الگوی تاریک و گیمینگ Cyber Dark (OLED با نیئون فیروزه‌ای)',
    subtitleFa: 'محیط دارک‌مود عمیق با خطوط نیئون آبی، کارت‌های سه‌بعدی و نمایش تلمتری زنده',
    topBarColor: '#06b6d4',
    primaryColor: '#06b6d4',
    bgCanvasClass: 'bg-[#0b0f19] text-slate-100',
    cardClass: 'bg-[#151c2f] rounded-3xl border border-slate-800 shadow-xl text-slate-100',
    pillTagClass: 'bg-cyan-950 text-cyan-300 border-cyan-800/80',
    heroVariant: 'cyber_neon',
    isDarkMode: true,
  },
  sugarcrm_journey_nodes: {
    id: 'sugarcrm_journey_nodes',
    nameFa: 'الگوی گردش فرایندها SugarCRM (دیاگرام نودها)',
    subtitleFa: 'نقشه راه مراحل انجام پیش‌فاکتور، انبارداری و تسویه با نودهای گرافیکی متصل',
    topBarColor: '#0f172a',
    primaryColor: '#1e293b',
    bgCanvasClass: 'bg-[#eef2f6]',
    cardClass: 'bg-white rounded-3xl border border-slate-200/90 shadow-xs',
    pillTagClass: 'bg-slate-100 text-slate-900 border-slate-300',
    heroVariant: 'sugarcrm_nodes',
  },
  isee_smart_hub: {
    id: 'isee_smart_hub',
    nameFa: 'الگوی دکوراتیو iSee Smart Hub (تجهیزات و سناریوهای هوشمند)',
    subtitleFa: 'کارت‌های سفید گرد ۳XL، سوییچ‌های روشن/خاموش دستگاه‌ها و تصویر پروژه',
    topBarColor: '#0284c7',
    primaryColor: '#0369a1',
    bgCanvasClass: 'bg-[#f4f6f9]',
    cardClass: 'bg-white rounded-3xl border border-slate-200/70 shadow-xs',
    pillTagClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    heroVariant: 'isee_hub',
  },
  khodrox_retail_shop: {
    id: 'khodrox_retail_shop',
    nameFa: 'الگوی فروشگاهی Khodrox (ویترین قطعات و هدر چسبان)',
    subtitleFa: 'کاتالوگ محصولات ای‌کامرس با فیلتر بازه قیمت و کارت‌های محصول دو نرخی',
    topBarColor: '#2563eb',
    primaryColor: '#1d4ed8',
    bgCanvasClass: 'bg-[#f8fafc]',
    cardClass: 'bg-white rounded-2xl border border-slate-200 shadow-xs',
    pillTagClass: 'bg-blue-100 text-blue-900 border-blue-200',
    heroVariant: 'khodrox_catalog',
  },
  mobile_service_portal: {
    id: 'mobile_service_portal',
    nameFa: 'الگوی پرتال وظایف همراه (Task Portal)',
    subtitleFa: 'واسط کاربری تمیز موبایل با شبکه میانبرهای دکمه‌ای، جستجو و تگ‌های پاستلی',
    topBarColor: '#0f172a',
    primaryColor: '#059669',
    bgCanvasClass: 'bg-[#f1f5f9]',
    cardClass: 'bg-white rounded-2xl border border-slate-200 shadow-xs',
    pillTagClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    heroVariant: 'default',
  },
};

export const DEFAULT_THEME_ID = 'isee_smart_hub';

export function getActiveThemeId(): string {
  try {
    return localStorage.getItem('mehregan_active_ui_theme') || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function getThemeConfig(themeId?: string): ThemeConfig {
  const id = themeId || getActiveThemeId();
  return THEME_CONFIGS[id] || THEME_CONFIGS[DEFAULT_THEME_ID];
}

/**
 * Apply the selected theme across the entire application:
 * 1. Persists to localStorage
 * 2. Sets data-ui-theme on documentElement
 * 3. Toggles dark mode class if applicable
 * 4. Dispatches global custom event 'mehregan_theme_changed'
 */
export function applyAppTheme(themeId: string): ThemeConfig {
  const config = THEME_CONFIGS[themeId] || THEME_CONFIGS[DEFAULT_THEME_ID];

  try {
    localStorage.setItem('mehregan_active_ui_theme', config.id);
  } catch {
    // ignore
  }

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-ui-theme', config.id);

    if (config.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set top-bar CSS variable dynamically
    document.documentElement.style.setProperty('--theme-top-bar', config.topBarColor);
    document.documentElement.style.setProperty('--theme-primary', config.primaryColor);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('mehregan_theme_changed', {
        detail: {
          themeId: config.id,
          config,
        },
      })
    );
  }

  return config;
}
