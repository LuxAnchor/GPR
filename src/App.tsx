import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminHome from "./pages/AdminHome";
import UploadPage from "./pages/UploadPage";
import AnnotatePage from "./pages/AnnotatePage";
import PublicPhotoPage from "./pages/PublicPhotoPage";
import AnnotateLinkPage from "./pages/AnnotateLinkPage";
import LoginPage from "./pages/LoginPage";
import { api, setAuthToken } from "./api/client";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const data = await api.getMe();
      setIsAuthenticated(!!data);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/photo/:code" element={<PublicPhotoPage />} />
        <Route path="/annotate/:code" element={<AnnotateLinkPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/photo/:id/annotate"
          element={
            <ProtectedRoute>
              <AnnotatePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
