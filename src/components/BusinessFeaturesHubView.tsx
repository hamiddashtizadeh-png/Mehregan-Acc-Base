import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Sparkles,
  ChevronLeft,
  X,
  Layers,
  Zap,
  Info,
  Sliders,
  ExternalLink,
  Palette,
  Maximize2,
} from 'lucide-react';
import {
  BUSINESS_FEATURES_REGISTRY,
  FEATURE_CATEGORIES_CONFIG,
  BusinessFeatureItem,
  FeatureCategory,
  FeatureStatus,
} from '../config/businessFeaturesRegistry';
import { FoundationDataResponse } from '../types/foundation';
import { CustomUiDesignsModal, DESIGN_REFERENCES } from './CustomUiDesignsModal';

interface BusinessFeaturesHubViewProps {
  foundationData: FoundationDataResponse | null;
  onNavigateTab: (tab: string) => void;
  onOpenNlAction?: () => void;
}

export const BusinessFeaturesHubView: React.FC<BusinessFeaturesHubViewProps> = ({
  foundationData,
  onNavigateTab,
  onOpenNlAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FeatureCategory | 'ALL'>('ALL');
  const [activeStatus, setActiveStatus] = useState<FeatureStatus | 'ALL'>('ALL');
  const [selectedModalFeature, setSelectedModalFeature] = useState<BusinessFeatureItem | null>(null);
  const [isUiDesignModalOpen, setIsUiDesignModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('mehregan_active_ui_theme') || 'isee_smart_hub';
  });

  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('mehregan_active_ui_theme', themeId);
  };

  const activeUser = foundationData?.activeUser;
  const profileCode = foundationData?.industryProfile?.code || 'CCTV_SECURITY';

  // Role detection: check if active user is an installer
  const isInstaller = useMemo(() => {
    if (!activeUser) return false;
    return Boolean(
      activeUser.installerPartyId ||
        activeUser.assignedRoles?.includes('INSTALLER') ||
        activeUser.jobTitle?.includes('نصاب') ||
        activeUser.jobTitle?.includes('تکنسین') ||
        (activeUser.username && activeUser.username.toLowerCase().includes('installer')) ||
        (activeUser.username && activeUser.username.includes('نصاب')) ||
        activeUser.fullName?.includes('نصاب')
    );
  }, [activeUser]);

  // Filter features based on RBAC, search, category, and status
  const filteredFeatures = useMemo(() => {
    return BUSINESS_FEATURES_REGISTRY.filter((feature) => {
      // 1. Installer Role Check: installers only see features marked isInstallerRelevant
      if (isInstaller && !feature.isInstallerRelevant) {
        return false;
      }

      // 2. Industry Profile Filter
      if (feature.supportedIndustries && !feature.supportedIndustries.includes(profileCode)) {
        return false;
      }

      // 3. Category Filter
      if (activeCategory !== 'ALL' && feature.category !== activeCategory) {
        return false;
      }

      // 4. Status Filter
      if (activeStatus !== 'ALL' && feature.status !== activeStatus) {
        return false;
      }

      // 5. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = feature.titleFa.toLowerCase().includes(q);
        const matchesDesc = feature.shortDescFa.toLowerCase().includes(q);
        const matchesVal = feature.businessValueFa.toLowerCase().includes(q);
        const matchesCat = feature.categoryFa.toLowerCase().includes(q);
        const matchesKeywords = feature.keywords.some((k) => k.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesVal || matchesCat || matchesKeywords;
      }

      return true;
    });
  }, [isInstaller, profileCode, activeCategory, activeStatus, searchQuery]);

  // Metric Stats Calculation
  const stats = useMemo(() => {
    const total = BUSINESS_FEATURES_REGISTRY.length;
    const active = BUSINESS_FEATURES_REGISTRY.filter((f) => f.status === 'ACTIVE').length;
    const requiresSetup = BUSINESS_FEATURES_REGISTRY.filter((f) => f.status === 'REQUIRES_SETUP').length;
    const inDev = BUSINESS_FEATURES_REGISTRY.filter((f) => f.status === 'IN_DEVELOPMENT').length;
    const planned = BUSINESS_FEATURES_REGISTRY.filter((f) => f.status === 'PLANNED').length;
    return { total, active, requiresSetup, inDev, planned };
  }, []);

  const handleCardAction = (feature: BusinessFeatureItem) => {
    if (feature.status === 'ACTIVE') {
      if (feature.id === 'FEAT_NATURAL_LANGUAGE_ACTIONS_AI' && onOpenNlAction) {
        onOpenNlAction();
      } else if (feature.targetTab) {
        onNavigateTab(feature.targetTab);
      }
    } else if (feature.status === 'REQUIRES_SETUP') {
      if (feature.targetTab) {
        onNavigateTab(feature.targetTab);
      } else {
        onNavigateTab('DEPLOYMENT');
      }
    } else {
      // Modal for IN_DEVELOPMENT or PLANNED
      setSelectedModalFeature(feature);
    }
  };

  const getStatusBadge = (status: FeatureStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>فعال و عملیاتی</span>
          </span>
        );
      case 'REQUIRES_SETUP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>نیازمند راه‌اندازی</span>
          </span>
        );
      case 'IN_DEVELOPMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 shrink-0">
            <Wrench className="w-3 h-3 text-purple-600" />
            <span>در حال توسعه</span>
          </span>
        );
      case 'PLANNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300 shrink-0">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>برنامه‌ریزی‌شده</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-black border border-indigo-400/30 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                درگاه یکپارچه توسعه سیستم
              </span>
              {isInstaller && (
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/30">
                  نمای ویژه تکنسین نصب
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              مرکز امکانات و قابلیت‌های سیستم (Features Hub)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              مرکز دائمی دسترسی به ابزارهای پیشرفته، قابلیت‌های فعال و برنامه‌ریزی‌شده کسب‌وکار بدون شلوغ‌کردن منوها.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="px-2 py-1">
              <div className="text-xs text-slate-400 font-semibold">کل امکانات</div>
              <div className="text-lg font-black text-white font-mono tabular-nums">{stats.total}</div>
            </div>
            <div className="px-2 py-1 border-r border-slate-800">
              <div className="text-xs text-emerald-400 font-semibold">فعال</div>
              <div className="text-lg font-black text-emerald-400 font-mono tabular-nums">{stats.active}</div>
            </div>
            <div className="px-2 py-1 border-r border-slate-800">
              <div className="text-xs text-amber-400 font-semibold">راه‌اندازی</div>
              <div className="text-lg font-black text-amber-400 font-mono tabular-nums">{stats.requiresSetup}</div>
            </div>
            <div className="px-2 py-1 border-r border-slate-800">
              <div className="text-xs text-slate-400 font-semibold">برنامه‌ریزی</div>
              <div className="text-lg font-black text-slate-300 font-mono tabular-nums">{stats.planned}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DESIGN TEMPLATES FROM USER UPLOADED IMAGES SHOWCASE */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl border border-purple-200">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <span>الگوها و تم‌های UI اختصاصی (بر اساس تصاویر ارسالی شما)</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full">
                  ۳ الگوی فعال
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تطبیق ۱۰۰٪ استایل گرافیکی، فرم‌ها، کارت‌ها و لیست‌های برنامه‌ریزی بر اساس ۳ عکس ارسالی شما.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUiDesignModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Maximize2 className="w-4 h-4" />
            <span>مشاهده گالری الگوهای UI</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DESIGN_REFERENCES.map((design) => (
            <div
              key={design.id}
              onClick={() => setIsUiDesignModalOpen(true)}
              className="group relative rounded-2xl border border-slate-200 hover:border-purple-400 p-3 bg-slate-50/60 hover:bg-white transition-all cursor-pointer space-y-2.5 shadow-2xs"
            >
              <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-900">
                <img
                  src={design.imagePath}
                  alt={design.titleFa}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = design.imagePath.replace('/assets/', '/public/assets/');
                  }}
                />
                <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/10 transition-colors" />
                {activeTheme === design.id && (
                  <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    تم فعال
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{design.titleFa}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{design.subtitleFa}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Row 1: Search Bar */}
        <div className="relative">
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجوی سریع امکانات (مثلاً: سریال، گارانتی، زبان طبیعی، سود، گوگل شیت، نقدینگی...)"
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pr-10 pl-10 py-2.5 border border-slate-200/90 focus:border-blue-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <span className="text-slate-400 text-[11px] font-extrabold shrink-0 pl-1">وضعیت:</span>
          <button
            type="button"
            onClick={() => setActiveStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeStatus === 'ALL'
                ? 'bg-slate-900 text-white font-extrabold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه وضعیت‌ها ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            فعال و عملیاتی ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatus('REQUIRES_SETUP')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeStatus === 'REQUIRES_SETUP'
                ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            نیازمند راه‌اندازی ({stats.requiresSetup})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatus('IN_DEVELOPMENT')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeStatus === 'IN_DEVELOPMENT'
                ? 'bg-purple-600 text-white font-extrabold shadow-xs'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
            }`}
          >
            در حال توسعه ({stats.inDev})
          </button>
          <button
            type="button"
            onClick={() => setActiveStatus('PLANNED')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeStatus === 'PLANNED'
                ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            برنامه‌ریزی‌شده ({stats.planned})
          </button>
        </div>

        {/* Row 3: Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-slate-400 text-[11px] font-extrabold shrink-0 pl-1">دسته‌بندی:</span>
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            همه دسته‌ها
          </button>
          {FEATURE_CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.titleFa}
            </button>
          ))}
        </div>
      </div>

      {/* Features Cards Grid */}
      {filteredFeatures.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">هیچ قابلیتی با فیلترهای انتخابی یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            لطفاً عبارت جست‌وجو را تغییر دهید یا فیلتر دسته‌بندی و وضعیت را روی «همه» تنظیم کنید.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('ALL');
              setActiveStatus('ALL');
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            پاک‌کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon + Category Badge + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2.5 rounded-xl border ${feature.colorClass} shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block truncate">
                          {feature.categoryFa}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {feature.titleFa}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(feature.status)}
                  </div>

                  {/* Descriptions */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {feature.shortDescFa}
                  </p>

                  {/* Business Value Note */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 fill-amber-400/20" />
                    <span>
                      <strong className="font-bold text-slate-800">ارزش افزوده: </strong>
                      {feature.businessValueFa}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {feature.statusDescFa}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCardAction(feature)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95 ${
                      feature.status === 'ACTIVE'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                        : feature.status === 'REQUIRES_SETUP'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{feature.actionLabelFa}</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Details Modal for PLANNED or IN_DEVELOPMENT features */}
      {selectedModalFeature && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 transition-all animate-in fade-in duration-200"
          onClick={() => setSelectedModalFeature(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xl text-right dir-rtl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${selectedModalFeature.colorClass}`}>
                  {React.createElement(selectedModalFeature.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedModalFeature.titleFa}</h3>
                  <span className="text-xs text-slate-500 font-bold">{selectedModalFeature.categoryFa}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalFeature(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-600">وضعیت فعلی در کد پروژه:</span>
                {getStatusBadge(selectedModalFeature.status)}
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs">توضیحات و هدف کاربردی:</h4>
                <p className="text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                  {selectedModalFeature.shortDescFa}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs">ارزش افزوده‌شده برای کسب‌وکار:</h4>
                <p className="text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
                  {selectedModalFeature.businessValueFa}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs">توضیحات وضعیت و محدودیت‌های فعلی:</h4>
                <p className="text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-amber-950 font-medium">
                  {selectedModalFeature.statusDescFa}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedModalFeature(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                بستن راهنما
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom UI Designs Modal */}
      <CustomUiDesignsModal
        isOpen={isUiDesignModalOpen}
        onClose={() => setIsUiDesignModalOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />
    </div>
  );
};
