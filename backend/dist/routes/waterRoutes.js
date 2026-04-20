"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const waterController_1 = require("../controllers/waterController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes are protected and require authentication
router.use(auth_1.protect);
router.post('/', waterController_1.addWaterIntake);
router.get('/today', waterController_1.getTodayWaterIntake);
router.delete('/:entryId', waterController_1.deleteWaterEntry);
exports.default = router;
