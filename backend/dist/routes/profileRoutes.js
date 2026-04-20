"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes are protected and require authentication
router.use(auth_1.protect);
router.get('/', profileController_1.getUserProfile);
router.put('/', profileController_1.updateProfile);
exports.default = router;
