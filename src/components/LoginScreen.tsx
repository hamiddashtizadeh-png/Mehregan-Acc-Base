import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft, Zap, Wrench, Shield } from 'lucide-react';
import { PublicUser } from '../types/foundation';

interface LoginScreenProps {
  onLoginSuccess: (user: PublicUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<'ADMIN' | 'INSTALLER' | 'CUSTOM'>('ADMIN');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectRole = (role: 'ADMIN' | 'INSTALLER' | 'CUSTOM') => {
    setSelectedRoleTab(role);
    setErrorMsg(null);
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin');
    } else if (role === 'INSTALLER') {
      setUsername('installer_ali');
      setPassword('ali@123');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.messageFa || 'نام کاربری یا کلمه عبور وارد شده نادرست است.');
      } else {
        if (data.token) {
          localStorage.setItem('mehregan_session_token', data.token);
        }
        if (data.csrfToken) {
          localStorage.setItem('mehregan_csrf_token', data.csrfToken);
        }
        onLoginSuccess(data.user);
      }
    } catch {
      setErrorMsg('خطا در ارتباط با سرور مرکزی. لطفاً اتصال شبکه را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Background Subtle Gradient Mesh */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative z-10 space-y-6 my-auto">
        {/* Header Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
              سامانه مدیریت و حسابداری مهرگان
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ورود امن به کارتابل مدیریت و نصابان میدانی (احراز هویت PBKDF2)
            </p>
          </div>
        </div>

        {/* Quick Role Selector Segmented Controls */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-400">
            انتخاب نوع حساب برای ورود سریع:
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSelectRole('ADMIN')}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                selectedRoleTab === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="h-4 w-4 mb-0.5" />
              <span>مدیر سیستم</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('INSTALLER')}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                selectedRoleTab === 'INSTALLER'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="h-4 w-4 mb-0.5" />
              <span>نصاب میدانی</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('CUSTOM')}
              className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                selectedRoleTab === 'CUSTOM'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="h-4 w-4 mb-0.5" />
              <span>سایر کاربر</span>
            </button>
          </div>
        </div>

        {/* Role Quick Hint */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {selectedRoleTab === 'ADMIN' && 'دسترسی کامل به مالی، حسابداری، انبار و کاربران'}
              {selectedRoleTab === 'INSTALLER' && 'دسترسی ایزوله به کارتابل، سفارشات و درخواست کالا'}
              {selectedRoleTab === 'CUSTOM' && 'ورود با نام کاربری و کلمه عبور اختصاصی'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 dir-ltr">
            {username || 'Custom'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              نام کاربری (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / installer_ali"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-3 pr-10 py-3 text-xs font-mono text-left text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all min-h-[44px]"
              />
              <User className="h-4 w-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              کلمه عبور (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-10 py-3 text-xs font-mono text-left text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all min-h-[44px]"
              />
              <Lock className="h-4 w-4 text-slate-500 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>ورود به حساب کاربری</span>
                <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 border-t border-slate-800/80">
          <div>امنیت نشست سمت سرور · کوکی HttpOnly و SameSite Lax</div>
          <div>نسخه ۲.۰ مهرگان ERP · پشتیبانی از موبایل و دسکتاپ</div>
        </div>
      </div>
    </div>
  );
};
