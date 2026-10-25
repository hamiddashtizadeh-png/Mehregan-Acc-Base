import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Scale,
  CreditCard,
  User,
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  FoundationDataResponse,
  PartyRecord,
  GoldDualLedgerItem,
  GoldColleagueTrade,
} from '../types/foundation';
import { printHtmlContent } from '../utils/printUtils';
import { GoldColleagueTradeModal } from './GoldColleagueTradeModal';
import { PriceInput } from './PriceInput';

interface GoldDualLedgerViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
  preselectedPartyId?: number;
}

export const GoldDualLedgerView: React.FC<GoldDualLedgerViewProps> = ({
  foundationData,
  onRefresh,
  preselectedPartyId,
}) => {
  const parties = foundationData.parties || [];
  const [selectedPartyId, setSelectedPartyId] = useState<number>(
    preselectedPartyId || (parties.length > 0 ? parties[0].id : 1)
  );
  const [searchPartyQuery, setSearchPartyQuery] = useState('');
  const [ledgerData, setLedgerData] = useState<{
    party: any;
    summary: {
      goldBalanceGrams: number;
      goldBalanceStatusFa: string;
      netBalanceIrr: number;
      netBalanceToman: number;
      rialBalanceStatusFa: string;
      totalGoldTradedGrams: number;
      tradeCount: number;
    };
    ledgerItems: GoldDualLedgerItem[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Form states for settlement & conversion
  const [settleWeightInput, setSettleWeightInput] = useState<string>('5.000');
  const [settleNotesFa, setSettleNotesFa] = useState<string>('');
  const [convertWeightInput, setConvertWeightInput] = useState<string>('10.000');
  const [convertRateTomanInput, setConvertRateTomanInput] = useState<string>('3650000');
  const [convertNotesFa, setConvertNotesFa] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter parties by search
  const filteredParties = useMemo(() => {
    if (!searchPartyQuery.trim()) return parties;
    const q = searchPartyQuery.trim().toLowerCase();
    return parties.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.partyCode.toLowerCase().includes(q) ||
        (p.mobile && p.mobile.includes(q))
    );
  }, [parties, searchPartyQuery]);

  const fetchDualLedger = async (pId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gold/dual-ledger/${pId}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.messageFa || 'خطا در دریافت صورت وضعیت دوگانه.');
      }
      setLedgerData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطای ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      fetchDualLedger(selectedPartyId);
    }
  }, [selectedPartyId]);

  // Handle weight settlement
  const handleSettleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(settleWeightInput);
    if (!w || w <= 0) return;

    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/gold/settle-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: selectedPartyId,
          weightGrams: w,
          notesFa: settleNotesFa || 'تسویه وزنی طلا و دریافت/تحویل قطعه طلای آبشده',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.messageFa || 'خطا در ثبت تسویه.');

      setActionFeedback({ type: 'success', message: 'تسویه وزنی طلا با موفقیت ثبت شد.' });
      setIsSettleModalOpen(false);
      await fetchDualLedger(selectedPartyId);
      await onRefresh();
    } catch (err: unknown) {
      setActionFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطا در تسویه' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle convert weight to rial
  const handleConvertToRialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(convertWeightInput);
    const rate = parseFloat(convertRateTomanInput) * 10;
    if (!w || w <= 0 || !rate || rate <= 0) return;

    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/gold/convert-to-rial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: selectedPartyId,
          weightGrams: w,
          dailyRateIrr: rate,
          notesFa: convertNotesFa || 'تبدیل مانده وزنی طلا به ریال با مظنه روز و بستن حساب طلا',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.messageFa || 'خطا در تبدیل طلا به ریال.');

      setActionFeedback({
        type: 'success',
        message: `مبلغ ${json.totalAmountToman?.toLocaleString('fa-IR')} تومان به حساب ریالی شخص منظور و ${w} گرم از مانده طلای او کسر شد.`,
      });
      setIsConvertModalOpen(false);
      await fetchDualLedger(selectedPartyId);
      await onRefresh();
    } catch (err: unknown) {
      setActionFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطا در تبدیل' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!ledgerData) return;
    let csv =
      '\uFEFFردیف,تاریخ جلالی,شماره سند,نوع سند,شرح,ورودی طلا (گرم),خروجی طلا (گرم),مانده طلا ۷۵۰ (گرم),بدهکار (ریال),بستانکار (ریال),مانده ریال,حالت معامله\n';

    ledgerData.ledgerItems.forEach((item) => {
      csv += `${item.id},${item.dateJalali},${item.refNumber},${item.docTypeFa},"${(item.titleFa || '').replace(/"/g, '""')}",${item.goldInGrams},${item.goldOutGrams},${item.runningGoldBalanceGrams},${item.debitIrr},${item.creditIrr},${item.runningRialBalanceIrr},${item.isPureGoldTradeNoRial ? 'بدون ریال' : 'ریالی'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `صورت_حساب_دوگانه_طلا_و_ریال_${ledgerData.party.fullName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Dual Statement
  const handlePrint = async () => {
    if (!ledgerData) return;
    const { party, summary, ledgerItems } = ledgerData;

    const rowsHtml = ledgerItems
      .map(
        (i) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px; text-align: center;">${i.id}</td>
        <td style="padding: 6px; text-align: center;">${i.dateJalali}</td>
        <td style="padding: 6px; text-align: center; font-family: monospace;">${i.refNumber}</td>
        <td style="padding: 6px; font-weight: bold;">${i.titleFa}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace; color: #059669;">${i.goldInGrams > 0 ? i.goldInGrams.toFixed(3) : '—'}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace; color: #d97706;">${i.goldOutGrams > 0 ? i.goldOutGrams.toFixed(3) : '—'}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold; background: #fffbeb;">${i.runningGoldBalanceGrams.toFixed(3)}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace;">${i.debitIrr > 0 ? (i.debitIrr / 10).toLocaleString('fa-IR') : '—'}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace;">${i.creditIrr > 0 ? (i.creditIrr / 10).toLocaleString('fa-IR') : '—'}</td>
        <td style="padding: 6px; text-align: left; font-family: monospace; font-weight: bold; background: #f0fdf4;">${(i.runningRialBalanceIrr / 10).toLocaleString('fa-IR')}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Shabnam, Tahoma, sans-serif; direction: rtl; padding: 20px; color: #1e293b;">
        <div style="border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 16px; margin: 0; color: #78350f;">صورت وضعیت دوگانه طلا و ریال (کاردکس زرگری همکاران)</h1>
            <p style="font-size: 11px; margin: 4px 0 0; color: #64748b;">${foundationData.settings.companyName} | اتحادیه صنف طلا، جواهر و نقره</p>
          </div>
          <div style="text-align: left; font-size: 11px;">
            <p style="margin: 0;">تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; display: flex; justify-content: space-between;">
          <div>
            <span style="font-size: 11px; color: #64748b;">طرف حساب / همکار:</span>
            <strong style="font-size: 13px; display: block; margin-top: 2px;">${party.fullName} (${party.partyCode})</strong>
            <span style="font-size: 10px; color: #64748b;">موبایل: ${party.mobile || '—'}</span>
          </div>
          <div style="display: flex; gap: 20px;">
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <span style="font-size: 10px; color: #92400e; display: block;">🪙 مانده نهایی طلا ۷۵۰:</span>
              <strong style="font-size: 14px; color: #78350f; font-family: monospace;">${summary.goldBalanceGrams.toFixed(3)} گرم</strong>
              <small style="display: block; font-size: 9px; color: #92400e;">(${summary.goldBalanceStatusFa})</small>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; text-align: center;">
              <span style="font-size: 10px; color: #166534; display: block;">💵 مانده نهایی دفتری:</span>
              <strong style="font-size: 14px; color: #14532d; font-family: monospace;">${summary.netBalanceToman.toLocaleString('fa-IR')} تومان</strong>
              <small style="display: block; font-size: 9px; color: #166534;">(${summary.rialBalanceStatusFa})</small>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 10px; font-weight: bold;">
              <th style="padding: 8px 4px;">ردیف</th>
              <th style="padding: 8px 4px;">تاریخ</th>
              <th style="padding: 8px 4px;">شماره مرجع</th>
              <th style="padding: 8px 4px;">شرح سند</th>
              <th style="padding: 8px 4px; color: #059669;">ورودی طلا (گرم)</th>
              <th style="padding: 8px 4px; color: #d97706;">خروجی طلا (گرم)</th>
              <th style="padding: 8px 4px; background: #fef3c7;">مانده طلا (گرم)</th>
              <th style="padding: 8px 4px;">بدهکار (تومان)</th>
              <th style="padding: 8px 4px;">بستانکار (تومان)</th>
              <th style="padding: 8px 4px; background: #dcfce7;">مانده (تومان)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; padding: 0 40px;">
          <div style="text-align: center;">امضاء و مهر فروشگاه</div>
          <div style="text-align: center;">امضاء طرف حساب / همکار</div>
        </div>
      </div>
    `;

    await printHtmlContent({ title: 'صورت‌حساب طلا و ریال', bodyHtml: html });
  };

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl text-white shadow-md shadow-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>کاردکس و صورت‌حساب دوگانه همکاران (طلا و ریال)</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                Dual Currency & Weight Ledger
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              نمایش لحظه‌ای و همزمان مانده وزنی طلا (به گرم و سوت) و مانده حساب دفتری (ریال/تومان)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTradeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت معامله گرمی همکار</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettleModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تسویه وزنی طلا</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConvertModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>تبدیل طلا به ریال با مظنه</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!ledgerData || ledgerData.ledgerItems.length === 0}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
            title="چاپ کاردکس دوگانه"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!ledgerData || ledgerData.ledgerItems.length === 0}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
            title="خروجی فایل اکسل / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Select Partner Dropdown Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold text-slate-700 whitespace-nowrap">انتخاب همکار / بنکدار:</span>
          <div className="flex-1 min-w-0 max-w-md">
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(Number(e.target.value))}
              className="w-full truncate rounded-xl border border-slate-300 bg-slate-50 p-2 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.partyCode}) {p.mobile ? `· ${p.mobile}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDualLedger(selectedPartyId)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی کاردکس</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Gold Balance vs Rial Balance */}
      {ledgerData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gold Balance */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-4 rounded-2xl border border-amber-300 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                مانده وزنی طلا (گرم ۷۵۰)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ledgerData.summary.goldBalanceGrams > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : ledgerData.summary.goldBalanceGrams < 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {ledgerData.summary.goldBalanceStatusFa}
              </span>
            </div>
            <p className="text-xl font-black text-amber-950 font-mono mt-2">
              {ledgerData.summary.goldBalanceGrams.toFixed(3)}{' '}
              <span className="text-xs font-sans font-normal text-amber-800">گرم طلا ۱۸</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              معادل ریالی با مظنه روز: ~
              {(
                (ledgerData.summary.goldBalanceGrams * 3650000)
              ).toLocaleString('fa-IR')}{' '}
              تومان
            </p>
          </div>

          {/* Card 2: Monetary Balance */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 rounded-2xl border border-emerald-300 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                مانده حساب دفتری (ریالی)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ledgerData.summary.netBalanceIrr > 0
                    ? 'bg-rose-100 text-rose-800'
                    : ledgerData.summary.netBalanceIrr < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {ledgerData.summary.rialBalanceStatusFa}
              </span>
            </div>
            <p className="text-xl font-black text-emerald-950 font-mono mt-2">
              {ledgerData.summary.netBalanceToman.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">تومان</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              {ledgerData.summary.netBalanceIrr.toLocaleString('fa-IR')} ریال
            </p>
          </div>

          {/* Card 3: Total Gold Volume */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              حجم کل مبادلات وزنی طلا
            </span>
            <p className="text-xl font-black text-slate-900 font-mono mt-2">
              {ledgerData.summary.totalGoldTradedGrams.toFixed(3)}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">گرم ۷۵۰</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              مجموع تراکنش‌های وزنی بدون ریال و با ریال
            </p>
          </div>

          {/* Card 4: Transactions Count */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              تعداد اسناد و مبادلات
            </span>
            <p className="text-xl font-black text-slate-900 font-mono mt-2">
              {ledgerData.ledgerItems.length}{' '}
              <span className="text-xs font-sans font-normal text-slate-500">سند مالی و وزنی</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">گردش جامع طلا و ریال</p>
          </div>
        </div>
      )}

      {/* Detailed Dual Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>ریز گردش کاردکس دوگانه (طلا و ریال) - {selectedParty?.fullName}</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            {ledgerData?.ledgerItems.length || 0} ردیف گردش
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 select-none">
              <tr>
                <th className="px-3 py-3 text-center">#</th>
                <th className="px-3 py-3 text-center">تاریخ</th>
                <th className="px-3 py-3">شماره سند</th>
                <th className="px-3 py-3">عنوان و شرح سند</th>
                <th className="px-3 py-3 bg-amber-50/70 text-emerald-800 text-left">
                  ورودی طلا (گرم)
                </th>
                <th className="px-3 py-3 bg-amber-50/70 text-amber-800 text-left">
                  خروجی طلا (گرم)
                </th>
                <th className="px-3 py-3 bg-amber-100/70 text-amber-950 text-left font-black">
                  مانده طلا ۷۵۰ (گرم)
                </th>
                <th className="px-3 py-3 text-left">بدهکار (تومان)</th>
                <th className="px-3 py-3 text-left">بستانکار (تومان)</th>
                <th className="px-3 py-3 bg-emerald-50 text-emerald-950 text-left font-black">
                  مانده ریالی (تومان)
                </th>
                <th className="px-3 py-3 text-center">نوع مبادله</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    در حال بارگذاری صورت‌حساب دوگانه طلا و ریال...
                  </td>
                </tr>
              ) : !ledgerData || ledgerData.ledgerItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    هیچ تراکنش یا سند طلایی برای این همکار ثبت نشده است.
                  </td>
                </tr>
              ) : (
                ledgerData.ledgerItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">{item.id}</td>
                    <td className="px-3 py-3 text-center text-slate-600 font-mono whitespace-nowrap">
                      {item.dateJalali}
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.refNumber}
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <div className="font-bold text-slate-900">{item.titleFa}</div>
                      {item.notesFa && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5" title={item.notesFa}>
                          {item.notesFa}
                        </div>
                      )}
                    </td>
                    {/* Gold Columns */}
                    <td className="px-3 py-3 font-mono text-left font-bold text-emerald-700 bg-amber-50/30 whitespace-nowrap">
                      {item.goldInGrams > 0 ? `+${item.goldInGrams.toFixed(3)}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-left font-bold text-amber-700 bg-amber-50/30 whitespace-nowrap">
                      {item.goldOutGrams > 0 ? `-${item.goldOutGrams.toFixed(3)}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-left font-black text-amber-950 bg-amber-100/50 whitespace-nowrap">
                      {item.runningGoldBalanceGrams.toFixed(3)}
                    </td>
                    {/* Rial Columns */}
                    <td className="px-3 py-3 font-mono text-left text-slate-700 whitespace-nowrap">
                      {item.debitIrr > 0 ? (item.debitIrr / 10).toLocaleString('fa-IR') : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-left text-slate-700 whitespace-nowrap">
                      {item.creditIrr > 0 ? (item.creditIrr / 10).toLocaleString('fa-IR') : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-left font-black text-emerald-900 bg-emerald-50/70 whitespace-nowrap">
                      {(item.runningRialBalanceIrr / 10).toLocaleString('fa-IR')}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {item.isPureGoldTradeNoRial ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-300">
                          بدون ریال (صرفاً گرمی)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                          معامله ریالی
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ثبت معامله گرمی جدید */}
      <GoldColleagueTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        foundationData={foundationData}
        initialPartyId={selectedPartyId}
        onSuccess={async () => {
          await fetchDualLedger(selectedPartyId);
          await onRefresh();
        }}
      />

      {/* MODAL 2: تسویه وزنی طلا */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-emerald-300 overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>تسویه وزنی مانده طلا (صفر کردن حساب گرمی)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSettleWeightSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 font-mono">
                <span className="font-bold font-sans text-emerald-950 block">
                  طرف حساب: {selectedParty?.fullName}
                </span>
                <span className="text-xs text-emerald-800 block mt-0.5">
                  مانده فعلی طلا: {ledgerData?.summary.goldBalanceGrams.toFixed(3)} گرم ۷۵۰
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  وزن تسویه طلا (گرم و سوت):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={settleWeightInput}
                  onChange={(e) => setSettleWeightInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-mono font-bold text-left text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  شرح تسویه / رسید دریافت/پرداخت طلا:
                </label>
                <input
                  type="text"
                  value={settleNotesFa}
                  onChange={(e) => setSettleNotesFa(e.target.value)}
                  placeholder="مثلاً دریافت شمش ۱۰ گرمی استاندارد پارسیس جهت تسویه حساب"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {actionLoading ? 'در حال ثبت...' : 'ثبت تسویه وزنی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: تبدیل مانده طلا به ریال با مظنه */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-blue-300 overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-1.5 text-sm">
                <ArrowRightLeft className="w-4 h-4" />
                <span>تبدیل مانده وزنی طلا به ریال با مظنه روز</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConvertToRialSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 font-mono">
                <span className="font-bold font-sans text-blue-950 block">
                  همکار: {selectedParty?.fullName}
                </span>
                <span className="text-xs text-blue-800 block mt-0.5">
                  مانده فعلی طلا: {ledgerData?.summary.goldBalanceGrams.toFixed(3)} گرم
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  وزن مورد نظر جهت تبدیل به ریال (گرم):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={convertWeightInput}
                  onChange={(e) => setConvertWeightInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-mono font-bold text-left text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  مظنه روز هر گرم طلا ۱۸ عیار (تومان):
                </label>
                <PriceInput
                  value={convertRateTomanInput}
                  onChange={(val) => setConvertRateTomanInput(String(val))}
                  className="w-full text-xs"
                  unit="تومان"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 font-mono">
                <span className="text-[11px] text-amber-900 font-bold block">
                  مبلغ ریالی اضافه شونده به حساب دفتری:
                </span>
                <span className="text-sm font-black text-amber-950 block mt-1">
                  {(
                    (parseFloat(convertWeightInput) || 0) *
                    (parseFloat(convertRateTomanInput) || 0)
                  ).toLocaleString('fa-IR')}{' '}
                  تومان
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">یادداشت تهاتر طلا:</label>
                <input
                  type="text"
                  value={convertNotesFa}
                  onChange={(e) => setConvertNotesFa(e.target.value)}
                  placeholder="مثلاً توافق بر تبدیل ۱۰ گرم مانده طلا به بدهی ریالی با مظنه روز"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {actionLoading ? 'در حال تبدیل...' : 'تایید و بستن حساب طلا'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
