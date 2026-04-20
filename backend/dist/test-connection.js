"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';
console.log('Attempting to connect to MongoDB Atlas...');
console.log(`Using URI: ${MONGODB_URI.replace(/\/\/.*?@/, '//***@')}`); // Hide credentials in logs
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('Connection state:', mongoose_1.default.connection.readyState);
    // Check available collections - with null check for db
    if (mongoose_1.default.connection.db) {
        mongoose_1.default.connection.db.listCollections().toArray()
            .then(collections => {
            console.log('Available collections:');
            if (collections.length === 0) {
                console.log('No collections found. Database may be empty.');
            }
            else {
                collections.forEach(collection => {
                    console.log(`- ${collection.name}`);
                });
            }
            mongoose_1.default.connection.close();
            console.log('Connection closed.');
        })
            .catch(err => {
            console.error('Error listing collections:', err);
            mongoose_1.default.connection.close();
        });
    }
    else {
        console.log('Database not available yet. Connection may still be initializing.');
        mongoose_1.default.connection.close();
        console.log('Connection closed.');
    }
})
    .catch((error) => {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
});
