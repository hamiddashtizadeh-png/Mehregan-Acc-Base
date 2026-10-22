import React, { useEffect, useState } from 'react';
import {
  Building2,
  ShieldCheck,
  DatabaseBackup,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Pencil,
  Trash2,
  KeyRound,
  Sliders,
  Store,
  Wrench,
  Shield,
  Check,
  ShoppingCart,
  BookOpen,
  Smartphone,
  Gem,
  Utensils,
  Truck,
  Palette,
  Sparkles,
  Camera,
} from 'lucide-react';
import {
  EnvDocItem,
  FoundationDataResponse,
  HealthCheckResponse,
  BankAccountRecord,
  WarehouseRecord,
  ItemCategoryRecord,
  CashBoxRecord,
  IndustryProfileCode,
  IndustryProfileConfig,
} from '../types/foundation';

interface SettingsAndHealthViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
}

const getIndustryIcon = (code: string, className = 'w-5 h-5') => {
  switch (code) {
    case 'CCTV_SECURITY':
      return <Camera className={className} />;
    case 'RETAIL_GENERAL':
      return <Store className={className} />;
    case 'MOBILE_ELECTRONICS':
      return <Smartphone className={className} />;
    case 'WHOLESALE_DISTRIBUTION':
      return <Truck className={className} />;
    case 'SERVICES_CONTRACTING':
      return <Wrench className={className} />;
    case 'GOLD_JEWELRY':
      return <Gem className={className} />;
    case 'RESTAURANT_CAFE':
      return <Utensils className={className} />;
    case 'SUPERMARKET_GROCERY':
      return <ShoppingCart className={className} />;
    default:
      return <Sliders className={className} />;
  }
};

const getIndustryFeatureTags = (profile: IndustryProfileConfig): string[] => {
  const tags: string[] = [];
  if (profile.features?.enableInstallationServices) tags.push('✔ خدمات نصب و پروژه‌ها');
  if (profile.features?.enableHardwareMacTracking) {
    if (profile.code === 'MOBILE_ELECTRONICS') tags.push('✔ کد IMEI و سریال دستگاه');
    else tags.push('✔ ردیابی MAC شبکه');
  }
  if (profile.features?.enableInstallersRole) tags.push('✔ کارتابل نصابان');
  if (profile.features?.enableWarrantyTracking) tags.push('✔ گارانتی و ضمانت');
  if (profile.features?.enableBarcodeScanQuickPos) tags.push('✔ بارکدخوان و صندوق POS');

  if (profile.code === 'GOLD_JEWELRY') {
    tags.push('✔ عیار ۱۸ و مظنه لحظه‌ای', '✔ ارزش‌افزوده روی اجرت و سود', '✔ تهاتر طلای مستعمل');
  } else if (profile.code === 'RESTAURANT_CAFE') {
    tags.push('✔ منوی تصویری و لمسی', '✔ سفارشات سالن و بیرون‌بر', '✔ چاپ بن آشپزخانه');
  } else if (profile.code === 'WHOLESALE_DISTRIBUTION') {
    tags.push('✔ کارتن و بسته', '✔ نرخ همکار و تیراژ', '✔ سقف اعتبار مشتری');
  } else if (profile.code === 'SERVICES_CONTRACTING') {
    tags.push('✔ تیکت کار و سفارش فنی', '✔ مصرف قطعات در محل');
  } else if (profile.code === 'MOBILE_ELECTRONICS') {
    tags.push('✔ رهگیری دوگانه IMEI 1 و IMEI 2', '✔ کارتابل پذیرش تعمیرات', '✔ استعلام رجیستری و گارانتی شرکتی');
  }

  tags.push('✔ سازگار با حسابداری دوبل');
  return tags;
};

const DEFAULT_SYSTEM_PROFILES: IndustryProfileConfig[] = [
  {
    code: 'CCTV_SECURITY',
    titleFa: 'دوربین مداربسته و سیستم‌های حفاظتی',
    descriptionFa: 'پروفایل جامع مهندسی نظارت تصویری؛ شامل پروژه‌ها، سفارشات نصب و کابل‌کشی، کارتابل نصابان و ردیابی تخصصی سریال و MAC آدرس شبکه.',
    badgeLabelFa: 'صنف نظارت تصویری و حفاظتی',
    features: {
      enableInstallationServices: true,
      enableHardwareMacTracking: true,
      enableInstallersRole: true,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'cctv',
      primaryColor: '#0284c7',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'text-emerald-700',
      headerBrandTitleFa: 'سامانه جامع ERP و نظارت تصویری',
    },
  },
  {
    code: 'RETAIL_GENERAL',
    titleFa: 'فروشگاه و خرده‌فروشی عمومی',
    descriptionFa: 'متمرکز بر فروش سریع بارکدی POS، خرید، انبارداری استاندارد، حسابداری دوبل و خزانه‌داری بدون پیچیدگی‌های خدمات نصب.',
    badgeLabelFa: 'صنف فروشگاه و خرده‌فروشی',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'retail',
      primaryColor: '#2563eb',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-700',
      headerBrandTitleFa: 'سامانه فروشگاهی و خرده‌فروشی عمومی',
    },
  },
  {
    code: 'MOBILE_ELECTRONICS',
    titleFa: 'موبایل، رایانه و لوازم الکترونیک',
    descriptionFa: 'شامل رهگیری کد IMEI و شماره سریال، خدمات گارانتی دستگاه‌ها، انبار قطعات و لوازم جانبی و صندوق سریع فروشگاهی POS.',
    badgeLabelFa: 'صنف موبایل و الکترونیک',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: true,
      enableInstallersRole: false,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'mobile',
      primaryColor: '#0284c7',
      badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      badgeText: 'text-cyan-800',
      headerBrandTitleFa: 'سامانه فروشگاه موبایل و الکترونیک',
    },
  },
  {
    code: 'WHOLESALE_DISTRIBUTION',
    titleFa: 'پخش عمده، بازرگانی و بنکداری',
    descriptionFa: 'شامل واحدهای بسته‌بندی کارتن و جزء، نرخ همکار و تخفیفات تیراژ، حساب ویزیتورها و موزعین و کنترل سقف اعتبار باز مشتریان.',
    badgeLabelFa: 'صنف پخش عمده و بنکداری',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'wholesale',
      primaryColor: '#0f766e',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-300',
      badgeText: 'text-teal-800',
      headerBrandTitleFa: 'سامانه پخش عمده و بازرگانی',
    },
  },
  {
    code: 'SERVICES_CONTRACTING',
    titleFa: 'خدمات فنی، مهندسی و تعمیرات',
    descriptionFa: 'شامل ارجاع تیکت و سفارش کار به تکنسین‌ها، پروژه‌ها و قراردادهای اجرایی، مصرف قطعات در محل و تسویه دستمزد مجریان.',
    badgeLabelFa: 'صنف خدمات و پیمانکاری',
    features: {
      enableInstallationServices: true,
      enableHardwareMacTracking: false,
      enableInstallersRole: true,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: false,
    },
    theme: {
      id: 'services',
      primaryColor: '#4f46e5',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      badgeText: 'text-indigo-800',
      headerBrandTitleFa: 'سامانه خدمات فنی و مهندسی',
    },
  },
  {
    code: 'GOLD_JEWELRY',
    titleFa: 'طلا، جواهر و نقره‌فروشی',
    descriptionFa: 'شامل مدیریت وزن (گرم و سوت)، عیار ۱۸، اجرت ساخت، مظنه زنده، ارزش افزوده روی سود و اجرت و تهاتر طلای مستعمل/شکسته.',
    badgeLabelFa: 'صنف طلا و جواهرات',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: true,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'gold',
      primaryColor: '#d97706',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      badgeText: 'text-amber-800',
      headerBrandTitleFa: 'سامانه جامع مدیریت طلا و جواهرات',
    },
  },
  {
    code: 'RESTAURANT_CAFE',
    titleFa: 'رستوران، فست‌فود و کافی‌شاپ',
    descriptionFa: 'شامل منوی لمسی سریع، تفکیک سفارشات سالن و بیرون‌بر، مدیریت میزها، چاپ بن آشپزخانه و پایش مواد اولیه آشپزخانه.',
    badgeLabelFa: 'صنف رستوران و کافه',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'restaurant',
      primaryColor: '#ea580c',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-300',
      badgeText: 'text-orange-800',
      headerBrandTitleFa: 'سامانه مدیریت رستوران و کافه',
    },
  },
  {
    code: 'SUPERMARKET_GROCERY',
    titleFa: 'سوپرمارکت، هایپرمارکت و مواد غذایی',
    descriptionFa: 'متمرکز بر فروش فوق‌سریع بارکدی، صندوق لمسی POS، کاردکس انبار استاندارد و گردش مالی بدون خدمات نصب.',
    badgeLabelFa: 'صنف سوپرمارکت و مواد غذایی',
    features: {
      enableInstallationServices: false,
      enableHardwareMacTracking: false,
      enableInstallersRole: false,
      enableWarrantyTracking: false,
      enableBarcodeScanQuickPos: true,
    },
    theme: {
      id: 'grocery',
      primaryColor: '#059669',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badgeText: 'text-amber-700',
      headerBrandTitleFa: 'سامانه فروشگاهی سوپرمارکت و مواد غذایی',
    },
  },
];

export const SettingsAndHealthView: React.FC<SettingsAndHealthViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [companyName, setCompanyName] = useState(foundationData.settings.companyName);
  const [economicCode, setEconomicCode] = useState(foundationData.settings.economicCode);
  const [nationalId, setNationalId] = useState(foundationData.settings.nationalId);
  const [phone, setPhone] = useState(foundationData.settings.phone);
  const [addressFa, setAddressFa] = useState(foundationData.settings.addressFa);
  const [displayCurrency, setDisplayCurrency] = useState<'IRT' | 'IRR'>(
    foundationData.settings.displayCurrencyCode
  );

  // Document Numbering Prefixes
  const cfg = foundationData.settings.documentNumbering || {
    salesInvoicePrefix: 'INV-1405-',
    salesProformaPrefix: 'SQO-1405-',
    purchaseInvoicePrefix: 'PI-1405-',
    purchaseProformaPrefix: 'PO-1405-',
    treasuryReceiptPrefix: 'REC-1405-',
    treasuryPaymentPrefix: 'PAY-1405-',
    accountingDocPrefix: 'DOC-1405-',
    projectPrefix: 'PRJ-1405-',
    installationPrefix: 'INS-1405-',
    expensePrefix: 'EXP-1405-',
    incomePrefix: 'INC-1405-',
  };

  const [salesInvoicePrefix, setSalesInvoicePrefix] = useState(cfg.salesInvoicePrefix);
  const [purchaseInvoicePrefix, setPurchaseInvoicePrefix] = useState(cfg.purchaseInvoicePrefix);
  const [treasuryReceiptPrefix, setTreasuryReceiptPrefix] = useState(cfg.treasuryReceiptPrefix);
  const [treasuryPaymentPrefix, setTreasuryPaymentPrefix] = useState(cfg.treasuryPaymentPrefix);
  const [accountingDocPrefix, setAccountingDocPrefix] = useState(cfg.accountingDocPrefix);
  const [receiptFooterMessageFa, setReceiptFooterMessageFa] = useState(
    foundationData.settings.receiptFooterMessageFa ||
      'از خرید شما سپاسگزاریم. کلیه تجهیزات دارای ۲۴ ماه گارانتی طلایی شرکت مهرگان می‌باشند.'
  );
  const [defaultWarehouseId, setDefaultWarehouseId] = useState(foundationData.settings.defaultWarehouseId || 1);
  const [defaultCashBoxId, setDefaultCashBoxId] = useState(foundationData.settings.defaultCashBoxId || 1);
  const [defaultBankAccountId, setDefaultBankAccountId] = useState(foundationData.settings.defaultBankAccountId || 1);
  const [enableDoubleEntryAccounting, setEnableDoubleEntryAccounting] = useState<boolean>(
    foundationData.settings.enableDoubleEntryAccounting !== false
  );
  const [regeneratingVouchers, setRegeneratingVouchers] = useState(false);

  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [envDocs, setEnvDocs] = useState<EnvDocItem[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'SUCCESS' | 'ERROR';
    textFa: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegenerateMissingVouchers = async () => {
    setRegeneratingVouchers(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/accounting/regenerate-missing-vouchers', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedbackMsg({
          type: 'SUCCESS',
          textFa: data.messageFa || 'اسناد اتوماتیک جامانده با موفقیت بازسازی شدند.',
        });
        await onRefresh();
      } else {
        setFeedbackMsg({
          type: 'ERROR',
          textFa: data.messageFa || 'خطا در بازسازی اسناد جامانده.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'ERROR', textFa: 'خطای شبکه در بازسازی اسناد جامانده.' });
    } finally {
      setRegeneratingVouchers(false);
    }
  };

  // Master Definition Editing Modal States
  const [editingBank, setEditingBank] = useState<BankAccountRecord | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseRecord | null>(null);
  const [editingCategory, setEditingCategory] = useState<ItemCategoryRecord | null>(null);
  const [editingCashBox, setEditingCashBox] = useState<CashBoxRecord | null>(null);

  const handleDeleteMaster = async (endpoint: string, title: string) => {
    if (!window.confirm(`آیا از حذف امن ${title} اطمینان دارید؟`)) return;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
        await onRefresh();
      } else {
        setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در حذف.' });
      }
    } catch {
      setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارتباط با سرور.' });
    }
  };

  const loadHealthAndDocs = async () => {
    try {
      const [hRes, eRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/foundation/env-docs'),
      ]);
      const hData = await hRes.json();
      const eData = await eRes.json();
      setHealthData(hData);
      if (eData.ok) setEnvDocs(eData.envDocumentation);
    } catch {
      // transient
    }
  };

  const [selectedIndustryProfile, setSelectedIndustryProfile] = useState<IndustryProfileCode>(
    foundationData.settings.industryProfileCode || 'CCTV_SECURITY'
  );
  const [availableProfiles, setAvailableProfiles] = useState<IndustryProfileConfig[]>([]);
  const [switchingProfile, setSwitchingProfile] = useState(false);

  useEffect(() => {
    loadHealthAndDocs();
    fetch('/api/foundation/industry-profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.profiles) && data.profiles.length > 0) {
          setAvailableProfiles(data.profiles);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (foundationData.settings.industryProfileCode) {
      setSelectedIndustryProfile(foundationData.settings.industryProfileCode);
    }
  }, [foundationData.settings.industryProfileCode]);

  const canManageSettings =
    foundationData.activeUser.isInitialAdmin ||
    foundationData.activeUser.assignedRoles?.includes('ADMIN') ||
    foundationData.activeUser.assignedRoles?.includes('OWNER');

  const handleSwitchIndustryProfile = async (newProfile: IndustryProfileCode) => {
    if (!canManageSettings) {
      setFeedbackMsg({
        type: 'ERROR',
        textFa: 'تنها راهبر کل و مدیر سیستم مجاز به تغییر صنف کاری سامانه است.',
      });
      return;
    }
    if (newProfile === selectedIndustryProfile) return;
    setSwitchingProfile(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/foundation/industry-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileCode: newProfile }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedIndustryProfile(newProfile);
        setFeedbackMsg({
          type: 'SUCCESS',
          textFa: data.messageFa || `صنف کاری به «${newProfile}» تغییر یافت.`,
        });
        await onRefresh();
      } else {
        setFeedbackMsg({
          type: 'ERROR',
          textFa: data.messageFa || 'خطا در تغییر صنف کاری.',
        });
      }
    } catch {
      setFeedbackMsg({
        type: 'ERROR',
        textFa: 'عدم برقراری ارتباط با سرور برای تغییر صنف کاری.',
      });
    } finally {
      setSwitchingProfile(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/foundation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          economicCode,
          nationalId,
          phone,
          addressFa,
          displayCurrencyCode: displayCurrency,
          enableDoubleEntryAccounting,
          industryProfileCode: selectedIndustryProfile,
          documentNumbering: {
            ...cfg,
            salesInvoicePrefix,
            purchaseInvoicePrefix,
            treasuryReceiptPrefix,
            treasuryPaymentPrefix,
            accountingDocPrefix,
          },
          defaultWarehouseId,
          defaultCashBoxId,
          defaultBankAccountId,
          receiptFooterMessageFa,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedbackMsg({
          type: 'ERROR',
          textFa: data.messageFa || 'خطا در ذخیره تنظیمات پایه.',
        });
      } else {
        setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
        await onRefresh();
      }
    } catch {
      setFeedbackMsg({ type: 'ERROR', textFa: 'خطای شبکه در ذخیره تنظیمات.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMigrations = async () => {
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/foundation/migrations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedbackMsg({
          type: 'ERROR',
          textFa: data.messageFa || 'خطا در اجرای Migration.',
        });
      } else {
        setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
        await onRefresh();
        await loadHealthAndDocs();
      }
    } catch {
      setFeedbackMsg({ type: 'ERROR', textFa: 'خطای شبکه در اعمال Migration.' });
    }
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-center justify-between ${
            feedbackMsg.type === 'SUCCESS'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
              : 'border-red-300 bg-red-50 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedbackMsg.type === 'SUCCESS' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
            )}
            <span>{feedbackMsg.textFa}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="underline hover:no-underline"
          >
            بستن
          </button>
        </div>
      )}

      {/* Industry Profile Switcher (صنف کاری و افزونه‌های تخصصی) */}
      {(() => {
        const profileList = availableProfiles.length > 0 ? availableProfiles : DEFAULT_SYSTEM_PROFILES;
        const activeProfileConfig =
          profileList.find((p) => p.code === selectedIndustryProfile) || profileList[0];
        const activeThemeColor = activeProfileConfig?.theme?.primaryColor || '#0284c7';

        return (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
            {/* Header: Prominent Active Industry Icon & Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border transition-transform duration-200"
                  style={{
                    backgroundColor: `${activeThemeColor}15`,
                    borderColor: `${activeThemeColor}40`,
                    color: activeThemeColor,
                  }}
                  title={`صنف فعال: ${activeProfileConfig?.titleFa}`}
                >
                  {getIndustryIcon(activeProfileConfig?.code || 'CCTV_SECURITY', 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">
                      انتخاب صنف کاری و افزونه‌های تخصصی (Industry Profile)
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      ۸ صنف آماده
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: `${activeThemeColor}12`,
                        borderColor: `${activeThemeColor}35`,
                        color: activeThemeColor,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: activeThemeColor }}
                      />
                      <span>صنف جاری سامانه: {activeProfileConfig?.titleFa}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    تغییر هوشمند چیدمان میزکار، تم رنگی، برچسب‌های سازمانی و فعال‌سازی افزونه‌های متناسب با رسته شغلی شما
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                فقط مدیر کل مجاز به تغییر صنف است
              </span>
            </div>

            {/* Grid of Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-stretch">
              {profileList.map((profile) => {
                const isActive = selectedIndustryProfile === profile.code;
                const primaryColor = profile.theme?.primaryColor || '#0284c7';
                const featureTags = getIndustryFeatureTags(profile);

                return (
                  <div
                    key={profile.code}
                    className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 h-full ${
                      isActive
                        ? 'border-emerald-500 bg-linear-to-b from-emerald-50/70 via-white to-white shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col flex-1 justify-between space-y-3.5">
                      {/* Top Bar: Icon, Badges & Title */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: `${primaryColor}15`,
                              border: `1.5px solid ${primaryColor}40`,
                              color: primaryColor,
                            }}
                          >
                            {getIndustryIcon(profile.code, 'w-6 h-6')}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                فعال در سامانه
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                {profile.badgeLabelFa}
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-medium text-slate-500">
                                {profile.badgeLabelFa}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3
                          className="text-sm font-black text-slate-900 leading-snug min-h-[40px] flex items-center"
                          title={profile.titleFa}
                        >
                          {profile.titleFa}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 min-h-[38px] mt-2">
                          {profile.descriptionFa}
                        </p>
                      </div>

                      {/* Theme Info & Color Ribbon */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border-2 border-white ring-1 ring-slate-200"
                              style={{ backgroundColor: primaryColor }}
                              title={`کد رنگ تم: ${primaryColor}`}
                            />
                            <span className="text-slate-700 font-semibold truncate text-[11px]">
                              {profile.theme?.headerBrandTitleFa || `تم اختصاصی ${profile.titleFa}`}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-medium ltr">
                            {primaryColor}
                          </span>
                        </div>

                        {/* Feature Tags */}
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {featureTags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/80 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {featureTags.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                              +{featureTags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <div className="pt-3.5 mt-3 border-t border-slate-100">
                      {isActive ? (
                        <div className="w-full py-2.5 text-xs font-black text-emerald-800 bg-emerald-100/90 rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 shadow-2xs">
                          <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                          <span>صنف جاری سیستم</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchIndustryProfile(profile.code)}
                          disabled={switchingProfile || !canManageSettings}
                          title={
                            !canManageSettings
                              ? 'تنها راهبر کل و مدیر سیستم مجاز به تغییر صنف کاری سامانه است.'
                              : `سوئیچ به ${profile.titleFa}`
                          }
                          className="w-full py-2.5 text-xs font-black text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-xs hover:brightness-105 active:scale-[0.99]"
                          style={{
                            backgroundColor: canManageSettings ? primaryColor : '#64748b',
                          }}
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>
                            {switchingProfile ? 'در حال اعمال...' : 'انتخاب و فعال‌سازی صنف'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Section 1: Store Base Settings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 mb-4">
          <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              تنظیمات و مشخصات پایه کسب‌وکار مهرگان
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              مشخصات حقوقی، کدهای اقتصادی، تلفن، آدرس و پیکربندی ارز پایه دفاتر حسابداری
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نام رسمی فروشگاه / شرکت در اسناد
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                واحد پول نمایشی نرم‌افزار
              </label>
              <select
                value={displayCurrency}
                onChange={(e) => setDisplayCurrency(e.target.value as 'IRT' | 'IRR')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="IRT">تومان (IRT — ضریب ۱ به ۱۰ ریال)</option>
                <option value="IRR">ریال (IRR — واحد پایه دفاتر قانونی)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                کد اقتصادی
              </label>
              <input
                type="text"
                dir="ltr"
                value={economicCode}
                onChange={(e) => setEconomicCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                شناسه ملی
              </label>
              <input
                type="text"
                dir="ltr"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                شماره تلفن ثابت
              </label>
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              آدرس دفتر مرکزی و انبار
            </label>
            <input
              type="text"
              value={addressFa}
              onChange={(e) => setAddressFa(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          {/* Section: Document Numbering Prefixes */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              تنظیم پیشوندهای یکتای شماره‌گذاری اسناد (Document Numbering):
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">فاکتور فروش</label>
                <input
                  type="text"
                  dir="ltr"
                  value={salesInvoicePrefix}
                  onChange={(e) => setSalesInvoicePrefix(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">فاکتور خرید</label>
                <input
                  type="text"
                  dir="ltr"
                  value={purchaseInvoicePrefix}
                  onChange={(e) => setPurchaseInvoicePrefix(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">دریافت خزانه</label>
                <input
                  type="text"
                  dir="ltr"
                  value={treasuryReceiptPrefix}
                  onChange={(e) => setTreasuryReceiptPrefix(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">پرداخت خزانه</label>
                <input
                  type="text"
                  dir="ltr"
                  value={treasuryPaymentPrefix}
                  onChange={(e) => setTreasuryPaymentPrefix(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسناد حسابداری</label>
                <input
                  type="text"
                  dir="ltr"
                  value={accountingDocPrefix}
                  onChange={(e) => setAccountingDocPrefix(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Section: Default Master Elements */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              انبار، صندوق و بانک پیش‌فرض عملیات‌ها:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">انبار پیش‌فرض</label>
                <select
                  value={defaultWarehouseId}
                  onChange={(e) => setDefaultWarehouseId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {(foundationData.warehouses || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.titleFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">صندوق پیش‌فرض</label>
                <select
                  value={defaultCashBoxId}
                  onChange={(e) => setDefaultCashBoxId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {(foundationData.cashBoxes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titleFa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">حساب بانکی پیش‌فرض</label>
                <select
                  value={defaultBankAccountId}
                  onChange={(e) => setDefaultBankAccountId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  {(foundationData.bankAccounts || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankNameFa} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">پیام ذیل فاکتور چاپی</label>
              <input
                type="text"
                value={receiptFooterMessageFa}
                onChange={(e) => setReceiptFooterMessageFa(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Double-Entry Accounting Global Setting & Controls */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableDoubleEntryAccounting}
                      onChange={(e) => setEnableDoubleEntryAccounting(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    <span className="text-xs font-extrabold text-slate-800">
                      فعال‌سازی سراسری ماژول حسابداری دوبل (دفتر روزنامه، دفتر کل، تراز و بستن حساب‌ها)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 mr-6 leading-relaxed">
                    در صورت غیرفعال‌سازی، زبانه حسابداری و تمامی مسیرهای صدور و بستن حساب‌ها پنهان و محدود می‌شوند؛ ولی تمام اسناد قبلی کاملاً محفوظ مانده و عملیات فروش، خرید، خزانه و انبار بدون تغییر کار می‌کنند.
                  </p>
                </div>
                <div>
                  {enableDoubleEntryAccounting ? (
                    <button
                      type="button"
                      onClick={handleRegenerateMissingVouchers}
                      disabled={regeneratingVouchers}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="شناسایی رویدادهای بدون سند و صدور اسناد اتوماتیک بدون تغییر اسناد قبلی"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                      <span>{regeneratingVouchers ? 'در حال پردازش...' : 'بازسازی اسناد جامانده'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      غیرفعال (حسابداری ساده)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره تنظیمات در دیتابیس'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Master Definitions Forms (فرم‌های تعاریف اولیه: بانک‌ها، انبارها، گروه کالا، صندوق‌ها) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                تعاریف اولیه سیستم (بانک‌ها، انبارها، گروه‌های کالا و صندوق‌ها)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعریف حساب‌های جدید، انبارها، دسته‌بندی تجهیزات و صندوق‌های نقدی
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Form 1: Bank Accounts Form & List */}
          <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-200 space-y-3 text-xs">
            <h4 className="font-extrabold text-indigo-950 flex items-center justify-between">
              <span>۱. تعریف و مدیریت حساب‌های بانکی</span>
              <span className="text-[10px] font-mono font-normal text-indigo-700">
                موجود: {(foundationData.bankAccounts || []).length} حساب
              </span>
            </h4>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                try {
                  const res = await fetch('/api/master/bank-accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bankNameFa: formData.get('bankNameFa'),
                      accountNumber: formData.get('accountNumber'),
                      shabaNumber: formData.get('shabaNumber'),
                      balanceIrr: Number(formData.get('balanceIrr') || 0),
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                    form.reset();
                    await onRefresh();
                  } else {
                    setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در ثبت بانک' });
                  }
                } catch {
                  setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارتباط با سرور' });
                }
              }}
              className="space-y-2 bg-white p-3 rounded-lg border border-indigo-100 shadow-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="bankNameFa"
                  required
                  placeholder="نام بانک و شعبه"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
                <input
                  type="text"
                  name="accountNumber"
                  required
                  dir="ltr"
                  placeholder="شماره حساب"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="shabaNumber"
                  dir="ltr"
                  placeholder="شماره شبا (IR...)"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
                <input
                  type="number"
                  name="balanceIrr"
                  dir="ltr"
                  placeholder="موجودی اول دوره (ریال)"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                + افزودن حساب بانکی جدید
              </button>
            </form>

            {/* List of existing Bank Accounts */}
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              <span className="font-bold text-[11px] text-slate-700 block">فهرست حساب‌های فعال:</span>
              {(foundationData.bankAccounts || []).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">{b.bankNameFa}</div>
                    <div className="font-mono text-slate-500 text-[10px]" dir="ltr">
                      حساب: {b.accountNumber} · موجودی: {(b.balanceIrr || 0).toLocaleString('fa-IR')} ریال
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingBank(b)}
                      className="p-1 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100"
                      title="ویرایش"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaster(`/api/master/bank-accounts/${b.id}`, b.bankNameFa)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="حذف امن"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form 2: Warehouses Form & List */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-3 text-xs">
            <h4 className="font-extrabold text-blue-950 flex items-center justify-between">
              <span>۲. تعریف و مدیریت انبارها</span>
              <span className="text-[10px] font-mono font-normal text-blue-700">
                موجود: {(foundationData.warehouses || []).length} انبار
              </span>
            </h4>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                try {
                  const res = await fetch('/api/master/warehouses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      code: formData.get('code'),
                      titleFa: formData.get('titleFa'),
                      managerNameFa: formData.get('managerNameFa'),
                      phone: formData.get('phone'),
                      locationAddressFa: formData.get('locationAddressFa'),
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                    form.reset();
                    await onRefresh();
                  } else {
                    setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در ثبت انبار' });
                  }
                } catch {
                  setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارتباط با سرور' });
                }
              }}
              className="space-y-2 bg-white p-3 rounded-lg border border-blue-100 shadow-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="code"
                  required
                  dir="ltr"
                  placeholder="کد انبار (WH-01)"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
                <input
                  type="text"
                  name="titleFa"
                  required
                  placeholder="عنوان انبار"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="managerNameFa"
                  placeholder="نام انباردار"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
                <input
                  type="text"
                  name="phone"
                  dir="ltr"
                  placeholder="شماره تلفن انبار"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                + افزودن انبار جدید
              </button>
            </form>

            {/* List of existing Warehouses */}
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              <span className="font-bold text-[11px] text-slate-700 block">فهرست انبارهای فعال:</span>
              {(foundationData.warehouses || []).map((w) => (
                <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">[{w.code || w.warehouseCode}] {w.titleFa}</div>
                    <div className="text-slate-500 text-[10px]">
                      انباردار: {w.keeperNameFa || w.managerNameFa || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingWarehouse(w)}
                      className="p-1 text-slate-600 hover:text-blue-600 rounded hover:bg-slate-100"
                      title="ویرایش"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaster(`/api/master/warehouses/${w.id}`, w.titleFa)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="حذف امن"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form 3: Item Categories Form & List */}
          <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3 text-xs">
            <h4 className="font-extrabold text-amber-950 flex items-center justify-between">
              <span>۳. تعریف و مدیریت گروه‌های کالا</span>
              <span className="text-[10px] font-mono font-normal text-amber-700">
                موجود: {(foundationData.itemCategories || []).length} گروه
              </span>
            </h4>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                try {
                  const res = await fetch('/api/master/item-categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      categoryCode: formData.get('categoryCode'),
                      titleFa: formData.get('titleFa'),
                      prefix: formData.get('prefix'),
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                    form.reset();
                    await onRefresh();
                  } else {
                    setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در ثبت گروه کالا' });
                  }
                } catch {
                  setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارتباط با سرور' });
                }
              }}
              className="space-y-2 bg-white p-3 rounded-lg border border-amber-100 shadow-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="categoryCode"
                  required
                  dir="ltr"
                  placeholder="کد گروه (CAT-CAM)"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
                />
                <input
                  type="text"
                  name="titleFa"
                  required
                  placeholder="عنوان گروه کالا"
                  className="rounded-lg border border-slate-300 bg-white p-2 text-xs"
                />
              </div>
              <input
                type="text"
                name="prefix"
                dir="ltr"
                placeholder="پیشوند کالاها (مثال: CAM)"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                + افزودن گروه کالای جدید
              </button>
            </form>

            {/* List of existing Categories */}
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              <span className="font-bold text-[11px] text-slate-700 block">فهرست گروه‌های کالا:</span>
              {(foundationData.itemCategories || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">[{c.categoryCode}] {c.titleFa}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(c)}
                      className="p-1 text-slate-600 hover:text-amber-600 rounded hover:bg-slate-100"
                      title="ویرایش"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaster(`/api/master/item-categories/${c.id}`, c.titleFa)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="حذف امن"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form 4: Cash Boxes Form & List */}
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-3 text-xs">
            <h4 className="font-extrabold text-emerald-950 flex items-center justify-between">
              <span>۴. تعریف و مدیریت صندوق‌های نقدی</span>
              <span className="text-[10px] font-mono font-normal text-emerald-700">
                موجود: {(foundationData.cashBoxes || []).length} صندوق
              </span>
            </h4>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                try {
                  const res = await fetch('/api/master/cash-boxes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      titleFa: formData.get('titleFa'),
                      balanceIrr: Number(formData.get('balanceIrr') || 0),
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                    form.reset();
                    await onRefresh();
                  } else {
                    setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در ثبت صندوق' });
                  }
                } catch {
                  setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارتباط با سرور' });
                }
              }}
              className="space-y-2 bg-white p-3 rounded-lg border border-emerald-100 shadow-xs"
            >
              <input
                type="text"
                name="titleFa"
                required
                placeholder="عنوان صندوق نقدی"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
              />
              <input
                type="number"
                name="balanceIrr"
                dir="ltr"
                placeholder="موجودی اولیه صندوق (ریال)"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                + افزودن صندوق جدید
              </button>
            </form>

            {/* List of existing Cash Boxes */}
            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
              <span className="font-bold text-[11px] text-slate-700 block">فهرست صندوق‌های نقدی:</span>
              {(foundationData.cashBoxes || []).map((cb) => (
                <div key={cb.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">[{cb.boxCode}] {cb.titleFa}</div>
                    <div className="font-mono text-slate-500 text-[10px]" dir="ltr">
                      موجودی: {(cb.balanceIrr || 0).toLocaleString('fa-IR')} ریال
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCashBox(cb)}
                      className="p-1 text-slate-600 hover:text-emerald-600 rounded hover:bg-slate-100"
                      title="ویرایش"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaster(`/api/master/cash-boxes/${cb.id}`, cb.titleFa)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="حذف امن"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Section 3: Health Check & Migrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Health Check */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                بررسی مرحله‌به‌مرحله سلامت سیستم (Health Check)
              </h3>
            </div>
            <button
              type="button"
              onClick={loadHealthAndDocs}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              بررسی مجدد
            </button>
          </div>

          {healthData && (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg text-xs">
              {healthData.stages.map((st) => (
                <div key={st.stageId} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{st.titleFa}</span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        st.ok ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {st.ok ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{st.detailFa}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Migrations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5 text-blue-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900">
                مدیریت Migrationهای نسخه‌بندی‌شده غیرمخرب
              </h3>
            </div>
            <button
              type="button"
              onClick={handleApplyMigrations}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Play className="h-3.5 w-3.5" />
              <span>اجرای موارد در انتظار</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg text-xs">
            {foundationData.migrations.map((m) => (
              <div key={m.version} className="p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-bold text-slate-900" dir="ltr">
                    {m.name} ({m.checksum})
                  </div>
                  <div className="text-slate-600 mt-0.5">{m.descriptionFa}</div>
                </div>
                <div className="font-mono font-bold whitespace-nowrap text-[11px]">
                  {m.status === 'APPLIED' ? (
                    <span className="text-emerald-700">APPLIED ({m.executionMs}ms)</span>
                  ) : (
                    <span className="text-amber-700">PENDING</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: DATABASE RESET & FACTORY CLEAR (تنظیمات حذف کامل داده‌ها و خالی کردن دیتابیس) */}
      <div className="rounded-xl border border-rose-300 bg-rose-50/50 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-200 pb-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-rose-950">
              پاکسازی و بازنشانی دیتابیس (Database Clear & Reset)
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              خالی کردن تراکنش‌ها یا ریست کامل اطلاعات پایه با لایه محافظتی کلمه تایید
            </p>
          </div>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const confirmationCode = String(formData.get('confirmationCode') || '').trim();
            const wipeType = formData.get('wipeType');

            const validCodes = ['DELETE', 'حذف', 'RESET', '0', '۰', 'صفر', 'CLEAN', 'ZERO', 'CONFIRM', 'YES', 'بله'];
            const upperCode = confirmationCode.toUpperCase();
            if (!validCodes.includes(upperCode) && !validCodes.includes(confirmationCode)) {
              setFeedbackMsg({
                type: 'ERROR',
                textFa: 'جهت تایید نهایی، عبارت "0" یا "صفر" یا "حذف" را در کادر تایید وارد نمایید.',
              });
              return;
            }

            try {
              const res = await fetch('/api/settings/reset-database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  confirmationCode,
                  cleanZeroSlate: wipeType === 'CLEAN_ZERO_SLATE',
                  wipeOperationalOnly: wipeType === 'OPERATIONAL_ONLY',
                  factoryReset: wipeType === 'FACTORY_RESET',
                }),
              });
              const data = await res.json();
              if (data.ok) {
                setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                form.reset();
                await onRefresh();
              } else {
                setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa || 'خطا در پاکسازی دیتابیس' });
              }
            } catch {
              setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ارسال درخواست پاکسازی' });
            }
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Option 1: Clean Zero Slate (User Requested) */}
            <label className="p-3.5 rounded-xl border-2 border-rose-500 bg-rose-50/90 flex items-start gap-3 cursor-pointer hover:border-rose-700 transition-colors shadow-xs">
              <input
                type="radio"
                name="wipeType"
                value="CLEAN_ZERO_SLATE"
                defaultChecked
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-black text-rose-950 block text-xs">
                  ⭐ شروع از صفر مطلق (بدون رکورد، آماده شروع واقعی)
                </span>
                <span className="text-rose-800 text-[11px] block mt-1 leading-relaxed font-medium">
                  حذف کامل تمام فاکتورهای خرید، فاکتورهای فروش، مشتریان، تأمین‌کنندگان، کالاها، انبارها، پروژه‌ها و اسناد. فقط یک کاربر مدیر با نام کاربری <strong className="font-mono text-black font-extrabold">admin</strong> و رمز <strong className="font-mono text-black font-extrabold">admin</strong> برای ورود باقی می‌ماند.
                </span>
              </div>
            </label>

            {/* Option 2: Operational Wipe Only */}
            <label className="p-3.5 rounded-xl border border-slate-300 bg-white flex items-start gap-3 cursor-pointer hover:border-slate-500 transition-colors">
              <input
                type="radio"
                name="wipeType"
                value="OPERATIONAL_ONLY"
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-extrabold text-slate-900 block text-xs">
                  پاکسازی تراکنش‌ها (حفظ کالا و اشخاص)
                </span>
                <span className="text-slate-600 text-[11px] block mt-1 leading-relaxed">
                  حذف کلیه فاکتورها، تراکنش‌های خزانه و پروژه‌ها با صفر کردن مانده‌ها، اما حفظ تعاریف پایه اشخاص، کالاها و بانک‌ها.
                </span>
              </div>
            </label>

            {/* Option 3: Factory Demo Reset */}
            <label className="p-3.5 rounded-xl border border-slate-300 bg-white flex items-start gap-3 cursor-pointer hover:border-slate-500 transition-colors">
              <input
                type="radio"
                name="wipeType"
                value="FACTORY_RESET"
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-extrabold text-amber-900 block text-xs">
                  بازگردانی داده‌های دمو کارخانه (تست)
                </span>
                <span className="text-slate-600 text-[11px] block mt-1 leading-relaxed">
                  پاکسازی دیتابیس و بارگذاری مجدد اطلاعات نمونه فروشگاهی، پروژه‌ها و کاربران جهت آموزش و تست.
                </span>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-rose-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-900">عبارت تایید:</span>
              <input
                type="text"
                id="confirmationCodeInput"
                name="confirmationCode"
                required
                dir="ltr"
                defaultValue="0"
                placeholder="0 یا صفر یا DELETE"
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-rose-900 focus:ring-2 focus:ring-rose-500 w-32 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('confirmationCodeInput') as HTMLInputElement | null;
                  if (input) input.value = '0';
                }}
                className="text-[11px] text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded font-bold cursor-pointer"
              >
                کد پیش‌فرض (0)
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>اجرای فوری پاکسازی دیتابیس به حالت صفر</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 5: Environment Variables Documentation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Code2 className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              مستندات متغیرهای محیطی (Environment Variables Documentation)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              تنظیمات پیکربندی سرور مرکزی و احراز هویت دیتابیسی تعریف‌شده در فایل .env.example
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">نام متغیر (Key)</th>
                <th className="py-2.5 px-3">مقدار پیش‌فرض</th>
                <th className="py-2.5 px-3">الزام</th>
                <th className="py-2.5 px-3">شرح عملکرد در سیستم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {envDocs.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-blue-900" dir="ltr">
                    {item.key}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700" dir="ltr">
                    {item.defaultValue}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-semibold">
                    {item.required ? (
                      <span className="text-amber-700">الزامی</span>
                    ) : (
                      <span className="text-slate-500">اختیاری</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-800 leading-relaxed">
                    {item.descriptionFa}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* EDIT MASTER MODALS */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900">ویرایش حساب بانکی [{editingBank.accountCode}]</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/master/bank-accounts/${editingBank.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingBank),
                });
                const data = await res.json();
                if (data.ok) {
                  setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                  setEditingBank(null);
                  await onRefresh();
                } else setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa });
              } catch { setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ویرایش بانک.' }); }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">نام بانک / شعبه:</label>
                <input type="text" value={editingBank.bankNameFa} onChange={(e) => setEditingBank({ ...editingBank, bankNameFa: e.target.value })} className="w-full border rounded-lg p-2 text-xs" required />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">شماره حساب:</label>
                <input type="text" dir="ltr" value={editingBank.accountNumber} onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })} className="w-full border rounded-lg p-2 font-mono text-xs" required />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">موجودی (ریال):</label>
                <input type="number" dir="ltr" value={editingBank.balanceIrr} onChange={(e) => setEditingBank({ ...editingBank, balanceIrr: Number(e.target.value) })} className="w-full border rounded-lg p-2 font-mono text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditingBank(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">انصراف</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900">ویرایش انبار [{editingWarehouse.warehouseCode || editingWarehouse.code}]</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/master/warehouses/${editingWarehouse.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingWarehouse),
                });
                const data = await res.json();
                if (data.ok) {
                  setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                  setEditingWarehouse(null);
                  await onRefresh();
                } else setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa });
              } catch { setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ویرایش انبار.' }); }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">عنوان انبار:</label>
                <input type="text" value={editingWarehouse.titleFa} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, titleFa: e.target.value })} className="w-full border rounded-lg p-2 text-xs" required />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">نام انباردار:</label>
                <input type="text" value={editingWarehouse.keeperNameFa || editingWarehouse.managerNameFa || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, keeperNameFa: e.target.value, managerNameFa: e.target.value })} className="w-full border rounded-lg p-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditingWarehouse(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">انصراف</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900">ویرایش گروه کالا [{editingCategory.categoryCode}]</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/master/item-categories/${editingCategory.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingCategory),
                });
                const data = await res.json();
                if (data.ok) {
                  setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                  setEditingCategory(null);
                  await onRefresh();
                } else setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa });
              } catch { setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ویرایش گروه کالا.' }); }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">عنوان گروه کالا:</label>
                <input type="text" value={editingCategory.titleFa} onChange={(e) => setEditingCategory({ ...editingCategory, titleFa: e.target.value })} className="w-full border rounded-lg p-2 text-xs" required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">انصراف</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCashBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4 text-xs shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900">ویرایش صندوق نقدی [{editingCashBox.boxCode}]</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/master/cash-boxes/${editingCashBox.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(editingCashBox),
                });
                const data = await res.json();
                if (data.ok) {
                  setFeedbackMsg({ type: 'SUCCESS', textFa: data.messageFa });
                  setEditingCashBox(null);
                  await onRefresh();
                } else setFeedbackMsg({ type: 'ERROR', textFa: data.messageFa });
              } catch { setFeedbackMsg({ type: 'ERROR', textFa: 'خطا در ویرایش صندوق.' }); }
            }} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">عنوان صندوق:</label>
                <input type="text" value={editingCashBox.titleFa} onChange={(e) => setEditingCashBox({ ...editingCashBox, titleFa: e.target.value })} className="w-full border rounded-lg p-2 text-xs" required />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">موجودی اولیه (ریال):</label>
                <input type="number" dir="ltr" value={editingCashBox.balanceIrr} onChange={(e) => setEditingCashBox({ ...editingCashBox, balanceIrr: Number(e.target.value) })} className="w-full border rounded-lg p-2 font-mono text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setEditingCashBox(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">انصراف</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
