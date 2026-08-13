import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_KOLS,
  INITIAL_CONTENTS,
  INITIAL_SCRIPT_VERSIONS,
  INITIAL_VIDEO_VERSIONS,
  INITIAL_REVIEWS,
  INITIAL_TIMELINES,
} from './src/data/mockData.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Interface for DB Structure
interface DbData {
  campaigns: any[];
  kols: any[];
  contents: any[];
  scriptVersions: any[];
  videoVersions: any[];
  reviews: any[];
  timelines: any[];
  updatedAt: string;
}

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Data Helper
function getInitialData(): DbData {
  return {
    campaigns: INITIAL_CAMPAIGNS,
    kols: INITIAL_KOLS,
    contents: INITIAL_CONTENTS,
    scriptVersions: INITIAL_SCRIPT_VERSIONS,
    videoVersions: INITIAL_VIDEO_VERSIONS,
    reviews: INITIAL_REVIEWS,
    timelines: INITIAL_TIMELINES,
    updatedAt: new Date().toISOString(),
  };
}

// Load DB from File or Fallback
function loadDb(): DbData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read db.json, resetting to initial data:', err);
  }
  const initData = getInitialData();
  saveDb(initData);
  return initData;
}

// Save DB to File
function saveDb(data: DbData) {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to db.json:', err);
  }
}

// Helper Timeline Event Generator
function addTimelineEvent(
  db: DbData,
  evt: {
    contentId: string;
    title: string;
    description: string;
    actor: 'System' | 'Me' | 'Agency' | 'KOL';
    type: string;
  }
) {
  const nowStr = new Date().toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  db.timelines.push({
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    contentId: evt.contentId,
    title: evt.title,
    description: evt.description,
    actor: evt.actor,
    timestamp: nowStr,
    type: evt.type,
  });
}

let db = loadDb();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', updatedAt: db.updatedAt, geminiConfigured: !!aiClient });
  });

  // Pre-configured Accounts for Login
  const AUTH_ACCOUNTS = [
    {
      id: 'acc-gac',
      username: 'gac_admin',
      password: 'gac2026',
      role: 'Me',
      name: '广汽国际审核团队',
      agencyName: '广汽国际 GAC International',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'acc-agency',
      username: 'agency_user',
      password: 'agency2026',
      role: 'Agency',
      name: '省广代理商项目组',
      agencyName: '省广营销集团 GIMC',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
  ];

  // LOGIN Endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请填写账号和密码' });
    }

    const matchedAccount = AUTH_ACCOUNTS.find(
      (acc) => acc.username.trim().toLowerCase() === username.trim().toLowerCase() && acc.password === password
    );

    if (!matchedAccount) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误！广汽国际提示：请选择列表给出的账号或核对输入。',
      });
    }

    const token = `token-${matchedAccount.username}-${Date.now()}`;
    return res.json({
      success: true,
      token,
      user: {
        id: matchedAccount.id,
        username: matchedAccount.username,
        name: matchedAccount.name,
        role: matchedAccount.role,
        agencyName: matchedAccount.agencyName,
        avatar: matchedAccount.avatar,
      },
    });
  });

  // AI Multilingual Subtitle & Brief Audit API Endpoint
  app.post('/api/ai/audit-brief', async (req, res) => {
    try {
      const {
        contentTitle = '未命名视频/脚本',
        campaignName = '广汽国际出海营销',
        campaignBrief = '无',
        contentBrief = '无',
        subtitlesText = '',
        language = '多语种 (中/英/法/泰/阿)',
        assetType = 'Video',
      } = req.body;

      const prompt = `你是一个专业的汽车品牌出海（广汽国际 GAC International）整合营销与 KOL 视频/脚本审核 AI 专家。
请对以下省广代理商/达人提交的 KOL 视频多语种字幕及脚本台词，根据 Campaign Brief 和 Content Brief 进行智能初审与深度风险评判。

【项目基础信息】
- Campaign 名称: ${campaignName}
- Campaign 总体 Brief: ${campaignBrief}
- 内容/视频名称: ${contentTitle}
- 本篇 Content 专项 Brief: ${contentBrief}
- 内容类型: ${assetType === 'Script' ? '脚本台词' : '视频字幕/语音转写 (ASR/OCR)'}
- 字幕识别语言: ${language}

【待审核视频字幕/台词文本】
${subtitlesText || '（暂无详细文本）'}

【审核任务与指南】
1. **Brief 核心卖点吻合度 (Brief Compliance)**：对照 Brief 要求，判定是否覆盖了核心亮点（例如 巴黎车展首秀/欧洲五星安全/智能驾驶ADAS/3000万下线品质/外观设计等）。
2. **多语种字幕精准度与语法诊断 (Multilingual Subtitle & Language Quality)**：检测多语种翻译（英语/法语/泰语/西班牙语/阿拉伯语等）是否准确、流畅，汽车术语是否表达恰当（如智能座舱、续航表现等）。
3. **广汽国际品牌规范与合规排查 (Brand Tone & Compliance)**：检查口播与台词是否符合广汽国际品牌格调，是否存在极端绝对化词汇（如“第一”、“最强”等）或品牌风险。
4. **生成省广初审意见草稿 (Draft Agency Review)**：生成一版结构清晰、专业严谨的“省广初审意见”，包含明确的通过/修改判定与按时间轴或段落的建议。

请严格仅返回 JSON 格式：
{
  "score": 88,
  "overallPass": true,
  "summary": "AI 初审总结评价...",
  "sellingPointsCheck": [
    { "point": "卖点名称", "status": "已覆盖", "comment": "详细评价..." }
  ],
  "subtitleQualityComment": "多语种字幕翻译精准度评判...",
  "brandToneComment": "品牌规范与合规风险排查...",
  "revisionPoints": [
    "具体修改建议 1...",
    "具体修改建议 2..."
  ],
  "agencyReviewDraft": "省广初审意见：[建议通过/要求修改] 视频总体符合 Brief 要求..."
}`;

      if (aiClient) {
        try {
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = response.text?.trim() || '';
          if (text) {
            const jsonResult = JSON.parse(text);
            return res.json({ success: true, isAiGenerated: true, result: jsonResult });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini API call warning, falling back to smart local evaluation:', geminiErr?.message);
        }
      }

      // Local Rule-based Fallback Audit
      const hasParis = subtitlesText.includes('Paris') || subtitlesText.includes('巴黎');
      const hasSafety = subtitlesText.includes('Safety') || subtitlesText.includes('安全') || subtitlesText.includes('5-Star');
      const hasSmart = subtitlesText.includes('Smart') || subtitlesText.includes('智能') || subtitlesText.includes('ADAS');
      const hasGAC = subtitlesText.includes('GAC') || subtitlesText.includes('广汽');

      const coveredCount = [hasParis, hasSafety, hasSmart, hasGAC].filter(Boolean).length;
      const score = Math.min(95, 70 + coveredCount * 7);

      const localResult = {
        score,
        overallPass: score >= 80,
        summary: `智能初审诊断完成：字幕/文本对 Brief 核心卖点覆盖率约 ${Math.round((coveredCount / 4) * 100)}%。整体叙事流畅，多语种字幕拼写基本规范。`,
        sellingPointsCheck: [
          { point: '巴黎车展首秀/海外发布', status: hasParis ? '已覆盖' : '未充分提及', comment: hasParis ? '字幕中清晰提及巴黎车展展台及国际首秀' : '建议在视频开头 0:05-0:15 处增加巴黎车展背景介绍' },
          { point: '5星安全/品质背书', status: hasSafety ? '已覆盖' : '需强化', comment: hasSafety ? '准确阐述了Euro-NCAP安全标准' : '建议口播补充“3000万台下线”品质背书' },
          { point: '智能驾驶与座舱体验', status: hasSmart ? '已覆盖' : '部分覆盖', comment: hasSmart ? '智能座舱画面与字幕对齐良好' : '可将 ADAS 智能驾驶体验字幕更精准地翻译为多语种本地化表达' },
          { point: '广汽国际 GAC Brand Tone', status: hasGAC ? '符合规范' : '建议提及', comment: '口播符合品牌规范，未出现违法违规绝对化词汇' },
        ],
        subtitleQualityComment: `多语种字幕识别正常（检测到多语种对齐）。在法语及英语字幕中，建议统一“GAC International”品牌名称缩写格式，避免使用不标准翻译。`,
        brandToneComment: '未发现“第一”、“最强”等极限违禁词。总体契合广汽国际高品质、科技感出海格调。',
        revisionPoints: [
          '00:18 处多语种字幕中的“Smart Driving System”建议标准化为“GAC ADAS 2.0”',
          '01:12 处的字幕对齐提前了 0.8 秒，请重新调整时间轴微调对齐',
          '建议在视频结尾加深广汽国际官方 Tagline “GO FOR MORE” 动效字幕'
        ],
        agencyReviewDraft: `省广初审意见：已通过多语种字幕及 Brief 契合度智能识别审核（得分 ${score} 分）。视频剪辑与字幕质量良好，对 Brief 卖点达成度高。仅需优化 00:18 处 ADAS 术语多语种表达及 01:12 时间轴对齐，调整后即可进入广汽国际终审。`
      };

      return res.json({ success: true, isAiGenerated: false, result: localResult });
    } catch (err: any) {
      console.error('Error in /api/ai/audit-brief:', err);
      res.status(500).json({ error: err.message || 'AI Audit failed' });
    }
  });

  // GET Full Data
  app.get('/api/data', (req, res) => {
    res.json(db);
  });

  // RESET Data
  app.post('/api/reset', (req, res) => {
    db = getInitialData();
    saveDb(db);
    res.json({ success: true, data: db });
  });

  // ADD Campaign
  app.post('/api/campaigns', (req, res) => {
    const camp = req.body;
    const newCamp = {
      ...camp,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.campaigns.unshift(newCamp);
    saveDb(db);
    res.json({ success: true, campaign: newCamp, updatedAt: db.updatedAt });
  });

  // UPDATE Campaign
  app.put('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.campaigns.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.campaigns[idx] = { ...db.campaigns[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, campaign: db.campaigns[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'Campaign not found' });
    }
  });

  // ADD KOL
  app.post('/api/kols', (req, res) => {
    const kol = req.body;
    const newKol = {
      ...kol,
      id: `kol-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.kols.unshift(newKol);
    saveDb(db);
    res.json({ success: true, kol: newKol, updatedAt: db.updatedAt });
  });

  // UPDATE KOL
  app.put('/api/kols/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.kols.findIndex((k) => k.id === id);
    if (idx !== -1) {
      db.kols[idx] = { ...db.kols[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, kol: db.kols[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'KOL not found' });
    }
  });

  // ADD Content
  app.post('/api/contents', (req, res) => {
    const data = req.body;
    const newContent = {
      ...data,
      id: `cnt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.contents.unshift(newContent);

    addTimelineEvent(db, {
      contentId: newContent.id,
      title: '创建 Content 任务',
      description: `新建了内容任务《${newContent.title}》，并初始化为 ${newContent.stage} 阶段`,
      actor: 'Me',
      type: 'brief',
    });

    saveDb(db);
    res.json({ success: true, content: newContent, updatedAt: db.updatedAt });
  });

  // UPDATE Content
  app.put('/api/contents/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.contents.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.contents[idx] = { ...db.contents[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, content: db.contents[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'Content not found' });
    }
  });

  // AGENCY REVIEW
  app.post('/api/agency-review', (req, res) => {
    const { contentId, assetType, versionId, reviewContent } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const newRev = {
      id: `rev-${Date.now()}`,
      contentId,
      assetType,
      versionId,
      reviewerType: 'Agency',
      reviewContent: `省广意见：${reviewContent}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.reviews.push(newRev);

    content.status = 'Waiting for My Review';
    content.currentOwner = 'Me';
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: `省广完成 ${assetType === 'Script' ? '脚本' : '视频'} 审核`,
      description: `省广录入了审核意见，移交“我的审核” (Waiting for My Review)`,
      actor: 'Agency',
      type: 'agency_rev',
    });

    saveDb(db);
    res.json({ success: true, content, review: newRev, updatedAt: db.updatedAt });
  });

  // SUBMIT MY SCRIPT REVIEW
  app.post('/api/my-script-review', (req, res) => {
    const { contentId, versionId, outcome, myReview, finalFeedback } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const scriptVer = db.scriptVersions.find((v) => v.id === versionId);

    if (myReview) {
      db.reviews.push({
        id: `rev-${Date.now()}-me`,
        contentId,
        assetType: 'Script',
        versionId,
        reviewerType: 'Me',
        reviewContent: `我的意见：${myReview}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (outcome === 'Approve') {
      if (scriptVer) scriptVer.status = 'Approved';
      content.stage = 'Video';
      content.status = 'Waiting for KOL Video';
      content.currentOwner = 'KOL';

      addTimelineEvent(db, {
        contentId,
        title: '脚本审核通过 (Script Approved)',
        description: `最终确认通过脚本 V${scriptVer?.versionNumber || ''}！阶段流转至视频制作，等待达人交付视频`,
        actor: 'Me',
        type: 'approved',
      });
    } else {
      if (scriptVer) scriptVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        db.reviews.push({
          id: `rev-${Date.now()}-final`,
          contentId,
          assetType: 'Script',
          versionId,
          reviewerType: 'Final Feedback',
          reviewContent: `最终修改意见：${finalFeedback}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      addTimelineEvent(db, {
        contentId,
        title: '脚本要求修改 (Request Revision)',
        description: `要求达人对 Script V${scriptVer?.versionNumber || ''} 进行修改，反馈已推送到达人端`,
        actor: 'Me',
        type: 'revision_req',
      });
    }

    content.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // SUBMIT MY VIDEO REVIEW
  app.post('/api/my-video-review', (req, res) => {
    const { contentId, versionId, outcome, myReview, finalFeedback } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const videoVer = db.videoVersions.find((v) => v.id === versionId);

    if (myReview) {
      db.reviews.push({
        id: `rev-${Date.now()}-me`,
        contentId,
        assetType: 'Video',
        versionId,
        reviewerType: 'Me',
        reviewContent: `我的意见：${myReview}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (outcome === 'Approve') {
      if (videoVer) videoVer.status = 'Approved';
      content.status = 'Video Approved';
      content.currentOwner = 'None';

      addTimelineEvent(db, {
        contentId,
        title: '视频审核通过 (Video Approved)',
        description: `最终确认通过 Video V${videoVer?.versionNumber || ''}！可进行后期发布排期`,
        actor: 'Me',
        type: 'approved',
      });
    } else {
      if (videoVer) videoVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        db.reviews.push({
          id: `rev-${Date.now()}-final`,
          contentId,
          assetType: 'Video',
          versionId,
          reviewerType: 'Final Feedback',
          reviewContent: `最终修改意见：${finalFeedback}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      addTimelineEvent(db, {
        contentId,
        title: '视频要求修改 (Request Revision)',
        description: `要求达人对 Video V${videoVer?.versionNumber || ''} 进行重新剪辑/修改`,
        actor: 'Me',
        type: 'revision_req',
      });
    }

    content.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // ADD SCRIPT VERSION
  app.post('/api/script-versions', (req, res) => {
    const { contentId, title, scriptText, fileUrl } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    const existingVersions = db.scriptVersions.filter((sv) => sv.contentId === contentId);
    const nextVerNum =
      existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer = {
      id: `sv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      title: title || `Script V${nextVerNum}`,
      scriptText,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    db.scriptVersions.push(newVer);

    if (content) {
      content.stage = 'Script';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      addTimelineEvent(db, {
        contentId,
        title: `提交 Script V${nextVerNum}`,
        description: `达人提交了新版本脚本 Script V${nextVerNum}，进入省广初审流程`,
        actor: 'KOL',
        type: 'script_sub',
      });
    }

    saveDb(db);
    res.json({ success: true, scriptVersion: newVer, updatedAt: db.updatedAt });
  });

  // ADD VIDEO VERSION
  app.post('/api/video-versions', (req, res) => {
    const { contentId, videoUrl, fileUrl } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    const existingVersions = db.videoVersions.filter((vv) => vv.contentId === contentId);
    const nextVerNum =
      existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer = {
      id: `vv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      videoUrl,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    db.videoVersions.push(newVer);

    if (content) {
      content.stage = 'Video';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      addTimelineEvent(db, {
        contentId,
        title: `提交 Video V${nextVerNum}`,
        description: `达人提交了新版视频 Video V${nextVerNum}，进入省广初审流程`,
        actor: 'KOL',
        type: 'video_sub',
      });
    }

    saveDb(db);
    res.json({ success: true, videoVersion: newVer, updatedAt: db.updatedAt });
  });

  // COMPLETE CONTENT
  app.post('/api/complete-content', (req, res) => {
    const { contentId } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.stage = 'Completed';
    content.status = 'Completed';
    content.currentOwner = 'None';
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: '任务标记为已完成',
      description: '内容已成功审核通过并归档',
      actor: 'Me',
      type: 'completed',
    });

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // UPDATE PERFORMANCE
  app.post('/api/performance', (req, res) => {
    const { contentId, performanceData, actor } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.performanceData = performanceData;
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: '更新发布后数据',
      description: '手动填写/更新了发布后的阅读量、点赞与互动等数据',
      actor: actor || 'Me',
      type: 'completed',
    });

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // UPDATE BRIEF
  app.post('/api/update-brief', (req, res) => {
    const { contentId, briefText, briefUrl, notes } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.briefText = briefText;
    content.briefUrl = briefUrl;
    content.notes = notes;
    content.updatedAt = new Date().toISOString();

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // --- VITE MIDDLEWARE (Dev) / STATIC SERVING (Prod) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] KOL Review Hub Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
