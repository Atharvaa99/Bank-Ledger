const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'Transaction must be associated with a FROM ACCOUNT'],
        index: true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user',
        required: [true, 'Transaction must be associated with a TO ACCOUNt'],
        index: true
    },
    status:{
        type:String,
        enum: {
            values: ['Pending','Completed','Failed','Reversed'],
            message: 'Transaction can be either Pending, Completed, Failed or Reversed'
        },
        default: 'Pending'
    },
    amount:{
        type: Number,
        required: [true, 'Transaction must have an Amount'],
        min: [0, "Transaction amount can't be negative"]
    },
    idempotencyKey:{
        type: String,
        required: [true, "Idempontency Key is required for creating a transaction"],
        index: true,
        unique: true
    }
}, {timestamps: true})


const transactionModel = mongoose.model('transaction', transactionSchema);

module.exports = transactionModel;