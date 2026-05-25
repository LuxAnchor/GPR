import { Router, type Request, type Response } from 'express';
import { photoRepository, faceRepository } from '../repositories/photoRepository.js';
import { upload } from '../utils/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import JSZip from 'jszip';
import { authenticateToken } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

router.post('/upload', authenticateToken, upload.single('photo'), (req: AuthRequest, res) => {
  try {
    if (!req.file || !req.user) {
      return res.status(400).json({ error: '请上传照片文件' });
    }

    const photo = photoRepository.create(
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.user.id
    );

    res.json({ id: photo.id, code: photo.code });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.sendStatus(401);
    const photos = photoRepository.findByUserIdWithFaces(req.user.id);
    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: '获取照片列表失败' });
  }
});

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const photo = photoRepository.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    const faces = faceRepository.findByPhotoId(photo.id);
    res.json({ ...photo, faces });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: '获取照片失败' });
  }
});

router.put('/:id/lock', authenticateToken, (req, res) => {
  try {
    const success = photoRepository.lock(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Lock photo error:', error);
    res.status(500).json({ error: '锁定照片失败' });
  }
});

router.put('/:id/unlock', authenticateToken, (req, res) => {
  try {
    const success = photoRepository.unlock(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Unlock photo error:', error);
    res.status(500).json({ error: '解锁照片失败' });
  }
});

router.put('/:id/display-name', authenticateToken, (req, res) => {
  try {
    const { displayName } = req.body;
    if (displayName === undefined) {
      return res.status(400).json({ error: '缺少 displayName 参数' });
    }
    const success = photoRepository.updateDisplayName(req.params.id, displayName);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Update display name error:', error);
    res.status(500).json({ error: '更新照片名称失败' });
  }
});

router.put('/:id/regenerate-annotate-code', authenticateToken, (req, res) => {
  try {
    const newCode = photoRepository.regenerateAnnotateCode(req.params.id);
    if (!newCode) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true, annotateCode: newCode });
  } catch (error) {
    console.error('Regenerate annotate code error:', error);
    res.status(500).json({ error: '重新生成标注链接失败' });
  }
});

// 设置查看验证码
router.put('/:id/view-code', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { viewCode } = req.body;
    // viewCode可以为null，代表移除验证码
    const success = photoRepository.setViewCode(req.params.id, viewCode || null);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Set view code error:', error);
    res.status(500).json({ error: '设置查看密码失败' });
  }
});

// 设置标注验证码
router.put('/:id/annotate-view-code', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { annotateViewCode } = req.body;
    // annotateViewCode可以为null，代表移除验证码
    const success = photoRepository.setAnnotateViewCode(req.params.id, annotateViewCode || null);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Set annotate view code error:', error);
    res.status(500).json({ error: '设置标注密码失败' });
  }
});

// 标注链接获取照片（带验证码验证）
router.post('/annotate/verify', (req, res) => {
  try {
    const { annotateCode, annotateViewCode } = req.body;
    const photo = photoRepository.verifyAnnotateViewCode(annotateCode, annotateViewCode || '');
    if (!photo) {
      return res.status(403).json({ error: '验证码错误或照片不存在' });
    }
    const faces = faceRepository.findByPhotoId(photo.id);
    res.json({ ...photo, faces });
  } catch (error) {
    console.error('Verify annotate photo error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// 原来的标注链接获取（保持向后兼容）
router.get('/annotate/:code', (req, res) => {
  try {
    const photo = photoRepository.findByAnnotateCode(req.params.code);
    
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    // 如果有验证码，要求使用verify接口
    if (photo.annotate_view_code) {
      return res.status(403).json({ error: '需要验证码，请使用验证接口' });
    }
    
    const faces = faceRepository.findByPhotoId(photo.id);
    res.json({ ...photo, faces });
  } catch (error) {
    console.error('Get annotate photo error:', error);
    res.status(500).json({ error: '获取照片失败' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const success = await photoRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '照片不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: '删除照片失败' });
  }
});

router.post('/faces', authenticateToken, (req, res) => {
  try {
    const { photoId, x, y, width, height, name } = req.body;
    
    if (!photoId || x === undefined || y === undefined || width === undefined || height === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const face = faceRepository.create(
      photoId,
      parseFloat(x),
      parseFloat(y),
      parseFloat(width),
      parseFloat(height),
      name || ''
    );
    
    res.json(face);
  } catch (error) {
    console.error('Create face error:', error);
    res.status(500).json({ error: '创建人脸标注失败' });
  }
});

router.put('/faces/:id', authenticateToken, (req, res) => {
  try {
    const { x, y, width, height, name } = req.body;
    
    const success = faceRepository.update(
      req.params.id,
      parseFloat(x),
      parseFloat(y),
      parseFloat(width),
      parseFloat(height),
      name || ''
    );
    
    if (!success) {
      return res.status(404).json({ error: '人脸标注不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update face error:', error);
    res.status(500).json({ error: '更新人脸标注失败' });
  }
});

router.delete('/faces/:id', authenticateToken, (req, res) => {
  try {
    const success = faceRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '人脸标注不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: '删除人脸标注失败' });
  }
});

// 公开照片双重验证
router.post('/public/verify', (req, res) => {
  try {
    const { code, viewCode, name } = req.body;
    
    // 首先验证查看密码
    const photo = photoRepository.verifyViewCode(code, viewCode || '');
    if (!photo) {
      return res.status(403).json({ error: '查看密码错误或照片不存在' });
    }
    
    // 检查是否已锁定
    if (!photo.islocked) {
      return res.status(403).json({ error: '照片尚未解锁，无法访问' });
    }
    
    // 获取所有标注的人脸
    const faces = faceRepository.findByPhotoId(photo.id);
    
    // 如果设置了查看密码，则需要验证名字
    if (photo.view_code) {
      if (!name) {
        return res.status(400).json({ error: '请输入姓名' });
      }
      // 检查名字是否在已标注的名单中
      const nameExists = faces.some(face => face.name && face.name.trim() === name.trim());
      if (!nameExists) {
        return res.status(403).json({ error: '姓名不在名单中' });
      }
    }
    
    res.json({ ...photo, faces });
  } catch (error) {
    console.error('Verify public photo error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// 生成离线HTML
function generateOfflineHTML(photo: any, faces: any[]): string {
  const sortedFaces = [...faces].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 30) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const facesData = JSON.stringify(sortedFaces);
  const photoData = JSON.stringify({
    display_name: photo.display_name || photo.originalname
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${photo.display_name || photo.originalname}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
        .face-tag {
            position: absolute;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            transform: translateX(-50%);
            white-space: nowrap;
        }
        .face-tag.highlight {
            background: rgba(239, 68, 68, 0.95);
            transform: translateX(-50%) scale(1.1);
            z-index: 100;
        }
        .face-box {
            position: absolute;
            border: 3px solid #3b82f6;
            border-radius: 4px;
            pointer-events: none;
        }
        .face-box.highlight {
            border-color: #ef4444;
            border-width: 4px;
            z-index: 100;
        }
        .name-item:hover {
            background-color: #dbeafe;
        }
        .name-item.highlight {
            background-color: #fef2f2;
            color: #dc2626;
            font-weight: 600;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">${photo.display_name || photo.originalname}</h1>
                <button id="toggleMode" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    切换名单模式
                </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="photoContainer" class="relative inline-block">
                    <img id="photo" src="photo.jpg" alt="毕业照" />
                </div>
            </div>
            
            <div id="nameList" class="mt-6 hidden">
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">名单</h2>
                    <div id="nameGrid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const faces = ${facesData};
        const photoData = ${photoData};
        let showNameList = false;
        let highlightedFaceId = null;
        
        function init() {
            renderFaces();
            renderNameList();
            setupEventListeners();
        }
        
        function renderFaces() {
            const container = document.getElementById('photoContainer');
            const img = document.getElementById('photo');
            
            img.onload = () => {
                faces.forEach(face => {
                    const tag = document.createElement('div');
                    tag.className = 'face-tag';
                    tag.id = 'tag-' + face.id;
                    tag.style.left = (face.x + face.width / 2) + 'px';
                    tag.style.top = (face.y + face.height + 5) + 'px';
                    tag.textContent = face.name || '未标注';
                    container.appendChild(tag);
                    
                    const box = document.createElement('div');
                    box.className = 'face-box';
                    box.id = 'box-' + face.id;
                    box.style.left = face.x + 'px';
                    box.style.top = face.y + 'px';
                    box.style.width = face.width + 'px';
                    box.style.height = face.height + 'px';
                    container.appendChild(box);
                    
                    const clickArea = document.createElement('div');
                    clickArea.style.position = 'absolute';
                    clickArea.style.left = face.x + 'px';
                    clickArea.style.top = face.y + 'px';
                    clickArea.style.width = face.width + 'px';
                    clickArea.style.height = face.height + 'px';
                    clickArea.style.cursor = 'pointer';
                    clickArea.onclick = () => highlightFace(face.id);
                    container.appendChild(clickArea);
                });
            };
        }
        
        function renderNameList() {
            const grid = document.getElementById('nameGrid');
            faces.forEach(face => {
                const item = document.createElement('div');
                item.className = 'name-item p-3 bg-gray-50 rounded-lg cursor-pointer transition-colors';
                item.id = 'name-' + face.id;
                item.textContent = face.name || '未标注';
                item.onclick = () => highlightFace(face.id);
                grid.appendChild(item);
            });
        }
        
        function highlightFace(faceId) {
            highlightedFaceId = faceId;
            
            faces.forEach(face => {
                const tag = document.getElementById('tag-' + face.id);
                const box = document.getElementById('box-' + face.id);
                const nameItem = document.getElementById('name-' + face.id);
                
                if (face.id === faceId) {
                    tag?.classList.add('highlight');
                    box?.classList.add('highlight');
                    nameItem?.classList.add('highlight');
                } else {
                    tag?.classList.remove('highlight');
                    box?.classList.remove('highlight');
                    nameItem?.classList.remove('highlight');
                }
            });
        }
        
        function setupEventListeners() {
            document.getElementById('toggleMode').onclick = () => {
                showNameList = !showNameList;
                document.getElementById('nameList').classList.toggle('hidden', !showNameList);
            };
        }
        
        init();
    </script>
</body>
</html>`;
}

// 导出照片为zip
router.get('/:id/export', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.sendStatus(401);
    
    const photo = photoRepository.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    // 检查是否已锁定
    if (!photo.islocked) {
      return res.status(400).json({ error: '请先锁定照片后再导出' });
    }
    
    // 检查照片是否属于当前用户
    const userPhotos = photoRepository.findByUserId(req.user.id);
    if (!userPhotos.some(p => p.id === photo.id)) {
      return res.status(403).json({ error: '无权访问此照片' });
    }
    
    const faces = faceRepository.findByPhotoId(photo.id);
    
    // 创建zip
    const zip = new JSZip();
    
    // 添加HTML文件
    const htmlContent = generateOfflineHTML(photo, faces);
    zip.file('index.html', htmlContent);
    
    // 添加照片文件
    if (fs.existsSync(photo.filepath)) {
      const photoBuffer = fs.readFileSync(photo.filepath);
      zip.file('photo.jpg', photoBuffer);
    }
    
    // 添加说明文件
    zip.file('说明.txt', `毕业照查看器\n\n使用说明：\n1. 解压zip文件\n2. 双击打开index.html\n3. 点击头像或名单查看对应人员\n4. 点击右上角"切换名单模式"查看完整名单\n\n生成时间：${new Date().toLocaleString('zh-CN')}`);
    
    // 生成zip并发送
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    const fileName = (photo.display_name || photo.originalname).replace(/[\\\\/:*?"<>|]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.zip"`);
    res.send(zipBuffer);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 原来的公开照片获取（保持向后兼容）
router.get('/public/:code', (req, res) => {
  try {
    const photo = photoRepository.findByCode(req.params.code);
    
    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    if (!photo.islocked) {
      return res.status(403).json({ error: '照片尚未解锁，无法访问' });
    }
    
    // 如果有验证码，要求使用verify接口
    if (photo.view_code) {
      return res.status(403).json({ error: '需要验证码，请使用验证接口' });
    }
    
    const faces = faceRepository.findByPhotoId(photo.id);
    res.json({ ...photo, faces });
  } catch (error) {
    console.error('Get public photo error:', error);
    res.status(500).json({ error: '获取照片失败' });
  }
});

export default router;
