"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dietPlanController_1 = require("../controllers/dietPlanController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.protect);
// Routes for diet plans
router.get('/', dietPlanController_1.getUserDietPlans);
router.get('/:planId', dietPlanController_1.getDietPlanById);
router.post('/', dietPlanController_1.createDietPlan);
router.put('/:planId', dietPlanController_1.updateDietPlan);
router.delete('/:planId', dietPlanController_1.deleteDietPlan);
exports.default = router;
