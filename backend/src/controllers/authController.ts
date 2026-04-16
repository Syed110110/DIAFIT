import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

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
    console.log('Signup attempt with data:', { ...req.body, password: '[HIDDEN]' });
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Signup failed: User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      console.log('User created successfully:', user._id);
      const token = generateToken(user._id);
      
      // Send response with token
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    console.log('Signin attempt with email:', req.body.email);
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('Signin failed: User not found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Signin failed: Invalid password for user:', user._id);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User authenticated successfully:', user._id);
    const token = generateToken(user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 