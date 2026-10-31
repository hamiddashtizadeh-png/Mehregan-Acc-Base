import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Plus,
  Send,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  Sliders,
  DollarSign,
  Package,
  Wrench,
  ChevronLeft,
  Eye,
  SlidersHorizontal,
  Flame,
  Check,
  Video,
  FileCheck,
  Building,
  Car,
  Shield,
  Activity,
  Layers,
  ShoppingBag,
  Maximize2,
  Power,
  Camera,
} from 'lucide-react';
import { FoundationDataResponse } from '../types/foundation';

interface ThemeHeroLayoutShowcaseProps {
  themeId: string;
  foundationData: FoundationDataResponse;
  onNavigateTab: (tab: string) => void;
  onOpenThemeModal: () => void;
}

export const ThemeHeroLayoutShowcase: React.FC<ThemeHeroLayoutShowcaseProps> = ({
  themeId,
  foundationData,
  onNavigateTab,
  onOpenThemeModal,
}) => {
  // Safe stats
  const totalSalesIrr = (foundationData.salesInvoices || []).reduce(
    (sum, inv) => sum + (inv.totalInvoiceAmountIrr || 0),
    0
  );
  const totalSalesToman = Math.round(totalSalesIrr / 10);
  const companyName = foundationData.settings?.companyName || 'مهرگان';

  // Toggle state for iSee Smart Hub switches
  const [smartSwitches, setSmartSwitches] = useState<{ [key: string]: boolean }>({
    hood: true,
    tap: true,
    fridge: false,
    security: true,
  });

  const toggleSwitch = (key: string) => {
    setSmartSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // State for Chaapline options
  const [chaapPaper, setChaapPaper] = useState<'A4' | 'A5' | 'A3'>('A4');
  const [chaapDoubleSided, setChaapDoubleSided] = useState(true);
  const [chaapBinding, setChaapBinding] = useState(true);

  // 1. ACRU LIME MINIMALIST FINANCIAL THEME VARIANT
  if (themeId === 'acru_lime_financial') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          {/* Top Bar with Add Widget and Financial Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-lime-500 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>چیدمان و داشبورد مالی اختصاصی ACRU</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-lime-900 border border-lime-300">
                    الگوی مالی فعال
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  تحلیل و پایش جریان نقدی، گیج سلامت مالی، کارت‌های پرداخت سریع و سقف اعتبارات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                تغییر قالب
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="px-3.5 py-1.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت تراکنش جدید</span>
              </button>
            </div>
          </div>

          {/* 3-Column ACRU Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            {/* Column 1: Financial Health Gauge (75% Gauge Chart) */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-800">شاخص سلامت مالی (Financial Health)</span>
                  <span className="font-mono text-[11px] text-slate-400">۳۰ روزه</span>
                </div>
                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                    {totalSalesToman.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">تومان</span>
                  <span className="mr-2 text-[11px] font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full">
                    ↑ ۱۷.۵٪ رشد
                  </span>
                </div>

                {/* Circular Gauge Representation */}
                <div className="relative w-36 h-20 mx-auto mt-2 overflow-hidden flex items-end justify-center">
                  <svg className="w-36 h-36 -rotate-180 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#84cc16"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset="62.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute bottom-1 text-center">
                    <span className="text-xl font-black font-mono text-slate-900">۷۵٪</span>
                    <span className="block text-[9px] text-slate-400">شاخص بازدهی</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 flex justify-between">
                <span>تراز کل حساب‌ها:</span>
                <span className="font-bold text-slate-900 font-mono">وضعیت بهینه و مثبت</span>
              </div>
            </div>

            {/* Column 2: ACRU Visa Green Debit Card Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-lime-600 via-lime-700 to-emerald-800 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-lime-100">
                <span className="font-bold">کارت تنخواه و صندوق ارزی</span>
                <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded">نقدی</span>
              </div>

              <div className="my-4">
                <div className="text-[11px] text-lime-200">موجودی صندوق نقدی اصلی:</div>
                <div className="text-xl font-black font-mono tracking-wider mt-1">
                  {(totalSalesToman > 0 ? totalSalesToman * 0.4 : 12450000).toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal">تومان</span>
                </div>
                <div className="text-[11px] font-mono text-lime-200 mt-2">
                  •••• •••• •••• ۷۸۹۰
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-white/20 text-center text-[10px]">
                <button
                  type="button"
                  onClick={() => onNavigateTab('TREASURY')}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  واریز
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('TREASURY')}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  انتقال
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('SALES')}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  درخواست
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('ACCOUNTING')}
                  className="p-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  گردش
                </button>
              </div>
            </div>

            {/* Column 3: Monthly Spending Limit & Quick Tips */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">سقف مجاز بودجه و مخارج ماهانه</span>
                <span className="text-lime-700 font-mono font-bold">۸۶٪</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div className="bg-lime-500 h-2.5 rounded-full" style={{ width: '86%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>مصرف شده: ۸,۶۰۰,۰۰۰</span>
                <span>سقف: ۱۰,۰۰۰,۰۰۰ تومان</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  💡 <strong>پیشنهاد سیستم ACRU:</strong> برای بهبود نقدینگی تا پایان هفته، پیش‌فاکتورهای باز تأییدشده را با اعمال ۳٪ تخفیف نقدی به تسویه برسانید.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CONCEPTZILLA ORANGE CRM THEME VARIANT
  if (themeId === 'conceptzilla_orange_crm') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-orange-200/80 shadow-xs">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-orange-600 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>میزکار و خط لوله فروش Conceptzilla CRM</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300">
                    الگوی CRM نارنجی
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  سرنخ‌های داغ (Hot Leads)، امتیازدهی، اشتراک دسترسی و تبدیل مشتریان
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                تغییر قالب
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ثبت مشتری / سرنخ جدید</span>
              </button>
            </div>
          </div>

          {/* CRM Metric Badges Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80">
              <div className="flex items-center justify-between text-xs text-orange-900">
                <span className="font-bold">سرنخ‌های داغ (Hot Leads)</span>
                <Flame className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black font-mono text-orange-950 mt-1">۹ پرونده</div>
              <div className="text-[10px] text-orange-700 font-medium">نیاز به تماس تا پایان وقت</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold">سرنخ‌های واجد شرایط</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">۱۸ مشتری</div>
              <div className="text-[10px] text-emerald-700 font-medium">↑ ۴.۲٪ نرخ تبدیل</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold">ارزش سبد فرصت‌ها</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {(totalSalesToman * 0.75 || 48000000).toLocaleString('fa-IR')}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">تومان در مرحله مذاکره</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold">تعداد کل طرف‌حساب‌ها</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                {(foundationData.parties || []).length.toLocaleString('fa-IR')}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">مشتری، همکار و پیمانکار</div>
            </div>
          </div>

          {/* Pill Navigation Bar */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto text-xs">
            <span className="font-bold text-slate-400 pl-2">فیلتر سرنخ‌ها:</span>
            <button
              type="button"
              className="px-3.5 py-1 rounded-full bg-orange-600 text-white font-black cursor-pointer shadow-xs"
            >
              همه (۲۴۸)
            </button>
            <button
              type="button"
              className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              برگزیده (Favourite)
            </button>
            <button
              type="button"
              className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              سرنخ جدید (۴۲)
            </button>
            <button
              type="button"
              className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ارجاع به من
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. SALESFORCE GLASS GRADIENT THEME VARIANT
  if (themeId === 'salesforce_glass_gradient') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>داشبورد استارت‌آپی مدرن Salesforce</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                    گلاس‌مورفیک گرادیان
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  کارت‌های گرادیان آینده‌نگرانه، پایش فرصت‌ها و گزارش جذب سرمایه و فروش
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                تغییر قالب
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                Opportunities (فرصت‌ها)
              </button>
            </div>
          </div>

          {/* Salesforce Colorful Translucent Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500/90 to-purple-600 text-white shadow-md relative overflow-hidden">
              <span className="text-xs font-medium text-indigo-100">فروش نهایی دوره (Closed Sales)</span>
              <div className="text-2xl font-black font-mono mt-1">
                {totalSalesToman.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-normal">تومان</span>
              </div>
              <div className="text-[11px] text-indigo-100 mt-2 flex items-center gap-1">
                <span>تعداد معاملات قطعی:</span>
                <span className="font-mono font-bold">{(foundationData.salesInvoices || []).length}</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-500/90 to-rose-600 text-white shadow-md relative overflow-hidden">
              <span className="text-xs font-medium text-pink-100">میانگین ارزش قراردادها (Average Deal)</span>
              <div className="text-2xl font-black font-mono mt-1">
                {(totalSalesToman > 0
                  ? Math.round(totalSalesToman / Math.max(1, (foundationData.salesInvoices || []).length))
                  : 11950000
                ).toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-normal">تومان</span>
              </div>
              <div className="text-[11px] text-pink-100 mt-2">نرخ سود ناخالص: ۱۱.۴٪</div>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/90 to-orange-600 text-white shadow-md relative overflow-hidden">
              <span className="text-xs font-medium text-amber-100">پیش‌فاکتورهای در انتظار تایید</span>
              <div className="text-2xl font-black font-mono mt-1">
                {(foundationData.salesProformas || []).length.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-normal">پیش‌فاکتور</span>
              </div>
              <div className="text-[11px] text-amber-100 mt-2">زمان تا انقضا: ۴ الی ۱۰ روز</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. CHAAPLINE PRINT & POS THEME VARIANT
  if (themeId === 'chaapline_print_mobile') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-rose-600 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>سامانه محاسبه و صدور سفارش چاپلین (Chaapline RTL)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                    الگوی سفارشات سریع
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  فرم هوشمند محاسبه اقلام، فاکتور با کادر نقطه‌چین و دکمه مرجانی تایید
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {/* Options configuration */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">اندازه و نوع سند:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['A3', 'A4', 'A5'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setChaapPaper(size)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        chaapPaper === size
                          ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-300/40'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {size} {chaapPaper === size && '✔'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">گزینه‌های فنی و تکمیل:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setChaapDoubleSided((p) => !p)}
                    className={`p-2.5 rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between ${
                      chaapDoubleSided
                        ? 'border-rose-400 bg-rose-50/70 text-rose-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>چاپ پشت و رو</span>
                    {chaapDoubleSided && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setChaapBinding((p) => !p)}
                    className={`p-2.5 rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between ${
                      chaapBinding
                        ? 'border-rose-400 bg-rose-50/70 text-rose-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>صحافی سیمی</span>
                    {chaapBinding && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Dotted Total Card with Coral Button */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/30 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs text-slate-500 block font-medium">جمع کل فاکتور سفارش:</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                  ۵,۰۰۰,۰۰۰ <span className="text-xs font-normal text-slate-500">تومان</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">شامل هزینه چاپ، کاغذ و خدمات تکمیلی</p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('SALES')}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors cursor-pointer shadow-sm text-center"
                >
                  تأیید و ثبت سفارش نهایی
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('SALES')}
                  className="w-full py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  ذخیره برای بعد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. WORKSPACE LIME TIMELINE THEME VARIANT
  if (themeId === 'workspace_lime_timeline') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          {/* Top Lime Timeline Schedule Bar */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 text-slate-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 font-black text-xs">
              <Calendar className="w-4 h-4" />
              <span>زمان‌بندی امروز (Your Schedule):</span>
              <span className="bg-black/15 px-2 py-0.5 rounded-full font-mono text-[11px]">
                ساعت ۱۴:۰۰ جلسه بررسی پروژه
              </span>
              <span className="bg-black/15 px-2 py-0.5 rounded-full font-mono text-[11px] hidden sm:inline">
                ساعت ۱۵:۳۰ تحویل کالا
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-black">
              <span>
                ۳۴ <span className="font-sans font-normal text-[10px]">قرارداد</span>
              </span>
              <span className="text-emerald-950 font-bold">
                ۲۰ <span className="font-sans font-normal text-[10px]">موفق</span>
              </span>
              <span className="text-rose-950 font-bold">
                ۳ <span className="font-sans font-normal text-[10px]">از دست رفته</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-2">
            <div>
              <h4 className="font-black text-sm text-slate-900">کارتابل وظایف روز و جلسات کاری Workspace</h4>
              <p className="text-xs text-slate-500">پایش وظایف روزانه، خلاصه‌سازی اسناد و ارتباط با مشتریان</p>
            </div>
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. VOLVO LUXURY MINIMALIST THEME VARIANT
  if (themeId === 'volvo_luxury_minimalist') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-[#f4f5f7] rounded-3xl p-6 border border-slate-300/80 shadow-xs text-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                Scandinavian Studio Design
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                طراحی لوکس و مینیمال ولوو (Volvo Minimalist Studio)
              </h3>
              <p className="text-xs text-slate-500">
                طوسی آتلیه‌ای، کنتراست فوق‌العاده با دکمه‌های زمردی و کارت‌های دارایی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                تغییر قالب
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                اقدام سریع
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold">گردش نقدینگی</span>
              <div className="text-xl font-black font-mono mt-1 text-slate-900">
                {totalSalesToman.toLocaleString('fa-IR')} <span className="text-xs font-normal">تومان</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold">تعداد اقلام انبار</span>
              <div className="text-xl font-black font-mono mt-1 text-slate-900">
                {(foundationData.items || []).length} <span className="text-xs font-normal">ردیف</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-bold">وضعیت سیستم</span>
              <div className="text-base font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>۱۰۰٪ پایدار و همگام</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. CYBER DARK NEON THEME VARIANT
  if (themeId === 'cyber_dark_neon') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-[#121929] rounded-3xl p-5 border border-cyan-500/40 shadow-2xl text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-cyan-400 rounded-full shadow-[0_0_12px_#06b6d4]" />
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>مرکز پایش تاریک و نیئونی Cyber Dark Hub</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                    OLED Dark Mode
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  محیط دارک مود با خطوط نوری فیروزه‌ای، نمودار تلمتری زنده و کارت‌های سه‌بعدی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/80 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-[#1a233a] border border-cyan-500/30 shadow-lg">
              <div className="text-xs text-cyan-300 font-bold flex items-center justify-between">
                <span>جریان زنده فروش (Telemetry)</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {totalSalesToman.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">تومان</span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono mt-1">Multi: 2.54x LIVE</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a233a] border border-purple-500/30 shadow-lg">
              <div className="text-xs text-purple-300 font-bold flex items-center justify-between">
                <span>تراکنش‌های ثبت شده</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                {(foundationData.salesInvoices || []).length + (foundationData.purchaseInvoices || []).length}{' '}
                <span className="text-xs font-normal text-slate-400">سند</span>
              </div>
              <div className="text-[10px] text-purple-400/80 font-mono mt-1">Latency: 12ms</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1a233a] border border-emerald-500/30 shadow-lg">
              <div className="text-xs text-emerald-300 font-bold flex items-center justify-between">
                <span>امنیت پایگاه داده</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-black text-emerald-300 mt-2">رمزنگاری شده</div>
              <div className="text-[10px] text-emerald-400/80 font-mono mt-1">AES-256 Verified</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. SUGARCRM JOURNEY NODES THEME VARIANT
  if (themeId === 'sugarcrm_journey_nodes') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>نقشه راه و دیاگرام گردش کار SugarCRM (Journey Nodes)</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-200">
                  فرایندهای متصل
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                گام‌های متوالی از پیش‌فاکتور تا تایید اعتباری، خروج انبار و تسویه نهایی
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          {/* Connected Process Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 relative">
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full">گام ۱</span>
              <p className="font-extrabold text-slate-900 mt-1.5">ثبت پیش‌فاکتور</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{(foundationData.salesProformas || []).length} مورد باز</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 relative">
              <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full">گام ۲</span>
              <p className="font-extrabold text-slate-900 mt-1.5">بررسی اعتبار و تخفیف</p>
              <p className="text-[11px] text-slate-500 mt-0.5">سقف بدهی مشتریان</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 relative">
              <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full">گام ۳</span>
              <p className="font-extrabold text-slate-900 mt-1.5">حواله خروج از انبار</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{(foundationData.items || []).length} قلم کالا</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 relative">
              <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full">گام ۴</span>
              <p className="font-extrabold text-slate-900 mt-1.5">تسویه نقدی و چک</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{(foundationData.cheques || []).length} فقره چک</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. ISEE SMART HUB (DEFAULT)
  if (themeId === 'isee_smart_hub') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-blue-600 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>کنترل هوشمند و سناریوهای iSee Smart Hub</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    الگوی هوشمندسازی
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  کارت‌های گرد ۳XL، سوییچ‌های وضعیت تجهیزات و پایش محیطی پروژه
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">پایش سیستم امنیتی</span>
                <button
                  type="button"
                  onClick={() => toggleSwitch('security')}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                    smartSwitches.security ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      smartSwitches.security ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                وضعیت: {smartSwitches.security ? 'فعال و برخط' : 'غیرفعال'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">شیر کنترل جریان</span>
                <button
                  type="button"
                  onClick={() => toggleSwitch('tap')}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                    smartSwitches.tap ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      smartSwitches.tap ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                وضعیت: {smartSwitches.tap ? 'باز و متصل' : 'قطع'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">روشنایی و تهویه هود</span>
                <button
                  type="button"
                  onClick={() => toggleSwitch('hood')}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                    smartSwitches.hood ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      smartSwitches.hood ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                وضعیت: {smartSwitches.hood ? 'روشن' : 'خاموش'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">پایش سردخانه و یخچال</span>
                <button
                  type="button"
                  onClick={() => toggleSwitch('fridge')}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
                    smartSwitches.fridge ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      smartSwitches.fridge ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                وضعیت: {smartSwitches.fridge ? 'آماده‌به‌کار' : 'متوقف'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. KHODROX RETAIL SHOP THEME VARIANT
  if (themeId === 'khodrox_retail_shop') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-blue-600 rounded-full" />
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>ویترین و فروشگاه قطعات خودرو Khodrox Retail</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    الگوی فروشگاهی
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  کاتالوگ محصولات با بازه قیمت، پرفروش‌ترین‌ها و تسویه سریع
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenThemeModal}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              تغییر قالب
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">دسته قطعات و ملزومات</span>
              <p className="text-sm font-black text-slate-900 mt-1">لوازم یدکی و دوربین خودرو</p>
              <div className="text-xs text-blue-700 font-mono mt-1 font-bold">۸,۵۲۹,۰۰۰ تومان</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">تجهیزات سیستم ایمنی</span>
              <p className="text-sm font-black text-slate-900 mt-1">سنسور دنده عقب و مانیتور</p>
              <div className="text-xs text-blue-700 font-mono mt-1 font-bold">۴,۱۵۰,۰۰۰ تومان</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">خدمات نصب در محل</span>
              <p className="text-sm font-black text-slate-900 mt-1">سیم‌کشی و راه‌اندازی کامل</p>
              <div className="text-xs text-blue-700 font-mono mt-1 font-bold">۹۵۰,۰۰۰ تومان</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT FALLBACK
  return null;
};
