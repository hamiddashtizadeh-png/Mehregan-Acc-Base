import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Users,
  ShoppingCart,
  Package,
  Wrench,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  Calendar,
  Building2,
  Phone,
  Tag,
  Hash,
  Eye
} from 'lucide-react';
import { FoundationDataResponse } from '../types/foundation';
import { normalizePersianText, format3Digit, parsePersianDigits } from '../utils/agentEngine';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, entityId?: number | string) => void;
  foundationData: FoundationDataResponse | null;
}

type EntityCategory = 'ALL' | 'PARTIES' | 'INVOICES' | 'ITEMS' | 'PROJECTS' | 'ACCOUNTING';

interface SearchResultItem {
  id: string;
  entityId: number | string;
  category: EntityCategory;
  categoryFa: string;
  titleFa: string;
  subtitleFa: string;
  codeOrNumber: string;
  dateOrBadge?: string;
  targetTab: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  foundationData,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EntityCategory>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen]);

  // Check RBAC permissions for current user
  const activeUser = foundationData?.activeUser;
  const isInstaller =
    activeUser &&
    (Boolean(activeUser.installerPartyId) ||
      activeUser.assignedRoles?.includes('INSTALLER') ||
      activeUser.jobTitle?.includes('نصاب') ||
      activeUser.jobTitle?.includes('تکنسین'));

  const canViewParties = !activeUser?.assignedRoles?.includes('GUEST');
  const canViewInvoices = !isInstaller;
  const canViewAccounting = !isInstaller && !activeUser?.assignedRoles?.includes('GUEST');
  const canViewProjects = true;
  const canViewItems = true;

  // Search indexing & fuzzy filtering
  const allResults = useMemo(() => {
    const rawQ = query.trim();
    if (!rawQ || rawQ.length < 2) return [];

    const normQ = normalizePersianText(rawQ);
    const digitsQ = parsePersianDigits(rawQ).replace(/[^\d]/g, '');
    const results: SearchResultItem[] = [];

    // 1. Search Parties
    if (canViewParties && foundationData?.parties) {
      foundationData.parties.forEach((p) => {
        const normName = normalizePersianText(p.fullName);
        const normComp = normalizePersianText(p.companyTitle || '');
        const normCode = normalizePersianText(p.partyCode || '');
        const mobile = p.mobile || '';
        const nationalId = p.nationalId || '';

        const match =
          normName.includes(normQ) ||
          normComp.includes(normQ) ||
          normCode.includes(normQ) ||
          (digitsQ && mobile.includes(digitsQ)) ||
          (digitsQ && nationalId.includes(digitsQ));

        if (match) {
          const bal = Number(p.transactionsSummary?.netBalanceIrr || 0);
          const balText =
            bal < 0
              ? `بدهکار: ${format3Digit(Math.abs(bal))} تومان`
              : bal > 0
              ? `طلبکار: ${format3Digit(bal)} تومان`
              : 'بی‌حساب';

          results.push({
            id: `party_${p.id}`,
            entityId: p.id,
            category: 'PARTIES',
            categoryFa: 'اشخاص و مشتریان',
            titleFa: p.fullName,
            subtitleFa: p.companyTitle ? `${p.companyTitle} | ${balText}` : balText,
            codeOrNumber: p.partyCode || String(p.id),
            dateOrBadge: p.mobile || 'طرف تجاری',
            targetTab: 'PARTIES',
            icon: Users,
            colorClass: 'bg-blue-100 text-blue-700 border-blue-200',
          });
        }
      });
    }

    // 2. Search Invoices (Sales & Purchases & Proformas)
    if (canViewInvoices) {
      if (foundationData?.salesInvoices) {
        foundationData.salesInvoices.forEach((inv) => {
          const normInvNum = normalizePersianText(inv.invoiceNumber || '');
          const normCust = normalizePersianText(inv.customerTitleFa || '');
          const match = normInvNum.includes(normQ) || normCust.includes(normQ);

          if (match) {
            results.push({
              id: `sale_inv_${inv.id}`,
              entityId: inv.id,
              category: 'INVOICES',
              categoryFa: 'فاکتور فروش',
              titleFa: `فاکتور فروش ${inv.invoiceNumber}`,
              subtitleFa: `مشتری: ${inv.customerTitleFa || 'عمومی'} | مبلغ: ${format3Digit(
                Math.round(Number(inv.totalInvoiceAmountIrr || 0) / 10)
              )} تومان`,
              codeOrNumber: inv.invoiceNumber,
              dateOrBadge: inv.dateJalali || 'فروش',
              targetTab: 'SALES',
              icon: ShoppingCart,
              colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            });
          }
        });
      }

      if (foundationData?.salesProformas) {
        foundationData.salesProformas.forEach((pro) => {
          const normNum = normalizePersianText(pro.proformaNumber || '');
          const normCust = normalizePersianText(pro.customerTitleFa || '');
          const match = normNum.includes(normQ) || normCust.includes(normQ);

          if (match) {
            results.push({
              id: `sale_pro_${pro.id}`,
              entityId: pro.id,
              category: 'INVOICES',
              categoryFa: 'پیش‌فاکتور فروش',
              titleFa: `پیش‌فاکتور ${pro.proformaNumber}`,
              subtitleFa: `مشتری: ${pro.customerTitleFa || 'عمومی'} | مبلغ: ${format3Digit(
                Math.round(Number(pro.totalPayableIrr || 0) / 10)
              )} تومان`,
              codeOrNumber: pro.proformaNumber,
              dateOrBadge: 'پیش‌فاکتور',
              targetTab: 'SALES',
              icon: ShoppingCart,
              colorClass: 'bg-amber-100 text-amber-700 border-amber-200',
            });
          }
        });
      }
    }

    // 3. Search Items & Inventory
    if (canViewItems && foundationData?.items) {
      foundationData.items.forEach((item) => {
        const normTitle = normalizePersianText(item.titleFa || '');
        const normCode = normalizePersianText(item.itemCode || '');
        const normModel = normalizePersianText(item.model || '');
        const barcode = item.barcode || '';

        const match =
          normTitle.includes(normQ) ||
          normCode.includes(normQ) ||
          normModel.includes(normQ) ||
          (digitsQ && barcode.includes(digitsQ));

        if (match) {
          results.push({
            id: `item_${item.id}`,
            entityId: item.id,
            category: 'ITEMS',
            categoryFa: 'کالاها و خدمات',
            titleFa: item.titleFa,
            subtitleFa: `کد: ${item.itemCode} | موجودی: ${format3Digit(item.totalStock || 0)} ${item.unitNameFa || 'عدد'}`,
            codeOrNumber: item.itemCode,
            dateOrBadge: (item.totalStock || 0) > 0 ? 'موجود' : 'کسری موجودی',
            targetTab: 'INVENTORY',
            icon: Package,
            colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          });
        }
      });
    }

    // 4. Search Projects & Installation Jobs
    if (canViewProjects && foundationData?.projects) {
      foundationData.projects.forEach((prj) => {
        // If installer, only show assigned projects
        if (isInstaller && activeUser?.installerPartyId && prj.installerId !== activeUser.installerPartyId) {
          return;
        }

        const normTitle = normalizePersianText(prj.titleFa || '');
        const normNum = normalizePersianText(prj.projectCode || '');
        const normCust = normalizePersianText(prj.customerTitleFa || '');
        const normInst = normalizePersianText(prj.installerTitleFa || '');

        const match =
          normTitle.includes(normQ) ||
          normNum.includes(normQ) ||
          normCust.includes(normQ) ||
          normInst.includes(normQ);

        if (match) {
          results.push({
            id: `project_${prj.id}`,
            entityId: prj.id,
            category: 'PROJECTS',
            categoryFa: 'پروژه‌ها و خدمات نصب',
            titleFa: prj.titleFa,
            subtitleFa: `مشتری: ${prj.customerTitleFa || '-'} | نصاب: ${prj.installerTitleFa || '-'}`,
            codeOrNumber: prj.projectCode,
            dateOrBadge: prj.status || 'پروژه',
            targetTab: 'INSTALLATION',
            icon: Wrench,
            colorClass: 'bg-teal-100 text-teal-700 border-teal-200',
          });
        }
      });
    }

    // 5. Search Accounting Documents
    if (canViewAccounting && foundationData?.accountingDocuments) {
      foundationData.accountingDocuments.forEach((doc) => {
        const normDocNum = normalizePersianText(doc.docNumber || '');
        const normDesc = normalizePersianText(doc.descriptionFa || '');

        const match = normDocNum.includes(normQ) || normDesc.includes(normQ);

        if (match) {
          results.push({
            id: `doc_${doc.id}`,
            entityId: doc.id,
            category: 'ACCOUNTING',
            categoryFa: 'اسناد حسابداری',
            titleFa: `سند شماره ${doc.docNumber}`,
            subtitleFa: doc.descriptionFa || 'سند حسابداری دفتر کل',
            codeOrNumber: doc.docNumber,
            dateOrBadge: doc.dateJalali || 'سند',
            targetTab: 'ACCOUNTING',
            icon: BookOpen,
            colorClass: 'bg-purple-100 text-purple-700 border-purple-200',
          });
        }
      });
    }

    return results;
  }, [query, foundationData, canViewParties, canViewInvoices, canViewAccounting, canViewProjects, canViewItems, isInstaller, activeUser]);

  // Filtered by selected category tab
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return allResults;
    return allResults.filter((r) => r.category === selectedCategory);
  }, [allResults, selectedCategory]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<EntityCategory, number> = {
      ALL: allResults.length,
      PARTIES: 0,
      INVOICES: 0,
      ITEMS: 0,
      PROJECTS: 0,
      ACCOUNTING: 0,
    };
    allResults.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [allResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] text-right dir-rtl">
        {/* Search Header Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی سراسری (نام شخص، تلفن، شماره فاکتور، کد کالا، شماره پروژه)..."
            className="w-full bg-transparent border-none text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto select-none no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>همه</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-mono">
              {categoryCounts.ALL}
            </span>
          </button>

          {canViewParties && (
            <button
              type="button"
              onClick={() => setSelectedCategory('PARTIES')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'PARTIES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>اشخاص</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono">
                {categoryCounts.PARTIES}
              </span>
            </button>
          )}

          {canViewInvoices && (
            <button
              type="button"
              onClick={() => setSelectedCategory('INVOICES')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'INVOICES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>فاکتورها</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono">
                {categoryCounts.INVOICES}
              </span>
            </button>
          )}

          {canViewItems && (
            <button
              type="button"
              onClick={() => setSelectedCategory('ITEMS')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'ITEMS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>کالا و انبار</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono">
                {categoryCounts.ITEMS}
              </span>
            </button>
          )}

          {canViewProjects && (
            <button
              type="button"
              onClick={() => setSelectedCategory('PROJECTS')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'PROJECTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>پروژه‌ها</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono">
                {categoryCounts.PROJECTS}
              </span>
            </button>
          )}

          {canViewAccounting && (
            <button
              type="button"
              onClick={() => setSelectedCategory('ACCOUNTING')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'ACCOUNTING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>اسناد مالی</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 font-mono">
                {categoryCounts.ACCOUNTING}
              </span>
            </button>
          )}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {query.trim().length < 2 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold">برای جست‌وجو حداقل ۲ حرف وارد کنید.</p>
              <p className="text-[11px] text-slate-400 font-medium">
                جست‌وجو همزمان در اشخاص، فاکتورها، کالاها، پروژه‌ها و دفاتر مالی
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-xs font-bold text-slate-600">
                موردی مطابق با «{query}» یافت نشد.
              </p>
              <p className="text-[11px] text-slate-400">
                لطفاً املای کلمه را بررسی کرده یا دسته‌بندی دیگری را انتخاب نمایید.
              </p>
            </div>
          ) : (
            filteredResults.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate(item.targetTab, item.entityId);
                  }}
                  className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 transition-all text-right flex items-center justify-between group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${item.colorClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {item.titleFa}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {item.categoryFa}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {item.subtitleFa}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.dateOrBadge && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 hidden sm:inline-block">
                        {item.dateOrBadge}
                      </span>
                    )}
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-bold px-4">
          <span>کلید میانبر در تمام صفحات: Ctrl + K یا Cmd + K</span>
          <span>{filteredResults.length} نتیجه یافته شد</span>
        </div>
      </div>
    </div>
  );
};
