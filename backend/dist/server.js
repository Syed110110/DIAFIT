"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const waterRoutes_1 = __importDefault(require("./routes/waterRoutes"));
const exerciseRoutes_1 = __importDefault(require("./routes/exerciseRoutes"));
const tipRoutes_1 = __importDefault(require("./routes/tipRoutes"));
const nutritionRoutes_1 = __importDefault(require("./routes/nutritionRoutes"));
const dietPlanRoutes_1 = __importDefault(require("./routes/dietPlanRoutes"));
const tipController_1 = require("./controllers/tipController");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diafit';
console.log('Connecting to MongoDB...');
mongoose_1.default.connect(MONGODB_URI, {
    dbName: 'diafit', // Explicitly set database name to 'diafit'
    autoIndex: true // Ensure indexes are created
})
    .then(() => {
    var _a;
    console.log('Connected to MongoDB Atlas successfully');
    console.log(`Using database: ${((_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName) || 'diafit'}`);
    // Initialize default tips
    (0, tipController_1.initializeDefaultTips)();
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit with failure
});
// Log more details about the connection
mongoose_1.default.connection.on('connected', () => {
    console.log('Mongoose connected to:', mongoose_1.default.connection.name);
    // Log the available collections for debugging
    if (mongoose_1.default.connection.db) {
        mongoose_1.default.connection.db.listCollections().toArray()
            .then(collections => {
            console.log('Available collections:', collections.map(c => c.name).join(', '));
        })
            .catch(err => console.error('Error listing collections:', err));
    }
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/water', waterRoutes_1.default);
app.use('/api/nutrition', nutritionRoutes_1.default);
app.use('/api/exercise', exerciseRoutes_1.default);
app.use('/api/tips', tipRoutes_1.default);
app.use('/api/dietplans', dietPlanRoutes_1.default);
// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to DiaFit API' });
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
