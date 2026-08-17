import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { UserAccount } from '../types';
import { Shield, Building2, Lock, User, ArrowRight, AlertCircle, Sparkles, Layers } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('请输入账号和密码');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const user = await dataService.loginWithCredentials(username.trim(), password);
      onLoginSuccess(user);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      setErrorMsg(err.message || '账号或密码错误，请重新输入！');
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>责任追溯 & 独立鉴权</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {isModal ? '切换视角安全鉴权' : '账号密码严格鉴权'}<br />按视角限制审核提交
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                为保障广汽国际与省广代理商之间的责任边界与审核规范，系统要求使用各自专属账号进行身份验证。切换视角或登录均需输入对应的账号密码。
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
            <span>Flow Security v2.0</span>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="md:col-span-7 p-8 bg-slate-900/90 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isModal ? '切换身份视角鉴权' : '系统账号登录'}
                {currentLoggedInUser && (
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-normal">
                    当前: {currentLoggedInUser.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isModal
                  ? '请输入目标视角的专属账号与密码以完成切换'
                  : '请输入广汽国际或省广代理商分配的登录凭证'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>登录账号 (Username)</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入账号"
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
                  placeholder="请输入密码"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <span>正在验证身份凭证...</span>
                ) : (
                  <>
                    <span>{isModal ? '验证并切换视角' : '验证登录并进入系统'}</span>
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
