'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, AlertCircle, ScanFace } from 'lucide-react';

interface FaceBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  isNew?: boolean;
}

interface Photo {
  id: string;
  code: string;
  annotate_code: string;
  display_name: string | null;
  originalname: string;
  filepath: string;
  islocked: number;
  user_id: string;
  faces: any[];
}

export default function AnnotatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('');
  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);

  useEffect(() => {
    loadPhoto();
  }, [id]);

  const loadPhoto = async () => {
    if (!id) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/photos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load photo');
      }

      const data = await response.json();
      setPhoto(data);
      setFaces(data.faces.map((f: any) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        name: f.name,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getFaceThumbnail = (face: FaceBox): string | null => {
    if (!imageRef.current || !photo) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    
    ctx.drawImage(
      imageRef.current,
      face.x, face.y, face.width, face.height,
      0, 0, size, size
    );
    
    return canvas.toDataURL('image/png');
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const avgFaceSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight) * 0.06;
    
    const newFace: FaceBox = {
      x: x - avgFaceSize / 2,
      y: y - avgFaceSize / 2,
      width: avgFaceSize,
      height: avgFaceSize * 1.2,
      name: '',
      isNew: true
    };
    
    setFaces([...faces, newFace]);
    setSelectedFace('new-' + faces.length);
  };

  const updateFace = (index: number, updates: Partial<FaceBox>) => {
    setFaces(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const deleteFace = async (index: number) => {
    const face = faces[index];
    const token = localStorage.getItem('auth_token');
    if (face.id && token) {
      try {
        await fetch(`/api/photos/faces/${face.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : '删除失败');
        return;
      }
    }
    setFaces(prev => prev.filter((_, i) => i !== index));
    setSelectedFace(null);
  };

  const saveFaces = async () => {
    if (!photo || !id) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    try {
      setSaving(true);
      
      const newFaces = faces.filter(f => f.isNew && !f.id);
      const existingFaces = faces.filter(f => f.id);
      const totalFaces = existingFaces.length + newFaces.length;
      let savedCount = 0;
      
      for (const face of existingFaces) {
        savedCount++;
        setSavingProgress(`${savedCount}/${totalFaces}`);
        await fetch(`/api/photos/faces/${face.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            x: face.x,
            y: face.y,
            width: face.width,
            height: face.height,
            name: face.name,
          }),
        });
      }
      
      for (const face of newFaces) {
        savedCount++;
        setSavingProgress(`${savedCount}/${totalFaces}`);
        await fetch('/api/photos/faces', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photo_id: id,
            x: face.x,
            y: face.y,
            width: face.width,
            height: face.height,
            name: face.name,
          }),
        });
      }
      
      await loadPhoto();
      alert('保存成功！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
      setSavingProgress('');
    }
  };

  const getDisplayBox = (face: FaceBox) => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    return {
      left: (face.x / imageRef.current.naturalWidth) * rect.width,
      top: (face.y / imageRef.current.naturalHeight) * rect.height,
      width: (face.width / imageRef.current.naturalWidth) * rect.width,
      height: (face.height / imageRef.current.naturalHeight) * rect.height,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error || '照片不存在'}</p>
          <Link href="/admin" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">返回列表</span>
            <span className="sm:hidden">返回</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[40%] sm:max-w-none">
            {photo.display_name || photo.originalname}
          </h1>
          <button
            onClick={saveFaces}
            disabled={saving || faces.length === 0}
            className="flex items-center px-3 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 touch-manipulation"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1 sm:mr-2"></div>
                <span className="hidden sm:inline">{savingProgress ? `保存中 ${savingProgress}` : '保存中...'}</span>
                <span className="sm:hidden">{savingProgress ? savingProgress : '保存'}</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">保存标注</span>
                <span className="sm:hidden">保存</span>
              </>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4">
              <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold truncate">{photo.display_name || photo.originalname}</h2>
              <div className="text-xs sm:text-sm text-gray-500 ml-2 flex-shrink-0">
                已标注 {faces.length} 人
              </div>
            </div>
            
            <div className="mb-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
              💡 <strong>操作：</strong>直接点击照片上的人脸，自动添加标注！
            </div>
            
            <div
              ref={containerRef}
              className="relative overflow-hidden bg-gray-100 rounded-lg cursor-crosshair"
              onClick={handlePhotoClick}
            >
              <img
                ref={imageRef}
                src={photo.filepath}
                alt={photo.display_name || photo.originalname}
                className="w-full h-auto"
                draggable={false}
                crossOrigin="anonymous"
              />
              
              {faces.map((face, index) => {
                const display = getDisplayBox(face);
                if (!display) return null;
                
                const isSelected = selectedFace === (face.id || `new-${index}`);
                
                return (
                  <div
                    key={face.id || `new-${index}`}
                    className={`absolute border-2 rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-300'
                        : 'border-green-500 bg-green-500/10'
                    }`}
                    style={{
                      left: display.left,
                      top: display.top,
                      width: Math.max(display.width, 30),
                      height: Math.max(display.height, 30),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFace(face.id || `new-${index}`);
                    }}
                  >
                    {isSelected && (
                      <>
                        <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          人脸 {index + 1}
                        </div>
                        {/* 添加调整控制点 */}
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 rounded-full cursor-nw-resize" />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 rounded-full cursor-ne-resize" />
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 rounded-full cursor-sw-resize" />
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 rounded-full cursor-se-resize" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 mt-4 lg:mt-0">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                标注人脸列表
              </h3>
              
              {faces.length === 0 ? (
                <div className="text-center py-8">
                  <ScanFace className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    点击照片上的人脸，快速添加标注
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto">
                  {faces.map((face, index) => {
                    const thumbnail = getFaceThumbnail(face);
                    const isSelected = selectedFace === (face.id || `new-${index}`);
                    return (
                    <div
                      key={face.id || `new-${index}`}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedFace(face.id || `new-${index}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {thumbnail ? (
                            <img 
                              src={thumbnail} 
                              alt={`人脸${index + 1}`}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <ScanFace className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              人脸 {index + 1}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFace(index);
                              }}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={face.name}
                            onChange={(e) => updateFace(index, { name: e.target.value })}
                            placeholder="输入姓名"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
              
              {photo.islocked === 1 ? (
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-green-800 text-sm">
                ✓ 已锁定，可分享链接
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                ⚠ 保存后记得锁定照片
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
