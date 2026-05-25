# 毕业合照网页应用

一个简洁优雅的毕业合照管理与展示平台，支持手动人脸标注、多用户管理、双重验证和离线导出功能。

## 功能特性

✅ **用户登录系统** - 支持多用户注册和登录，用户数据隔离
✅ **管理后台上传照片** - 支持图片上传，限制 10MB 以内
✅ **手动人脸标注** - 可视化绘制人脸框，支持拖拽调整和标注
✅ **姓名标注** - 为每个人脸框填写对应姓名
✅ **班长标注链接** - 生成独立的标注链接，支持多人协作标注
✅ **照片锁定与分享** - 确认后锁定照片，生成 12 位随机访问码
✅ **双重验证机制** - 可设置查看密码，需密码 + 姓名验证才能访问
✅ **名单模式** - 显示姓名列表，点击高亮对应头像
✅ **离线导出功能** - 锁定后可导出为zip包，包含离线查看器
✅ **隐私保护** - 随机码无法猜测，未锁定照片不可访问

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: Express.js + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **身份验证**: JWT (jsonwebtoken)
- **状态管理**: Zustand
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
- 前端: http://localhost:5173/
- 后端 API: http://localhost:3002/

### 生产构建

```bash
# 构建项目
npm run build
```

## 使用流程

### 1. 账号注册与登录

访问 http://localhost:5173/ 进入首页，首次使用需要注册账号：
- 输入用户名和密码注册
- 使用注册的账号登录管理后台

### 2. 管理后台操作

访问 http://localhost:5173/admin 进入管理后台

#### 上传照片
1. 点击右上角"上传照片"按钮
2. 选择毕业合照
3. 系统自动跳转至标注页面

#### 标注人脸
1. 点击照片上的位置添加人脸框
2. 拖拽调整人脸框位置和大小
3. 为每个人脸输入姓名
4. 点击"保存"按钮

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

## 目录结构

```
/workspace
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── pages/              # 页面组件
│   ├── stores/             # Zustand 状态管理
│   ├── api/                # API 客户端
│   └── types/              # TypeScript 类型定义
├── api/                    # 后端 API
│   ├── routes/             # Express 路由
│   ├── repositories/       # 数据库操作
│   ├── models/             # 数据模型
│   └── utils/              # 工具函数
├── uploads/                # 上传文件存储 (git忽略)
├── data/                   # SQLite 数据库 (git忽略)
└── shared/                 # 共享类型定义
```

## API 接口

### 身份验证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 照片管理

- `POST /api/photos/upload` - 上传照片
- `GET /api/photos` - 获取照片列表（当前用户）
- `GET /api/photos/:id` - 获取照片详情
- `PUT /api/photos/:id/lock` - 锁定照片
- `PUT /api/photos/:id/unlock` - 解锁照片
- `PUT /api/photos/:id/display-name` - 更新显示名称
- `PUT /api/photos/:id/view-code` - 设置查看密码
- `PUT /api/photos/:id/annotate-view-code` - 设置标注密码
- `PUT /api/photos/:id/regenerate-annotate-code` - 重置标注链接
- `GET /api/photos/:id/export` - 导出照片为zip
- `DELETE /api/photos/:id` - 删除照片

### 人脸标注

- `POST /api/photos/faces` - 创建人脸标注
- `PUT /api/photos/faces/:id` - 更新人脸标注
- `DELETE /api/photos/faces/:id` - 删除人脸标注

### 公开访问

- `POST /api/photos/public/verify` - 双重验证获取照片
- `GET /api/photos/public/:code` - 通过访问码获取照片（无密码时）
- `POST /api/photos/annotate/verify` - 验证标注链接
- `GET /api/photos/annotate/:code` - 通过标注码获取照片（无密码时）

## 隐私保护机制

1. **用户隔离**: 不同用户的数据完全隔离，无法互相访问
2. **随机码生成**: 使用 12 位不含混淆字符的随机码
3. **双重验证**: 可设置查看密码，需密码 + 本人姓名验证
4. **访问控制**: 未锁定照片无法通过前台访问
5. **数据加密**: 密码使用bcrypt加密存储

## 部署说明

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 生产部署

1. 构建前端：`npm run build`
2. 配置环境变量（可选）
3. 使用 PM2 或类似工具启动后端服务
4. 配置 Nginx 反向代理

### 注意事项

- `data/` 和 `uploads/` 目录需要写入权限
- 建议配置 HTTPS 保护用户数据
- 定期备份数据库文件

## 许可证

MIT License
