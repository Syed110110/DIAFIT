"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDefaultTips = exports.createTip = exports.getRandomTip = void 0;
const Tip_1 = require("../models/Tip");
// Get random active tip
const getRandomTip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = req.query.category;
        // Build query
        const query = { isActive: true };
        if (category) {
            query.category = category;
        }
        // Count total matching tips
        const count = yield Tip_1.Tip.countDocuments(query);
        if (count === 0) {
            return res.status(404).json({ message: 'No tips found' });
        }
        // Get a random tip
        const random = Math.floor(Math.random() * count);
        const tip = yield Tip_1.Tip.findOne(query).skip(random);
        res.status(200).json(tip);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getRandomTip = getRandomTip;
// Create new tip (admin only)
const createTip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, content } = req.body;
        if (!category || !content) {
            return res.status(400).json({ message: 'Please provide category and content' });
        }
        const tip = new Tip_1.Tip({
            category,
            content,
            isActive: true
        });
        yield tip.save();
        res.status(201).json(tip);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createTip = createTip;
// Initialize default tips
const initializeDefaultTips = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield Tip_1.Tip.countDocuments();
        // Only add default tips if none exist
        if (count === 0) {
            const defaultTips = [
                {
                    category: 'hydration',
                    content: 'Staying hydrated helps maintain blood sugar levels and supports kidney function. Try to drink water before meals.'
                },
                {
                    category: 'nutrition',
                    content: 'Choose complex carbohydrates over simple ones to help manage blood sugar levels better.'
                },
                {
                    category: 'exercise',
                    content: 'Regular physical activity can lower your blood sugar for up to 24 hours after you exercise.'
                },
                {
                    category: 'glucose',
                    content: 'Check your blood sugar before, during, and after exercise, especially if you take insulin.'
                },
                {
                    category: 'general',
                    content: 'Get enough sleep! Poor sleep can affect insulin sensitivity and make managing diabetes more difficult.'
                }
            ];
            yield Tip_1.Tip.insertMany(defaultTips);
            console.log('Default tips initialized');
        }
    }
    catch (error) {
        console.error('Error initializing default tips:', error);
    }
});
exports.initializeDefaultTips = initializeDefaultTips;
