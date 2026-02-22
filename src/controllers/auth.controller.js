const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const sendRegistrationEmail = require('../services/email.service');
const tokenBlcaklistModel = require('../models/blacklist.model');

/*
    User registration controller
    POST  /api/auth/register
 */

async function registerUser(req, res) {

    const { email, password, name } = req.body;

    const isExists = await userModel.findOne({
        $or: [
            { email },
            { name }
        ]
    })

    if (isExists) {
        return res.status(422).json({
            message: 'User already exists',
            status: 'Failed'
        })
    }

    const user = await userModel.create({
        email,
        password,
        name
    })

    const token = jwt.sign({
            userId: user._id
        }, process.env.JWT_SECRET,
        {
            expiresIn: '3d'
        });

        res.cookie('token',token);

    res.status(201).json({
        message: 'User Created Succesffully',
        token,
        user
    })

    await  emailService.sendRegistrationEmail(user.email,user.name);

}

/*
    User Login Controller
    POST /api/auth/login
 */
async function loginUser(req,res){

    const {email,name,password} = req.body;

    const user = await userModel.findOne({
        $or:[
            {email},
            {name}
        ]
    }).select('+password');

    if(!user){  
        return res.status(401).json({
            message: "Credentials are not valid"
        })
    }

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Password is incorrect"
        })
    }

    const token = jwt.sign({
        userId: user._id
    },process.env.JWT_SECRET,{
        expiresIn: "3d"
    })

    res.status(200).json({
        message: 'User login Successfull',
        token
    })

}

async function logOut(req,res){

   const header = req.headers.authorization;
    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
    const token = header.split(' ')[1];

    if(!token){
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }

    await tokenBlcaklistModel.create({
        token
    });

    res.status(200).json({
        message: "User logged out successfully"
    })

}


module.exports = { registerUser,loginUser,logOut };