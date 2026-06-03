import dotenv from 'dotenv';
import path from 'path';

// CRITICAL FIX: Load environment variables BEFORE importing any routes or controllers
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import waterRoutes from './routes/waterRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import tipRoutes from './routes/tipRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import dietPlanRoutes from './routes/dietPlanRoutes';
import { initializeDefaultTips } from './controllers/tipController';
import reminderRoutes from './routes/reminderRoutes';
import initWhatsappCron from './Services/whatsappCronService';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  dbName: 'diafit',  
  autoIndex: true    
})
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully');
    initializeDefaultTips();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); 
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/dietplans', dietPlanRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DiaFit API' });
});

const PORT = process.env.PORT || 5000;
// Initialize the WhatsApp automated reminders
initWhatsappCron();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});