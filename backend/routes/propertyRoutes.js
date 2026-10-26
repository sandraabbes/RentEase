const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const Property = require('../models/Property');
const User = require('../models/User');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Multer Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper to parse amenities
const parseAmenities = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return val.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
};

// Optional auth helper to check if requester is manager (admin or owner)
const getOptionalUser = (req) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user;
    } catch {
        return null;
    }
};

// Helper to verify property ownership
const checkPropertyOwnership = (property, reqUser) => {
    if (!property || !reqUser) return false;
    if (reqUser.role === 'admin') return true;
    if (!property.owner) return false;
    const ownerId = property.owner._id ? property.owner._id.toString() : property.owner.toString();
    return ownerId === reqUser.id.toString();
};

// @route   GET api/properties
// @desc    Get properties with filters, sorting, and pagination
//          Public: only "available" listings
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            city,
            minPrice,
            maxPrice,
            rooms,
            bedrooms,
            bathrooms,
            propertyType,
            furnished,
            petsAllowed,
            amenities,
            availableFrom,
            status,
            all,
            sortBy,
            page = 1,
            limit = 9,
            noPagination
        } = req.query;

        let query = {};

        // Status filter
        const currentUser = getOptionalUser(req);
        const isManager = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

        if (isManager && (all === 'true' || all === true)) {
            if (status && status !== 'all') {
                query.status = status;
            }
        } else if (isManager && status) {
            query.status = status;
        } else {
            // Public query: strictly available listings
            query.$or = [{ status: 'available' }, { status: { $exists: false } }];
        }

        // City filter
        if (city && city.trim()) {
            query.city = { $regex: city.trim(), $options: 'i' };
        }

        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
        }

        // Rooms count
        if (rooms && !isNaN(rooms)) {
            query.rooms = { $gte: Number(rooms) };
        }

        // Bedrooms count
        if (bedrooms && !isNaN(bedrooms)) {
            query.bedrooms = { $gte: Number(bedrooms) };
        }

        // Bathrooms count
        if (bathrooms && !isNaN(bathrooms)) {
            query.bathrooms = { $gte: Number(bathrooms) };
        }

        // Property Type
        if (propertyType && propertyType !== 'all') {
            const types = propertyType.includes(',')
                ? propertyType.split(',').map(t => t.trim())
                : [propertyType];
            query.propertyType = { $in: types };
        }

        // Furnished
        if (furnished !== undefined && furnished !== '' && furnished !== 'all') {
            query.furnished = furnished === 'true' || furnished === true;
        }

        // Pets allowed
        if (petsAllowed !== undefined && petsAllowed !== '' && petsAllowed !== 'all') {
            query.petsAllowed = petsAllowed === 'true' || petsAllowed === true;
        }

        // Amenities
        if (amenities) {
            const amenList = parseAmenities(amenities);
            if (amenList.length > 0) {
                query.amenities = { $all: amenList };
            }
        }

        // Available From
        if (availableFrom) {
            const dateObj = new Date(availableFrom);
            if (!isNaN(dateObj.getTime())) {
                query.availableFrom = { $lte: dateObj };
            }
        }

        // Sorting
        let sortOption = { date: -1 };
        if (sortBy === 'price_asc') sortOption = { price: 1 };
        else if (sortBy === 'price_desc') sortOption = { price: -1 };
        else if (sortBy === 'surface_desc') sortOption = { surfaceArea: -1 };
        else if (sortBy === 'rooms_desc') sortOption = { rooms: -1 };
        else if (sortBy === 'oldest') sortOption = { date: 1 };

        const total = await Property.countDocuments(query);

        if (noPagination === 'true' || noPagination === true) {
            const properties = await Property.find(query)
                .populate('owner', 'name email')
                .sort(sortOption);
            return res.json({
                properties,
                total,
                page: 1,
                totalPages: 1,
                count: properties.length
            });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 9);
        const skip = (pageNum - 1) * limitNum;

        const properties = await Property.find(query)
            .populate('owner', 'name email')
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);

        res.json({
            properties,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1,
            count: properties.length
        });
    } catch (err) {
        console.error('Error fetching properties:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/properties/manage
// @desc    Get listings for dashboard
//          Owners: ONLY their own listings
//          Admins: all listings
// @access  Private (Owner/Admin)
router.get('/manage', [auth, authorize('owner', 'admin')], async (req, res) => {
    try {
        let query = {};

        // Owners only see their own listings
        if (req.user.role === 'owner') {
            query = { owner: req.user.id };
        }

        const properties = await Property.find(query)
            .populate('owner', 'name email')
            .sort({ date: -1 });

        // Calculate breakdown counts for these specific listings
        const counts = {
            total: properties.length,
            available: properties.filter(p => !p.status || p.status === 'available').length,
            draft: properties.filter(p => p.status === 'draft').length,
            reserved: properties.filter(p => p.status === 'reserved').length,
            rented: properties.filter(p => p.status === 'rented').length,
            archived: properties.filter(p => p.status === 'archived').length
        };

        res.json({ properties, counts, role: req.user.role });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ==========================================
// FAVORITES / SAVED LISTINGS ROUTES (TENANTS)
// ==========================================

router.get('/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.favorites || []);
    } catch (err) {
        console.error('Error fetching favorites:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/favorites/ids', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.favorites || []);
    } catch (err) {
        console.error('Error fetching favorite ids:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/:id/favorite', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const propertyId = req.params.id;
        const exists = user.favorites.some(id => id.toString() === propertyId);

        if (exists) {
            user.favorites = user.favorites.filter(id => id.toString() !== propertyId);
            await user.save();
            return res.json({ favorited: false, favorites: user.favorites });
        } else {
            user.favorites.push(propertyId);
            await user.save();
            return res.json({ favorited: true, favorites: user.favorites });
        }
    } catch (err) {
        console.error('Error toggling favorite:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET api/properties/:id
// @desc    Get single property
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('owner', 'name email');
        if (!property) {
            return res.status(404).json({ msg: 'Property not found' });
        }
        res.json(property);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Property not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST api/properties
// @desc    Create a property tied strictly to the authenticated owner/admin
// @access  Private (Owner or Admin)
router.post('/', [auth, authorize('owner', 'admin'), upload.array('images', 8)], async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            city,
            address,
            lat,
            lng,
            propertyType,
            rooms,
            bedrooms,
            bathrooms,
            surfaceArea,
            furnished,
            amenities,
            petsAllowed,
            depositAmount,
            minLeaseMonths,
            availableFrom,
            status
        } = req.body;

        const imagePaths = req.files && req.files.length > 0
            ? req.files.map(file => `http://localhost:5000/uploads/${file.filename}`)
            : [];

        // Fetch owner user details to cache contact snapshot
        const ownerUser = await User.findById(req.user.id);
        if (!ownerUser) {
            return res.status(404).json({ msg: 'User account not found' });
        }

        const newProperty = new Property({
            title,
            description,
            price: Number(price),
            city,
            address: address || '',
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null,
            propertyType: propertyType || 'Apartment',
            rooms: Number(rooms) || 1,
            bedrooms: bedrooms ? Number(bedrooms) : 1,
            bathrooms: bathrooms ? Number(bathrooms) : 1,
            surfaceArea: surfaceArea ? Number(surfaceArea) : null,
            furnished: furnished === true || furnished === 'true',
            amenities: parseAmenities(amenities),
            petsAllowed: petsAllowed === true || petsAllowed === 'true',
            depositAmount: depositAmount ? Number(depositAmount) : 0,
            minLeaseMonths: minLeaseMonths ? Number(minLeaseMonths) : 1,
            availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
            status: status || 'available',
            images: imagePaths,
            owner: req.user.id, // Strictly tied to authenticated user ID
            ownerDetails: {
                name: ownerUser.name,
                email: ownerUser.email,
                phone: ''
            }
        });

        const property = await newProperty.save();
        res.json(property);
    } catch (err) {
        console.error('Error creating property:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   PATCH api/properties/:id/status
// @desc    Change status of property (owner can only change their own)
// @access  Private (Owner or Admin)
router.patch('/:id/status', [auth, authorize('owner', 'admin')], async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'available', 'reserved', 'rented', 'archived'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ msg: 'Property not found' });

        // Check ownership
        if (!checkPropertyOwnership(property, req.user)) {
            return res.status(403).json({ msg: 'Forbidden: You do not own this listing' });
        }

        property.status = status;
        await property.save();

        res.json(property);
    } catch (err) {
        console.error('Error updating status:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT api/properties/:id
// @desc    Update a property (owner can only edit their own)
// @access  Private (Owner or Admin)
router.put('/:id', [auth, authorize('owner', 'admin'), upload.array('images', 8)], async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ msg: 'Property not found' });

        // Check ownership
        if (!checkPropertyOwnership(property, req.user)) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to modify this listing' });
        }

        const {
            title,
            description,
            price,
            city,
            address,
            lat,
            lng,
            propertyType,
            rooms,
            bedrooms,
            bathrooms,
            surfaceArea,
            furnished,
            amenities,
            petsAllowed,
            depositAmount,
            minLeaseMonths,
            availableFrom,
            status,
            existingImages
        } = req.body;

        let imagePaths = property.images || [];

        if (existingImages !== undefined) {
            try {
                imagePaths = Array.isArray(existingImages)
                    ? existingImages
                    : JSON.parse(existingImages);
            } catch {
                imagePaths = existingImages ? [existingImages] : [];
            }
        }

        if (req.files && req.files.length > 0) {
            const newPaths = req.files.map(file => `http://localhost:5000/uploads/${file.filename}`);
            imagePaths = [...imagePaths, ...newPaths];
        }

        const updateFields = {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(city !== undefined && { city }),
            ...(address !== undefined && { address }),
            ...(lat !== undefined && { lat: lat ? Number(lat) : null }),
            ...(lng !== undefined && { lng: lng ? Number(lng) : null }),
            ...(propertyType !== undefined && { propertyType }),
            ...(rooms !== undefined && { rooms: Number(rooms) }),
            ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
            ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
            ...(surfaceArea !== undefined && { surfaceArea: surfaceArea ? Number(surfaceArea) : null }),
            ...(furnished !== undefined && { furnished: furnished === true || furnished === 'true' }),
            ...(amenities !== undefined && { amenities: parseAmenities(amenities) }),
            ...(petsAllowed !== undefined && { petsAllowed: petsAllowed === true || petsAllowed === 'true' }),
            ...(depositAmount !== undefined && { depositAmount: depositAmount ? Number(depositAmount) : 0 }),
            ...(minLeaseMonths !== undefined && { minLeaseMonths: minLeaseMonths ? Number(minLeaseMonths) : 1 }),
            ...(availableFrom !== undefined && { availableFrom: new Date(availableFrom) }),
            ...(status !== undefined && { status }),
            images: imagePaths
        };

        property = await Property.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json(property);
    } catch (err) {
        console.error('Error updating property:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   DELETE api/properties/:id
// @desc    Delete a property (owner can only delete their own)
// @access  Private (Owner or Admin)
router.delete('/:id', [auth, authorize('owner', 'admin')], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ msg: 'Property not found' });

        // Check ownership
        if (!checkPropertyOwnership(property, req.user)) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to delete this listing' });
        }

        await Property.findByIdAndDelete(req.params.id);

        // Also clean up any messages related to this property
        await Message.deleteMany({ propertyId: req.params.id });

        res.json({ msg: 'Property removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
