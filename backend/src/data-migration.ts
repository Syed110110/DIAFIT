import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Source (local) MongoDB connection string
const SOURCE_MONGODB_URI = 'mongodb://localhost:27017/diafit';

// Destination (Atlas) MongoDB connection string
const DEST_MONGODB_URI = process.env.MONGODB_URI || '';

if (!DEST_MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function migrateData() {
  console.log('Starting data migration from local MongoDB to MongoDB Atlas...');
  
  // Connect to source database
  console.log('Connecting to source database...');
  const sourceConnection = await mongoose.createConnection(SOURCE_MONGODB_URI);
  console.log('Connected to source database.');
  
  // Connect to destination database
  console.log('Connecting to destination database (Atlas)...');
  const destConnection = await mongoose.createConnection(DEST_MONGODB_URI);
  console.log('Connected to destination database.');
  
  try {
    // Check if source database is available
    if (!sourceConnection.db) {
      throw new Error('Source database not available');
    }
    
    // Check if destination database is available
    if (!destConnection.db) {
      throw new Error('Destination database not available');
    }
    
    // Get all collections from source database
    const collections = await sourceConnection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in source database. Nothing to migrate.');
      return;
    }
    
    console.log(`Found ${collections.length} collections to migrate.`);
    
    // Create a directory for backup
    const backupDir = path.join(__dirname, '../backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Process each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      // Get all documents from source collection
      const documents = await sourceConnection.db.collection(collectionName).find({}).toArray();
      console.log(`Found ${documents.length} documents in ${collectionName}`);
      
      // Backup documents to file
      const backupPath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(documents, null, 2));
      console.log(`Backed up ${collectionName} to ${backupPath}`);
      
      if (documents.length > 0) {
        // Insert documents into destination collection
        if (documents.length > 1000) {
          // For large collections, insert in batches
          const batchSize = 500;
          for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            await destConnection.db.collection(collectionName).insertMany(batch);
            console.log(`Inserted batch ${i/batchSize + 1} of ${Math.ceil(documents.length/batchSize)} for ${collectionName}`);
          }
        } else {
          // For smaller collections, insert all at once
          await destConnection.db.collection(collectionName).insertMany(documents);
        }
        console.log(`Successfully migrated ${documents.length} documents to ${collectionName}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close both connections
    await sourceConnection.close();
    await destConnection.close();
    console.log('Database connections closed.');
  }
}

migrateData()
  .then(() => {
    console.log('Migration process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 