import type { PhotoWithFaces, Face } from '../types';

const API_BASE = '/api/photos';
const AUTH_BASE = '/api/auth';

let token = localStorage.getItem('auth_token');

export const setAuthToken = (newToken: string | null) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('auth_token', newToken);
  } else {
    localStorage.removeItem('auth_token');
  }
};

const getHeaders = (contentType?: string) => {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  return headers;
};

export const api = {
  login: async (username: string, password: string): Promise<{ user: any; token: string }> => {
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '登录失败');
    }

    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  register: async (username: string, password: string): Promise<{ user: any; token: string }> => {
    const response = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '注册失败');
    }

    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  getMe: async (): Promise<{ user: any } | null> => {
    if (!token) return null;
    const response = await fetch(`${AUTH_BASE}/me`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      setAuthToken(null);
      return null;
    }
    return response.json();
  },

  uploadPhoto: async (file: File): Promise<{ id: string; code: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }
    
    return response.json();
  },

  getPhotos: async (): Promise<PhotoWithFaces[]> => {
    const response = await fetch(API_BASE, { headers: getHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setAuthToken(null);
      }
      throw new Error('获取照片列表失败');
    }
    return response.json();
  },

  getPhoto: async (id: string): Promise<PhotoWithFaces> => {
    const response = await fetch(`${API_BASE}/${id}`, { headers: getHeaders() });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取照片失败');
    }
    return response.json();
  },

  lockPhoto: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'lock' }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '锁定照片失败');
    }
  },

  unlockPhoto: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'unlock' }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '解锁照片失败');
    }
  },

  updateDisplayName: async (id: string, displayName: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'display-name', displayName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新照片名称失败');
    }
  },

  setViewCode: async (id: string, viewCode: string | null): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'view-code', viewCode }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '设置查看密码失败');
    }
  },

  setAnnotateViewCode: async (id: string, annotateViewCode: string | null): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'annotate-view-code', annotateViewCode }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '设置标注密码失败');
    }
  },

  regenerateAnnotateCode: async (id: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ action: 'regenerate-annotate-code' }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '重新生成标注链接失败');
    }
    
    const data = await response.json();
    return data.annotateCode;
  },

  deletePhoto: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除照片失败');
    }
  },

  createFace: async (photoId: string, x: number, y: number, width: number, height: number, name: string = ''): Promise<Face> => {
    const response = await fetch(`${API_BASE}/faces`, {
      method: 'POST',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ photoId, x, y, width, height, name }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建人脸标注失败');
    }
    
    return response.json();
  },

  updateFace: async (id: string, x: number, y: number, width: number, height: number, name: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/faces/${id}`, {
      method: 'PUT',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ x, y, width, height, name }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新人脸标注失败');
    }
  },

  deleteFace: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/faces/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除人脸标注失败');
    }
  },

  verifyPublicPhoto: async (code: string, viewCode?: string, name?: string): Promise<PhotoWithFaces> => {
    const response = await fetch(`${API_BASE}/public?code=${code}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '验证失败');
    }
    return response.json();
  },

  verifyAnnotatePhoto: async (annotateCode: string, annotateViewCode?: string): Promise<PhotoWithFaces> => {
    const response = await fetch(`${API_BASE}/annotate?code=${annotateCode}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '验证失败');
    }
    return response.json();
  },

  getPublicPhoto: async (code: string): Promise<PhotoWithFaces> => {
    const response = await fetch(`${API_BASE}/public?code=${code}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取照片失败');
    }
    return response.json();
  },

  getAnnotatePhoto: async (code: string): Promise<PhotoWithFaces> => {
    const response = await fetch(`${API_BASE}/annotate?code=${code}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '获取照片失败');
    }
    return response.json();
  },

  exportPhoto: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/${id}/export`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '导出失败');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = 'photo.zip';
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches) {
        fileName = matches[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
