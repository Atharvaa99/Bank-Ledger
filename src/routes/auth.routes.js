const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/* POST */
router.post('/register',authController.registerUser);
router.post('/login',authController.loginUser);
router.post('/logout',authController.logOut);


module.exports = router;