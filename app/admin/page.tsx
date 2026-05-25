'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, LogOut, Upload, Lock, Unlock, Eye, Edit, Trash2, Download, AlertCircle } from 'lucide-react';

interface Photo {
  id: string;
  code: string;
  annotate_code: string;
  originalname: string;
  display_name: string;
  filepath: string;
  islocked: number;
  faces: any[];
}

const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
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

    if (file.size > MAX_FILE_SIZE) {
      setShowSizeWarning(true);
      e.target.value = '';
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      await loadPhotos(token);
      alert('上传成功！');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleLock = async (photo: Photo) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const action = photo.islocked ? 'unlock' : 'lock';
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Operation failed');
      }

      await loadPhotos(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await loadPhotos(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExport = async (photo: Photo) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${photo.id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${photo.display_name || photo.originalname}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {showSizeWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>文件过大！</strong> Vercel 免费版限制上传文件最大 <strong>4.5MB</strong>。
                请压缩图片后重试（建议分辨率 1920x1080 以下，文件小于 2MB）。
              </p>
              <button
                onClick={() => setShowSizeWarning(false)}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎓 毕业合照管理</h1>
              <p className="text-sm text-gray-600">欢迎，{user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? '上传中...' : '上传照片'}
                </span>
              </label>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  退出
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有照片</h3>
            <p className="text-gray-600 mb-6">点击上方"上传照片"按钮开始管理您的毕业合照</p>
            <p className="text-sm text-gray-500">💡 提示：上传照片建议小于 4.5MB</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={photo.filepath}
                    alt={photo.display_name || photo.originalname}
                    className="w-full h-full object-cover"
                  />
                  {photo.islocked === 1 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      已锁定
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {photo.display_name || photo.originalname}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    已标注：{photo.faces?.length || 0} 人
                  </p>

                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="font-medium mb-1">📎 查看链接：</div>
                      <code className="text-xs break-all">{`/photo/${photo.code}`}</code>
                    </div>

                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="font-medium mb-1">✏️ 标注链接：</div>
                      <code className="text-xs break-all">{`/annotate/${photo.annotate_code}`}</code>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleLock(photo)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        photo.islocked
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {photo.islocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {photo.islocked ? '解锁' : '锁定'}
                      </span>
                    </button>

                    {photo.islocked === 1 && (
                      <button
                        onClick={() => handleExport(photo)}
                        className="flex-1 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                      >
                        <span className="flex items-center justify-center gap-1">
                          <Download className="w-4 h-4" />
                          导出
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(photo)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
