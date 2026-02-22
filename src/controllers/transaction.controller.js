const mongoose = require('mongoose');
const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const emailService = require('../services/email.service');

/**
 * - Create a new Transaction
 *  The 10 steps Transfer Flow
    * 1. Validate Request
    * 2. Validate Idempotency_Key
    * 3. Check account Status
    * 4. Derive Bank Balance
    * 5. Create a Transaction
    * 6. Create Debit Ledger
    * 7. Create Credit Ledger
    * 8. Mark Transaction Completed
    * 9. Commit MongoDB Session
    * 10.Send notification email 
 */

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, ToAccount, Amount and IdempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    });

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    });

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {

        if (isTransactionAlreadyExists.status === "Completed") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "Pending") {
            return res.status(200).json({
                message: "Transaction is still Processing"
            })
        }
        if (isTransactionAlreadyExists.status === "Failed") {
            return res.status(500).json({
                message: "Transaction processing Failed",
            })
        }
        if (isTransactionAlreadyExists.status === "Reversed") {
            return res.status(500).json({
                message: "Transaction was Reversed please try again",
            })
        }
    }

    if (fromUserAccount.status !== "Active" || toUserAccount.status !== "Active") {
        return res.status(400).json({
            message: "Both the FromAccount and the ToAccount must be Active"
        })
    }

    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, and requested amount is ${amount}`
        })
    }

    let transaction;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

         transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            idempotencyKey,
            amount,
            status: 'Pending'
        }], { session }))[0];

        const debitLedger = await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "Debit"
        }], { session })

        const creditLedger = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "Credit"
        }], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "Completed" },
            { session }
        )

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        return res.status(400).json({
            message: "Transaction is Pending due to some issuses, please try after some time"
        })
    }
    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount
    );

    return res.status(200).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}

async function createIntialFundsTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findById(toAccount);

    console.log(toUserAccount)

    if (!toUserAccount) {
        return res.status(400).json({
            message: "The account doesn't exists"
        })
    }

    if (toUserAccount.status !== 'Active') {
        return res.status(400).json({
            message: "The account is not active."
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    });

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        status: "Pending",
        idempotencyKey,
        amount
    })

    const debitLegderEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "Debit",
    }], { session })

    const creditLegderEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "Credit"
    }], { session })

    transaction.status = "Completed";

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message: "Initial funds transaction Completed",
        transaction: transaction
    })
}



module.exports = { createTransaction, createIntialFundsTransaction };