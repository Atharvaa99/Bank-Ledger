const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, "Ledger must be associated with an account"],
        index: true,
        immutable: true 
    },
    amount:{
        type: Number,
        immutable: true,
        required: [true, "Ledger must be associated with an ammount"],
    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        immutable: true,
        required: [true, "Ledger must be associated with an Transaction"],
        index: true
    },
    type:{
        type: String,
        enum:{
            values: ["Debit", "Credit"],
            message: "Type can be either Debit or Credit"
        },
        required:[true, "Ledger must be associated with an Type"],
        immutable: true
    }
})


function preventLedgerModification(){
    throw new Error("Ledger entries are immutable and can't be modified or deleted.");
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);

const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;
