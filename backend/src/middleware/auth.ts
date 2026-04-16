import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
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

    try {
      console.log('Auth middleware: Verifying token...');
      const jwtSecret = process.env.JWT_SECRET || '';
      if (!jwtSecret) {
        console.error('Auth middleware: JWT_SECRET is not defined in environment variables');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      console.log('Auth middleware: Token verified, user ID:', decoded.id);

      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('Auth middleware: User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('Auth middleware: User found:', user._id);
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware: Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
  } catch (error) {
    console.error('Auth middleware: Unexpected error:', error);
    next(error);
  }
}; 