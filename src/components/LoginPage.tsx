import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { UserAccount } from '../types';
import { Shield, Building2, Lock, User, ArrowRight, AlertCircle, Sparkles, Layers, KeyRound, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isModal = false,
  onCloseModal,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [enable2FA, setEnable2FA] = useState(true); // 默认满足外网发布双因子基线
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [devDemoCode, setDevDemoCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequest2FACode = async () => {
    if (!username.trim() || !password) {
      setErrorMsg('请输入账号和密码后获取验证码');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await dataService.send2FACode(username.trim(), password);
      setMaskedPhone(res.maskedPhone || '绑定的密保手机');
      if (res.devDemoCode) {
        setDevDemoCode(res.devDemoCode);
      }
      setCountdown(60);
      setStep('otp');
      setSuccessMsg(`双因子安全码已发送至 ${res.maskedPhone || '密保手机'}（有效期 5 分钟）`);
    } catch (err: any) {
      setErrorMsg(err.message || '获取验证码失败，请确认账号密码！');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('请输入账号和密码');
      return;
    }

    if (enable2FA && step === 'credentials') {
      await handleRequest2FACode();
      return;
    }

    if (enable2FA && step === 'otp' && !twoFactorCode.trim()) {
      setErrorMsg('请输入 6 位动态安全双因子验证码');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const user = await dataService.loginWithCredentials(
        username.trim(),
        password,
        enable2FA ? twoFactorCode.trim() : undefined,
        enable2FA
      );
      onLoginSuccess(user);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      if (err.needs2FA && step === 'credentials') {
        await handleRequest2FACode();
      } else {
        setErrorMsg(err.message || '账号或密码错误，请重新输入！');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentLoggedInUser = dataService.getCurrentUser();

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans ${isModal ? 'min-h-0 bg-transparent p-0' : ''}`}>
      {/* Background Decorative Gradients */}
      {!isModal && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Info Panel (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 relative overflow-hidden">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight">KOL 内容审核系统</h1>
                <p className="text-[11px] text-indigo-300 font-medium">广汽国际 · 省广代理商协同平台</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>广汽应用安全基线 · 双因子认证 (2FA)</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {isModal ? '切换视角安全鉴权' : '外网高安全级访问'}<br />TLS加密 & 动态安全码
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                依据广汽国际应用安全基线规范，面向互联网外网访问的系统，已全面开启 HTTPS/TLS 证书传输加密、双因子认证 (2FA) 与防爆破锁定保护，确保系统与数据防外部篡改。
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">广汽国际 (GAC International)</strong>：终审裁决、意见穿透、项目发布</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">省广代理商 (GIMC Agency)</strong>：省广初审、达人对接与脚本版本上传</span>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>GAC International</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              2FA & TLS 1.3 Active
            </span>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="md:col-span-7 p-8 bg-slate-900/90 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {step === 'credentials' ? (isModal ? '切换身份视角鉴权' : '系统账号登录') : '双因子认证 (2FA) 二次核验'}
                {currentLoggedInUser && (
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-normal">
                    当前: {currentLoggedInUser.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {step === 'credentials'
                  ? '请输入广汽国际或省广代理商分配的账号与密码'
                  : `请输入发送至 ${maskedPhone || '密保手机'} 的 6 位安全验证码`}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              {step === 'credentials' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>登录账号 (Username)</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入账号（如 gac_admin 或 agency_user）"
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>密码 (Password)</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码（如 gac2026 或 agency2026）"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* 2FA Mode Toggle (Baseline Compliance) */}
                  <div className="pt-2 pb-1 flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">双因子二次认证 (2FA)</p>
                        <p className="text-[10px] text-slate-400">广汽外网安全基线要求项 (1.8.1)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enable2FA}
                        onChange={(e) => setEnable2FA(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </>
              ) : (
                /* OTP Verification Step */
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>认证账号：</span>
                      <span className="font-mono text-white font-semibold">{username}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>接收手机：</span>
                      <span className="font-mono text-emerald-400">{maskedPhone}</span>
                    </div>
                    {devDemoCode && (
                      <div className="flex items-center justify-between text-indigo-300 pt-1 border-t border-slate-800">
                        <span>演示动态口令 (OTP)：</span>
                        <button
                          type="button"
                          onClick={() => setTwoFactorCode(devDemoCode)}
                          className="font-mono bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer border border-indigo-400/30"
                        >
                          填入: {devDemoCode}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>6位动态安全验证码</span>
                      </span>
                      <button
                        type="button"
                        disabled={countdown > 0 || loading}
                        onClick={handleRequest2FACode}
                        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>{countdown > 0 ? `${countdown}s 后重新获取` : '重新获取'}</span>
                      </button>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="请输入 6 位动态验证码"
                      required
                      autoFocus
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-center tracking-[0.4em] font-mono text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('credentials');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ← 返回修改账号密码
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <span>正在验证身份凭证...</span>
                ) : (
                  <>
                    <span>
                      {step === 'credentials'
                        ? enable2FA
                          ? '下一步：获取双因子验证码'
                          : isModal
                          ? '验证并切换视角'
                          : '验证登录并进入系统'
                        : '确认验证码并进入系统'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
