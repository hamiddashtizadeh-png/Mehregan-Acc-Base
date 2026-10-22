import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Landmark,
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Building2,
  ChevronLeft,
  DollarSign,
  FileText,
  Boxes,
  Wrench,
  Search,
  Calendar,
  Filter,
  Sparkles,
  RefreshCw,
  CreditCard,
  BarChart3,
  PieChart,
  Layers,
  ShieldCheck,
  Check,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Settings,
  LayoutGrid,
  X,
} from 'lucide-react';
import { FoundationDataResponse, resolveIndustryUiLabels, ExecutiveBiMetrics } from '../types/foundation';
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Input,
} from './ui';

interface DashboardViewProps {
  foundationData: FoundationDataResponse;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
}

export interface WidgetVisibility {
  kpiCards: boolean;
  salesChart: boolean;
  liquidityChart: boolean;
  recentInvoices: boolean;
  cctvProjects: boolean;
  bankVault: boolean;
  lowStockAlerts: boolean;
  quickShortcuts: boolean;
}

const DEFAULT_WIDGETS: WidgetVisibility = {
  kpiCards: true,
  salesChart: true,
  liquidityChart: true,
  recentInvoices: true,
  cctvProjects: true,
  bankVault: true,
  lowStockAlerts: true,
  quickShortcuts: true,
};

type DashboardPerspective = 'ALL' | 'TREASURY' | 'SALES' | 'PROJECTS' | 'INVENTORY' | 'PURCHASES';

export const DashboardView: React.FC<DashboardViewProps> = ({
  foundationData,
  onNavigateTab,
  onRefresh,
}) => {
  const industryProfile = foundationData.industryProfile;
  const profileCode = industryProfile?.code || 'CCTV_SECURITY';
  const features = industryProfile?.features || {
    enableInstallationServices: true,
    enableHardwareMacTracking: true,
    enableInstallersRole: true,
    enableWarrantyTracking: true,
    enableBarcodeScanQuickPos: true,
  };
  const uiLabels = resolveIndustryUiLabels(industryProfile);

  const [activePerspective, setActivePerspective] = useState<DashboardPerspective>('ALL');

  useEffect(() => {
    if (!features.enableInstallationServices && activePerspective === 'PROJECTS') {
      setActivePerspective('ALL');
    }
  }, [features.enableInstallationServices, activePerspective]);

  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Widget Visibility State (Persisted in localStorage)
  const [widgets, setWidgets] = useState<WidgetVisibility>(() => {
    try {
      const saved = localStorage.getItem('mehregan_dashboard_widgets_v1');
      if (saved) return { ...DEFAULT_WIDGETS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_WIDGETS;
  });

  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);

  const toggleWidget = (key: keyof WidgetVisibility) => {
    setWidgets((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mehregan_dashboard_widgets_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Executive BI Dashboard State (from server-side /api/system/executive-bi)
  const [executiveBi, setExecutiveBi] = useState<ExecutiveBiMetrics | null>(
    foundationData.executiveBi || null
  );
  const [biLoading, setBiLoading] = useState(false);
  const [biError, setBiError] = useState<string | null>(null);

  const fetchExecutiveBi = useCallback(async () => {
    try {
      setBiLoading(true);
      setBiError(null);
      const res = await fetch('/api/system/executive-bi');
      if (res.status === 403) {
        setBiError('دسترسی به شاخص‌های کلان مدیریتی (BI) برای سطح کاربری شما محدود شده است.');
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setExecutiveBi(data.metrics);
      } else {
        setBiError(data.messageFa || 'خطا در دریافت شاخص‌های هوش تجاری.');
      }
    } catch (err: unknown) {
      setBiError(err instanceof Error ? err.message : 'عدم دسترسی به سرویس هوش تجاری.');
    } finally {
      setBiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveBi();
  }, [fetchExecutiveBi]);

  // Live Iranian clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    fetchExecutiveBi();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Safe extractions
  const salesInvoices = foundationData.salesInvoices || [];
  const purchaseInvoices = foundationData.purchaseInvoices || [];
  const bankAccounts = foundationData.bankAccounts || [];
  const cashBoxes = foundationData.cashBoxes || [];
  const items = foundationData.items || [];
  const parties = foundationData.parties || [];
  const installationJobs = foundationData.installationJobs || [];
  const projects = foundationData.projects || [];
  const cheques = foundationData.cheques || [];

  // Financial calculations
  const totalSalesIrr = useMemo(
    () => salesInvoices.reduce((sum, inv) => sum + (inv.totalInvoiceAmountIrr || 0), 0),
    [salesInvoices]
  );

  const totalPurchasesIrr = useMemo(
    () =>
      purchaseInvoices.reduce(
        (sum, inv) => sum + (inv.totalInvoicePayableToSupplierIrr || inv.totalInventoryValuationIrr || 0),
        0
      ),
    [purchaseInvoices]
  );

  const totalBankBalanceIrr = useMemo(
    () => bankAccounts.reduce((sum, b) => sum + (b.balanceIrr || 0), 0),
    [bankAccounts]
  );

  const totalCashBalanceIrr = useMemo(
    () => cashBoxes.reduce((sum, c) => sum + (c.balanceIrr || 0), 0),
    [cashBoxes]
  );

  const totalLiquidityIrr = totalBankBalanceIrr + totalCashBalanceIrr;

  // Receivables & Payables
  const { totalReceivablesIrr, totalPayablesIrr } = useMemo(() => {
    let recv = 0;
    let pay = 0;
    parties.forEach((p) => {
      const bal = p.transactionsSummary?.netBalanceIrr ?? Number((p as any).currentBalanceIrr) ?? 0;
      // Negative netBalanceIrr indicates customer debt (مطالبات ما از مشتری)
      // Positive netBalanceIrr indicates supplier credit (بدهی ما به تأمین‌کننده)
      if (bal < 0) recv += Math.abs(bal);
      else if (bal > 0) pay += bal;
    });
    return { totalReceivablesIrr: recv, totalPayablesIrr: pay };
  }, [parties]);

  // Cheques calculations
  const inHandCheques = useMemo(
    () => cheques.filter((c) => c.chequeType === 'INBOUND' && (c.status === 'IN_HAND' || c.status === 'DEPOSITED')),
    [cheques]
  );
  const totalInHandChequesIrr = useMemo(
    () => inHandCheques.reduce((sum, c) => sum + (c.amountIrr || 0), 0),
    [inHandCheques]
  );

  // Low stock inventory
  const lowStockItems = useMemo(
    () => items.filter((item) => item.isLowStock || (item as any).stock <= item.minStockAlert),
    [items]
  );

  // Active projects & installation jobs
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'),
    [projects]
  );
  const activeJobs = useMemo(
    () => installationJobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED'),
    [installationJobs]
  );

  // Filtered recent sales invoices
  const filteredSales = useMemo(() => {
    return salesInvoices
      .filter((inv) => {
        const matchesQuery =
          !invoiceSearchQuery.trim() ||
          inv.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
          inv.customerTitleFa.toLowerCase().includes(invoiceSearchQuery.toLowerCase());

        const matchesStatus =
          invoiceStatusFilter === 'ALL'
            ? true
            : invoiceStatusFilter === 'PAID'
            ? inv.status === 'PAID'
            : inv.status !== 'PAID';

        return matchesQuery && matchesStatus;
      })
      .slice(0, 6);
  }, [salesInvoices, invoiceSearchQuery, invoiceStatusFilter]);

  // Sales Trend Data (Recent 7 invoices for SVG spark chart)
  const salesChartData = useMemo(() => {
    const sorted = [...salesInvoices].reverse().slice(-7);
    if (sorted.length === 0) {
      return [
        { label: 'شنبه', fullLabel: 'شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: '۱شنبه', fullLabel: '۱شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: '۲شنبه', fullLabel: '۲شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: '۳شنبه', fullLabel: '۳شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: '۴شنبه', fullLabel: '۴شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: '۵شنبه', fullLabel: '۵شنبه', amountIrr: 0, amountToman: 0, heightPct: 15 },
        { label: 'جمعه', fullLabel: 'جمعه', amountIrr: 0, amountToman: 0, heightPct: 15 },
      ];
    }
    const maxVal = Math.max(...sorted.map((s) => s.totalInvoiceAmountIrr || 0), 1000000);
    return sorted.map((s, idx) => ({
      label: s.dateJalali ? s.dateJalali.split('/').slice(1).join('/') : `#${idx + 1}`,
      fullLabel: `${s.customerTitleFa} (${s.invoiceNumber})`,
      amountIrr: s.totalInvoiceAmountIrr,
      amountToman: Math.round(s.totalInvoiceAmountIrr / 10),
      heightPct: Math.max(12, Math.min(100, Math.round(((s.totalInvoiceAmountIrr || 0) / maxVal) * 100))),
    }));
  }, [salesInvoices]);

  // Donut chart asset distribution
  const totalAssets = totalLiquidityIrr + totalInHandChequesIrr || 1;
  const bankPct = Math.round((totalBankBalanceIrr / totalAssets) * 100);
  const cashPct = Math.round((totalCashBalanceIrr / totalAssets) * 100);
  const chequePct = Math.round((totalInHandChequesIrr / totalAssets) * 100);
  const enableDoubleEntryAccounting = foundationData.settings?.enableDoubleEntryAccounting !== false;

  return (
    <div className="space-y-6 text-slate-800 pb-12">
      {/* 1. EXECUTIVE HERO COMMAND HEADER */}
      <Card
        variant="default"
        padding="lg"
        className="relative overflow-hidden bg-slate-900 border-slate-800 text-white shadow-sm"
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Brand & Greeting */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {foundationData.settings?.companyName || 'حسابداری یکپارچه مهرگان'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {currentTimeStr}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">
                {foundationData.activeUser?.jobTitle || 'مدیریت ارشد'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              خوش آمدید، {foundationData.activeUser?.fullName || 'مدیر سیستم'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {industryProfile?.descriptionFa || 'مرکز پایش هوشمند شاخص‌های مالی، جریان نقدینگی، فروشگاه POS، انبارداری و پروژه‌های کاری در یک نگاه.'}
            </p>
          </div>

          {/* Quick Actions & Sync */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateTab('SALES')}
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
            >
              {uiLabels.quickPosButtonLabelFa}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigateTab('TREASURY')}
              leftIcon={<ArrowDownLeft className="w-4 h-4 text-teal-400" />}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              دریافت / پرداخت
            </Button>

            {features.enableInstallationServices ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigateTab('INSTALLATION')}
                leftIcon={<Wrench className="w-4 h-4 text-cyan-400" />}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                {uiLabels.installationTabTitleFa}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigateTab('PURCHASES')}
                leftIcon={<ShoppingBag className="w-4 h-4 text-amber-400" />}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                {uiLabels.purchasesTabTitleFa}
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={handleManualRefresh}
              title="بروزرسانی داده‌های داشبورد"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />}
            />
          </div>
        </div>

        {/* Summary Metrics Strip inside Hero */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block text-[11px]">موجودی نقد و بانک در دسترس</span>
            <span className="font-mono font-black text-white text-sm sm:text-base tabular-nums block">
              {(totalLiquidityIrr / 10).toLocaleString('fa-IR')}
              <span className="text-[11px] text-slate-400 font-normal mr-1.5">تومان</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block text-[11px]">فاکتورهای فروش ثبت‌شده</span>
            <span className="font-mono font-black text-white text-sm sm:text-base tabular-nums block">
              {salesInvoices.length.toLocaleString('fa-IR')}{' '}
              <span className="text-[11px] text-slate-400 font-normal">سند</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block text-[11px]">
              {features.enableInstallationServices ? 'پروژه‌ها و سفارشات نصب فعال' : 'فاکتورهای خرید دوره'}
            </span>
            <span className="font-mono font-black text-white text-sm sm:text-base tabular-nums block">
              {features.enableInstallationServices
                ? (activeProjects.length + activeJobs.length).toLocaleString('fa-IR')
                : purchaseInvoices.length.toLocaleString('fa-IR')}{' '}
              <span className="text-[11px] text-slate-400 font-normal">
                {features.enableInstallationServices ? 'پروژه' : 'سند خرید'}
              </span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block text-[11px]">وضعیت موجودی بحرانی انبار</span>
            <span
              className={`font-mono font-black text-sm sm:text-base tabular-nums block ${
                lowStockItems.length > 0 ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {lowStockItems.length.toLocaleString('fa-IR')}{' '}
              <span className="text-[11px] text-slate-400 font-normal">قلم کالا</span>
            </span>
          </div>
        </div>
      </Card>

      {/* 2. INTERACTIVE PERSPECTIVE / VIEW FILTER TABS & WIDGET TOGGLES */}
      <div className="space-y-3">
        <Card variant="default" padding="sm" className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              دیدگاه تحلیلی:
            </span>
            <button
              type="button"
              onClick={() => setActivePerspective('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activePerspective === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              نمای جامع فرماندهی
            </button>
            <button
              type="button"
              onClick={() => setActivePerspective('TREASURY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activePerspective === 'TREASURY'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              نقدینگی و بانک‌ها
            </button>
            <button
              type="button"
              onClick={() => setActivePerspective('SALES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activePerspective === 'SALES'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              فروش و مطالبات
            </button>
            {features.enableInstallationServices ? (
              <button
                type="button"
                onClick={() => setActivePerspective('PROJECTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activePerspective === 'PROJECTS'
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-900'
                }`}
              >
                پروژه‌ها و نصب CCTV
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActivePerspective('PURCHASES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activePerspective === 'PURCHASES'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                {profileCode === 'SUPERMARKET_GROCERY' ? 'خرید و تأمین کالا' : 'خرید و تدارکات'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActivePerspective('INVENTORY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activePerspective === 'INVENTORY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              انبار و تدارکات
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWidgetManagerOpen(!isWidgetManagerOpen)}
              leftIcon={<Settings className="w-3.5 h-3.5 text-indigo-600" />}
            >
              مدیریت ویجت‌ها ({Object.values(widgets).filter(Boolean).length}/8)
            </Button>
            <div className="text-[11px] text-slate-500 font-normal px-2 hidden sm:block">
              سال مالی:{' '}
              <strong className="text-slate-800 font-mono tabular-nums">
                {foundationData.settings?.activeFiscalYearCode || '1405'}
              </strong>
            </div>
          </div>
        </Card>

        {/* WIDGET VISIBILITY CONTROL PANEL */}
        {isWidgetManagerOpen && (
          <Card variant="default" padding="md" className="bg-slate-900 text-white border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-extrabold text-white">
                  تنظیمات نمایش و سفارشی‌سازی ویجت‌های داشبورد
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsWidgetManagerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { key: 'kpiCards', label: 'کارت‌های شاخص کلیدی KPI' },
                { key: 'salesChart', label: 'نمودار تحلیل فروش' },
                { key: 'liquidityChart', label: 'نمودار ترکیب نقدینگی' },
                { key: 'recentInvoices', label: 'جدول فاکتورهای اخیر' },
                {
                  key: 'cctvProjects',
                  label: features.enableInstallationServices || profileCode === 'CCTV_SECURITY'
                    ? 'پروژه‌های نصب CCTV'
                    : profileCode === 'SUPERMARKET_GROCERY'
                    ? 'دیده‌بان صندوق و موجودی سوپرمارکت'
                    : profileCode === 'RETAIL_GENERAL'
                    ? 'دیده‌بان صندوق و فروشگاه خرده‌فروشی'
                    : 'دیده‌بان فروشگاه و پیش‌فاکتور',
                },
                { key: 'bankVault', label: 'موجودی بانک و صندوق' },
                { key: 'lowStockAlerts', label: 'دیده‌بان موجودی انبار' },
                { key: 'quickShortcuts', label: 'پنل عمودی میانبرها (راست)' },
              ].map((w) => {
                const active = widgets[w.key as keyof WidgetVisibility];
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => toggleWidget(w.key as keyof WidgetVisibility)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer font-bold text-right ${
                      active
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="truncate">{w.label}</span>
                    {active ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* MAIN DASHBOARD CONTAINER WITH RIGHT VERTICAL SHORTCUTS SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* RIGHT COLUMN IN RTL: VERTICAL QUICK ACCESS SHORTCUTS PANEL */}
        {widgets.quickShortcuts && (
          <Card variant="default" padding="md" className="lg:col-span-1 space-y-3 sticky top-28">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>میانبرهای دسترسی سریع</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">ماژول‌ها</span>
            </div>

            <div className="flex flex-col gap-2">
              {/* 1. SALES */}
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="w-full p-3 bg-slate-50/70 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {uiLabels.salesTabTitleFa}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {uiLabels.salesTabDescFa}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </button>

              {/* 2. PURCHASES */}
              <button
                type="button"
                onClick={() => onNavigateTab('PURCHASES')}
                className="w-full p-3 bg-slate-50/70 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {uiLabels.purchasesTabTitleFa}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {uiLabels.purchasesTabDescFa}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
              </button>

              {/* 3. TREASURY */}
              <button
                type="button"
                onClick={() => onNavigateTab('TREASURY')}
                className="w-full p-3 bg-slate-50/70 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {uiLabels.treasuryTabTitleFa}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {uiLabels.treasuryTabDescFa}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
              </button>

              {/* 4. PARTIES */}
              <button
                type="button"
                onClick={() => onNavigateTab('PARTIES')}
                className="w-full p-3 bg-slate-50/70 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {uiLabels.partiesTabTitleFa}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {uiLabels.partiesTabDescFa}
                    </span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
              </button>

              {/* 5. INVENTORY */}
              <button
                type="button"
                onClick={() => onNavigateTab('INVENTORY')}
                className="w-full p-3 bg-slate-50/70 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {uiLabels.inventoryTabTitleFa || 'کالا و انبارداری'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-medium">کاردکس و بارکد</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 transition-colors" />
              </button>

              {/* 6. ACCOUNTING */}
              {enableDoubleEntryAccounting && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('ACCOUNTING')}
                  className="w-full p-3 bg-slate-50/70 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">حسابداری کل</span>
                      <span className="text-[10px] text-slate-500 block font-medium">اسناد دوبل و دفاتر</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-colors" />
                </button>
              )}

              {/* 7. INSTALLATION */}
              {features.enableInstallationServices && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('INSTALLATION')}
                  className="w-full p-3 bg-slate-50/70 hover:bg-cyan-50/70 border border-slate-200/80 hover:border-cyan-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-cyan-600 text-white rounded-xl shadow-xs">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">خدمات و نصب CCTV</span>
                      <span className="text-[10px] text-slate-500 block font-medium">پروژه‌های نظارتی</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-cyan-700 transition-colors" />
                </button>
              )}

              {/* 8. SETTINGS_HEALTH */}
              <button
                type="button"
                onClick={() => onNavigateTab('SETTINGS_HEALTH')}
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl text-right transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-800 text-white rounded-xl shadow-xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">تنظیمات و صنف</span>
                    <span className="text-[10px] text-slate-500 block font-medium">پیکربندی سیستم</span>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
              </button>
            </div>
          </Card>
        )}

        {/* LEFT COLUMN IN RTL: MAIN ANALYTICAL DASHBOARD CONTENT */}
        <div className={`${widgets.quickShortcuts ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
          {/* 3. PRIMARY EXECUTIVE KPI METRIC CARDS */}
          {widgets.kpiCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Liquidity */}
              <Card
                variant="default"
                padding="md"
                onClick={() => onNavigateTab('TREASURY')}
                className={`group cursor-pointer hover:border-teal-400 transition-all flex flex-col justify-between ${
                  activePerspective === 'TREASURY' || activePerspective === 'ALL' ? '' : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">کل نقدینگی و خزانه</span>
                    <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                      {(totalLiquidityIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[11px] font-normal text-slate-500 mr-1.5">تومان</span>
                    </p>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.round((totalBankBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%` }}
                          className="bg-teal-600 h-full"
                          title="بانک‌ها"
                        />
                        <div
                          style={{ width: `${Math.round((totalCashBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%` }}
                          className="bg-emerald-400 h-full"
                          title="صندوق‌ها"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>بانک: {Math.round((totalBankBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%</span>
                        <span>صندوق: {Math.round((totalCashBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-teal-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>مدیریت حساب‌ها</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Card>

              {/* Card 2: Total Sales */}
              <Card
                variant="default"
                padding="md"
                onClick={() => onNavigateTab('SALES')}
                className={`group cursor-pointer hover:border-emerald-400 transition-all flex flex-col justify-between ${
                  activePerspective === 'SALES' || activePerspective === 'ALL' ? '' : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">
                      {uiLabels.salesTabTitleFa}
                    </span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-700 tracking-tight font-mono tabular-nums">
                      {(totalSalesIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[11px] font-normal text-slate-500 mr-1.5">تومان</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      تعداد: <strong className="text-slate-800 font-mono tabular-nums">{salesInvoices.length}</strong> فاکتور رسمی
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>{uiLabels.quickPosButtonLabelFa}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Card>

              {/* Card 3: Receivables */}
              <Card
                variant="default"
                padding="md"
                onClick={() => onNavigateTab('PARTIES')}
                className={`group cursor-pointer hover:border-blue-400 transition-all flex flex-col justify-between ${
                  activePerspective === 'SALES' || activePerspective === 'ALL' ? '' : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">مطالبات از خریداران</span>
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-blue-700 tracking-tight font-mono tabular-nums">
                      {(totalReceivablesIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[11px] font-normal text-slate-500 mr-1.5">تومان</span>
                    </p>
                    <p
                      className="text-[11px] text-slate-500 mt-1.5 truncate tabular-nums"
                      title={`بدهی به تأمین‌کنندگان: ${(totalPayablesIrr / 10).toLocaleString('fa-IR')} تومان`}
                    >
                      بدهی تأمین‌کننده: {(totalPayablesIrr / 10).toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>صورت‌حساب اشخاص</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Card>

              {/* Card 4: Installation & Projects OR Purchases & Supply */}
              {features.enableInstallationServices ? (
                <Card
                  variant="default"
                  padding="md"
                  onClick={() => onNavigateTab('INSTALLATION')}
                  className={`group cursor-pointer hover:border-cyan-400 transition-all flex flex-col justify-between ${
                    activePerspective === 'PROJECTS' || activePerspective === 'ALL' ? '' : 'opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-500">پروژه‌های نصب دوربین</span>
                      <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <Wrench className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                        {activeProjects.length + activeJobs.length}
                        <span className="text-[11px] font-normal text-slate-500 mr-1.5">مورد فعال</span>
                      </p>
                      <p className="text-[11px] text-cyan-800 font-medium mt-1.5">
                        کارتابل نصابان و پیشرفت میدانی
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span>مدیریت پروژه‌ها</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </Card>
              ) : (
                <Card
                  variant="default"
                  padding="md"
                  onClick={() => onNavigateTab('PURCHASES')}
                  className={`group cursor-pointer hover:border-amber-400 transition-all flex flex-col justify-between ${
                    activePerspective === 'PURCHASES' || activePerspective === 'ALL' ? '' : 'opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-500">
                        {uiLabels.purchasesTabTitleFa}
                      </span>
                      <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                        {(totalPurchasesIrr / 10).toLocaleString('fa-IR')}
                        <span className="text-[11px] font-normal text-slate-500 mr-1.5">تومان</span>
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium mt-1.5">
                        تعداد: <strong className="font-mono tabular-nums">{purchaseInvoices.length}</strong> فاکتور خرید دوره
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span>مدیریت خرید و ورود انبار</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </Card>
              )}

              {/* Card 5: In-hand Cheques */}
              <Card
                variant="default"
                padding="md"
                onClick={() => onNavigateTab('TREASURY')}
                className={`group cursor-pointer hover:border-indigo-400 transition-all flex flex-col justify-between ${
                  activePerspective === 'TREASURY' || activePerspective === 'ALL' ? '' : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">چک‌های نزد صندوق</span>
                    <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-indigo-700 tracking-tight font-mono tabular-nums">
                      {(totalInHandChequesIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[11px] font-normal text-slate-500 mr-1.5">تومان</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      تعداد: <strong className="text-slate-800 font-mono tabular-nums">{inHandCheques.length}</strong> فقره چک دریافتنی
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>دفتر چک و سررسید</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Card>

              {/* Card 6: Low Stock Alert */}
              <Card
                variant="default"
                padding="md"
                onClick={() => onNavigateTab('INVENTORY')}
                className={`group cursor-pointer hover:border-amber-400 transition-all flex flex-col justify-between ${
                  activePerspective === 'INVENTORY' || activePerspective === 'ALL' ? '' : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-500">اقلام نیازمند سفارش</span>
                    <div
                      className={`p-2.5 rounded-xl transition-colors ${
                        lowStockItems.length > 0
                          ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 tracking-tight font-mono tabular-nums">
                      {lowStockItems.length}
                      <span className="text-[11px] font-normal text-slate-500 mr-1.5">کالا</span>
                    </p>
                    <p
                      className={`text-[11px] font-bold mt-1.5 ${
                        lowStockItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {lowStockItems.length > 0 ? 'کمتر از نقطه سفارش انبار' : 'موجودی انبار در حد مطلوب'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>کاردکس و انبارداری</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </Card>
            </div>
          )}

          {/* EXECUTIVE BI: Server-Calculated Multi-Dimensional Metrics Panel */}
          <Card variant="default" padding="lg" className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-900">
                      هوش تجاری مدیران (Executive BI)
                    </h3>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      محاسبه برخط سرور
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    شاخص‌های کلان سودآوری، جریان نقدی، نسبت سرمایه در گردش و ۵ کالای پرفروش
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExecutiveBi}
                  disabled={biLoading}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${biLoading ? 'animate-spin' : ''}`} />}
                >
                  بروزرسانی شاخص‌ها
                </Button>
              </div>
            </div>

            {/* BI Loading State */}
            {biLoading && !executiveBi && (
              <div className="py-6 flex items-center justify-center gap-3 text-slate-500 text-xs">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>در حال دریافت و تحلیل شاخص‌های کلان هوش تجاری از سرور مرکزی...</span>
              </div>
            )}

            {/* BI Error State / Permission Denied */}
            {biError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{biError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={fetchExecutiveBi}>
                  تلاش مجدد
                </Button>
              </div>
            )}

            {/* BI Content */}
            {!biLoading && !biError && executiveBi && (
              <div className="space-y-4">
                {/* 4 Macro Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Metric 1: Gross Profit */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 block">سود ناخالص عملیاتی:</span>
                    <p className="text-base font-black text-emerald-700 font-mono tabular-nums">
                      {Math.round(executiveBi.totalGrossProfitIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[10px] font-normal text-slate-500 mr-1">تومان</span>
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                      درآمد: {Math.round(executiveBi.totalRevenueIrr / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {/* Metric 2: Net Profit */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 block">سود خالص دوره:</span>
                    <p className={`text-base font-black font-mono tabular-nums ${executiveBi.totalNetProfitIrr >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                      {Math.round(executiveBi.totalNetProfitIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[10px] font-normal text-slate-500 mr-1">تومان</span>
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                      هزینه‌ها: {Math.round(executiveBi.totalOperatingExpensesIrr / 10).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {/* Metric 3: Working Capital Ratio */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 block">نسبت سرمایه در گردش:</span>
                    <p className="text-base font-black text-teal-700 font-mono tabular-nums">
                      {executiveBi.workingCapitalRatio}x
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {executiveBi.workingCapitalRatio >= 1.5 ? 'پوشش مطلوب تعهدات جاری' : 'نیاز به مدیریت تعهدات'}
                    </span>
                  </div>

                  {/* Metric 4: Inventory Valuation & Cashflow */}
                  <div className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-500 block">ارزش ریالی موجودی کالا:</span>
                    <p className="text-base font-black text-slate-800 font-mono tabular-nums">
                      {Math.round(executiveBi.inventoryValuationIrr / 10).toLocaleString('fa-IR')}
                      <span className="text-[10px] font-normal text-slate-500 mr-1">تومان</span>
                    </p>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">وضعیت نقدینگی:</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded ${
                          executiveBi.cashFlowStatus === 'POSITIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : executiveBi.cashFlowStatus === 'NEUTRAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {executiveBi.cashFlowStatus === 'POSITIVE' ? 'مثبت' : executiveBi.cashFlowStatus === 'NEUTRAL' ? 'متعادل' : 'هشدار'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Selling Items from Executive BI */}
                {executiveBi.topSellingItems && executiveBi.topSellingItems.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>پرفروش‌ترین کالاها بر اساس تحلیل سرور:</span>
                      <span className="text-[11px] text-slate-400 font-normal">۵ کالای برتر دوره</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {executiveBi.topSellingItems.map((item, idx) => (
                        <div
                          key={item.itemId || idx}
                          className="bg-white border border-slate-200/80 p-2.5 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                            <span className="text-indigo-700 font-bold font-mono tabular-nums">
                              {item.quantity} عدد
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-[11px] truncate" title={item.titleFa}>
                            {item.titleFa}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono tabular-nums">
                            {Math.round(item.revenueIrr / 10).toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* 4. VISUAL CHARTS ROW: SALES VELOCITY & LIQUIDITY ALLOCATION */}
          {(widgets.salesChart || widgets.liquidityChart) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1 (2 cols): Recent Sales Velocity Spark-Chart */}
              {widgets.salesChart && (
                <Card variant="default" padding="lg" className="lg:col-span-2 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">
                          نمودار تحلیلی روند گردش و مبالغ فاکتورهای فروش اخیر
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          ارزش ریالی تراکنش‌های فروش متوالی در فروشگاه و دفتر مرکزی
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateTab('SALES')}
                      rightIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    >
                      مشاهده کل فاکتورها
                    </Button>
                  </div>

                  {/* SVG Animated Chart Visualization */}
                  <div className="pt-6 pb-2">
                    <div className="h-48 flex items-end gap-3 sm:gap-6 justify-between px-2 sm:px-4">
                      {salesChartData.map((d, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md shadow-lg font-mono tabular-nums pointer-events-none whitespace-nowrap mb-1">
                            {d.amountToman ? `${d.amountToman.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                          </div>

                          <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                            <div
                              style={{ height: `${d.heightPct}%` }}
                              className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-xl transition-all duration-700 group-hover:brightness-110 relative"
                            />
                          </div>

                          <span className="text-[11px] font-mono tabular-nums text-slate-500 group-hover:text-slate-900 font-bold">
                            {d.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>فروش خالص نقدی و اعتباری</span>
                      <span aria-hidden="true">·</span>
                      <span>میانگین ارزش فاکتورها</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-700 font-bold">
                      مجموع ۷ فاکتور اخیر: {salesChartData.reduce((s, x) => s + (x.amountToman || 0), 0).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </Card>
              )}

              {/* Chart 2 (1 col): Liquidity & Vault Distribution */}
              {widgets.liquidityChart && (
                <Card variant="default" padding="lg" className="flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">ترکیب دارایی‌های نقدینگی</h3>
                        <p className="text-[11px] text-slate-500">توزیع بین بانک، صندوق و اسناد نزد صندوق</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 flex items-center justify-center">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" className="text-slate-100 stroke-current" strokeWidth="12" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          className="text-teal-600 stroke-current transition-all duration-1000"
                          strokeWidth="12"
                          strokeDasharray={`${(bankPct * 238.76) / 100} 238.76`}
                          strokeDashoffset="0"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          className="text-emerald-400 stroke-current transition-all duration-1000"
                          strokeWidth="12"
                          strokeDasharray={`${(cashPct * 238.76) / 100} 238.76`}
                          strokeDashoffset={`${-((bankPct * 238.76) / 100)}`}
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          className="text-indigo-500 stroke-current transition-all duration-1000"
                          strokeWidth="12"
                          strokeDasharray={`${(chequePct * 238.76) / 100} 238.76`}
                          strokeDashoffset={`${-(((bankPct + cashPct) * 238.76) / 100)}`}
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">مجموع نقدینگی</span>
                        <span className="text-sm font-black font-mono text-slate-900 block tabular-nums">
                          {(totalAssets / 10).toLocaleString('fa-IR')}
                        </span>
                        <span className="text-[9px] text-slate-500">تومان</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-teal-600 inline-block" />
                        <span className="font-bold text-slate-800">حساب‌های بانکی ({bankAccounts.length})</span>
                      </div>
                      <span className="font-mono font-bold text-teal-800 tabular-nums">
                        {(totalBankBalanceIrr / 10).toLocaleString('fa-IR')} ت ({bankPct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-emerald-400 inline-block" />
                        <span className="font-bold text-slate-800">صندوق‌های نقدی ({cashBoxes.length})</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 tabular-nums">
                        {(totalCashBalanceIrr / 10).toLocaleString('fa-IR')} ت ({cashPct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md bg-indigo-500 inline-block" />
                        <span className="font-bold text-slate-800">چک‌های نزد صندوق ({inHandCheques.length})</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-800 tabular-nums">
                        {(totalInHandChequesIrr / 10).toLocaleString('fa-IR')} ت ({chequePct}%)
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* 5. MAIN OPERATIONS SPLIT: RECENT INVOICES & CCTV PROJECTS VS BANK VAULT & ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Invoices Table with Search & CCTV Active Projects */}
            <div className="lg:col-span-2 space-y-6">
              {/* Table: Recent Sales Invoices using Table & Input UI Primitives */}
              {widgets.recentInvoices && (
                <Card variant="default" padding="lg" className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-600" />
                        آخرین فاکتورهای فروش صادرشده
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        جستجو و فیلتر سریع فاکتورهای رسمی و تسویه‌حساب مشتریان
                      </p>
                    </div>

                    {/* Status Filter & Search */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex-1 sm:w-52">
                        <Input
                          type="text"
                          value={invoiceSearchQuery}
                          onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                          placeholder="جستجوی فاکتور / خریدار..."
                          rightIcon={<Search className="w-3.5 h-3.5" />}
                          className="py-1.5 text-xs"
                        />
                      </div>

                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => setInvoiceStatusFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                            invoiceStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          همه
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceStatusFilter('PAID')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                            invoiceStatusFilter === 'PAID' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          تسویه
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceStatusFilter('PENDING')}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                            invoiceStatusFilter === 'PENDING' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          بدهکار
                        </button>
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>شماره فاکتور</TableHead>
                        <TableHead>خریدار / مشتری</TableHead>
                        <TableHead className="text-center">تاریخ صدور</TableHead>
                        <TableHead numeric>مبلغ کل (تومان)</TableHead>
                        <TableHead className="text-center">وضعیت تسویه</TableHead>
                        <TableHead className="text-center">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length === 0 ? (
                        <TableEmptyState
                          colSpan={6}
                          title="موردی منطبق با فیلتر یا جستجو یافت نشد."
                        />
                      ) : (
                        filteredSales.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell numeric className="font-bold text-slate-900" dir="ltr">
                              #{inv.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              <div className="font-extrabold text-slate-900">{inv.customerTitleFa}</div>
                              {inv.notesFa && (
                                <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                                  {inv.notesFa}
                                </span>
                              )}
                            </TableCell>
                            <TableCell numeric className="text-center text-slate-600">
                              {inv.dateJalali}
                            </TableCell>
                            <TableCell numeric className="text-left font-black text-slate-900">
                              {(inv.totalInvoiceAmountIrr / 10).toLocaleString('fa-IR')}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`text-[11px] font-extrabold ${
                                  inv.status === 'PAID'
                                    ? 'text-emerald-700'
                                    : inv.status === 'PARTIALLY_PAID'
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {inv.status === 'PAID'
                                  ? 'تسویه کامل'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'تسویه ناقص'
                                  : 'در انتظار پرداخت'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={() => onNavigateTab('SALES')}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                title="مشاهده در ماژول فروش"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {/* Operations & Industry Specific Section */}
              {widgets.cctvProjects &&
                (features.enableInstallationServices ? (
                  /* Active CCTV Projects & Installations Section */
                  <Card variant="default" padding="lg" className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">
                            پروژه‌ها و سفارشات نصب فعال دوربین مداربسته (CCTV)
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            نظارت بر کارتابل نصابان، بازدیدهای میدانی و تحویل تجهیزات
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateTab('INSTALLATION')}
                        rightIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                      >
                        مشاهده کارتابل نصابان
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {projects.slice(0, 4).length === 0 && installationJobs.slice(0, 4).length === 0 ? (
                        <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          هیچ سفارش یا پروژه فعالی در جریان نیست. برای ثبت پروژه به بخش خدمات و نصب مراجعه کنید.
                        </div>
                      ) : (
                        projects.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => onNavigateTab('INSTALLATION')}
                            className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-cyan-300 transition-colors cursor-pointer space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-cyan-800">{p.projectCode}</span>
                              <span
                                className={`font-extrabold ${
                                  p.status === 'COMPLETED'
                                    ? 'text-emerald-700'
                                    : p.status === 'IN_PROGRESS'
                                    ? 'text-cyan-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {p.status === 'COMPLETED'
                                  ? 'تکمیل‌شده'
                                  : p.status === 'IN_PROGRESS'
                                  ? 'در حال اجرا'
                                  : 'در انتظار'}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">{p.titleFa}</h4>
                              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                مشتری: <strong>{p.customerTitleFa}</strong> · نصاب:{' '}
                                <span className="text-cyan-800 font-bold">{p.installerTitleFa || 'تعیین‌نشده'}</span>
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">مبلغ قرارداد:</span>
                              <span className="font-mono font-black text-slate-900 tabular-nums">
                                {(p.contractAmountIrr / 10).toLocaleString('fa-IR')} تومان
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ) : (
                  /* Universal Industry Operational & Fast Monitor */
                  <Card variant="default" padding="lg" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">
                            دیده‌بان عملیاتی {industryProfile?.badgeLabelFa || 'کسب‌وکار'} و گردش کالا
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {uiLabels.salesTabDescFa} و {uiLabels.purchasesTabDescFa}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onNavigateTab('SALES')}
                          leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          صندوق فروش سریع (F2)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigateTab('PURCHASES')}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          فاکتور خرید جدید
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div
                        onClick={() => onNavigateTab('SALES')}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">فاکتورهای ثبت‌شده دوره</span>
                          <span className="text-emerald-700 font-bold">صندوق POS</span>
                        </div>
                        <p className="text-xl font-black text-emerald-800 font-mono tabular-nums">
                          {salesInvoices.length} <span className="text-xs font-normal text-slate-500">فاکتور</span>
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          مجموع فروش: {(totalSalesIrr / 10).toLocaleString('fa-IR')} تومان
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigateTab('INVENTORY')}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">تنوع اقلام و کاردکس</span>
                          <span className="text-indigo-700 font-bold">موجودی انبار</span>
                        </div>
                        <p className="text-xl font-black text-indigo-800 font-mono tabular-nums">
                          {items.length} <span className="text-xs font-normal text-slate-500">قلم کالا</span>
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          اقلام کمتر از نقطه سفارش: <strong className="text-amber-700">{lowStockItems.length}</strong> کالا
                        </p>
                      </div>

                      <div
                        onClick={() => onNavigateTab('TREASURY')}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">صندوق‌ها و کارتخوان‌ها</span>
                          <span className="text-teal-700 font-bold">نقدینگی</span>
                        </div>
                        <p className="text-xl font-black text-teal-800 font-mono tabular-nums">
                          {cashBoxes.length + bankAccounts.length}{' '}
                          <span className="text-xs font-normal text-slate-500">مرکز تسویه</span>
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          موجودی نقد: {(totalCashBalanceIrr / 10).toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>

            {/* Right 1 Col: Real-time Bank Balances & Critical Inventory Alerts */}
            <div className="space-y-6">
              {/* Real-time Bank Accounts and Cash Registers */}
              {widgets.bankVault && (
                <Card variant="default" padding="lg" className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-teal-600" />
                      <h3 className="font-black text-sm text-slate-900">موجودی حساب‌ها و صندوق‌ها</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('TREASURY')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>خزانه</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {bankAccounts.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:border-teal-300 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-900">{b.bankNameFa}</p>
                          <p className="text-[10px] text-slate-500 font-mono tabular-nums">حساب: {b.accountNumber}</p>
                        </div>
                        <div className="text-left font-mono font-black text-teal-800 text-xs tabular-nums">
                          {(b.balanceIrr / 10).toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-slate-500">تومان</span>
                        </div>
                      </div>
                    ))}

                    {cashBoxes.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:border-emerald-300 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-900">{c.titleFa}</p>
                          <p className="text-[10px] text-slate-500">صندوق نقدی فروشگاه</p>
                        </div>
                        <div className="text-left font-mono font-black text-slate-900 text-xs tabular-nums">
                          {(c.balanceIrr / 10).toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-slate-500">تومان</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Critical Inventory Low Stock Alerts */}
              {widgets.lowStockAlerts && (
                <Card variant="default" padding="lg" className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h3 className="font-black text-sm text-slate-900">دیده‌بان موجودی کالای بحرانی</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('INVENTORY')}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>انبارداری</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {lowStockItems.length === 0 ? (
                      <div className="p-5 text-center text-emerald-700 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs">
                        <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                        تمامی اقلام کالا دارای موجودی بالاتر از نقطه هشدار می‌باشند.
                      </div>
                    ) : (
                      lowStockItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[170px]">{item.titleFa}</p>
                            <p className="text-[10px] text-slate-500 tabular-nums">
                              کد: <span className="font-mono">{item.itemCode || (item as any).code}</span> · حداقل هشدار:{' '}
                              {item.minStockAlert}
                            </p>
                          </div>
                          <div className="text-left font-mono font-black text-amber-900 text-xs tabular-nums">
                            {item.totalStock ?? (item as any).stock ?? 0}{' '}
                            <span className="text-[10px] font-normal">{item.unitNameFa || (item as any).unitFa || 'عدد'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

