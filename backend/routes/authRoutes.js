const express = require('express');
const router= express.Router();
const authenticate = require('../middleware/authMiddleware');
const authenticateOptional = authenticate.authenticateOptional;
const {signup,login,getSession,logout} = require('../controllers/authController');

router.post('/signup',signup);
router.post('/login',login);
router.get('/session',authenticateOptional,getSession);
router.post('/logout',logout);
module.exports = router;