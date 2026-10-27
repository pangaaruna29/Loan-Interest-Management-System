const user = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const publicUser = (record) => ({
    id: record._id,
    userName: record.userName,
    phoneNumber: record.phoneNumber,
    email: record.email
});

const createToken = (record) => {
    if (!process.env.JWT_SECRET) {
        const error = new Error('JWT_SECRET is not configured');
        error.status = 500;
        throw error;
    }

    return jwt.sign({ sub: record._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

const registerUser = async (userData) => {
    const { userName, phoneNumber, email, password } = userData;
    const validateEmail = email.trim().toLowerCase();
    const existingUser = await user.findOne({ email: validateEmail });
    if (existingUser) {
        const error = new Error('User already exists');
        error.status = 409;
        throw error;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await user.create({
        userName: userName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: validateEmail,
        password: passwordHash
    });
    return publicUser(newUser);
};

const getUserById = async (id) => {
    const record = await user.findById(id);
    return record ? publicUser(record) : null;
};

const loginUser = async (credentials) => {
    const { email, password } = credentials;
    const validateEmail = email.trim().toLowerCase();
    const existingUser = await user.findOne({ email: validateEmail }).select('+password');
    if (!existingUser) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatches) {
        const error = new Error('Invalid email or password');
        error.status = 401;
        throw error;
    }

    return {
        token: createToken(existingUser),
        user: publicUser(existingUser)
    };
};

module.exports = { registerUser, getUserById, loginUser }