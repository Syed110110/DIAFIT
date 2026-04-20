"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nutritionController_1 = require("../controllers/nutritionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes are protected and require authentication
router.use(auth_1.protect);
router.post('/', nutritionController_1.addFoodEntry);
router.get('/today', nutritionController_1.getTodayNutrition);
router.delete('/:entryId', nutritionController_1.deleteNutritionEntry);
exports.default = router;
