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
  LayoutGrid,
  Home,
  LogOut,
  KeyRound,
  UserCheck,
  ChevronLeft,
  X,
  PhoneCall,
  Navigation,
  Eye,
  Shield,
  Boxes,
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
import { PWAInstallButton } from './PWAInstallButton';
import {
  getRequisitionPresets,
  learnRequisitionItems,
  RequisitionPreset,
} from '../utils/requisitionPresets';

interface InstallerPortalViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void> | void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
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
  onOpenChangePassword,
  onLogout,
  onOpenLoginModal,
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
  const [activeSubTab, setActiveSubTab] = useState<'WORKS' | 'REQUISITIONS' | 'REPORTS' | 'PROFILE'>('WORKS');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mobile Banking Experience State
  const [activeMobileTab, setActiveMobileTab] = useState<'MISSIONS' | 'TODAY' | 'REQUISITIONS' | 'PROFILE'>('MISSIONS');
  const [isInstallerOpsOpen, setIsInstallerOpsOpen] = useState(false);
  const [installerOpsSearch, setInstallerOpsSearch] = useState('');

  const getCustomerPhone = useCallback(
    (customerId?: number | null) => {
      if (!customerId) return '';
      const p = parties.find((party) => party.id === customerId);
      return p?.mobile || p?.phone || '';
    },
    [parties]
  );

  // Search & Filter for Works
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Search & Filter for Requisitions
  const [reqSearchQuery, setReqSearchQuery] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedItemForReq, setSelectedItemForReq] = useState<UnifiedWorkItem | null>(null);
  const [selectedItemForReport, setSelectedItemForReport] = useState<UnifiedWorkItem | null>(null);

  // New Requisition Checklist Form State
  const [checklistItems, setChecklistItems] = useState<
    Array<{ id: string; itemId?: number | null; itemNameFa: string; requestedQty: number; unitFa: string; notesFa?: string }>
  >([
    { id: '1', itemId: null, itemNameFa: 'کابل شبکه / CVI ترکیبی', requestedQty: 50, unitFa: 'متر', notesFa: '' },
    { id: '2', itemId: null, itemNameFa: 'دوربین بالت ۴ مگاپیکسل دید در شب', requestedQty: 4, unitFa: 'عدد', notesFa: '' },
  ]);
  const [reqWarehouseId, setReqWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [reqNotes, setReqNotes] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [quickPresets, setQuickPresets] = useState<RequisitionPreset[]>(() => getRequisitionPresets());

  // Ready for install & scheduled date state
  const [selectedReqForReady, setSelectedReqForReady] = useState<ProjectMaterialRequisitionRecord | null>(null);
  const [scheduledInstallDate, setScheduledInstallDate] = useState<string>('1405/02/10');
  const [isSubmittingReady, setIsSubmittingReady] = useState(false);

  // Final consumption report state
  const [selectedReqForConsumption, setSelectedReqForConsumption] = useState<ProjectMaterialRequisitionRecord | null>(null);
  const [consumptionList, setConsumptionList] = useState<
    Array<{ id: string; itemNameFa: string; requestedQty: number; actualConsumedQty: number; unitFa: string; notesFa?: string }>
  >([]);
  const [isSubmittingConsumption, setIsSubmittingConsumption] = useState(false);

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
        const jobsRes = await fetch('/api/installation/jobs');
        if (jobsRes.ok && jobsRes.headers.get('content-type')?.includes('application/json')) {
          const jobsJson = await jobsRes.json();
          if (jobsJson.ok && Array.isArray(jobsJson.jobs)) {
            const assignedJobs = jobsJson.jobs.filter((j: InstallationJobRecord) => {
              if (!installerPartyId) return true;
              return (
                !j.installerId ||
                j.installerId === installerPartyId ||
                (installerParty?.fullName && j.installerTitleFa?.includes(installerParty.fullName))
              );
            });
            setJobs(assignedJobs.length > 0 ? assignedJobs : jobsJson.jobs);
          }
        } else if (Array.isArray(foundationData.installationJobs)) {
          setJobs(foundationData.installationJobs);
        }
      } catch {
        if (Array.isArray(foundationData.installationJobs)) {
          setJobs(foundationData.installationJobs);
        }
      }

      // 2. Fetch assigned projects
      try {
        const prjRes = await fetch('/api/projects');
        if (prjRes.ok && prjRes.headers.get('content-type')?.includes('application/json')) {
          const prjJson = await prjRes.json();
          if (prjJson.ok && Array.isArray(prjJson.projects)) {
            const assignedProjects = prjJson.projects.filter((p: ProjectRecord) => {
              if (!installerPartyId) return true;
              return (
                !p.installerId ||
                p.installerId === installerPartyId ||
                (installerParty?.fullName && p.installerTitleFa?.includes(installerParty.fullName))
              );
            });
            setProjects(assignedProjects.length > 0 ? assignedProjects : prjJson.projects);
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

  const todayWorkItems = useMemo(() => {
    return unifiedWorkItems.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED');
  }, [unifiedWorkItems]);

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

  // Filtered Requisitions & Status Counts
  const reqStatusCounts = useMemo(() => {
    const counts = {
      REQUESTED: 0,
      APPROVED: 0,
      READY_FOR_INSTALL: 0,
      CONSUMPTION_SUBMITTED: 0,
      PRICED_AND_INVOICED: 0,
    };
    for (const r of requisitions) {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts]++;
      }
    }
    return counts;
  }, [requisitions]);

  const filteredRequisitions = useMemo(() => {
    const q = reqSearchQuery.trim().toLowerCase();
    return requisitions.filter((r) => {
      const matchSearch =
        !q ||
        (r.requestCode || '').toLowerCase().includes(q) ||
        (r.projectTitleFa || '').toLowerCase().includes(q) ||
        (r.itemTitleFa || '').toLowerCase().includes(q) ||
        (r.notesFa || '').toLowerCase().includes(q) ||
        (r.items || []).some((i) => (i.itemNameFa || '').toLowerCase().includes(q));

      const matchStatus = reqStatusFilter === 'ALL' || r.status === reqStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [requisitions, reqSearchQuery, reqStatusFilter]);

  // Checklist item management handlers
  const handleAddChecklistItemRow = () => {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        itemId: null,
        itemNameFa: '',
        requestedQty: 1,
        unitFa: 'عدد',
        notesFa: '',
      },
    ]);
  };

  const handleAddQuickPresetItem = (presetTitle: string, defaultQty: number = 1, defaultUnit: string = 'عدد') => {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        itemId: null,
        itemNameFa: presetTitle,
        requestedQty: defaultQty,
        unitFa: defaultUnit,
        notesFa: '',
      },
    ]);
  };

  const handleRemoveChecklistItemRow = (id: string) => {
    if (checklistItems.length <= 1) return;
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateChecklistItem = (
    id: string,
    field: 'itemNameFa' | 'requestedQty' | 'unitFa' | 'notesFa' | 'itemId',
    val: any
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'itemId') {
            const selectedItem = items.find((i) => i.id === Number(val));
            return {
              ...item,
              itemId: Number(val) || null,
              itemNameFa: selectedItem ? selectedItem.titleFa : item.itemNameFa,
              unitFa: selectedItem?.unitNameFa || item.unitFa || 'عدد',
            };
          }
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  // Submit Material Requisition Checklist
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReq) return;

    const validItems = checklistItems.filter((i) => i.itemNameFa.trim() !== '' && i.requestedQty > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', message: 'لطفاً حداقل یک ردیف کالا با نام و تعداد/متراژ معتبر وارد نمایید.' });
      return;
    }

    try {
      setIsSubmittingReq(true);
      const res = await fetch(`/api/projects/${selectedItemForReq.id}/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWarehouseId: reqWarehouseId,
          items: validItems,
          notesFa: reqNotes.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Automatically learn newly added custom items to the quick presets list for future projects
        const updatedPresets = learnRequisitionItems(validItems);
        setQuickPresets(updatedPresets);

        setFeedback({
          type: 'success',
          message: data.messageFa || 'چک‌لیست درخواست کالا با موفقیت برای مدیریت ارسال گردید.',
        });
        setSelectedItemForReq(null);
        setChecklistItems([
          { id: '1', itemId: null, itemNameFa: 'کابل شبکه / CVI ترکیبی', requestedQty: 50, unitFa: 'متر', notesFa: '' },
          { id: '2', itemId: null, itemNameFa: 'دوربین بالت ۴ مگاپیکسل دید در شب', requestedQty: 4, unitFa: 'عدد', notesFa: '' },
        ]);
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

  // Submit Ready for Install
  const handleSetReadyForInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForReady) return;

    try {
      setIsSubmittingReady(true);
      const res = await fetch(`/api/projects/requisitions/${selectedReqForReady.id}/ready-for-install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledInstallDateJalali: scheduledInstallDate }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.messageFa || 'وضعیت کار به «آماده برای نصب» تغییر یافت و تاریخ نصب ثبت شد.',
        });
        setSelectedReqForReady(null);
        await fetchInstallerData();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در تغییر وضعیت پروژه.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در برقراری ارتباط با سرور.' });
    } finally {
      setIsSubmittingReady(false);
    }
  };

  // Submit Final Consumption Report
  const handleSubmitFinalConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForConsumption) return;

    try {
      setIsSubmittingConsumption(true);
      const res = await fetch(`/api/projects/requisitions/${selectedReqForConsumption.id}/submit-final-consumption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumedItems: consumptionList }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.messageFa || 'گزارش و فاکتور اقلام مصرفی نهایی با موفقیت برای مدیریت ارسال گردید.',
        });
        setSelectedReqForConsumption(null);
        await fetchInstallerData();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در ثبت گزارش مصرفی.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در برقراری ارتباط با سرور.' });
    } finally {
      setIsSubmittingConsumption(false);
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
            در انتظار بررسی و تأیید مدیر
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Check className="w-3 h-3" />
            تأیید و ارسال کالا توسط مدیر
          </span>
        );
      case 'READY_FOR_INSTALL':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            آماده برای نصب
          </span>
        );
      case 'CONSUMPTION_SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            گزارش مصرف نهایی ارسال شد
          </span>
        );
      case 'PRICED_AND_INVOICED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            تکمیل نهایی و صدور فاکتور
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
            <Package className="w-3 h-3" />
            تحویل نصاب شده
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

      {/* ========================================================================= */}
      {/* 1. IRANIAN MOBILE BANKING EXPERIENCE FOR INSTALLER (همراه‌بانک نصاب) */}
      {/* ========================================================================= */}
      <div className="block md:hidden pb-28 space-y-4 px-2 pt-1 select-none">
        {/* Mobile Banking Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-cyan-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white font-black flex items-center justify-center text-base shadow-inner shrink-0">
              {activeUser.fullName?.charAt(0) || 'ت'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white truncate">{activeUser.fullName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  همگام
                </span>
              </div>
              <span className="text-[11px] text-cyan-300 block truncate font-medium">
                {installerParty?.fullName ? `تکنسین میدانی: ${installerParty.fullName}` : 'کارتابل اختصاصی نصاب'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={fetchInstallerData}
              title="بروزرسانی داده‌ها"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: MISSIONS (خانه و مأموریت‌ها) */}
        {activeMobileTab === 'MISSIONS' && (
          <div className="space-y-3.5">
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] text-slate-500 block font-bold">کل مأموریت‌ها</span>
                <span className="font-mono font-black text-slate-900 text-base tabular-nums block mt-0.5">
                  {totalCount}
                </span>
              </div>
              <div className="bg-amber-50/70 p-2.5 rounded-2xl border border-amber-200 shadow-xs">
                <span className="text-[10px] text-amber-800 block font-bold">در حال اجرا</span>
                <span className="font-mono font-black text-amber-900 text-base tabular-nums block mt-0.5">
                  {inProgressCount}
                </span>
              </div>
              <div className="bg-sky-50/70 p-2.5 rounded-2xl border border-sky-200 shadow-xs">
                <span className="text-[10px] text-sky-800 block font-bold">در انتظار اقدام</span>
                <span className="font-mono font-black text-sky-900 text-base tabular-nums block mt-0.5">
                  {pendingCount}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در مأموریت‌ها، نام مشتری یا آدرس..."
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              {[
                { key: 'ALL', label: `همه (${totalCount})` },
                { key: 'IN_PROGRESS', label: `در حال اجرا (${inProgressCount})` },
                { key: 'PENDING', label: `در انتظار (${pendingCount})` },
                { key: 'COMPLETED', label: `تکمیل شده (${completedCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === f.key
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Work Items Cards */}
            <div className="space-y-3">
              {filteredWorkItems.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-500 text-xs">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  هیچ مأموریتی مطابق با جستجو یا فیلتر انتخاب‌شده یافت نشد.
                </div>
              ) : (
                filteredWorkItems.map((item) => {
                  const customerPhone = getCustomerPhone(item.rawJob?.customerId || item.rawProject?.customerId);
                  return (
                    <div
                      key={`${item.itemType}-${item.id}`}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 transition-all hover:border-cyan-300"
                    >
                      {/* Card Header: Code & Status */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <span className="font-mono font-black text-xs text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                          {item.code}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${item.statusColorClass}`}>
                          {item.statusLabelFa}
                        </span>
                      </div>

                      {/* Title & Customer */}
                      <div>
                        <h3 className="font-black text-xs text-slate-900 leading-snug">{item.title}</h3>
                        <p className="text-[11px] text-slate-600 mt-1 font-bold">
                          کارفرما: <span className="text-slate-900">{item.customerTitle}</span>
                        </p>
                      </div>

                      {/* Direct Phone Call Shortcut */}
                      {customerPhone && (
                        <div>
                          <a
                            href={`tel:${customerPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold active:scale-95 touch-manipulation hover:bg-emerald-100 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>تماس با کارفرما ({customerPhone})</span>
                          </a>
                        </div>
                      )}

                      {/* Location Address */}
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed break-words">{item.locationAddress}</span>
                      </div>

                      {/* Date & Note Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>موعد: {item.dateJalali}</span>
                        </span>
                      </div>

                      {item.notes && (
                        <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
                          <span className="font-bold block text-[10px] text-amber-700">آخرین توضیحات:</span>
                          {item.notes}
                        </div>
                      )}

                      {/* Action Buttons Right on the Card (1-2 Taps to Action) */}
                      <div className="pt-1 grid grid-cols-2 gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForReport(item);
                            setReportStatus(item.status);
                            setReportNotes(item.notes || '');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation transition-all cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-cyan-700" />
                          <span>ثبت گزارش کار</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedItemForReq(item)}
                          className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation transition-all cursor-pointer"
                        >
                          <Boxes className="w-3.5 h-3.5 text-indigo-700" />
                          <span>درخواست کالا</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TODAY (کارهای امروز و سررسیدها) */}
        {activeMobileTab === 'TODAY' && (
          <div className="space-y-3.5">
            <div className="p-3 bg-cyan-900 text-white rounded-2xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-300" />
                <span className="font-black text-xs">کارهای اولویت‌دار و در جریان امروز</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-800 text-cyan-200 px-2 py-0.5 rounded-full font-bold">
                {todayWorkItems.length} کار جاری
              </span>
            </div>

            <div className="space-y-3">
              {todayWorkItems.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center text-emerald-800 text-xs space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm">هیچ سفارش عقب‌افتاده‌ای ندارید!</p>
                  <p className="text-slate-500 text-[11px]">کلیه پروژه‌ها و سفارشات نصب تعیین‌تکلیف شده‌اند.</p>
                </div>
              ) : (
                todayWorkItems.map((item) => {
                  const customerPhone = getCustomerPhone(item.rawJob?.customerId || item.rawProject?.customerId);
                  return (
                    <div
                      key={`today-${item.itemType}-${item.id}`}
                      className="p-4 bg-white rounded-2xl border border-amber-300 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <span className="font-mono font-black text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {item.statusLabelFa}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-black text-xs text-slate-900">{item.title}</h3>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-bold">
                          کارفرما: {item.customerTitle}
                        </p>
                      </div>

                      {customerPhone && (
                        <a
                          href={`tel:${customerPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold active:scale-95 touch-manipulation"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تماس فوری ({customerPhone})</span>
                        </a>
                      )}

                      <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{item.locationAddress}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedItemForReport(item);
                          setReportStatus(item.status);
                          setReportNotes(item.notes || '');
                        }}
                        className="w-full py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ثبت اقدامات و بروزرسانی وضعیت کار</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REQUISITIONS (حواله‌ها و درخواست‌های کالا) */}
        {activeMobileTab === 'REQUISITIONS' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-slate-900">
                درخواست‌ها و حواله‌های متریال ({requisitions.length})
              </span>
              {pendingReqCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {pendingReqCount} در انتظار
                </span>
              )}
            </div>

            {/* Requisitions Search */}
            <div className="relative">
              <input
                type="text"
                value={reqSearchQuery}
                onChange={(e) => setReqSearchQuery(e.target.value)}
                placeholder="جستجو در کد درخواست، پروژه یا اقلام..."
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              {reqSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReqSearchQuery('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Chips for Requisitions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
              {[
                { key: 'ALL', label: `همه (${requisitions.length})` },
                { key: 'REQUESTED', label: `در انتظار (${reqStatusCounts.REQUESTED})` },
                { key: 'APPROVED', label: `تأیید مدیر (${reqStatusCounts.APPROVED})` },
                { key: 'READY_FOR_INSTALL', label: `آماده نصب (${reqStatusCounts.READY_FOR_INSTALL})` },
                { key: 'CONSUMPTION_SUBMITTED', label: `گزارش مصرف (${reqStatusCounts.CONSUMPTION_SUBMITTED})` },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setReqStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    reqStatusFilter === f.key
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Requisitions Cards List */}
            <div className="space-y-3">
              {filteredRequisitions.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-500 text-xs">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  هیچ حواله یا درخواست متریالی یافت نشد.
                </div>
              ) : (
                filteredRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        {req.requestCode}
                      </span>
                      {getRequisitionStatusBadge(req.status)}
                    </div>

                    <div>
                      <h4 className="font-black text-xs text-slate-900">{req.projectTitleFa || 'پروژه نظارتی'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        تاریخ: {req.scheduledInstallDateJalali || req.consumedAtJalali || (req.createdAt ? req.createdAt.slice(0, 10) : '—')}
                      </p>
                    </div>

                    {/* Items List Preview */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 block">اقلام درخواستی:</span>
                      {req.items && req.items.length > 0 ? (
                        req.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-800 font-bold truncate max-w-[200px]">{it.itemNameFa}</span>
                            <span className="font-mono text-cyan-800 font-black">
                              {it.requestedQty} {it.unitFa || 'عدد'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-800 font-bold">{req.itemTitleFa || 'تجهیزات متفرقه'}</span>
                          <span className="font-mono text-cyan-800 font-black">
                            {req.requestedQty} عدد
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons for Requisition */}
                    {req.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedReqForReady(req)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>اعلام آماده برای نصب و تعیین موعد</span>
                      </button>
                    )}

                    {req.status === 'READY_FOR_INSTALL' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReqForConsumption(req);
                          const initialList =
                            req.items && req.items.length > 0
                              ? req.items.map((it) => ({
                                  id: it.id,
                                  itemNameFa: it.itemNameFa,
                                  requestedQty: it.requestedQty,
                                  actualConsumedQty: it.approvedQty ?? it.requestedQty,
                                  unitFa: it.unitFa || 'عدد',
                                  notesFa: '',
                                }))
                              : [
                                  {
                                    id: '1',
                                    itemNameFa: req.itemTitleFa || 'تجهیزات مصرفی',
                                    requestedQty: req.requestedQty || 1,
                                    actualConsumedQty: req.approvedQty || req.requestedQty || 1,
                                    unitFa: 'عدد',
                                    notesFa: '',
                                  },
                                ];
                          setConsumptionList(initialList);
                        }}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>ثبت گزارش مصرف نهایی تجهیزات</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE (پروفایل و اطلاعات تکنسین) */}
        {activeMobileTab === 'PROFILE' && (
          <div className="space-y-4">
            {/* Technician Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white font-black flex items-center justify-center text-xl shadow-md">
                  {activeUser.fullName?.charAt(0) || 'ت'}
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">{activeUser.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">@{activeUser.username}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    تکنسین فنی و نصاب میدانی
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-bold">شناسه حساب نصاب:</span>
                  <span className="font-mono font-black text-slate-800">
                    {installerParty?.fullName || 'عضو تیم فنی مهرگان'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-bold">سازمان / شرکت:</span>
                  <span className="font-black text-slate-800">
                    {foundationData.settings?.companyName || 'مهرگان سیستم'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={onOpenChangePassword}
                    className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-black text-xs flex items-center justify-between active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>تغییر کلمه عبور کاربر</span>
                    </span>
                    <ChevronLeft className="w-4 h-4 text-amber-500" />
                  </button>
                )}

                {onOpenLoginModal && (
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-black text-xs flex items-center justify-between active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-cyan-600" />
                      <span>تغییر حساب کاربری</span>
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-xs flex items-center justify-between active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>خروج امن از سیستم</span>
                    </span>
                    <ChevronLeft className="w-4 h-4 text-rose-500" />
                  </button>
                )}
              </div>

              <div className="pt-2 text-center">
                <PWAInstallButton variant="compact" />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Installer Operations Sheet / Drawer (دکمه مرکزی عملیات نصاب) */}
        {isInstallerOpsOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => {
                setIsInstallerOpsOpen(false);
                setInstallerOpsSearch('');
              }}
            />
            <div className="relative z-10 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden text-right dir-rtl animate-in slide-in-from-bottom duration-300">
              {/* Drag Handle & Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-slate-900">مرکز عملیات تکنسین و نصاب</h3>
                    <p className="text-[10px] text-slate-500">دسترسی مستقیم و سریع به کارهای فنی میدانی</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsInstallerOpsOpen(false);
                    setInstallerOpsSearch('');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Operations */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    value={installerOpsSearch}
                    onChange={(e) => setInstallerOpsSearch(e.target.value)}
                    placeholder="جستجو در عملیات تکنسین..."
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Operations Menu */}
              <div className="p-4 overflow-y-auto space-y-3 pb-8 text-xs font-sans">
                {/* 1. مأموریت و پروژه */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md">
                    🔧 مأموریت و اجرای کار
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallerOpsOpen(false);
                      setActiveMobileTab('MISSIONS');
                      if (unifiedWorkItems.length > 0) {
                        setSelectedItemForReport(unifiedWorkItems[0]);
                        setReportStatus(unifiedWorkItems[0].status);
                        setReportNotes(unifiedWorkItems[0].notes || '');
                      }
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-cyan-50/70 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">ثبت گزارش پیشرفت و بازدید کار</span>
                        <span className="text-[10px] text-slate-500 block">ثبت توضیحات فنی، تغییر وضعیت و تحویل کار</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallerOpsOpen(false);
                      setActiveMobileTab('TODAY');
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">مشاهده مأموریت‌های دارای اولویت</span>
                        <span className="text-[10px] text-slate-500 block">سفارشات در حال اجرا و برنامه‌ریزی‌شده</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* 2. انبار و متریال */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                    📦 تدارکات و کالا
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallerOpsOpen(false);
                      if (unifiedWorkItems.length > 0) {
                        setSelectedItemForReq(unifiedWorkItems[0]);
                      } else {
                        setActiveMobileTab('REQUISITIONS');
                      }
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">درخواست کالای جدید از انبار</span>
                        <span className="text-[10px] text-slate-500 block">ثبت فرم چک‌لیست اقلام مورد نیاز پروژه</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallerOpsOpen(false);
                      setActiveMobileTab('REQUISITIONS');
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">پیگیری حواله‌ها و مصرف قطعی</span>
                        <span className="text-[10px] text-slate-500 block">تأییدیه مدیر، اعلام آماده نصب و مصرف نهایی</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* 3. ابزارها و امنیت */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    🛡️ امنیت و ابزارها
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsInstallerOpsOpen(false);
                      fetchInstallerData();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">همگام‌سازی و بارگذاری مجدد</span>
                        <span className="text-[10px] text-slate-500 block">دریافت آخرین دستورکارها و تغییرات مدیر</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>

                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInstallerOpsOpen(false);
                        onOpenChangePassword();
                      }}
                      className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 flex items-center justify-between text-right active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs text-slate-900 block">تغییر رمز عبور</span>
                          <span className="text-[10px] text-slate-500 block">افزایش امنیت دسترسی تکنسین</span>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Iranian Mobile Banking Style Fixed Bottom Navigation Bar for Installer */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] grid grid-cols-5 items-end justify-items-center md:hidden select-none">
          {/* 1. خانه / مأموریت‌ها */}
          <button
            type="button"
            onClick={() => {
              setIsInstallerOpsOpen(false);
              setActiveMobileTab('MISSIONS');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
              activeMobileTab === 'MISSIONS' && !isInstallerOpsOpen
                ? 'text-cyan-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home
              className={`w-5 h-5 mb-0.5 ${
                activeMobileTab === 'MISSIONS' && !isInstallerOpsOpen
                  ? 'text-cyan-700 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">مأموریت‌ها</span>
          </button>

          {/* 2. کارهای امروز */}
          <button
            type="button"
            onClick={() => {
              setIsInstallerOpsOpen(false);
              setActiveMobileTab('TODAY');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
              activeMobileTab === 'TODAY' && !isInstallerOpsOpen
                ? 'text-amber-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock
              className={`w-5 h-5 mb-0.5 ${
                activeMobileTab === 'TODAY' && !isInstallerOpsOpen
                  ? 'text-amber-700 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">کارهای امروز</span>
          </button>

          {/* 3. عملیات نصاب (Center Elevated Action Button) */}
          <div className="relative -mt-6 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setIsInstallerOpsOpen(true)}
              aria-label="عملیات تکنسین"
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-700 via-sky-600 to-teal-500 text-white shadow-lg shadow-cyan-600/30 ring-4 ring-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer touch-manipulation"
            >
              <Wrench className="w-6 h-6 fill-white/20 text-white" />
            </button>
            <span className="text-[10px] font-black text-slate-800 mt-1 tracking-tight">عملیات</span>
          </div>

          {/* 4. حواله‌ها */}
          <button
            type="button"
            onClick={() => {
              setIsInstallerOpsOpen(false);
              setActiveMobileTab('REQUISITIONS');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer relative ${
              activeMobileTab === 'REQUISITIONS' && !isInstallerOpsOpen
                ? 'text-indigo-700 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package
              className={`w-5 h-5 mb-0.5 ${
                activeMobileTab === 'REQUISITIONS' && !isInstallerOpsOpen
                  ? 'text-indigo-700 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">حواله‌ها</span>
            {pendingReqCount > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {pendingReqCount}
              </span>
            )}
          </button>

          {/* 5. بیشتر / پروفایل */}
          <button
            type="button"
            onClick={() => {
              setIsInstallerOpsOpen(false);
              setActiveMobileTab('PROFILE');
            }}
            className={`w-full flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[50px] touch-manipulation active:scale-95 cursor-pointer ${
              activeMobileTab === 'PROFILE' && !isInstallerOpsOpen
                ? 'text-slate-900 font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User
              className={`w-5 h-5 mb-0.5 ${
                activeMobileTab === 'PROFILE' && !isInstallerOpsOpen
                  ? 'text-slate-900 stroke-[2.5]'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[10px] tracking-tight">پروفایل</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP INSTALLER PORTAL (نسخه دسکتاپ کامل و دست‌نخورده) */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
      {/* Hero / Technician Profile Card */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-cyan-300" />
                کارتابل اختصاصی نصاب و تکنسین
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-300 text-xs font-semibold">
                {foundationData.settings?.companyName || 'مهرگان سیستم'}
              </span>
              <div className="mr-auto">
                <PWAInstallButton variant="compact" />
              </div>
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
            <span>ثبت گزارش کار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('PROFILE')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'PROFILE'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>پروفایل و حساب نصاب</span>
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
      {/* SUB-TAB 2: MATERIAL REQUISITIONS (جدول بهینه‌شده و پیشرفته درخواست‌های کالا) */}
      {/* ========================================================================= */}
      {activeSubTab === 'REQUISITIONS' && (
        <div className="space-y-4">
          {/* Top Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">لیست و کارتابل درخواست‌های متریال و قطعات</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredRequisitions.length} مورد
                </span>
              </div>
              <p className="text-xs text-slate-500">
                پیگیری و مدیریت آنلاین حواله‌ها و درخواست‌های کالای پروژه‌ها همراه با ثبت تاریخ نصب و فاکتور اقلام مصرفی
              </p>
            </div>

            {unifiedWorkItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItemForReq(unifiedWorkItems[0])}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ ثبت درخواست جدید کالا</span>
              </button>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reqSearchQuery}
                  onChange={(e) => setReqSearchQuery(e.target.value)}
                  placeholder="جستجوی سریع در کد درخواست، نام کالا، پروژه یا توضیحات..."
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">همه وضعیت‌ها ({requisitions.length})</option>
                  <option value="REQUESTED">درخواست اولیه ({reqStatusCounts.REQUESTED})</option>
                  <option value="APPROVED">تأییدشده و آماده ارسال ({reqStatusCounts.APPROVED})</option>
                  <option value="READY_FOR_INSTALL">آماده برای نصب ({reqStatusCounts.READY_FOR_INSTALL})</option>
                  <option value="CONSUMPTION_SUBMITTED">گزارش مصرفی ارسال‌شده ({reqStatusCounts.CONSUMPTION_SUBMITTED})</option>
                  <option value="PRICED_AND_INVOICED">صدور فاکتور نهایی ({reqStatusCounts.PRICED_AND_INVOICED})</option>
                </select>
              </div>
            </div>

            {/* Quick Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500 font-bold ml-1">فیلتر سریع:</span>
              <button
                type="button"
                onClick={() => setReqStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({requisitions.length})
              </button>
              <button
                type="button"
                onClick={() => setReqStatusFilter('REQUESTED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'REQUESTED'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                درخواست اولیه ({reqStatusCounts.REQUESTED})
              </button>
              <button
                type="button"
                onClick={() => setReqStatusFilter('APPROVED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'APPROVED'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                تأیید مدیر ({reqStatusCounts.APPROVED})
              </button>
              <button
                type="button"
                onClick={() => setReqStatusFilter('READY_FOR_INSTALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'READY_FOR_INSTALL'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                آماده نصب ({reqStatusCounts.READY_FOR_INSTALL})
              </button>
              <button
                type="button"
                onClick={() => setReqStatusFilter('CONSUMPTION_SUBMITTED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'CONSUMPTION_SUBMITTED'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                گزارش مصرفی ({reqStatusCounts.CONSUMPTION_SUBMITTED})
              </button>
              <button
                type="button"
                onClick={() => setReqStatusFilter('PRICED_AND_INVOICED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reqStatusFilter === 'PRICED_AND_INVOICED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                فاکتور صادر شده ({reqStatusCounts.PRICED_AND_INVOICED})
              </button>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll for Small Screens */}
          {filteredRequisitions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">هیچ درخواست کالایی در این فیلتر یافت نشد</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {reqSearchQuery
                  ? 'عبارت جستجو شده با درخواست‌های ثبت‌شده مطابقت ندارد.'
                  : 'در حال حاضر هیچ درخواست کالایی با وضعیت انتخاب‌شده ثبت نگردیده است.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right text-xs min-w-[850px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3.5 px-4 w-28">کد درخواست</th>
                      <th className="py-3.5 px-4">مربوط به پروژه / کارفرما</th>
                      <th className="py-3.5 px-4 min-w-[220px]">اقلام چک‌لیست / متریال</th>
                      <th className="py-3.5 px-4 text-center w-32">تاریخ / نصب</th>
                      <th className="py-3.5 px-4 w-36">وضعیت درخواست</th>
                      <th className="py-3.5 px-4 text-center w-48">اقدام نصاب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredRequisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-indigo-900">
                          <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md text-[11px] inline-block">
                            {req.requestCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {req.projectTitleFa || req.projectCode}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            👤 درخواست‌کننده: {req.requestedByNameFa || 'تکنسین اجرا'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {Array.isArray(req.items) && req.items.length > 0 ? (
                            <div className="space-y-1">
                              {req.items.map((i, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2"
                                >
                                  <span className="font-bold text-slate-800">• {i.itemNameFa}</span>
                                  <span className="font-mono text-indigo-900 font-extrabold bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                    {i.actualConsumedQty ?? i.requestedQty} {i.unitFa || 'عدد'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">{req.itemTitleFa}</span>
                              <span className="text-[11px] font-mono text-slate-500">
                                تعداد درخواستی: {req.requestedQty} عدد
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600 font-bold">
                          {req.scheduledInstallDateJalali ? (
                            <span className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                              📍 {req.scheduledInstallDateJalali}
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {getRequisitionStatusBadge(req.status)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {req.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReqForReady(req);
                                  setScheduledInstallDate('1405/02/10');
                                }}
                                className="w-full px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                              >
                                آماده نصب و ثبت تاریخ
                              </button>
                            )}

                            {(req.status === 'APPROVED' || req.status === 'READY_FOR_INSTALL' || req.status === 'ISSUED') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReqForConsumption(req);
                                  if (Array.isArray(req.items) && req.items.length > 0) {
                                    setConsumptionList(
                                      req.items.map((i, idx) => ({
                                        id: `c-${idx}`,
                                        itemNameFa: i.itemNameFa,
                                        requestedQty: i.requestedQty,
                                        actualConsumedQty: i.actualConsumedQty ?? i.requestedQty,
                                        unitFa: i.unitFa || 'عدد',
                                        notesFa: i.notesFa,
                                      }))
                                    );
                                  } else {
                                    setConsumptionList([
                                      {
                                        id: 'c-0',
                                        itemNameFa: req.itemTitleFa || 'کالا',
                                        requestedQty: req.requestedQty || 1,
                                        actualConsumedQty: req.consumedQty || req.requestedQty || 1,
                                        unitFa: 'عدد',
                                      },
                                    ]);
                                  }
                                }}
                                className="w-full px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                              >
                                ارسال فاکتور/مصرفی نهایی
                              </button>
                            )}

                            {req.status === 'REQUESTED' && (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 block w-full">
                                در انتظار تأیید مدیریت
                              </span>
                            )}

                            {req.status === 'CONSUMPTION_SUBMITTED' && (
                              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 block w-full">
                                در انتظار قیمت‌گذاری مدیر
                              </span>
                            )}

                            {req.status === 'PRICED_AND_INVOICED' && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono block w-full">
                                فاکتور صادر شد ({req.finalInvoiceNumber || ''})
                              </span>
                            )}
                          </div>
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT REQUISITION (فرم داینامیک درخواست کالا) */}
      {/* ========================================================================= */}
      {selectedItemForReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-right dir-rtl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {selectedItemForReq.code}
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  ثبت فرم درخواست کالا و تجهیزات برای «{selectedItemForReq.title}»
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForReq(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitRequisition} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
                {/* Select Work Item Dropdown if multiple */}
                {unifiedWorkItems.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      انتخاب پروژه / سفارش نصب مرتبط:
                    </label>
                    <select
                      value={selectedItemForReq.id}
                      onChange={(e) => {
                        const targetId = Number(e.target.value);
                        const item = unifiedWorkItems.find((w) => w.id === targetId);
                        if (item) setSelectedItemForReq(item);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                    >
                      {unifiedWorkItems.map((w) => (
                        <option key={`${w.itemType}-${w.id}`} value={w.id}>
                          {w.code} - {w.title} ({w.customerTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Quick Add Presets Bar */}
                <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl space-y-2">
                  <span className="text-[11px] font-extrabold text-indigo-900 block">
                    ⚡ افزودن سریع اقلام پرکاربرد پروژه:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-0.5">
                    {quickPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAddQuickPresetItem(preset.itemNameFa, preset.defaultQty, preset.unitFa)}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title={`افزودن ${preset.itemNameFa} (${preset.defaultQty} ${preset.unitFa})`}
                      >
                        <span>+ {preset.itemNameFa}</span>
                        <span className="text-[10px] text-indigo-500 font-mono">({preset.defaultQty} {preset.unitFa})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Dynamic Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      لیست اقلام چک‌لیست درخواست کالا <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddChecklistItemRow}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن ردیف سفارشی</span>
                    </button>
                  </div>

                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500 text-[11px] shrink-0 font-mono">
                          #{index + 1}
                        </span>

                        <input
                          type="text"
                          value={item.itemNameFa}
                          onChange={(e) => handleUpdateChecklistItem(item.id, 'itemNameFa', e.target.value)}
                          placeholder="نام کالا / تجهیزات (مثال: لوله پلی‌اتیلن، کابل، دوربین...)"
                          className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          required
                        />

                        <input
                          type="number"
                          min={1}
                          value={item.requestedQty}
                          onChange={(e) => handleUpdateChecklistItem(item.id, 'requestedQty', Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 sm:w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center font-mono text-slate-900 focus:outline-none focus:border-indigo-500 shrink-0"
                          required
                          placeholder="تعداد"
                          title="تعداد / متراژ"
                        />

                        <select
                          value={item.unitFa}
                          onChange={(e) => handleUpdateChecklistItem(item.id, 'unitFa', e.target.value)}
                          className="w-20 sm:w-24 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shrink-0"
                        >
                          <option value="متر">متر</option>
                          <option value="عدد">عدد</option>
                          <option value="شاخه">شاخه</option>
                          <option value="حلقه">حلقه</option>
                          <option value="پک">پک</option>
                          <option value="دستگاه">دستگاه</option>
                          <option value="سری">سری</option>
                        </select>

                        {checklistItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItemRow(item.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="حذف ردیف"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توضیحات و علت درخواست فنی:
                  </label>
                  <input
                    type="text"
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    placeholder="توضیحات تکمیلی نصاب (اختیاری)..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForReq(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingReq ? 'در حال ارسال چک‌لیست...' : 'ثبت در وضعیت «درخواست اولیه» و ارسال به مدیر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SET READY FOR INSTALL */}
      {/* ========================================================================= */}
      {selectedReqForReady && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden text-right dir-rtl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>اعلام آمادگی برای نصب و ثبت تاریخ</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReqForReady(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSetReadyForInstall} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                  کارفرما پروژه <strong>«{selectedReqForReady.projectTitleFa}»</strong> را تأیید نموده است. تاریخ دقیق شروع عملیات نصب را ثبت نمایید.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاریخ برنامه‌ریزی شده برای نصب (شمسی):</label>
                  <input
                    type="text"
                    value={scheduledInstallDate}
                    onChange={(e) => setScheduledInstallDate(e.target.value)}
                    placeholder="1405/02/10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForReady(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReady}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {isSubmittingReady ? 'در حال ثبت...' : 'ثبت آمادگی و اطلاع به مدیر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT FINAL CONSUMPTION REPORT */}
      {/* ========================================================================= */}
      {selectedReqForConsumption && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden text-right dir-rtl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                <span>ثبت فاکتور / گزارش مصرفی نهایی اقلام نصب‌شده</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReqForConsumption(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFinalConsumption} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                  متراژ و تعداد دقیق اقلامی که عملاً در پروژه <strong>«{selectedReqForConsumption.projectTitleFa}»</strong> مصرف شد را مشخص نمایید. این لیست برای قیمت‌گذاری و صدور فاکتور نهایی ارسال می‌شود.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {consumptionList.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <span className="font-bold text-slate-900 block">{item.itemNameFa}</span>
                        <span className="text-[10px] text-slate-500">درخواست اولیه: {item.requestedQty} {item.unitFa}</span>
                      </div>

                      <div className="w-32 flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={item.actualConsumedQty}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setConsumptionList((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, actualConsumedQty: val } : i))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-center text-slate-900"
                          required
                        />
                        <span className="text-[11px] text-slate-600 font-bold">{item.unitFa}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForConsumption(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConsumption}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {isSubmittingConsumption ? 'در حال ارسال فاکتور مصرفی...' : 'ارسال فاکتور/گزارش مصرفی به مدیر'}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden text-right dir-rtl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-bold text-cyan-700">
                  {selectedItemForReport.code} ({selectedItemForReport.itemType === 'JOB' ? 'سفارش نصب' : 'پروژه'})
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">
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

            <form onSubmit={handleSubmitReport} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
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
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-2">
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
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingReport ? 'در حال ثبت...' : 'ذخیره توضیحات و بروزرسانی وضعیت'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: PROFILE & SECURITY VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'PROFILE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-cyan-50 text-cyan-700 rounded-2xl border border-cyan-100">
                <User className="w-6 h-6 text-cyan-700" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">مشخصات حساب کاربری و امنیت نصاب</h2>
                <p className="text-xs text-slate-500 mt-0.5">اطلاعات پرونده، سمت شغلی و مدیریت کلمه عبور حساب جاری</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-slate-500">نام و نام خانوادگی:</span>
                <div className="font-bold text-sm text-slate-900">{activeUser.fullName}</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-slate-500">نام کاربری سیستم (Username):</span>
                <div className="font-bold font-mono text-sm text-cyan-800" dir="ltr">@{activeUser.username}</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-slate-500">عنوان شغلی / نقش:</span>
                <div className="font-bold text-slate-900">{activeUser.jobTitle || 'تکنسین نصب و خدمات میدانی'}</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-slate-500">پرونده طرف‌حساب نصب:</span>
                <div className="font-bold text-slate-900">
                  {installerParty ? `${installerParty.fullName} (${installerParty.partyCode || installerParty.id})` : 'تعریف‌شده به عنوان کاربر نصاب'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-200 text-xs text-cyan-950 space-y-2">
              <span className="font-bold">امنیت و تفکیک داده‌ها:</span>
              <p className="leading-relaxed text-slate-700">
                نشست کاری شما به صورت امن روی سرور با کوکی HttpOnly ثبت گردیده است. شما فقط به اطلاعات کارهای ارجاع‌شده به خودتان دسترسی دارید و ارقام مالی کل مجموعه از دسترسی نصاب‌ها تفکیک گردیده است.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar (Fixed Touch Anchor for SmartPhones) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 shadow-lg grid grid-cols-4 gap-1 md:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab('WORKS')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
            activeSubTab === 'WORKS' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">کارهای من</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('REQUISITIONS')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] relative ${
            activeSubTab === 'REQUISITIONS' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">درخواست کالا</span>
          {pendingReqCount > 0 && (
            <span className="absolute top-1 right-3 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {pendingReqCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('REPORTS')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
            activeSubTab === 'REPORTS' ? 'bg-cyan-700 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">گزارش کار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PROFILE')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
            activeSubTab === 'PROFILE' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">پروفایل</span>
        </button>
      </nav>
    </div>
  );
};
export default InstallerPortalView;
