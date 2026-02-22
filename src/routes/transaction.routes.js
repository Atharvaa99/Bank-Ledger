const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

const transactionRoutes = Router();

transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction);

transactionRoutes.post("/system/inital-funds", authMiddleware.authSystemUserMiddleware,
                        transactionController.createIntialFundsTransaction);


module.exports = transactionRoutes;