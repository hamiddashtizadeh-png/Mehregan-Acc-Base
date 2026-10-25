import React, { useState, useMemo } from 'react';
import {
  Wrench,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Package,
  Printer,
  FileText,
  Layers,
  Shield,
  Building2,
  Phone,
  MapPin,
  Clock,
  Landmark,
  ExternalLink,
} from 'lucide-react';
import {
  FoundationDataResponse,
  ServiceJobTicketRecord,
  JobTicketPriority,
  JobTicketStatus,
  ServiceSparePartLine,
} from '../types/foundation';
import { printHtmlContent } from '../utils/printUtils';
import { Card, Button } from './ui';
import { PriceInput } from './PriceInput';

interface ServicesContractingViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
}

export const ServicesContractingView: React.FC<ServicesContractingViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'NEW_TICKET' | 'TICKETS_LIST' | 'TECHNICIANS_LIST' | 'ACCOUNTING_MAP'>('NEW_TICKET');

  // Form State
  const [customerId, setCustomerId] = useState<number>(foundationData.parties?.[0]?.id || 1);
  const [ticketTitle, setTicketTitle] = useState('رفع نویز و قطعی مانیتورینگ سالن کنفرانس');
  const [ticketDescription, setTicketDescription] = useState('تصویر دوربین شماره ۳ و ۵ دچار نویز و پرش است و نیاز به تعویض فیش و تست کابل شبکه دارد.');
  const [priority, setPriority] = useState<JobTicketPriority>('URGENT');
  const [technicianId, setTechnicianId] = useState<number>(3); // مهندس علی میرزایی
  const [laborFeeIrr, setLaborFeeIrr] = useState<number>(4500000);
  const [dateJalali, setDateJalali] = useState('1405/01/26');
  const [dueDateJalali, setDueDateJalali] = useState('1405/01/29');

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Add Spare Parts Modal
  const [selectedTicketForParts, setSelectedTicketForParts] = useState<ServiceJobTicketRecord | null>(null);
  const [selectedPartItemId, setSelectedPartItemId] = useState<number>(foundationData.items?.[0]?.id || 1);
  const [partQuantity, setPartQuantity] = useState<number>(2);

  // Inspected Invoice/Accounting Ticket Modal
  const [inspectedTicket, setInspectedTicket] = useState<ServiceJobTicketRecord | null>(null);

  const tickets = foundationData.serviceJobTickets || [];
  const technicians = (foundationData.parties || []).filter(
    (p) => p.roles.includes('INSTALLER') || p.primaryType === 'INSTALLER'
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.titleFa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerNameFa.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalCount = tickets.length;
    const activeCount = tickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
    const completedCount = tickets.filter((t) => t.status === 'COMPLETED').length;
    const totalRevenueIrr = tickets.reduce((acc, t) => acc + t.totalCostIrr, 0);
    return { totalCount, activeCount, completedCount, totalRevenueIrr };
  }, [tickets]);

  const handleCreateTicket = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch('/api/services/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          titleFa: ticketTitle,
          descriptionFa: ticketDescription,
          priority,
          technicianId,
          laborFeeIrr,
          dateJalali,
          dueDateJalali,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.messageFa || 'خطا در ثبت تیکت کار');
      }

      setSuccessMessage(`تیکت کار ${data.ticket?.ticketNumber} با موفقیت ثبت و به تکنسین ارجاع گردید.`);
      await onRefresh();
      setActiveSubTab('TICKETS_LIST');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'خطای ارتباط با سرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: number, status: JobTicketStatus) => {
    try {
      const res = await fetch(`/api/services/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        await onRefresh();
      }
    } catch {
      // ignore
    }
  };

  const handleAddSparePart = async () => {
    if (!selectedTicketForParts) return;
    try {
      const item = foundationData.items?.find((i) => i.id === selectedPartItemId);
      const unitPrice = item?.salePriceIrr || 1000000;
      const partLine: ServiceSparePartLine = {
        itemId: selectedPartItemId,
        itemTitleFa: item?.titleFa || 'قطعه مصرفی',
        quantity: partQuantity,
        unitPriceIrr: unitPrice,
        totalPriceIrr: unitPrice * partQuantity,
      };

      const res = await fetch(`/api/services/tickets/${selectedTicketForParts.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spareParts: [partLine] }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedTicketForParts(null);
        await onRefresh();
      }
    } catch {
      // ignore
    }
  };

  const handleInvoiceTicket = async (ticketId: number) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/services/tickets/${ticketId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMessage(`صورت‌حساب رسمی شماره ${data.salesInvoice?.invoiceNumber} با موفقیت صادر و در دفتر فروش ثبت گردید.`);
        await onRefresh();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintJobSheet = async (t: ServiceJobTicketRecord) => {
    const partsHtml =
      t.spareParts.length > 0
        ? t.spareParts
            .map(
              (p, idx) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${p.itemTitleFa}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${p.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left;">${p.unitPriceIrr.toLocaleString('fa-IR')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; font-weight: bold;">${p.totalPriceIrr.toLocaleString('fa-IR')}</td>
        </tr>
      `
            )
            .join('')
        : `<tr><td colSpan="5" style="padding: 10px; text-align: center; color: #64748b;">هیچ قطعه مصرفی ثبت نشده است.</td></tr>`;

    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; width: 100%; max-width: 210mm; margin: 0 auto; padding: 16px; color: #0f172a; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 10px; font-weight: 900; color: #4338ca; text-transform: uppercase;">واحد خدمات فنی، مهندسی و پشتیبانی مهرگان</div>
            <h2 style="margin: 4px 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">برگه سفارش کار و گزارش انجام خدمات فنی</h2>
          </div>
          <div style="text-align: left; font-size: 11px;">
            <div>شماره تیکت: <strong style="color: #4338ca; font-size: 14px;">${t.ticketNumber}</strong></div>
            <div>تاریخ پذیرش: <strong>${t.dateJalali}</strong></div>
            <div>مهلت تحویل: <strong>${t.dueDateJalali || '—'}</strong></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 12px; margin-bottom: 16px; font-size: 11px;">
          <div>
            <div>کارفرما / طرف حساب: <strong>${t.customerNameFa}</strong></div>
            <div>شماره تماس: <strong style="font-family: monospace;">${t.customerPhone}</strong></div>
            <div>آدرس پروژه: <strong>${t.customerAddressFa}</strong></div>
          </div>
          <div>
            <div>عنوان کار فنی: <strong>${t.titleFa}</strong></div>
            <div>تکنسین مسئول: <strong style="color: #4338ca;">${t.technicianNameFa || 'تکنسین عمومی'}</strong></div>
            <div>اولویت رسیدگی: <strong>${t.priority === 'EMERGENCY' ? 'اضطراری' : t.priority === 'URGENT' ? 'فوری' : 'عادی'}</strong></div>
          </div>
        </div>

        <div style="margin-bottom: 16px; font-size: 11px;">
          <h4 style="margin: 0 0 6px; font-weight: 900;">شرح کامل سفارش کار و عیب‌یابی:</h4>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; line-height: 1.6;">
            ${t.descriptionFa}
          </div>
        </div>

        <div style="margin-bottom: 16px; font-size: 11px;">
          <h4 style="margin: 0 0 6px; font-weight: 900;">فهرست قطعات و مصالح مصرف‌شده در محل پروژه:</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 6px 8px; text-align: center;">ردیف</th>
                <th style="padding: 6px 8px; text-align: right;">شرح قطعه / کالا</th>
                <th style="padding: 6px 8px; text-align: center;">تعداد</th>
                <th style="padding: 6px 8px; text-align: left;">فی (ریال)</th>
                <th style="padding: 6px 8px; text-align: left;">مبلغ کل (ریال)</th>
              </tr>
            </thead>
            <tbody>
              ${partsHtml}
            </tbody>
          </table>
        </div>

        <div style="border-top: 2px solid #0f172a; padding-top: 10px; font-size: 11px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between;">
            <span>اجرت و دستمزد خدمات فنی:</span>
            <strong>${t.laborFeeIrr.toLocaleString('fa-IR')} ریال</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>جمع قطعات مصرفی:</span>
            <strong>${t.sparePartsTotalIrr.toLocaleString('fa-IR')} ریال</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 8px; color: #4338ca;">
            <span>جمع کل هزینه خدمات و قطعات:</span>
            <span>${t.totalCostIrr.toLocaleString('fa-IR')} ریال</span>
          </div>
          <div style="text-align: left; font-size: 10px; color: #64748b;">
            (معادل ${Math.round(t.totalCostIrr / 10).toLocaleString('fa-IR')} تومان)
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; text-align: center; font-size: 11px;">
          <div style="border-top: 1px solid #0f172a; padding-top: 8px;">
            <strong>امضا و مهر تکنسین مجری کار</strong>
          </div>
          <div style="border-top: 1px solid #0f172a; padding-top: 8px;">
            <strong>تأیید تحویل و رضایت‌نامه کارفرما</strong>
          </div>
        </div>
      </div>
    `;

    await printHtmlContent({ title: `برگه سفارش کار ${t.ticketNumber}`, bodyHtml: html });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-purple-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-indigo-600/40">
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 text-indigo-200 text-xs font-bold border border-indigo-400/30 backdrop-blur-md">
              <Wrench className="w-3.5 h-3.5 text-indigo-300" />
              <span>ماژول تخصصی فاز ۱۰: خدمات فنی، مهندسی و پیمانکاری (Job Tickets)</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>مدیریت سفارش کار، اعزام تکنسین، قطعات مصرفی و فاکتور خدمات</span>
              <span className="text-xs font-normal px-2.5 py-1 rounded-lg bg-white/15 text-indigo-100">فاز ۱۰</span>
            </h1>
            <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed max-w-3xl">
              ثبت تیکت‌های کار فنی، ارجاع به تکنسین، تخصیص قطعات و مصالح در محل کارفرما و صدور یک‌کلیکه صورت‌حساب قطعی خدمات با سند روزنامه.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-indigo-200 block font-medium">تیکت‌های فعال</span>
              <span className="text-xl font-black text-indigo-100">{stats.activeCount}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-indigo-200 block font-medium">تکنسین‌های فعال</span>
              <span className="text-xl font-black text-indigo-100">{technicians.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-indigo-200 block font-medium">کل درآمد خدمات</span>
              <span className="text-xl font-black text-emerald-200">{Math.round(stats.totalRevenueIrr / 10).toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>

        {/* Sub Nav */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-indigo-500/40">
          <button
            type="button"
            onClick={() => setActiveSubTab('NEW_TICKET')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'NEW_TICKET'
                ? 'bg-white text-indigo-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/80 border border-indigo-500/30'
            }`}
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>پذیرش و ثبت تیکت کار جدید</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('TICKETS_LIST')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'TICKETS_LIST'
                ? 'bg-white text-indigo-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/80 border border-indigo-500/30'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>کارتابل تیکت‌های فنی و سفارشات ({tickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('TECHNICIANS_LIST')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'TECHNICIANS_LIST'
                ? 'bg-white text-indigo-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/80 border border-indigo-500/30'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>کارکرد و ظرفیت تکنسین‌ها ({technicians.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ACCOUNTING_MAP')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'ACCOUNTING_MAP'
                ? 'bg-white text-indigo-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-indigo-950/60 text-indigo-100 hover:bg-indigo-900/80 border border-indigo-500/30'
            }`}
          >
            <Landmark className="w-4 h-4 text-amber-500" />
            <span>ردپای حسابداری و تبدیل تیکت به فاکتور</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="hover:opacity-75 font-black text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="hover:opacity-75 font-black text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: NEW JOB TICKET */}
      {/* ========================================================================= */}
      {activeSubTab === 'NEW_TICKET' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md">
          <h3 className="text-xs font-black text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-700" />
            <span>اطلاعات سفارش کار، کارفرما و شرح خرابی / خدمات درخواستی</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">کارفرما / مشتری طرف‌حساب:</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              >
                {foundationData.parties?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.companyTitle ? `(${p.companyTitle})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">ارجاع به تکنسین / مجری فنی:</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-indigo-900"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.installerSkills || 'تکنسین عمومی'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">اولویت رسیدگی:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as JobTicketPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="NORMAL">عادی (Normal)</option>
                <option value="URGENT">فوری و اولویت بالا (Urgent)</option>
                <option value="EMERGENCY">اضطراری و توقف کارگاه (Emergency)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block font-bold text-slate-700">عنوان و موضوع کار فنی:</label>
              <input
                type="text"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">اجرت و دستمزد تخمینی (ریال):</label>
              <PriceInput
                value={laborFeeIrr}
                onChange={(val) => setLaborFeeIrr(val)}
                className="w-full font-black text-emerald-800"
                unit="ریال"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="block font-bold text-slate-700">شرح دقیق عیب، محل پروژه و الزامات اجرایی:</label>
              <textarea
                rows={3}
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">تاریخ پذیرش کار:</label>
              <input
                type="text"
                value={dateJalali}
                onChange={(e) => setDateJalali(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">مهلت انجام (تحویل نهایی):</label>
              <input
                type="text"
                value={dueDateJalali}
                onChange={(e) => setDueDateJalali(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              onClick={handleCreateTicket}
              disabled={isSubmitting || !ticketTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl shadow-md cursor-pointer"
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              {isSubmitting ? 'در حال ثبت تیکت...' : 'ثبت و ارجاع تیکت به تکنسین'}
            </Button>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: TICKETS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'TICKETS_LIST' && (
        <Card className="p-6 space-y-4 rounded-3xl border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی شماره تیکت، عنوان یا کارفرما..."
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">وضعیت تیکت:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="OPEN">پذیرش شده (OPEN)</option>
                <option value="ASSIGNED">ارجاع به تکنسین</option>
                <option value="IN_PROGRESS">در حال اجرا</option>
                <option value="PARTS_CONSUMED">قطعات مصرف شده</option>
                <option value="COMPLETED">تکمیل و فاکتور شده</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-black">
                  <th className="py-3 px-3">شماره تیکت</th>
                  <th className="py-3 px-3">کارفرما / آدرس</th>
                  <th className="py-3 px-3">عنوان کار</th>
                  <th className="py-3 px-3">تکنسین مسئول</th>
                  <th className="py-3 px-3 text-center">اولویت</th>
                  <th className="py-3 px-3 text-left">هزینه کل (ریال)</th>
                  <th className="py-3 px-3 text-center">وضعیت</th>
                  <th className="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3 px-3 font-black text-indigo-900">{t.ticketNumber}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{t.customerNameFa}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{t.customerAddressFa}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{t.titleFa}</div>
                      {t.spareParts.length > 0 && (
                        <div className="text-[10px] text-indigo-600 font-bold">
                          {t.spareParts.length} قلم قطعه مصرفی
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-900">
                      {t.technicianNameFa || '— بدون مجری —'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          t.priority === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'URGENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority === 'EMERGENCY'
                          ? 'اضطراری'
                          : t.priority === 'URGENT'
                          ? 'فوری'
                          : 'عادی'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left font-black text-emerald-800">
                      {t.totalCostIrr.toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">ریال</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value as JobTicketStatus)}
                        className={`px-2 py-1 rounded-xl text-xs font-bold border cursor-pointer ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : t.status === 'IN_PROGRESS' || t.status === 'PARTS_CONSUMED'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="OPEN">پذیرش شده</option>
                        <option value="ASSIGNED">ارجاع به مجری</option>
                        <option value="IN_PROGRESS">در حال اجرا</option>
                        <option value="PARTS_CONSUMED">قطعات مصرف شد</option>
                        <option value="COMPLETED">تکمیل و پایان کار</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTicketForParts(t)}
                          title="ثبت قطعات مصرفی در محل"
                          leftIcon={<Package className="w-3.5 h-3.5" />}
                        >
                          قطعه
                        </Button>

                        {t.status !== 'COMPLETED' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleInvoiceTicket(t.id)}
                            title="صدور صورت‌حساب قطعی خدمات"
                            leftIcon={<FileText className="w-3.5 h-3.5" />}
                          >
                            فاکتور
                          </Button>
                        ) : (
                          <span className="text-[10px] text-emerald-800 font-bold px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-xl">
                            ✔ فاکتور شد
                          </span>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintJobSheet(t)}
                          title="چاپ برگه کار فنی"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                        >
                          چاپ برگه
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: TECHNICIANS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'TECHNICIANS_LIST' && (
        <Card className="p-6 space-y-4 rounded-3xl border-slate-200 shadow-md">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-800">
                فهرست تکنسین‌ها، کارشناسان فنی و مجریان پروژه‌های خدماتی
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مشاهده سوابق، تخصص‌ها، کارکردهای فعال و توزیع بارهای کاری تکنسین‌های اعزامی
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full text-xs font-bold">
              {technicians.length} تکنسین فعال
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {technicians.map((tech) => {
              const techTickets = tickets.filter((t) => t.technicianId === tech.id);
              const activeTechTickets = techTickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
              const totalTechLaborIrr = techTickets.reduce((sum, t) => sum + t.laborFeeIrr, 0);

              return (
                <div key={tech.id} className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-black text-lg shadow-xs">
                      {tech.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{tech.fullName}</h4>
                      <span className="text-[11px] text-slate-500 font-mono block">{tech.mobile}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">تخصص اصلی: </span>
                      <span className="font-bold text-indigo-900">{tech.installerSkills || 'مجری فنی و پشتیبانی'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">منطقه فعالیت: </span>
                      <span className="font-bold text-slate-700">{tech.city || 'تهران'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">تیکت‌های در دست اجرا: </span>
                      <span className="font-black text-orange-950">{activeTechTickets.length} مورد</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">مجموع اجرت کارکرد: </span>
                      <span className="font-black text-emerald-800">{totalTechLaborIrr.toLocaleString('fa-IR')} ریال</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: ACCOUNTING MAP */}
      {/* ========================================================================= */}
      {activeSubTab === 'ACCOUNTING_MAP' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-lg">
          <div className="pb-4 border-b border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900">
                ردپای حسابداری: چرخه تبدیل تیکت کار فنی به فاکتور رسمی و سند روزنامه
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              توضیح کامل چرخه یکپارچه بین پذیرش تیکت، تخصیص دستمزد تکنسین، کسر قطعات مصرفی از انبار و صدور خودکار سند حسابداری.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۱
              </div>
              <h4 className="text-xs font-black text-indigo-950">۱. ثبت تیکت کار (Job Ticket)</h4>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                تیکت با کد <code className="bg-indigo-100 px-1 rounded font-bold">TCK-1405-xxx</code> جهت اعزام تکنسین صادر و هزینه دستمزد اولیه تعیین می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۲
              </div>
              <h4 className="text-xs font-black text-blue-950">۲. تخصیص قطعات مصرفی انبار</h4>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                قطعات مصرف‌شده در محل پروژه به صورت خطی به تیکت اضافه گردیده و موجودی کالا در انبار قطعات کسر می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۳
              </div>
              <h4 className="text-xs font-black text-emerald-950">۳. صدور فاکتور فروش رسمی</h4>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                با یک کلیک فاکتور فروش خدماتی با کد <code className="bg-emerald-100 px-1 rounded font-bold">INV-SVC-1405-xxx</code> صادر و به بدهکار مشتری منظور می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۴
              </div>
              <h4 className="text-xs font-black text-amber-950">۴. ثبت سند دوبل حسابداری</h4>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                سند روزنامه دوبل صادر می‌گردد: بدهکار حساب‌های دریافتنی (۱۰۳۰)، بستانکار درآمد خدمات فنی (۶۰۲۰) و مالیات (۳۰۴۰).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SPARE PARTS */}
      {/* ========================================================================= */}
      {selectedTicketForParts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 bg-white space-y-4 shadow-xl rounded-3xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-black text-slate-900">
                  ثبت قطعات مصرفی برای تیکت {selectedTicketForParts.ticketNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForParts(null)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">انتخاب کالا / قطعه از انبار:</label>
                <select
                  value={selectedPartItemId}
                  onChange={(e) => setSelectedPartItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {foundationData.items?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.titleFa} - {(item.salePriceIrr || 0).toLocaleString('fa-IR')} ریال
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">تعداد مصرف شده در محل:</label>
                <input
                  type="number"
                  min="1"
                  value={partQuantity}
                  onChange={(e) => setPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-center font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedTicketForParts(null)}>
                انصراف
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddSparePart} className="bg-indigo-600 text-white font-black" leftIcon={<Package className="w-4 h-4" />}>
                ثبت قطعه مصرفی
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
