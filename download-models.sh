#!/bin/bash

# Download face-api.js model files
MODELS_DIR="public/models"
BASE_URL="https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

echo "Creating models directory..."
mkdir -p "$MODELS_DIR"

echo "Downloading TinyFaceDetector model files..."
curl -L -o "$MODELS_DIR/tiny_face_detector_model-shard1" \
  "${BASE_URL}/tiny_face_detector_model-shard1"

curl -L -o "$MODELS_DIR/tiny_face_detector_model-weights_manifest.json" \
  "${BASE_URL}/tiny_face_detector_model-weights_manifest.json"

echo "Downloading FaceLandmark68Net model files..."
curl -L -o "$MODELS_DIR/face_landmark_68_model-shard1" \
  "${BASE_URL}/face_landmark_68_model-shard1"

curl -L -o "$MODELS_DIR/face_landmark_68_model-weights_manifest.json" \
  "${BASE_URL}/face_landmark_68_model-weights_manifest.json"

echo "Download complete!"
ls -lh "$MODELS_DIR"
