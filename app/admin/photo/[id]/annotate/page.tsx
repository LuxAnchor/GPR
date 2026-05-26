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
      setFaces(data.faces);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newFace: Face = {
      id: `temp-${Date.now()}`,
      photo_id: id as string,
      x: Math.max(0, Math.min(100, x - 5)),
      y: Math.max(0, Math.min(100, y - 5)),
      width: 10,
      height: 10,
      name: '',
    };

    setFaces([...faces, newFace]);
    setSelectedFace(newFace.id);
  };

  const handleFaceClick = (face: Face) => {
    setSelectedFace(face.id);
  };

  const handleUpdateFace = (faceId: string, updates: Partial<Face>) => {
    setFaces(faces.map(face => 
      face.id === faceId ? { ...face, ...updates } : face
    ));
  };

  const handleDeleteFace = (faceId: string) => {
    setFaces(faces.filter(face => face.id !== faceId));
    if (selectedFace === faceId) {
      setSelectedFace(null);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      for (const face of faces) {
        if (face.id.startsWith('temp-')) {
          const response = await fetch('/api/photos/faces', {
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

          if (!response.ok) {
            throw new Error('Failed to save face');
          }
        } else {
          const response = await fetch(`/api/photos/faces/${face.id}`, {
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

          if (!response.ok) {
            throw new Error('Failed to update face');
          }
        }
      }

      alert('保存成功!');
      await loadPhoto();
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTempFace = async (faceId: string) => {
    if (!faceId.startsWith('temp-')) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await fetch(`/api/photos/faces/${faceId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.error('Failed to delete face:', err);
        }
      }
    }
    handleDeleteFace(faceId);
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

  if (!photo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">照片不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            返回列表
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {photo.display_name || photo.originalname}
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? '保存中...' : '保存标注'}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <MousePointer2 className="h-5 w-5" />
                  <span className="font-medium">操作: 直接点击照片上的人脸, 自动添加标注!</span>
                </div>
              </div>
              
              <div ref={containerRef} className="relative">
                <img
                  ref={imageRef}
                  src={photo.filepath}
                  alt={photo.display_name || photo.originalname}
                  className="w-full h-auto"
                  onClick={handleImageClick}
                />
                
                {faces.map((face) => (
                  <div
                    key={face.id}
                    className={`absolute cursor-pointer border-2 rounded-lg transition-all ${
                      selectedFace === face.id ? 'border-blue-600 bg-blue-100 bg-opacity-30' : 'border-blue-500 bg-blue-50 bg-opacity-20'
                    }`}
                    style={{
                      left: `${face.x}%`,
                      top: `${face.y}%`,
                      width: `${face.width}%`,
                      height: `${face.height}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFaceClick(face);
                    }}
                  >
                    {face.name && (
                      <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                        {face.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ScanFace className="h-5 w-5" />
                标注人脸列表
              </h2>

              {faces.length === 0 ? (
                <div className="text-center py-8">
                  <ScanFace className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">点击照片上的人脸，快速添加标注</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {faces.map((face) => (
                    <div
                      key={face.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedFace === face.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleFaceClick(face)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          第 {faces.indexOf(face) + 1} 个标注
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTempFace(face.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={face.name}
                        onChange={(e) => handleUpdateFace(face.id, { name: e.target.value })}
                        placeholder="输入姓名"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-gray-600 mb-1">X</label>
                          <input
                            type="number"
                            value={face.x.toFixed(2)}
                            onChange={(e) => handleUpdateFace(face.id, { x: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">Y</label>
                          <input
                            type="number"
                            value={face.y.toFixed(2)}
                            onChange={(e) => handleUpdateFace(face.id, { y: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">宽度</label>
                          <input
                            type="number"
                            value={face.width.toFixed(2)}
                            onChange={(e) => handleUpdateFace(face.id, { width: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 mb-1">高度</label>
                          <input
                            type="number"
                            value={face.height.toFixed(2)}
                            onChange={(e) => handleUpdateFace(face.id, { height: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  保存后记得锁定照片
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
