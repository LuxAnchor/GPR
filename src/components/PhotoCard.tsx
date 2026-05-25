import { useState } from 'react';
import { Lock, Unlock, Edit, Trash2, Copy, ExternalLink, UserPlus, RefreshCw, Save, Key, EyeOff, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PhotoWithFaces } from '../types';
import { api } from '../api/client';

interface PhotoCardProps {
  photo: PhotoWithFaces;
  onDelete: (id: string) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onRegenerateAnnotateCode: (id: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
}

export function PhotoCard({ photo, onDelete, onLock, onUnlock, onRegenerateAnnotateCode, onUpdateDisplayName }: PhotoCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(photo.display_name || '');
  const [isSettingViewCode, setIsSettingViewCode] = useState(false);
  const [viewCode, setViewCode] = useState(photo.view_code || '');
  const [isSettingAnnotateCode, setIsSettingAnnotateCode] = useState(false);
  const [annotateViewCode, setAnnotateViewCode] = useState(photo.annotate_view_code || '');

  const copyLink = () => {
    const url = `${window.location.origin}/photo/${photo.code}`;
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  const copyAnnotateLink = () => {
    if (photo.annotate_code) {
      const url = `${window.location.origin}/annotate/${photo.annotate_code}`;
      navigator.clipboard.writeText(url);
      alert('标注链接已复制到剪贴板');
    }
  };

  const handleSaveName = () => {
    onUpdateDisplayName(photo.id, displayName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(photo.display_name || '');
    setIsEditingName(false);
  };

  const handleSaveViewCode = async () => {
    try {
      await api.setViewCode(photo.id, viewCode || null);
      alert(viewCode ? '查看密码设置成功' : '查看密码已移除');
      setIsSettingViewCode(false);
      window.location.reload(); // 刷新页面显示最新状态
    } catch (error) {
      alert(error instanceof Error ? error.message : '设置失败');
    }
  };

  const handleSaveAnnotateCode = async () => {
    try {
      await api.setAnnotateViewCode(photo.id, annotateViewCode || null);
      alert(annotateViewCode ? '标注密码设置成功' : '标注密码已移除');
      setIsSettingAnnotateCode(false);
      window.location.reload(); // 刷新页面显示最新状态
    } catch (error) {
      alert(error instanceof Error ? error.message : '设置失败');
    }
  };

  const handleExport = async () => {
    try {
      await api.exportPhoto(photo.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '导出失败');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img
          src={`/uploads/${photo.filename}`}
          alt={photo.display_name || photo.originalname}
          className="w-full h-full object-cover"
        />
        {photo.islocked ? (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm flex items-center">
            <Lock className="h-4 w-4 mr-1" />
            已锁定
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm flex items-center">
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
          <div className="flex items-center gap-2">
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
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <span className="text-xs">取消</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
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
          <p className="text-xs text-gray-400 mt-1">
            原文件名: {photo.originalname}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          已标注: {photo.faces.length} 人
        </p>
        <p className="text-xs text-gray-400 mt-1">
          创建时间: {new Date(photo.created_at).toLocaleDateString()}
        </p>
        
        {/* 查看密码设置 */}
        {isSettingViewCode ? (
          <div className="mt-3 p-2 bg-gray-50 rounded">
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
            <p className="text-xs text-gray-500 mt-1">
              设置后查看需要输入密码 + 本人姓名
            </p>
          </div>
        ) : (
          <button
            onClick={() => setIsSettingViewCode(true)}
            className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <Key className="h-3 w-3" />
            {photo.view_code ? '查看密码：已设置' : '设置查看密码'}
          </button>
        )}
        
        {/* 标注密码设置 */}
        {isSettingAnnotateCode ? (
          <div className="mt-3 p-2 bg-gray-50 rounded">
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
            className="mt-2 text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            <EyeOff className="h-3 w-3" />
            {photo.annotate_view_code ? '标注密码：已设置' : '设置标注密码'}
          </button>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/admin/photo/${photo.id}/annotate`}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            标注
          </Link>
          {photo.islocked ? (
            <button
              onClick={() => onUnlock(photo.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 text-sm"
            >
              <Unlock className="h-4 w-4 mr-1" />
              解锁
            </button>
          ) : (
            <button
              onClick={() => onLock(photo.id)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm"
            >
              <Lock className="h-4 w-4 mr-1" />
              锁定
            </button>
          )}
          {photo.islocked === 1 && (
            <>
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                复制查看链接
              </button>
              <a
                href={`/photo/${photo.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                查看
              </a>
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                导出
              </button>
            </>
          )}
          {photo.annotate_code && (
            <>
              <button
                onClick={copyAnnotateLink}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-50 text-teal-600 rounded hover:bg-teal-100 text-sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                复制标注链接
              </button>
              <a
                href={`/annotate/${photo.annotate_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center px-3 py-2 bg-cyan-50 text-cyan-600 rounded hover:bg-cyan-100 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                查看标注链接
              </a>
            </>
          )}
          <button
            onClick={() => onRegenerateAnnotateCode(photo.id)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            重置标注链接
          </button>
          <button
            onClick={() => {
              if (confirm('确定要删除这张照片吗？')) {
                onDelete(photo.id);
              }
            }}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
