"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterEntry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const waterEntrySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'waterentries'
});
// Create an index on user and date for fast lookups
waterEntrySchema.index({ user: 1, date: 1 });
exports.WaterEntry = mongoose_1.default.model('WaterEntry', waterEntrySchema);
