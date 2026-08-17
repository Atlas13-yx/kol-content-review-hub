import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Campaign, KOL, VideoVersion } from '../types';
import {
  Video,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Clock,
  Check,
  Eye,
  AlertCircle,
  Play,
  Upload,
  BarChart3,
  Link,
  ChevronRight
} from 'lucide-react';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { IntegratedReviewWorkbenchModal } from '../components/IntegratedReviewWorkbenchModal';
import { SmartUploadVersionModal } from '../components/SmartUploadVersionModal';
import { UploadPublishLinkModal } from '../components/UploadPublishLinkModal';
import { PerformanceModal } from '../components/PerformanceModal';

interface VideoReviewPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const VideoReviewPage: React.FC<VideoReviewPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentRole, setCurrentRole] = useState(dataService.getCurrentRole());

  // Modals
  const [activeWorkbenchContent, setActiveWorkbenchContent] = useState<ContentItem | null>(null);
  const [activeUploadContent, setActiveUploadContent] = useState<ContentItem | null>(null);
  const [activeLinkModalContent, setActiveLinkModalContent] = useState<ContentItem | null>(null);
  const [activePerfModalContent, setActivePerfModalContent] = useState<ContentItem | null>(null);

  const loadData = () => {
    // Only load tasks in 'Video' stage
    const allContents = dataService.getContents();
    const videoTasks = allContents.filter((c) => c.stage === 'Video');
    setContents(videoTasks);
    setCampaigns(dataService.getCampaigns());
    setKols(dataService.getKols());
    setCurrentRole(dataService.getCurrentRole());
  };

  useEffect(() => {
    loadData();
    return dataService.subscribe(loadData);
  }, []);

  const getCampaignName = (id: string) => {
    return campaigns.find((c) => c.id === id)?.name || id;
  };

  const getKol = (id: string) => {
    return kols.find((k) => k.id === id);
  };

  const filteredTasks = contents.filter((task) => {
    if (selectedCampaignId !== 'all' && task.campaignId !== selectedCampaignId) {
      return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const kol = getKol(task.kolId);
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTopic = task.topic.toLowerCase().includes(q);
      const matchKol = kol?.name.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchKol;
    }
    return true;
  });

  const waitingMyCount = contents.filter((c) => c.status === 'Waiting for My Review').length;
  const waitingAgencyCount = contents.filter((c) => c.status === 'Waiting for Agency Review').length;
  const pendingLinkCount = contents.filter((c) => c.status === 'Pending Publish Link').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">视频审核阶段 (Video Review)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  当前阶段：{contents.length} 个视频任务
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                成片视频播放、时间戳审片批注、省广初审与广汽终审裁决。终审通过后进入发布链接归档与效果数据分析。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>当前审核身份：<strong className="text-slate-900">{currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}</strong></span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待广汽终审视频</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{waitingMyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">视频终审定稿与发布许可</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待省广初审视频</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{waitingAgencyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">初审成片画面与音画同步</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待省广上传发布链接</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{pendingLinkCount}</div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>通过后 1 天内归档发布链接</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">发布后效果分析</div>
          <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
            <span>5. 发布上线与数据</span>
            <ArrowRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">3天后回填播放量与互动率</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索视频任务标题、话题或达人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">活动筛选:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">全部 Campaign</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">全部视频状态</option>
              <option value="Waiting for My Review">等待广汽国际终审</option>
              <option value="Waiting for Agency Review">等待省广初审</option>
              <option value="Pending Publish Link">待省广上传发布链接</option>
              <option value="Pending Data Entry">待省广补充数据</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          共找到 <strong className="text-slate-700">{filteredTasks.length}</strong> 条视频审核任务
        </div>
      </div>

      {/* Task List / Video Cards */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">当前没有处于「视频审核」阶段的任务</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            脚本通过后将自动流转至此处进入视频审核阶段。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const kol = getKol(task.kolId);
            const campaignName = getCampaignName(task.campaignId);
            const videoVersions = dataService.getVideoVersions(task.id);
            const latestVideo = videoVersions[videoVersions.length - 1];

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Campaign & Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {campaignName}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.category}
                      </span>
                      <StatusBadge status={task.status} />
                      <OwnerBadge owner={task.currentOwner} />
                    </div>
                    <h3
                      onClick={() => onNavigate('content-detail', { id: task.id })}
                      className="text-base font-bold text-slate-900 hover:text-purple-600 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                    <button
                      onClick={() => setActiveUploadContent(task)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传成片</span>
                    </button>

                    <button
                      onClick={() => setActiveWorkbenchContent(task)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>视频审片工作台 (时间轴批注)</span>
                    </button>

                    {task.status === 'Pending Publish Link' && (
                      <button
                        onClick={() => setActiveLinkModalContent(task)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>上传发布链接</span>
                      </button>
                    )}

                    {(task.status === 'Pending Data Entry' || task.stage === 'Completed') && (
                      <button
                        onClick={() => setActivePerfModalContent(task)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>录入效果数据</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Info Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        达人：{kol?.name || task.kolId} ({task.platform})
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="font-semibold text-slate-600">
                        视频版本：共 {videoVersions.length} 个版本
                        {latestVideo && `（当前 V${latestVideo.versionNumber}）`}
                      </span>
                    </div>
                    {task.videoApprovedAt && (
                      <p className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>广汽国际终审已同意发布（{task.videoApprovedAt.slice(0, 10)}）</span>
                      </p>
                    )}
                  </div>

                  {latestVideo && (
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] shrink-0">
                      <span>视频源：{latestVideo.videoUrl ? '线上高清源已就绪' : '附件待上传'}</span>
                    </div>
                  )}
                </div>

                {/* Progress Node */}
                <div className="pt-1">
                  <ContentInlineProgressBar content={task} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Integrated Workbench Modal */}
      {activeWorkbenchContent && (
        <IntegratedReviewWorkbenchModal
          isOpen={true}
          contentId={activeWorkbenchContent.id}
          assetType="Video"
          content={activeWorkbenchContent}
          onClose={() => setActiveWorkbenchContent(null)}
          onSuccess={() => {
            loadData();
            setActiveWorkbenchContent(null);
          }}
        />
      )}

      {/* Smart Upload Version Modal */}
      {activeUploadContent && (
        <SmartUploadVersionModal
          isOpen={true}
          initialContentId={activeUploadContent.id}
          initialAssetType="Video"
          content={activeUploadContent}
          onClose={() => setActiveUploadContent(null)}
          onSuccess={() => {
            loadData();
            setActiveUploadContent(null);
          }}
        />
      )}

      {/* Upload Link Modal */}
      {activeLinkModalContent && (
        <UploadPublishLinkModal
          isOpen={true}
          content={activeLinkModalContent}
          onClose={() => setActiveLinkModalContent(null)}
          onSuccess={() => {
            loadData();
            setActiveLinkModalContent(null);
          }}
        />
      )}

      {/* Performance Data Modal */}
      {activePerfModalContent && (
        <PerformanceModal
          isOpen={true}
          content={activePerfModalContent}
          onClose={() => setActivePerfModalContent(null)}
          onSuccess={() => {
            loadData();
            setActivePerfModalContent(null);
          }}
        />
      )}
    </div>
  );
};
