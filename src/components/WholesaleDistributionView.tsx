import React, { useState, useMemo } from 'react';
import {
  Truck,
  Package,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  UserCheck,
  Building2,
  Trash2,
  TrendingDown,
  Navigation,
  FileSpreadsheet,
} from 'lucide-react';
import {
  FoundationDataResponse,
  WholesaleOrderRecord,
  WholesaleDispatchRecord,
  PriceTierCode,
} from '../types/foundation';
import { Card, Button } from './ui';
import { PriceInput } from './PriceInput';

interface WholesaleDistributionViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
}

export const WholesaleDistributionView: React.FC<WholesaleDistributionViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'NEW_ORDER' | 'ORDERS_LIST' | 'DISPATCHES' | 'PRICE_TIERS'>('NEW_ORDER');

  // New Wholesale Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(
    foundationData.parties?.[0]?.id || 1
  );
  const [visitorName, setVisitorName] = useState<string>('سعید مرادی (ویزیتور منطقه ۲)');
  const [paymentTerms, setPaymentTerms] = useState<'CASH' | 'CHEQUE_30_DAYS' | 'CHEQUE_60_DAYS' | 'OPEN_CREDIT'>('CHEQUE_30_DAYS');
  const [shippingFee, setShippingFee] = useState<number>(2500000);
  const [orderDateJalali, setOrderDateJalali] = useState<string>('1405/01/25');
  
  // Lines State
  const [orderLines, setOrderLines] = useState<
    Array<{
      itemId: number;
      packCount: number;
      looseUnitsCount: number;
      priceTier: PriceTierCode;
      discountPercent: number;
    }>
  >([
    {
      itemId: foundationData.items?.[0]?.id || 1,
      packCount: 3,
      looseUnitsCount: 0,
      priceTier: 'WHOLESALE_BULK',
      discountPercent: 5,
    },
  ]);

  // Loading & Action State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dispatch Form State (for modal or direct creation)
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<WholesaleOrderRecord | null>(null);
  const [driverName, setDriverName] = useState('اکبر قنبری');
  const [driverPhone, setDriverPhone] = useState('09123456780');
  const [vehiclePlate, setVehiclePlate] = useState('۶۸ ج ۸۲۵ ایران ۲۲');
  const [vehicleType, setVehicleType] = useState('وانت نیسان دیزل آبی');
  const [destinationCity, setDestinationCity] = useState('تهران');
  const [destinationAddress, setDestinationAddress] = useState('بزرگراه فتح، کیلومتر ۴، شهرک صنعتی، انبار مرکزی');
  const [dispatchNotes, setDispatchNotes] = useState('بارگیری در سکوی شماره ۳ انبار مرکزی');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Print Dispatch Manifest
  const [printManifest, setPrintManifest] = useState<WholesaleDispatchRecord | null>(null);

  // Customer Credit Status
  const selectedCustomer = useMemo(() => {
    return foundationData.parties?.find((p) => p.id === selectedCustomerId);
  }, [foundationData.parties, selectedCustomerId]);

  const creditLimitIrr = selectedCustomer?.creditLimitIrr || 200000000;
  const currentDebtIrr = selectedCustomer?.transactionsSummary?.netBalanceIrr
    ? Math.max(0, -selectedCustomer.transactionsSummary.netBalanceIrr)
    : 45000000;

  // Calculate Lines Breakdown
  const calculatedLines = useMemo(() => {
    return orderLines.map((line) => {
      const item = foundationData.items?.find((i) => i.id === line.itemId);
      const basePrice = item?.salePriceIrr || 1000000;
      const unitsPerPack = item?.categoryId === 2 ? 1 : 12;

      let tierUnitPrice = basePrice;
      if (line.priceTier === 'CONSUMER') tierUnitPrice = Math.round(basePrice * 1.15);
      else if (line.priceTier === 'RETAIL_COLLEAGUE') tierUnitPrice = basePrice;
      else if (line.priceTier === 'WHOLESALE_BULK') tierUnitPrice = Math.round(basePrice * 0.88);
      else if (line.priceTier === 'DISTRIBUTOR_VIP') tierUnitPrice = Math.round(basePrice * 0.80);

      const packPrice = tierUnitPrice * unitsPerPack;
      const totalUnits = line.packCount * unitsPerPack + line.looseUnitsCount;
      const grossTotal = line.packCount * packPrice + line.looseUnitsCount * tierUnitPrice;
      const discountAmount = Math.round((grossTotal * (line.discountPercent || 0)) / 100);
      const netTotal = grossTotal - discountAmount;

      return {
        ...line,
        itemTitle: item?.titleFa || 'کالای نامشخص',
        unitsPerPack,
        totalUnits,
        tierUnitPrice,
        packPrice,
        grossTotal,
        discountAmount,
        netTotal,
      };
    });
  }, [orderLines, foundationData.items]);

  const totalCartons = calculatedLines.reduce((sum, l) => sum + l.packCount, 0);
  const totalLooseUnits = calculatedLines.reduce((sum, l) => sum + l.looseUnitsCount, 0);
  const subtotalIrr = calculatedLines.reduce((sum, l) => sum + l.grossTotal, 0);
  const totalDiscountIrr = calculatedLines.reduce((sum, l) => sum + l.discountAmount, 0);
  const totalPayableIrr = subtotalIrr - totalDiscountIrr + shippingFee;

  const projectedDebtIrr = currentDebtIrr + totalPayableIrr;
  const isCreditExceeded = projectedDebtIrr > creditLimitIrr;
  const creditUsagePercent = Math.min(100, Math.round((projectedDebtIrr / creditLimitIrr) * 100));

  // Add line to order
  const handleAddLine = () => {
    const defaultItem = foundationData.items?.[0]?.id || 1;
    setOrderLines([
      ...orderLines,
      {
        itemId: defaultItem,
        packCount: 1,
        looseUnitsCount: 0,
        priceTier: 'WHOLESALE_BULK',
        discountPercent: 0,
      },
    ]);
  };

  // Remove line
  const handleRemoveLine = (index: number) => {
    if (orderLines.length <= 1) return;
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  // Submit wholesale order
  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await fetch('/api/wholesale/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          visitorNameFa: visitorName,
          paymentTermsFa: paymentTerms,
          lines: orderLines,
          shippingFeeIrr: shippingFee,
          dateJalali: orderDateJalali,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.messageFa || 'خطا در ثبت سفارش عمده');
      }

      setSuccessMessage(`سفارش عمده شماره ${data.order?.orderNumber} با موفقیت ثبت شد.`);
      await onRefresh();
      setActiveSubTab('ORDERS_LIST');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'خطای ناشناخته در ثبت سفارش عمده');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create dispatch
  const handleCreateDispatch = async () => {
    if (!selectedOrderForDispatch) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/wholesale/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForDispatch.id,
          driverNameFa: driverName,
          driverPhone: driverPhone,
          vehiclePlateFa: vehiclePlate,
          vehicleTypeFa: vehicleType,
          destinationCityFa: destinationCity,
          destinationAddressFa: destinationAddress,
          shippingCostIrr: selectedOrderForDispatch.shippingFeeIrr,
          notesFa: dispatchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.messageFa || 'خطا در صدور حواله خروج انبار');
      }

      setSuccessMessage(`حواله خروج ${data.dispatch?.dispatchNumber} با موفقیت صادر شد.`);
      setSelectedOrderForDispatch(null);
      await onRefresh();
      setActiveSubTab('DISPATCHES');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'خطا در ثبت حواله');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update dispatch status
  const handleUpdateDispatchStatus = async (dispatchId: number, status: string) => {
    try {
      const res = await fetch(`/api/wholesale/dispatches/${dispatchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        await onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const wholesaleOrders = foundationData.wholesaleOrders || [];
  const wholesaleDispatches = foundationData.wholesaleDispatches || [];

  const filteredOrders = useMemo(() => {
    return wholesaleOrders.filter((o) => {
      const matchSearch =
        o.orderNumber.includes(searchTerm) ||
        o.customerNameFa.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || o.dispatchStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [wholesaleOrders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-teal-800 via-teal-700 to-emerald-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 text-teal-200 text-xs font-bold border border-teal-500/30">
              <Truck className="w-3.5 h-3.5 text-teal-300" />
              <span>ماژول تخصصی فاز ۸: پخش عمده، بازرگانی، کارتن و بنکداری</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              مدیریت پخش و فروش عمده کالا (سفارشات، کارتن، نرخ همکار و توزیع)
            </h1>
            <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed max-w-3xl">
              ثبت سفارشات تیراژ بر مبنای کارتن و جزء، نرخ چندسطحی همکار و بنکداری، پایش خودکار سقف اعتبار خریداران، صدور حواله خروج انبار و تخصیص ناوگان موزعین.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] text-teal-200 block">کل سفارشات عمده</span>
              <span className="text-lg font-black">{wholesaleOrders.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-center">
              <span className="text-[10px] text-teal-200 block">حواله‌های خروج ناوگان</span>
              <span className="text-lg font-black">{wholesaleDispatches.length}</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-teal-600/50">
          <button
            type="button"
            onClick={() => setActiveSubTab('NEW_ORDER')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'NEW_ORDER'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/30'
                : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80 border border-teal-600/40'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>ثبت سریع سفارش عمده (ماتریس کارتن/جزء)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ORDERS_LIST')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ORDERS_LIST'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/30'
                : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80 border border-teal-600/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>کارتابل سفارشات عمده ({wholesaleOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('DISPATCHES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'DISPATCHES'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/30'
                : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80 border border-teal-600/40'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>حواله‌های خروج و ناوگان توزیع ({wholesaleDispatches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('PRICE_TIERS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'PRICE_TIERS'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/30'
                : 'bg-teal-900/50 text-teal-100 hover:bg-teal-900/80 border border-teal-600/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ماتریس قیمت‌گذاری سطوح کالاها</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: NEW WHOLESALE ORDER */}
      {/* ========================================================================= */}
      {activeSubTab === 'NEW_ORDER' && (
        <div className="space-y-6">
          {/* Customer Credit Health Widget */}
          <Card className="p-5 border-teal-200 bg-linear-to-br from-teal-50/60 to-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                  <h3 className="text-sm font-black text-slate-900">
                    کنترل هوشمند سقف اعتبار خریدار عمده و بنکدار
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  سیستم به صورت خودکار مانده بدهی جاری، چک‌های در جریان و سقف اعتبار باز طرف حساب را هنگام صدور فاکتور عمده بررسی می‌کند.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">سقف اعتبار باز:</span>
                    <span className="font-black text-slate-800 text-sm">
                      {creditLimitIrr.toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">مانده بدهی فعلی:</span>
                    <span className="font-black text-amber-700 text-sm">
                      {currentDebtIrr.toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span>
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isCreditExceeded ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                    <span className="text-slate-600 block text-[11px]">بدهی کل پس از ثبت این فاکتور:</span>
                    <span className={`font-black text-sm ${isCreditExceeded ? 'text-rose-700' : 'text-emerald-800'}`}>
                      {projectedDebtIrr.toLocaleString('fa-IR')} <span className="text-[10px] font-normal">ریال</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="w-full lg:w-72 bg-white p-4 rounded-xl border border-slate-200 shrink-0 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">میزان مصرف سقف اعتبار:</span>
                  <span className={`font-extrabold ${creditUsagePercent > 90 ? 'text-rose-600' : 'text-teal-700'}`}>
                    {creditUsagePercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all rounded-full ${
                      creditUsagePercent > 100
                        ? 'bg-rose-600'
                        : creditUsagePercent > 80
                        ? 'bg-amber-500'
                        : 'bg-teal-600'
                    }`}
                    style={{ width: `${Math.min(100, creditUsagePercent)}%` }}
                  />
                </div>
                {isCreditExceeded && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>هشدار: سفارش از سقف اعتبار خریدار تجاوز کرده است.</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Order Header Fields */}
          <Card className="p-5">
            <h3 className="text-xs font-black text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>مشخصات مشتری، شرایط تسویه و ویزیتور فروش</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">خریدار عمده / بنکدار طرف‌حساب:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:bg-white"
                >
                  {foundationData.parties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} {p.companyTitle ? `(${p.companyTitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">ویزیتور / نماینده فروش:</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:bg-white"
                  placeholder="نام ویزیتور"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">شرایط پرداخت و تسویه:</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:bg-white"
                >
                  <option value="CASH">نقدی آنی (تخفیف نقدی پای بار)</option>
                  <option value="CHEQUE_30_DAYS">چک صیادی ۳۰ روزه</option>
                  <option value="CHEQUE_60_DAYS">چک صیادی ۶۰ روزه</option>
                  <option value="OPEN_CREDIT">اعتبار باز دفتری (حساب باز بنکداری)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">تاریخ ثبت فاکتور (جلالی):</label>
                <input
                  type="text"
                  value={orderDateJalali}
                  onChange={(e) => setOrderDateJalali(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium focus:bg-white text-center"
                />
              </div>
            </div>
          </Card>

          {/* Matrix Lines Entry Table */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-black text-slate-800">
                  ماتریس اقلام عمده (ورود کارتن، تک، ضریب بسته و سطح قیمت)
                </h3>
              </div>

              <Button variant="secondary" size="sm" onClick={handleAddLine} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                افزودن ردیف کالا
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">نام و شرح کالا</th>
                    <th className="py-2.5 px-3 font-bold text-center">تعداد کارتن</th>
                    <th className="py-2.5 px-3 font-bold text-center">ضریب کارتن</th>
                    <th className="py-2.5 px-3 font-bold text-center">تعداد جزء (تک)</th>
                    <th className="py-2.5 px-3 font-bold text-center">کل تعداد جزء</th>
                    <th className="py-2.5 px-3 font-bold">سطح قیمت</th>
                    <th className="py-2.5 px-3 font-bold text-left">نرخ واحد (ریال)</th>
                    <th className="py-2.5 px-3 font-bold text-center">تخفیف %</th>
                    <th className="py-2.5 px-3 font-bold text-left">مبلغ کل ردیف (ریال)</th>
                    <th className="py-2.5 px-2 text-center w-10">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {calculatedLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3">
                        <select
                          value={line.itemId}
                          onChange={(e) => {
                            const newLines = [...orderLines];
                            newLines[idx].itemId = Number(e.target.value);
                            setOrderLines(newLines);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          {foundationData.items?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.titleFa} (موجودی: {item.totalStock || 0} عدد)
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={line.packCount}
                          onChange={(e) => {
                            const newLines = [...orderLines];
                            newLines[idx].packCount = Math.max(0, parseInt(e.target.value) || 0);
                            setOrderLines(newLines);
                          }}
                          className="w-20 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs font-bold text-teal-800"
                        />
                      </td>

                      <td className="py-2 px-3 text-center text-slate-500 font-bold">
                        {line.unitsPerPack} عدد
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={line.looseUnitsCount}
                          onChange={(e) => {
                            const newLines = [...orderLines];
                            newLines[idx].looseUnitsCount = Math.max(0, parseInt(e.target.value) || 0);
                            setOrderLines(newLines);
                          }}
                          className="w-16 px-2 py-1.5 text-center bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </td>

                      <td className="py-2 px-3 text-center font-black text-slate-800">
                        {line.totalUnits.toLocaleString('fa-IR')}
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={line.priceTier}
                          onChange={(e) => {
                            const newLines = [...orderLines];
                            newLines[idx].priceTier = e.target.value as PriceTierCode;
                            setOrderLines(newLines);
                          }}
                          className="px-2.5 py-1.5 bg-teal-50 text-teal-900 border border-teal-300 rounded-lg text-xs font-bold"
                        >
                          <option value="WHOLESALE_BULK">نرخ بنکداری (عمده)</option>
                          <option value="RETAIL_COLLEAGUE">نرخ همکار (فروشگاهی)</option>
                          <option value="DISTRIBUTOR_VIP">نرخ نمایندگی (VIP)</option>
                          <option value="CONSUMER">نرخ مصرف‌کننده</option>
                        </select>
                      </td>

                      <td className="py-2 px-3 text-left font-bold text-slate-700">
                        {line.tierUnitPrice.toLocaleString('fa-IR')}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={line.discountPercent}
                          onChange={(e) => {
                            const newLines = [...orderLines];
                            newLines[idx].discountPercent = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                            setOrderLines(newLines);
                          }}
                          className="w-14 px-1.5 py-1 text-center bg-white border border-slate-300 rounded-md text-xs"
                        />
                      </td>

                      <td className="py-2 px-3 text-left font-black text-emerald-800">
                        {line.netTotal.toLocaleString('fa-IR')}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={orderLines.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Submit Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500">مجموع کارتن‌ها: </span>
                  <span className="font-black text-teal-900">{totalCartons.toLocaleString('fa-IR')} کارتن</span>
                </div>

                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500">مجموع قطعات تک: </span>
                  <span className="font-black text-slate-900">{totalLooseUnits.toLocaleString('fa-IR')} عدد</span>
                </div>

                <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500">تخفیف کل تیراژ: </span>
                  <span className="font-black text-rose-700">{totalDiscountIrr.toLocaleString('fa-IR')} ریال</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold">کرایه حمل / توزیع:</span>
                  <PriceInput
                    value={shippingFee}
                    onChange={(val) => setShippingFee(val)}
                    className="w-32 px-2 py-1 text-xs text-left font-bold"
                    unit="ریال"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="text-[11px] text-slate-500 block">مبلغ نهایی قابل پرداخت:</span>
                  <span className="text-base font-black text-emerald-800">
                    {totalPayableIrr.toLocaleString('fa-IR')} <span className="text-xs font-normal">ریال</span>
                  </span>
                </div>

                <Button
                  variant="primary"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || orderLines.length === 0}
                  leftIcon={<Truck className="w-4 h-4" />}
                >
                  {isSubmitting ? 'در حال ثبت سفارش...' : 'ثبت و صدور سفارش عمده'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: WHOLESALE ORDERS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'ORDERS_LIST' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی شماره سفارش یا خریدار..."
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">وضعیت ارسال:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="PENDING_PACKING">در انتظار بسته‌بندی</option>
                <option value="PACKED">بسته‌بندی شده / آماده ارسال</option>
                <option value="DISPATCHED">ارسال شده به موزع</option>
                <option value="DELIVERED">تحویل شده به خریدار</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">شماره سفارش</th>
                  <th className="py-2.5 px-3 font-bold">خریدار عمده</th>
                  <th className="py-2.5 px-3 font-bold">ویزیتور</th>
                  <th className="py-2.5 px-3 font-bold text-center">کارتن‌ها</th>
                  <th className="py-2.5 px-3 font-bold text-center">شرایط پرداخت</th>
                  <th className="py-2.5 px-3 font-bold text-left">مبلغ سفارش (ریال)</th>
                  <th className="py-2.5 px-3 font-bold text-center">وضعیت خروج</th>
                  <th className="py-2.5 px-3 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-black text-teal-800">{order.orderNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{order.customerNameFa}</div>
                      {order.isCreditLimitExceeded && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          ⚠ فراتر از سقف اعتبار
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{order.visitorNameFa || '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{order.totalCartons} کارتن</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {order.paymentTermsFa === 'CASH'
                          ? 'نقدی'
                          : order.paymentTermsFa === 'CHEQUE_30_DAYS'
                          ? 'چک ۳۰ روزه'
                          : order.paymentTermsFa === 'CHEQUE_60_DAYS'
                          ? 'چک ۶۰ روزه'
                          : 'اعتبار باز'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-black text-emerald-800">
                      {order.totalPayableIrr.toLocaleString('fa-IR')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.dispatchStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.dispatchStatus === 'DISPATCHED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.dispatchStatus === 'PACKED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.dispatchStatus === 'DELIVERED'
                          ? 'تحویل شد'
                          : order.dispatchStatus === 'DISPATCHED'
                          ? 'در مسیر ارسال'
                          : order.dispatchStatus === 'PACKED'
                          ? 'آماده بارگیری'
                          : 'در انتظار بسته‌بندی'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrderForDispatch(order)}
                        leftIcon={<Truck className="w-3 h-3" />}
                      >
                        صدور حواله خروج
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: DISPATCHES & FLEET MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'DISPATCHES' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-700" />
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  حواله‌های خروج انبار، بارگیری و ناوگان موزعین
                </h3>
                <p className="text-xs text-slate-500">
                  پیگیری وضعیت خودرو، راننده، زمان ارسال و تغییر وضعیت تحویل به خریدار
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">شماره حواله</th>
                  <th className="py-2.5 px-3 font-bold">شماره سفارش</th>
                  <th className="py-2.5 px-3 font-bold">مشتری و مقصد</th>
                  <th className="py-2.5 px-3 font-bold">موزع / راننده</th>
                  <th className="py-2.5 px-3 font-bold">خودرو و پلاک</th>
                  <th className="py-2.5 px-3 font-bold text-center">تعداد کارتن</th>
                  <th className="py-2.5 px-3 font-bold text-center">وضعیت حواله</th>
                  <th className="py-2.5 px-3 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {wholesaleDispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-black text-teal-800">{dispatch.dispatchNumber}</td>
                    <td className="py-2.5 px-3 text-slate-700">{dispatch.orderNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{dispatch.customerNameFa}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{dispatch.destinationAddressFa}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold">{dispatch.driverNameFa}</div>
                      <div className="text-[10px] text-slate-500">{dispatch.driverPhone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800">{dispatch.vehicleTypeFa}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{dispatch.vehiclePlateFa}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {dispatch.totalCartons} کارتن ({dispatch.grossWeightKg} کیلو)
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={dispatch.status}
                        onChange={(e) => handleUpdateDispatchStatus(dispatch.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                          dispatch.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : dispatch.status === 'ON_THE_WAY'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : dispatch.status === 'LOADED'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="PREPARING">آماده‌سازی بارگیری</option>
                        <option value="LOADED">بارگیری شد روی خودرو</option>
                        <option value="ON_THE_WAY">در مسیر توزیع</option>
                        <option value="DELIVERED">تحویل و امضا شد</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrintManifest(dispatch)}
                        leftIcon={<Printer className="w-3 h-3" />}
                      >
                        چاپ حواله
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: MULTI-TIER PRICE LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'PRICE_TIERS' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                ماتریس قیمت‌گذاری سطوح کالاها و ضرایب کارتن
              </h3>
              <p className="text-xs text-slate-500">
                مشاهده و مقایسه بهای هر کالا بر اساس رده‌های مشتریان: مصرف‌کننده، خرده‌فروش (همکار)، بنکداری و نمایندگی VIP
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold">کد و عنوان کالا</th>
                  <th className="py-2.5 px-3 font-bold text-center">واحد جزء</th>
                  <th className="py-2.5 px-3 font-bold text-center">ضریب کارتن</th>
                  <th className="py-2.5 px-3 font-bold text-left">نرخ مصرف‌کننده</th>
                  <th className="py-2.5 px-3 font-bold text-left">نرخ همکار (فروشگاهی)</th>
                  <th className="py-2.5 px-3 font-bold text-left bg-teal-50 text-teal-900">نرخ بنکداری (عمده)</th>
                  <th className="py-2.5 px-3 font-bold text-left">نرخ نمایندگی VIP</th>
                  <th className="py-2.5 px-3 font-bold text-left bg-emerald-50 text-emerald-900">قیمت هر کارتن عمده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {foundationData.items?.map((item) => {
                  const base = item.salePriceIrr || 1000000;
                  const packRatio = item.categoryId === 2 ? 1 : 12;
                  const consumer = Math.round(base * 1.15);
                  const retail = base;
                  const wholesale = Math.round(base * 0.88);
                  const vip = Math.round(base * 0.80);
                  const packTotal = wholesale * packRatio;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{item.titleFa}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.itemCode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">{item.unitNameFa || 'عدد'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-800">{packRatio} در کارتن</td>
                      <td className="py-2.5 px-3 text-left">{consumer.toLocaleString('fa-IR')}</td>
                      <td className="py-2.5 px-3 text-left">{retail.toLocaleString('fa-IR')}</td>
                      <td className="py-2.5 px-3 text-left font-black text-teal-900 bg-teal-50/50">
                        {wholesale.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-2.5 px-3 text-left text-slate-700">{vip.toLocaleString('fa-IR')}</td>
                      <td className="py-2.5 px-3 text-left font-black text-emerald-800 bg-emerald-50/50">
                        {packTotal.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE DISPATCH FROM ORDER */}
      {/* ========================================================================= */}
      {selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 bg-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-black text-slate-900">
                  صدور حواله خروج و بارگیری برای سفارش {selectedOrderForDispatch.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDispatch(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-teal-900 font-bold">خریدار:</span>
                <span className="font-black text-teal-950">{selectedOrderForDispatch.customerNameFa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-900 font-bold">تعداد کارتن:</span>
                <span className="font-black text-teal-950">{selectedOrderForDispatch.totalCartons} کارتن</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-900 font-bold">مبلغ سفارش:</span>
                <span className="font-black text-emerald-800">
                  {selectedOrderForDispatch.totalPayableIrr.toLocaleString('fa-IR')} ریال
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نام راننده / موزع:</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره همراه راننده:</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نوع خودرو باربری:</label>
                  <input
                    type="text"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">شماره پلاک خودرو:</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">شهر و آدرس انبار مقصد:</label>
                <textarea
                  rows={2}
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">توضیحات و دستور بارگیری:</label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrderForDispatch(null)}>
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateDispatch}
                disabled={isSubmitting}
                leftIcon={<Truck className="w-4 h-4" />}
              >
                تأیید و صدور حواله خروج
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE DISPATCH MANIFEST */}
      {/* ========================================================================= */}
      {printManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <Card className="w-full max-w-xl p-8 bg-white space-y-6 shadow-2xl border-2 border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">حواله رسمی خروج کالا و برگه بارگیری ناوگان</h2>
                <p className="text-xs text-slate-500">واحد لجستیک و توزیع بنکداری</p>
              </div>
              <div className="text-left font-mono text-xs">
                <div>شماره حواله: <span className="font-black text-teal-800">{printManifest.dispatchNumber}</span></div>
                <div>تاریخ صدور: <span>{printManifest.dateJalali}</span></div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-4 rounded-lg bg-slate-50">
              <div><span className="text-slate-500">سفارش عطف: </span><span className="font-bold">{printManifest.orderNumber}</span></div>
              <div><span className="text-slate-500">تحویل گیرنده: </span><span className="font-bold">{printManifest.customerNameFa}</span></div>
              <div><span className="text-slate-500">راننده / موزع: </span><span className="font-bold">{printManifest.driverNameFa}</span></div>
              <div><span className="text-slate-500">شماره پلاک: </span><span className="font-bold font-mono">{printManifest.vehiclePlateFa}</span></div>
              <div className="col-span-2"><span className="text-slate-500">مقصد: </span><span className="font-bold">{printManifest.destinationAddressFa}</span></div>
              <div className="col-span-2"><span className="text-slate-500">تعداد محموله: </span><span className="font-black text-teal-900">{printManifest.totalCartons} کارتن ({printManifest.grossWeightKg} کیلوگرم)</span></div>
            </div>

            {/* Signature blocks */}
            <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-600">امضای انباردار و مسئول خروج</div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-600">امضای راننده و تحویل‌گیرنده بار</div>
              <div className="border-t border-slate-400 pt-2 font-bold text-slate-600">امضای خریدار / دریافت‌کننده در مقصد</div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setPrintManifest(null)}>
                بستن
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                چاپ برگه بارگیری
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
