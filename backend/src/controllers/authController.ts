import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { createIdentity, findIdentityByEmail, UserRole, userRoles } from '../Services/identityService';
import { ensureLegacyUserMirror } from '../Services/legacyUserMirror';

const generateToken = (id: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('Server configuration error');
  }
  
  console.log('Generating token for user ID:', id);
  const token = jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d',
  });
  console.log('Token generated successfully');
  return token;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
        !email.trim() || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Provide a name, valid email, and password of at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createIdentity({
      id: new Types.ObjectId().toString(),
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      role: 'PATIENT',
    });
    try {
      await ensureLegacyUserMirror(user);
    } catch (mirrorError) {
      console.error('Could not create legacy tracker profile for new identity:', mirrorError);
    }
    const token = generateToken(user.id.trim());

    res.status(201).json({
      _id: user.id.trim(),
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    console.log('Signin attempt with email:', req.body.email);
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findIdentityByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch || !user.is_active) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id.trim());
    
    res.json({
      _id: user.id.trim(),
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    if (!name?.trim() || !email?.trim() || !password || password.length < 8 ||
        !role || !userRoles.includes(role)) {
      return res.status(400).json({ message: 'Provide name, email, a password of at least 8 characters, and a valid role' });
    }

    const user = await createIdentity({
      id: new Types.ObjectId().toString(),
      name: name.trim(),
      email: email.trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
    try {
      await ensureLegacyUserMirror(user);
    } catch (mirrorError) {
      console.error('Could not create legacy tracker profile for provisioned identity:', mirrorError);
    }

    res.status(201).json({
      _id: user.id.trim(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Admin user creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};