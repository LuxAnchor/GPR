'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Shield, Users, Download } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎓 毕业合照管理系统
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            轻松管理毕业合照，安全分享美好回忆
          </p>
          
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/admin"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                进入管理后台
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  登录 / 注册
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">照片上传</h3>
            <p className="text-gray-600">支持拖拽上传，简单便捷</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">人脸标注</h3>
            <p className="text-gray-600">可视化标注，保护隐私</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">密码保护</h3>
            <p className="text-gray-600">双重验证，安全可靠</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">离线导出</h3>
            <p className="text-gray-600">导出zip包，离线查看</p>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>✨ 使用 React + Next.js + Vercel 构建</p>
        </div>
      </div>
    </div>
  );
}
