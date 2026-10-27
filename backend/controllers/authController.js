const service = require('../services/authService');
const { sessionCookieName, sessionCookieOptions } = require('../config/auth');

const clearSessionCookie = (res) => res.clearCookie(sessionCookieName, sessionCookieOptions);

const signup = async (req, res) => {
    try {
        const { userName, phoneNumber, email, password } = req.body;
        if (![userName, phoneNumber, email, password].every((value) => typeof value === 'string' && value.trim())) {
            return res.status(400).json({ message: 'Username, phone number, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const user = await service.registerUser(req.body);
        return res.status(201).json({
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = await service.loginUser({ email, password });
        res.cookie(sessionCookieName, result.token, sessionCookieOptions);
        return res.status(200).json({
            message: 'Login successful',
            user: result.user
        });
    }
    catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
}

const getSession = async (req, res) => {
    if (!req.user) {
        clearSessionCookie(res);
        return res.status(200).json({ user: null });
    }
    try {
        const user = await service.getUserById(req.user.id);
        if (!user) {
            clearSessionCookie(res);
            return res.status(401).json({ message: 'Session user no longer exists' });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
};

const logout = (_req, res) => {
    clearSessionCookie(res);
    return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    signup,
    login,
    getSession,
    logout
};
