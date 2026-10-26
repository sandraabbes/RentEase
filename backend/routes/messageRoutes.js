const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const Message = require('../models/Message');
const Property = require('../models/Property');

// @route   POST api/messages
// @desc    Send an inquiry message for a property
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { propertyId, userEmail, message } = req.body;

        if (!propertyId || !userEmail || !message) {
            return res.status(400).json({ msg: 'Please provide propertyId, your email, and a message' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ msg: 'Property not found' });
        }

        const newMessage = new Message({
            propertyId,
            userEmail,
            message
        });

        const savedMessage = await newMessage.save();
        res.json(savedMessage);
    } catch (err) {
        console.error('Error saving message:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/messages
// @desc    Get messages
//          Owners: ONLY messages for their own properties
//          Admins: all messages
// @access  Private (Owner or Admin)
router.get('/', [auth, authorize('owner', 'admin')], async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'owner') {
            // Find all properties owned by this owner
            const ownerProperties = await Property.find({ owner: req.user.id }).select('_id');
            const ownerPropertyIds = ownerProperties.map(p => p._id);

            // Filter messages strictly to this owner's properties
            filter = { propertyId: { $in: ownerPropertyIds } };
        }

        const messages = await Message.find(filter)
            .populate('propertyId', 'title city address owner')
            .sort({ date: -1 });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE api/messages/:id
// @desc    Delete a message (Owner can only delete messages for their own properties)
// @access  Private (Owner or Admin)
router.delete('/:id', [auth, authorize('owner', 'admin')], async (req, res) => {
    try {
        const message = await Message.findById(req.params.id).populate('propertyId', 'owner');

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Ownership check
        if (req.user.role === 'owner') {
            const propOwner = message.propertyId && message.propertyId.owner
                ? message.propertyId.owner.toString()
                : null;

            if (propOwner !== req.user.id.toString()) {
                return res.status(403).json({ msg: 'Forbidden: You cannot delete messages for another owner\'s property' });
            }
        }

        await Message.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Message removed' });
    } catch (err) {
        console.error('Error deleting message:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Message not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
