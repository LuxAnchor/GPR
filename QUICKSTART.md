# 🚀 快速开始指南

## 项目状态

✅ **核心功能已完成Vercel适配**

### 已完成部分
- ✅ API Routes（后端）
- ✅ 数据库集成（Neon PostgreSQL）
- ✅ 文件存储（Vercel Blob）
- ✅ 基础页面结构

### 待完成部分
- ⏳ 完整的前端页面迁移（管理后台、标注页面等）

---

## 快速部署步骤

### 1️⃣ 创建云服务资源

#### Neon数据库
1. 访问 https://neon.tech
2. 注册账号并登录
3. 创建新项目
4. 复制连接字符串

#### Vercel Blob存储
1. 访问 https://vercel.com
2. 创建新项目
3. 进入Storage标签
4. 创建Blob存储
5. 复制访问令牌

### 2️⃣ 配置环境变量

在Vercel项目设置中添加：

```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
JWT_SECRET=your-32-char-secret-key
```

### 3️⃣ 部署

#### 方式A：GitHub部署
```bash
cd GPR_vercel
git init
git add .
git commit -m "Initial commit"
# 推送到GitHub，然后在Vercel导入
```

#### 方式B：Vercel CLI
```bash
npm i -g vercel
cd GPR_vercel
vercel
vercel env add DATABASE_URL
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add JWT_SECRET
vercel --prod
```

### 4️⃣ 初始化数据库

部署成功后，访问：
```
https://your-app.vercel.app/api/init
```

这将自动创建所有必要的数据库表。

### 5️⃣ 开始使用

1. 访问 https://your-app.vercel.app
2. 注册账号
3. 上传毕业合照
4. 标注人脸
5. 锁定并分享

---

## 📁 项目结构

```
GPR_vercel/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (后端)
│   │   ├── auth/         # 认证API
│   │   ├── photos/        # 照片API
│   │   └── init/          # 数据库初始化
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── lib/                    # 工具库
│   ├── db.ts              # 数据库连接
│   ├── auth.ts            # 认证工具
│   ├── storage.ts          # 文件存储
│   └── utils.ts            # 工具函数
├── src/                    # React组件（待迁移）
│   ├── components/        # UI组件
│   ├── pages/             # 页面组件
│   └── api/client.ts       # API客户端
├── public/                 # 静态资源
├── .env.example            # 环境变量模板
├── DEPLOY.md              # 详细部署文档
├── MIGRATION_STATUS.md     # 迁移进度
└── package.json
```

---

## ❓ 常见问题

### Q: 数据库连接失败
**A:** 检查DATABASE_URL格式是否正确，确保包含`?sslmode=require`

### Q: 文件上传失败
**A:** 确认BLOB_READ_WRITE_TOKEN有效，Blob存储有足够配额

### Q: 部署失败
**A:** 查看Vercel构建日志，确保所有环境变量已配置

### Q: 前端页面不工作
**A:** 当前核心功能已完成，前端迁移正在进行中

---

## 📚 更多文档

- **DEPLOY.md** - 详细部署指南
- **MIGRATION_STATUS.md** - 迁移进度详情

---

## 🎯 下一步

1. ✅ 部署到Vercel
2. ✅ 配置环境变量
3. ⏳ 等待前端迁移完成（或自行完成）
4. 🚀 开始使用

如需帮助，请查阅详细文档或提交Issue。
