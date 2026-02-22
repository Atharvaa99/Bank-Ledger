const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const tokenBlacklistModel = require('../models/blacklist.model');

async function authMiddleware(req, res, next) {

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }
    const token = header.split(' ')[1];

    const isBlacklisted = await tokenBlacklistModel.findOne({ token:token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized token is blacklisted"
        })
    }
    /*const token = req.cookies.token;
    if(!token){
        return res.status(401).json({
            message: "Unauthorized access token is missing"
        })
    } */

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findOne({ _id: decoded.userId });

        req.user = user

        return next();

    } catch (err) {
        console.log('Failed to verify token: ', err);
        return res.status(401).json({
            message: 'Unauthorized access invalid token'
        })
    }

}

async function authSystemUserMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Unauthorized'
        })
    }

    const token = authHeader.split(' ')[1];

    const isBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized token is blacklisted"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId).select("+systemUser");
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user;

        return next();

    } catch (err) {
        console.log(err);
        return res.status(401).json({
            message: "Invalid Token"
        })
    }
}


module.exports = { authMiddleware, authSystemUserMiddleware };