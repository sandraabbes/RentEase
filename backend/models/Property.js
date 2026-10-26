const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        default: '',
        trim: true
    },
    lat: {
        type: Number,
        default: null
    },
    lng: {
        type: Number,
        default: null
    },
    propertyType: {
        type: String,
        enum: ['Apartment', 'House', 'Studio', 'Villa', 'Duplex', 'Loft', 'Penthouse', 'Room', 'Other'],
        default: 'Apartment'
    },
    rooms: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    bedrooms: {
        type: Number,
        default: 1,
        min: 0
    },
    bathrooms: {
        type: Number,
        default: 1,
        min: 0
    },
    surfaceArea: {
        type: Number,
        default: null,
        min: 0
    },
    furnished: {
        type: Boolean,
        default: false
    },
    amenities: {
        type: [String],
        default: []
    },
    petsAllowed: {
        type: Boolean,
        default: false
    },
    depositAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    minLeaseMonths: {
        type: Number,
        default: 1,
        min: 1
    },
    availableFrom: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'available', 'reserved', 'rented', 'archived'],
        default: 'available',
        index: true
    },
    images: {
        type: [String],
        default: []
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ownerDetails: {
        name: String,
        email: String,
        phone: String
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Property', PropertySchema);
