import React from 'react';
import { CheckCircle2, FileText, Video, Send, Flag, Check, UserCheck } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentProgressBarProps {
  content: ContentItem;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to determine active step (1 to 5)
export const getContentStepNumber = (cnt: ContentItem): number => {
  if (
    cnt.stage === 'Completed' ||
    cnt.status === 'Completed' ||
    cnt.status === 'Pending Publish Link' ||
    cnt.status === 'Pending Data Entry'
  ) {
    return 5; // 发布上线与数据
  }
  if (cnt.stage === 'Video' || cnt.status.includes('Video') || cnt.videoApprovedAt) {
    return 4; // 视频审核
  }
  if (cnt.stage === 'Script' || cnt.status.includes('Script') || cnt.status.includes('Agency Review') || cnt.status.includes('My Review')) {
    // If it's direct post, it shouldn't normally be in script stage, but if it is, return 3
    return 3; // 脚本审核
  }
  if (cnt.stage === 'Brief' || cnt.status.includes('Brief') || cnt.status === 'Waiting for KOL Script') {
    return 2; // Brief 审核与需求
  }
  return 1; // 达人筛选阶段
};

export const getStepDefinitionsForContent = (cnt?: ContentItem) => {
  const isDirectPost = cnt?.category === '直发';
  return [
    {
      num: 1,
      title: '1. 达人筛选',
      short: '达人筛选',
      sub: '人选匹配与初筛确认',
      icon: UserCheck,
    },
    {
      num: 2,
      title: '2. Brief 审核',
      short: 'Brief 审核',
      sub: isDirectPost ? '素材确认与下发' : '卖点核准与签署',
      icon: Send,
    },
    {
      num: 3,
      title: isDirectPost ? '3. 脚本阶段 (免脚本)' : '3. 脚本审核',
      short: isDirectPost ? '免脚本(直通)' : '脚本审核',
      sub: isDirectPost ? '直发类型无需脚本' : '省广初审与广汽裁决',
      icon: FileText,
      isSkippedForDirect: isDirectPost,
    },
    {
      num: 4,
      title: '4. 视频审核',
      short: '视频审核',
      sub: '成片初审与终审裁决',
      icon: Video,
    },
    {
      num: 5,
      title: '5. 发布上线',
      short: '发布上线',
      sub: '链接归档与数据分析',
      icon: Flag,
    },
  ];
};

export const STEP_DEFINITIONS = [
  {
    num: 1,
    title: '1. 达人筛选',
    short: '达人筛选',
    sub: '人选匹配与初筛确认',
    icon: UserCheck,
  },
  {
    num: 2,
    title: '2. Brief 审核',
    short: 'Brief 审核',
    sub: '卖点核准与签署',
    icon: Send,
  },
  {
    num: 3,
    title: '3. 脚本审核',
    short: '脚本审核',
    sub: '省广初审与广汽裁决',
    icon: FileText,
  },
  {
    num: 4,
    title: '4. 视频审核',
    short: '视频审核',
    sub: '成片初审与终审裁决',
    icon: Video,
  },
  {
    num: 5,
    title: '5. 发布上线',
    short: '发布上线',
    sub: '链接归档与数据分析',
    icon: Flag,
  },
];

export const ContentProgressBar: React.FC<ContentProgressBarProps> = ({ content }) => {
  const currentStep = getContentStepNumber(content);
  const stepDefs = getStepDefinitionsForContent(content);

  const getStepStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
        <span className="flex items-center gap-1.5 text-slate-900">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>
            Content 履约进度流程 (阶段 {currentStep}/5)
            {content.category === '直发' && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                直发类型 (免脚本)
              </span>
            )}
          </span>
        </span>
        <span className="text-[11px] font-mono font-semibold text-slate-500">
          {currentStep === 5 ? '已达到发布与数据阶段' : `当前阶段：${stepDefs[currentStep - 1].title}`}
        </span>
      </div>

      {/* Progress Line & Step Nodes */}
      <div className="relative pt-1 pb-2">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-[8%] right-[8%] -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />

        {/* Active Progress Line Fill */}
        <div
          className="absolute top-1/2 left-[8%] -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / 4) * 84}%`,
          }}
        />

        {/* Step Circles Grid */}
        <div className="relative z-10 grid grid-cols-5 gap-2 text-center">
          {stepDefs.map((st) => {
            const status = getStepStatus(st.num);
            const Icon = st.icon;

            let circleBg = 'bg-white border-2 border-slate-300 text-slate-400';
            let titleColor = 'text-slate-400';
            let subColor = 'text-slate-400';

            if (status === 'completed') {
              circleBg = 'bg-emerald-500 border-2 border-emerald-600 text-white shadow-sm';
              titleColor = 'text-emerald-700 font-bold';
              subColor = 'text-emerald-600';
            } else if (status === 'current') {
              circleBg = 'bg-blue-600 border-2 border-blue-700 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-100';
              titleColor = 'text-blue-700 font-extrabold';
              subColor = 'text-blue-600';
            } else if (st.isSkippedForDirect) {
              circleBg = 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400';
              titleColor = 'text-slate-400 italic';
              subColor = 'text-slate-400';
            }

            return (
              <div key={st.num} className="flex flex-col items-center group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${circleBg}`}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[11px] mt-1.5 font-bold whitespace-nowrap leading-tight ${titleColor}`}>
                  {st.short}
                </span>
                <span className={`text-[9px] mt-0.5 whitespace-nowrap leading-none hidden sm:block ${subColor}`}>
                  {st.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Compact Inline Version specifically designed for table lists
export const ContentInlineProgressBar: React.FC<{ content: ContentItem }> = ({ content }) => {
  const currentStep = getContentStepNumber(content);
  const stepDefs = getStepDefinitionsForContent(content);

  const getStepStatus = (stepNum: number) => {
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-1 min-w-[240px] max-w-[300px] font-sans">
      {/* Top stage badge tag */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              currentStep === 5 ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-800">
            阶段 {currentStep}/5: {stepDefs[currentStep - 1].short}
          </span>
          {content.category === '直发' && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              直发
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {Math.round((currentStep / 5) * 100)}%
        </span>
      </div>

      {/* 5 Connected Step Nodes */}
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Bar */}
        <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />

        {/* Active Line Fill */}
        <div
          className="absolute top-1/2 left-2 -translate-y-1/2 h-0.5 bg-blue-600 z-0 transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / 4) * 100}%`,
          }}
        />

        {stepDefs.map((st) => {
          const status = getStepStatus(st.num);

          let nodeStyle = 'bg-white border border-slate-300 text-slate-400';
          if (status === 'completed') {
            nodeStyle = 'bg-emerald-600 border border-emerald-600 text-white shadow-2xs';
          } else if (status === 'current') {
            nodeStyle = 'bg-blue-600 border border-blue-600 text-white ring-2 ring-blue-100 shadow-sm';
          } else if (st.isSkippedForDirect) {
            nodeStyle = 'bg-slate-100 border border-dashed border-slate-300 text-slate-400';
          }

          return (
            <div key={st.num} className="relative z-10 flex flex-col items-center group" title={st.title}>
              <div
                className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-extrabold transition-all duration-200 ${nodeStyle}`}
              >
                {status === 'completed' ? <Check className="w-2.5 h-2.5" /> : st.num}
              </div>
              <span
                className={`text-[9px] mt-1 whitespace-nowrap leading-none ${
                  status === 'current'
                    ? 'font-extrabold text-blue-700'
                    : status === 'completed'
                    ? 'font-bold text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {st.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
