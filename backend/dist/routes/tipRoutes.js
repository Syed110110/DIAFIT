"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tipController_1 = require("../controllers/tipController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public route for getting a tip
router.get('/random', tipController_1.getRandomTip);
// Protected routes
router.use(auth_1.protect);
router.post('/', tipController_1.createTip);
exports.default = router;
