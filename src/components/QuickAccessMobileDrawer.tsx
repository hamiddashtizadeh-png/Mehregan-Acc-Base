import React from 'react';
import {
  Zap,
  X,
  ShoppingCart,
  ShoppingBag,
  Package,
  Landmark,
  Wrench,
  BookOpen,
  Users,
  Settings,
  Shield,
  FileText,
  LayoutDashboard,
  Sliders,
  Scale,
  UtensilsCrossed,
  Truck,
  Smartphone,
} from 'lucide-react';

interface QuickAccessMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  companyName?: string;
}

export const QuickAccessMobileDrawer: React.FC<QuickAccessMobileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  companyName = 'مهرگان',
}) => {
  if (!isOpen) return null;

  const modules = [
    {
      id: 'DASHBOARD',
      title: 'داشبورد مدیریتی',
      subtitle: 'خلاصه وضعیت، فروش و سود',
      icon: LayoutDashboard,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'SALES',
      title: 'فروش و POS',
      subtitle: 'فاکتور سریع، پیش‌فاکتور و مرجوعی',
      icon: ShoppingCart,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'PURCHASES',
      title: 'خرید و تدارکات',
      subtitle: 'فاکتور خرید و بهای تمام‌شده',
      icon: ShoppingBag,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'INVENTORY',
      title: 'کالا و انبارداری',
      subtitle: 'کاردکس ریالی، سریال و موجودی',
      icon: Package,
      colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'TREASURY',
      title: 'دریافت و پرداخت',
      subtitle: 'صندوق، بانک و چک‌های صیادی',
      icon: Landmark,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'INSTALLATION',
      title: 'خدمات و کارتابل نصاب',
      subtitle: 'پروژه‌ها، نصب و درخواست کالا',
      icon: Wrench,
      colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    {
      id: 'ACCOUNTING',
      title: 'حسابداری دوطرفه',
      subtitle: 'اسناد، تراز و سود زیان',
      icon: BookOpen,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'PARTIES',
      title: 'اشخاص و مشتریان',
      subtitle: 'حساب مشتریان، نصابان و تامین‌کنندگان',
      icon: Users,
      colorClass: 'bg-violet-50 text-violet-700 border-violet-200',
    },
    {
      id: 'SETTINGS_HEALTH',
      title: 'تنظیمات و سیستم',
      subtitle: 'شبکه، دیتابیس و تونل کلودفلر',
      icon: Settings,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'USERS',
      title: 'مدیریت کاربران',
      subtitle: 'حساب‌ها و رمزهای عبور',
      icon: Users,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'RBAC',
      title: 'سطوح دسترسی RBAC',
      subtitle: 'نقش‌ها و مجوزهای صریح',
      icon: Shield,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'AUDIT',
      title: 'لاگ‌های امنیتی Audit',
      subtitle: 'ردیابی تغییرات و رویدادها',
      icon: FileText,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      <div
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 p-5 space-y-4 shadow-2xl overflow-y-auto max-h-[85dvh] text-right dir-rtl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow-xs">
              <Zap className="h-5 w-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>میانبرهای دسترسی سریع</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {companyName} ERP
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                کلیک روی هر آیکون، مستقیماً شما را به ماژول مربوطه منتقل می‌کند
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Action Tiles Grid (3 Columns on Mobile, 2 on Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {modules.map((m) => {
            const IconComp = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onNavigate(m.id);
                  onClose();
                }}
                className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex flex-col items-center text-center gap-2 transition-all active:scale-[0.97] cursor-pointer group min-h-[85px] justify-center"
              >
                <div className={`p-2.5 rounded-xl border ${m.colorClass} group-hover:scale-105 transition-transform`}>
                  <IconComp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-snug">{m.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-1">{m.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Close Button for Mobile Accessibility */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            بستن منوی دسترسی
          </button>
        </div>
      </div>
    </div>
  );
};
