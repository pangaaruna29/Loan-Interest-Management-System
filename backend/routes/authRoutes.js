const express = require('express');
const router= express.Router();
const authenticate = require('../middleware/authMiddleware');
const authenticateOptional = authenticate.authenticateOptional;
const {
    signup,
    login,
    getSession,
    logout,
    requestPasswordReset,
    resetPassword
} = require('../controllers/authController');

router.post('/signup',signup);
router.post('/login',login);
router.get('/session',authenticateOptional,getSession);
router.post('/logout',logout);
router.post('/forgot-password',requestPasswordReset);
router.post('/reset-password',resetPassword);
module.exports = router;