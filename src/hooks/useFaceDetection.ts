import { useState, useCallback } from 'react';
import { detectFacesLocal } from '../utils/faceDetection';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export function useFaceDetection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);

  const detectFaces = useCallback(async (
    imageElement: HTMLImageElement
  ): Promise<FaceDetection[]> => {
    setLoading(true);
    setError(null);
    setLoadingProgress('准备中...');
    setProgressPercent(0);
    
    try {
      const faces = await detectFacesLocal(imageElement, (progress, message) => {
        setProgressPercent(progress);
        setLoadingProgress(message);
      });
      
      setLoading(false);
      return faces;
    } catch (err) {
      console.error('Face detection error:', err);
      setError('人脸识别失败，请尝试手动标注');
      setLoading(false);
      setLoadingProgress('');
      return [];
    }
  }, []);

  return {
    detectFaces,
    loading,
    error,
    loadingProgress,
    progressPercent,
    modelsLoaded: true,
    reloadModels: async () => {},
  };
}
