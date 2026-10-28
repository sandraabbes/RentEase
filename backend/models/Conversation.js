const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        body: { type: String, default: '' },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now }
    },
    unreadOwner: {
        type: Number,
        default: 0
    },
    unreadTenant: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index: one conversation per tenant-property pair
ConversationSchema.index({ tenant: 1, property: 1 }, { unique: true });
ConversationSchema.index({ owner: 1, updatedAt: -1 });
ConversationSchema.index({ tenant: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
