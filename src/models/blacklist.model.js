const mongoose = require('mongoose');

const tokenBlcaklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to blacklist"],
        uniquie: [true, "Token is already blacklisted"]
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, { timestamps: true });
 
tokenBlcaklistSchema.index(
    { createdAt: 1 },
    { expiresAfterSeconds: 60 * 60 * 24 * 3 }
)

const tokenBlcaklistModel = mongoose.model('tokenBlacklist',tokenBlcaklistSchema);

module.exports = tokenBlcaklistModel;