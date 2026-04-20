"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tip = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tipSchema = new mongoose_1.default.Schema({
    category: {
        type: String,
        enum: ['nutrition', 'exercise', 'hydration', 'glucose', 'general'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'tips'
});
exports.Tip = mongoose_1.default.model('Tip', tipSchema);
