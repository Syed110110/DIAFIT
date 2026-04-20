"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exerciseController_1 = require("../controllers/exerciseController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes are protected and require authentication
router.use(auth_1.protect);
router.post('/', exerciseController_1.addExerciseEntry);
router.get('/today', exerciseController_1.getTodayExercise);
router.get('/types', exerciseController_1.getExerciseTypes);
router.delete('/:entryId', exerciseController_1.deleteExerciseEntry);
exports.default = router;
