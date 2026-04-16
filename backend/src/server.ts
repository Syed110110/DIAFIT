import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import waterRoutes from './routes/waterRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import tipRoutes from './routes/tipRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import dietPlanRoutes from './routes/dietPlanRoutes';
import { initializeDefaultTips } from './controllers/tipController';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  dbName: 'diafit',  // Explicitly set database name to 'diafit'
  autoIndex: true    // Ensure indexes are created
})
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully');
    console.log(`Using database: ${mongoose.connection.db?.databaseName || 'diafit'}`);
    // Initialize default tips
    initializeDefaultTips();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit with failure
  });

// Log more details about the connection
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to:', mongoose.connection.name);
  // Log the available collections for debugging
  if (mongoose.connection.db) {
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Available collections:', collections.map(c => c.name).join(', '));
      })
      .catch(err => console.error('Error listing collections:', err));
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/dietplans', dietPlanRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to DiaFit API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 