const user = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const { sendResetPasswordEmail } = require('./emailService');
const { getPasswordResetFrontendUrl } = require('../config/frontendOrigins');

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

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
        const error = new Error('User not found');
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

const requestPasswordReset = async (email, requestOrigin) => {
    const normalizedEmail = email.trim().toLowerCase();
    const resetUrl = new URL('/reset-password', getPasswordResetFrontendUrl(requestOrigin));
    const existingUser = await user.findOne({ email: normalizedEmail });
    if (!existingUser) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await user.updateOne(
        { _id: existingUser._id },
        { $set: { resetPasswordToken: tokenHash, resetPasswordExpires: expiresAt } }
    );

    resetUrl.searchParams.set('token', token);

    try {
        await sendResetPasswordEmail(normalizedEmail, resetUrl.toString());
    } catch (emailError) {
        try {
            await user.updateOne(
                { _id: existingUser._id, resetPasswordToken: tokenHash },
                { $set: { resetPasswordToken: null, resetPasswordExpires: null } }
            );
        } catch (cleanupError) {
            console.error('Failed to clear the reset token after email failure:', cleanupError.message);
        }

        if (emailError.code !== 'EMAIL_CONFIGURATION_MISSING') {
            console.error('Password reset email delivery failed:', emailError.message);
        }

        const error = new Error(
            emailError.code === 'EMAIL_CONFIGURATION_MISSING'
                ? emailError.message
                : 'Unable to send the password reset email. Check the backend mail configuration and server logs.'
        );
        error.status = 503;
        throw error;
    }
};

const resetPassword = async (token, password) => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const matchingUser = await user.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() }
    });

    if (!matchingUser) {
        const error = new Error('This password reset link is invalid or has expired');
        error.status = 400;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const updatedUser = await user.findOneAndUpdate(
        {
            _id: matchingUser._id,
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: new Date() }
        },
        {
            $set: { password: passwordHash },
            $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
        }
    );

    if (!updatedUser) {
        const error = new Error('This password reset link is invalid or has expired');
        error.status = 400;
        throw error;
    }
};

module.exports = { registerUser, getUserById, loginUser, requestPasswordReset, resetPassword };