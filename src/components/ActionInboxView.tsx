import React, { useState, useMemo } from 'react';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  DollarSign,
  Package,
  Wrench,
  ChevronLeft,
  ArrowRight,
  ShieldAlert,
  Flame,
  AlertCircle,
  Filter,
  Check,
  Building2,
  Calendar
} from 'lucide-react';
import { FoundationDataResponse, ProjectRecord, SalesProformaRecord, ChequeRecord, ItemRecord } from '../types/foundation';
import { format3Digit, parsePersianDigits } from '../utils/agentEngine';

export interface ActionInboxItem {
  id: string;
  sourceType: 'PROFORMA' | 'OVERDUE_RECEIVABLE' | 'CHEQUE' | 'PROJECT_INSTALLATION' | 'LOW_STOCK' | 'OVERDUE_PAYABLE';
  titleFa: string;
  descriptionFa: string;
  urgency: 'URGENT' | 'HIGH' | 'NORMAL';
  badgeFa: string;
  targetTab: string;
  targetEntityId?: number | string;
  primaryActionLabelFa: string;
  amountIrr?: number;
  dateJalali?: string;
  metadata?: Record<string, any>;
}

export interface ActionInboxViewProps {
  foundationData: FoundationDataResponse | null;
  onNavigateTab: (tab: string, entityId?: number | string) => void;
  onItemResolved?: (itemId: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const ActionInboxView: React.FC<ActionInboxViewProps> = ({
  foundationData,
  onNavigateTab,
  onItemResolved,
  isModal = false,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'NORMAL'>('ALL');
  const [dismissedItemIds, setDismissedItemIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mehregan_dismissed_action_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const activeUser = foundationData?.activeUser;
  const isInstaller =
    activeUser &&
    (Boolean(activeUser.installerPartyId) ||
      activeUser.assignedRoles?.includes('INSTALLER') ||
      activeUser.jobTitle?.includes('نصاب') ||
      activeUser.jobTitle?.includes('تکنسین'));

  // Build unified, de-duplicated action items based on real ERP state and RBAC
  const allActionItems = useMemo(() => {
    if (!foundationData) return [];

    const items: ActionInboxItem[] = [];

    // =========================================================================
    // 1. INSTALLER ROLE TASKS (Strictly Technical & Field Tasks)
    // =========================================================================
    if (isInstaller) {
      const myInstallerId = activeUser?.installerPartyId;

      // Installer's assigned projects in progress
      foundationData.projects?.forEach((prj) => {
        const isAssignedToMe =
          !myInstallerId ||
          prj.installerId === myInstallerId ||
          prj.installerTitleFa?.includes(activeUser?.fullName || '') ||
          prj.installerTitleFa?.includes(activeUser?.username || '');

        if (isAssignedToMe && (prj.status === 'IN_PROGRESS' || prj.status === 'APPROVED')) {
          items.push({
            id: `installer_prj_${prj.id}`,
            sourceType: 'PROJECT_INSTALLATION',
            titleFa: `پروژه نصب «${prj.titleFa}»`,
            descriptionFa: `مشتری: ${prj.customerTitleFa || 'نامشخص'} | وضعیت: در دست اجرا`,
            urgency: 'HIGH',
            badgeFa: 'در دست اجرا',
            targetTab: 'INSTALLATION',
            targetEntityId: prj.id,
            primaryActionLabelFa: 'ثبت گزارش پیشرفت و نصب',
            dateJalali: prj.startDateJalali || 'در جریان',
          });
        }
      });

      // Material Requisitions ready for installation
      foundationData.projectRequisitions?.forEach((req) => {
        if (req.status === 'READY_FOR_INSTALL' || req.status === 'APPROVED') {
          items.push({
            id: `installer_req_${req.id}`,
            sourceType: 'PROJECT_INSTALLATION',
            titleFa: `حواله مصرف قطعات «${req.requestCode}»`,
            descriptionFa: `پروژه شماره ${req.projectId} - قطعات آماده نصب در محل پروژه`,
            urgency: 'HIGH',
            badgeFa: 'نصب قطعه',
            targetTab: 'INSTALLATION',
            targetEntityId: req.projectId,
            primaryActionLabelFa: 'تایید نصب و مصرف نهایی قطعات',
            dateJalali: req.scheduledInstallDateJalali || 'آماده نصب',
          });
        }
      });

      return items;
    }

    // =========================================================================
    // 2. MANAGER / ADMIN ROLE TASKS (Financial, Proformas, Cheques, Stock, Projects)
    // =========================================================================

    // 2a. Pending Pre-Invoices / Proformas awaiting customer approval
    foundationData.salesProformas?.forEach((pro) => {
      if (pro.status === 'APPROVED' || pro.status === 'DRAFT') {
        const amtToman = Math.round(Number(pro.totalPayableIrr || 0) / 10);
        items.push({
          id: `proforma_${pro.id}`,
          sourceType: 'PROFORMA',
          titleFa: `پیش‌فاکتور فروش ${pro.proformaNumber}`,
          descriptionFa: `مشتری: ${pro.customerTitleFa || 'عمومی'} | مبلغ: ${format3Digit(amtToman)} تومان`,
          urgency: 'HIGH',
          badgeFa: 'منتظر تأیید و تبدیل',
          targetTab: 'SALES',
          targetEntityId: pro.id,
          primaryActionLabelFa: 'تبدیل به فاکتور نهایی و تسویه',
          amountIrr: Number(pro.totalPayableIrr || 0),
          dateJalali: pro.validUntilJalali || pro.dateJalali,
        });
      }
    });

    // 2b. Overdue Customer Receivables (مطالبات نیازمند پیگیری)
    foundationData.parties?.forEach((party) => {
      const netBal = Number(party.transactionsSummary?.netBalanceIrr || 0);
      // Negative net balance indicates debtor (بدهکار به فروشگاه)
      if (netBal < -5000000) {
        const amtToman = Math.round(Math.abs(netBal) / 10);
        items.push({
          id: `receivable_${party.id}`,
          sourceType: 'OVERDUE_RECEIVABLE',
          titleFa: `مطالبه معوق از «${party.fullName}»`,
          descriptionFa: `مانده بدهی سررسیدشده: ${format3Digit(amtToman)} تومان (تلفن: ${party.mobile || 'ندارد'})`,
          urgency: Math.abs(netBal) > 20000000 ? 'URGENT' : 'HIGH',
          badgeFa: 'مطالبه معوق',
          targetTab: 'PARTIES',
          targetEntityId: party.id,
          primaryActionLabelFa: 'ثبت دریافت وجه / مشاهده معین',
          amountIrr: Math.abs(netBal),
        });
      }
    });

    // 2c. Cheques Needing Action (چک‌های نیازمند وصول یا واگذاری)
    foundationData.cheques?.forEach((chk) => {
      if (chk.status === 'IN_HAND' || chk.status === 'DEPOSITED') {
        const amtToman = Math.round(Number(chk.amountIrr || 0) / 10);
        items.push({
          id: `cheque_${chk.id}`,
          sourceType: 'CHEQUE',
          titleFa: `چک شماره ${chk.chequeNumber}`,
          descriptionFa: `طرف حساب: ${chk.partyNameFa} | بانک: ${chk.bankNameFa} | مبلغ: ${format3Digit(amtToman)} تومان`,
          urgency: chk.status === 'DEPOSITED' ? 'URGENT' : 'NORMAL',
          badgeFa: chk.status === 'DEPOSITED' ? 'در جریان وصول' : 'نزد صندوق',
          targetTab: 'TREASURY',
          targetEntityId: chk.id,
          primaryActionLabelFa: 'اعلام وصول یا واگذاری چک',
          amountIrr: Number(chk.amountIrr || 0),
          dateJalali: chk.dueDateJalali,
        });
      }
    });

    // 2d. Projects Needing Action (پروژه‌های معطل تخصیص نصاب یا قطعات)
    foundationData.projects?.forEach((prj) => {
      if (prj.status === 'DRAFT' || !prj.installerId) {
        items.push({
          id: `mgmt_prj_${prj.id}`,
          sourceType: 'PROJECT_INSTALLATION',
          titleFa: `پروژه «${prj.titleFa}»`,
          descriptionFa: !prj.installerId
            ? `پروژه فاقد تکنسین نصاب است (مشتری: ${prj.customerTitleFa || 'نامشخص'})`
            : `پروژه در وضعیت پیش‌نویس است`,
          urgency: !prj.installerId ? 'URGENT' : 'HIGH',
          badgeFa: !prj.installerId ? 'نیازمند تخصیص نصاب' : 'پیش‌نویس پروژه',
          targetTab: 'INSTALLATION',
          targetEntityId: prj.id,
          primaryActionLabelFa: !prj.installerId ? 'تخصیص تکنسین نصاب' : 'مشاهده پروژه',
          dateJalali: prj.startDateJalali,
        });
      }
    });

    // 2e. Critical Low Stock Alerts (کسری موجودی بحرانی)
    foundationData.items?.forEach((item) => {
      const stock = Number(item.totalStock || 0);
      const minAlert = Number(item.minStockAlert || 5);
      if (stock <= 0 || stock <= minAlert) {
        items.push({
          id: `stock_${item.id}`,
          sourceType: 'LOW_STOCK',
          titleFa: `هشدار کسری: «${item.titleFa}»`,
          descriptionFa: `موجودی فعلی: ${format3Digit(stock)} ${item.unitNameFa || 'عدد'} (حداقل مجاز: ${format3Digit(minAlert)})`,
          urgency: stock <= 0 ? 'URGENT' : 'NORMAL',
          badgeFa: stock <= 0 ? 'اتمام موجودی' : 'کسری موجودی',
          targetTab: 'INVENTORY',
          targetEntityId: item.id,
          primaryActionLabelFa: 'ثبت سفارش خرید یا انبارگردانی',
        });
      }
    });

    // Sort by priority: URGENT first, then HIGH, then NORMAL
    const urgencyWeight = { URGENT: 3, HIGH: 2, NORMAL: 1 };
    items.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

    return items;
  }, [foundationData, isInstaller, activeUser]);

  // Filter out dismissed items and apply filter tab
  const visibleItems = useMemo(() => {
    return allActionItems
      .filter((item) => !dismissedItemIds.includes(item.id))
      .filter((item) => {
        if (activeFilter === 'ALL') return true;
        return item.urgency === activeFilter;
      });
  }, [allActionItems, dismissedItemIds, activeFilter]);

  const urgentCount = allActionItems.filter((i) => !dismissedItemIds.includes(i.id) && i.urgency === 'URGENT').length;
  const highCount = allActionItems.filter((i) => !dismissedItemIds.includes(i.id) && i.urgency === 'HIGH').length;

  const handleResolveItem = (itemId: string, targetTab: string, entityId?: number | string) => {
    const updated = [...dismissedItemIds, itemId];
    setDismissedItemIds(updated);
    try {
      localStorage.setItem('mehregan_dismissed_action_items', JSON.stringify(updated));
    } catch {}

    if (onItemResolved) onItemResolved(itemId);
    if (onClose) onClose();
    onNavigateTab(targetTab, entityId);
  };

  const content = (
    <div className="space-y-4 text-right dir-rtl">
      {/* Top Banner / Summary */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ring-2 ring-white/30 shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isInstaller ? 'کارتابل اقدامات فنی و میدانی نصاب' : 'صندوق کارهای منتظر اقدام مدیر'}
            </h2>
            <p className="text-xs text-white/80 font-medium">
              {isInstaller
                ? 'پروژه‌های نصب در دست اقدام و حواله‌های قطعات تخصیص‌یافته به شما'
                : 'پیش‌فاکتورهای منتظر تبدیل، مطالبات معوق، چک‌ها و کسری‌های بحرانی'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {urgentCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-rose-500/90 text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
              <Flame className="w-3.5 h-3.5" />
              <span>{urgentCount} کار فوری</span>
            </span>
          )}
          <span className="px-3 py-1 rounded-xl bg-white/20 text-white text-xs font-bold font-mono">
            {visibleItems.length} کار باز
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>تمام کارها</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">
            {allActionItems.filter((i) => !dismissedItemIds.includes(i.id)).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('URGENT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'URGENT'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>فوری ({urgentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('HIGH')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'HIGH'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>مهم ({highCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('NORMAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'NORMAL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <span>عادی</span>
        </button>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {visibleItems.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-black text-slate-800">
              هیچ کار منتظر اقدامی وجود ندارد!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
              تمامی پیش‌فاکتورها، مطالبات مالی، چک‌ها و پروژه‌های نصبی در وضعیت مناسب و رسیدگی‌شده قرار دارند.
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const urgencyBorder =
              item.urgency === 'URGENT'
                ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                : item.urgency === 'HIGH'
                ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                : 'border-slate-200 bg-white hover:border-blue-300';

            const badgeColor =
              item.urgency === 'URGENT'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : item.urgency === 'HIGH'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-blue-100 text-blue-800 border-blue-300';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all shadow-2xs space-y-3 ${urgencyBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                      {item.sourceType === 'PROFORMA' && <FileText className="w-5 h-5 text-indigo-600" />}
                      {item.sourceType === 'OVERDUE_RECEIVABLE' && <DollarSign className="w-5 h-5 text-rose-600" />}
                      {item.sourceType === 'CHEQUE' && <Building2 className="w-5 h-5 text-amber-600" />}
                      {item.sourceType === 'PROJECT_INSTALLATION' && <Wrench className="w-5 h-5 text-teal-600" />}
                      {item.sourceType === 'LOW_STOCK' && <Package className="w-5 h-5 text-orange-600" />}
                      {item.sourceType === 'OVERDUE_PAYABLE' && <DollarSign className="w-5 h-5 text-purple-600" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {item.titleFa}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {item.badgeFa}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                        {item.descriptionFa}
                      </p>
                    </div>
                  </div>

                  {item.dateJalali && (
                    <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-1 rounded-lg border border-slate-200/80 shrink-0 hidden sm:inline-block">
                      {item.dateJalali}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...dismissedItemIds, item.id];
                      setDismissedItemIds(updated);
                      try {
                        localStorage.setItem('mehregan_dismissed_action_items', JSON.stringify(updated));
                      } catch {}
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    صرف‌نظر موقت
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResolveItem(item.id, item.targetTab, item.targetEntityId)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{item.primaryActionLabelFa}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-right dir-rtl">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-600" />
              <span>صندوق کارهای منتظر اقدام</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{content}</div>
        </div>
      </div>
    );
  }

  return content;
};
