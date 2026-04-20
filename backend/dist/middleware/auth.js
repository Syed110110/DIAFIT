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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let token;
        console.log('Auth middleware: Checking for token in request...');
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Auth middleware: Token found in Authorization header');
        }
        else {
            console.log('Auth middleware: No token in Authorization header');
        }
        if (!token) {
            console.log('Auth middleware: No token provided, sending 401');
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }
        try {
            console.log('Auth middleware: Verifying token...');
            const jwtSecret = process.env.JWT_SECRET || '';
            if (!jwtSecret) {
                console.error('Auth middleware: JWT_SECRET is not defined in environment variables');
                return res.status(500).json({ message: 'Server configuration error' });
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            console.log('Auth middleware: Token verified, user ID:', decoded.id);
            const user = yield User_1.User.findById(decoded.id).select('-password');
            if (!user) {
                console.log('Auth middleware: User not found in database');
                return res.status(401).json({ message: 'User not found' });
            }
            console.log('Auth middleware: User found:', user._id);
            req.user = user;
            next();
        }
        catch (error) {
            console.error('Auth middleware: Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized to access this route' });
        }
    }
    catch (error) {
        console.error('Auth middleware: Unexpected error:', error);
        next(error);
    }
});
exports.protect = protect;
