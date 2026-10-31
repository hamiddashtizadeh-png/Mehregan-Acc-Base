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
  ListTodo,
  Activity,
  BellRing,
  ArrowRight,
  Palette,
  Maximize2,
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
  StatCard,
  Badge,
} from './ui';

interface DashboardViewProps {
  foundationData: FoundationDataResponse;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  onOpenOperations?: () => void;
}

export interface WidgetVisibility {
  smartAgent: boolean;
  smartLaunchpad: boolean;
  actionRequired: boolean;
  recentActivity: boolean;
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
  smartAgent: false,
  smartLaunchpad: true,
  actionRequired: true,
  recentActivity: true,
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
  onOpenOperations,
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
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('mehregan_active_ui_theme') || 'isee_smart_hub';
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ themeId: string }>;
      if (customEvent.detail?.themeId) {
        setActiveTheme(customEvent.detail.themeId);
      }
    };
    window.addEventListener('mehregan_theme_changed', handleThemeChange);
    return () => window.removeEventListener('mehregan_theme_changed', handleThemeChange);
  }, []);

  const toggleWidget = (key: keyof WidgetVisibility) => {
    setWidgets((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('mehregan_dashboard_widgets_v1', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('mehregan_widgets_changed', { detail: updated }));
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

  // 1. Action-Required Items Cockpit (کارهای نیازمند اقدام فوری)
  const actionRequiredItems = useMemo(() => {
    const list: Array<{
      id: string;
      titleFa: string;
      count: number;
      amountToman?: number;
      descriptionFa: string;
      urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
      targetTab: string;
      actionLabelFa: string;
      badgeText: string;
    }> = [];

    // Cheques in hand needing deposit/clearance
    const inHandCount = inHandCheques.length;
    if (inHandCount > 0) {
      list.push({
        id: 'CHEQUES_IN_HAND',
        titleFa: 'چک‌های صیادی نزد صندوق',
        count: inHandCount,
        amountToman: Math.round(totalInHandChequesIrr / 10),
        descriptionFa: 'نیازمند واگذاری به بانک، تعیین وضعیت یا ثبت وصول در سامانه صیاد',
        urgency: 'HIGH',
        targetTab: 'TREASURY',
        actionLabelFa: 'مدیریت چک‌ها در خزانه',
        badgeText: `${inHandCount} فقره چک`,
      });
    }

    // Critical low stock items
    if (lowStockItems.length > 0) {
      list.push({
        id: 'LOW_STOCK',
        titleFa: 'کسری موجودی اقلام بحرانی انبار',
        count: lowStockItems.length,
        descriptionFa: `${lowStockItems.slice(0, 2).map((i) => i.titleFa).join('، ')}${
          lowStockItems.length > 2 ? ' و سایر اقلام' : ''
        } زیر نقطه سفارش هستند`,
        urgency: 'HIGH',
        targetTab: 'INVENTORY',
        actionLabelFa: 'مشاهده کاردکس و ثبت سفارش خرید',
        badgeText: `${lowStockItems.length} قلم کالا`,
      });
    }

    // Unpaid sales receivables
    const pendingSales = salesInvoices.filter((inv) => inv.status !== 'PAID');
    const unpaidSalesAmountIrr = pendingSales.reduce(
      (sum, inv) =>
        sum +
        (inv.remainingBalanceIrr ??
          Math.max(0, (inv.totalInvoiceAmountIrr || 0) - (inv.paidAmountIrr || 0))),
      0
    );
    if (pendingSales.length > 0) {
      list.push({
        id: 'PENDING_SALES',
        titleFa: 'مطالبات فاکتورهای فروش معوق',
        count: pendingSales.length,
        amountToman: Math.round(unpaidSalesAmountIrr / 10),
        descriptionFa: 'فاکتورهای تسویه‌نشده مشتریان جهت پیگیری وصول و تسویه بدهی',
        urgency: 'MEDIUM',
        targetTab: 'SALES',
        actionLabelFa: 'پیگیری فاکتورهای بدهکار',
        badgeText: `${pendingSales.length} فاکتور باز`,
      });
    }

    // Installation tasks or projects awaiting assignment/approval
    const pendingInstallations = installationJobs.filter(
      (j) => j.status === 'PENDING_ASSIGNMENT' || j.status === 'ASSIGNED'
    );
    const pendingPrjs = projects.filter((p) => p.status === 'DRAFT' || p.status === 'APPROVED');
    const totalPendingOps = pendingInstallations.length + (features.enableInstallationServices ? pendingPrjs.length : 0);
    if (totalPendingOps > 0) {
      list.push({
        id: 'PENDING_INSTALLATIONS',
        titleFa: 'سفارشات خدمات و پروژه‌ها',
        count: totalPendingOps,
        descriptionFa: 'پروژه‌ها و سفارشات نیازمند تخصیص نصاب، صدور حواله تجهیزات یا تأیید کارفرما',
        urgency: 'NORMAL',
        targetTab: 'INSTALLATION',
        actionLabelFa: 'کارتابل خدمات و نصب',
        badgeText: `${totalPendingOps} سفارش منتظر اقدام`,
      });
    }

    // Accounts payable to suppliers
    if (totalPayablesIrr > 0) {
      list.push({
        id: 'ACCOUNTS_PAYABLE',
        titleFa: 'بدهی به تأمین‌کنندگان کالا',
        count: parties.filter((p) => (p.transactionsSummary?.netBalanceIrr ?? 0) > 0).length || 1,
        amountToman: Math.round(totalPayablesIrr / 10),
        descriptionFa: 'مانده‌حساب بستانکاری طرف‌حساب‌های خرید و سررسید فاکتورهای تدارکات',
        urgency: 'MEDIUM',
        targetTab: 'TREASURY',
        actionLabelFa: 'ثبت پرداخت و تسویه تدارکات',
        badgeText: 'تعهدات مالی',
      });
    }

    return list;
  }, [
    inHandCheques,
    totalInHandChequesIrr,
    lowStockItems,
    salesInvoices,
    installationJobs,
    projects,
    features.enableInstallationServices,
    totalPayablesIrr,
    parties,
  ]);

  // 2. Dynamic Recent System Activities Feed (آخرین فعالیت‌ها و وقایع سیستم)
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      category: 'SALE' | 'PURCHASE' | 'CHEQUE' | 'INSTALLATION' | 'SYSTEM';
      titleFa: string;
      counterpartyFa?: string;
      amountToman?: number;
      dateFa: string;
      statusFa: string;
      statusTone: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
      targetTab: string;
    }

    const list: ActivityItem[] = [];

    // Sales invoices
    salesInvoices.slice(0, 4).forEach((inv) => {
      list.push({
        id: `sale-${inv.id}`,
        category: 'SALE',
        titleFa: `فاکتور فروش #${inv.invoiceNumber}`,
        counterpartyFa: inv.customerTitleFa,
        amountToman: Math.round(inv.totalInvoiceAmountIrr / 10),
        dateFa: inv.dateJalali || 'ثبت شده',
        statusFa:
          inv.status === 'PAID'
            ? 'تسویه کامل'
            : inv.status === 'PARTIALLY_PAID'
            ? 'تسویه ناقص'
            : 'در انتظار پرداخت',
        statusTone: inv.status === 'PAID' ? 'emerald' : inv.status === 'PARTIALLY_PAID' ? 'amber' : 'purple',
        targetTab: 'SALES',
      });
    });

    // Purchase invoices
    purchaseInvoices.slice(0, 3).forEach((pur) => {
      list.push({
        id: `pur-${pur.id}`,
        category: 'PURCHASE',
        titleFa: `فاکتور خرید #${pur.invoiceNumber}`,
        counterpartyFa: pur.supplierTitleFa || 'تأمین‌کننده',
        amountToman: Math.round(
          (pur.totalInvoicePayableToSupplierIrr || pur.totalInventoryValuationIrr || 0) / 10
        ),
        dateFa: pur.dateJalali || 'ثبت شده',
        statusFa: pur.status === 'PAID' ? 'تسویه‌شده' : pur.status === 'PARTIALLY_PAID' ? 'تسویه ناقص' : 'مانده‌حساب',
        statusTone: pur.status === 'PAID' ? 'emerald' : 'blue',
        targetTab: 'PURCHASES',
      });
    });

    // Cheques
    cheques.slice(0, 3).forEach((chq) => {
      list.push({
        id: `chq-${chq.id}`,
        category: 'CHEQUE',
        titleFa: `${chq.chequeType === 'INBOUND' ? 'دریافت چک' : 'صدور چک'} ${
          chq.bankNameFa || 'بانک'
        } (${chq.chequeNumber})`,
        counterpartyFa: chq.partyNameFa || 'طرف‌حساب',
        amountToman: Math.round(chq.amountIrr / 10),
        dateFa: `سررسید: ${chq.dueDateJalali || '-'}`,
        statusFa:
          chq.status === 'CLEARED'
            ? 'وصول‌شده'
            : chq.status === 'IN_HAND'
            ? 'نزد صندوق'
            : 'در جریان وصول',
        statusTone: chq.status === 'CLEARED' ? 'emerald' : 'amber',
        targetTab: 'TREASURY',
      });
    });

    // Projects / installation jobs
    if (features.enableInstallationServices) {
      projects.slice(0, 2).forEach((prj) => {
        list.push({
          id: `prj-${prj.id}`,
          category: 'INSTALLATION',
          titleFa: `پروژه نظارتی: ${prj.titleFa}`,
          counterpartyFa: prj.customerTitleFa,
          amountToman: Math.round(prj.contractAmountIrr / 10),
          dateFa: prj.startDateJalali || 'پروژه جاری',
          statusFa:
            prj.status === 'COMPLETED'
              ? 'تکمیل‌شده'
              : prj.status === 'IN_PROGRESS'
              ? 'در حال اجرا'
              : 'در انتظار',
          statusTone: prj.status === 'COMPLETED' ? 'emerald' : 'purple',
          targetTab: 'INSTALLATION',
        });
      });
    }

    // Audit logs
    const auditEvents = foundationData.auditLogs || foundationData.executiveBi?.recentAuditEvents || [];
    auditEvents.slice(0, 2).forEach((log) => {
      list.push({
        id: `audit-${log.id}`,
        category: 'SYSTEM',
        titleFa: (log as any).actionTitleFa || (log as any).action || 'رویداد امنیتی سیستم',
        counterpartyFa: (log as any).actorUsername || 'کاربر سیستم',
        dateFa: log.timestamp
          ? new Date(log.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          : 'امروز',
        statusFa: 'ثبت امن',
        statusTone: 'slate',
        targetTab: 'SETTINGS_HEALTH',
      });
    });

    return list.slice(0, 8);
  }, [
    salesInvoices,
    purchaseInvoices,
    cheques,
    features.enableInstallationServices,
    projects,
    foundationData.auditLogs,
    foundationData.executiveBi?.recentAuditEvents,
  ]);

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
      {/* ========================================================================= */}
      {/* 1. MOBILE BANKING DASHBOARD (مخصوص موبایل: کوتاه، خلوت و سریع) */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4 select-none">
        {/* کارت خلاصه وضعیت نقدینگی و دارایی (Mobile Banking Card) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/80 space-y-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-black text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{foundationData.settings?.companyName || 'مهرگان'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tabular-nums text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {currentTimeStr}
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                title="بروزرسانی اطلاعات"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block font-medium">موجودی نقد و بانک در دسترس:</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-white">
                {(totalLiquidityIrr / 10).toLocaleString('fa-IR')}
              </span>
              <span className="text-xs text-slate-300 font-bold">تومان</span>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">فروش دوره</span>
              <span className="font-mono font-black text-emerald-400 text-xs tabular-nums block mt-0.5">
                {(totalSalesIrr / 10).toLocaleString('fa-IR')} <span className="text-[9px] font-normal">ت</span>
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">مطالبات مشتری</span>
              <span className="font-mono font-black text-amber-300 text-xs tabular-nums block mt-0.5">
                {(totalReceivablesIrr / 10).toLocaleString('fa-IR')} <span className="text-[9px] font-normal">ت</span>
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">بدهی تأمین</span>
              <span className="font-mono font-black text-rose-300 text-xs tabular-nums block mt-0.5">
                {(totalPayablesIrr / 10).toLocaleString('fa-IR')} <span className="text-[9px] font-normal">ت</span>
              </span>
            </div>
          </div>
        </div>

        {/* حداکثر ۴ عملیات محبوب و پرتکرار (Max 4 Top Favorite Operations) */}
        <Card variant="default" padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>عملیات پرکاربرد</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenOperations) {
                  onOpenOperations();
                } else {
                  onNavigateTab('SALES');
                }
              }}
              className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>مشاهده همه عملیات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. SALES */}
            <button
              type="button"
              onClick={() => onNavigateTab('SALES')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all text-right flex items-center gap-2.5 active:scale-[0.97] touch-manipulation cursor-pointer min-h-[58px]"
            >
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">
                  {uiLabels.quickPosButtonLabelFa || 'فروش POS'}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">فاکتور و تسویه</span>
              </div>
            </button>

            {/* 2. PURCHASES */}
            <button
              type="button"
              onClick={() => onNavigateTab('PURCHASES')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 transition-all text-right flex items-center gap-2.5 active:scale-[0.97] touch-manipulation cursor-pointer min-h-[58px]"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">فاکتور خرید</span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">تأمین کالا</span>
              </div>
            </button>

            {/* 3. TREASURY */}
            <button
              type="button"
              onClick={() => onNavigateTab('TREASURY')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300 transition-all text-right flex items-center gap-2.5 active:scale-[0.97] touch-manipulation cursor-pointer min-h-[58px]"
            >
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">دریافت و پرداخت</span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">خزانه و چک صیادی</span>
              </div>
            </button>

            {/* 4. INVENTORY or INSTALLATION */}
            {features.enableInstallationServices ? (
              <button
                type="button"
                onClick={() => onNavigateTab('INSTALLATION')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-cyan-50/70 border border-slate-200/80 hover:border-cyan-300 transition-all text-right flex items-center gap-2.5 active:scale-[0.97] touch-manipulation cursor-pointer min-h-[58px]"
              >
                <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">خدمات و نصب</span>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">پروژه و نصابان</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('INVENTORY')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 transition-all text-right flex items-center gap-2.5 active:scale-[0.97] touch-manipulation cursor-pointer min-h-[58px]"
              >
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">کالا و انبارداری</span>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">موجودی و کاردکس</span>
                </div>
              </button>
            )}
          </div>
        </Card>

        {/* حداکثر ۳ مورد نیازمند اقدام فوری (Max 3 Action-Required Items) */}
        <Card variant="default" padding="sm" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
              <ListTodo className="w-3.5 h-3.5 text-rose-600" />
              <span>کارهای نیازمند اقدام فوری</span>
            </div>
            {actionRequiredItems.length > 0 ? (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {Math.min(actionRequiredItems.length, 3).toLocaleString('fa-IR')} مورد
              </span>
            ) : (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                پایدار
              </span>
            )}
          </div>

          {actionRequiredItems.length === 0 ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تمام چک‌ها، اسناد و موجودی انبار در وضعیت پایدار هستند.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {actionRequiredItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab(item.targetTab)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.98] touch-manipulation ${
                    item.urgency === 'HIGH'
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                      : item.urgency === 'MEDIUM'
                      ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400'
                      : 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 ${
                          item.urgency === 'HIGH'
                            ? 'text-rose-600'
                            : item.urgency === 'MEDIUM'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <span className="font-black text-xs text-slate-900 truncate">{item.titleFa}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                          item.urgency === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : item.urgency === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{item.descriptionFa}</p>
                    {item.amountToman !== undefined && (
                      <p className="text-[11px] font-mono font-black text-slate-800 tabular-nums">
                        مبلغ: {item.amountToman.toLocaleString('fa-IR')} تومان
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* دسترسی مستقیم به سایر بخش‌های مهم */}
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-xs">گردش حساب و تراکنش‌ها</p>
              <p className="text-[10px] text-slate-500">مشاهده ریز دریافت، پرداخت و اسناد</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('TREASURY')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-extrabold hover:bg-blue-100 transition-colors cursor-pointer text-xs"
          >
            مشاهده
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP EXECUTIVE DASHBOARD (نسخه دسکتاپ کامل و دست‌نخورده) */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
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
              مدیریت ویجت‌ها ({Object.values(widgets).filter(Boolean).length}/{Object.keys(widgets).length})
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
                { key: 'smartAgent', label: 'دستیار و ایجنت حسابدار ارشد مهرگان (AI)' },
                { key: 'smartLaunchpad', label: 'میز کار هوشمند (میانبرهای پرتکرار)' },
                { key: 'actionRequired', label: 'کارهای نیازمند اقدام فوری (Cockpit)' },
                { key: 'recentActivity', label: 'جریان رویدادها و فعالیت‌های زنده' },
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
                { key: 'quickShortcuts', label: 'پنل عمودی میانبرها (ستون جانبی)' },
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

      {/* 2.5 SMART WORKSPACE FREQUENT ACTIONS LAUNCHPAD */}
      {widgets.smartLaunchpad && (
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                میز کار هوشمند: میانبرهای عملیات پرتکرار
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              دسترسی سریع به ماژول‌های پرکاربرد سیستم
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('SALES')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                {uiLabels.quickPosButtonLabelFa || 'فروش POS'}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 block truncate">
                فاکتور و تسویه
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('PURCHASES')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                فاکتور خرید
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-700 block truncate">
                تأمین کالا
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('TREASURY')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                خزانه و چک
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-teal-700 block truncate">
                بانک و صندوق
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('INVENTORY')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                کاردکس انبار
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-700 block truncate">
                موجودی و بارکد
              </span>
            </button>

            {features.enableInstallationServices ? (
              <button
                type="button"
                onClick={() => onNavigateTab('INSTALLATION')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-cyan-50/80 border border-slate-200/80 hover:border-cyan-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
              >
                <div className="p-2.5 bg-cyan-100 text-cyan-800 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                  خدمات و نصب
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-700 block truncate">
                  پروژه‌ها و نصاب
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('SALES')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
              >
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                  پیش‌فاکتور
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 block truncate">
                  استعلام قیمت
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('PARTIES')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                اشخاص و طرفین
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-700 block truncate">
                مانده‌حساب‌ها
              </span>
            </button>

            {enableDoubleEntryAccounting ? (
              <button
                type="button"
                onClick={() => onNavigateTab('ACCOUNTING')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
              >
                <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                  حسابداری دوبل
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-purple-700 block truncate">
                  اسناد و تراز
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('TREASURY')}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
              >
                <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                  هزینه‌ها و درآمد
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-purple-700 block truncate">
                  سایر مخارج
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('SETTINGS_HEALTH')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer min-h-[58px] active:scale-95 touch-manipulation"
            >
              <div className="p-2.5 bg-slate-200 text-slate-800 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-900 block truncate max-w-full">
                تنظیمات سیستم
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-800 block truncate">
                پیکربندی و صنف
              </span>
            </button>
          </div>
        </Card>
      )}

      {/* ACTION-REQUIRED COCKPIT */}
      {widgets.actionRequired && (
        <Card variant="default" padding="md" className="space-y-3.5 border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-rose-600" />
              <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <span>کارهای نیازمند اقدام فوری (Cockpit)</span>
                {actionRequiredItems.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                    {actionRequiredItems.length.toLocaleString('fa-IR')} مورد اقدام
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    وضعیت پایدار
                  </span>
                )}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              تعهدات سررسیدشده، هشدارهای کسری انبار و اسناد منتظر تعیین تکلیف
            </p>
          </div>

          {actionRequiredItems.length === 0 ? (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تمامی اسناد، چک‌های صیادی و موجودی کالا در وضعیت پایدار هستند و هیچ اقدام معوقی ثبت نشده است.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {actionRequiredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab(item.targetTab)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group hover:shadow-sm ${
                    item.urgency === 'HIGH'
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                      : item.urgency === 'MEDIUM'
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                      : 'bg-blue-50/40 border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                        <AlertTriangle
                          className={`w-3.5 h-3.5 shrink-0 ${
                            item.urgency === 'HIGH'
                              ? 'text-rose-600'
                              : item.urgency === 'MEDIUM'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                          }`}
                        />
                        <span className="truncate">{item.titleFa}</span>
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          item.urgency === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : item.urgency === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {item.descriptionFa}
                    </p>

                    {item.amountToman !== undefined && (
                      <p className="text-xs font-mono font-black text-slate-900 tabular-nums pt-0.5">
                        مبلغ درگیر: {item.amountToman.toLocaleString('fa-IR')}{' '}
                        <span className="text-[10px] font-normal text-slate-500">تومان</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-700 group-hover:text-slate-900">
                    <span className="group-hover:translate-x-[-2px] transition-transform">{item.actionLabelFa}</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-[-2px] transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* MAIN DASHBOARD CONTAINER WITH RIGHT VERTICAL SHORTCUTS SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* RIGHT COLUMN IN RTL: VERTICAL QUICK ACCESS SHORTCUTS PANEL (DESKTOP DOCK) */}
        {widgets.quickShortcuts && (
          <Card variant="default" padding="md" className="hidden lg:block lg:col-span-1 space-y-3 sticky top-28">
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
              <StatCard
                title="کل نقدینگی و خزانه"
                value={(totalLiquidityIrr / 10).toLocaleString('fa-IR')}
                unit="تومان"
                icon={<Landmark className="w-5 h-5" />}
                color="emerald"
                secondaryStats={[
                  { label: 'بانک‌ها', value: `${Math.round((totalBankBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%` },
                  { label: 'صندوق‌ها', value: `${Math.round((totalCashBalanceIrr / (totalLiquidityIrr || 1)) * 100)}%` },
                ]}
                actionLabel="مدیریت حساب‌ها"
                onClick={() => onNavigateTab('TREASURY')}
                className={activePerspective === 'TREASURY' || activePerspective === 'ALL' ? '' : 'opacity-60'}
              />

              {/* Card 2: Total Sales */}
              <StatCard
                title={uiLabels.salesTabTitleFa}
                value={(totalSalesIrr / 10).toLocaleString('fa-IR')}
                unit="تومان"
                icon={<ShoppingCart className="w-5 h-5" />}
                color="blue"
                subtitle={`${salesInvoices.length.toLocaleString('fa-IR')} فاکتور فروش ثبت‌شده`}
                actionLabel={uiLabels.quickPosButtonLabelFa}
                onClick={() => onNavigateTab('SALES')}
                className={activePerspective === 'SALES' || activePerspective === 'ALL' ? '' : 'opacity-60'}
              />

              {/* Card 3: Receivables */}
              <StatCard
                title="مطالبات از خریداران"
                value={(totalReceivablesIrr / 10).toLocaleString('fa-IR')}
                unit="تومان"
                icon={<Users className="w-5 h-5" />}
                color="rose"
                subtitle={`بدهی تأمین‌کننده: ${(totalPayablesIrr / 10).toLocaleString('fa-IR')} تومان`}
                actionLabel="صورت‌حساب اشخاص"
                onClick={() => onNavigateTab('PARTIES')}
                className={activePerspective === 'SALES' || activePerspective === 'ALL' ? '' : 'opacity-60'}
              />

              {/* Card 4: Installation & Projects OR Purchases & Supply */}
              {features.enableInstallationServices ? (
                <StatCard
                  title="پروژه‌های نصب دوربین"
                  value={(activeProjects.length + activeJobs.length).toLocaleString('fa-IR')}
                  unit="مورد فعال"
                  icon={<Wrench className="w-5 h-5" />}
                  color="cyan"
                  subtitle="کارتابل نصابان و پیشرفت میدانی"
                  actionLabel="مدیریت پروژه‌ها"
                  onClick={() => onNavigateTab('INSTALLATION')}
                  className={activePerspective === 'PROJECTS' || activePerspective === 'ALL' ? '' : 'opacity-60'}
                />
              ) : (
                <StatCard
                  title={uiLabels.purchasesTabTitleFa}
                  value={(totalPurchasesIrr / 10).toLocaleString('fa-IR')}
                  unit="تومان"
                  icon={<ShoppingBag className="w-5 h-5" />}
                  color="amber"
                  subtitle={`${purchaseInvoices.length.toLocaleString('fa-IR')} فاکتور خرید دوره`}
                  actionLabel="مدیریت خرید و ورود انبار"
                  onClick={() => onNavigateTab('PURCHASES')}
                  className={activePerspective === 'PURCHASES' || activePerspective === 'ALL' ? '' : 'opacity-60'}
                />
              )}

              {/* Card 5: In-hand Cheques */}
              <StatCard
                title="چک‌های نزد صندوق"
                value={(totalInHandChequesIrr / 10).toLocaleString('fa-IR')}
                unit="تومان"
                icon={<CreditCard className="w-5 h-5" />}
                color="purple"
                subtitle={`${inHandCheques.length.toLocaleString('fa-IR')} فقره چک دریافتنی`}
                actionLabel="دفتر چک و سررسید"
                onClick={() => onNavigateTab('TREASURY')}
                className={activePerspective === 'TREASURY' || activePerspective === 'ALL' ? '' : 'opacity-60'}
              />

              {/* Card 6: Low Stock Alert */}
              <StatCard
                title="اقلام نیازمند سفارش"
                value={lowStockItems.length.toLocaleString('fa-IR')}
                unit="کالا"
                icon={<AlertTriangle className="w-5 h-5" />}
                color={lowStockItems.length > 0 ? 'amber' : 'slate'}
                subtitle={lowStockItems.length > 0 ? 'کمتر از نقطه سفارش انبار' : 'موجودی انبار در حد مطلوب'}
                actionLabel="کاردکس و انبارداری"
                onClick={() => onNavigateTab('INVENTORY')}
                className={activePerspective === 'INVENTORY' || activePerspective === 'ALL' ? '' : 'opacity-60'}
              />
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

          {/* RECENT ACTIVITIES & LIVE EVENTS STREAM */}
          {widgets.recentActivity && (
            <Card variant="default" padding="lg" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      آخرین فعالیت‌ها و رویدادهای زنده سیستم
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      پایش لحظه‌ای فاکتورهای فروش و خرید، اسناد خزانه و رویدادهای عملیاتی
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />}
                  >
                    بروزرسانی
                  </Button>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                  هنوز رویداد یا فعالیتی در دوره ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentActivities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => onNavigateTab(act.targetTab)}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99] touch-manipulation"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            act.category === 'SALE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.category === 'PURCHASE'
                              ? 'bg-amber-100 text-amber-800'
                              : act.category === 'CHEQUE'
                              ? 'bg-teal-100 text-teal-800'
                              : act.category === 'INSTALLATION'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {act.category === 'SALE' && <ShoppingCart className="w-4 h-4" />}
                          {act.category === 'PURCHASE' && <ShoppingBag className="w-4 h-4" />}
                          {act.category === 'CHEQUE' && <Landmark className="w-4 h-4" />}
                          {act.category === 'INSTALLATION' && <Wrench className="w-4 h-4" />}
                          {act.category === 'SYSTEM' && <ShieldCheck className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 truncate group-hover:text-indigo-900 transition-colors">
                            {act.titleFa}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {act.counterpartyFa && <span className="font-medium text-slate-700">{act.counterpartyFa} · </span>}
                            <span className="font-mono tabular-nums">{act.dateFa}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0 space-y-1">
                        {act.amountToman !== undefined && (
                          <p className="font-mono font-black text-xs text-slate-900 tabular-nums">
                            {act.amountToman.toLocaleString('fa-IR')}{' '}
                            <span className="text-[10px] font-normal text-slate-500">تومان</span>
                          </p>
                        )}
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            act.statusTone === 'emerald'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.statusTone === 'amber'
                              ? 'bg-amber-100 text-amber-800'
                              : act.statusTone === 'blue'
                              ? 'bg-blue-100 text-blue-800'
                              : act.statusTone === 'purple'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {act.statusFa}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
                              <Badge
                                variant={
                                  inv.status === 'PAID'
                                    ? 'success'
                                    : inv.status === 'PARTIALLY_PAID'
                                    ? 'warning'
                                    : 'danger'
                                }
                                size="sm"
                                dot
                              >
                                {inv.status === 'PAID'
                                  ? 'تسویه کامل'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'تسویه ناقص'
                                  : 'در انتظار پرداخت'}
                              </Badge>
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
  </div>
);
};

