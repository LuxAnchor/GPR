'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, LogOut, Upload, Lock, Unlock, Eye, Edit, Trash2, Download, AlertCircle, Copy, ExternalLink, UserPlus, RefreshCw, Save, Key, EyeOff } from 'lucide-react';

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
  originalname: string;
  display_name: string | null;
  filepath: string;
  islocked: number;
  view_code: string | null;
  annotate_view_code: string | null;
  user_id: string;
  faces: Face[];
}

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      setUser(data.user);
      await loadPhotos(token);
    } catch (err) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const loadPhotos = async (token: string) => {
    try {
      const response = await fetch('/api/photos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load photos');
      }

      const data = await response.json();
      setPhotos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { id } = await response.json();
      router.push(`/admin/photo/${id}/annotate`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLock = async (photoId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ islocked: 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to lock photo');
      }

      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, islocked: 1 } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnlock = async (photoId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ islocked: 0 }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlock photo');
      }

      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, islocked: 0 } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetViewCode = async (photoId: string, viewCode: string | null) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ view_code: viewCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to update photo');
      }

      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, view_code: viewCode } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetAnnotateCode = async (photoId: string, annotateViewCode: string | null) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ annotate_view_code: annotateViewCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to update photo');
      }

      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, annotate_view_code: annotateViewCode } : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(message);
    }).catch(() => {
      alert('复制失败');
    });
  };

  const handleExport = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/export`);
      
      if (!response.ok) {
        throw new Error('Failed to export photo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photo-export.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const PhotoCard = ({ photo }: { photo: Photo }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(photo.display_name || '');
    const [isSettingViewCode, setIsSettingViewCode] = useState(false);
    const [viewCode, setViewCode] = useState('');
    const [isSettingAnnotateCode, setIsSettingAnnotateCode] = useState(false);
    const [annotateViewCode, setAnnotateViewCode] = useState('');

    const handleSaveName = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await fetch(`/api/photos/${photo.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ display_name: newName || null }),
        });

        if (!response.ok) {
          throw new Error('Failed to update photo');
        }

        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, display_name: newName || null } : p));
        setIsEditingName(false);
      } catch (err: any) {
        alert(err.message);
      }
    };

    const handleSaveViewCode = () => {
      handleSetViewCode(photo.id, viewCode || null);
      setIsSettingViewCode(false);
    };

    const handleSaveAnnotateCode = () => {
      handleSetAnnotateCode(photo.id, annotateViewCode || null);
      setIsSettingAnnotateCode(false);
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48">
          <img
            src={photo.filepath}
            alt={photo.display_name || photo.originalname}
            className="w-full h-full object-cover"
          />
          {photo.islocked === 1 ? (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm flex items-center">
              <Lock className="h-4 w-4 mr-1" />
              已锁定
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm flex items-center">
              <Unlock className="h-4 w-4 mr-1" />
              未锁定
            </div>
          )}
          {(photo.view_code || photo.annotate_view_code) && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-sm flex items-center">
              <Key className="h-4 w-4 mr-1" />
              已设密码
            </div>
          )}
        </div>
        <div className="p-4">
          {isEditingName ? (
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="照片名称"
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleSaveName}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 truncate">
                {photo.display_name || photo.originalname}
              </h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 text-gray-500 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="text-sm text-gray-600 mb-3">
            已标注: {photo.faces.length} 人
          </div>

          <div className="flex flex-wrap gap-2">
            {photo.islocked === 0 ? (
              <button
                onClick={() => handleLock(photo.id)}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center"
              >
                <Lock className="h-4 w-4 mr-1" />
                锁定
              </button>
            ) : (
              <button
                onClick={() => handleUnlock(photo.id)}
                className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center justify-center"
              >
                <Unlock className="h-4 w-4 mr-1" />
                解锁
              </button>
            )}

            <Link
              href={`/admin/photo/${photo.id}/annotate`}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
            >
              <Edit className="h-4 w-4 mr-1" />
              标注
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/photo/${photo.code}`, '查看链接已复制!')}
              className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 flex items-center justify-center"
            >
              <Copy className="h-4 w-4 mr-1" />
              复制查看链接
            </button>
            
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/annotate/${photo.annotate_code}`, '标注链接已复制!')}
              className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center justify-center"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              复制标注链接
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {isSettingViewCode ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={viewCode}
                  onChange={(e) => setViewCode(e.target.value)}
                  placeholder="查看密码"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleSaveViewCode}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSettingViewCode(true)}
                className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center justify-center"
              >
                {photo.view_code ? <EyeOff className="h-4 w-4 mr-1" /> : <Key className="h-4 w-4 mr-1" />}
                {photo.view_code ? '修改查看密码' : '设置查看密码'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {isSettingAnnotateCode ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={annotateViewCode}
                  onChange={(e) => setAnnotateViewCode(e.target.value)}
                  placeholder="标注密码"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleSaveAnnotateCode}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSettingAnnotateCode(true)}
                className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center justify-center"
              >
                {photo.annotate_view_code ? <EyeOff className="h-4 w-4 mr-1" /> : <Key className="h-4 w-4 mr-1" />}
                {photo.annotate_view_code ? '修改标注密码' : '设置标注密码'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {photo.islocked === 1 && (
              <button
                onClick={() => handleExport(photo.id)}
                className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </button>
            )}
            <button
              onClick={() => handleDelete(photo.id)}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </button>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">毕业合照管理</h1>
              <p className="text-sm text-gray-600">欢迎, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? '上传中...' : '上传照片'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-16">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">还没有上传照片</p>
            <p className="text-gray-500 mt-2">点击右上角 "上传照片" 开始</p>
          </div>
        )}
      </main>
    </div>
  );
}
