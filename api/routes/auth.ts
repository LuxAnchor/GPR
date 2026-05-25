import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-2025';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user as any;
    next();
  });
};

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  console.log('Attempting to register user:', username);

  // 检查用户是否已存在
  const existingUser = userRepository.findByUsername(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在，请使用其他用户名' });
  }

  const user = userRepository.create(username, password);
  if (!user) {
    console.error('User creation failed');
    return res.status(500).json({ error: '用户创建失败，请稍后重试' });
  }

  console.log('User created successfully:', user);

  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ user, token: accessToken });
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = userRepository.findByUsername(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const passwordValid = userRepository.verifyPassword(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const safeUser = { id: user.id, username: user.username, created_at: user.created_at };
  res.json({ user: safeUser, token: accessToken });
});

router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user) {
    const user = userRepository.findById(req.user.id);
    res.json({ user });
  } else {
    res.sendStatus(401);
  }
});

export default router;
