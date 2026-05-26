'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, LogOut, Upload, Lock, Unlock, Edit, Trash2, Download, AlertCircle, Copy, UserPlus, Save, Key, EyeOff, RefreshCw } from 'lucide-react';

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
  const [deleting, setDeleting] = useState<string | null>(null);
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
      // Upload successful, navigate to annotate page
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

      // Reload photos
      await loadPhotos(token);
      alert('照片已锁定，可以分享链接了！');
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

      await loadPhotos(token);
      alert('照片已解锁，可以继续编辑！');
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

      await loadPhotos(token);
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

      await loadPhotos(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setDeleting(photoId);
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      await loadPhotos(token);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/photos/${photoId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'photo-export.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      a.download = filename;
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
    const [updatingName, setUpdatingName] = useState(false);

    const handleSaveName = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        setUpdatingName(true);
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

        await loadPhotos(token);
        setIsEditingName(false);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setUpdatingName(false);
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
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs sm:text-sm flex items-center">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">已锁定</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs sm:text-sm flex items-center">
              <Unlock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">未锁定</span>
            </div>
          )}
          {(photo.view_code || photo.annotate_view_code) && (
            <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs sm:text-sm flex items-center">
              <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">已设密码</span>
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={handleSaveName}
                disabled={updatingName}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                {updatingName ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
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
                className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center touch-manipulation"
              >
                <Lock className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">锁定</span>
                <span className="sm:hidden">锁</span>
              </button>
            ) : (
              <button
                onClick={() => handleUnlock(photo.id)}
                className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center justify-center touch-manipulation"
              >
                <Unlock className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">解锁</span>
                <span className="sm:hidden">解</span>
              </button>
            )}

            <Link
              href={`/admin/photo/${photo.id}/annotate`}
              className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center touch-manipulation"
            >
              <Edit className="h-4 w-4 mr-1" />
              标注
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/photo/${photo.code}`, '查看链接已复制!')}
              className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 flex items-center justify-center touch-manipulation"
            >
              <Copy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">复制查看链接</span>
              <span className="sm:hidden">复制查看</span>
            </button>
            
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/annotate/${photo.annotate_code}`, '标注链接已复制!')}
              className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center justify-center touch-manipulation"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">复制标注链接</span>
              <span className="sm:hidden">复制标注</span>
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
                className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 flex items-center justify-center touch-manipulation"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">导出</span>
                <span className="sm:hidden">导出</span>
              </button>
            )}
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={deleting === photo.id}
              className="flex-1 min-w-[calc(50%-0.25rem)] px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center justify-center disabled:opacity-50 touch-manipulation"
            >
              {deleting === photo.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">删除</span>
              <span className="sm:hidden">删除</span>
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
            <div className="relative">
              <label className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">{uploading ? '上传中...' : '上传照片'}</span>
                <span className="sm:hidden">{uploading ? '上传中' : '上传'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 text-center">
                  上传中，请稍候...
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">退出</span>
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
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无照片</h3>
            <p className="text-gray-500">上传第一张毕业合照开始管理</p>
          </div>
        )}
      </main>
    </div>
  );
}
