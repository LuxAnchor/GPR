# src 目录说明

⚠️ **重要提示**：`src/` 目录已被排除在 Next.js 构建之外

## 原因

`srd/` 目录包含原始 Vite + React 代码，使用了 `react-router-dom`。  
Next.js 使用 App Router，不兼容这些代码，因此已排除。

## 当前项目结构

```
GPR_vercel/
├── app/           # ✅ Next.js App Router（当前使用）
│   ├── api/      # API Routes（后端）
│   ├── layout.tsx
│   └── page.tsx
├── lib/           # ✅ 工具库
├── src/           # ❌ 已排除（备份原始代码）
├── public/        # 静态资源
└── shared/        # 共享类型
```

## 功能状态

### ✅ 已完成
- 所有 API Routes
- 数据库集成
- 文件存储集成
- 基础首页
- 用户认证

### ⏳ 待完成
- 管理后台页面
- 照片上传页面
- 人脸标注功能
- 公开查看页面

## 继续开发

如需继续开发前端，您有两个选择：

### 选项 A：完成 Next.js 迁移
将 `src/` 中的组件逻辑迁移到 `app/` 目录的页面中。

### 选项 B：保留 Vite 版本
使用 `main` 分支的原始代码，在本地运行。

## 备份

原始 Vite 代码已备份在此仓库的 `main` 分支中。
