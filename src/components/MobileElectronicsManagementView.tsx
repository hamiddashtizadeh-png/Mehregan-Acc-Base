import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Laptop,
  Wrench,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Cpu,
  BatteryCharging,
  QrCode,
  Tag,
  UserCheck,
  DollarSign,
  CreditCard,
  Building2,
  FileText,
  Filter,
  Check,
  Trash2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  FoundationDataResponse,
  MobileDeviceRecord,
  MobileRepairTicketRecord,
  MobileRepairStatus,
  MobileRegistryStatus,
  MobileWarrantyStatus,
  MobileDeviceCondition,
} from '../types/foundation';
import { printHtmlContent } from '../utils/printUtils';
import { Card, Button } from './ui';
import { PriceInput } from './PriceInput';

interface MobileElectronicsManagementViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
}

export const MobileElectronicsManagementView: React.FC<MobileElectronicsManagementViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [devices, setDevices] = useState<MobileDeviceRecord[]>(
    foundationData.mobileDevices || []
  );
  const [repairTickets, setRepairTickets] = useState<MobileRepairTicketRecord[]>(
    foundationData.mobileRepairTickets || []
  );

  const [activeSection, setActiveSection] = useState<'REPAIR_WORKBENCH' | 'DEVICE_INVENTORY' | 'IMEI_LOOKUP'>('REPAIR_WORKBENCH');

  // Search & Filters
  const [deviceSearch, setDeviceSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [ticketSearch, setTicketSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // IMEI Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [isSearchingLookup, setIsSearchingLookup] = useState(false);

  // New Device Form Modal
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    modelFa: '',
    brandFa: 'سامسونگ (Samsung)',
    imei1: '',
    imei2: '',
    serialNumber: '',
    storageGb: 256,
    ramGb: 8,
    colorFa: 'مشکی',
    condition: 'NEW' as MobileDeviceCondition,
    registryStatus: 'COMMERCIAL_CUSTOMS' as MobileRegistryStatus,
    warrantyStatus: 'UNDER_WARRANTY' as MobileWarrantyStatus,
    warrantyCompanyFa: 'داریا همراه (۱۸ ماهه)',
    purchasePriceIrr: 300000000,
    salePriceIrr: 330000000,
    batteryHealthPercent: 100,
  });

  // New Repair Ticket Form Modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customerNameFa: '',
    customerPhone: '',
    deviceModelFa: '',
    colorFa: 'مشکی',
    imeiOrSerial: '',
    securityPasscodeOrPattern: '',
    accompaniedAccessoriesFa: 'قاب، بدون شارژر',
    reportedFaultsFa: '',
    physicalConditionNotesFa: 'بدون شکستگی ظاهری',
    estimatedCostIrr: 15000000,
    depositPaidIrr: 3000000,
  });

  // Add Part Modal
  const [selectedTicketForPart, setSelectedTicketForPart] = useState<MobileRepairTicketRecord | null>(null);
  const [newPart, setNewPart] = useState({
    partNameFa: '',
    partCostIrr: 5000000,
    quantity: 1,
  });

  // Feedback Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMobileData = async () => {
    try {
      const [dRes, tRes] = await Promise.all([
        fetch('/api/mobile/devices'),
        fetch('/api/mobile/repair-tickets'),
      ]);
      const dJson = await dRes.json();
      const tJson = await tRes.json();
      if (dJson.ok) setDevices(dJson.devices);
      if (tJson.ok) setRepairTickets(tJson.tickets);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchMobileData();
  }, []);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    let list = devices;
    if (brandFilter !== 'ALL') {
      list = list.filter((d) => d.brandFa.includes(brandFilter));
    }
    if (deviceSearch.trim()) {
      const q = deviceSearch.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.modelFa.toLowerCase().includes(q) ||
          d.imei1.includes(q) ||
          (d.imei2 && d.imei2.includes(q)) ||
          (d.serialNumber && d.serialNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [devices, brandFilter, deviceSearch]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let list = repairTickets;
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (ticketSearch.trim()) {
      const q = ticketSearch.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.customerNameFa.toLowerCase().includes(q) ||
          t.customerPhone.includes(q) ||
          t.deviceModelFa.toLowerCase().includes(q) ||
          t.imeiOrSerial.includes(q)
      );
    }
    return list;
  }, [repairTickets, statusFilter, ticketSearch]);

  // Handle Add Device Submit
  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.modelFa.trim() || !newDevice.imei1.trim()) {
      setFeedback({ type: 'error', message: 'مدل دستگاه و شناسه IMEI 1 الزامی است.' });
      return;
    }

    try {
      const res = await fetch('/api/mobile/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDevice,
          itemId: 101,
          stockStatus: 'IN_STOCK',
          warehouseId: 1,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.messageFa || 'خطا در ثبت دستگاه.');

      setFeedback({ type: 'success', message: json.messageFa });
      setIsAddDeviceOpen(false);
      setNewDevice({
        modelFa: '',
        brandFa: 'سامسونگ (Samsung)',
        imei1: '',
        imei2: '',
        serialNumber: '',
        storageGb: 256,
        ramGb: 8,
        colorFa: 'مشکی',
        condition: 'NEW',
        registryStatus: 'COMMERCIAL_CUSTOMS',
        warrantyStatus: 'UNDER_WARRANTY',
        warrantyCompanyFa: 'داریا همراه (۱۸ ماهه)',
        purchasePriceIrr: 300000000,
        salePriceIrr: 330000000,
        batteryHealthPercent: 100,
      });
      await fetchMobileData();
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطای ارتباط با سرور' });
    }
  };

  // Handle Add Ticket Submit
  const handleAddTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.customerNameFa.trim() || !newTicket.deviceModelFa.trim() || !newTicket.imeiOrSerial.trim()) {
      setFeedback({ type: 'error', message: 'نام مشتری، مدل دستگاه و شناسه IMEI الزامی است.' });
      return;
    }

    try {
      const res = await fetch('/api/mobile/repair-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 1,
          ...newTicket,
          receptionDateJalali: '1405/01/25',
          estimatedDeliveryDateJalali: '1405/01/27',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.messageFa || 'خطا در صدور قبض تعمیرات.');

      setFeedback({ type: 'success', message: json.messageFa });
      setIsNewTicketOpen(false);
      setNewTicket({
        customerNameFa: '',
        customerPhone: '',
        deviceModelFa: '',
        colorFa: 'مشکی',
        imeiOrSerial: '',
        securityPasscodeOrPattern: '',
        accompaniedAccessoriesFa: 'قاب، بدون شارژر',
        reportedFaultsFa: '',
        physicalConditionNotesFa: 'بدون شکستگی ظاهری',
        estimatedCostIrr: 15000000,
        depositPaidIrr: 3000000,
      });

      await fetchMobileData();
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطای ارتباط با سرور' });
    }
  };

  // Handle Status Update
  const handleUpdateTicketStatus = async (ticketId: number, status: MobileRepairStatus) => {
    try {
      const res = await fetch(`/api/mobile/repair-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.messageFa);

      setFeedback({ type: 'success', message: json.messageFa });
      await fetchMobileData();
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطا در ویرایش وضعیت' });
    }
  };

  // Handle Add Part
  const handleAddPartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForPart || !newPart.partNameFa.trim()) return;

    try {
      const res = await fetch(`/api/mobile/repair-tickets/${selectedTicketForPart.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPart),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.messageFa);

      setFeedback({ type: 'success', message: json.messageFa });
      setSelectedTicketForPart(null);
      setNewPart({ partNameFa: '', partCostIrr: 5000000, quantity: 1 });
      await fetchMobileData();
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطا در افزودن قطعه' });
    }
  };

  // Handle Checkout / Deliver Ticket
  const handleCheckoutTicket = async (ticketId: number, paymentMethod: 'POS' | 'CASH' | 'OPEN_CREDIT') => {
    try {
      const res = await fetch(`/api/mobile/repair-tickets/${ticketId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.messageFa);

      setFeedback({ type: 'success', message: json.messageFa });
      await fetchMobileData();
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'خطا در تسویه تحویل' });
    }
  };

  // Print Reception Slip
  const handlePrintSlip = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/mobile/repair-slip/${ticketId}`);
      const json = await res.json();
      if (!json.ok) return;

      const s = json.slip;
      const html = `
        <div style="font-family: Shabnam, Tahoma, sans-serif; direction: rtl; width: 340px; margin: 0 auto; padding: 12px; color: #0f172a;">
          <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0369a1;">مرکز تخصصی سرویس و تعمیرات مهرگان</h2>
            <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">قبض پذیرش و امانت‌داری دستگاه تلفن همراه / رایانه</p>
            <div style="margin-top: 6px; font-size: 12px; font-weight: bold; color: #0f172a; display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
              <span>شماره قبض: <strong>${s.ticketNumber}</strong></span>
              <span>تاریخ: <strong>${s.receptionDateJalali}</strong></span>
            </div>
          </div>

          <div style="font-size: 11px; space-y: 4px; line-height: 1.6; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 8px;">
            <div>مشتری گرامی: <strong>${s.customerNameFa}</strong> (${s.customerPhone})</div>
            <div>مدل دستگاه: <strong>${s.deviceModelFa}</strong></div>
            <div>کد IMEI / سریال: <strong style="font-family: monospace;">${s.imeiOrSerial}</strong></div>
            <div>لوازم همراه: ${s.accompaniedAccessoriesFa}</div>
            <div>عیب اعلامی: <strong style="color: #b91c1c;">${s.reportedFaultsFa}</strong></div>
            <div>وضعیت ظاهری: ${s.physicalConditionNotesFa}</div>
          </div>

          <div style="font-size: 11px; display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; background: #f0f9ff; padding: 6px; rounded-md;">
            <span>برآورد هزینه: ${s.estimatedCostIrr.toLocaleString('fa-IR')} ریال</span>
            <span>بیعانه: ${s.depositPaidIrr.toLocaleString('fa-IR')} ریال</span>
          </div>

          <div style="font-size: 9px; color: #475569; text-align: justify; leading-normal; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            * تحویل دستگاه صرفاً با ارائه این قبض امکان‌پذیر است. مرکز در قبال اطلاعات شخصی مسئول نیست.<br/>
            تکنسین مربوطه: ${s.technicianNameFa}
          </div>
        </div>
      `;

      await printHtmlContent({ title: `رسید پذیرش ${s.ticketNumber}`, bodyHtml: html, isThermal: true });
    } catch {
      // ignore
    }
  };

  // Search IMEI Lookup
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsSearchingLookup(true);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/mobile/lookup/${encodeURIComponent(lookupQuery.trim())}`);
      const json = await res.json();
      if (json.ok) {
        setLookupResult(json);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingLookup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card - Cyan / Blue Theme */}
      <div className="bg-gradient-to-r from-sky-800 via-cyan-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-cyan-500/30">
        <div className="absolute -top-16 -left-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-200 text-xs font-bold border border-cyan-400/30 backdrop-blur-md">
              <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
              <span>پروفایل تخصصی صنف موبایل، رایانه، تبلت و خدمات تعمیرات</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>سامانه فروشگاه موبایل، گارانتی و پذیرش تعمیرات</span>
              <span className="text-xs font-normal px-2.5 py-1 rounded-lg bg-white/15 text-cyan-100">فاز ۹</span>
            </h1>
            <p className="text-xs md:text-sm text-cyan-100/90 leading-relaxed max-w-3xl">
              رهگیری دوگانه IMEI 1 و IMEI 2، ثبت اصالت سامانه همتا، کارتابل پذیرش و تعمیرات قطعات، و صدور فاکتور رسمی تسویه.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-cyan-200 block font-medium">موجودی دستگاه‌ها</span>
              <span className="text-xl font-black text-cyan-100">{devices.length} عدد</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-cyan-200 block font-medium">پذیرش‌های جاری تعمیر</span>
              <span className="text-xl font-black text-cyan-100">
                {repairTickets.filter((t) => t.status !== 'DELIVERED').length} قبض
              </span>
            </div>
          </div>
        </div>

        {/* Sub Nav Tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-cyan-500/30">
          <button
            type="button"
            onClick={() => setActiveSection('REPAIR_WORKBENCH')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'REPAIR_WORKBENCH'
                ? 'bg-white text-cyan-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-cyan-950/60 text-cyan-100 hover:bg-cyan-900/80 border border-cyan-500/30'
            }`}
          >
            <Wrench className="w-4 h-4 text-cyan-600" />
            <span>کارتابل پذیرش و تعمیرات ({repairTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('DEVICE_INVENTORY')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'DEVICE_INVENTORY'
                ? 'bg-white text-cyan-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-cyan-950/60 text-cyan-100 hover:bg-cyan-900/80 border border-cyan-500/30'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-600" />
            <span>انبار دستگاه‌های نو/کارکرده و IMEI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('IMEI_LOOKUP')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'IMEI_LOOKUP'
                ? 'bg-white text-cyan-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-cyan-950/60 text-cyan-100 hover:bg-cyan-900/80 border border-cyan-500/30'
            }`}
          >
            <Search className="w-4 h-4 text-cyan-600" />
            <span>استعلام IMEI، همتا و تاریخچه سرویس</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75 cursor-pointer font-black text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: REPAIR WORKBENCH (کارتابل پذیرش و کارگاه تعمیرات) */}
      {/* ========================================================================= */}
      {activeSection === 'REPAIR_WORKBENCH' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-700" />
                <h3 className="text-base font-black text-slate-900">
                  مدیریت پذیرش، کارگاه و تعمیرات تخصصی موبایل و لپ‌تاپ
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ثبت رمز الگوی ورود، عیوب ظاهری، بیعانه، افزودن قطعات تعویضی و صدور صورت‌حساب قطعی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={() => setIsNewTicketOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-cyan-700 hover:bg-cyan-800 text-white font-black"
              >
                پذیرش جدید دستگاه
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="جستجوی شماره قبض، نام مشتری، مدل دستگاه یا کد IMEI..."
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold shrink-0">وضعیت:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
              >
                <option value="ALL">همه پذیرش‌ها</option>
                <option value="RECEIVED">پذیرش اولیه</option>
                <option value="DIAGNOSING">در حال عیب‌یابی</option>
                <option value="WAITING_PARTS">در انتظار قطعه</option>
                <option value="IN_REPAIR">در حال تعمیر</option>
                <option value="REPAIRED">تعمیر شده (آماده تحویل)</option>
                <option value="DELIVERED">تحویل و تسویه شده</option>
              </select>
            </div>
          </div>

          {/* Tickets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => {
              const isDelivered = ticket.status === 'DELIVERED';
              const isRepaired = ticket.status === 'REPAIRED';

              return (
                <div
                  key={ticket.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                    isRepaired
                      ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-200'
                      : isDelivered
                      ? 'bg-slate-50/80 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-md'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-cyan-900 bg-cyan-100 px-2.5 py-1 rounded-xl">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{ticket.deviceModelFa}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        isDelivered
                          ? 'bg-slate-200 text-slate-800'
                          : isRepaired
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {ticket.status === 'RECEIVED'
                        ? 'پذیرش شده'
                        : ticket.status === 'DIAGNOSING'
                        ? 'عیب‌یابی'
                        : ticket.status === 'IN_REPAIR'
                        ? 'در حال تعمیر'
                        : ticket.status === 'WAITING_PARTS'
                        ? 'انتظار قطعه'
                        : ticket.status === 'REPAIRED'
                        ? 'آماده تحویل'
                        : 'تحویل مشتری'}
                    </span>
                  </div>

                  {/* Customer & Device Specs */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>مشتری: <strong className="text-slate-900">{ticket.customerNameFa}</strong> ({ticket.customerPhone})</span>
                      <span className="font-mono text-[11px]">{ticket.receptionDateJalali}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                      <div>
                        <strong>کد IMEI / سریال:</strong>{' '}
                        <span className="font-mono text-cyan-800 font-bold">{ticket.imeiOrSerial}</span>
                      </div>
                      {ticket.securityPasscodeOrPattern && (
                        <div>
                          <strong>رمز / الگو:</strong>{' '}
                          <span className="font-mono text-slate-800 font-bold bg-amber-100 px-1 rounded">
                            {ticket.securityPasscodeOrPattern}
                          </span>
                        </div>
                      )}
                      <div>
                        <strong>ایراد اعلامی:</strong>{' '}
                        <span className="text-rose-700 font-bold">{ticket.reportedFaultsFa}</span>
                      </div>
                    </div>

                    {/* Parts list */}
                    {ticket.parts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-700">قطعات تعویضی:</span>
                        <div className="space-y-1">
                          {ticket.parts.map((p) => (
                            <div
                              key={p.id}
                              className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200 text-[11px]"
                            >
                              <span>{p.partNameFa} (×{p.quantity})</span>
                              <span className="font-bold text-slate-900">{p.totalCostIrr.toLocaleString('fa-IR')} ریال</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">جمع کل فاکتور تعمیر:</span>
                        <span className="font-black text-cyan-950">{ticket.finalTotalIrr.toLocaleString('fa-IR')} ریال</span>
                      </div>
                      <div className="text-left">
                        <span className="text-slate-500 block text-[10px]">بیعانه / باقیمانده:</span>
                        <span className="font-bold text-emerald-800">
                          {ticket.depositPaidIrr.toLocaleString('fa-IR')} /{' '}
                          <strong className="text-rose-800">{ticket.remainingPayableIrr.toLocaleString('fa-IR')} ریال</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintSlip(ticket.id)}
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                      >
                        رسید
                      </Button>

                      {!isDelivered && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTicketForPart(ticket)}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          قطعه
                        </Button>
                      )}
                    </div>

                    {!isDelivered && (
                      <div className="flex items-center gap-1.5">
                        {ticket.status !== 'REPAIRED' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateTicketStatus(ticket.id, 'REPAIRED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            تأیید تعمیر
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCheckoutTicket(ticket.id, 'POS')}
                            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black"
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                          >
                            تسویه و تحویل
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DEVICE INVENTORY (انبار دستگاه‌ها و IMEI) */}
      {/* ========================================================================= */}
      {activeSection === 'DEVICE_INVENTORY' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-700" />
                <h3 className="text-base font-black text-slate-900">
                  انبار و موجودی دستگاه‌های نو، کارکرده و استوک
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                رهگیری شناسه IMEI 1، IMEI 2، گارانتی شرکتی، درصد سلامت باتری و وضعیت رجیستری همتا
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAddDeviceOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-cyan-700 hover:bg-cyan-800 text-white font-black"
            >
              ثبت دستگاه جدید در انبار
            </Button>
          </div>

          {/* Device Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="جستجوی مدل دستگاه، کد IMEI یا شماره سریال..."
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-bold shrink-0">برند:</span>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
              >
                <option value="ALL">همه برندها</option>
                <option value="سامسونگ">سامسونگ (Samsung)</option>
                <option value="اپل">اپل (Apple)</option>
                <option value="شیائومی">شیائومی (Xiaomi)</option>
                <option value="ایسوس">ایسوس (ASUS)</option>
              </select>
            </div>
          </div>

          {/* Device Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-black">
                  <th className="py-3 px-3">مدل دستگاه / برند</th>
                  <th className="py-3 px-3">شناسه IMEI 1 / IMEI 2</th>
                  <th className="py-3 px-3">مشخصات فنی</th>
                  <th className="py-3 px-3">وضعیت ظاهری و سلامت</th>
                  <th className="py-3 px-3">شرکت گارانتی‌کننده</th>
                  <th className="py-3 px-3 text-left">قیمت فروش (ریال)</th>
                  <th className="py-3 px-3 text-center">وضعیت انبار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-black text-slate-900">{d.modelFa}</div>
                      <div className="text-[10px] text-slate-500">{d.brandFa} - {d.colorFa}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-900">
                      <div>IMEI1: {d.imei1}</div>
                      {d.imei2 && <div className="text-[10px] text-slate-500">IMEI2: {d.imei2}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span>{d.storageGb}GB</span> {d.ramGb ? ` / ${d.ramGb}GB RAM` : ''}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {d.condition === 'NEW' ? 'آکبند / نو' : 'کارکرده در حد نو'}
                        </span>
                        {d.batteryHealthPercent && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            🔋 {d.batteryHealthPercent}٪
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{d.warrantyCompanyFa || 'بدون گارانتی'}</div>
                      <div className="text-[10px] text-slate-400">انقضا: {d.warrantyExpiresJalali || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-left font-black text-emerald-800">
                      {d.salePriceIrr.toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">ریال</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        موجود در انبار
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: IMEI & REGISTRY LOOKUP (استعلام آنلاین IMEI) */}
      {/* ========================================================================= */}
      {activeSection === 'IMEI_LOOKUP' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md max-w-2xl mx-auto">
          <div className="text-center space-y-2 pb-4 border-b border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center mx-auto text-xl shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              استعلام اصالت IMEI، گارانتی و سابقه تعمیرات
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              شناسه ۱۵ رقمی IMEI یا شماره سریال دستگاه را وارد کنید تا تمام سوابق خرید، گارانتی و پذیرش‌های تعمیرات جستجو شود.
            </p>
          </div>

          <form onSubmit={handleLookupSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="مثلاً: 354892110294819"
                className="w-full pr-4 pl-24 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-center font-mono font-bold text-sm tracking-wider focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isSearchingLookup || !lookupQuery.trim()}
                className="absolute left-1.5 top-1.5 bottom-1.5 bg-cyan-700 hover:bg-cyan-800 text-white font-black px-4 rounded-xl text-xs"
              >
                {isSearchingLookup ? 'جستجو...' : 'استعلام'}
              </Button>
            </div>
          </form>

          {/* Lookup Result Box */}
          {lookupResult && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in text-xs">
              {lookupResult.device ? (
                <div className="p-4 bg-cyan-50/80 rounded-2xl border border-cyan-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-cyan-950 text-sm">{lookupResult.device.modelFa}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-200 text-cyan-900 font-bold text-[10px]">
                      موجود در انبار
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
                    <div>برند: {lookupResult.device.brandFa}</div>
                    <div>رنگ: {lookupResult.device.colorFa}</div>
                    <div>گارانتی: {lookupResult.device.warrantyCompanyFa}</div>
                    <div>رجیستری: همتا تجاری (تأیید شده)</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-500 text-center">
                  دستگاه هم‌نام در انبار دستگاه‌ها یافت نشد.
                </div>
              )}

              {/* Repair History */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">سابقه پذیرش‌های تعمیرات ({lookupResult.repairTickets.length}):</h4>
                {lookupResult.repairTickets.length === 0 ? (
                  <p className="text-slate-400 text-[11px] text-center py-2">هیچ سابقه تعمیری برای این سریال ثبت نشده است.</p>
                ) : (
                  lookupResult.repairTickets.map((t: any) => (
                    <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>قبض {t.ticketNumber} - {t.customerNameFa}</span>
                        <span className="text-cyan-800">{t.receptionDateJalali}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">ایراد: {t.reportedFaultsFa}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Add Device Form */}
      {isAddDeviceOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">ثبت دستگاه جدید در انبار</h3>
              <button
                type="button"
                onClick={() => setIsAddDeviceOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDeviceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">مدل دستگاه:</label>
                <input
                  type="text"
                  value={newDevice.modelFa}
                  onChange={(e) => setNewDevice({ ...newDevice, modelFa: e.target.value })}
                  placeholder="سامسونگ Galaxy S24 Ultra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شناسه IMEI 1 (اصلی):</label>
                  <input
                    type="text"
                    value={newDevice.imei1}
                    onChange={(e) => setNewDevice({ ...newDevice, imei1: e.target.value })}
                    placeholder="3548..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شناسه IMEI 2 (اختیاری):</label>
                  <input
                    type="text"
                    value={newDevice.imei2}
                    onChange={(e) => setNewDevice({ ...newDevice, imei2: e.target.value })}
                    placeholder="3548..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حافظه / رم:</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={newDevice.storageGb}
                      onChange={(e) => setNewDevice({ ...newDevice, storageGb: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-bold"
                    />
                    <span className="self-center shrink-0">GB</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قیمت فروش (ریال):</label>
                  <PriceInput
                    value={newDevice.salePriceIrr}
                    onChange={(val) => setNewDevice({ ...newDevice, salePriceIrr: val })}
                    className="w-full font-bold"
                    unit="ریال"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setIsAddDeviceOpen(false)}>
                  انصراف
                </Button>
                <Button variant="primary" type="submit" className="bg-cyan-700 hover:bg-cyan-800 text-white font-black">
                  ثبت دستگاه
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Repair Ticket Form */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">صدور قبض جدید پذیرش تعمیرات</h3>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTicketSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نام مشتری:</label>
                  <input
                    type="text"
                    value={newTicket.customerNameFa}
                    onChange={(e) => setNewTicket({ ...newTicket, customerNameFa: e.target.value })}
                    placeholder="آقای رضایی"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شماره تماس:</label>
                  <input
                    type="text"
                    value={newTicket.customerPhone}
                    onChange={(e) => setNewTicket({ ...newTicket, customerPhone: e.target.value })}
                    placeholder="0912..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مدل دستگاه پذیرشی:</label>
                <input
                  type="text"
                  value={newTicket.deviceModelFa}
                  onChange={(e) => setNewTicket({ ...newTicket, deviceModelFa: e.target.value })}
                  placeholder="آیفون ۱۳ نرمال یا لپ‌تاپ ایسوس"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">کد IMEI / سریال:</label>
                  <input
                    type="text"
                    value={newTicket.imeiOrSerial}
                    onChange={(e) => setNewTicket({ ...newTicket, imeiOrSerial: e.target.value })}
                    placeholder="3568..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز ورود / پترن جهت تست:</label>
                  <input
                    type="text"
                    value={newTicket.securityPasscodeOrPattern}
                    onChange={(e) => setNewTicket({ ...newTicket, securityPasscodeOrPattern: e.target.value })}
                    placeholder="پین: ۱۲۳۴"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرح ایراد اعلامی مشتری:</label>
                <input
                  type="text"
                  value={newTicket.reportedFaultsFa}
                  onChange={(e) => setNewTicket({ ...newTicket, reportedFaultsFa: e.target.value })}
                  placeholder="شکستگی ال‌سی‌دی، خاموشی بر اثر ضربه"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">برآورد اولیه (ریال):</label>
                  <PriceInput
                    value={newTicket.estimatedCostIrr}
                    onChange={(val) => setNewTicket({ ...newTicket, estimatedCostIrr: val })}
                    className="w-full font-bold"
                    unit="ریال"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">بیعانه دریافتی (ریال):</label>
                  <PriceInput
                    value={newTicket.depositPaidIrr}
                    onChange={(val) => setNewTicket({ ...newTicket, depositPaidIrr: val })}
                    className="w-full font-bold"
                    unit="ریال"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setIsNewTicketOpen(false)}>
                  انصراف
                </Button>
                <Button variant="primary" type="submit" className="bg-cyan-700 hover:bg-cyan-800 text-white font-black">
                  صدور قبض پذیرش
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Part Form */}
      {selectedTicketForPart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900">
                افزودن قطعه تعویضی به قبض {selectedTicketForPart.ticketNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTicketForPart(null)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPartSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان قطعه تعویضی:</label>
                <input
                  type="text"
                  value={newPart.partNameFa}
                  onChange={(e) => setNewPart({ ...newPart, partNameFa: e.target.value })}
                  placeholder="تاچ و ال‌سی‌دی اولد اورجینال"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قیمت قطعه (ریال):</label>
                  <PriceInput
                    value={newPart.partCostIrr}
                    onChange={(val) => setNewPart({ ...newPart, partCostIrr: val })}
                    className="w-full font-bold"
                    unit="ریال"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تعداد:</label>
                  <input
                    type="number"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-center font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setSelectedTicketForPart(null)}>
                  انصراف
                </Button>
                <Button variant="primary" type="submit" className="bg-cyan-700 hover:bg-cyan-800 text-white font-black">
                  افزودن به فاکتور
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
