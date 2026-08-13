# KOL Content Review Hub

面向广汽国际、省广代理商与 KOL 达人的内容审核协作系统。项目由 Google AI Studio 导出，现作为独立代码仓库维护，并使用 Codex 进行后续协作开发。

## 当前能力

- Campaign、达人与 Content 任务管理
- 脚本和视频多版本提交
- 省广初审、广汽国际终审及完整审核记录
- Brief 与素材归档
- 发布链接上传及发布后数据补录
- 视频终审后 1 天链接上传、3 天数据补录提醒
- Gemini 多语种字幕与 Brief 智能初审
- 广汽国际与省广两种演示角色视角

## 技术栈

- React 19 + TypeScript
- Vite 6
- Express
- Tailwind CSS 4
- Google Gen AI SDK
- JSON 文件数据存储（当前原型阶段）

## 本地运行

要求 Node.js 20 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run dev
```

默认地址为 <http://localhost:3000>。

如需使用 AI 初审，在 `.env.local` 中设置：

```env
GEMINI_API_KEY=your_key_here
APP_URL=http://localhost:3000
```

没有 `GEMINI_API_KEY` 时，除 AI 初审外的主要流程仍可运行。

## 常用命令

```bash
npm run dev      # 开发模式
npm run lint     # TypeScript 类型检查
npm run build    # 构建前端和服务端
npm start        # 运行构建产物
npm run clean    # 清理构建目录
```

## 数据说明

当前服务端使用 `data/db.json` 保存原型数据；浏览器端同时使用 localStorage 做快速交互与离线回退。生产化前应迁移到正式数据库并增加真实身份认证、权限校验、审计日志和备份策略。

系统中的 `gac_admin`、`agency_user` 及对应密码仅是公开演示数据，不应直接用于生产环境。

## Codex 协作

开发约定见 [AGENTS.md](./AGENTS.md)。推荐每项需求使用独立的 `codex/` 功能分支，通过 Pull Request 合并到 `main`。

## 来源

原始 AI Studio 项目：<https://aistudio.google.com/apps/931905a7-4bd5-4744-abe1-68db44538e91>

