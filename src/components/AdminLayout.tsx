import { Link, useNavigate } from 'react-router-dom';
import { Camera, Upload, Lock, Eye, LogOut } from 'lucide-react';
import { setAuthToken } from '../api/client';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">毕业合照管理</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600"
              >
                <Eye className="h-5 w-5 mr-2" />
                照片列表
              </Link>
              <Link
                to="/admin/upload"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="h-5 w-5 mr-2" />
                上传照片
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5 mr-2" />
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
