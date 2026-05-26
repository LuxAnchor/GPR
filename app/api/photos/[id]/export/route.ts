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

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${photo.display_name || photo.originalname || 'Graduation Photo'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .face-tag { position: absolute; background: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; transform: translateX(-50%); white-space: nowrap; }
    .face-tag.highlight { background: rgba(239, 68, 68, 0.95); transform: translateX(-50%) scale(1.1); z-index: 100; }
    .face-box { position: absolute; border: 3px solid #3b82f6; border-radius: 4px; pointer-events: none; }
    .face-box.highlight { border-color: #ef4444; border-width: 4px; z-index: 100; }
    .name-item:hover { background-color: #dbeafe; }
    .name-item.highlight { background-color: #fef2f2; color: #dc2626; font-weight: 600; }
    .face-popup {
      position: fixed;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      padding: 16px;
      z-index: 1000;
      text-align: center;
      min-width: 120px;
    }
    .face-popup img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .face-popup .name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="app" class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">${photo.display_name || photo.originalname || 'Graduation Photo'}</h1>
        <button id="toggleMode" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Toggle List
        </button>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div id="photoContainer" class="relative inline-block">
          <img id="photo" src="photo.jpg" alt="Photo" />
        </div>
      </div>
      
      <div id="nameList" class="mt-6 hidden">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Name List</h2>
          <div id="nameGrid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"></div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    const faces = ${facesData};
    let showNameList = false;
    let highlightedFaceId = null;
    let currentPopup = null;
    
    function init() {
      renderFaces();
      renderNameList();
      setupEventListeners();
    }
    
    function getFaceThumbnail(face) {
      const img = document.getElementById('photo');
      if (!img.complete || !img.naturalWidth) return null;
      
      const scaleX = img.naturalWidth / img.offsetWidth;
      const scaleY = img.naturalHeight / img.offsetHeight;
      
      const x = Math.round(face.x / scaleX);
      const y = Math.round(face.y / scaleY);
      const width = Math.round(face.width / scaleX);
      const height = Math.round(face.height / scaleY);
      
      if (width <= 0 || height <= 0) return null;
      
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(width, 150);
      canvas.height = Math.min(height, 150);
      const ctx = canvas.getContext('2d');
      
      const srcX = Math.max(0, x);
      const srcY = Math.max(0, y);
      const srcW = Math.min(width, img.naturalWidth - srcX);
      const srcH = Math.min(height, img.naturalHeight - srcY);
      
      if (srcW <= 0 || srcH <= 0) return null;
      
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
      
      return canvas.toDataURL('image/jpeg', 0.85);
    }
    
    function showFacePopup(faceId, event) {
      if (currentPopup) {
        currentPopup.remove();
      }
      
      const face = faces.find(f => f.id === faceId);
      if (!face) return;
      
      const thumbnail = getFaceThumbnail(face);
      const fallbackImg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" style="background:#f3f4f6"><text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="%239ca3af" font-family="system-ui" font-size="14">No photo</text></svg>');
      
      const popup = document.createElement('div');
      popup.className = 'face-popup';
      popup.innerHTML = '<img src="' + (thumbnail || fallbackImg) + '" alt="Face" onerror="this.src=\'' + fallbackImg + '\'"/><div class="name">' + (face.name || 'No name') + '</div>';
      
      document.body.appendChild(popup);
      
      const rect = popup.getBoundingClientRect();
      let left = event.clientX - rect.width / 2;
      let top = event.clientY - rect.height - 20;
      
      if (left < 10) left = 10;
      if (left + rect.width > window.innerWidth - 10) left = window.innerWidth - rect.width - 10;
      if (top < 10) top = event.clientY + 20;
      
      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
      
      currentPopup = popup;
    }
    
    function hidePopup() {
      if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
      }
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
          tag.textContent = face.name || 'No name';
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
          clickArea.onclick = (e) => {
            e.stopPropagation();
            highlightFace(face.id);
            showFacePopup(face.id, e);
          };
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
        item.textContent = face.name || 'No name';
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
      
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.face-popup') && !e.target.closest('#photoContainer')) {
          hidePopup();
        }
      });
    }
    
    init();
  </script>
</body>
</html>`;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const photos = await sql`
      SELECT * FROM photos WHERE id = ${params.id}
    `;
    const photo = photos[0];

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    if (photo.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (photo.islocked !== 1) {
      return NextResponse.json({ error: 'Please lock the photo first' }, { status: 400 });
    }

    const faces = await sql`
      SELECT * FROM faces WHERE photo_id = ${params.id}
    `;

    const htmlContent = generateOfflineHTML(photo, faces);
    const zip = new JSZip();
    
    zip.file('index.html', htmlContent);
    
    if (photo.filepath) {
      try {
        const response = await fetch(photo.filepath);
        if (response.ok) {
          const photoBuffer = await response.arrayBuffer();
          zip.file('photo.jpg', photoBuffer);
        }
      } catch (e) {
        console.log('Could not fetch photo file:', e);
      }
    }

    const readme = 'Graduation Photo Viewer\n\nInstructions:\n1. Extract zip\n2. Put your photo as photo.jpg\n3. Open index.html\n4. Click on faces to see names\n\nFaces: ' + faces.length;
    zip.file('README.txt', readme);

    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

    const safeFileName = 'graduation-photo-' + Date.now();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="' + safeFileName + '.zip"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
