const user = require('../models/users');
const bycrypt = require('bcryptjs');

const registerUser = async (userData) => {
    const { userName, phoneNumber, email, password } = userData;
    const validateEmail = email.trim().toLowerCase();
    const validatePassword = await bcrypt.hash(password, 6);
    const existingUser = await user.findOne({ email: validateEmail });

    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new user({
        userName,
        phoneNumber,
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
// const loginUser = async (loginedUser)=>{

// }

module.exports = { registerUser }