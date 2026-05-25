import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PhotoCard } from '../components/PhotoCard';
import { usePhotoStore } from '../stores/photoStore';
import { api } from '../api/client';
import { Camera, AlertCircle } from 'lucide-react';

export default function AdminHome() {
  const { photos, setPhotos, removePhotoFromList, updatePhotoInList, loading, setLoading, error, setError } = usePhotoStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPhotos();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await api.deletePhoto(id);
      removePhotoFromList(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const handleLock = async (id: string) => {
    try {
      await api.lockPhoto(id);
      const updatedPhoto = await api.getPhoto(id);
      updatePhotoInList(updatedPhoto);
      alert('照片已锁定，可以分享链接了！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '锁定失败');
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      await api.unlockPhoto(id);
      const updatedPhoto = await api.getPhoto(id);
      updatePhotoInList(updatedPhoto);
      alert('照片已解锁，可以继续编辑！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '解锁失败');
    }
  };

  const handleRegenerateAnnotateCode = async (id: string) => {
    try {
      await api.regenerateAnnotateCode(id);
      const updatedPhoto = await api.getPhoto(id);
      updatePhotoInList(updatedPhoto);
      alert('标注链接已重新生成！');
    } catch (err) {
      alert(err instanceof Error ? err.message : '重置失败');
    }
  };

  const handleUpdateDisplayName = async (id: string, displayName: string) => {
    try {
      await api.updateDisplayName(id, displayName);
      const updatedPhoto = await api.getPhoto(id);
      updatePhotoInList(updatedPhoto);
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新名称失败');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">照片管理</h1>
            <p className="mt-2 text-gray-600">管理毕业合照，标注人脸并生成访问链接</p>
          </div>
          <div className="bg-white rounded-lg shadow px-6 py-4">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
                <p className="text-sm text-gray-500">照片总数</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无照片</h3>
          <p className="text-gray-500 mb-6">上传第一张毕业合照开始管理</p>
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
              onRegenerateAnnotateCode={handleRegenerateAnnotateCode}
              onUpdateDisplayName={handleUpdateDisplayName}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
