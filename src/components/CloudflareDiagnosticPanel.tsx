import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Network,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Cpu,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface DiagnosticCheck {
  id: string;
  titleFa: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  summaryFa: string;
  detailsFa: string;
}

interface CloudflareDiagnosticResponse {
  ok: boolean;
  timestamp: string;
  platform: string;
  http2Ok: boolean;
  isServiceRunning: boolean;
  quickFixCommand: string;
  windowsServiceFixGuide: string;
  checks: DiagnosticCheck[];
}

export const CloudflareDiagnosticPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CloudflareDiagnosticResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [customToken, setCustomToken] = useState('');

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/diagnostics/cloudflare-tunnel');
      if (!res.ok) {
        throw new Error(`خطای سرور (${res.status} ${res.statusText})`);
      }
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        setError(json.messageFa || 'خطا در اجرای تست‌های عیب‌یابی.');
      }
    } catch (err: any) {
      setError(err.message || 'عدم ارتباط با سرور مرکزی مهرگان.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleCopyCommand = () => {
    const token = customToken.trim() || 'YOUR_CLOUDFLARE_TOKEN';
    const cmd = `cloudflared.exe tunnel --protocol http2 run --token ${token}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyGuide = () => {
    if (data?.windowsServiceFixGuide) {
      navigator.clipboard.writeText(data.windowsServiceFixGuide);
      setCopiedGuide(true);
      setTimeout(() => setCopiedGuide(false), 2500);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>ابزار عیب‌یابی زنده Cloudflare Tunnel و سرویس ویندوز</span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono text-slate-600">
                Diagnostic Console
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              بررسی سلامت پورت محلی، پورت‌های ۴۴۳ و ۷۸۴۴ شبکه، وضعیت سرویس cloudflared و ارائه دستورات اصلاحی فوری
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runDiagnostics}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'در حال اجرای تست‌ها...' : 'تست و عیب‌یابی مجدد'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">خطا در دریافت وضعیت عیب‌یابی</div>
            <div className="mt-1 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* Diagnostic Steps Grid */}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.checks.map((check) => {
              const isSuccess = check.status === 'SUCCESS';
              const isWarning = check.status === 'WARNING';
              const isError = check.status === 'ERROR';

              return (
                <div
                  key={check.id}
                  className={`rounded-lg border p-4 space-y-2 transition-all ${
                    isSuccess
                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                      : isWarning
                      ? 'border-amber-200 bg-amber-50/50 text-amber-950'
                      : isError
                      ? 'border-red-200 bg-red-50/50 text-red-950'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-2">
                      {check.id === 'LOCAL_SERVER_PORT_3000' && <Server className="h-4 w-4 text-emerald-600" />}
                      {check.id === 'CLOUDFLARE_EDGE_TCP_443' && <Network className="h-4 w-4 text-blue-600" />}
                      {check.id === 'QUIC_UDP_7844_STATUS' && <Activity className="h-4 w-4 text-amber-600" />}
                      {check.id === 'WIN_SERVICE_STATUS' && <Cpu className="h-4 w-4 text-slate-700" />}
                      <span>{check.titleFa}</span>
                    </span>

                    {isSuccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>تایید شد</span>
                      </span>
                    )}
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>هشدار / نیازمند اقدام</span>
                      </span>
                    )}
                    {isError && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>خطا</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold leading-relaxed">{check.summaryFa}</p>
                  <div className="text-[11px] font-mono text-slate-600 bg-white/80 p-2 rounded border border-slate-200/60 dir-ltr text-right">
                    {check.detailsFa}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Command Generator & Fix Helper */}
          <div className="rounded-lg border border-slate-200 bg-slate-900 p-5 text-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Terminal className="h-4 w-4" />
                <span>دستور کپی فوری برای رفع استاپ شدن سرویس در ویندوز (Bypass UDP Filtering)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">cmd / powershell</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                توکن اختصاصی کلودفلر خود را وارد کنید (اختیاری جهت شخصی‌سازی دستور):
              </label>
              <input
                type="text"
                dir="ltr"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="eyJhIjoi..."
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="rounded-lg bg-black/60 p-3 font-mono text-xs text-emerald-400 flex items-center justify-between gap-3 overflow-x-auto border border-slate-800">
              <code dir="ltr" className="select-all">
                cloudflared.exe tunnel --protocol http2 run --token{' '}
                {customToken.trim() || 'YOUR_CLOUDFLARE_TOKEN'}
              </code>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="inline-flex items-center gap-1.5 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 shrink-0 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-slate-950" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی دستور'}</span>
              </button>
            </div>

            <div className="p-3 rounded bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                <span>راهنمای اصلاح دائم سرویس ویندوز (Windows Service Fix):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pr-2">
                <li>پنجره CMD را با کلیک راست و انتخاب <strong>Run as Administrator</strong> باز کنید.</li>
                <li>حذف سرویس قبلی: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400" dir="ltr">cloudflared.exe service uninstall</code></li>
                <li>ساخت فایل <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400" dir="ltr">C:\ProgramData\cloudflared\config.yml</code> با محتوای <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400" dir="ltr">protocol: http2</code></li>
                <li>نصب مجدد سرویس: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400" dir="ltr">cloudflared.exe service install YOUR_TOKEN</code></li>
                <li>استارت سرویس: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400" dir="ltr">net start cloudflared</code></li>
              </ol>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCopyGuide}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white underline"
                >
                  {copiedGuide ? 'راهنما کپی شد' : 'کپی کامل متن راهنما'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
