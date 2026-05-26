'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, AlertCircle, ScanFace, Edit3, MousePointer2 } from 'lucide-react';

interface Face {
  id: string;
  photo_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

interface Photo {
  id: string;
  code: string;
  annotate_code: string;
  display_name: string | null;
  originalname: string;
  filepath: string;
  islocked: number;
  faces: Face[];
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
  const [faces, setFaces] = useState<Face[]>([]);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');

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
      
      const [photoResponse, imageResponse] = await Promise.all([
        fetch(`/api/photos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/photos/${id}/image`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!photoResponse.ok) {
        throw new Error('Failed to load photo');
      }

      const data = await photoResponse.json();
      setPhoto(data);
      setFaces(data.faces);

      if (imageResponse.ok) {
        const blob = await imageResponse.blob();
        setImageSrc(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const avgFaceSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight) * 0.06;

    const newFace: any = {
      x: x - avgFaceSize / 2,
      y: y - avgFaceSize / 2,
      width: avgFaceSize,
      height: avgFaceSize * 1.2,
      name: '',
      isNew: true,
    };

    setFaces([...faces, newFace]);
    setSelectedFace(`new-${faces.length}`);
  };

  const updateFace = (index: number, updates: Partial<Face>) => {
    setFaces((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const deleteFace = async (index: number) => {
    const face = faces[index];
    if (face.id) {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await fetch(`/api/photos/faces/${face.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Delete failed');
        }
      } catch (err: any) {
        alert(err.message);
        return;
      }
    }
    setFaces((prev) => prev.filter((_, i) => i !== index));
    setSelectedFace(null);
  };

  const saveFaces = async () => {
    if (!photo) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setSaving(true);

      for (let index = 0; index < faces.length; index++) {
        const face = faces[index];
        if (face.id) {
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
        } else {
          await fetch('/api/photos/faces', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              photo_id: photo.id,
              x: face.x,
              y: face.y,
              width: face.width,
              height: face.height,
              name: face.name,
            }),
          });
        }
      }

      await loadPhoto();
      alert('保存成功！');
    } catch (err: any) {
      alert(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayBox = (face: Face) => {
    if (!imageRef.current) return null;

    const rect = imageRef.current.getBoundingClientRect();
    return {
      left: (face.x / imageRef.current.naturalWidth) * rect.width,
      top: (face.y / imageRef.current.naturalHeight) * rect.height,
      width: Math.max((face.width / imageRef.current.naturalWidth) * rect.width, 30),
      height: Math.max((face.height / imageRef.current.naturalHeight) * rect.height, 30),
    };
  };

  const getFaceThumbnail = (face: Face) => {
    if (!imageRef.current || !photo) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const size = 80;
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      imageRef.current,
      face.x,
      face.y,
      face.width,
      face.height,
      0,
      0,
      size,
      size
    );

    return canvas.toDataURL('image/png');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error || '照片不存在'}</p>
          <Link
            href="/admin"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回列表
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              {photo.display_name || photo.originalname}
            </h1>
            <button
              onClick={saveFaces}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? '保存中...' : '保存标注'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                💡 <strong>操作：</strong>直接点击照片上的人脸，自动添加标注！
              </div>

              <div
                ref={containerRef}
                className="relative overflow-hidden bg-gray-100 rounded-lg cursor-crosshair"
                onClick={handlePhotoClick}
              >
                <img
                  ref={imageRef}
                  src={imageSrc || photo.filepath}
                  alt={photo.display_name || photo.originalname}
                  className="w-full h-auto"
                  draggable={false}
                />

                {faces.map((face, index) => {
                  const display = getDisplayBox(face);
                  if (!display) return null;

                  const isSelected = selectedFace === (face.id || `new-${index}`);

                  return (
                    <div
                      key={face.id || `new-${index}`}
                      className={`absolute border-2 rounded cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-300' : 'border-green-500 bg-green-500/10'
                      }`}
                      style={{
                        left: display.left,
                        top: display.top,
                        width: display.width,
                        height: display.height,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFace(face.id || `new-${index}`);
                      }}
                    >
                      {isSelected && (
                        <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          人脸 {index + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">标注人脸列表</h3>

              {faces.length === 0 ? (
                <div className="text-center py-8">
                  <ScanFace className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">点击照片上的人脸，快速添加标注</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[550px] overflow-y-auto">
                  {faces.map((face, index) => {
                    const thumbnail = getFaceThumbnail(face);
                    return (
                      <div
                        key={face.id || `new-${index}`}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFace === (face.id || `new-${index}`) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
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
                                <ScanFace className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">人脸 {index + 1}</span>
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
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {photo.islocked ? (
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
