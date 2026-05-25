'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2, AlertCircle, ScanFace, CheckCircle2, Camera } from 'lucide-react';

interface Face {
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
  filename: string;
  originalname: string;
  filepath: string;
  islocked: number;
  user_id: string;
  view_code: string | null;
  annotate_view_code: string | null;
  created_at: string;
  updated_at: string;
  faces: Face[];
}

export default function AnnotateLinkPage() {
  const { code } = useParams<{ code: string }>();
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [annotateViewCode, setAnnotateViewCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleVerify = async () => {
    if (!code) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await fetch('/api/photos/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotate_code: code, annotate_view_code: annotateViewCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '验证失败');
      }

      const data = await response.json();
      setPhoto(data);
      setFaces(data.faces.map((f: Face) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        name: f.name,
      })));
      setIsVerified(true);
      setNeedsVerification(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败，请检查密码');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadPhoto = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/photos/annotate?annotate_code=${code}`);
      
      if (!response.ok) {
        const data = await response.json();
        if (data.error && (data.error.includes('需要验证') || data.error.includes('需要验证码'))) {
          setNeedsVerification(true);
          return;
        }
        throw new Error(data.error || '加载失败');
      }
      
      const data = await response.json();
      setPhoto(data);
      setFaces(data.faces.map((f: Face) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        name: f.name,
      })));
      setIsVerified(true);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('需要验证') || err.message.includes('需要验证码'))) {
        setNeedsVerification(true);
      } else {
        setError(err instanceof Error ? err.message : '加载失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhoto();
  }, [code]);

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const avgFaceSize = Math.min(imageRef.current.naturalWidth, imageRef.current.naturalHeight) * 0.06;
    
    const newFace: Face = {
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

  const containerRef = useRef<HTMLDivElement>(null);

  const updateFace = (index: number, updates: Partial<Face>) => {
    setFaces(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const deleteFace = async (index: number) => {
    const face = faces[index];
    if (face.id) {
      try {
        const response = await fetch(`/api/photos/faces/${face.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '删除失败');
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : '删除失败');
        return;
      }
    }
    setFaces(prev => prev.filter((_, i) => i !== index));
    setSelectedFace(null);
  };

  const saveFaces = async () => {
    if (!photo) return;
    
    try {
      setSaving(true);
      
      const newFaces = faces.filter(f => f.isNew && !f.id);
      const existingFaces = faces.filter(f => f.id);
      
      for (const face of existingFaces) {
        await fetch(`/api/photos/faces/${face.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: face.x, y: face.y, width: face.width, height: face.height, name: face.name }),
        });
      }
      
      for (const face of newFaces) {
        await fetch('/api/photos/faces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_id: photo.id, x: face.x, y: face.y, width: face.width, height: face.height, name: face.name }),
        });
      }
      
      const response = await fetch('/api/photos/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotate_code: code, annotate_view_code: annotateViewCode }),
      });
      
      const updatedPhoto = await response.json();
      setPhoto(updatedPhoto);
      setFaces(updatedPhoto.faces.map((f: Face) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        name: f.name,
      })));
      alert('保存成功！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
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
      width: (face.width / imageRef.current.naturalWidth) * rect.width,
      height: (face.height / imageRef.current.naturalHeight) * rect.height,
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
      face.x, face.y, face.width, face.height,
      0, 0, size, size
    );
    
    return canvas.toDataURL('image/png');
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

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">标注页面访问验证</h2>
            <p className="text-gray-600">请输入访问密码</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">访问密码</label>
              <input
                type="text"
                value={annotateViewCode}
                onChange={(e) => setAnnotateViewCode(e.target.value)}
                placeholder="请输入访问密码"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '验证并进入标注'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">访问失败</h3>
          <p className="text-gray-500">{error || '照片不存在或链接无效'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">毕业合照标注</h1>
              <p className="text-sm text-gray-500">{photo.display_name || photo.originalname}</p>
            </div>
          </div>
          <button
            onClick={saveFaces}
            disabled={saving || faces.length === 0}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? '保存中...' : '保存标注'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          💡 <strong>操作提示：</strong>直接点击照片上的人脸来添加标注，在右侧填写姓名！
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">毕业合照</h2>
                <div className="text-sm text-gray-500">
                  已标注: {faces.length} 人
                </div>
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
                        <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded text-xs">
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
              <h3 className="text-lg font-semibold mb-4">
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
                    return (
                    <div
                      key={face.id || `new-${index}`}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFace === (face.id || `new-${index}`)
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
                  ✓ 此照片已被管理员锁定！
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                  ⚠️ 此照片尚未锁定，管理员将在审核后锁定！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
