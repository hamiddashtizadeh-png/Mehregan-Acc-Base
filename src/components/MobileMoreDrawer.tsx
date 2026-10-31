import {
  X,
  Settings,
  Package,
  BookOpen,
  Wrench,
  Users,
  Shield,
  FileText,
  Database,
  KeyRound,
  LogOut,
  Building2,
  ChevronLeft,
  ShoppingBag,
  ShoppingCart,
  Landmark,
  Scale,
  UtensilsCrossed,
  Truck,
  Smartphone,
  Layers,
  Boxes,
  Sparkles,
} from 'lucide-react';
import { FoundationDataResponse } from '../types/foundation';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  foundationData: FoundationDataResponse | null;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  foundationData,
  onOpenChangePassword,
  onLogout,
}) => {
  if (!isOpen) return null;

  const features = foundationData?.industryProfile?.features || {
    enableInstallationServices: true,
  };
  const enableDoubleEntryAccounting =
    foundationData?.settings?.enableDoubleEntryAccounting !== false;
  const profileCode = foundationData?.industryProfile?.code || 'CCTV_SECURITY';
  const activeUser = foundationData?.activeUser;

  const handleSelectTab = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  const moreSections = [
    {
      title: 'امکانات و ابزارهای پیشرفته',
      items: [
        {
          id: 'BUSINESS_FEATURES_HUB',
          title: 'مرکز امکانات و قابلیت‌ها (Features Hub)',
          desc: 'درگاه یکپارچه دسترسی به تمامی ابزارهای پیشرفته، فعال و برنامه‌ریزی‌شده',
          icon: Boxes,
          color: 'bg-indigo-600 text-white border-indigo-700 font-extrabold',
          isHighlighted: true,
        },
      ],
    },
    {
      title: 'مدیریت زنجیره تأمین و کالا',
      items: [
        {
          id: 'INVENTORY',
          title: 'کالا و انبارداری',
          desc: 'کاردکس ریالی، موجودی انبار، نقطه سفارش و بارکد',
          icon: Package,
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        },
        {
          id: 'PURCHASES',
          title: 'خرید و تدارکات',
          desc: 'فاکتور خرید، تأمین کالا و بهای تمام‌شده',
          icon: ShoppingBag,
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        ...(features.enableInstallationServices
          ? [
              {
                id: 'INSTALLATION',
                title: 'خدمات و کارتابل نصب',
                desc: 'پروژه‌های کاری، کارتابل تکنسین و درخواست کالا',
                icon: Wrench,
                color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
              },
            ]
          : []),
      ],
    },
    ...(enableDoubleEntryAccounting
      ? [
          {
            title: 'حسابداری و تراز مالی',
            items: [
              {
                id: 'ACCOUNTING',
                title: 'حسابداری کل و دوطرفه',
                desc: 'اسناد دوبل حسابداری، دفاتر کل و روزنامه، تراز آزمایشی',
                icon: BookOpen,
                color: 'bg-teal-50 text-teal-700 border-teal-200',
              },
            ],
          },
        ]
      : []),
    {
      title: 'امنیت، کاربران و تنظیمات سیستم',
      items: [
        {
          id: 'USERS',
          title: 'مدیریت کاربران و پرسنل',
          desc: 'تعریف کاربران، تخصیص نقش و تنظیم رمز عبور',
          icon: Users,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
          id: 'RBAC',
          title: 'سطوح دسترسی RBAC',
          desc: 'ماتریس مجوزهای دسترسی و قوانین امنیتی نقش‌ها',
          icon: Shield,
          color: 'bg-violet-50 text-violet-700 border-violet-200',
        },
        {
          id: 'AUDIT',
          title: 'لاگ‌های امنیتی Audit',
          desc: 'ردیابی دقیق تغییرات، حذف و رویدادهای کاربران',
          icon: FileText,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
        },
        {
          id: 'DEPLOYMENT',
          title: 'استقرار شبکه و دیتابیس',
          desc: 'وضعیت اتصال PostgreSQL، کلودفلر تونل و همگام‌سازی',
          icon: Database,
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          id: 'SETTINGS_HEALTH',
          title: 'تنظیمات و صنف کاری',
          desc: 'مشخصات شرکت، سال مالی و سلامت زیرساخت سیستم',
          icon: Settings,
          color: 'bg-slate-100 text-slate-900 border-slate-300',
        },
      ],
    },
    ...(profileCode === 'GOLD_JEWELRY'
      ? [
          {
            title: 'ماژول تخصصی صنف',
            items: [
              {
                id: 'GOLD_DUAL_LEDGER',
                title: 'دفتر دوبل طلا و جواهر',
                desc: 'حسابداری وزنی و ریالی معاملات همکاران',
                icon: Scale,
                color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
              },
            ],
          },
        ]
      : profileCode === 'RESTAURANT_CAFE'
      ? [
          {
            title: 'ماژول تخصصی صنف',
            items: [
              {
                id: 'RESTAURANT_CAFE',
                title: 'رستوران و کافی‌شاپ',
                desc: 'مدیریت میزها، سفارشات سالن و چاپ آشپزخانه',
                icon: UtensilsCrossed,
                color: 'bg-rose-50 text-rose-800 border-rose-200',
              },
            ],
          },
        ]
      : profileCode === 'WHOLESALE_DISTRIBUTION'
      ? [
          {
            title: 'ماژول تخصصی صنف',
            items: [
              {
                id: 'WHOLESALE_DISTRIBUTION',
                title: 'پخش مویرگی و عمده‌فروشی',
                desc: 'سفارشات عمده و بارنامه توزیع',
                icon: Truck,
                color: 'bg-sky-50 text-sky-800 border-sky-200',
              },
            ],
          },
        ]
      : profileCode === 'MOBILE_ELECTRONICS'
      ? [
          {
            title: 'ماژول تخصصی صنف',
            items: [
              {
                id: 'MOBILE_ELECTRONICS',
                title: 'تعمیرات موبایل و الکترونیک',
                desc: 'پذیرش دستگاه، پیگیری تعمیر و قطعات',
                icon: Smartphone,
                color: 'bg-cyan-50 text-cyan-800 border-cyan-200',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 p-5 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto text-right dir-rtl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">سایر بخش‌ها و امکانات (بیشتر)</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {foundationData?.settings?.companyName || 'مهرگان'} · سال مالی{' '}
                <span className="font-mono">{foundationData?.settings?.activeFiscalYearCode || '1405'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        {activeUser && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {activeUser.fullName ? activeUser.fullName.charAt(0) : 'م'}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">{activeUser.fullName || activeUser.username}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  سمت: <strong className="text-slate-700">{activeUser.jobTitle || 'کاربر سیستم'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  title="تغییر کلمه عبور"
                  className="p-2 text-slate-600 hover:text-blue-700 rounded-xl hover:bg-white border border-slate-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  title="خروج از حساب"
                  className="p-2 text-rose-600 hover:text-rose-800 rounded-xl hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4 pt-1">
          {moreSections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-[11px] font-black text-slate-500 px-1">{sec.title}</div>
              <div className="grid grid-cols-1 gap-2">
                {sec.items.map((item) => {
                  const IconC = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between text-right transition-all active:scale-[0.98] cursor-pointer group min-h-[54px] touch-manipulation"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border ${item.color} shrink-0`}>
                          <IconC className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">{item.desc}</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0 mr-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-colors touch-manipulation active:scale-[0.98] cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
