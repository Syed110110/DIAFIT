import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole, findIdentityById } from '../Services/identityService';

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        _id: import('mongoose').Types.ObjectId;
        name: string;
        email: string;
        role: UserRole;
      };
      patientId?: import('mongoose').Types.ObjectId;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    console.log('Auth middleware: Checking for token in request...');

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware: Token found in Authorization header');
    } else {
      console.log('Auth middleware: No token in Authorization header');
    }

    if (!token) {
      console.log('Auth middleware: No token provided, sending 401');
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    const jwtSecret = process.env.JWT_SECRET || '';
    if (!jwtSecret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    const identity = await findIdentityById(decoded.id);
    if (!identity || !identity.is_active) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = {
      id: identity.id.trim(),
      _id: new Types.ObjectId(identity.id.trim()),
      name: identity.name,
      email: identity.email,
      role: identity.role,
    };
    next();
  } catch (error) {
    console.error('Auth middleware: Unexpected error:', error);
    res.status(503).json({ message: 'Authentication service is temporarily unavailable' });
  }
}; 