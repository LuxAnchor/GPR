# 毕业合照管理系统 - Vercel适配版本

## ⚠️ 重要说明

此版本正在从 **Vite + Express** 迁移到 **Next.js + Vercel Serverless**，部分前端功能待完成。

### ✅ 已完成
- **后端API** - 所有API Routes已重构为Vercel Serverless Functions
- **数据库** - 已集成Neon PostgreSQL
- **文件存储** - 已集成Vercel Blob
- **认证系统** - JWT认证已适配
- **基础页面** - 首页和登录页面已创建

### ⏳ 进行中
- **前端管理后台** - 正在迁移
- **照片标注功能** - 正在迁移
- **公开查看页面** - 正在迁移

---

## 🚀 快速开始

### 前提条件
- Node.js 18+
- Vercel账号
- Neon数据库账号

### 部署步骤

1. **创建云资源**
   - Neon数据库：https://neon.tech
   - Vercel Blob：https://vercel.com/storage

2. **配置环境变量**
   ```bash
   DATABASE_URL=postgresql://...
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   JWT_SECRET=your-secret-key
   ```

3. **部署**
   ```bash
   cd GPR_vercel
   vercel
   ```

4. **初始化数据库**
   访问 `/api/init` 端点

详细说明请查看：
- 📖 [快速开始指南](./QUICKSTART.md)
- 📖 [详细部署文档](./DEPLOY.md)
- 📖 [迁移进度](./MIGRATION_STATUS.md)

---

## 📁 两个项目版本

| 文件夹 | 用途 | 状态 |
|--------|------|------|
| `GPR_git/` | Git备份，原始Vite版本 | ✅ 完整 |
| `GPR_vercel/` | Vercel适配版本 | ⏳ 开发中 |

---

## 🎯 当前任务

### 优先级1（必须）
- [x] API Routes重构
- [x] 数据库集成
- [x] 文件存储集成
- [ ] 完整前端迁移
- [ ] 测试所有功能

### 优先级2（优化）
- [ ] 添加加载状态
- [ ] 错误处理优化
- [ ] 用户体验改进

---

## 📞 支持

如遇问题，请查看：
1. QUICKSTART.md - 快速开始
2. DEPLOY.md - 部署指南
3. MIGRATION_STATUS.md - 迁移详情

---

**最后更新：** 2024年
**维护者：** Your Name
