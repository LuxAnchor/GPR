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
  <title>毕业照标注</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .face-tag { position: absolute; background: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; transform: translateX(-50%); white-space: nowrap; transition: all 0.2s; }
    .face-tag.highlight { background: rgba(239, 68, 68, 0.95); transform: translateX(-50%) scale(1.1); z-index: 100; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5); }
    .face-box { position: absolute; border: 3px solid #3b82f6; border-radius: 4px; pointer-events: none; transition: all 0.2s; }
    .face-box.highlight { border-color: #ef4444; border-width: 4px; z-index: 100; box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
    .name-item { padding: 8px 12px; background: #f3f4f6; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
    .name-item:hover { background: #dbeafe; transform: translateY(-2px); }
    .name-item.highlight { background: #fef2f2; color: #dc2626; font-weight: 600; border-color: #ef4444; }
    .search-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
    .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; z-index: 1000; animation: fadeIn 0.3s, fadeOut 0.3s 1.7s forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="app" class="container mx-auto px-4 py-6">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h1 class="text-2xl font-bold text-gray-800">毕业照标注</h1>
        <div class="flex gap-2">
          <button id="toggleMode" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">名单模式</button>
          <button id="toggleSearch" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">点名功能</button>
        </div>
      </div>
      
      <div id="searchPanel" class="hidden mb-4">
        <div class="bg-white rounded-xl shadow-lg p-4">
          <input type="text" id="searchInput" placeholder="输入姓名搜索..." class="search-input w-full px-4 py-2 border-2 border-gray-300 rounded-lg transition-all">
          <div id="searchResults" class="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"></div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div id="photoContainer" class="relative inline-block">
          <img id="photo" src="photo.jpg" alt="毕业照" style="max-width: 100%; height: auto;" />
        </div>
      </div>
      
      <div id="nameList" class="mt-6 hidden">
        <div class="bg-white rounded-xl shadow-lg p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800">名单 (共 <span id="faceCount">0</span> 人)</h2>
            <button id="showAll" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">显示全部</button>
          </div>
          <div id="nameGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2"></div>
        </div>
      </div>
    </div>
  </div>
  
  <div id="toast" class="toast" style="display: none;"></div>

  <script>
    const faces = ${facesData};
    let showNameList = false;
    let showSearch = false;
    let highlightedFaceId = null;
    
    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }
    
    function init() {
      document.getElementById('faceCount').textContent = faces.length;
      renderFaces();
      renderNameList();
      setupEventListeners();
    }
    
    function renderFaces() {
      const container = document.getElementById('photoContainer');
      const img = document.getElementById('photo');
      
      const renderBoxes = () => {
        const scaleX = img.offsetWidth / img.naturalWidth;
        const scaleY = img.offsetHeight / img.naturalHeight;
        
        container.querySelectorAll('.face-tag, .face-box, .face-click-area').forEach(el => el.remove());
        
        faces.forEach(face => {
          const scaledX = face.x * scaleX;
          const scaledY = face.y * scaleY;
          const scaledWidth = face.width * scaleX;
          const scaledHeight = face.height * scaleY;
          
          const tag = document.createElement('div');
          tag.className = 'face-tag';
          tag.id = 'tag-' + face.id;
          tag.style.left = (scaledX + scaledWidth / 2) + 'px';
          tag.style.top = (scaledY + scaledHeight + 5) + 'px';
          tag.textContent = face.name || '未标注';
          container.appendChild(tag);
          
          const box = document.createElement('div');
          box.className = 'face-box';
          box.id = 'box-' + face.id;
          box.style.left = scaledX + 'px';
          box.style.top = scaledY + 'px';
          box.style.width = scaledWidth + 'px';
          box.style.height = scaledHeight + 'px';
          container.appendChild(box);
          
          const clickArea = document.createElement('div');
          clickArea.className = 'face-click-area';
          clickArea.style.position = 'absolute';
          clickArea.style.left = scaledX + 'px';
          clickArea.style.top = scaledY + 'px';
          clickArea.style.width = scaledWidth + 'px';
          clickArea.style.height = scaledHeight + 'px';
          clickArea.style.cursor = 'pointer';
          clickArea.onclick = () => highlightFace(face.id, true);
          container.appendChild(clickArea);
        });
      };
      
      if (img.complete && img.naturalWidth > 0) {
        renderBoxes();
      }
      
      img.onload = renderBoxes;
      
      window.addEventListener('resize', renderBoxes);
    }
    
    function renderNameList() {
      const grid = document.getElementById('nameGrid');
      grid.innerHTML = '';
      faces.forEach(face => {
        const item = document.createElement('div');
        item.className = 'name-item';
        item.id = 'name-' + face.id;
        item.textContent = face.name || '未标注';
        item.onclick = () => highlightFace(face.id, true);
        grid.appendChild(item);
      });
    }
    
    function highlightFace(faceId, scroll = false) {
      if (highlightedFaceId === faceId) {
        clearHighlights();
        return;
      }
      
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
      
      const nameItem = document.getElementById('name-' + faceId);
      if (scroll && nameItem) {
        nameItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      const face = faces.find(f => f.id === faceId);
      if (face) {
        showToast(face.name || '未标注');
      }
    }
    
    function clearHighlights() {
      highlightedFaceId = null;
      faces.forEach(face => {
        document.getElementById('tag-' + face.id)?.classList.remove('highlight');
        document.getElementById('box-' + face.id)?.classList.remove('highlight');
        document.getElementById('name-' + face.id)?.classList.remove('highlight');
      });
    }
    
    function setupEventListeners() {
      document.getElementById('toggleMode').onclick = () => {
        showNameList = !showNameList;
        document.getElementById('nameList').classList.toggle('hidden', !showNameList);
        document.getElementById('toggleMode').textContent = showNameList ? '照片模式' : '名单模式';
      };
      
      document.getElementById('toggleSearch').onclick = () => {
        showSearch = !showSearch;
        document.getElementById('searchPanel').classList.toggle('hidden', !showSearch);
        document.getElementById('toggleSearch').textContent = showSearch ? '关闭点名' : '点名功能';
        if (showSearch) {
          document.getElementById('searchInput').focus();
        }
      };
      
      document.getElementById('showAll').onclick = () => {
        clearHighlights();
      };
      
      document.getElementById('searchInput').oninput = (e) => {
        const query = e.target.value.trim().toLowerCase();
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';
        
        if (!query) return;
        
        const matches = faces.filter(face => 
          face.name && face.name.toLowerCase().includes(query)
        );
        
        matches.slice(0, 12).forEach(face => {
          const item = document.createElement('div');
          item.className = 'name-item text-center';
          item.textContent = face.name;
          item.onclick = () => {
            highlightFace(face.id, true);
            if (!showNameList) {
              showNameList = true;
              document.getElementById('nameList').classList.remove('hidden');
              document.getElementById('toggleMode').textContent = '照片模式';
            }
          };
          resultsContainer.appendChild(item);
        });
        
        if (matches.length === 0) {
          resultsContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-2">未找到匹配的名字</div>';
        }
      };
      
      document.getElementById('photoContainer').onclick = (e) => {
        if (e.target.id === 'photo' || e.target.id === 'photoContainer' || e.target.classList.contains('face-click-area')) {
          if (e.target.id === 'photo' || e.target.id === 'photoContainer') {
            clearHighlights();
          }
        }
      };
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
