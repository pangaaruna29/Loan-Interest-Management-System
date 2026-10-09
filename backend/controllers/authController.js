const service = require('../services/authService');

const signup = async (req, res) => {
    try {
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
const login = async(req,res)=>{
    try{
        const user = req.body;
        return res.status(201).json({
            message: 'User logined successfully',
            user
        });
    }
    catch(error){
        return res.status(error.status || 500).json({
            message: error.message || 'Internal Server Error'
         });
    }
}

module.exports = { 
    signup,
    login
 };
