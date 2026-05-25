import { create } from 'zustand';
import type { PhotoWithFaces } from '../types';

interface PhotoStore {
  photos: PhotoWithFaces[];
  currentPhoto: PhotoWithFaces | null;
  loading: boolean;
  error: string | null;
  setPhotos: (photos: PhotoWithFaces[]) => void;
  setCurrentPhoto: (photo: PhotoWithFaces | null) => void;
  updatePhotoInList: (photo: PhotoWithFaces) => void;
  removePhotoFromList: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePhotoStore = create<PhotoStore>((set) => ({
  photos: [],
  currentPhoto: null,
  loading: false,
  error: null,
  
  setPhotos: (photos) => set({ photos }),
  
  setCurrentPhoto: (photo) => set({ currentPhoto: photo }),
  
  updatePhotoInList: (photo) => set((state) => ({
    photos: state.photos.map((p) => (p.id === photo.id ? photo : p)),
    currentPhoto: state.currentPhoto?.id === photo.id ? photo : state.currentPhoto,
  })),
  
  removePhotoFromList: (id) => set((state) => ({
    photos: state.photos.filter((p) => p.id !== id),
    currentPhoto: state.currentPhoto?.id === id ? null : state.currentPhoto,
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));
