import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Briefcase,
  Activity,
  ListTodo,
  TrendingUp,
  CheckCheck,
} from 'lucide-react';
import {
  FoundationDataResponse,
  ProjectRecord,
  ProjectMaterialRequisitionRecord,
  InstallationJobRecord,
  ProjectStatus,
  InstallationJobStatus,
  ItemRecord,
  WarehouseRecord,
} from '../types/foundation';

interface InstallerPortalViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void> | void;
}

export type WorkItemType = 'JOB' | 'PROJECT';

export interface UnifiedWorkItem {
  id: number;
  itemType: WorkItemType;
  code: string;
  title: string;
  customerTitle: string;
  locationAddress: string;
  dateJalali: string;
  status: string;
  statusLabelFa: string;
  statusColorClass: string;
  notes?: string | null;
  rawProject?: ProjectRecord;
  rawJob?: InstallationJobRecord;
}

export const InstallerPortalView: React.FC<InstallerPortalViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const activeUser = foundationData.activeUser;
  const parties = foundationData.parties || [];
  const items = foundationData.items || [];
  const warehouses = foundationData.warehouses || [];

  // Identify Installer Party linked to this user
  const installerParty = useMemo(() => {
    if (activeUser.installerPartyId) {
      return parties.find((p) => p.id === activeUser.installerPartyId) || null;
    }
    return (
      parties.find(
        (p) =>
          (p.primaryType === 'INSTALLER' || p.roles?.includes('INSTALLER')) &&
          (p.fullName.includes(activeUser.fullName) || activeUser.fullName.includes(p.fullName))
      ) ||
      parties.find((p) => p.primaryType === 'INSTALLER' || p.roles?.includes('INSTALLER')) ||
      null
    );
  }, [activeUser, parties]);

  const installerPartyId = installerParty?.id || activeUser.installerPartyId || null;

  // State
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [jobs, setJobs] = useState<InstallationJobRecord[]>([]);
  const [requisitions, setRequisitions] = useState<ProjectMaterialRequisitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'WORKS' | 'REQUISITIONS' | 'REPORTS'>('WORKS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedItemForReq, setSelectedItemForReq] = useState<UnifiedWorkItem | null>(null);
  const [selectedItemForReport, setSelectedItemForReport] = useState<UnifiedWorkItem | null>(null);

  // New Requisition Form State
  const [reqItemId, setReqItemId] = useState<number>(items[0]?.id || 1);
  const [reqWarehouseId, setReqWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [reqQuantity, setReqQuantity] = useState<number>(1);
  const [reqNotes, setReqNotes] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // New Visit / Work Report Form State
  const [reportDateJalali, setReportDateJalali] = useState<string>('1405/01/25');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<string>('IN_PROGRESS');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Fetch Projects, Installation Jobs, and Requisitions for this installer
  const fetchInstallerData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch assigned installation jobs
      try {
        const jobsUrl = installerPartyId ? `/api/installation/jobs?installerId=${installerPartyId}` : '/api/installation/jobs';
        const jobsRes = await fetch(jobsUrl);
        if (jobsRes.ok && jobsRes.headers.get('content-type')?.includes('application/json')) {
          const jobsJson = await jobsRes.json();
          if (jobsJson.ok && Array.isArray(jobsJson.jobs)) {
            const assignedJobs = installerPartyId
              ? jobsJson.jobs.filter(
                  (j: InstallationJobRecord) =>
                    j.installerId === installerPartyId ||
                    (installerParty?.fullName && j.installerTitleFa?.includes(installerParty.fullName))
                )
              : jobsJson.jobs;
            setJobs(assignedJobs);
          }
        } else if (Array.isArray(foundationData.installationJobs)) {
          setJobs(
            foundationData.installationJobs.filter(
              (j) =>
                j.installerId === installerPartyId ||
                (installerParty?.fullName && j.installerTitleFa?.includes(installerParty.fullName))
            )
          );
        }
      } catch {
        if (Array.isArray(foundationData.installationJobs)) {
          setJobs(
            foundationData.installationJobs.filter(
              (j) =>
                j.installerId === installerPartyId ||
                (installerParty?.fullName && j.installerTitleFa?.includes(installerParty.fullName))
            )
          );
        }
      }

      // 2. Fetch assigned projects
      try {
        const prjUrl = installerPartyId ? `/api/projects?installerId=${installerPartyId}` : '/api/projects';
        const prjRes = await fetch(prjUrl);
        if (prjRes.ok && prjRes.headers.get('content-type')?.includes('application/json')) {
          const prjJson = await prjRes.json();
          if (prjJson.ok && Array.isArray(prjJson.projects)) {
            const assignedProjects = installerPartyId
              ? prjJson.projects.filter((p: ProjectRecord) => p.installerId === installerPartyId)
              : prjJson.projects;
            setProjects(assignedProjects);
          }
        }
      } catch {
        setProjects([]);
      }

      // 3. Fetch requisitions for installer
      try {
        const reqUrl = installerPartyId ? `/api/projects/requisitions?installerId=${installerPartyId}` : '/api/projects/requisitions';
        const reqRes = await fetch(reqUrl);
        if (reqRes.ok && reqRes.headers.get('content-type')?.includes('application/json')) {
          const reqJson = await reqRes.json();
          if (reqJson.ok && Array.isArray(reqJson.requisitions)) {
            setRequisitions(reqJson.requisitions);
          }
        }
      } catch {
        setRequisitions([]);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات کارتابل نصاب.',
      });
    } finally {
      setLoading(false);
    }
  }, [installerPartyId, installerParty, foundationData.installationJobs]);

  useEffect(() => {
    fetchInstallerData();
  }, [fetchInstallerData]);

  // Map to unified work items
  const unifiedWorkItems: UnifiedWorkItem[] = useMemo(() => {
    const list: UnifiedWorkItem[] = [];

    // Add installation jobs
    for (const j of jobs) {
      let labelFa = 'تخصیص‌یافته به نصاب';
      let colorClass = 'bg-cyan-50 text-cyan-800 border-cyan-200';
      if (j.status === 'IN_PROGRESS') {
        labelFa = 'در حال انجام عملیات';
        colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      } else if (j.status === 'COMPLETED') {
        labelFa = 'تکمیل و تحویل نهایی';
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (j.status === 'CANCELLED') {
        labelFa = 'لغو شده';
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
      }

      list.push({
        id: j.id,
        itemType: 'JOB',
        code: j.jobCode,
        title: j.titleFa,
        customerTitle: j.customerTitleFa || 'نامشخص',
        locationAddress: j.locationAddressFa || 'ثبت نشده',
        dateJalali: j.scheduledDateJalali || '—',
        status: j.status,
        statusLabelFa: labelFa,
        statusColorClass: colorClass,
        notes: j.notesFa,
        rawJob: j,
      });
    }

    // Add projects
    for (const p of projects) {
      let labelFa = 'در حال اجرا';
      let colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      if (p.status === 'APPROVED') {
        labelFa = 'تأیید شده / آماده اجرا';
        colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
      } else if (p.status === 'COMPLETED') {
        labelFa = 'تکمیل و تحویل نهایی';
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (p.status === 'CANCELLED') {
        labelFa = 'لغو شده';
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
      }

      list.push({
        id: p.id,
        itemType: 'PROJECT',
        code: p.projectCode,
        title: p.titleFa,
        customerTitle: p.customerTitleFa || 'نامشخص',
        locationAddress: p.locationAddressFa || 'ثبت نشده',
        dateJalali: p.startDateJalali || '—',
        status: p.status,
        statusLabelFa: labelFa,
        statusColorClass: colorClass,
        notes: p.lastVisitReport?.notesFa || p.notesFa,
        rawProject: p,
      });
    }

    return list;
  }, [jobs, projects]);

  const isPendingStatus = (status: string) =>
    status === 'ASSIGNED' || status === 'PENDING' || status === 'APPROVED' || status === 'DRAFT';

  // Filtered work items
  const filteredWorkItems = useMemo(() => {
    return unifiedWorkItems.filter((w) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.customerTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.locationAddress?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'ALL') {
        matchStatus = true;
      } else if (statusFilter === 'PENDING') {
        matchStatus = isPendingStatus(w.status);
      } else if (statusFilter === 'IN_PROGRESS') {
        matchStatus = w.status === 'IN_PROGRESS';
      } else if (statusFilter === 'COMPLETED') {
        matchStatus = w.status === 'COMPLETED';
      } else {
        matchStatus = w.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [unifiedWorkItems, searchQuery, statusFilter]);

  // Submit Material Requisition (for either a Project or Installation Job)
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReq) return;
    if (reqQuantity <= 0) {
      setFeedback({ type: 'error', message: 'تعداد کالای درخواستی باید حداقل ۱ عدد باشد.' });
      return;
    }

    try {
      setIsSubmittingReq(true);
      const res = await fetch(`/api/projects/${selectedItemForReq.id}/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: reqItemId,
          sourceWarehouseId: reqWarehouseId,
          requestedQty: Number(reqQuantity),
          notesFa: reqNotes.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.messageFa || 'درخواست کالا با موفقیت برای انبار مرکزی ارسال شد.',
        });
        setSelectedItemForReq(null);
        setReqQuantity(1);
        setReqNotes('');
        await fetchInstallerData();
        setActiveSubTab('REQUISITIONS');
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در ثبت درخواست کالا.' });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در ارتباط با سرور هنگام ثبت درخواست کالا.',
      });
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Submit Visit & Progress Report / Update Status
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReport) return;
    if (!reportNotes.trim()) {
      setFeedback({ type: 'error', message: 'لطفاً شرح اقدامات، توضیحات فنی یا گزارش کار را وارد کنید.' });
      return;
    }

    try {
      setIsSubmittingReport(true);
      if (selectedItemForReport.itemType === 'JOB') {
        // Update installation job status and notes
        const res = await fetch(`/api/installation/jobs/${selectedItemForReport.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: reportStatus as InstallationJobStatus,
            notesFa: reportNotes.trim(),
            completedDateJalali: reportStatus === 'COMPLETED' ? reportDateJalali : undefined,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setFeedback({
            type: 'success',
            message: `توضیحات و وضعیت سفارش نصب «${selectedItemForReport.code}» با موفقیت به‌روزرسانی شد.`,
          });
          setSelectedItemForReport(null);
          setReportNotes('');
          await fetchInstallerData();
          await onRefresh();
        } else {
          setFeedback({ type: 'error', message: data.messageFa || 'خطا در ثبت توضیحات سفارش نصب.' });
        }
      } else {
        // Update project visit report
        const res = await fetch(`/api/projects/${selectedItemForReport.id}/visit-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitDateJalali: reportDateJalali,
            notesFa: reportNotes.trim(),
            updatedProjectStatus: reportStatus as ProjectStatus,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          setFeedback({
            type: 'success',
            message: data.messageFa || 'گزارش پیشرفت کار و وضعیت پروژه با موفقیت ذخیره شد.',
          });
          setSelectedItemForReport(null);
          setReportNotes('');
          await fetchInstallerData();
          await onRefresh();
        } else {
          setFeedback({ type: 'error', message: data.messageFa || 'خطا در ثبت گزارش کار پروژه.' });
        }
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در ارتباط با سرور هنگام ارسال گزارش.',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getRequisitionStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            در انتظار تأیید
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Check className="w-3 h-3" />
            تأیید انبار / آماده تحویل
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <Package className="w-3 h-3" />
            تحویل نصاب شده
          </span>
        );
      case 'CONSUMED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            مصرف قطعی
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
            رد درخواست
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Status Counts for Dashboard Widget
  const pendingCount = useMemo(
    () => unifiedWorkItems.filter((w) => isPendingStatus(w.status)).length,
    [unifiedWorkItems]
  );
  const inProgressCount = useMemo(
    () => unifiedWorkItems.filter((w) => w.status === 'IN_PROGRESS').length,
    [unifiedWorkItems]
  );
  const completedCount = useMemo(
    () => unifiedWorkItems.filter((w) => w.status === 'COMPLETED').length,
    [unifiedWorkItems]
  );
  const totalCount = unifiedWorkItems.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingReqCount = requisitions.filter((r) => r.status === 'REQUESTED' || r.status === 'APPROVED').length;

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            بستن
          </button>
        </div>
      )}

      {/* Hero / Technician Profile Card */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-300" />
                کارتابل اختصاصی نصاب و تکنسین
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-300 text-xs font-semibold">
                {foundationData.settings?.companyName || 'مهرگان سیستم'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>خوش آمدید، {activeUser.fullName}</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              این کارتابل اختصاصی صرفاً شامل پروژه‌ها و سفارشات نصب ارجاع‌شده به شماست. شما می‌توانید جزئیات سفارش را مشاهده کرده، برای اجرای کار درخواست کالا از انبار ثبت کنید و توضیحات و وضعیت پیشرفت کار را ثبت نمایید.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15 text-center">
              <span className="block text-2xl font-black text-cyan-300 tabular-nums">{totalCount}</span>
              <span className="text-[11px] text-slate-300 font-bold">کل کارهای محوله</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-emerald-400/30 text-center">
              <span className="block text-2xl font-black text-emerald-300 tabular-nums">{completionRate}٪</span>
              <span className="text-[11px] text-emerald-200 font-bold">پیشرفت کاری</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD WIDGET: STATUS OF PROJECTS & INSTALLATION ORDERS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl border border-cyan-100">
              <Activity className="w-5 h-5 text-cyan-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">
                  داشبورد وضعیت سفارشات و پروژه‌های کاری
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  نمای زنده نصاب
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                وضعیت سفارشات و پروژه‌های محوله را بررسی کنید؛ با کلیک روی هر کارت، لیست زیر به سرعت فیلتر می‌شود.
              </p>
            </div>
          </div>

          {/* Overall Completion Rate Indicator */}
          <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 self-start sm:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 block">نرخ تحقق پروژه‌ها:</span>
              <span className="text-xs font-black text-emerald-700 font-mono">
                {completedCount} از {totalCount} مورد ({completionRate}٪)
              </span>
            </div>
            <div className="w-20 h-2.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Interactive Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Pending / Assigned */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING');
              setActiveSubTab('WORKS');
            }}
            className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
              statusFilter === 'PENDING'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                : 'bg-white hover:bg-sky-50/40 border-slate-200/90 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                  <Clock className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-800">در انتظار اقدام</span>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full font-mono">
                PENDING
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-sky-700 font-mono tabular-nums">
                {pendingCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">مورد آماده شروع</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              سفارشات جدید و کارهای تخصیص‌یافته در انتظار شروع عملیات میدانی
            </p>
          </button>

          {/* 2. In Progress */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS');
              setActiveSubTab('WORKS');
            }}
            className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                : 'bg-white hover:bg-amber-50/40 border-slate-200/90 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Wrench className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-800">در حال اجرا</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-mono">
                ACTIVE
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-amber-700 font-mono tabular-nums">
                {inProgressCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">مورد فعال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              در مرحله کابل‌کشی، نصب تجهیزات، داکت‌کشی و تنظیمات در محل کارفرما
            </p>
          </button>

          {/* 3. Completed */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED');
              setActiveSubTab('WORKS');
            }}
            className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                : 'bg-white hover:bg-emerald-50/40 border-slate-200/90 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-800">تکمیل شده</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-mono">
                DONE
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                {completedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">مورد تحویل‌شده</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              پروژه‌ها و سفارشاتی که عملیات آنها با موفقیت تمام و تحویل قطعی گردیده
            </p>
          </button>

          {/* 4. Total */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setActiveSubTab('WORKS');
            }}
            className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
              statusFilter === 'ALL'
                ? 'bg-slate-100 border-cyan-500 ring-2 ring-cyan-200 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span className="text-xs font-black text-slate-800">کل پروژه‌ها و سفارشات</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-full font-mono">
                TOTAL
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {totalCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">کل پرونده‌ها</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              مجموع کل سفارشات و کارهای اختصاص‌یافته به حساب نصاب
            </p>
          </button>
        </div>

        {/* Visual Progress Breakdown Bar & Material Alert */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
              <span>ترکیب وضعیت کاری نصاب:</span>
              <div className="flex items-center gap-3 text-[11px] font-medium">
                <span className="inline-flex items-center gap-1 text-sky-700">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  در انتظار: {pendingCount}
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  در حال اجرا: {inProgressCount}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  تکمیل شده: {completedCount}
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              {totalCount > 0 ? (
                <>
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    title={`تکمیل شده: ${completedCount}`}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(inProgressCount / totalCount) * 100}%` }}
                    title={`در حال اجرا: ${inProgressCount}`}
                  />
                  <div
                    className="bg-sky-400 h-full transition-all duration-300"
                    style={{ width: `${(pendingCount / totalCount) * 100}%` }}
                    title={`در انتظار اقدام: ${pendingCount}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 h-full" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-r border-slate-200 md:pr-4">
            {pendingReqCount > 0 ? (
              <button
                type="button"
                onClick={() => setActiveSubTab('REQUISITIONS')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-amber-700" />
                <span>{pendingReqCount} درخواست کالا در انتظار انبار</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                کلیه درخواست‌های متریال بررسی شده‌اند
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 underline px-1 cursor-pointer"
              >
                حذف فیلتر وضعیت
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('WORKS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'WORKS'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>پروژه‌ها و سفارشات محوله من ({unifiedWorkItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('REQUISITIONS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'REQUISITIONS'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>درخواست‌های کالا و متریال ({requisitions.length})</span>
            {pendingReqCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingReqCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('REPORTS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'REPORTS'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>ثبت گزارش کار و توضیحات</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchInstallerData();
            onRefresh();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ASSIGNED WORKS (JOBS & PROJECTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'WORKS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان سفارش، کد، نام مشتری یا نشانی..."
                className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none font-medium"
              >
                <option value="ALL">همه وضعیت‌ها ({totalCount})</option>
                <option value="PENDING">در انتظار اقدام / تخصیص‌یافته ({pendingCount})</option>
                <option value="IN_PROGRESS">در حال اجرا و عملیات میدانی ({inProgressCount})</option>
                <option value="COMPLETED">تکمیل و تحویل نهایی ({completedCount})</option>
              </select>
            </div>
          </div>

          {/* Work Items List */}
          {filteredWorkItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">هیچ سفارش یا پروژه‌ای در این بخش یافت نشد</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'عبارت جستجو شده با سفارشات ارجاع‌شده به شما همخوانی ندارد.'
                  : 'در حال حاضر هیچ سفارش یا پروژه‌ای به این نصاب تخصیص نیافته است.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkItems.map((item) => (
                <div
                  key={`${item.itemType}-${item.id}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-cyan-400 p-5 shadow-xs transition-all space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-black text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.itemType === 'JOB' ? 'سفارش خدمات و نصب' : 'پروژه اجرایی'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${item.statusColorClass}`}>
                          {item.statusLabelFa}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Customer and Location Info */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        مشتری / کارفرما:
                      </span>
                      <span className="font-extrabold text-slate-900">{item.customerTitle}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2 text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        آدرس محل اجرا:
                      </span>
                      <span className="font-medium text-slate-800 text-left line-clamp-2">
                        {item.locationAddress}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        تاریخ زمان‌بندی:
                      </span>
                      <span className="font-mono font-bold text-slate-800">{item.dateJalali}</span>
                    </div>
                  </div>

                  {/* Notes & Explanations */}
                  {item.notes && (
                    <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-3 text-xs space-y-1">
                      <span className="text-[10px] text-cyan-900 font-bold block">
                        توضیحات و یادداشت فنی:
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemForReq(item);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                      <span>درخواست کالا</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemForReport(item);
                        setReportStatus(item.status);
                        setReportNotes(item.notes || '');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-white" />
                      <span>توضیحات / تغییر وضعیت</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MATERIAL REQUISITIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'REQUISITIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">لیست درخواست‌های متریال و قطعات</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                اقلام درخواستی شما به انباردار و سرپرست ارسال شده و وضعیت تأیید و تحویل آن در این جدول به‌روز می‌گردد.
              </p>
            </div>

            {unifiedWorkItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItemForReq(unifiedWorkItems[0])}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>درخواست کالای جدید</span>
              </button>
            )}
          </div>

          {requisitions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">هیچ درخواست کالایی هنوز ثبت نشده است</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                برای تحویل کابل، دوربین، داکت، هارد یا سایر اقلام مورد نیاز، روی دکمه «درخواست کالا» در کارت کار مورد نظر کلیک کنید.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-3">کد درخواست</th>
                      <th className="py-3 px-3">مربوط به کار / پروژه</th>
                      <th className="py-3 px-3">نام کالا و کد</th>
                      <th className="py-3 px-3 text-center">تعداد درخواست</th>
                      <th className="py-3 px-3 text-center">تأیید شده</th>
                      <th className="py-3 px-3 text-center">تحویل شده</th>
                      <th className="py-3 px-3">وضعیت درخواست</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {req.requestCode}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {req.projectTitleFa || req.projectCode}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{req.itemTitleFa}</span>
                          <span className="text-[11px] font-mono text-slate-400">{req.itemCode}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {req.requestedQty} عدد
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700">
                          {req.approvedQty || 0} عدد
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700">
                          {req.issuedQty || 0} عدد
                        </td>
                        <td className="py-3 px-3">
                          {getRequisitionStatusBadge(req.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REPORTS & WORK PROGRESS */}
      {/* ========================================================================= */}
      {activeSubTab === 'REPORTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">ثبت توضیحات، گزارش کار و به‌روزرسانی وضعیت</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              توضیحات مربوط به انجام عملیات نصب، کابل‌کشی، تنظیم تجهیزات، موانع اجرایی یا اتمام کار را برای هر مورد ثبت نمایید.
            </p>
          </div>

          {unifiedWorkItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              هیچ کاری جهت ثبت گزارش یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unifiedWorkItems.map((item) => (
                <div key={`rep-${item.itemType}-${item.id}`} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${item.statusColorClass}`}>
                      {item.statusLabelFa}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-1">{item.customerTitle} - {item.locationAddress}</p>

                  {item.notes ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">
                        آخرین توضیحات ثبت‌شده:
                      </span>
                      <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      تاکنون توضیحاتی برای این مورد ثبت نشده است.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemForReport(item);
                      setReportStatus(item.status);
                      setReportNotes(item.notes || '');
                    }}
                    className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ثبت توضیحات جدید یا تغییر وضعیت</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT REQUISITION */}
      {/* ========================================================================= */}
      {selectedItemForReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-indigo-600">
                  {selectedItemForReq.code}
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  درخواست کالا برای «{selectedItemForReq.title}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  کالای مورد نیاز از انبار <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reqItemId}
                  onChange={(e) => setReqItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  required
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.titleFa} [{it.itemCode}] {it.isSerialized ? '— (دارای سریال)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تعداد درخواستی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-extrabold text-center text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    انبار مبدأ جهت تحویل
                  </label>
                  <select
                    value={reqWarehouseId}
                    onChange={(e) => setReqWarehouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.titleFa} ({wh.warehouseCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  علت درخواست و توضیحات فنی:
                </label>
                <textarea
                  rows={3}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="مثال: کابل شبکه اضافه جهت ارتباط سوییچ به دوربین محوطه..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReq ? 'در حال ارسال...' : 'ارسال درخواست به انبار'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT VISIT REPORT / EXPLANATIONS */}
      {/* ========================================================================= */}
      {selectedItemForReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-cyan-700">
                  {selectedItemForReport.code} ({selectedItemForReport.itemType === 'JOB' ? 'سفارش نصب' : 'پروژه'})
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  ثبت توضیحات و وضعیت برای «{selectedItemForReport.title}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاریخ ثبت (شمسی) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={reportDateJalali}
                    onChange={(e) => setReportDateJalali(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وضعیت جدید کار
                  </label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="ASSIGNED">تخصیص‌یافته به نصاب (ASSIGNED)</option>
                    <option value="IN_PROGRESS">در حال انجام عملیات (IN_PROGRESS)</option>
                    <option value="COMPLETED">تکمیل و تحویل نهایی (COMPLETED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شرح کار، توضیحات و اقدامات انجام‌شده <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="توضیحات اقدامات صورت‌گرفته، متراژ کابل‌کشی، تنظیم دوربین‌ها یا وضعیت تحویل به مشتری را بنویسید..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForReport(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingReport ? 'در حال ثبت...' : 'ذخیره توضیحات و بروزرسانی وضعیت'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InstallerPortalView;
