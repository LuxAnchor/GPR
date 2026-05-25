# Vercel 部署指南

## 准备工作

### 1. 注册Vercel账号
访问 https://vercel.com 注册账号（推荐使用GitHub账号登录）

### 2. 创建Neon数据库
Vercel Postgres已迁移到Neon，需要单独创建：

1. 访问 https://neon.tech 注册账号
2. 创建一个新项目
3. 复制数据库连接字符串（DATABASE_URL）

### 3. 创建Vercel Blob存储
1. 在Vercel项目中，进入Storage标签页
2. 创建新的Blob存储
3. 复制BLOB_READ_WRITE_TOKEN

## 部署步骤

### 方式一：从GitHub部署（推荐）

1. **准备代码**
   ```bash
   cd GPR_vercel
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到GitHub**
   - 在GitHub上创建新仓库
   - 推送代码到仓库

3. **导入Vercel**
   - 访问 https://vercel.com/new
   - 导入GitHub仓库
   - Vercel会自动检测为Next.js项目

4. **配置环境变量**
   在Vercel项目设置中添加以下环境变量：
   - `DATABASE_URL` - Neon数据库连接字符串
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob访问令牌
   - `JWT_SECRET` - JWT密钥（建议使用随机字符串）

5. **部署**
   - 点击Deploy开始部署
   - 等待构建完成

### 方式二：使用Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd GPR_vercel
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add DATABASE_URL
   vercel env add BLOB_READ_WRITE_TOKEN
   vercel env add JWT_SECRET
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 环境变量说明

### DATABASE_URL
Neon PostgreSQL数据库连接字符串，格式：
```
postgresql://username:password@host/database?sslmode=require
```

### BLOB_READ_WRITE_TOKEN
Vercel Blob存储的访问令牌，用于上传和读取文件。

### JWT_SECRET
JWT令牌加密密钥，用于用户认证。建议使用至少32位的随机字符串。

## 数据库初始化

首次部署后，API Routes会自动创建必要的表结构。确保访问一次API端点以触发初始化。

## 常见问题

### 1. 数据库连接失败
- 检查DATABASE_URL是否正确
- 确认数据库允许Vercel的IP地址访问
- 检查Neon的连接限制

### 2. 文件上传失败
- 确认BLOB_READ_WRITE_TOKEN有效
- 检查Blob存储配额
- 查看Vercel函数日志

### 3. 部署失败
- 检查package.json的构建命令
- 确认所有依赖正确安装
- 查看构建日志定位问题

## 免费额度说明

### Vercel Hobby
- ✅ 前端部署：无限
- ✅ Serverless Functions：100小时/月
- ✅ 带宽：100GB/月
- ⚠️ 无持久化存储（使用云数据库）

### Neon Free Tier
- ✅ 0.5GB存储
- ✅ 无限数据库
- ⚠️ 每日100连接限制
- ⚠️ 无并发连接池

### Vercel Blob
- ✅ 5GB存储
- ✅ 无限读取
- ⚠️ 写入受限（根据套餐）

## 后续维护

### 更新代码
1. 推送代码到GitHub
2. Vercel会自动重新部署
3. 或使用`vercel --prod`手动部署

### 监控
- 在Vercel Dashboard查看使用统计
- 设置告警通知
- 查看函数执行日志

### 数据库备份
- Neon提供自动备份
- 可手动导出数据
- 建议定期备份重要数据
