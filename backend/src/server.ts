import './config/loadEnv';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { postgresPool } from './config/postgres';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import waterRoutes from './routes/waterRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import tipRoutes from './routes/tipRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import dietPlanRoutes from './routes/dietPlanRoutes';
import { initializeDefaultTips } from './controllers/tipController';
import reminderRoutes from './routes/reminderRoutes';
import patientAccessRoutes from './routes/patientAccessRoutes';
import careDataRoutes from './routes/careDataRoutes';
import initWhatsappCron from './Services/whatsappCronService';
import initDoseScheduler from './Services/doseScheduler';
import { auditApiRequest } from './middleware/audit';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(auditApiRequest);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/dietplans', dietPlanRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/patients', patientAccessRoutes);
app.use('/api/care', careDataRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DiaFit API' });
});

app.get('/health', async (_req, res) => {
  try {
    await postgresPool.query('SELECT 1');
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'not_ready', database: 'mongodb_disconnected' });
      return;
    }
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'not_ready', database: 'postgresql_disconnected' });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Configure PostgreSQL before starting the backend.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required before starting the authentication service.');
  }

  await postgresPool.query('SELECT 1');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';
  await mongoose.connect(mongoUri, { dbName: 'diafit', autoIndex: true });
  await initializeDefaultTips();
  initDoseScheduler();
  if (process.env.ENABLE_WHATSAPP_CRON === 'true') {
    initWhatsappCron();
  } else {
    console.log('WhatsApp reminder scheduler disabled; set ENABLE_WHATSAPP_CRON=true to enable it.');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Backend startup failed:', error);
  process.exit(1);
});