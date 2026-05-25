#!/usr/bin/env python3

"""
人脸识别后端 - 使用 face_recognition 库 (业界最强准确率 99.38%)
适用于毕业合照等多人场景
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ face_recognition 未安装，使用备用方案")
    import cv2
    import numpy as np

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'face_recognition_available': FACE_RECOGNITION_AVAILABLE
    })

@app.route('/api/detect-faces', methods=['POST'])
def detect_faces():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    temp_path = os.path.join(UPLOAD_FOLDER, f'temp_detect_{file.filename}')
    file.save(temp_path)
    
    try:
        if FACE_RECOGNITION_AVAILABLE:
            # === 用业界最强的 face_recognition 库 ===
            image = face_recognition.load_image_file(temp_path)
            
            # 先试 HOG（快）
            face_locations = face_recognition.face_locations(image, model="hog")
            
            # 如果结果太少，试试 CNN（更准但慢）
            if len(face_locations) < 5:
                try:
                    face_locations = face_recognition.face_locations(image, model="cnn")
                except:
                    pass  # 如果 CNN 失败，用 HOG 结果
            
            # 转换坐标 (top, right, bottom, left) → (x, y, width, height)
            faces = []
            for top, right, bottom, left in face_locations:
                width = right - left
                height = bottom - top
                # 稍微扩大一点框
                expand_ratio = 0.12
                faces.append({
                    'x': max(0, int(left - width * expand_ratio)),
                    'y': max(0, int(top - height * expand_ratio)),
                    'width': int(width * (1 + 2 * expand_ratio)),
                    'height': int(height * (1 + 2 * expand_ratio)),
                    'confidence': 0.98  # face_recognition 很准
                })
        else:
            # === 备用方案（如果 face_recognition 没安装）===
            image = cv2.imread(temp_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 用 OpenCV 的 Haar 级联（简单但效果还行）
            try:
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces_cv = face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30)
                )
                
                faces = []
                for (x, y, w, h) in faces_cv:
                    expand_ratio = 0.1
                    faces.append({
                        'x': max(0, int(x - w * expand_ratio)),
                        'y': max(0, int(y - h * expand_ratio)),
                        'width': int(w * (1 + 2 * expand_ratio)),
                        'height': int(h * (1 + 2 * expand_ratio)),
                        'confidence': 0.85
                    })
            except:
                faces = []
        
        result = {
            'success': True,
            'faces': faces,
            'count': len(faces),
            'method': 'face_recognition' if FACE_RECOGNITION_AVAILABLE else 'opencv_haar'
        }
        
        return jsonify(result)
    
    except Exception as e:
        print(f"检测出错: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'faces': []
        }), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    print("🎓 毕业合照人脸检测服务启动!")
    print(f"face_recognition 可用: {FACE_RECOGNITION_AVAILABLE}")
    app.run(host='0.0.0.0', port=5001, debug=True)
