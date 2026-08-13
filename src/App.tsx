import React, { useState, useEffect } from 'react';
import { dataService } from './services/dataService';
import { UserRole } from './types';
import { DashboardPage } from './pages/DashboardPage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import { ContentsPage } from './pages/ContentsPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { KolsPage } from './pages/KolsPage';
import { KolDetailPage } from './pages/KolDetailPage';
import { NewContentModal } from './components/NewContentModal';
import { NewCampaignModal } from './components/NewCampaignModal';
import { NewKolModal } from './components/NewKolModal';
import { LoginModal } from './components/LoginModal';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  FolderKanban,
  Users,
  Plus,
  RotateCcw,
  Sparkles,
  Layers,
  UserCheck,
  Building2,
  Shield,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<{ id?: string }>({});
  const [myReviewsCount, setMyReviewsCount] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());

  // Modals state
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showNewKolModal, setShowNewKolModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentRole(dataService.getCurrentRole());
      const contents = dataService.getContents();
      const meCount = contents.filter((c) => c.currentOwner === 'Me').length;
      setMyReviewsCount(meCount);
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const handleNavigate = (page: string, params?: { id?: string }) => {
    setCurrentPage(page);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetData = () => {
    if (window.confirm('重置数据将把所有 Campaign、KOL 和 Content 恢复到演示初始状态。确定继续吗？')) {
      dataService.resetData();
      handleNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => handleNavigate('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                    <span>KOL 内容审核系统</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold">
                      Flow
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">广汽国际 · 省广代理商 · KOL 审稿协同系统</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>控制台</span>
              </button>

              <button
                onClick={() => handleNavigate('my-reviews')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative ${
                  currentPage === 'my-reviews'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>待我审核</span>
                {myReviewsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                    {myReviewsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavigate('contents')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentPage === 'contents' || currentPage === 'content-detail'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Content 任务</span>
              </button>

              <button
                onClick={() => handleNavigate('campaigns')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentPage === 'campaigns' || currentPage === 'campaign-detail'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Campaigns</span>
              </button>

              <button
                onClick={() => handleNavigate('kols')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  currentPage === 'kols' || currentPage === 'kol-detail'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>达人库</span>
              </button>
            </nav>

            {/* Right Action Tools & User Role Login Button */}
            <div className="flex items-center gap-2">
              {/* Role Switcher / Login Status Button */}
              <button
                onClick={() => setShowLoginModal(true)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all ${
                  currentRole === 'Me'
                    ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 hover:border-indigo-400'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                }`}
                title="点击切换登录角色/身份"
              >
                {currentRole === 'Me' ? (
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}</span>
                <span className="text-[10px] px-1 rounded bg-white/10 text-slate-300">切换</span>
              </button>

              <button
                onClick={() => setShowNewContentModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/50 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>新建 Content 任务</span>
              </button>

              <button
                onClick={handleResetData}
                title="重置测试演示数据"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-nav on Mobile */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 px-2 py-2 bg-slate-900/90 text-xs">
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`p-1.5 rounded ${currentPage === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            控制台
          </button>
          <button
            onClick={() => handleNavigate('my-reviews')}
            className={`p-1.5 rounded flex items-center gap-1 ${currentPage === 'my-reviews' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            <span>待我审核</span>
            {myReviewsCount > 0 && <span className="text-[10px] bg-rose-500 text-white px-1 rounded-full">{myReviewsCount}</span>}
          </button>
          <button
            onClick={() => handleNavigate('contents')}
            className={`p-1.5 rounded ${currentPage === 'contents' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            任务
          </button>
          <button
            onClick={() => handleNavigate('campaigns')}
            className={`p-1.5 rounded ${currentPage === 'campaigns' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            项目
          </button>
          <button
            onClick={() => handleNavigate('kols')}
            className={`p-1.5 rounded ${currentPage === 'kols' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            达人
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1">
        {currentPage === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNewContent={() => setShowNewContentModal(true)}
          />
        )}

        {currentPage === 'my-reviews' && <MyReviewsPage onNavigate={handleNavigate} />}

        {currentPage === 'contents' && (
          <ContentsPage
            onNavigate={handleNavigate}
            onOpenNewContent={() => setShowNewContentModal(true)}
          />
        )}

        {currentPage === 'content-detail' && routeParams.id && (
          <ContentDetailPage contentId={routeParams.id} onNavigate={handleNavigate} />
        )}

        {currentPage === 'campaigns' && (
          <CampaignsPage
            onNavigate={handleNavigate}
            onOpenNewCampaign={() => setShowNewCampaignModal(true)}
          />
        )}

        {currentPage === 'campaign-detail' && routeParams.id && (
          <CampaignDetailPage
            campaignId={routeParams.id}
            onNavigate={handleNavigate}
            onOpenNewContent={() => setShowNewContentModal(true)}
          />
        )}

        {currentPage === 'kols' && (
          <KolsPage
            onNavigate={handleNavigate}
            onOpenNewKol={() => setShowNewKolModal(true)}
          />
        )}

        {currentPage === 'kol-detail' && routeParams.id && (
          <KolDetailPage
            kolId={routeParams.id}
            onNavigate={handleNavigate}
            onOpenNewContent={() => setShowNewContentModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-200">KOL 内容审核管理系统</span>
            <span className="mx-2">·</span>
            <span>三方责任追溯 (省广代理商 / 广汽国际 / KOL达人)</span>
          </div>
          <div className="text-slate-500 font-mono">
            Flow Version 1.0.0
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LoginModal
        isOpen={showLoginModal}
        currentRole={currentRole}
        onClose={() => setShowLoginModal(false)}
        onRoleChanged={(newRole) => {
          setCurrentRole(newRole);
        }}
      />

      <NewContentModal
        isOpen={showNewContentModal}
        onClose={() => setShowNewContentModal(false)}
        onSuccess={(newId) => {
          handleNavigate('content-detail', { id: newId });
        }}
      />

      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onSuccess={(campId) => {
          handleNavigate('campaign-detail', { id: campId });
        }}
      />

      <NewKolModal
        isOpen={showNewKolModal}
        onClose={() => setShowNewKolModal(false)}
        onSuccess={(kolId) => {
          handleNavigate('kol-detail', { id: kolId });
        }}
      />
    </div>
  );
}
