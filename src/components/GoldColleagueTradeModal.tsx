import React, { useState } from 'react';
import {
  X,
  Coins,
  Scale,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Calculator,
  User,
  Calendar,
  FileText,
  BadgePercent,
  TrendingUp,
} from 'lucide-react';
import {
  FoundationDataResponse,
  GoldTradeType,
  GoldItemCategory,
  PartyRecord,
  GoldColleagueTrade,
} from '../types/foundation';
import { PriceInput } from './PriceInput';

interface GoldColleagueTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTrade: GoldColleagueTrade) => void;
  foundationData: FoundationDataResponse;
  initialPartyId?: number;
}

export const GoldColleagueTradeModal: React.FC<GoldColleagueTradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  foundationData,
  initialPartyId,
}) => {
  const parties = foundationData.parties || [];
  const defaultPartyId =
    initialPartyId || (parties.length > 0 ? parties[0].id : 1);

  const [tradeType, setTradeType] = useState<GoldTradeType>('COLLEAGUE_WEIGHT_SALE');
  const [partyId, setPartyId] = useState<number>(defaultPartyId);
  const [goldCategory, setGoldCategory] = useState<GoldItemCategory>('GOLD_18K_MADE');
  const [rawWeightInput, setRawWeightInput] = useState<string>('15.500');
  const [stoneWeightInput, setStoneWeightInput] = useState<string>('0.000');
  const [ayarInput, setAyarInput] = useState<string>('750');
  const [makingWageInput, setMakingWageInput] = useState<string>('0.000');
  const [isPureGoldTradeNoRial, setIsPureGoldTradeNoRial] = useState<boolean>(true);
  const [dailyRateTomanInput, setDailyRateTomanInput] = useState<string>('3650000');
  const [engravingCode, setEngravingCode] = useState<string>('');
  const [descriptionFa, setDescriptionFa] = useState<string>('');
  const [dateJalali, setDateJalali] = useState<string>('1405/01/25');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time calculations
  const rawWeight = parseFloat(rawWeightInput) || 0;
  const stoneWeight = parseFloat(stoneWeightInput) || 0;
  const netWeight = Math.max(0, rawWeight - stoneWeight);
  const ayar = parseFloat(ayarInput) || 750;
  const pure750 = Number(((netWeight * ayar) / 750).toFixed(3));
  const makingWageGrams = parseFloat(makingWageInput) || 0;
  const totalWeightGrams = Number((pure750 + makingWageGrams).toFixed(3));

  const dailyRateIrr = (parseFloat(dailyRateTomanInput) || 0) * 10;
  const totalAmountIrr = isPureGoldTradeNoRial
    ? 0
    : Math.round(totalWeightGrams * dailyRateIrr);
  const totalAmountToman = Math.round(totalAmountIrr / 10);

  const selectedParty = parties.find((p) => p.id === partyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeightGrams <= 0) {
      setError('وزن خالص طلا باید بزرگ‌تر از صفر باشد.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gold/colleague-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeType,
          partyId,
          goldItemCategory: goldCategory,
          rawWeightGrams: rawWeight,
          stoneWeightGrams: stoneWeight,
          ayar,
          makingWageGrams,
          isPureGoldTradeNoRial,
          goldDailyRateIrr: isPureGoldTradeNoRial ? undefined : dailyRateIrr,
          engravingCode: engravingCode.trim() || undefined,
          descriptionFa: descriptionFa.trim() || undefined,
          dateJalali,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.messageFa || 'خطا در ثبت معامله همکار طلا.');
      }

      onSuccess(json.trade);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطای ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-amber-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ثبت مبادله و فروش همکار (فروش گرمی بدون ریال / با ریال)</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  صنف طلا و جواهر
                </span>
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                بده‌بستان وزنی طلا، فروش همکار، آبشده و موازنه کاردکس طلا
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. نوع عملیات مبادله */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">نوع معامله طلا:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTradeType('COLLEAGUE_WEIGHT_SALE')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  tradeType === 'COLLEAGUE_WEIGHT_SALE'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs ring-2 ring-amber-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">فروش همکار</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  تحویل طلا (بدهکار وزنی)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTradeType('COLLEAGUE_WEIGHT_RECEIPT')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  tradeType === 'COLLEAGUE_WEIGHT_RECEIPT'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">دریافت از همکار</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  دریافت طلا (بستانکار وزنی)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTradeType('COLLEAGUE_BARTER')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  tradeType === 'COLLEAGUE_BARTER'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-2 ring-blue-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">بده‌بستان و تهاتر</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  تبادل متفرقه با ساخته
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTradeType('COLLEAGUE_SETTLEMENT')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  tradeType === 'COLLEAGUE_SETTLEMENT'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs ring-2 ring-purple-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">تسویه وزنی</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  صفر کردن مانده طلا
                </div>
              </button>
            </div>
          </div>

          {/* 2. انتخاب طرف حساب / همکار و تاریخ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>انتخاب همکار / بنکدار / شخص:</span>
                {selectedParty && (
                  <span className="text-[10px] font-mono text-amber-700 font-bold">
                    مانده طلا: {(selectedParty.goldBalanceGrams || 0).toFixed(3)} گرم
                  </span>
                )}
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(Number(e.target.value))}
                className="w-full truncate rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.partyCode}) {p.mobile ? `· ${p.mobile}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع طلای مبادله:</label>
                <select
                  value={goldCategory}
                  onChange={(e) => setGoldCategory(e.target.value as GoldItemCategory)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="GOLD_18K_MADE">طلای ساخته ۱۸ عیار</option>
                  <option value="MELTED_GOLD">طلای آبشده (انگ‌دار)</option>
                  <option value="SCRAP_GOLD">طلای کهنه / متفرقه</option>
                  <option value="BAR_INGOT">شمش استاندارد</option>
                  <option value="COIN">سکه بهار آزادی</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاریخ جلالی:</label>
                <input
                  type="text"
                  value={dateJalali}
                  onChange={(e) => setDateJalali(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-mono text-center font-bold"
                  placeholder="1405/01/25"
                />
              </div>
            </div>
          </div>

          {/* 3. اوزان، عیار و محاسبه طلای معادل ۷۵۰ */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-600" />
                مشخصات وزنی و عیار استاندارد طلا
              </span>
              <span className="text-[11px] font-mono text-amber-800 font-black">
                معادل طلای ۷۵۰: {pure750.toFixed(3)} گرم
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  وزن ناخالص (گرم و سوت):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={rawWeightInput}
                  onChange={(e) => setRawWeightInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 font-mono font-bold text-left text-xs"
                  placeholder="15.500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  کسر نگین/سنگ (گرم):
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={stoneWeightInput}
                  onChange={(e) => setStoneWeightInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 font-mono text-left text-xs"
                  placeholder="0.000"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  عیار طلا (۷۵۰ = ۱۸):
                </label>
                <input
                  type="number"
                  step="1"
                  value={ayarInput}
                  onChange={(e) => setAyarInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 font-mono font-bold text-center text-xs"
                  placeholder="750"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  اجرت وزنی (گرم):
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={makingWageInput}
                  onChange={(e) => setMakingWageInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 font-mono text-left text-xs"
                  placeholder="0.000"
                  title="اجرت گرمی اضافه شده به وزن طلای خالص"
                />
              </div>
            </div>

            {goldCategory === 'MELTED_GOLD' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  شماره انگ آزمایشگاه (ری‌گیری):
                </label>
                <input
                  type="text"
                  value={engravingCode}
                  onChange={(e) => setEngravingCode(e.target.value)}
                  placeholder="مثلاً انگ ۷۸۲۱ آزمایشگاه طهران"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* 4. گزینه کلیدی: معامله کاملاً بدون ریال vs ریالی */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  حالت معامله: معامله کاملاً بدون ریال (صرفاً بده‌بستان گرمی طلا)
                </span>
                <span className="text-[10px] text-slate-500">
                  در صورت فعال بودن، هیچ ریالی ثبت نشده و فقط تراز وزنی طلای طرفین تغییر می‌کند.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPureGoldTradeNoRial}
                  onChange={(e) => setIsPureGoldTradeNoRial(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {!isPureGoldTradeNoRial && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    مظنه روز هر گرم طلا ۱۸ عیار (تومان):
                  </label>
                  <PriceInput
                    value={dailyRateTomanInput}
                    onChange={(val) => setDailyRateTomanInput(String(val))}
                    className="w-full text-xs font-bold"
                    unit="تومان"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    مبلغ کل معامله (تومان):
                  </label>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl font-mono font-black text-emerald-800 text-xs">
                    {totalAmountToman.toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* شرح سند */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              شرح معامله / یادداشت زرگری:
            </label>
            <input
              type="text"
              value={descriptionFa}
              onChange={(e) => setDescriptionFa(e.target.value)}
              placeholder="مثلاً تحویل النگوهای ۱۸ عیار سایز ۲ به همکار بدون تسویه ریالی"
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs"
            />
          </div>

          {/* خلاصه نهایی تأثیر بر حساب */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between font-mono">
            <div>
              <span className="font-bold text-amber-950 font-sans block text-xs">
                تأثیر بر حساب وزنی همکار:
              </span>
              <span className="text-amber-900 font-extrabold text-sm">
                {tradeType === 'COLLEAGUE_WEIGHT_SALE' ? '+' : '-'}
                {totalWeightGrams.toFixed(3)} گرم طلا ۷۵۰
              </span>
            </div>
            <div className="text-left font-sans">
              <span className="text-[10px] text-slate-600 block">تأثیر ریالی:</span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                {isPureGoldTradeNoRial
                  ? 'بدون ریال (صرفاً گرمی)'
                  : `${totalAmountToman.toLocaleString('fa-IR')} تومان`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <span>در حال ثبت معامله...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ثبت قطعی در کاردکس طلا</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
