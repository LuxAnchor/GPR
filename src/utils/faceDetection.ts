import * as faceapi from 'face-api.js';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

let modelsLoaded = false;
let isLoadingModels = false;

export async function loadModels(
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  if (modelsLoaded) return;
  if (isLoadingModels) {
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (modelsLoaded) {
          clearInterval(check);
          resolve(undefined);
        }
      }, 100);
    });
    return;
  }
  
  isLoadingModels = true;
  
  try {
    if (onProgress) onProgress(10, '正在加载模型...');
    
    const MODEL_URL = '/models';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    
    if (onProgress) onProgress(100, '模型加载完成！');
    
    modelsLoaded = true;
  } finally {
    isLoadingModels = false;
  }
}

export async function detectFacesLocal(
  imageElement: HTMLImageElement,
  onProgress?: (progress: number, message: string) => void
): Promise<FaceDetection[]> {
  if (!modelsLoaded) {
    await loadModels(onProgress);
  }

  if (onProgress) onProgress(30, '正在检测...');
  
  let detections: any[] = [];
  try {
    // === 只简单快速一轮！不卡！
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 640,
      scoreThreshold: 0.2,
    });
    detections = await faceapi.detectAllFaces(imageElement, options);
  } catch (e) {
    console.error('检测失败:', e);
  }
  
  if (onProgress) onProgress(80, '处理中...');
  
  // === 简单去重和扩大框 ===
  const finalFaces = detections.map(d => {
    const box = d.box;
    const expand = 0.15;
    return {
      x: Math.max(0, box.x - box.width * expand),
      y: Math.max(0, box.y - box.height * expand),
      width: box.width * (1 + expand * 2),
      height: box.height * (1 + expand * 2),
      confidence: d.score,
    };
  });
  
  if (onProgress) onProgress(100, `检测完成！共 ${finalFaces.length} 人`);
  
  return finalFaces;
}
