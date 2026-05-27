# 毕业合照网页应用 - Vercel 版本

一个简洁优雅的毕业合照管理与展示平台，支持手动人脸标注、多用户管理、双重验证和离线导出功能。已完整适配 Vercel 部署环境。

## 功能特性

✅ **用户登录系统** - 支持多用户注册和登录，用户数据隔离
✅ **管理后台上传照片** - 支持图片上传，限制 10MB 以内
✅ **手动人脸标注** - 可视化绘制人脸框，支持拖拽调整和标注
✅ **姓名标注** - 为每个人脸框填写对应姓名
✅ **班长标注链接** - 生成独立的标注链接，支持多人协作标注
✅ **照片锁定与分享** - 确认后锁定照片，生成 12 位随机访问码
✅ **双重验证机制** - 可设置查看密码，需密码 + 姓名验证才能访问
✅ **名单模式** - 显示姓名列表，点击高亮对应头像
✅ **点名功能** - 支持搜索姓名，快速定位对应头像
✅ **离线导出功能** - 锁定后可导出为zip包，包含离线查看器
✅ **隐私保护** - 随机码无法猜测，未锁定照片不可访问

## 最新更新

### 2026-05-27
- ✅ 添加导出按钮状态提示 - 点击后显示"导出中..."，按钮禁用防止重复点击
- ✅ 添加保存进度显示 - 标注保存时显示进度（如 "保存中 3/48"）
- ✅ 标记链接页面添加保存进度 - 公共标注页面也支持进度显示

### 2026-05-26
- ✅ 修复人脸框位置问题 - 根据照片缩放时人脸框位置自动调整
- ✅ 修复导出文件名编码问题 - 使用纯ASCII文件名避免HTTP头编码问题
- ✅ 优化离线HTML显示逻辑 - 默认隐藏框，点击才显示高亮
- ✅ 添加显示全部/隐藏全部功能 - 名单模式下可批量显示
- ✅ 修复照片锁定API问题 - 支持islocked参数
- ✅ Vercel Blob配置优化 - 移除storeId参数，使用公共模式

## 技术栈

- **前端**: Next.js 15 + React 18 + TypeScript + TailwindCSS
- **后端**: Next.js App Router + Serverless Functions
- **数据库**: Neon PostgreSQL
- **身份验证**: JWT (jsonwebtoken)
- **文件存储**: Vercel Blob (公共模式)
- **图标**: Lucide React
- **文件压缩**: JSZip

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用启动后：
- 应用: http://localhost:3000/

### 生产构建

```bash
# 构建项目
npm run build
```

## 使用流程

### 1. 账号注册与登录

访问 http://localhost:3000/ 进入首页，首次使用需要注册账号：
- 输入用户名和密码注册
- 使用注册的账号登录管理后台

### 2. 管理后台操作

访问 http://localhost:3000/admin 进入管理后台

#### 上传照片
1. 点击右上角"上传照片"按钮
2. 选择毕业合照
3. 系统自动跳转至标注页面

#### 标注人脸
1. 点击照片上的位置添加人脸框
2. 为每个人脸输入姓名
3. 点击"保存"按钮

#### 班长标注协作
1. 在照片列表点击"复制标注链接"
2. 将链接分享给班长
3. 班长可通过链接进行标注（可设置标注密码）

#### 设置密码保护
1. 点击"设置查看密码"为照片添加访问密码
2. 设置后查看需要输入密码 + 本人姓名双重验证
3. 也可设置标注密码保护标注链接

#### 锁定与分享
1. 在照片列表点击"锁定"按钮确认标注完成
2. 点击"复制查看链接"获取访问地址
3. 点击"导出"按钮下载离线zip包

### 3. 前台展示

学生或家长打开分享的链接：

- 输入密码和姓名（如设置了密码）
- 点击任意头像显示对应姓名
- 点击右上角"切换名单模式"查看完整名单
- 点击名单条目高亮对应头像

### 4. 离线查看

解压导出的zip包：
1. 双击打开 `index.html`
2. 支持离线查看所有功能
3. 点击头像或名单查看对应人员
4. 点名功能支持搜索姓名快速定位
5. 点击"显示全部"按钮显示所有人脸框

## 离线查看器功能

- ✅ **头像点击 → 高亮对应人脸和姓名
- ✅ **名单点击 → 高亮对应头像和框
- ✅ **点名功能** → 搜索姓名快速定位
- ✅ **显示全部** → 显示所有人脸框和标签
- ✅ **隐藏全部** → 只保留点击高亮
- ✅ **响应式** → 支持不同屏幕尺寸
- ✅ **缩放适配** → 人脸框随照片缩放自动调整

## 目录结构

```
/workspace/GPR_vercel
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台页面
│   │   ├── photo/[id]/annotate/  # 标注页面
│   │   └── page.tsx       # 照片列表
│   ├── annotate/[code]/   # 公开标注页面
│   ├── photo/[code]/      # 公开查看页面
│   ├── login/             # 登录页面
│   ├── api/               # API Routes
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── lib/                   # 工具函数
│   ├── auth.ts            # JWT 认证
│   ├── db.ts              # 数据库连接
│   ├── init-db.ts         # 数据库初始化
│   ├── storage.ts         # Vercel Blob 存储
│   └── utils.ts           # 工具函数
├── shared/                # 共享类型定义
├── public/                # 静态资源
├── next.config.js         # Next.js 配置
├── tailwind.config.js     # TailwindCSS 配置
├── package.json           # 项目依赖
└── vercel.json            # Vercel 部署配置
```

## API 接口

### 身份验证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 照片管理

- `GET /api/photos` - 获取照片列表（当前用户）
- `POST /api/photos` - 上传照片
- `GET /api/photos/:id` - 获取照片详情
- `PUT /api/photos/:id` - 更新照片（锁定、解锁、名称、密码）
- `DELETE /api/photos/:id` - 删除照片
- `GET /api/photos/:id/export` - 导出照片为zip

### 人脸标注

- `POST /api/photos/faces` - 创建人脸标注
- `PUT /api/photos/faces/:id` - 更新人脸标注
- `DELETE /api/photos/faces/:id` - 删除人脸标注

### 公开访问

- `GET /api/photos/public` - 通过访问码获取照片（无密码时）
- `POST /api/photos/public` - 双重验证获取照片
- `GET /api/photos/annotate` - 通过标注码获取照片（无密码时）
- `POST /api/photos/annotate` - 验证标注链接

## 隐私保护机制

1. **用户隔离**: 不同用户的数据完全隔离，无法互相访问
2. **随机码生成**: 使用 12 位不含混淆字符的随机码
3. **双重验证**: 可设置查看密码，需密码 + 本人姓名验证
4. **访问控制**: 未锁定照片无法通过前台访问
5. **数据加密**: 密码使用bcrypt加密存储
6. **公共存储**: 使用 Vercel Blob 公共模式

## 部署说明

### 环境要求

- Node.js 18+
- npm 或 pnpm

### Vercel 部署

1. **创建云资源**
   - Neon数据库：https://neon.tech
   - Vercel Blob：https://vercel.com/storage

2. **配置环境变量**
   在 Vercel 项目设置中添加：
   - `DATABASE_URL` - Neon PostgreSQL 连接字符串
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob 访问令牌
   - `JWT_SECRET` - JWT 签名密钥

3. **部署**
   - 连接 GitHub 仓库
   - 选择 `vercel` 分支
   - 自动部署

4. **初始化数据库**
   部署成功后访问 `/api/init` 端点

详细说明请查看：
- 📖 [快速开始指南](./QUICKSTART.md)
- 📖 [详细部署文档](./DEPLOY.md)

## 项目版本

| 文件夹 | 用途 | 状态 |
|--------|------|------|
| `GPR_git/` | Git备份，原始Vite版本 | ✅ 完整 |
| `GPR_vercel/` | Vercel适配版本 | ✅ 完整 |

## 许可证

MIT License
