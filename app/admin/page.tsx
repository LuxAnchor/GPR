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

    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
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

  const handleLock = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'lock' }),
      });

      if (!response.ok) {
        throw new Error('Lock failed');
      }

      await loadPhotos(token);
      alert('照片已锁定，可以分享链接了！');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnlock = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unlock' }),
      });

      if (!response.ok) {
        throw new Error('Unlock failed');
      }

      await loadPhotos(token);
      alert('照片已解锁，可以继续编辑！');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateDisplayName = async (id: string, displayName: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_name: displayName }),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      await loadPhotos(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetViewCode = async (id: string, viewCode: string | null) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ view_code: viewCode }),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      await loadPhotos(token);
      alert(viewCode ? '查看密码设置成功' : '查看密码已移除');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSetAnnotateViewCode = async (id: string, annotateViewCode: string | null) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ annotate_view_code: annotateViewCode }),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      await loadPhotos(token);
      alert(annotateViewCode ? '标注密码设置成功' : '标注密码已移除');
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

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/photo/${code}`;
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  const copyAnnotateLink = (annotateCode: string) => {
    const url = `${window.location.origin}/annotate/${annotateCode}`;
    navigator.clipboard.writeText(url);
    alert('标注链接已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            {error}
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有照片</h3>
            <p className="text-gray-500 mb-6">点击上方"上传照片"按钮开始管理您的毕业合照</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={handleDelete}
                onLock={handleLock}
                onUnlock={handleUnlock}
                onUpdateDisplayName={handleUpdateDisplayName}
                onSetViewCode={handleSetViewCode}
                onSetAnnotateViewCode={handleSetAnnotateViewCode}
                onExport={handleExport}
                onCopyLink={copyLink}
                onCopyAnnotateLink={copyAnnotateLink}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PhotoCard({
  photo,
  onDelete,
  onLock,
  onUnlock,
  onUpdateDisplayName,
  onSetViewCode,
  onSetAnnotateViewCode,
  onExport,
  onCopyLink,
  onCopyAnnotateLink,
}: {
  photo: Photo;
  onDelete: (id: string) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
  onSetViewCode: (id: string, viewCode: string | null) => void;
  onSetAnnotateViewCode: (id: string, annotateViewCode: string | null) => void;
  onExport: (photo: Photo) => void;
  onCopyLink: (code: string) => void;
  onCopyAnnotateLink: (annotateCode: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(photo.display_name || '');
  const [isSettingViewCode, setIsSettingViewCode] = useState(false);
  const [viewCode, setViewCode] = useState(photo.view_code || '');
  const [isSettingAnnotateCode, setIsSettingAnnotateCode] = useState(false);
  const [annotateViewCode, setAnnotateViewCode] = useState(photo.annotate_view_code || '');

  const handleSaveName = () => {
    onUpdateDisplayName(photo.id, displayName);
    setIsEditingName(false);
  };

  const handleSaveViewCode = () => {
    onSetViewCode(photo.id, viewCode || null);
    setIsSettingViewCode(false);
  };

  const handleSaveAnnotateCode = () => {
    onSetAnnotateViewCode(photo.id, annotateViewCode || null);
    setIsSettingAnnotateCode(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img
          src={`/api/photos/${photo.id}/image`}
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
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="输入照片名称"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsEditingName(false)}
              className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 truncate flex-1">
              {photo.display_name || photo.originalname}
            </h3>
            <button
              onClick={() => setIsEditingName(true)}
              className="ml-2 p-1 text-blue-500 hover:text-blue-700"
              title="编辑名称"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        )}
        {photo.display_name && (
          <p className="text-xs text-gray-400 mb-1">
            原文件名: {photo.originalname}
          </p>
        )}
        <p className="text-sm text-gray-500 mb-3">
          已标注: {photo.faces.length} 人
        </p>

        <div className="space-y-2 mb-3">
          {isSettingViewCode ? (
            <div className="p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={viewCode}
                  onChange={(e) => setViewCode(e.target.value)}
                  placeholder="设置查看密码（留空移除）"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveViewCode}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsSettingViewCode(false)}
                  className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsSettingViewCode(true)}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <Key className="h-3 w-3" />
              {photo.view_code ? '查看密码：已设置' : '设置查看密码'}
            </button>
          )}

          {isSettingAnnotateCode ? (
            <div className="p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={annotateViewCode}
                  onChange={(e) => setAnnotateViewCode(e.target.value)}
                  placeholder="设置标注密码（留空移除）"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSaveAnnotateCode}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsSettingAnnotateCode(false)}
                  className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsSettingAnnotateCode(true)}
              className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              <EyeOff className="h-3 w-3" />
              {photo.annotate_view_code ? '标注密码：已设置' : '设置标注密码'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Link
            href={`/admin/photo/${photo.id}/annotate`}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            标注
          </Link>
          {photo.islocked === 1 ? (
            <button
              onClick={() => onUnlock(photo.id)}
              className="w-full flex items-center justify-center px-3 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 text-sm"
            >
              <Unlock className="h-4 w-4 mr-1" />
              解锁
            </button>
          ) : (
            <button
              onClick={() => onLock(photo.id)}
              className="w-full flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm"
            >
              <Lock className="h-4 w-4 mr-1" />
              锁定
            </button>
          )}
          {photo.islocked === 1 && (
            <>
              <button
                onClick={() => onCopyLink(photo.code)}
                className="w-full flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                复制查看链接
              </button>
              <a
                href={`/photo/${photo.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                查看
              </a>
              <button
                onClick={() => onExport(photo)}
                className="w-full flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </button>
            </>
          )}
          {photo.annotate_code && (
            <button
              onClick={() => onCopyAnnotateLink(photo.annotate_code)}
              className="w-full flex items-center justify-center px-3 py-2 bg-teal-50 text-teal-600 rounded hover:bg-teal-100 text-sm"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              复制标注链接
            </button>
          )}
          <button
            onClick={() => onDelete(photo.id)}
            className="w-full flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
