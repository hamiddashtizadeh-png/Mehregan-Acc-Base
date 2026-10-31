import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Wrench,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Calendar,
  Building2,
  User,
  CreditCard,
  Edit2
} from 'lucide-react';
import { FoundationDataResponse, PartyRecord } from '../types/foundation';
import {
  processAgentCommandOnline,
  AgentMessage,
  format3Digit,
  parsePersianDigits,
  extractAmountWithCurrency
} from '../utils/agentEngine';
import { apiFetch } from '../utils/apiClient';

interface NaturalLanguageActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  foundationData: FoundationDataResponse | null;
  onOperationSuccess: () => void;
  onNavigateTab?: (tab: string) => void;
  initialPrompt?: string;
}

export const NaturalLanguageActionModal: React.FC<NaturalLanguageActionModalProps> = ({
  isOpen,
  onClose,
  foundationData,
  onOperationSuccess,
  onNavigateTab,
  initialPrompt = '',
}) => {
  const [inputText, setInputText] = useState(initialPrompt);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentMessage | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    status: 'SUCCESS' | 'ERROR';
    messageFa: string;
    details?: string;
  } | null>(null);

  // Editable confirmation form state
  const [editablePartyId, setEditablePartyId] = useState<number | undefined>(undefined);
  const [editablePartyName, setEditablePartyName] = useState('');
  const [editableAmountToman, setEditableAmountToman] = useState<number>(0);
  const [editableDescription, setEditableDescription] = useState('');
  const [editableDateJalali, setEditableDateJalali] = useState('');
  const [editableNewStatus, setEditableNewStatus] = useState('IN_PROGRESS');

  useEffect(() => {
    if (isOpen) {
      setSubmissionFeedback(null);
      if (initialPrompt) {
        setInputText(initialPrompt);
        handleProcess(initialPrompt);
      }
    } else {
      setAgentResponse(null);
      setSubmissionFeedback(null);
      setInputText('');
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const quickSamples = [
    { label: 'دریافت وجه از احمدی', prompt: 'از آقای احمدی ۵ میلیون تومان دریافت کردم' },
    { label: 'ثبت هزینه مغازه', prompt: '۸۰۰ هزار تومان هزینه مغازه ثبت کن' },
    { label: 'صدور پیش‌فاکتور', prompt: 'برای مشتری احمدی یک پیش‌فاکتور ایجاد کن' },
    { label: 'وضعیت نصب پروژه', prompt: 'وضعیت نصب پروژه مشتری را ثبت کن' },
  ];

  const handleProcess = async (textToProcess: string) => {
    const cleanText = textToProcess.trim();
    if (!cleanText) return;

    setIsProcessing(true);
    setSubmissionFeedback(null);

    try {
      const response = await processAgentCommandOnline(cleanText, foundationData);
      setAgentResponse(response);

      // Initialize editable state based on extracted card action
      if (response.cardAction?.paymentReceiptPayload) {
        const payload = response.cardAction.paymentReceiptPayload;
        setEditablePartyId(payload.partyId);
        setEditablePartyName(payload.partyName);
        setEditableAmountToman(payload.amount);
        setEditableDescription(`دریافت/پرداخت وجه خزانه - ${payload.partyName}`);
        setEditableDateJalali(payload.dateJalali);
      } else if (response.cardAction?.expensePayload) {
        const payload = response.cardAction.expensePayload;
        setEditablePartyName('');
        setEditableAmountToman(payload.amount);
        setEditableDescription(payload.title);
        setEditableDateJalali(payload.dateJalali);
      } else if (response.cardAction?.invoicePayload) {
        const payload = response.cardAction.invoicePayload;
        setEditablePartyId(payload.partyId);
        setEditablePartyName(payload.partyName);
        setEditableAmountToman(payload.totalAmount);
        setEditableDescription(
          payload.isProforma
            ? `پیش‌فاکتور فروش رسمی برای ${payload.partyName}`
            : `فاکتور فروش رسمی برای ${payload.partyName}`
        );
        setEditableDateJalali(payload.dateJalali);
      } else if (response.cardAction?.projectStatusPayload) {
        const payload = response.cardAction.projectStatusPayload;
        setEditablePartyName(payload.customerName);
        setEditableDescription(payload.notes || `تغییر وضعیت پروژه ${payload.projectTitle}`);
        setEditableDateJalali(payload.dateJalali);
        setEditableNewStatus(payload.newStatus);
      }
    } catch {
      setSubmissionFeedback({
        status: 'ERROR',
        messageFa: 'خطا در پردازش زبان طبیعی. لطفاً دوباره تلاش نمایید.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalConfirmAndCommit = async () => {
    if (!agentResponse?.cardAction || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    try {
      const action = agentResponse.cardAction;

      // 1. PAYMENT / RECEIPT
      if (action.type === 'PAYMENT_RECEIPT_CONFIRMATION' && action.paymentReceiptPayload) {
        const payload = action.paymentReceiptPayload;
        const amountIrr = editableAmountToman * 10;
        const targetParty =
          foundationData?.parties?.find((p) => p.id === editablePartyId || p.fullName === editablePartyName) ||
          foundationData?.parties?.[0];

        const partyId = targetParty?.id || editablePartyId || 1;

        if (payload.type === 'RECEIPT') {
          const res = await apiFetch('/api/sales/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: partyId,
              customerTitleFa: editablePartyName || targetParty?.fullName || 'طرف حساب',
              receiptDateJalali: editableDateJalali || '1403/07/22',
              amountIrr: amountIrr,
              settlementMethod: payload.paymentMethod || 'CASH',
              cashBoxId: payload.cashBoxId || foundationData?.cashBoxes?.[0]?.id || 1,
              bankAccountId: payload.bankAccountId || foundationData?.bankAccounts?.[0]?.id || 1,
              descriptionFa: editableDescription || `دریافت وجه نقد از ${editablePartyName}`,
            }),
          });
          const data = await res.json();
          if (data.ok) {
            setSubmissionFeedback({
              status: 'SUCCESS',
              messageFa: data.messageFa || `قبض دریافت به مبلغ ${format3Digit(editableAmountToman)} تومان با موفقیت ثبت شد.`,
            });
            onOperationSuccess();
          } else {
            throw new Error(data.messageFa || 'خطا در ثبت قبض دریافت وجه.');
          }
        } else {
          const res = await apiFetch('/api/purchases/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplierId: partyId,
              supplierTitleFa: editablePartyName || targetParty?.fullName || 'طرف حساب',
              paymentDateJalali: editableDateJalali || '1403/07/22',
              amountIrr: amountIrr,
              settlementMethod: payload.paymentMethod || 'CASH',
              cashBoxId: payload.cashBoxId || foundationData?.cashBoxes?.[0]?.id || 1,
              bankAccountId: payload.bankAccountId || foundationData?.bankAccounts?.[0]?.id || 1,
              descriptionFa: editableDescription || `پرداخت وجه به ${editablePartyName}`,
            }),
          });
          const data = await res.json();
          if (data.ok) {
            setSubmissionFeedback({
              status: 'SUCCESS',
              messageFa: data.messageFa || `قبض پرداخت به مبلغ ${format3Digit(editableAmountToman)} تومان با موفقیت ثبت شد.`,
            });
            onOperationSuccess();
          } else {
            throw new Error(data.messageFa || 'خطا در ثبت قبض پرداخت وجه.');
          }
        }
      }

      // 2. EXPENSE
      else if (action.type === 'EXPENSE_CONFIRMATION' && action.expensePayload) {
        const payload = action.expensePayload;
        const amountIrr = editableAmountToman * 10;
        const defaultCashBox = foundationData?.cashBoxes?.[0];

        const res = await apiFetch('/api/treasury/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titleFa: editableDescription || payload.title,
            categoryTitleFa: payload.category || 'هزینه‌های جاری و اداری',
            expenseDateJalali: editableDateJalali || payload.dateJalali,
            amountIrr: amountIrr,
            cashBoxId: payload.cashBoxId || defaultCashBox?.id || 1,
            descriptionFa: editableDescription || payload.title,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setSubmissionFeedback({
            status: 'SUCCESS',
            messageFa: data.messageFa || `هزینه جاری «${editableDescription}» به مبلغ ${format3Digit(editableAmountToman)} تومان با موفقیت در دفاتر ثبت شد.`,
          });
          onOperationSuccess();
        } else {
          throw new Error(data.messageFa || 'خطا در ثبت هزینه عملیاتی.');
        }
      }

      // 3. INVOICE / PROFORMA
      else if (action.type === 'INVOICE_CONFIRMATION' && action.invoicePayload) {
        const payload = action.invoicePayload;
        const amountIrr = editableAmountToman * 10;
        const targetParty =
          foundationData?.parties?.find((p) => p.id === editablePartyId || p.fullName === editablePartyName) ||
          foundationData?.parties?.[0];

        const targetItem = foundationData?.items?.[0] || {
          id: 1,
          itemCode: 'ITEM-01',
          titleFa: 'کالا یا خدمات عمومی',
          unitNameFa: 'عدد',
        };

        const res = await apiFetch('/api/sales/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: targetParty?.id || 1,
            customerTitleFa: editablePartyName || targetParty?.fullName || 'مشتری عمومی',
            invoiceDateJalali: editableDateJalali || payload.dateJalali,
            isProforma: Boolean(payload.isProforma),
            status: payload.isProforma ? 'PROFORMA' : 'ISSUED',
            warehouseId: 1,
            notesFa: editableDescription,
            lines: [
              {
                itemId: targetItem.id,
                itemCode: targetItem.itemCode,
                itemTitleFa: payload.items[0]?.title || targetItem.titleFa,
                unitNameFa: targetItem.unitNameFa || 'عدد',
                quantity: 1,
                unitPriceIrr: amountIrr,
                taxPercent: 0,
                taxIrr: 0,
                totalPriceIrr: amountIrr,
              },
            ],
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setSubmissionFeedback({
            status: 'SUCCESS',
            messageFa: data.messageFa || `سند ${payload.isProforma ? 'پیش‌فاکتور' : 'فاکتور'} با موفقیت صادر گردید.`,
          });
          onOperationSuccess();
        } else {
          throw new Error(data.messageFa || 'خطا در صدور فاکتور/پیش‌فاکتور.');
        }
      }

      // 4. PROJECT STATUS
      else if (action.type === 'PROJECT_STATUS_CONFIRMATION' && action.projectStatusPayload) {
        const payload = action.projectStatusPayload;
        const projectId = payload.projectId;

        const res = await apiFetch(`/api/projects/${projectId}/visit-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitDateJalali: editableDateJalali || payload.dateJalali,
            notesFa: editableDescription || payload.notes,
            completionPercentage: editableNewStatus === 'COMPLETED' ? 100 : 50,
            hasTechnicalIssues: editableNewStatus === 'NEED_PARTS',
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setSubmissionFeedback({
            status: 'SUCCESS',
            messageFa: data.messageFa || `وضعیت پروژه با موفقیت به روز گردید.`,
          });
          onOperationSuccess();
        } else {
          throw new Error(data.messageFa || 'خطا در بروزرسانی وضعیت پروژه.');
        }
      }
    } catch (err: unknown) {
      setSubmissionFeedback({
        status: 'ERROR',
        messageFa: err instanceof Error ? err.message : 'خطای غیرمنتظره در ثبت عملیات.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountRialCalculated = editableAmountToman * 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-right dir-rtl">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ring-2 ring-white/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                ثبت عملیات با زبان طبیعی (Gemini 3.8 Flash)
              </h2>
              <p className="text-xs text-white/80 font-medium">
                دریافت وجه، هزینه، پیش‌فاکتور و پروژه بدون اشتباه ریال/تومان
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Sample Prompts */}
          <div>
            <span className="text-[11px] font-black text-slate-500 mb-2 block">
              نمونه عبارات پرتکرار سیستم:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(s.prompt);
                    handleProcess(s.prompt);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Natural Language Prompt Input Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center justify-between">
              <span>متن دستور یا عملیات حسابداری:</span>
              <span className="text-[10px] text-slate-400 font-medium">پشتیبانی از صدای متن و کلمات عامیانه</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcess(inputText);
                }}
                placeholder="مثال: از آقای احمدی ۵ میلیون تومان دریافت کردم..."
                className="w-full pl-24 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => handleProcess(inputText)}
                disabled={isProcessing || !inputText.trim()}
                className="absolute left-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>تحلیل...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>تحلیل</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Submission Feedback Message */}
          {submissionFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${
                submissionFeedback.status === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {submissionFeedback.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs leading-relaxed font-bold">
                <div>{submissionFeedback.messageFa}</div>
                {submissionFeedback.status === 'SUCCESS' && (
                  <div className="mt-2 text-[11px] text-emerald-700 font-medium">
                    دفاتر مالی و کارتابل سیستم فوراً با این رویداد به روزرسانی گردید.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Probing / Clarification State */}
          {agentResponse?.intent === 'NEED_CLARIFICATION' && agentResponse.cardAction?.clarificationPayload && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-amber-900">
                    نیاز به تکمیل اطلاعات (استعلام حسابدار ارشد)
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 font-medium leading-relaxed">
                    {agentResponse.cardAction.clarificationPayload.questionFa}
                  </p>
                </div>
              </div>

              {agentResponse.cardAction.clarificationPayload.suggestedOptions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black text-amber-900 block">
                    گزینه‌های پیشنهادی برای انتخاب مستقیم:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {agentResponse.cardAction.clarificationPayload.suggestedOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setInputText(opt.actionPrompt);
                          handleProcess(opt.actionPrompt);
                        }}
                        className="p-2.5 bg-white hover:bg-amber-100/70 border border-amber-200 rounded-xl text-right text-xs font-bold text-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>{opt.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 rotate-180" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Card Preview & Editable Confirmation Form */}
          {agentResponse?.cardAction &&
            agentResponse.cardAction.type !== 'CLARIFICATION' &&
            agentResponse.cardAction.type !== 'NAVIGATE' && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-100 text-blue-700 font-black">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {agentResponse.cardAction.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        اطلاعات استخراج‌شده را بررسی یا اصلاح فرمایید
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                    پیش‌نویس آماده ثبت
                  </span>
                </div>

                {/* Editable Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Party Field */}
                  {editablePartyName !== undefined && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>طرف حساب / شخص:</span>
                      </label>
                      <input
                        type="text"
                        value={editablePartyName}
                        onChange={(e) => setEditablePartyName(e.target.value)}
                        placeholder="نام طرف حساب..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 outline-none"
                      />
                    </div>
                  )}

                  {/* Date Field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>تاریخ سند (شمسی):</span>
                    </label>
                    <input
                      type="text"
                      value={editableDateJalali}
                      onChange={(e) => setEditableDateJalali(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-blue-600 outline-none"
                    />
                  </div>

                  {/* Amount Breakdown (Toman & Rial Side by Side to Prevent Errors) */}
                  {agentResponse.cardAction.type !== 'PROJECT_STATUS_CONFIRMATION' && (
                    <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-blue-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>مبلغ عملیات (تومان و ریال):</span>
                        </label>
                        <span className="text-[10px] text-blue-700 font-black bg-blue-50 px-2 py-0.5 rounded">
                          قانون تبدیل: ۱ تومان = ۱۰ ریال
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">مبلغ به تومان:</span>
                          <input
                            type="number"
                            value={editableAmountToman || ''}
                            onChange={(e) => setEditableAmountToman(Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-black text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                          />
                          <span className="text-[10px] text-slate-600 font-bold mt-1 block">
                            حروف: {format3Digit(editableAmountToman)} تومان
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">معادل ثبتی در دفاتر (ریال):</span>
                          <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm font-black text-slate-700">
                            {parsePersianDigits(amountRialCalculated.toLocaleString('en-US'))} ریال
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                            مبنای ثبت اسناد دفتر کل
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Status Field */}
                  {agentResponse.cardAction.type === 'PROJECT_STATUS_CONFIRMATION' && (
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">وضعیت جدید پروژه:</label>
                      <select
                        value={editableNewStatus}
                        onChange={(e) => setEditableNewStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 outline-none"
                      >
                        <option value="IN_PROGRESS">در حال اجرا و پیشرفت</option>
                        <option value="COMPLETED">تکمیل شده و خاتمه یافته</option>
                        <option value="NEED_PARTS">نیازمند قطعات و تجهیزات تکمیلی</option>
                      </select>
                    </div>
                  )}

                  {/* Description / Notes */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">شرح و توضیحات سند:</label>
                    <input
                      type="text"
                      value={editableDescription}
                      onChange={(e) => setEditableDescription(e.target.value)}
                      placeholder="شرح عملیات در دفاتر..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                {/* Accounting Ledger Impact Breakdown */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl text-xs space-y-1 text-indigo-950 font-medium">
                  <div className="font-black text-[11px] text-indigo-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>اثر مالی در سیستم حسابداری دوطرفه مهرگان:</span>
                  </div>
                  {agentResponse.cardAction.type === 'PAYMENT_RECEIPT_CONFIRMATION' && (
                    <p className="text-[11px] leading-relaxed">
                      بدهکار: صندوق اصلی / بانک نقدینگی | بستانکار: حساب معین شخص «{editablePartyName}» (کاهش مانده بدهکاری)
                    </p>
                  )}
                  {agentResponse.cardAction.type === 'EXPENSE_CONFIRMATION' && (
                    <p className="text-[11px] leading-relaxed">
                      بدهکار: حساب هزینه اداری و عمومی (کد ۸۱۰۱) | بستانکار: حساب صندوق نقدی فروشگاه
                    </p>
                  )}
                  {agentResponse.cardAction.type === 'INVOICE_CONFIRMATION' && (
                    <p className="text-[11px] leading-relaxed">
                      ثبت به عنوان {agentResponse.cardAction.invoicePayload?.isProforma ? 'پیش‌فاکتور (بدون اثر مالی تا قبل از تأیید نهایی)' : 'فاکتور قطعی و خروج از انبار'}
                    </p>
                  )}
                  {agentResponse.cardAction.type === 'PROJECT_STATUS_CONFIRMATION' && (
                    <p className="text-[11px] leading-relaxed">
                      بروزرسانی کارتابل فنی نصاب، ثبت پیشرفت فیزیکی و آماده‌سازی جهت صدور صورت‌حساب
                    </p>
                  )}
                </div>

                {/* Explicit Safety Rule Notice & Final Confirmation Button */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] text-amber-800 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>محدودیت ایمنی: هیچ ثبتی بدون فشردن دکمه تأیید نهایی در دیتابیس اعمال نمی‌شود.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalConfirmAndCommit}
                    disabled={isSubmitting || submissionFeedback?.status === 'SUCCESS'}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت معتبر در سرور...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأیید و ثبت نهایی در سیستم</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
          <span>مدل فعال: Gemini 3.8 Flash (موتور هوشمند مهرگان)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
