import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import JSZip from 'jszip';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  console.log('Export API called for photo:', params.id);
  
  try {
    const userId = getUserId(request);
    if (!userId) {
      console.log('Unauthorized - no userId');
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    console.log('User authenticated:', userId);

    const photos = await sql`
      SELECT * FROM photos WHERE id = ${params.id}
    `;
    const photo = photos[0];

    if (!photo) {
      console.log('Photo not found');
      return NextResponse.json({ error: '照片不存在' }, { status: 404 });
    }
    console.log('Photo found:', photo.display_name || photo.originalname);

    if (photo.user_id !== userId) {
      console.log('Access denied - user mismatch');
      return NextResponse.json({ error: '无权访问此照片' }, { status: 403 });
    }

    if (photo.islocked !== 1) {
      console.log('Photo not locked');
      return NextResponse.json({ error: '请先锁定照片再导出' }, { status: 400 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${params.id}
    `;
    console.log('Faces found:', faces.length);

    const zip = new JSZip();

    const htmlContent = generateOfflineHTML(photo, faces);
    zip.file('index.html', htmlContent);

    const fileName = (photo.display_name || photo.originalname).replace(/[\\/:*?"<>|]/g, '_');

    try {
      const photoUrl = photo.filepath;
      console.log('Fetching photo from:', photoUrl);
      const response = await fetch(photoUrl);
      if (response.ok) {
        const photoBuffer = await response.arrayBuffer();
        console.log('Photo fetched successfully, size:', photoBuffer.byteLength);
        zip.file('photo.jpg', photoBuffer);
      } else {
        console.error('Failed to fetch photo:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error('Error fetching photo from Blob:', fetchError);
    }

    zip.file('说明.txt', `毕业照查看器\n\n使用说明：\n1. 解压zip文件\n2. 双击打开index.html\n3. 点击头像或名单查看对应人员\n4. 点击右上角"切换名单模式"查看完整名单\n\n照片: ${photo.display_name || photo.originalname}\n已标注人数: ${faces.length} 人\n生成时间：${new Date().toLocaleString()}`);

    console.log('Generating zip file...');
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
    console.log('Zip generated, size:', zipBuffer.length);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}.zip"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: '导出失败', details: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
