import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  UserCheck,
  Package,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Building2,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface BriefExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BriefExampleModal: React.FC<BriefExampleModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exampleText = `【省广标准 Brief 提报范例参考】
1. 达人画像与商务：
- 达人：serjcraft (Tiktok / 6.3万粉丝 / 汽车创作者 / 俄罗斯)
- 合作模式：二创 / 合作预算：¥15,000 / 投流配合度：愿意辅助投流
- 历史均值：平均播放 550,000 | 平均互动 16,000

2. 创作建议与核心诉求：
重点以中国制造产业深度解析，汽车工厂便携溯源、区域市场产品力反差对比为切入视角，自然植入广汽国际全球化出海布局、智能制造硬核实力与全球市场产品竞争力。通过真实实测与细节镜头展现整车装配品质与座舱质感，带动评论区对中国汽车品牌的正向口碑讨论。

3. 素材提供清单：
- 3000万下线仪式高光简剪
- M8 PHEV 旗舰车型快剪
- 超级工厂自动化快剪
- 活动现场海外专区车画面
- 现场全流程视频

4. 预估指标：
- 预估播放：25,000+ | 预估互动：500+ | 预估 CPC：¥0.60
- 在线 Brief 表格：https://docs.qq.com/sheet/serjcraft-brief-standard`;

  const handleCopy = () => {
    navigator.clipboard.writeText(exampleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Brief 提报标准范例参考 (Standard Example)
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                只读参考 · 不覆盖当前输入
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              省广向广汽国际提报达人 Brief 方案时的标准填写规范与数据示例
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: KOL Profile & Business */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                1. 达人画像与账号指标 (KOL Profile & Metrics)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                Tiktok · 俄罗斯
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">达人昵称</span>
                <span className="font-bold text-slate-900">serjcraft</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">粉丝量 / 量级</span>
                <span className="font-bold text-slate-900">6.3万 (中腰部)</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">账号属性 / 分类</span>
                <span className="font-bold text-slate-900">个人创作者 / 汽车</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">合作形式</span>
                <span className="font-bold text-indigo-600">二创 (Secondary)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">平均播放量</span>
                <span className="font-bold font-mono text-slate-900">550,000</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">平均互动量</span>
                <span className="font-bold font-mono text-slate-900">16,000</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">合作预算</span>
                <span className="font-bold font-mono text-emerald-600">¥15,000</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[11px] text-slate-400 block mb-0.5">投流配合度</span>
                <span className="font-bold text-purple-700">愿意辅助投流</span>
              </div>
            </div>
          </div>

          {/* Section 2: Creative Direction */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              2. 创作建议与核心诉求 (Creative Direction)
            </span>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 text-xs leading-relaxed text-slate-800">
              重点以中国制造产业深度解析，汽车工厂便携溯源、区域市场产品力反差对比为切入视角，自然植入广汽国际全球化出海布局、智能制造硬核实力与全球市场产品竞争力。通过真实实测与细节镜头展现整车装配品质与座舱质感，带动评论区对中国汽车品牌的正向口碑讨论。
            </div>
          </div>

          {/* Section 3: Material Checklist */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                3. 本活动素材提供清单 (Campaign Materials Checklist)
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">已勾选 5 项官方物料</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                '3000万下线仪式高光简剪',
                'M8 PHEV 车型快剪',
                '超级工厂自动化快剪',
                '活动现场海外专区车画面',
                '现场全流程视频',
              ].map((m, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Performance Estimation & Docs */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              4. 预估表现指标与在线附件 (Estimation & Docs)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-[11px] text-slate-400 block">预估播放量</span>
                <span className="font-bold font-mono text-indigo-600 text-sm">25,000+</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-[11px] text-slate-400 block">预估互动量</span>
                <span className="font-bold font-mono text-emerald-600 text-sm">500+</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-center">
                <span className="text-[11px] text-slate-400 block">预估 CPC</span>
                <span className="font-bold font-mono text-cyan-600 text-sm">¥0.60</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">在线 Brief 附件表格：</span>
                <span className="text-slate-800 font-mono">https://docs.qq.com/sheet/serjcraft-brief-standard</span>
              </div>
              <span className="text-indigo-600 text-[11px] font-semibold flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                示例链接
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">已复制范例内容文本</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>复制范例文字参考</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            关闭参考窗口
          </button>
        </div>
      </div>
    </div>
  );
};
