# Next.js 迁移进度

## ✅ 已完成

### 1. 依赖安装
- [x] @neondatabase/serverless - PostgreSQL数据库
- [x] @vercel/blob - 文件存储
- [x] Next.js 15
- [x] React 18
- [x] 其他必要依赖

### 2. 配置文件
- [x] next.config.js - Next.js配置
- [x] tsconfig.json - TypeScript配置
- [x] package.json - 更新为Next.js脚本
- [x] vercel.json - Vercel部署配置

### 3. 库文件 (lib/)
- [x] lib/db.ts - Neon数据库连接
- [x] lib/auth.ts - JWT认证工具
- [x] lib/storage.ts - Vercel Blob存储
- [x] lib/utils.ts - 工具函数
- [x] lib/init-db.ts - 数据库初始化

### 4. API Routes (app/api/)
- [x] app/api/auth/register/route.ts - 用户注册
- [x] app/api/auth/login/route.ts - 用户登录
- [x] app/api/auth/me/route.ts - 获取当前用户
- [x] app/api/photos/route.ts - 照片列表和上传
- [x] app/api/photos/[id]/route.ts - 单个照片操作
- [x] app/api/photos/faces/route.ts - 创建人脸标注
- [x] app/api/photos/faces/[id]/route.ts - 更新/删除人脸标注
- [x] app/api/photos/public/route.ts - 公开访问照片
- [x] app/api/photos/annotate/route.ts - 标注链接访问
- [x] app/api/photos/[id]/export/route.ts - 导出功能
- [x] app/api/init/route.ts - 数据库初始化

### 5. 前端适配
- [x] src/api/client.ts - 更新API客户端

### 6. 文档
- [x] .env.example - 环境变量模板
- [x] DEPLOY.md - 部署指南

## ⏳ 进行中

### 7. Next.js App Router迁移
- [ ] 创建 app/layout.tsx - 根布局
- [ ] 创建 app/globals.css - 全局样式
- [ ] 创建 app/page.tsx - 首页
- [ ] 创建 app/login/page.tsx - 登录页
- [ ] 创建 app/admin/page.tsx - 管理后台
- [ ] 创建 app/photo/[code]/page.tsx - 公开查看页
- [ ] 创建 app/annotate/[code]/page.tsx - 标注页
- [ ] 创建 app/upload/page.tsx - 上传页

### 8. 组件迁移
- [ ] 迁移React组件到Next.js
- [ ] 处理图片加载（使用next/image）
- [ ] 路由适配

## 📋 注意事项

### 重要提示
由于项目从Vite+React迁移到Next.js App Router，前端代码需要较大改动：

1. **路由系统**：从react-router-dom改为Next.js App Router
2. **图片处理**：需要使用next/image替代普通img标签
3. **样式**：需要适配Tailwind CSS在Next.js中的使用
4. **布局**：需要创建layout.tsx根布局
5. **页面**：所有页面需要迁移到app目录下

### 建议方案

由于改动较大，有两种方案：

#### 方案A：继续完成迁移（推荐）
继续完成Next.js适配，完全迁移前端代码到App Router
预计时间：2-3小时
优势：完全适配Vercel，部署简单

#### 方案B：使用Next.js静态导出
保持React SPA模式，使用`output: 'export'`静态导出
限制：无法使用服务端API Routes
优势：改动较小

### 当前状态
项目核心功能已完成API Routes重构，前端适配需要额外工作。

## 🚀 部署前检查清单

1. [ ] 创建Neon数据库
2. [ ] 创建Vercel Blob存储
3. [ ] 配置环境变量
4. [ ] 完成前端迁移
5. [ ] 测试所有功能
6. [ ] 部署到Vercel

## 📞 获取帮助

- Vercel部署文档：https://vercel.com/docs
- Neon数据库：https://neon.tech/docs
- Next.js文档：https://nextjs.org/docs
