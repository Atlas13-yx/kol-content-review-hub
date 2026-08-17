import React, { useState, useEffect } from 'react';
import { dataService } from './services/dataService';
import { UserRole, UserAccount } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import { ContentsPage } from './pages/ContentsPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { KolsPage } from './pages/KolsPage';
import { KolDetailPage } from './pages/KolDetailPage';
import { KolSelectionPage } from './pages/KolSelectionPage';
import { BriefReviewPage } from './pages/BriefReviewPage';
import { ScriptReviewPage } from './pages/ScriptReviewPage';
import { VideoReviewPage } from './pages/VideoReviewPage';
import { NotificationToast } from './components/NotificationToast';
import { NewContentModal } from './components/NewContentModal';
import { NewCampaignModal } from './components/NewCampaignModal';
import { NewKolModal } from './components/NewKolModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(dataService.isLoggedIn());
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<{ id?: string }>({});
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(dataService.getCurrentUser());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showNewKolModal, setShowNewKolModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsLoggedIn(dataService.isLoggedIn());
      setCurrentRole(dataService.getCurrentRole());
      setCurrentUser(dataService.getCurrentUser());
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const handleNavigate = (page: string, params?: { id?: string }) => {
    setCurrentPage(page);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    dataService.logout();
    setIsLoggedIn(false);
  };

  // If not logged in, show the login interface
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setIsLoggedIn(true);
          setCurrentRole(user.role);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Header: Only Title + Login Account + Logout */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        onOpenSwitchAccount={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onLogoClick={() => handleNavigate('dashboard')}
      />

      {/* Top-Right Notification Toast System */}
      <NotificationToast
        currentRole={currentRole}
        onNavigate={handleNavigate}
      />

      {/* Main Layout: Left Collapsible Sidebar + Right Scrollable Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Content Area */}
        <main
          className={`flex-1 transition-all duration-300 pb-16 min-h-[calc(100vh-4rem)] ${
            isSidebarCollapsed ? 'ml-16' : 'ml-60'
          }`}
        >
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenNewContent={() => setShowNewContentModal(true)}
            />
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

          {currentPage === 'kol-selection' && (
            <KolSelectionPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'brief-review' && (
            <BriefReviewPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'script-review' && (
            <ScriptReviewPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'video-review' && (
            <VideoReviewPage onNavigate={handleNavigate} />
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

          {currentPage === 'content-detail' && routeParams.id && (
            <ContentDetailPage
              contentId={routeParams.id}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'contents' && (
            <ContentsPage
              onNavigate={handleNavigate}
              onOpenNewContent={() => setShowNewContentModal(true)}
            />
          )}

          {currentPage === 'my-reviews' && (
            <MyReviewsPage onNavigate={handleNavigate} />
          )}
        </main>
      </div>

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
