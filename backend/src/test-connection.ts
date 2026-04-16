import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';

console.log('Attempting to connect to MongoDB Atlas...');
console.log(`Using URI: ${MONGODB_URI.replace(/\/\/.*?@/, '//***@')}`); // Hide credentials in logs

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Check available collections - with null check for db
    if (mongoose.connection.db) {
      mongoose.connection.db.listCollections().toArray()
        .then(collections => {
          console.log('Available collections:');
          if (collections.length === 0) {
            console.log('No collections found. Database may be empty.');
          } else {
            collections.forEach(collection => {
              console.log(`- ${collection.name}`);
            });
          }
          mongoose.connection.close();
          console.log('Connection closed.');
        })
        .catch(err => {
          console.error('Error listing collections:', err);
          mongoose.connection.close();
        });
    } else {
      console.log('Database not available yet. Connection may still be initializing.');
      mongoose.connection.close();
      console.log('Connection closed.');
    }
  })
  .catch((error) => {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
  }); 