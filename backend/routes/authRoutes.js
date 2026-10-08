const express = require('express');
const router= express.Router();

router.post('/signup',(req,res)=>{
 res.json({
        message: 'Signup route is working'
    });
})
router.post('login',(req,res)=>{
    res.json({
        message:'login router is working'
    })
})
module.exports = router;