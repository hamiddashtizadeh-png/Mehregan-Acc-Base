import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileSpreadsheet,
  QrCode,
  Copy,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Share2,
  Terminal,
  Zap,
  Info,
  Check,
  Smartphone,
  Layers,
  ArrowRightLeft,
  Clock,
  Wifi,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  FoundationDataResponse,
  PartyRecord,
  RemoteTunnelConfig,
  GoogleSheetsSyncConfig,
  GoogleSheetsSyncLog,
} from '../types/foundation';

interface InstallerRemoteAndSheetHubProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void> | void;
}

export const InstallerRemoteAndSheetHub: React.FC<InstallerRemoteAndSheetHubProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CLOUDFLARE_TUNNEL' | 'GOOGLE_SHEETS'>(
    'CLOUDFLARE_TUNNEL'
  );

  // Tunnel state
  const [tunnelConfig, setTunnelConfig] = useState<RemoteTunnelConfig>({
    enabled: foundationData.remoteTunnelConfig?.enabled ?? false,
    publicUrl: foundationData.remoteTunnelConfig?.publicUrl ?? '',
    localPort: foundationData.remoteTunnelConfig?.localPort ?? 3000,
    testStatus: foundationData.remoteTunnelConfig?.testStatus ?? 'UNTESTED',
    lastTestedAt: foundationData.remoteTunnelConfig?.lastTestedAt,
  });
  const [isSavingTunnel, setIsSavingTunnel] = useState(false);
  const [isTestingTunnel, setIsTestingTunnel] = useState(false);
  const [tunnelTestMessage, setTunnelTestMessage] = useState<string | null>(null);

  // Installer selection for QR Code
  const parties = foundationData.parties || [];
  const installers = parties.filter(
    (p) => p.roles?.includes('INSTALLER') || p.primaryType === 'INSTALLER'
  );
  const [selectedInstallerId, setSelectedInstallerId] = useState<number>(
    installers[0]?.id || 3
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Google Sheets state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsSyncConfig>({
    enabled: foundationData.googleSheetsSyncConfig?.enabled ?? false,
    spreadsheetUrl: foundationData.googleSheetsSyncConfig?.spreadsheetUrl ?? '',
    appsScriptWebhookUrl: foundationData.googleSheetsSyncConfig?.appsScriptWebhookUrl ?? '',
    autoSyncIntervalMinutes: foundationData.googleSheetsSyncConfig?.autoSyncIntervalMinutes ?? 0,
    lastSyncAt: foundationData.googleSheetsSyncConfig?.lastSyncAt,
    lastSyncStatus: foundationData.googleSheetsSyncConfig?.lastSyncStatus ?? 'IDLE',
  });
  const [isSavingSheets, setIsSavingSheets] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [appsScriptCode, setAppsScriptCode] = useState<string>('');
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [syncLogs, setSyncLogs] = useState<GoogleSheetsSyncLog[]>(
    foundationData.googleSheetsSyncLogs || []
  );

  // Fetch initial config from server
  useEffect(() => {
    fetchTunnelConfig();
    fetchSheetsConfig();
  }, []);

  const fetchTunnelConfig = async () => {
    try {
      const res = await fetch('/api/system/remote-tunnel');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.config) {
          setTunnelConfig(json.config);
        }
      }
    } catch {
      // transient
    }
  };

  const fetchSheetsConfig = async () => {
    try {
      const res = await fetch('/api/sync/google-sheets/config');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.config) {
          setSheetsConfig(json.config);
          if (Array.isArray(json.logs)) {
            setSyncLogs(json.logs);
          }
        }
      }
    } catch {
      // transient
    }
  };

  // Generate public installer URL
  const selectedInstaller = installers.find((i) => i.id === selectedInstallerId);
  const currentBaseUrl =
    tunnelConfig.publicUrl && tunnelConfig.publicUrl.trim().length > 0
      ? tunnelConfig.publicUrl.trim().startsWith('http')
        ? tunnelConfig.publicUrl.trim()
        : `https://${tunnelConfig.publicUrl.trim()}`
      : window.location.origin;

  const publicInstallerUrl = `${currentBaseUrl}/?installerPartyId=${selectedInstallerId}`;

  // Generate QR code whenever the URL or selected installer changes
  useEffect(() => {
    if (publicInstallerUrl) {
      QRCode.toDataURL(publicInstallerUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => setQrCodeDataUrl(''));
    }
  }, [publicInstallerUrl]);

  // Load Apps Script code
  const loadAppsScriptCode = async () => {
    try {
      const res = await fetch('/api/sync/google-sheets/apps-script-code');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.code) {
          setAppsScriptCode(json.code);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadAppsScriptCode();
  }, []);

  // Save Tunnel Config
  const handleSaveTunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingTunnel(true);
      setFeedback(null);
      const res = await fetch('/api/system/remote-tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tunnelConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({ type: 'success', message: data.messageFa || 'تنظیمات تونل ذخیره شد.' });
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در ذخیره تنظیمات تونل.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در ارتباط با سرور.' });
    } finally {
      setIsSavingTunnel(false);
    }
  };

  // Ping Tunnel URL
  const handleTestTunnel = async () => {
    if (!tunnelConfig.publicUrl) {
      setTunnelTestMessage('لطفاً ابتدا آدرس اینترنتی تونل را وارد کنید.');
      return;
    }
    try {
      setIsTestingTunnel(true);
      setTunnelTestMessage('در حال ارسال درخواست تست به آدرس اینترنتی...');
      const res = await fetch('/api/system/remote-tunnel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicUrl: tunnelConfig.publicUrl }),
      });
      const data = await res.json();
      setTunnelTestMessage(data.messageFa);
      if (data.testStatus) {
        setTunnelConfig((prev) => ({ ...prev, testStatus: data.testStatus }));
      }
      if (onRefresh) onRefresh();
    } catch {
      setTunnelTestMessage('خطا در برقراری ارتباط برای تست.');
    } finally {
      setIsTestingTunnel(false);
    }
  };

  // Copy Link Helper
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicInstallerUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Download QR Code
  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `mehregan-qr-${selectedInstaller?.partyCode || 'installer'}.png`;
    a.click();
  };

  // Download Windows Batch Runner
  const handleDownloadBatch = () => {
    const batContent = `@echo off
chcp 65001 > nul
echo ====================================================================
echo    راه‌اندازی تونل اینترنتی رایگان کلودفلر برای سامانه مهرگان
echo ====================================================================
echo.
echo در حال اتصال پورت 3000 محلی به اینترنت...
echo.
cloudflared tunnel --url http://localhost:3000
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Run-Mehregan-Tunnel.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save Sheets Config
  const handleSaveSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSheets(true);
      setFeedback(null);
      const res = await fetch('/api/sync/google-sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetsConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({ type: 'success', message: data.messageFa || 'تنظیمات گوگل شیت ذخیره شد.' });
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در ذخیره تنظیمات.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در ارتباط با سرور.' });
    } finally {
      setIsSavingSheets(false);
    }
  };

  // Push to Sheets
  const handlePushToSheets = async () => {
    try {
      setIsPushing(true);
      setFeedback(null);
      const res = await fetch('/api/sync/google-sheets/push', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.messageFa || 'سفارشات نصابان به گوگل شیت ارسال گردید.',
        });
        await fetchSheetsConfig();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در ارسال به شیت.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در شبکه هنگام ارسال به گوگل شیت.' });
    } finally {
      setIsPushing(false);
    }
  };

  // Pull from Sheets
  const handlePullFromSheets = async () => {
    try {
      setIsPulling(true);
      setFeedback(null);
      const res = await fetch('/api/sync/google-sheets/pull', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setFeedback({
          type: 'success',
          message: data.messageFa || 'اطلاعات با موفقیت از گوگل شیت همگام‌سازی شد.',
        });
        await fetchSheetsConfig();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', message: data.messageFa || 'خطا در دریافت از گوگل شیت.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'خطا در شبکه هنگام دریافت از گوگل شیت.' });
    } finally {
      setIsPulling(false);
    }
  };

  // Copy Apps Script
  const handleCopyAppsScript = async () => {
    if (!appsScriptCode) return;
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setIsCopiedCode(true);
      setTimeout(() => setIsCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  // Export CSV / Excel template
  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/sync/google-sheets/export');
      const data = await res.json();
      if (data.ok && data.data) {
        // create CSV content
        const rows = [
          [
            'کد سفارش/پروژه',
            'عنوان کار',
            'مشتری',
            'نصاب مسئول',
            'تاریخ ارجاع',
            'آدرس محل پروژه',
            'وضعیت',
            'توضیحات نصاب',
          ],
          ...data.data.jobs.map((j: any) => [
            j.jobCode,
            `"${j.titleFa}"`,
            `"${j.customerTitleFa || '-'}"`,
            `"${j.installerTitleFa || '-'}"`,
            j.scheduledDateJalali,
            `"${j.locationAddressFa || '-'}"`,
            j.status,
            `"${j.notesFa || ''}"`,
          ]),
          ...data.data.projects.map((p: any) => [
            p.projectCode,
            `"${p.titleFa}"`,
            `"${p.customerTitleFa || '-'}"`,
            `"${p.installerTitleFa || '-'}"`,
            p.startDateJalali,
            `"${p.locationAddressFa || '-'}"`,
            p.status,
            `"${p.notesFa || ''}"`,
          ]),
        ];
        const csvString = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mehregan-installer-tasks-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 text-right dir-rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-cyan-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-300" />
                اتصال میدانی تکنسین‌ها و دسترسی خارج از شرکت
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-300 text-xs font-semibold">بدون نیاز به خرید سرور یا IP ثابت</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>مرکز اتصال و همگام‌سازی کارتابل نصابان</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              چنانچه برنامه فقط روی یک رایانه در دفتر/کارگاه اجرا می‌شود و سرور مجزا ندارید، با دو روش زیر می‌توانید دسترسی کامل نصابان روی گوشی موبایل را فراهم کنید: 
              <strong> ۱) تونل امن کلودفلر (ورود مستقیم نصاب با گوشی به همین کارتابل)</strong> یا 
              <strong> ۲) همگام‌سازی با گوگل شیت و فرم‌های گوگل</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15 text-center">
              <span className="block text-xl font-black text-cyan-300 tabular-nums">
                {installers.length}
              </span>
              <span className="text-[11px] text-slate-300 font-bold">تکنسین‌های فعال</span>
            </div>
            <div
              className={`backdrop-blur-md rounded-2xl px-5 py-3 border text-center ${
                tunnelConfig.testStatus === 'CONNECTED'
                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
              }`}
            >
              <span className="block text-xs font-black">
                {tunnelConfig.testStatus === 'CONNECTED' ? 'تونل اینترنتی متصل' : 'آماده راه‌اندازی'}
              </span>
              <span className="text-[10px] text-slate-300 font-bold block mt-1">پورت ۳۰۰۰ محلی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
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
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            بستن
          </button>
        </div>
      )}

      {/* Primary Sub-Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('CLOUDFLARE_TUNNEL')}
          className={`px-5 py-3 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'CLOUDFLARE_TUNNEL'
              ? 'bg-white text-cyan-800 border-cyan-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-600" />
          <span>راهکار ۱: تونل کلودفلر و کد QR اختصاصی نصاب (دسترسی مستقیم موبایل)</span>
          <span className="bg-cyan-100 text-cyan-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            پیشنهادی
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('GOOGLE_SHEETS')}
          className={`px-5 py-3 text-xs font-black rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeSubTab === 'GOOGLE_SHEETS'
              ? 'bg-white text-emerald-800 border-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>راهکار ۲: همگام‌سازی با گوگل شیت و فرم‌های گوگل (Google Sheets & Forms)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: CLOUDFLARE TUNNEL & MOBILE ACCESS */}
      {/* ========================================================================= */}
      {activeSubTab === 'CLOUDFLARE_TUNNEL' && (
        <div className="space-y-6">
          {/* Explanation Card */}
          <div className="bg-sky-50/60 border border-sky-200/90 rounded-2xl p-5 text-xs text-sky-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-sky-900 text-sm">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>چرا این روش بهترین تجربه کاری را به نصاب می‌دهد؟</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              با استفاده از ابزار رایگان <strong>Cloudflare Tunnel</strong>، کامپیوتر داخل دفتر یا مغازه شما به صورت کاملاً امن دارای یک لینک اینترنتی HTTPS می‌شود. نصاب بدون نیاز به هیچ ابزار پیچیده یا اکسل، کافیست با دوربین گوشی خود کد QR زیر را اسکن کند یا روی لینک کلیک کند تا مستقیماً وارد کارتابل اختصاصی خود در سامانه مهرگان شود و سفارشات، درخواست‌های کالا و وضعیت را مدیریت کند.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tunnel Configuration & Auto-launcher (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Form 1: Tunnel URL Config */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-700" />
                    <h2 className="text-sm font-black text-slate-900">
                      پیکربندی آدرس اینترنتی تونل (Public Tunnel URL)
                    </h2>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      tunnelConfig.testStatus === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tunnelConfig.testStatus === 'CONNECTED' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        اتصال فعال
                      </>
                    ) : (
                      'نیازمند تست اتصال'
                    )}
                  </span>
                </div>

                <form onSubmit={handleSaveTunnel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      آدرس اینترنتی تونل کلودفلر (URL عمومی):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        placeholder="https://xxxx.trycloudflare.com یا https://portal.yourdomain.ir"
                        value={tunnelConfig.publicUrl}
                        onChange={(e) =>
                          setTunnelConfig((prev) => ({ ...prev, publicUrl: e.target.value }))
                        }
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={isSavingTunnel}
                        className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                      >
                        {isSavingTunnel ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      این آدرس پس از اجرای دستور Cloudflare در کامپیوتر شما روی صفحه نمایش داده می‌شود.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleTestTunnel}
                      disabled={isTestingTunnel || !tunnelConfig.publicUrl}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingTunnel ? 'animate-spin' : ''}`} />
                      <span>{isTestingTunnel ? 'در حال پینگ...' : 'تست آنلاین اتصال ریموت'}</span>
                    </button>

                    {tunnelTestMessage && (
                      <span className="text-xs font-semibold text-slate-700">
                        {tunnelTestMessage}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Instructions: 1-Line Windows Execution */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-800" />
                    <h2 className="text-sm font-black text-slate-900">
                      راه‌اندازی تونل روی ویندوز با ۱ دستور ساده
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBatch}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1.5 cursor-pointer bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود فایل خودکار (Run-Tunnel.bat)</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <p>
                    روی همان کامپیوتری که نرم‌افزار مهرگان در حال اجراست، نرم‌افزار رایگان <strong>cloudflared</strong> را نصب و دستور زیر را در PowerShell یا Command Prompt اجرا کنید:
                  </p>

                  <div className="bg-slate-950 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed relative group select-all">
                    <code>cloudflared tunnel --url http://localhost:3000</code>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-amber-950 text-[11px] space-y-1">
                    <span className="font-bold block">💡 راهنمای سریع:</span>
                    <span>
                      پس از زدن اینتر، کلودفلر یک آدرس شبیه به <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">https://xxxx.trycloudflare.com</code> به شما می‌دهد. کافیست آن را در کادر بالا کپی کنید تا نصابان بتوانند از خارج از شرکت وارد سیستم شوند!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Direct Installer Share (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-700" />
                    <h2 className="text-sm font-black text-slate-900">
                      کد QR و لینک اختصاصی موبایل نصاب
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    نصاب مسئول را انتخاب کنید تا کارت ورود مستقیم برای گوشی او صادر شود.
                  </p>
                </div>

                {/* Installer Dropdown Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    انتخاب نصاب / تکنسین:
                  </label>
                  <select
                    value={selectedInstallerId}
                    onChange={(e) => setSelectedInstallerId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {installers.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.fullName} ({inst.partyCode}) {inst.mobile ? `- ${inst.mobile}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* QR Code Presentation Box */}
                <div className="bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Installer Mobile QR"
                      className="w-48 h-48 rounded-xl shadow-xs border border-white"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-200 rounded-xl animate-pulse" />
                  )}

                  <div className="text-center space-y-1">
                    <span className="text-xs font-black text-slate-900 block">
                      {selectedInstaller?.fullName || 'کارتابل نصاب'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      اسکن با دوربین گوشی موبایل برای باز کردن کارتابل
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Installer Link */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      dir="ltr"
                      value={publicInstallerUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-600 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'کپی شد!' : 'کپی'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={!qrCodeDataUrl}
                      className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-700" />
                      <span>دانلود QR کد</span>
                    </button>

                    <a
                      href={publicInstallerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-300 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
                      <span>تست و باز کردن</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: GOOGLE SHEETS & GOOGLE FORMS SYNC */}
      {/* ========================================================================= */}
      {activeSubTab === 'GOOGLE_SHEETS' && (
        <div className="space-y-6">
          {/* Explanation Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>همگام‌سازی ابری با گوگل شیت و فرم‌های گوگل (Google Sheets & Forms)</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              در این روش نیازی نیست کامپیوتر داخل شرکت همیشه آنلاین باشد. سفارشات و پروژه‌ها به فایل گوگل شیت شما منتقل می‌شوند. نصاب با گوشی همراه خود در اپلیکیشن Google Sheets یا از طریق یک Google Form ساده فارسی، وضعیت کار را تغییر داده یا درخواست کالای انبار را ثبت می‌کند. سپس در سیستم داخلی تنها با زدن یک کلید «دریافت از گوگل شیت»، تمام اطلاعات در کارتابل‌ها وارد می‌شوند.
            </p>
          </div>

          {/* Action Hub & Live Sync Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">عملیات همگام‌سازی دوطرفه زنده</h2>
                <span className="text-xs text-slate-500">
                  آخرین همگام‌سازی: {sheetsConfig.lastSyncAt ? new Date(sheetsConfig.lastSyncAt).toLocaleString('fa-IR') : 'هنوز انجام نشده'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePushToSheets}
                  disabled={isPushing}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                  <span>{isPushing ? 'در حال ارسال...' : 'ارسال کارها به گوگل شیت (Push)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullFromSheets}
                  disabled={isPulling}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'در حال دریافت...' : 'دریافت وضعیت‌ها و درخواست‌ها از شیت (Pull)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="دانلود فایل CSV آفلاین"
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" />
                  <span>خروجی اکسل/CSV آفلاین</span>
                </button>
              </div>
            </div>

            {/* Sheets Connection Form */}
            <form onSubmit={handleSaveSheets} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  آدرس وب‌اپلیکیشن گوگل اسکریپت (Apps Script Webhook URL):
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://script.google.com/macros/s/AKfy.../exec"
                  value={sheetsConfig.appsScriptWebhookUrl}
                  onChange={(e) =>
                    setSheetsConfig((prev) => ({ ...prev, appsScriptWebhookUrl: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  آدرس تولید شده از بخش Deploy &gt; Web app در Apps Script
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  لینک مستقیم فایل Google Sheet (جهت باز کردن سریع):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetsConfig.spreadsheetUrl}
                    onChange={(e) =>
                      setSheetsConfig((prev) => ({ ...prev, spreadsheetUrl: e.target.value }))
                    }
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {sheetsConfig.spreadsheetUrl && (
                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 p-2 rounded-xl text-xs font-bold shrink-0"
                      title="باز کردن فایل گوگل شیت"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingSheets}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isSavingSheets ? '...' : 'ذخیره'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 1-Click Ready-to-Paste Apps Script Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-black text-slate-900">
                  اسکریپت آماده ۱-کلیک برای Google Apps Script
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                {isCopiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedCode ? 'کد با موفقیت کپی شد!' : 'کپی کل اسکریپت'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-bold">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-emerald-700 block mb-1">۱. ساخت فایل شیت</span>
                  <span>یک فایل در sheets.new بسازید و از منوی Extensions گزینه Apps Script را بزنید.</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-emerald-700 block mb-1">۲. چسباندن کد</span>
                  <span>کد آماده زیر را کپی کرده و داخل ویرایشگر اسکریپت Paste و Save کنید.</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-emerald-700 block mb-1">۳. انتشار Web App</span>
                  <span>دکمه Deploy &gt; New deployment را بزنید و لینک وب‌اپ را در کادر بالا قرار دهید.</span>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed select-all">
                <pre>{appsScriptCode || '// در حال بارگذاری اسکریپت...'}</pre>
              </div>
            </div>
          </div>

          {/* Sync History Logs */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-black text-slate-900">تاریخچه آخرین همگام‌سازی‌ها</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                {syncLogs.length} رکورد ثبت‌شده
              </span>
            </div>

            {syncLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                هنوز هیچ عملیات همگام‌سازی ثبت نشده است. با زدن دکمه «ارسال کارها به گوگل شیت» شروع کنید.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                      <th className="py-2 px-3">نوع عملیات</th>
                      <th className="py-2 px-3">وضعیت</th>
                      <th className="py-2 px-3">جزئیات و آمار</th>
                      <th className="py-2 px-3">زمان ثبت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {syncLogs.slice(0, 8).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              log.type === 'PUSH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.type === 'PULL'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {log.type === 'PUSH' ? 'ارسال به شیت' : log.type === 'PULL' ? 'دریافت از شیت' : 'وب‌هوک زنده'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[11px] font-bold ${
                              log.status === 'SUCCESS' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? 'موفق' : 'خطا'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800 text-xs">
                          {log.detailsFa}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString('fa-IR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
