import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Users,
  Shield,
  FileText,
  Sliders,
  KeyRound,
  UserCheck,
  Database,
  RefreshCw,
  AlertTriangle,
  Zap,
  Landmark,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wrench,
  Settings,
  BookOpen,
  ChevronDown,
  Scale,
  UtensilsCrossed,
  Truck,
  Smartphone,
  LogOut,
  Home,
  Receipt,
  LayoutGrid,
  MoreHorizontal,
  Search,
  Sparkles,
  Inbox,
  Bell,
  Boxes,
  Plus,
} from 'lucide-react';
import { LayoutDashboard } from 'lucide-react';
import { FoundationDataResponse, PublicUser, resolveIndustryUiLabels } from './types/foundation';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { QuickAccessMobileDrawer } from './components/QuickAccessMobileDrawer';
import { MobileMoreDrawer } from './components/MobileMoreDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NaturalLanguageActionModal } from './components/NaturalLanguageActionModal';
import { ActionInboxView } from './components/ActionInboxView';
import { BusinessFeaturesHubView } from './components/BusinessFeaturesHubView';
import { UserManagementView } from './components/UserManagementView';
import { RbacConsoleView } from './components/RbacConsoleView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsAndHealthView } from './components/SettingsAndHealthView';
import { ConnectionDeploymentView } from './components/ConnectionDeploymentView';
import { PartiesManagementView } from './components/PartiesManagementView';
import { InventoryManagementView } from './components/InventoryManagementView';
import { PurchasesManagementView } from './components/PurchasesManagementView';
import { SalesManagementView } from './components/SalesManagementView';
import { InstallationManagementView } from './components/InstallationManagementView';
import { TreasuryManagementView } from './components/TreasuryManagementView';
import { AccountingManagementView } from './components/AccountingManagementView';
import { DashboardView } from './components/DashboardView';
import { SmartAgentWidget } from './components/SmartAgentWidget';
import { GoldDualLedgerView } from './components/GoldDualLedgerView';
import { RestaurantCafeManagementView } from './components/RestaurantCafeManagementView';
import { WholesaleDistributionView } from './components/WholesaleDistributionView';
import { MobileElectronicsManagementView } from './components/MobileElectronicsManagementView';
import { ServicesContractingView } from './components/ServicesContractingView';
import { InstallerPortalView } from './components/InstallerPortalView';
import { Button, Card } from './components/ui';
import { getActiveThemeId, getThemeConfig, applyAppTheme } from './utils/themeEngine';

type WorkspaceTab =
  | 'DASHBOARD'
  | 'BUSINESS_FEATURES_HUB'
  | 'SALES'
  | 'PURCHASES'
  | 'PARTIES'
  | 'INVENTORY'
  | 'ACCOUNTING'
  | 'TREASURY'
  | 'INSTALLATION'
  | 'DEPLOYMENT'
  | 'USERS'
  | 'RBAC'
  | 'AUDIT'
  | 'SETTINGS_HEALTH'
  | 'GOLD_DUAL_LEDGER'
  | 'RESTAURANT_CAFE'
  | 'WHOLESALE_DISTRIBUTION'
  | 'MOBILE_ELECTRONICS'
  | 'SERVICES_CONTRACTING';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('DASHBOARD');
  const [foundationData, setFoundationData] = useState<FoundationDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isQuickSubmenuOpen, setIsQuickSubmenuOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Global Search, Natural Language Actions (Gemini 3.8 Flash), and Action Inbox states
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isNlActionModalOpen, setIsNlActionModalOpen] = useState(false);
  const [isActionInboxOpen, setIsActionInboxOpen] = useState(false);
  const [nlInitialPrompt, setNlInitialPrompt] = useState('');

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // UI Themes & Layout Customization State
  const [activeThemeId, setActiveThemeId] = useState<string>(() => getActiveThemeId());
  const activeThemeConfig = useMemo(() => getThemeConfig(activeThemeId), [activeThemeId]);

  useEffect(() => {
    // Initial sync
    const currentTheme = getActiveThemeId();
    applyAppTheme(currentTheme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ themeId: string }>;
      if (customEvent.detail?.themeId) {
        setActiveThemeId(customEvent.detail.themeId);
      }
    };
    window.addEventListener('mehregan_theme_changed', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('mehregan_theme_changed', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Compute urgent actionable items count for header and navigation badges
  const urgentActionCount = useMemo(() => {
    if (!foundationData) return 0;
    let count = 0;
    foundationData.salesProformas?.forEach((p) => {
      if (p.status === 'APPROVED' || p.status === 'DRAFT') count++;
    });
    foundationData.parties?.forEach((p) => {
      if (Number(p.transactionsSummary?.netBalanceIrr || 0) < -10000000) count++;
    });
    foundationData.items?.forEach((i) => {
      if (Number(i.totalStock || 0) <= 0) count++;
    });
    foundationData.projects?.forEach((prj) => {
      if (prj.status === 'IN_PROGRESS' && !prj.installerId) count++;
    });
    return count;
  }, [foundationData]);

  // Mehregan Chief Accountant Agent (AI assistant): Hidden by default, toggled via Dashboard widgets
  const [showSmartAgent, setShowSmartAgent] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mehregan_dashboard_widgets_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.smartAgent === true;
      }
    } catch {
      // fallback
    }
    return false;
  });

  useEffect(() => {
    const handleWidgetsChange = (e: Event) => {
      try {
        const customEvent = e as CustomEvent<any>;
        if (customEvent.detail && typeof customEvent.detail.smartAgent === 'boolean') {
          setShowSmartAgent(customEvent.detail.smartAgent);
          return;
        }
        const saved = localStorage.getItem('mehregan_dashboard_widgets_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          setShowSmartAgent(parsed.smartAgent === true);
        }
      } catch {
        // fallback
      }
    };

    window.addEventListener('mehregan_widgets_changed', handleWidgetsChange);
    window.addEventListener('storage', handleWidgetsChange);
    return () => {
      window.removeEventListener('mehregan_widgets_changed', handleWidgetsChange);
      window.removeEventListener('storage', handleWidgetsChange);
    };
  }, []);

  const fetchFoundationData = useCallback(async (retryCount = 0) => {
    try {
      setNetworkError(null);
      const token = localStorage.getItem('mehregan_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Session-Token'] = token;
      }

      const res = await fetch('/api/foundation/overview', { headers });
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok || !contentType.includes('application/json')) {
        if (res.status === 401) {
          setFoundationData(null);
          return;
        }
        // If server is warming up or during restart, auto-retry up to 3 times
        if (retryCount < 3) {
          await new Promise((r) => setTimeout(r, 800));
          return fetchFoundationData(retryCount + 1);
        }
        throw new Error(
          `پاسخ دریافتی از سرور هنوز در دسترس نیست (${res.status} ${res.statusText}). لطفا روی «تلاش مجدد» کلیک کنید.`
        );
      }

      const json = await res.json();
      if (json.ok) {
        if (json.authenticated === false || !json.data) {
          setFoundationData(null);
        } else {
          setFoundationData(json.data);
        }
      } else {
        if (json.errorCode === 'UNAUTHENTICATED' || json.authenticated === false) {
          setFoundationData(null);
        } else {
          setNetworkError(json.messageFa || 'خطا در دریافت اطلاعات دیتابیس.');
        }
      }
    } catch (err: unknown) {
      if (retryCount < 3) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchFoundationData(retryCount + 1);
      }
      setNetworkError(
        err instanceof Error ? err.message : 'عدم دسترسی به سرور مرکزی Backend روی پورت 3000.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoundationData();
    const handleUnauthenticated = () => {
      setFoundationData(null);
    };
    window.addEventListener('mehregan:unauthenticated', handleUnauthenticated);
    return () => window.removeEventListener('mehregan:unauthenticated', handleUnauthenticated);
  }, [fetchFoundationData]);

  const enableInstallationServices =
    foundationData?.industryProfile?.features?.enableInstallationServices ?? true;
  const enableDoubleEntryAccounting =
    foundationData?.settings?.enableDoubleEntryAccounting !== false;

  useEffect(() => {
    if (!enableInstallationServices && activeTab === 'INSTALLATION') {
      setActiveTab('DASHBOARD');
    }
    if (!enableDoubleEntryAccounting && activeTab === 'ACCOUNTING') {
      setActiveTab('DASHBOARD');
    }
  }, [enableInstallationServices, enableDoubleEntryAccounting, activeTab]);

  const handleSwitchUser = async (userId: number) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchFoundationData();
      }
    } catch {
      // transient
    }
  };

  const handleLoginSuccess = async (_user: PublicUser) => {
    await fetchFoundationData();
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('mehregan_session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/auth/logout', { method: 'POST', headers });
    } catch {
      // transient
    }
    localStorage.removeItem('mehregan_session_token');
    localStorage.removeItem('mehregan_csrf_token');
    setFoundationData(null);
    await fetchFoundationData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card variant="default" padding="lg" className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
            <div>
              <h1 className="text-sm font-extrabold text-slate-900">
                در حال راه‌اندازی و اتصال به هسته مرکزی Foundation...
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                بررسی جداول کاربران، مجوزهای RBAC و دیتابیس PostgreSQL
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-2.5 w-4/5 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  if (!foundationData || !foundationData.activeUser) {
    if (networkError && !networkError.includes('وارد حساب')) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card variant="default" padding="lg" className="w-full max-w-lg border-rose-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-800">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
              <div>
                <h1 className="text-sm font-extrabold">خطا در برقراری ارتباط با سرور دیتابیس</h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  سرویس مرکزی Backend روی پورت 3000 در دسترس نیست یا خطایی رخ داده است.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-950 font-mono">
              {networkError}
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => {
                setLoading(true);
                fetchFoundationData();
              }}
            >
              تلاش مجدد
            </Button>
          </Card>
        </div>
      );
    }

    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const activeUser = foundationData.activeUser;
  const isDefaultAdminPass = activeUser.isInitialAdmin;
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

  // Industry-specific profile logic and presets
  const isSupermarket = profileCode === 'SUPERMARKET_GROCERY';
  const isRetailGeneral = profileCode === 'RETAIL_GENERAL';
  const isCctvSecurity = profileCode === 'CCTV_SECURITY';

  const theme = industryProfile?.theme || {
    id: 'cctv',
    primaryColor: '#0284c7',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    headerBrandTitleFa: 'سامانه جامع ERP و نظارت تصویری',
  };

  const isAdmin =
    activeUser.isInitialAdmin ||
    activeUser.assignedRoles?.includes('ADMIN') ||
    activeUser.assignedRoles?.includes('SUPER_ADMIN');

  const isInstaller =
    !isAdmin &&
    (Boolean(activeUser.installerPartyId) ||
      activeUser.assignedRoles?.includes('INSTALLER') ||
      activeUser.jobTitle?.includes('نصاب') ||
      activeUser.jobTitle?.includes('تکنسین') ||
      Boolean(activeUser.username && activeUser.username.toLowerCase().includes('installer')) ||
      Boolean(activeUser.username && activeUser.username.includes('نصاب')) ||
      activeUser.fullName?.includes('نصاب') ||
      Boolean(
        foundationData.userRoleAssignments?.some(
          (a) => a.userId === activeUser.id && a.roleCode === 'INSTALLER'
        )
      ));

  // If the logged in user is an installer, strictly isolate them to the Installer Portal
  if (isInstaller) {
    return (
      <div
        dir="rtl"
        data-industry-theme="cctv"
        className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"
      >
        {/* Dedicated Installer Focused Header - Desktop Only */}
        <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 hidden md:block">
          <div className="h-1.5 w-full bg-cyan-700" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-xs tracking-tight shrink-0">
                {foundationData.settings?.companyName || 'مهرگان'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  کارتابل اختصاصی تکنسین و نصاب
                </span>
                <span className="hidden sm:inline-block font-bold px-2 py-0.5 rounded-full text-[11px] bg-cyan-50 text-cyan-800 border border-cyan-200">
                  دسترسی محدود میدانی
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <UserCheck className="h-3.5 w-3.5 text-cyan-700 shrink-0" />
                <span className="font-extrabold text-slate-900">{activeUser.fullName}</span>
                <span className="text-[11px] text-slate-400 font-mono">(@{activeUser.username})</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePassOpen(true)}
                leftIcon={<KeyRound className="h-3.5 w-3.5 text-amber-600" />}
                title="تغییر کلمه عبور کاربر جاری"
              >
                <span className="hidden xs:inline">رمز عبور</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                leftIcon={<UserCheck className="h-3.5 w-3.5" />}
              >
                تغییر حساب
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="h-3.5 w-3.5 text-rose-600" />}
                className="text-rose-700 hover:bg-rose-50 border-rose-200"
                title="خروج از حساب کاربری"
              >
                خروج
              </Button>
            </div>
          </div>
        </header>

        {/* Dedicated Installer Main Viewport: Full screen mobile banking ergonomics */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-0 md:p-6">
          <InstallerPortalView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
            onOpenChangePassword={() => setIsChangePassOpen(true)}
            onLogout={handleLogout}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        </main>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        <ChangePasswordModal
          isOpen={isChangePassOpen}
          onClose={() => setIsChangePassOpen(false)}
          activeUser={activeUser}
        />

        {/* Global Search Modal for Installer (RBAC filtered) */}
        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          onNavigate={() => {}}
          foundationData={foundationData}
        />

        {/* Natural Language Action Modal for Installer */}
        <NaturalLanguageActionModal
          isOpen={isNlActionModalOpen}
          onClose={() => setIsNlActionModalOpen(false)}
          foundationData={foundationData}
          onOperationSuccess={() => fetchFoundationData()}
          initialPrompt={nlInitialPrompt}
        />

        {/* Action Inbox Modal for Installer */}
        {isActionInboxOpen && (
          <ActionInboxView
            foundationData={foundationData}
            onNavigateTab={() => setIsActionInboxOpen(false)}
            isModal={true}
            onClose={() => setIsActionInboxOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      data-industry-theme={theme.id || 'cctv'}
      data-ui-theme={activeThemeId}
      className={`min-h-screen transition-colors duration-200 flex flex-col ${
        activeThemeConfig.isDarkMode
          ? 'bg-[#0b0f19] text-slate-100 dark'
          : activeThemeConfig.bgCanvasClass || 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Main Unified Header: Divided into 3 Structured Zones (Brand, Navigation, User Actions) */}
      <header className={`border-b sticky top-0 z-40 transition-colors ${
        activeThemeConfig.isDarkMode
          ? 'bg-[#151c2f] border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/90'
      }`}>
        {/* Industry & Active UI Theme Top Color Line */}
        <div
          className="h-1.5 w-full transition-colors duration-300"
          style={{ backgroundColor: activeThemeConfig.topBarColor || theme.primaryColor || '#0284c7' }}
        />
        {/* Top Row: Zone 1 (Brand Identity) & Zone 3 (User Actions) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 transition-all">
          {/* ZONE 1: Brand & Industry Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('DASHBOARD');
              }}
              className="flex items-center gap-2 focus-ring rounded-xl min-w-0"
            >
              <span className="bg-slate-900 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-tight truncate max-w-[170px] sm:max-w-[260px] shadow-2xs">
                {foundationData.settings?.companyName || 'مهرگان'}
              </span>
              <span className="hidden sm:inline font-extrabold text-slate-900 text-xs sm:text-sm truncate max-w-[200px] lg:max-w-[280px]">
                {theme.headerBrandTitleFa || 'سامانه جامع ERP و نظارت تصویری'}
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 border-r border-slate-200 pr-3">
              <span className="font-semibold text-slate-700 tabular-nums">
                سال مالی {foundationData.settings?.activeFiscalYearCode || '۱۴۰۵'}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] border ${
                  theme.badgeBg || 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title={industryProfile?.descriptionFa}
              >
                {industryProfile?.badgeLabelFa || 'صنف نظارت تصویری و حفاظتی'}
              </span>
            </div>
          </div>

          {/* ZONE 3: Global Actions (Search, NL, Action Inbox) & Account Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Global Search Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="جست‌وجوی سراسری در تمام سیستم (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">جست‌وجو</span>
              <span className="hidden lg:inline text-[10px] text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200 font-mono">
                Ctrl+K
              </span>
            </button>

            {/* 2. Natural Language Actions (Gemini 3.8 Flash) Trigger */}
            <button
              type="button"
              onClick={() => {
                setNlInitialPrompt('');
                setIsNlActionModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 border border-blue-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
              title="ثبت عملیات با زبان طبیعی (Gemini 3.8 Flash)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-500/20 animate-pulse shrink-0" />
              <span className="hidden sm:inline">عملیات هوشمند</span>
              <span className="text-[10px] bg-blue-600 text-white font-mono px-1 py-0.2 rounded font-black">
                AI
              </span>
            </button>

            {/* 3. Action Inbox Trigger with Urgent Count Badge */}
            <button
              type="button"
              onClick={() => setIsActionInboxOpen(true)}
              className="relative flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="صندوق کارهای منتظر اقدام"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">کارها</span>
              {urgentActionCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white font-mono">
                  {urgentActionCount}
                </span>
              )}
            </button>

            <PWAInstallButton variant="compact" />

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="font-extrabold text-slate-900">{activeUser.fullName}</span>
              <span className="text-[11px] text-slate-400 font-mono">(@{activeUser.username})</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangePassOpen(true)}
              leftIcon={<KeyRound className="h-3.5 w-3.5 text-amber-600" />}
              title="تغییر کلمه عبور کاربر جاری"
              className="hidden sm:flex"
            >
              <span>رمز عبور</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLoginModalOpen(true)}
              leftIcon={<UserCheck className="h-3.5 w-3.5" />}
              title="تغییر حساب کاربری"
            >
              <span className="hidden sm:inline">تغییر حساب</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-3.5 w-3.5 text-rose-600" />}
              className="text-rose-700 hover:bg-rose-50 border-rose-200"
              title="خروج از حساب کاربری"
            >
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>

        {/* Bottom Row: ZONE 2 (Primary Navigation Bar - Desktop Only, Hidden on Mobile to Free Screen Space) */}
        <div className="hidden md:block border-t border-slate-200/70 bg-slate-50/90 px-3 sm:px-6 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-bold">
            
            {/* Left/Right Group: Quick Access Trigger & Primary Operational Tabs */}
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none py-0.5">
              
              {/* Quick Access Dropdown Trigger */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickSubmenuOpen(!isQuickSubmenuOpen)}
                  className="text-amber-800 flex items-center gap-1.5 font-extrabold cursor-pointer bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 px-3 py-1.5 rounded-xl transition-all border border-amber-200/90 whitespace-nowrap shadow-2xs focus-ring"
                  title="کلیک برای باز کردن منوی میانبرهای سریع"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>دسترسی سریع</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isQuickSubmenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Interactive Flyout Submenu (Structured 2-Column Grid) */}
                {isQuickSubmenuOpen && (
                  <div
                    className="fixed sm:absolute right-2 sm:right-0 top-24 sm:top-full mt-2 w-[340px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-3 text-right dir-rtl animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setIsQuickSubmenuOpen(false)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        میانبرهای عملیاتی و دسترسی سریع
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">تمام ماژول‌ها</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                      {/* Section 1: Sales & Inventory */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          🛒 فروش و انبار
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('SALES')}
                          className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                        >
                          <span className="flex items-center gap-2">
                            <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{uiLabels.quickSalesSubmenuTitleFa}</span>
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded">POS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('INVENTORY')}
                          className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                        >
                          <span className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{uiLabels.quickInventorySubmenuTitleFa}</span>
                          </span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-mono px-1.5 py-0.5 rounded">انبار</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('PURCHASES')}
                          className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                        >
                          <span className="flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                            <span>{uiLabels.quickPurchasesSubmenuTitleFa}</span>
                          </span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded">خرید</span>
                        </button>
                      </div>

                      {/* Section 2: Treasury & Parties */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                          🏦 خزانه و اشخاص
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('TREASURY')}
                          className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                        >
                          <span className="flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5 text-teal-600" />
                            <span>{uiLabels.quickTreasurySubmenuTitleFa}</span>
                          </span>
                          <span className="text-[9px] bg-teal-100 text-teal-800 font-mono px-1.5 py-0.5 rounded">خزانه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('PARTIES')}
                          className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                        >
                          <span className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>{uiLabels.quickPartiesSubmenuTitleFa}</span>
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded">اشخاص</span>
                        </button>
                        {enableDoubleEntryAccounting && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('ACCOUNTING')}
                            className="w-full p-2 rounded-xl hover:bg-slate-50 text-slate-800 flex items-center justify-between transition-colors cursor-pointer text-right"
                          >
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                              <span>حسابداری دوبل و دفاتر</span>
                            </span>
                            <span className="text-[9px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.5 rounded">مالی</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Core Operational Modules (Primary Pill Tabs) */}
              <nav className="flex items-center gap-1.5 text-xs font-bold" aria-label="ناوبری عملیات اصلی">
                <button
                  type="button"
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'DASHBOARD'
                      ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="داشبورد مدیریتی و شاخص‌های کلیدی عملکرد"
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'DASHBOARD' ? 'text-white' : 'text-slate-500'}`} />
                  <span>داشبورد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('BUSINESS_FEATURES_HUB')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'BUSINESS_FEATURES_HUB'
                      ? 'bg-indigo-700 text-white font-extrabold shadow-xs'
                      : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 font-extrabold'
                  }`}
                  title="درگاه یکپارچه امکانات، ابزارهای پیشرفته و قابلیت‌های برنامه‌ریزی‌شده"
                >
                  <Boxes className={`w-3.5 h-3.5 ${activeTab === 'BUSINESS_FEATURES_HUB' ? 'text-white' : 'text-indigo-600'}`} />
                  <span>مرکز امکانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('SALES')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'SALES'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200'
                  }`}
                  title={uiLabels.salesTabDescFa}
                >
                  <ShoppingCart className={`w-3.5 h-3.5 ${activeTab === 'SALES' ? 'text-white' : 'text-emerald-600'}`} />
                  <span>{uiLabels.salesTabTitleFa}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PURCHASES')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'PURCHASES'
                      ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200'
                  }`}
                  title={uiLabels.purchasesTabDescFa}
                >
                  <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'PURCHASES' ? 'text-white' : 'text-amber-600'}`} />
                  <span>{uiLabels.purchasesTabTitleFa}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('TREASURY')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'TREASURY'
                      ? 'bg-teal-700 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200'
                  }`}
                  title={uiLabels.treasuryTabDescFa}
                >
                  <Landmark className={`w-3.5 h-3.5 ${activeTab === 'TREASURY' ? 'text-white' : 'text-teal-600'}`} />
                  <span>{uiLabels.treasuryTabTitleFa}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PARTIES')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'PARTIES'
                      ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200'
                  }`}
                  title={uiLabels.partiesTabDescFa}
                >
                  <Users className={`w-3.5 h-3.5 ${activeTab === 'PARTIES' ? 'text-white' : 'text-blue-600'}`} />
                  <span>{uiLabels.partiesTabTitleFa}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('INVENTORY')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                    activeTab === 'INVENTORY'
                      ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-200'
                  }`}
                  title="مدیریت موجودی انبار، کاردکس و بارکد"
                >
                  <Package className={`w-3.5 h-3.5 ${activeTab === 'INVENTORY' ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{uiLabels.inventoryTabTitleFa}</span>
                </button>

                {enableDoubleEntryAccounting && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('ACCOUNTING')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'ACCOUNTING'
                        ? 'bg-purple-700 text-white font-extrabold shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-200'
                    }`}
                    title="کدینگ حساب‌ها، اسناد دوبل، تراز و دفاتر کل"
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'ACCOUNTING' ? 'text-white' : 'text-purple-600'}`} />
                    <span>حسابداری</span>
                  </button>
                )}

                {features.enableInstallationServices && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('INSTALLATION')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'INSTALLATION'
                        ? 'bg-cyan-700 text-white font-extrabold shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-cyan-50 hover:text-cyan-900 hover:border-cyan-200'
                    }`}
                    title="سفارشات خدمات نصب، تکنسین‌ها و پروژه‌های نظارت تصویری"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${activeTab === 'INSTALLATION' ? 'text-white' : 'text-cyan-600'}`} />
                    <span>{uiLabels.installationTabTitleFa}</span>
                  </button>
                )}

                {(profileCode === 'GOLD_JEWELRY' || activeTab === 'GOLD_DUAL_LEDGER') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('GOLD_DUAL_LEDGER')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'GOLD_DUAL_LEDGER'
                        ? 'bg-amber-600 text-white font-extrabold shadow-xs ring-2 ring-amber-300'
                        : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-bold'
                    }`}
                    title="کاردکس دوگانه طلا و ریال، فروش گرمی بدون ریال و بده‌بستان همکار"
                  >
                    <Scale className={`w-3.5 h-3.5 ${activeTab === 'GOLD_DUAL_LEDGER' ? 'text-white' : 'text-amber-700'}`} />
                    <span>کاردکس طلا و ریال</span>
                  </button>
                )}

                {(profileCode === 'RESTAURANT_CAFE' || activeTab === 'RESTAURANT_CAFE') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('RESTAURANT_CAFE')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'RESTAURANT_CAFE'
                        ? 'bg-orange-600 text-white font-extrabold shadow-xs ring-2 ring-orange-300'
                        : 'bg-orange-50 text-orange-900 border border-orange-300 hover:bg-orange-100 font-bold'
                    }`}
                    title="مدیریت سالن، میزها، منوی لمسی و بن آشپزخانه رستوران"
                  >
                    <UtensilsCrossed className={`w-3.5 h-3.5 ${activeTab === 'RESTAURANT_CAFE' ? 'text-white' : 'text-orange-700'}`} />
                    <span>رستوران و سالن</span>
                  </button>
                )}

                {(profileCode === 'WHOLESALE_DISTRIBUTION' || activeTab === 'WHOLESALE_DISTRIBUTION') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('WHOLESALE_DISTRIBUTION')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'WHOLESALE_DISTRIBUTION'
                        ? 'bg-teal-700 text-white font-extrabold shadow-xs ring-2 ring-teal-300'
                        : 'bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100 font-bold'
                    }`}
                    title="مدیریت پخش عمده، کارتن‌ها، نرخ همکار و ناوگان توزیع"
                  >
                    <Truck className={`w-3.5 h-3.5 ${activeTab === 'WHOLESALE_DISTRIBUTION' ? 'text-white' : 'text-teal-700'}`} />
                    <span>پخش و فروش عمده</span>
                  </button>
                )}

                {(profileCode === 'MOBILE_ELECTRONICS' || activeTab === 'MOBILE_ELECTRONICS') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('MOBILE_ELECTRONICS')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'MOBILE_ELECTRONICS'
                        ? 'bg-cyan-700 text-white font-extrabold shadow-xs ring-2 ring-cyan-300'
                        : 'bg-cyan-50 text-cyan-900 border border-cyan-300 hover:bg-cyan-100 font-bold'
                    }`}
                    title="مدیریت انبار دستگاه‌ها، کد IMEI، رجیستری و پذیرش تعمیرات"
                  >
                    <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'MOBILE_ELECTRONICS' ? 'text-white' : 'text-cyan-700'}`} />
                    <span>موبایل و تعمیرات</span>
                  </button>
                )}
                {(profileCode === 'SERVICES_CONTRACTING' || activeTab === 'SERVICES_CONTRACTING') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('SERVICES_CONTRACTING')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer select-none whitespace-nowrap focus-ring ${
                      activeTab === 'SERVICES_CONTRACTING'
                        ? 'bg-blue-700 text-white font-extrabold shadow-xs ring-2 ring-blue-300'
                        : 'bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100 font-bold'
                    }`}
                    title="مدیریت تیکت‌های خدمات فنی، اعزام تکنسین و قطعات یدکی"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${activeTab === 'SERVICES_CONTRACTING' ? 'text-white' : 'text-blue-700'}`} />
                    <span>خدمات و پیمانکاری</span>
                  </button>
                )}
              </nav>
            </div>

            {/* System & Governance Modules (Compact Pills Row) */}
            <div className="hidden lg:flex items-center gap-1 bg-white border border-slate-200/90 p-1 rounded-xl text-[11px] shrink-0 whitespace-nowrap">
              <span className="text-slate-400 font-bold px-1.5">سیستم:</span>
              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS_HEALTH')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeTab === 'SETTINGS_HEALTH' || (activeTab as string) === 'SETTINGS' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700 font-semibold'
                }`}
                title="تنظیمات صنف و مشخصات بیزینس"
              >
                <Sliders className="w-3 h-3 text-sky-600" />
                <span>تنظیمات</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('USERS')}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'USERS' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600 font-semibold'
                }`}
              >
                کاربران
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('RBAC')}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'RBAC' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600 font-semibold'
                }`}
              >
                مجوزها
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('AUDIT')}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'AUDIT' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600 font-semibold'
                }`}
              >
                لاگ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DEPLOYMENT')}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'DEPLOYMENT' ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-600 font-semibold'
                }`}
              >
                استقرار
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Default Password Reminder Banner if active user is default admin */}
      {isDefaultAdminPass && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>راه‌اندازی سریع اولیه:</strong> هم‌اکنون با کاربر ادمین پیش‌فرض (
                <span className="font-mono font-bold">admin / admin</span>) وارد شده‌اید. می‌توانید
                همین حالا کلمه عبور را به مقدار دلخواه تغییر دهید.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsChangePassOpen(true)}
            >
              تغییر فوری کلمه عبور admin
            </Button>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] md:pb-6">
        {activeTab === 'DASHBOARD' && (
          <DashboardView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
            onNavigateTab={(tab) => setActiveTab(tab as WorkspaceTab)}
            onOpenOperations={() => setIsQuickSubmenuOpen(true)}
          />
        )}
        {activeTab === 'BUSINESS_FEATURES_HUB' && (
          <BusinessFeaturesHubView
            foundationData={foundationData}
            onNavigateTab={(tab) => setActiveTab(tab as WorkspaceTab)}
            onOpenNlAction={() => {
              setNlInitialPrompt('');
              setIsNlActionModalOpen(true);
            }}
          />
        )}
        {activeTab === 'SALES' && (
          <SalesManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'PURCHASES' && (
          <PurchasesManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'PARTIES' && (
          <PartiesManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'INVENTORY' && (
          <InventoryManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'ACCOUNTING' && (
          enableDoubleEntryAccounting ? (
            <AccountingManagementView
              foundationData={foundationData}
              onRefresh={fetchFoundationData}
            />
          ) : (
            <div className="py-12 flex justify-center">
              <Card variant="default" padding="lg" className="w-full max-w-xl text-center space-y-4 border-slate-200">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    ماژول حسابداری دوبل در سیستم غیرفعال است
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    سیستم در وضعیت عملیات ساده تجاری قرار دارد. کلیه امور فروش، خرید، انبار، چک‌ها، دریافت و پرداخت، مانده و صورت‌حساب تفصیلی مشتریان و تأمین‌کنندگان در تب «اشخاص و طرفین» به طور مستقل و کامل فعال می‌باشند.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('PARTIES')}
                    leftIcon={<Users className="w-3.5 h-3.5" />}
                  >
                    مشاهده حساب و تفصیلی اشخاص
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('DASHBOARD')}
                  >
                    بازگشت به داشبورد
                  </Button>
                </div>
              </Card>
            </div>
          )
        )}
        {activeTab === 'TREASURY' && (
          <TreasuryManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'INSTALLATION' && features.enableInstallationServices && (
          <InstallationManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'DEPLOYMENT' && (
          <ConnectionDeploymentView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'USERS' && (
          <UserManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
            onSwitchUser={handleSwitchUser}
          />
        )}
        {activeTab === 'RBAC' && (
          <RbacConsoleView foundationData={foundationData} onRefresh={fetchFoundationData} />
        )}
        {activeTab === 'AUDIT' && <AuditLogView logs={foundationData.auditLogs} />}
        {activeTab === 'GOLD_DUAL_LEDGER' && (
          <GoldDualLedgerView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'RESTAURANT_CAFE' && (
          <RestaurantCafeManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'WHOLESALE_DISTRIBUTION' && (
          <WholesaleDistributionView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'MOBILE_ELECTRONICS' && (
          <MobileElectronicsManagementView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {activeTab === 'SERVICES_CONTRACTING' && (
          <ServicesContractingView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
        {(activeTab === 'SETTINGS_HEALTH' || (activeTab as string) === 'SETTINGS') && (
          <SettingsAndHealthView
            foundationData={foundationData}
            onRefresh={fetchFoundationData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            سامانه نرم‌افزاری <strong>حسابداری مهرگان</strong> — برنامه‌نویس و مالک فنی: <strong className="text-slate-800">حمید دشتی‌زاده</strong> (شماره پشتیبانی: <span className="font-mono text-slate-800" dir="ltr">09171791315</span>)
          </div>
          <div className="font-mono text-[11px] text-slate-600" dir="ltr">
            Mehregan ERP · Hamid Dashti Zadeh (09171791315) · Ready
          </div>
        </div>
      </footer>

      {/* Modals & Floating Agent Widget */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        activeUser={activeUser}
      />
      {showSmartAgent && (
        <SmartAgentWidget
          foundationData={foundationData}
          onRefresh={fetchFoundationData}
          onNavigateTab={(tab) => {
            if (tab === 'PROFORMA' || tab === 'QUICK_SALE' || tab === 'RETURN') {
              setActiveTab('SALES');
            } else if (tab === 'PROJECTS' || tab === 'REQUISITION' || tab === 'INSTALLER') {
              setActiveTab('INSTALLATION');
            } else if (tab === 'EXPENSES' || tab === 'CHEQUES' || tab === 'INSTALLMENTS') {
              setActiveTab('TREASURY');
            } else if (tab === 'JOURNAL' || tab === 'TRIAL_BALANCE' || tab === 'PROFITABILITY') {
              setActiveTab('ACCOUNTING');
            } else {
              setActiveTab(tab as WorkspaceTab);
            }
          }}
        />
      )}

      {/* Quick Access Mobile Action Sheet Drawer (مرکز عملیات جامع با جستجو) */}
      <QuickAccessMobileDrawer
        isOpen={isQuickSubmenuOpen}
        onClose={() => setIsQuickSubmenuOpen(false)}
        onNavigate={(tab) => {
          if (tab === 'PROFORMA' || tab === 'QUICK_SALE' || tab === 'RETURN') {
            setActiveTab('SALES');
          } else if (tab === 'PROJECTS' || tab === 'REQUISITION' || tab === 'INSTALLER') {
            setActiveTab('INSTALLATION');
          } else if (tab === 'EXPENSES' || tab === 'CHEQUES' || tab === 'INSTALLMENTS') {
            setActiveTab('TREASURY');
          } else if (tab === 'JOURNAL' || tab === 'TRIAL_BALANCE' || tab === 'PROFITABILITY') {
            setActiveTab('ACCOUNTING');
          } else {
            setActiveTab(tab as WorkspaceTab);
          }
        }}
        foundationData={foundationData}
        companyName={foundationData?.settings?.companyName}
      />

      {/* Mobile More Drawer (سایر امکانات و ماژول‌ها) */}
      <MobileMoreDrawer
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        onNavigate={(tab) => {
          setIsMoreSheetOpen(false);
          setActiveTab(tab as WorkspaceTab);
        }}
        foundationData={foundationData}
        onOpenChangePassword={() => setIsChangePassOpen(true)}
        onLogout={handleLogout}
      />

      {/* Iranian Mobile Banking Style Bottom Navigation Bar (PWA Anchor) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] grid grid-cols-5 items-end justify-items-center md:hidden select-none">
        {/* 1. خانه (Home) */}
        <button
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            setIsQuickSubmenuOpen(false);
            setActiveTab('DASHBOARD');
          }}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
            activeTab === 'DASHBOARD' && !isMoreSheetOpen && !isQuickSubmenuOpen
              ? 'text-blue-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home
            className={`w-5 h-5 mb-0.5 ${
              activeTab === 'DASHBOARD' && !isMoreSheetOpen && !isQuickSubmenuOpen
                ? 'text-blue-700 stroke-[2.5]'
                : 'text-slate-500'
            }`}
          />
          <span className="text-[10px] tracking-tight">خانه</span>
        </button>

        {/* 2. کارها و تراکنش‌ها (Tasks & Transactions / Action Inbox) */}
        <button
          type="button"
          onClick={() => {
            setIsMoreSheetOpen(false);
            setIsQuickSubmenuOpen(false);
            setIsActionInboxOpen(true);
          }}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer relative ${
            isActionInboxOpen
              ? 'text-amber-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Inbox
              className={`w-5 h-5 mb-0.5 ${
                isActionInboxOpen ? 'text-amber-700 stroke-[2.5]' : 'text-slate-500'
              }`}
            />
            {urgentActionCount > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-black bg-rose-600 text-white flex items-center justify-center ring-2 ring-white font-mono">
                {urgentActionCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">کارها</span>
        </button>

        {/* 3. عملیات (Center Prominent Elevated Action Button - دکمه مرکزی برجسته) */}
        <div className="relative -mt-6 flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setIsMoreSheetOpen(false);
              setIsQuickSubmenuOpen(true);
            }}
            aria-label="مرکز عملیات و خدمات"
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer touch-manipulation"
          >
            <LayoutGrid className="w-6 h-6 fill-white/20 text-white" />
          </button>
          <span className="text-[10px] font-black text-slate-800 mt-1 tracking-tight">عملیات</span>
        </div>

        {/* 4. اشخاص (Parties / Contacts - فقط در صورت مجاز بودن) */}
        {!activeUser.assignedRoles?.includes('GUEST') ? (
          <button
            type="button"
            onClick={() => {
              setIsMoreSheetOpen(false);
              setIsQuickSubmenuOpen(false);
              setActiveTab('PARTIES');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
              activeTab === 'PARTIES' && !isMoreSheetOpen && !isQuickSubmenuOpen
                ? 'text-blue-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'PARTIES' && !isMoreSheetOpen && !isQuickSubmenuOpen
                  ? 'text-blue-700 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">اشخاص</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsMoreSheetOpen(false);
              setIsQuickSubmenuOpen(false);
              setActiveTab('SALES');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
              activeTab === 'SALES' && !isMoreSheetOpen && !isQuickSubmenuOpen
                ? 'text-emerald-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart
              className={`w-5 h-5 mb-0.5 ${
                activeTab === 'SALES' && !isMoreSheetOpen && !isQuickSubmenuOpen
                  ? 'text-emerald-700 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">فروش</span>
          </button>
        )}

        {/* 5. بیشتر (More) */}
        <button
          type="button"
          onClick={() => {
            setIsQuickSubmenuOpen(false);
            setIsMoreSheetOpen(true);
          }}
          className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
            isMoreSheetOpen
              ? 'text-indigo-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal
            className={`w-5 h-5 mb-0.5 ${
              isMoreSheetOpen ? 'text-indigo-700 stroke-[2.5]' : 'text-slate-500'
            }`}
          />
          <span className="text-[10px] tracking-tight">بیشتر</span>
        </button>
      </nav>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={(tab, entityId) => {
          if (tab === 'PROFORMA' || tab === 'QUICK_SALE' || tab === 'RETURN') {
            setActiveTab('SALES');
          } else if (tab === 'PROJECTS' || tab === 'REQUISITION' || tab === 'INSTALLER') {
            setActiveTab('INSTALLATION');
          } else if (tab === 'EXPENSES' || tab === 'CHEQUES' || tab === 'INSTALLMENTS') {
            setActiveTab('TREASURY');
          } else if (tab === 'JOURNAL' || tab === 'TRIAL_BALANCE' || tab === 'PROFITABILITY') {
            setActiveTab('ACCOUNTING');
          } else {
            setActiveTab(tab as WorkspaceTab);
          }
        }}
        foundationData={foundationData}
      />

      {/* Natural Language Actions Modal (Gemini 3.8 Flash) */}
      <NaturalLanguageActionModal
        isOpen={isNlActionModalOpen}
        onClose={() => setIsNlActionModalOpen(false)}
        foundationData={foundationData}
        onOperationSuccess={() => fetchFoundationData()}
        onNavigateTab={(tab) => {
          setActiveTab(tab as WorkspaceTab);
        }}
        initialPrompt={nlInitialPrompt}
      />

      {/* Action Inbox Modal */}
      {isActionInboxOpen && (
        <ActionInboxView
          foundationData={foundationData}
          onNavigateTab={(tab, entityId) => {
            setIsActionInboxOpen(false);
            if (tab === 'PROFORMA' || tab === 'QUICK_SALE' || tab === 'RETURN') {
              setActiveTab('SALES');
            } else if (tab === 'PROJECTS' || tab === 'REQUISITION' || tab === 'INSTALLER') {
              setActiveTab('INSTALLATION');
            } else if (tab === 'EXPENSES' || tab === 'CHEQUES' || tab === 'INSTALLMENTS') {
              setActiveTab('TREASURY');
            } else {
              setActiveTab(tab as WorkspaceTab);
            }
          }}
          isModal={true}
          onClose={() => setIsActionInboxOpen(false)}
        />
      )}
    </div>
  );
}

