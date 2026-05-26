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
  <title>Graduation Photo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .face-tag { position: absolute; background: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; pointer-events: none; transform: translateX(-50%); white-space: nowrap; }
    .face-tag.highlight { background: rgba(239, 68, 68, 0.95); transform: translateX(-50%) scale(1.1); z-index: 100; }
    .face-box { position: absolute; border: 3px solid #3b82f6; border-radius: 4px; pointer-events: none; }
    .face-box.highlight { border-color: #ef4444; border-width: 4px; z-index: 100; }
    .name-item:hover { background-color: #dbeafe; }
    .name-item.highlight { background-color: #fef2f2; color: #dc2626; font-weight: 600; }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <div id="app" class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Graduation Photo</h1>
        <button id="toggleMode" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Toggle List</button>
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
    function init() { renderFaces(); renderNameList(); setupEventListeners(); }
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
        item.textContent = face.name || 'No name';
        item.onclick = () => highlightFace(face.id);
        grid.appendChild(item);
      });
    }
    function highlightFace(faceId) {
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

    const readme = 'Graduation Photo Viewer\n\nInstructions:\n1. Extract zip\n2. Put your photo as photo.jpg\n3. Open index.html\n\nFaces: ' + faces.length;
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
