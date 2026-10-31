import React, { useState, useMemo } from 'react';
import {
  Zap,
  X,
  Search,
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
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  QrCode,
  Truck,
  RotateCcw,
  BarChart3,
  Scale,
  UtensilsCrossed,
  Smartphone,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { FoundationDataResponse } from '../types/foundation';

interface QuickAccessMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  foundationData?: FoundationDataResponse | null;
  companyName?: string;
}

type OperationCategory =
  | 'ALL'
  | 'SALES'
  | 'PURCHASES'
  | 'TREASURY'
  | 'CHEQUES'
  | 'PARTIES'
  | 'INVENTORY'
  | 'INSTALLATION'
  | 'ACCOUNTING'
  | 'SETTINGS';

interface OperationItem {
  id: string;
  tab: string;
  category: OperationCategory;
  categoryFa: string;
  titleFa: string;
  descriptionFa: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  keywords: string[];
  requiresFeature?: 'installation' | 'accounting';
  industryOnly?: string;
}

export const QuickAccessMobileDrawer: React.FC<QuickAccessMobileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  foundationData,
  companyName = 'مهرگان',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<OperationCategory>('ALL');

  const features = foundationData?.industryProfile?.features || {
    enableInstallationServices: true,
  };
  const enableDoubleEntryAccounting =
    foundationData?.settings?.enableDoubleEntryAccounting !== false;
  const profileCode = foundationData?.industryProfile?.code || 'CCTV_SECURITY';
  const activeUser = foundationData?.activeUser;
  const isInstaller =
    activeUser &&
    (Boolean(activeUser.installerPartyId) ||
      activeUser.assignedRoles?.includes('INSTALLER') ||
      activeUser.jobTitle?.includes('نصاب') ||
      activeUser.jobTitle?.includes('تکنسین') ||
      Boolean(activeUser.username && activeUser.username.toLowerCase().includes('installer')) ||
      Boolean(activeUser.username && activeUser.username.includes('نصاب')) ||
      activeUser.fullName?.includes('نصاب'));

  // Master catalog of all real system operations
  const allOperations: OperationItem[] = [
    // 0. FEATURES HUB
    {
      id: 'OP_BUSINESS_FEATURES_HUB',
      tab: 'BUSINESS_FEATURES_HUB',
      category: 'SETTINGS',
      categoryFa: 'امکانات و ابزارها',
      titleFa: 'مرکز امکانات و قابلیت‌های سیستم (Features Hub)',
      descriptionFa: 'درگاه یکپارچه به تمامی امکانات پیشرفته، فعال و برنامه‌ریزی‌شده کسب‌وکار',
      icon: Boxes,
      colorClass: 'bg-indigo-600 text-white border-indigo-700',
      keywords: ['امکانات', 'قابلیت', 'features', 'ابزار', 'پیشرفته', 'hub'],
    },
    // 1. SALES
    {
      id: 'OP_SALES_POS',
      tab: 'SALES',
      category: 'SALES',
      categoryFa: 'فروش و صورت‌حساب',
      titleFa: 'صندوق فروش سریع (POS)',
      descriptionFa: 'صدور آنی فاکتور با بارکدخوان، تخفیف، مالیات و تسویه نقدی/پوز',
      icon: ShoppingCart,
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      keywords: ['فروش', 'فاکتور', 'pos', 'بارکد', 'صندوق', 'تسویه', 'مشتری'],
    },
    {
      id: 'OP_SALES_PROFORMA',
      tab: 'SALES',
      category: 'SALES',
      categoryFa: 'فروش و صورت‌حساب',
      titleFa: 'پیش‌فاکتور فروش',
      descriptionFa: 'صدور استعلام قیمت، مدت اعتبار و تبدیل خودکار به فاکتور نهایی',
      icon: FileText,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      keywords: ['پیش‌فاکتور', 'استعلام', 'قیمت', 'فروش'],
    },
    {
      id: 'OP_SALES_INVOICES_LIST',
      tab: 'SALES',
      category: 'SALES',
      categoryFa: 'فروش و صورت‌حساب',
      titleFa: 'فاکتورهای فروش و پیگیری مطالبات',
      descriptionFa: 'مرور فاکتورهای رسمی، پیگیری وضعیت تسویه و بدهی مشتریان',
      icon: CheckCircle2,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      keywords: ['فاکتورها', 'لیست', 'مطالبات', 'بدهی', 'وصول'],
    },
    {
      id: 'OP_SALES_RETURNS',
      tab: 'SALES',
      category: 'SALES',
      categoryFa: 'فروش و صورت‌حساب',
      titleFa: 'مرجوعی و برگشت از فروش',
      descriptionFa: 'ثبت کالای عودت داده شده توسط مشتری و برگشت وجه یا بستانکاری',
      icon: RotateCcw,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      keywords: ['مرجوعی', 'برگشت', 'عودت', 'ابطال'],
    },

    // 2. PURCHASES
    {
      id: 'OP_PURCHASE_NEW',
      tab: 'PURCHASES',
      category: 'PURCHASES',
      categoryFa: 'خرید و تدارکات',
      titleFa: 'ثبت فاکتور خرید کالا',
      descriptionFa: 'ورود محموله خرید، تسهیم بهای تمام‌شده (Landed Cost) و بدهی تأمین‌کننده',
      icon: ShoppingBag,
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
      keywords: ['خرید', 'تدارکات', 'تأمین', 'فاکتور خرید', 'سربار', 'حمل'],
    },
    {
      id: 'OP_PURCHASE_PROFORMA',
      tab: 'PURCHASES',
      category: 'PURCHASES',
      categoryFa: 'خرید و تدارکات',
      titleFa: 'پیش‌فاکتور خرید و سفارش کالا',
      descriptionFa: 'ثبت سفارش پیش‌خرید کالا و استعلام قیمت تأمین‌کنندگان',
      icon: FileText,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      keywords: ['پیش‌خرید', 'سفارش تأمین', 'استعلام خرید'],
    },
    {
      id: 'OP_PURCHASE_RETURNS',
      tab: 'PURCHASES',
      category: 'PURCHASES',
      categoryFa: 'خرید و تدارکات',
      titleFa: 'برگشت از خرید و مرجوعی کالا',
      descriptionFa: 'ثبت عودت اقلام معیوب یا مازاد به تأمین‌کننده و کسر از بدهی',
      icon: RotateCcw,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      keywords: ['برگشت خرید', 'مرجوعی تأمین', 'عودت کالا'],
    },

    // 3. TREASURY (RECEIPT & PAYMENT)
    {
      id: 'OP_TREASURY_RECEIPT',
      tab: 'TREASURY',
      category: 'TREASURY',
      categoryFa: 'دریافت و پرداخت',
      titleFa: 'ثبت دریافت وجه از مشتری',
      descriptionFa: 'دریافت نقدی، رسید پوز بانکی، حواله ساتنا/پایا و تسویه فاکتور',
      icon: ArrowDownLeft,
      colorClass: 'bg-teal-100 text-teal-800 border-teal-300',
      keywords: ['دریافت', 'وجه', 'رسید', 'واریز', 'کارتخوان', 'تسویه'],
    },
    {
      id: 'OP_TREASURY_PAYMENT',
      tab: 'TREASURY',
      category: 'TREASURY',
      categoryFa: 'دریافت و پرداخت',
      titleFa: 'ثبت پرداخت به تأمین‌کننده',
      descriptionFa: 'پرداخت نقدی، حواله بانکی و تسویه بدهی‌های خرید کالا',
      icon: ArrowUpRight,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      keywords: ['پرداخت', 'حواله', 'تسویه بدهی', 'تأمین‌کننده'],
    },
    {
      id: 'OP_TREASURY_EXPENSES',
      tab: 'TREASURY',
      category: 'TREASURY',
      categoryFa: 'دریافت و پرداخت',
      titleFa: 'ثبت هزینه‌های جاری کسب‌وکار',
      descriptionFa: 'اجاره، حقوق پرسنل، قبوض، ملزومات اداری و سایر مخارج',
      icon: CreditCard,
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      keywords: ['هزینه', 'مخارج', 'اجاره', 'حقوق', 'قبوض', 'مصرفی'],
    },

    // 4. CHEQUES & BANK VAULT
    {
      id: 'OP_CHEQUES_MANAGEMENT',
      tab: 'TREASURY',
      category: 'CHEQUES',
      categoryFa: 'خزانه و چک صیادی',
      titleFa: 'کارتابل چک‌های صیادی',
      descriptionFa: 'ثبت چک‌های دریافتی و صادره، پایش سررسید، واگذاری به بانک و وصول',
      icon: Landmark,
      colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      keywords: ['چک', 'صیاد', 'خزانه', 'سررسید', 'وصول', 'واگذاری', 'برگشتی'],
    },
    {
      id: 'OP_TREASURY_ACCOUNTS',
      tab: 'TREASURY',
      category: 'CHEQUES',
      categoryFa: 'خزانه و چک صیادی',
      titleFa: 'حساب‌های بانکی و صندوق‌ها',
      descriptionFa: 'مدیریت حساب‌های بانکی، شماره شبا، کارتخوان‌ها و موجودی صندوق نقدی',
      icon: Building2,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      keywords: ['بانک', 'صندوق', 'کارتخوان', 'شبا', 'موجودی نقد'],
    },
    {
      id: 'OP_TREASURY_INSTALLMENTS',
      tab: 'TREASURY',
      category: 'CHEQUES',
      categoryFa: 'خزانه و چک صیادی',
      titleFa: 'دفتر اقساط و سررسیدها',
      descriptionFa: 'پایش زمان‌بندی اقساط دریافتی و پرداختی، جریمه دیرکرد و تسویه',
      icon: Calendar,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      keywords: ['اقساط', 'قسط', 'وام', 'سررسید'],
    },

    // 5. PARTIES & CUSTOMERS
    {
      id: 'OP_PARTIES_CUSTOMERS',
      tab: 'PARTIES',
      category: 'PARTIES',
      categoryFa: 'اشخاص و مشتریان',
      titleFa: 'مشتریان و خریداران',
      descriptionFa: 'تعریف مشتری، صورت‌حساب ریز تراکنش‌ها، سقف اعتبار و کد ملی/اقتصادی',
      icon: Users,
      colorClass: 'bg-blue-100 text-blue-800 border-blue-300',
      keywords: ['مشتری', 'خریدار', 'اشخاص', 'طرف‌حساب', 'صورت‌حساب'],
    },
    {
      id: 'OP_PARTIES_SUPPLIERS',
      tab: 'PARTIES',
      category: 'PARTIES',
      categoryFa: 'اشخاص و مشتریان',
      titleFa: 'تأمین‌کنندگان و همکاران تجاری',
      descriptionFa: 'مشخصات تأمین‌کنندگان کالا، مانده‌حساب بستانکاری و شماره حساب',
      icon: Users,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      keywords: ['تأمین‌کننده', 'فروشنده', 'شرکت', 'همکار'],
    },

    // 6. INVENTORY
    {
      id: 'OP_INVENTORY_ITEMS',
      tab: 'INVENTORY',
      category: 'INVENTORY',
      categoryFa: 'کالا و انبارداری',
      titleFa: 'فهرست کالاها و موجودی انبار',
      descriptionFa: 'بانک جامع کالاها، قیمت‌های خرید و فروش، کدینگ و بارکد اقلام',
      icon: Package,
      colorClass: 'bg-sky-100 text-sky-800 border-sky-300',
      keywords: ['کالا', 'انبار', 'موجودی', 'قیمت', 'اقلام'],
    },
    {
      id: 'OP_INVENTORY_KARDEX',
      tab: 'INVENTORY',
      category: 'INVENTORY',
      categoryFa: 'کالا و انبارداری',
      titleFa: 'کاردکس ریالی و تعدادی کالا',
      descriptionFa: 'ردیابی تاریخچه ورود و خروج هر قلم کالا بر اساس اسناد فروش و خرید',
      icon: Boxes,
      colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
      keywords: ['کاردکس', 'گردش کالا', 'ورود', 'خروج'],
    },
    {
      id: 'OP_INVENTORY_LOW_STOCK',
      tab: 'INVENTORY',
      category: 'INVENTORY',
      categoryFa: 'کالا و انبارداری',
      titleFa: 'دیده‌بان اقلام زیر نقطه سفارش',
      descriptionFa: 'هشدارهای کسری موجودی بحرانی انبار جهت سفارش‌گذاری فوری به تأمین‌کننده',
      icon: AlertTriangle,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
      keywords: ['نقطه سفارش', 'کسری', 'بحرانی', 'هشدار موجودی'],
    },
    {
      id: 'OP_INVENTORY_SERIALS',
      tab: 'INVENTORY',
      category: 'INVENTORY',
      categoryFa: 'کالا و انبارداری',
      titleFa: 'رهگیری شماره سریال و بارکد',
      descriptionFa: 'جستجوی مک‌آدرس و شماره سریال قطعات و تجهیزات گارانتی‌دار',
      icon: QrCode,
      colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
      keywords: ['سریال', 'مک', 'mac', 'بارکد', 'گارانتی'],
    },

    // 7. INSTALLATION & SERVICES
    {
      id: 'OP_INSTALLATION_PROJECTS',
      tab: 'INSTALLATION',
      category: 'INSTALLATION',
      categoryFa: 'خدمات و نصب',
      titleFa: 'پروژه‌های نظارتی و نصب CCTV',
      descriptionFa: 'مدیریت قراردادهای پروژه، مراحل پیشرفت، بازدیدهای میدانی و نصابان',
      icon: Wrench,
      colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      keywords: ['پروژه', 'نصب', 'دوربین', 'cctv', 'قرارداد', 'تکنسین'],
      requiresFeature: 'installation',
    },
    {
      id: 'OP_INSTALLATION_REQUISITIONS',
      tab: 'INSTALLATION',
      category: 'INSTALLATION',
      categoryFa: 'خدمات و نصب',
      titleFa: 'حواله و درخواست کالای پروژه',
      descriptionFa: 'ثبت درخواست تجهیزات از انبار توسط نصاب و تأیید حواله مصرف کالا',
      icon: Boxes,
      colorClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      keywords: ['حواله کالا', 'درخواست کالا', 'مصرف پروژه', 'انبار پروژه'],
      requiresFeature: 'installation',
    },

    // 8. ACCOUNTING & BI
    {
      id: 'OP_ACCOUNTING_JOURNAL',
      tab: 'ACCOUNTING',
      category: 'ACCOUNTING',
      categoryFa: 'حسابداری و گزارش‌ها',
      titleFa: 'اسناد دوبل و دفاتر حسابداری',
      descriptionFa: 'ثبت و بررسی آرتیکل‌های بدهکار و بستانکار، دفتر روزنامه و دفتر کل',
      icon: BookOpen,
      colorClass: 'bg-purple-100 text-purple-800 border-purple-300',
      keywords: ['سند', 'دوبل', 'دفتر کل', 'روزنامه', 'آرتیکل', 'حسابداری'],
      requiresFeature: 'accounting',
    },
    {
      id: 'OP_ACCOUNTING_TRIAL_BALANCE',
      tab: 'ACCOUNTING',
      category: 'ACCOUNTING',
      categoryFa: 'حسابداری و گزارش‌ها',
      titleFa: 'تراز آزمایشی و سود و زیان',
      descriptionFa: 'ترازنامه ۴ ستونی، گزارش سود و زیان دوره‌ای و وضعیت سرمایه در گردش',
      icon: BarChart3,
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      keywords: ['تراز آزمایشی', 'سود و زیان', 'ترازنامه', 'مالی'],
      requiresFeature: 'accounting',
    },
    {
      id: 'OP_BI_METRICS',
      tab: 'DASHBOARD',
      category: 'ACCOUNTING',
      categoryFa: 'حسابداری و گزارش‌ها',
      titleFa: 'شاخص‌های کلان هوش تجاری (BI)',
      descriptionFa: 'پایش نقدینگی، سود ناخالص، سرمایه در گردش و ۵ کالای پرفروش دوره',
      icon: LayoutDashboard,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-300',
      keywords: ['داشبورد', 'هوش تجاری', 'bi', 'تحلیل', 'پرفروش'],
    },

    // 9. SPECIALIZED INDUSTRY MODULES
    {
      id: 'OP_SPEC_GOLD',
      tab: 'GOLD_DUAL_LEDGER',
      category: 'ALL',
      categoryFa: 'صنف تخصصی',
      titleFa: 'دفتر دوبل طلا و جواهر',
      descriptionFa: 'حسابداری دوطرفه وزنی (گرم و عیار ۷۵۰) و ریالی معاملات طلا',
      icon: Scale,
      colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      keywords: ['طلا', 'عیار', 'گرم', 'مظنه'],
      industryOnly: 'GOLD_JEWELRY',
    },
    {
      id: 'OP_SPEC_RESTAURANT',
      tab: 'RESTAURANT_CAFE',
      category: 'ALL',
      categoryFa: 'صنف تخصصی',
      titleFa: 'صندوق رستوران و سفارشات سالن',
      descriptionFa: 'مدیریت میزها، سفارشات سالن و بیرون‌بر و چاپ آشپزخانه',
      icon: UtensilsCrossed,
      colorClass: 'bg-rose-100 text-rose-800 border-rose-300',
      keywords: ['رستوران', 'کافه', 'میز', 'سفارش', 'آشپزخانه'],
      industryOnly: 'RESTAURANT_CAFE',
    },
    {
      id: 'OP_SPEC_WHOLESALE',
      tab: 'WHOLESALE_DISTRIBUTION',
      category: 'ALL',
      categoryFa: 'صنف تخصصی',
      titleFa: 'پخش مویرگی و عمده‌فروشی',
      descriptionFa: 'فاکتور عمده، بارنامه توزیع و حساب رانندگان',
      icon: Truck,
      colorClass: 'bg-sky-100 text-sky-800 border-sky-300',
      keywords: ['پخش', 'عمده', 'بارنامه', 'توزیع'],
      industryOnly: 'WHOLESALE_DISTRIBUTION',
    },
    {
      id: 'OP_SPEC_MOBILE',
      tab: 'MOBILE_ELECTRONICS',
      category: 'ALL',
      categoryFa: 'صنف تخصصی',
      titleFa: 'تعمیرات موبایل و الکترونیک',
      descriptionFa: 'پذیرش دستگاه تعمیری، ثبت کد پیگیری، مصرف قطعات و تحویل',
      icon: Smartphone,
      colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      keywords: ['موبایل', 'تعمیرات', 'پذیرش', 'قطعات'],
      industryOnly: 'MOBILE_ELECTRONICS',
    },

    // 10. SYSTEM & SETTINGS
    {
      id: 'OP_SETTINGS_SYS',
      tab: 'SETTINGS_HEALTH',
      category: 'SETTINGS',
      categoryFa: 'تنظیمات و امنیت',
      titleFa: 'تنظیمات شرکت و پیکربندی صنف',
      descriptionFa: 'مشخصات شرکت، روش‌های بهای تمام‌شده، سال مالی و صنف کاری',
      icon: Settings,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-300',
      keywords: ['تنظیمات', 'صنف', 'شرکت', 'سال مالی', 'پیکربندی'],
    },
    {
      id: 'OP_USERS_SYS',
      tab: 'USERS',
      category: 'SETTINGS',
      categoryFa: 'تنظیمات و امنیت',
      titleFa: 'مدیریت کاربران و پرسنل',
      descriptionFa: 'تعریف کاربران سیستم، رمزهای عبور و تخصیص نقش‌های شغلی',
      icon: Users,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      keywords: ['کاربران', 'پرسنل', 'رمز عبور', 'ادمین'],
    },
    {
      id: 'OP_RBAC_SYS',
      tab: 'RBAC',
      category: 'SETTINGS',
      categoryFa: 'تنظیمات و امنیت',
      titleFa: 'سطوح دسترسی و امنیت RBAC',
      descriptionFa: 'ماتریس دسترسی‌ها، قوانین صریح Allow/Deny و سیاست‌های امنیتی',
      icon: Shield,
      colorClass: 'bg-violet-50 text-violet-700 border-violet-200',
      keywords: ['rbac', 'دسترسی', 'مجوز', 'امنیت'],
    },
    {
      id: 'OP_AUDIT_SYS',
      tab: 'AUDIT',
      category: 'SETTINGS',
      categoryFa: 'تنظیمات و امنیت',
      titleFa: 'لاگ‌های امنیتی و رویدادهای سیستم',
      descriptionFa: 'ثبت بدون دستکاری تغییرات، تراکنش‌ها، لاگین و رویدادهای کاربران',
      icon: FileText,
      colorClass: 'bg-slate-100 text-slate-800 border-slate-200',
      keywords: ['لاگ', 'audit', 'ردیابی', 'رویداد'],
    },
  ];

  // RBAC and feature filtering
  const filteredOperations = useMemo(() => {
    return allOperations.filter((op) => {
      // 1. Feature checks
      if (op.requiresFeature === 'installation' && !features.enableInstallationServices) {
        return false;
      }
      if (op.requiresFeature === 'accounting' && !enableDoubleEntryAccounting) {
        return false;
      }
      // 2. Specialized industry check
      if (op.industryOnly && op.industryOnly !== profileCode) {
        return false;
      }
      // 2.5 Strict Installer role check (no managerial financial operations)
      if (isInstaller && op.category !== 'INSTALLATION') {
        return false;
      }
      // 3. Category filter
      if (activeCategory !== 'ALL' && op.category !== activeCategory) {
        return false;
      }
      // 4. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = op.titleFa.toLowerCase().includes(query);
        const matchesDesc = op.descriptionFa.toLowerCase().includes(query);
        const matchesCat = op.categoryFa.toLowerCase().includes(query);
        const matchesKeywords = op.keywords.some((k) => k.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesCat || matchesKeywords;
      }
      return true;
    });
  }, [
    allOperations,
    features.enableInstallationServices,
    enableDoubleEntryAccounting,
    profileCode,
    activeCategory,
    searchQuery,
  ]);

  const categoryChips: Array<{ key: OperationCategory; label: string }> = [
    { key: 'ALL', label: 'همه عملیات' },
    { key: 'SALES', label: 'فروش و POS' },
    { key: 'PURCHASES', label: 'خرید و تدارکات' },
    { key: 'TREASURY', label: 'دریافت و پرداخت' },
    { key: 'CHEQUES', label: 'خزانه و چک' },
    { key: 'PARTIES', label: 'اشخاص و مشتریان' },
    { key: 'INVENTORY', label: 'کالا و انبار' },
    ...(features.enableInstallationServices
      ? [{ key: 'INSTALLATION' as OperationCategory, label: 'خدمات و نصب' }]
      : []),
    ...(enableDoubleEntryAccounting
      ? [{ key: 'ACCOUNTING' as OperationCategory, label: 'حسابداری و دفاتر' }]
      : []),
    { key: 'SETTINGS', label: 'تنظیمات و امنیت' },
  ];

  const handleSelectOperation = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-2xl max-h-[90dvh] flex flex-col text-right dir-rtl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 fill-white/20" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>مرکز عملیات و خدمات</span>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                  {companyName}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                دسترسی مستقیم و بدون واسطه به کلیه فرآیندهای مالی و کاری
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

        {/* Search Bar (حداکثر با چند لمس) */}
        <div className="relative shrink-0">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عملیات (مثلاً: فاکتور، چک، پرداخت، انبار، پروژه...)"
            className="w-full bg-slate-100 hover:bg-slate-100/90 focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-2xl pr-9 pl-9 py-2.5 border border-slate-200/80 focus:border-blue-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips - Wrapped so all categories (فروش، خرید، دریافت، چک، اشخاص، انبار، نصب، حسابداری...) are immediately visible */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 py-1">
          {categoryChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveCategory(c.key)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[32px] touch-manipulation active:scale-95 ${
                activeCategory === c.key
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Operations List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {filteredOperations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
              <p className="font-extrabold text-slate-700">هیچ عملیاتی با عبارت مورد نظر یافت نشد.</p>
              <p className="text-[11px] text-slate-400">
                لطفاً کلمه کلیدی دیگری وارد کنید یا دسته‌بندی را روی «همه عملیات» قرار دهید.
              </p>
            </div>
          ) : (
            filteredOperations.map((op) => {
              const IconComponent = op.icon;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => handleSelectOperation(op.tab)}
                  className="w-full p-3 bg-slate-50/90 hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl flex items-center justify-between text-right transition-all active:scale-[0.98] cursor-pointer group min-h-[58px] touch-manipulation shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${op.colorClass} shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {op.titleFa}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 shrink-0">
                          {op.categoryFa}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                        {op.descriptionFa}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-700 shrink-0 mr-1.5" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-colors touch-manipulation active:scale-[0.98] cursor-pointer"
          >
            بستن منوی عملیات
          </button>
        </div>
      </div>
    </div>
  );
};
