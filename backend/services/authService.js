const user = require('../models/users');
const bycrypt = require('bcryptjs');
const registerUser = async (userData) => {
    const { userName, phoneNumber, email, password } = userData;
    const validateEmail = email.trim().toLowerCase();
    const validatePassword = await bycrypt.hash(password, 6);
    const existingUser = await user.findOne({ email: validateEmail });
    if (existingUser) {
        throw new Error({ message: 'User already exists' });
    }
    const newUser = await user.create({
        userName: userName,
        phoneNumber: phoneNumber,
        email: validateEmail,
        password: validatePassword
    })
    return {
        id: newUser._id,
        userName: newUser.userName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        password: newUser.password
    }

}

const loginUser = async (loginedUser) => {
    const { email, password } = loginedUser;
    const validateEmail = email.trim().toLowerCase();
    const users = await user.findOne({ email: validateEmail })
    if (!users) {
        const error = new Error("User not found");
        error.status = 404
        throw error
    }
    const validatePassword = await bycrypt.compare(password, users.password);
    if (!validatePassword) {
        //   throw new Error( "Invalid password");
        const error = new Error("Invalid password");
        error.status = 401
        throw error
    }
    return {
        users
    }
}

module.exports = { registerUser, loginUser }