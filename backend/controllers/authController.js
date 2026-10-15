const service = require('../services/authService');
let users = []
const signup = async (req, res) => {
    try {
        const user = await service.registerUser(req.body);
        users.push(user);
        console.log(users, '777', req.body)
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
const getUsers = async (req, res) => {
    try {
        return res.json(users)
    }
    catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
}
const login = async (req, res) => {
    try {
        const user = req.body;
        return res.status(201).json({
            message: 'User logined successfully',
            user
        });
    }
    catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
        });
    }
}

module.exports = {
    signup,
    login,
    getUsers
};
