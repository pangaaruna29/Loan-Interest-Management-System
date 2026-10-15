const user = require('../models/users');
const bycrypt = require('bcryptjs');
const registerUser = async (userData) => {
    const { userName, phoneNumber, email, password } = userData;
    const validateEmail = email.trim().toLowerCase();
     const validatePassword = await bycrypt.hash(password, 6);
    const existingUser = await user.findOne({ email: validateEmail });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = await user.create({
        userName:userName,
        phoneNumber:phoneNumber,
        email: validateEmail,
        password:validatePassword
    })
console.log("Database:", newUser.db.name);
    console.log("Collection:", newUser.collection.name);
    return {
        id: newUser._id,
        userName: newUser.userName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        password: newUser.password
    }

}

const loginUser = async (loginedUser)=>{
const {email,password} = loginedUser;
const validateEmail = email.trim().toLowerCase();
const validatePassword = await bycrypt.compare(password, 6);
return {
    email: validateEmail,
    password:validatePassword  
}
}

module.exports = { registerUser, loginUser }