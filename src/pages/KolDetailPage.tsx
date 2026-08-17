import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL, ContentItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { isOverdue } from '../utils/dateUtils';
import {
  ArrowLeft,
  ExternalLink,
  Tag,
  Plus,
  Edit2,
  Check,
  X,
  FileText,
  Link,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ThumbsUp,
} from 'lucide-react';

interface KolDetailPageProps {
  kolId: string;
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const KolDetailPage: React.FC<KolDetailPageProps> = ({ kolId, onNavigate, onOpenNewContent }) => {
  const [kol, setKol] = useState<KOL | undefined>();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isTagEditing, setIsTagEditing] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    const update = () => {
      const k = dataService.getKolById(kolId);
      setKol(k);
      if (k) {
        setTempUrl(k.profileUrl || '');
      }
      setContents(dataService.getContents().filter((c) => c.kolId === kolId));
    };
    update();
    return dataService.subscribe(update);
  }, [kolId]);

  const campaigns = dataService.getCampaigns();
  const getCampaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || id;
  const allAvailableTags = dataService.getAllAvailableTags();

  if (!kol) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>未找到该达人档案</p>
        <button
          onClick={() => onNavigate('kols')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          返回达人列表
        </button>
      </div>
    );
  }

  const tags = kol.tags || [];

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      dataService.removeKolTag(kol.id, tag);
    } else {
      dataService.addKolTag(kol.id, tag);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    dataService.addKolTag(kol.id, customTagInput.trim());
    setCustomTagInput('');
  };

  const handleSaveProfileUrl = () => {
    dataService.updateKolProfileUrl(kol.id, tempUrl.trim());
    setIsEditingUrl(false);
  };

  const getTagBadgeStyle = (tag: string) => {
    if (tag === '白名单') return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    if (tag === '黑名单') return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    if (tag.includes('S级') || tag.includes('核心')) return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
    if (tag.includes('汽车') || tag.includes('垂类')) return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    if (tag.includes('二创')) return 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
    return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  };

  const totalViews = contents.reduce((sum, c) => sum + (c.performanceData?.views || 0), 0);
  const totalLikes = contents.reduce((sum, c) => sum + (c.performanceData?.likes || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Back button */}
      <button
        onClick={() => onNavigate('kols')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回达人库</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={kol.avatar}
              alt={kol.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{kol.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {kol.platform}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                <span className="font-mono font-semibold text-slate-800">{kol.followers || '10万+'} 粉丝</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  合作任务: <strong className="text-slate-800">{contents.length}</strong> 篇
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewContent}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>发起此达人的 Content 任务</span>
          </button>
        </div>

        {/* Profile URL & Tag Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile URL Box */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-600" />
                达人主页跳转链接 (Profile URL)
              </span>
              <button
                onClick={() => {
                  setIsEditingUrl(!isEditingUrl);
                  setTempUrl(kol.profileUrl || '');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                {isEditingUrl ? '取消' : kol.profileUrl ? '修改链接' : '+ 添加链接'}
              </button>
            </div>

            {isEditingUrl ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  placeholder="https://xiaohongshu.com/user/profile/..."
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  autoFocus
                />
                <button
                  onClick={handleSaveProfileUrl}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shrink-0"
                >
                  保存
                </button>
              </div>
            ) : kol.profileUrl ? (
              <div className="flex items-center justify-between pt-1">
                <a
                  href={kol.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-indigo-600 hover:text-indigo-800 underline truncate max-w-[280px]"
                  title={kol.profileUrl}
                >
                  {kol.profileUrl}
                </a>
                <a
                  href={kol.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs"
                >
                  访问达人主页
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">
                暂未设置主页链接，点击右上角添加
              </p>
            )}
          </div>

          {/* Performance Totals */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
            <span className="text-xs font-bold text-emerald-900 block">
              合作发布表现统计 (自动累加)：
            </span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">累计播放量</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {totalViews > 0 ? totalViews.toLocaleString() : '未录入'}
                  </div>
                </div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2.5">
                <ThumbsUp className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">累计互动/点赞</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {totalLikes > 0 ? totalLikes.toLocaleString() : '未录入'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Management */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              达人标签与分类管理 (白名单 / 黑名单 / 自建标签)
            </span>
            <button
              onClick={() => setIsTagEditing(!isTagEditing)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100"
            >
              {isTagEditing ? '完成编辑' : '+ 编辑/添加标签'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {tags.length === 0 ? (
              <span className="text-xs text-slate-400 italic">暂无标签，点击右上角添加</span>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getTagBadgeStyle(
                    tag
                  )}`}
                >
                  {tag === '白名单' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                  {tag === '黑名单' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                  <span>{tag}</span>
                  {isTagEditing && (
                    <button
                      onClick={() => dataService.removeKolTag(kol.id, tag)}
                      className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          {/* Inline Tag Selector when editing */}
          {isTagEditing && (
            <div className="pt-3 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-100">
              <div className="text-[11px] font-semibold text-slate-600">快捷勾选已有标签：</div>
              <div className="flex flex-wrap gap-1.5">
                {allAvailableTags.map((tag) => {
                  const isTagged = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                        isTagged
                          ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isTagged && <Check className="w-3 h-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Tag */}
              <div className="flex items-center gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  placeholder="输入自建新标签并回车..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 shrink-0"
                >
                  + 新建
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Contents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>该达人的历史合作 Content 任务 ({contents.length})</span>
          </h3>
        </div>

        {contents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            该达人暂无历史合作任务记录。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">所属 Campaign</th>
                  <th className="px-5 py-3 min-w-[240px]">履约进度 (4阶段流程)</th>
                  <th className="px-5 py-3">Stage 阶段</th>
                  <th className="px-5 py-3">Status 状态</th>
                  <th className="px-5 py-3">发布表现 (手动)</th>
                  <th className="px-5 py-3">Current Owner</th>
                  <th className="px-5 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contents.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-600">{getCampaignName(item.campaignId)}</td>
                      <td className="px-5 py-3.5">
                        <ContentInlineProgressBar content={item} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={item.stage} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {item.performanceData ? (
                          <span className="text-emerald-700 font-bold">
                            {(item.performanceData.views || 0).toLocaleString()} 播放 / {(item.performanceData.likes || 0).toLocaleString()} 赞
                          </span>
                        ) : (
                          <span className="text-slate-400">未录入</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <OwnerBadge owner={item.currentOwner} />
                      </td>
                      <td className="px-5 py-3.5 font-mono">{item.deadline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
