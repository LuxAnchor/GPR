export interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Photo {
  id: string;
  code: string;
  annotate_code: string | null;
  display_name: string | null;
  filename: string;
  originalname: string;
  filepath: string;
  islocked: number;
  user_id: string;
  view_code: string | null;
  annotate_view_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Face {
  id: string;
  photo_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoWithFaces extends Photo {
  faces: Face[];
}

export interface PhotoWithUser extends PhotoWithFaces {
  user: { id: string; username: string };
}
