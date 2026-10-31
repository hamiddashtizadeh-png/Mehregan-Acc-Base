import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'button' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already running as standalone app, hide or show subtle indicator
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
      }
    } else {
      // Fallback instructions if beforeinstallprompt is not yet fired or on desktop without prompt
      setShowIOSGuide(true);
    }
  };

  if (installedNotice) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold animate-pulse">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>اپلیکیشن مهرگان نصب گردید</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 shrink-0"
          title="نصب وب‌اپلیکیشن مهرگان روی گوشی یا سیستم"
        >
          <Download className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="hidden sm:inline">نصب برنامه</span>
        </button>

        {showIOSGuide && (
          <IOSGuideModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950/40 border border-sky-400/20 transition-all duration-200 active:scale-95"
      >
        <Smartphone className="w-4 h-4 text-sky-200" />
        <span>نصب اپلیکیشن مهرگان (PWA)</span>
      </button>

      {showIOSGuide && (
        <IOSGuideModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

interface IOSGuideModalProps {
  onClose: () => void;
  isIOS: boolean;
}

const IOSGuideModal: React.FC<IOSGuideModalProps> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">راهنمای نصب برنامه مهرگان</h3>
            <p className="text-xs text-slate-400">اجرا به‌صورت Web App بدون نوار مرورگر</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <p className="font-semibold text-sky-300">برای آیفون و آیپد (Safari):</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>دکمه <strong className="text-white">Share (اشتراک‌گذاری)</strong> در پایین مرورگر Safari را لمس کنید.</li>
              <li>صفحه را پایین کشیده و گزینه <strong className="text-emerald-400">Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.</li>
              <li>روی دکمه <strong className="text-sky-400">Add</strong> کلیک کنید تا آیکون مهرگان ایجاد شود.</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <p className="font-semibold text-sky-300">برای اندروید / مرورگر دسکتاپ (Chrome / Edge):</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>منوی ۳ نقطه مرورگر در بالا سمت راست را باز کنید.</li>
              <li>گزینه <strong className="text-emerald-400">افزودن به صفحه اصلی (Install / Add to Home Screen)</strong> را بزنید.</li>
              <li>یا در نوار آدرس مرورگر روی آیکون نصب (Download) کلیک نمایید.</li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition border border-slate-700"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
