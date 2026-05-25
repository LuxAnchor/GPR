# 快速开始指南

## 开发环境

### 1. 克隆仓库

```bash
git clone <your-repository>
cd GPR_vercel
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
DATABASE_URL=postgresql://...  # 你的 Neon 数据库连接字符串
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...  # 你的 Vercel Blob 令牌
JWT_SECRET=your-super-secret-key-here  # 至少 32 位随机字符串
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 5. 初始化数据库

访问 http://localhost:3000/api/init 初始化数据库表结构。

## 生产部署

### 1. 在 Vercel 上部署

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. 选择 `vercel` 分支
4. 配置环境变量：
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `JWT_SECRET`
5. 点击 Deploy

### 2. 部署后初始化

部署成功后，访问 `https://your-app.vercel.app/api/init` 初始化数据库。

## 使用流程

### 管理后台

1. 注册/登录账号
2. 上传毕业合照
3. 点击照片进行人脸标注
4. 为每个人脸输入姓名
5. 保存标注
6. 锁定照片
7. 分享链接或导出

### 公开查看

1. 打开分享的链接
2. 输入密码和姓名（如设置）
3. 点击头像查看姓名
4. 切换到名单模式查看所有人员

### 班长协作标注

1. 复制标注链接
2. 分享给班长
3. 班长通过链接添加/修改标注
4. 完成后管理员锁定照片

## 常见问题

### 图片无法上传？

- 检查文件大小不超过 10MB
- 确认 BLOB_READ_WRITE_TOKEN 正确配置
- 查看浏览器控制台错误

### 数据库错误？

- 检查 DATABASE_URL 是否正确
- 确认数据库已初始化（访问 /api/init）
- 查看 Neon 控制台连接状态

### 部署失败？

- 检查 package.json 中的依赖
- 确认 TypeScript 编译通过
- 查看 Vercel 构建日志

## 下一步

- 阅读 [README.md](./README.md) 了解完整功能
- 查看 [DEPLOY.md](./DEPLOY.md) 了解详细部署步骤
- 查看 [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) 了解迁移状态
