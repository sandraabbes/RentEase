const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Property = require('../models/Property');

// ─────────────────────────────────────────────────────────
// POST /api/conversations
// Start or resume a conversation for a property (tenant)
// Body: { propertyId, message }
// ─────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
    try {
        const { propertyId, message } = req.body;

        if (!propertyId || !message) {
            return res.status(400).json({ msg: 'propertyId and message are required' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ msg: 'Property not found' });
        }

        const ownerId = property.owner;
        const tenantId = req.user.id;

        // Prevent owner from messaging themselves
        if (ownerId.toString() === tenantId) {
            return res.status(400).json({ msg: 'You cannot message your own listing' });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            property: propertyId,
            tenant: tenantId
        });

        if (!conversation) {
            conversation = new Conversation({
                property: propertyId,
                tenant: tenantId,
                owner: ownerId
            });
        }

        // Create the message
        const newMsg = new Message({
            conversation: conversation._id,
            sender: tenantId,
            body: message,
            readBy: [tenantId]
        });

        await newMsg.save();

        // Update conversation metadata
        conversation.lastMessage = {
            body: message,
            sender: tenantId,
            date: new Date()
        };
        conversation.unreadOwner += 1;
        conversation.updatedAt = new Date();

        await conversation.save();

        // Populate and return
        const populated = await Conversation.findById(conversation._id)
            .populate('property', 'title city images')
            .populate('tenant', 'name email')
            .populate('owner', 'name email');

        res.json(populated);
    } catch (err) {
        console.error('Error creating conversation:', err.message);
        if (err.code === 11000) {
            // Duplicate key — race condition, just fetch existing
            const existing = await Conversation.findOne({
                property: req.body.propertyId,
                tenant: req.user.id
            })
                .populate('property', 'title city images')
                .populate('tenant', 'name email')
                .populate('owner', 'name email');
            return res.json(existing);
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/conversations
// List conversations for current user (tenant or owner)
// ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let filter;
        if (role === 'owner' || role === 'admin') {
            // Owners see conversations where they're the property owner
            filter = { owner: userId };
        } else {
            // Tenants see conversations where they're the tenant
            filter = { tenant: userId };
        }

        const conversations = await Conversation.find(filter)
            .populate('property', 'title city images')
            .populate('tenant', 'name email')
            .populate('owner', 'name email')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error('Error fetching conversations:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/conversations/unread-count
// Get total unread count for the current user
// ─────────────────────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let filter;
        let unreadField;

        if (role === 'owner' || role === 'admin') {
            filter = { owner: userId, unreadOwner: { $gt: 0 } };
            unreadField = '$unreadOwner';
        } else {
            filter = { tenant: userId, unreadTenant: { $gt: 0 } };
            unreadField = '$unreadTenant';
        }

        const result = await Conversation.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: unreadField } } }
        ]);

        res.json({ unread: result.length > 0 ? result[0].total : 0 });
    } catch (err) {
        console.error('Error fetching unread count:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/conversations/:id/messages
// Get all messages in a conversation (must be participant)
// ─────────────────────────────────────────────────────────
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        // Verify participation
        const userId = req.user.id;
        const isParticipant =
            conversation.tenant.toString() === userId ||
            conversation.owner.toString() === userId;

        if (!isParticipant) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const messages = await Message.find({ conversation: req.params.id })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/conversations/:id/messages
// Send a reply in a conversation (must be participant)
// Body: { message }
// ─────────────────────────────────────────────────────────
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ msg: 'Message body is required' });
        }

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        const userId = req.user.id;
        const isTenant = conversation.tenant.toString() === userId;
        const isOwner = conversation.owner.toString() === userId;

        if (!isTenant && !isOwner) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const newMsg = new Message({
            conversation: conversation._id,
            sender: userId,
            body: message,
            readBy: [userId]
        });

        await newMsg.save();

        // Update conversation metadata
        conversation.lastMessage = {
            body: message,
            sender: userId,
            date: new Date()
        };

        if (isTenant) {
            conversation.unreadOwner += 1;
        } else {
            conversation.unreadTenant += 1;
        }

        conversation.updatedAt = new Date();
        await conversation.save();

        const populated = await Message.findById(newMsg._id)
            .populate('sender', 'name email role');

        res.json(populated);
    } catch (err) {
        console.error('Error sending reply:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/conversations/:id/read
// Mark all messages in a conversation as read for the current user
// ─────────────────────────────────────────────────────────
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        const userId = req.user.id;
        const isTenant = conversation.tenant.toString() === userId;
        const isOwner = conversation.owner.toString() === userId;

        if (!isTenant && !isOwner) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversation._id,
                readBy: { $ne: userId }
            },
            { $addToSet: { readBy: userId } }
        );

        // Reset unread counter for the side
        if (isTenant) {
            conversation.unreadTenant = 0;
        } else {
            conversation.unreadOwner = 0;
        }

        await conversation.save();

        res.json({ msg: 'Marked as read' });
    } catch (err) {
        console.error('Error marking as read:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
