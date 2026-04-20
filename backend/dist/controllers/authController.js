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
exports.signin = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const generateToken = (id) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET is not defined in environment variables');
        throw new Error('Server configuration error');
    }
    console.log('Generating token for user ID:', id);
    const token = jsonwebtoken_1.default.sign({ id }, jwtSecret, {
        expiresIn: '30d',
    });
    console.log('Token generated successfully');
    return token;
};
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Signup attempt with data:', Object.assign(Object.assign({}, req.body), { password: '[HIDDEN]' }));
        const { name, email, password } = req.body;
        // Check if user exists
        const userExists = yield User_1.User.findOne({ email });
        if (userExists) {
            console.log('Signup failed: User already exists with email:', email);
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create user
        const user = yield User_1.User.create({
            name,
            email,
            password,
        });
        if (user) {
            console.log('User created successfully:', user._id);
            const token = generateToken(user._id.toString());
            // Send response with token
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: token,
            });
        }
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.signup = signup;
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Signin attempt with email:', req.body.email);
        const { email, password } = req.body;
        // Find user by email
        const user = yield User_1.User.findOne({ email }).select('+password');
        if (!user) {
            console.log('Signin failed: User not found with email:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            console.log('Signin failed: Invalid password for user:', user._id);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('User authenticated successfully:', user._id);
        const token = generateToken(user._id.toString());
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
        });
    }
    catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.signin = signin;
