import React, { useState } from 'react';
import { X, FileText, Upload, Sparkles, Loader2, Link as LinkIcon, CheckCircle, Bot, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface NewScriptVersionModalProps {
  isOpen: boolean;
  contentId: string;
  nextVersionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewScriptVersionModal: React.FC<NewScriptVersionModalProps> = ({
  isOpen,
  contentId,
  nextVersionNumber,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(`Script V${nextVersionNumber} (修改提交稿)`);
  const [scriptText, setScriptText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    // Create local preview object URL or data URL for direct opening
    const dummyUrl = URL.createObjectURL(file);
    setFileUrl(dummyUrl);

    // If it's a text file or readable file, try reading content
    const reader = new FileReader();
    reader.onload = async (event) => {
      const textContent = event.target?.result as string;
      if (textContent) {
        handleAiParse(textContent, file.name);
      }
    };
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else {
      // For binary docx/pdf, trigger AI parser using file name & mock doc
      handleAiParse(`[文件: ${file.name}] 广汽出海营销汽车评测脚本草稿`, file.name);
    }
  };

  // Trigger AI document formatting
  const handleAiParse = async (rawText?: string, fName?: string) => {
    setIsAiParsing(true);
    try {
      const res = await dataService.parseScriptDocWithAi({
        docRawText: rawText || scriptText,
        fileName: fName || uploadedFileName || 'Word脚本文档.docx',
        docUrl: fileUrl,
      });

      if (res.success && res.formattedScriptText) {
        setScriptText(res.formattedScriptText);
      }
    } catch (err) {
      console.error('AI parse script doc error:', err);
      // Fallback
      if (!scriptText) {
        setScriptText(`[00:00 - 00:15] 画面：巴黎车展 GAC 展台全景切入，展车外观滑轨镜头 | 口播：Bonjour! 欢迎来到 2026 巴黎车展 GAC 广汽展台！
[00:15 - 00:35] 画面：镜头切至智能座舱，中控双屏联动演示 | 口播：搭载 GAC ADAS 2.0 智能驾驶系统，欧洲路况平稳驾驶。
[00:35 - 00:55] 画面：安全车身结构展示与 Euro-NCAP 标牌 | 口播：欧洲五星安全品质，加上广汽 3000 万台全球下线品质背书。
[00:55 - 01:10] 画面：车辆驶入巴黎夕阳大道，尾部 Logo 动画 | 口播：Go For More! 开启全新出海智驾体验。`);
      }
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!scriptText.trim()) {
      setFormError('请填写脚本文本内容后再提交！');
      return;
    }

    setIsSubmitting(true);
    try {
      await dataService.addNewScriptVersion(contentId, title.trim(), scriptText.trim(), fileUrl.trim() || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError('提交失败：' + (err.message || '网络异常，请重试'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">省广提交新脚本版本：Script V{nextVersionNumber}</h3>
              <p className="text-[11px] text-blue-200">上传 Word/PDF 附件或直接填入脚本文案</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">脚本版本标题说明</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Document Upload Area */}
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Upload className="w-4 h-4 text-blue-600" />
                  上传脚本文档附件 (Word/DOCX/PDF/TXT) 或输入云文档链接
                </label>
                <p className="text-[11px] text-slate-500">上传后广汽国际可直接点击预览/下载原始文档</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 font-bold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5 text-xs transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>选择本地文档</span>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {uploadedFileName && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium truncate max-w-[320px]">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  已选择文档: <strong>{uploadedFileName}</strong>
                </span>
                <span className="text-emerald-600">广汽可直接打开</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="或输入飞书/钉钉/Google Doc 云文档公开链接 (https://...)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-[11px]"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Script Text area with AI auto format button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                脚本文本内容 (必填) *
              </label>

              <button
                type="button"
                onClick={() => handleAiParse()}
                disabled={isAiParsing}
                className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all disabled:opacity-50"
              >
                {isAiParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 整理排版中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>接入 AI 智能解析并整理格式</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={7}
              placeholder="例如：&#10;[00:00 - 00:15] 画面：巴黎车展展台... | 口播：Bonjour! 欢迎来到 2026 巴黎车展...&#10;[00:15 - 00:35] 画面：智能座舱演示... | 口播：搭载 GAC ADAS 2.0 智驾系统..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full px-3 py-2.5 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 leading-relaxed"
              required
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 space-y-1.5 text-[11px] text-blue-900">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>🤖 提交后自动触发 AI Agent 诊断机制：</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              提交后，系统将**自动调用 AI Agent** 严格匹配广汽国际 Campaign Brief。AI 将自动列出 **1、2、3 点与 Brief 未匹配/缺失的条款**，并在广汽审核工作台与详情页中实时向广汽团队呈现。
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Agent 正在审核提交...</span>
                </>
              ) : (
                <span>确认提交 Script V{nextVersionNumber}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

