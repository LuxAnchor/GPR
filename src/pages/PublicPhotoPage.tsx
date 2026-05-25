import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PhotoWithFaces } from '../types';
import { Camera, AlertCircle, X, Eye, List } from 'lucide-react';

export default function PublicPhotoPage() {
  const { code } = useParams<{ code: string }>();
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [photo, setPhoto] = useState<PhotoWithFaces | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [showNameList, setShowNameList] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [viewCode, setViewCode] = useState('');
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // 按从上到下、从左到右排序人脸
  const sortedFaces = useMemo(() => {
    if (!photo) return [];
    return [...photo.faces]
      .filter(face => face.name)
      .sort((a, b) => {
        // 先按y坐标排序（从上到下）
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) > 50) return yDiff;
        // 如果y坐标相近，按x坐标排序（从左到右）
        return a.x - b.x;
      });
  }, [photo]);

  const handleVerify = async () => {
    if (!code) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const data = await api.verifyPublicPhoto(code, viewCode, name);
      setPhoto(data);
      setIsVerified(true);
      setNeedsVerification(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败，请检查密码和姓名');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadPhoto = async () => {
    if (!code) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPublicPhoto(code);
      setPhoto(data);
      setIsVerified(true);
    } catch (err) {
      // 如果需要验证，显示验证界面
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

  const getFacePosition = (face: typeof photo.faces[0]) => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    return {
      left: (face.x / imageRef.current.naturalWidth) * rect.width,
      top: (face.y / imageRef.current.naturalHeight) * rect.height,
      width: (face.width / imageRef.current.naturalWidth) * rect.width,
      height: (face.height / imageRef.current.naturalHeight) * rect.height,
      centerX: ((face.x + face.width / 2) / imageRef.current.naturalWidth) * rect.width,
      centerY: ((face.y + face.height / 2) / imageRef.current.naturalHeight) * rect.height,
    };
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('face-hotspot')) {
      setSelectedFaceId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 验证界面
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Camera className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">照片访问验证</h2>
            <p className="text-gray-600">请输入访问密码和您的姓名</p>
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
                value={viewCode}
                onChange={(e) => setViewCode(e.target.value)}
                placeholder="请输入访问密码"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">您的姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名（需在标注名单中）"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? '验证中...' : '验证并查看照片'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-xl p-12 max-w-md">
          <AlertCircle className="h-20 w-20 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">访问失败</h2>
          <p className="text-gray-600 mb-6">{error || '照片不存在或链接已失效'}</p>
          <div className="flex items-center justify-center text-gray-400">
            <Camera className="h-5 w-5 mr-2" />
            <span className="text-sm">毕业合照应用</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <header className="bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900">毕业合照</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNameList(!showNameList)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showNameList ? <Eye className="h-4 w-4" /> : <List className="h-4 w-4" />}
              {showNameList ? '隐藏名单' : '显示名单'}
            </button>
            <div className="text-sm text-gray-500">
              点击头像查看姓名
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative" onClick={handleImageClick}>
            <img
              ref={imageRef}
              src={`/uploads/${photo.filename}`}
              alt={photo.display_name || photo.originalname}
              className="w-full h-auto"
              onLoad={() => setPhoto({ ...photo })}
            />
            
            {photo.faces.map((face) => {
              const pos = getFacePosition(face);
              if (!pos) return null;
              
              const isSelected = selectedFaceId === face.id;
              
              return (
                <div
                  key={face.id}
                  data-face-id={face.id}
                  className={`face-hotspot absolute rounded-full cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'bg-orange-500/50 scale-125 ring-4 ring-orange-500'
                      : 'bg-blue-500/20 hover:bg-blue-500/40'
                  }`}
                  style={{
                    left: pos.centerX - Math.min(pos.width, pos.height) / 2,
                    top: pos.centerY - Math.min(pos.width, pos.height) / 2,
                    width: Math.min(pos.width, pos.height),
                    height: Math.min(pos.width, pos.height),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFaceId(isSelected ? null : face.id);
                  }}
                >
                  {isSelected && face.name && (
                    <div
                      className="absolute bg-white rounded-lg shadow-xl px-4 py-2 whitespace-nowrap z-10"
                      style={{
                        left: '50%',
                        top: pos.centerY < 100 ? '100%' : 'auto',
                        bottom: pos.centerY >= 100 ? '100%' : 'auto',
                        transform: 'translateX(-50%)',
                        marginTop: pos.centerY < 100 ? '8px' : 0,
                        marginBottom: pos.centerY >= 100 ? '8px' : 0,
                      }}
                    >
                      <div className="text-lg font-bold text-gray-900">{face.name}</div>
                      <div
                        className="absolute w-3 h-3 bg-white transform rotate-45"
                        style={{
                          left: '50%',
                          top: pos.centerY < 100 ? '-6px' : 'auto',
                          bottom: pos.centerY >= 100 ? '-6px' : 'auto',
                          marginLeft: '-6px',
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="font-semibold">{photo.display_name || photo.originalname}</p>
                <p className="text-sm opacity-80">共标注 {sortedFaces.length} 位同学</p>
              </div>
              <div className="flex items-center text-sm opacity-80">
                <Camera className="h-4 w-4 mr-2" />
                毕业合照
              </div>
            </div>
          </div>
          
          {showNameList && (
            <div className="bg-gray-50 px-6 py-8">
              <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">同学名单</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {sortedFaces.map((face) => {
                  const isSelected = selectedFaceId === face.id;
                  return (
                    <div
                      key={face.id}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow'
                      }`}
                      onClick={() => {
                        setSelectedFaceId(isSelected ? null : face.id);
                        // 滚动到对应头像位置
                        if (!isSelected) {
                          const element = document.querySelector(`[data-face-id="${face.id}"]`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      }}
                    >
                      <div className="text-center">
                        <div className={`font-semibold ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>
                          {face.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {sortedFaces.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无标注名单
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            点击任意头像查看对应姓名，或在名单中点击名字高亮头像
          </p>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center text-gray-400 text-sm">
        <p>毕业合照应用 · 珍藏美好回忆</p>
      </footer>
    </div>
  );
}
