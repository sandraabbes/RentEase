const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Property = require('../models/Property');
const User = require('../models/User');

dotenv.config({ path: __dirname + '/../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentease';

const sampleProperties = [
    {
        title: 'Seaside Villa with Infinity Pool',
        description: 'Exquisite 4-bedroom contemporary villa perched on the hills of Sidi Bou Said. Offers panoramic Mediterranean sea views, private heated swimming pool, landscaped garden, and high-end Italian finishes.',
        price: 3400,
        depositAmount: 3400,
        city: 'Sidi Bou Said',
        address: '14 Rue Habib Thameur',
        lat: 36.8703,
        lng: 10.3418,
        propertyType: 'Villa',
        rooms: 6,
        bedrooms: 4,
        bathrooms: 3,
        surfaceArea: 280,
        furnished: true,
        petsAllowed: true,
        minLeaseMonths: 12,
        availableFrom: new Date('2026-11-01'),
        status: 'available',
        amenities: ['Swimming Pool', 'Garden', 'Balcony', 'Air Conditioning', 'WiFi', 'Parking', 'Security'],
        images: [
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Bright Penthouse in Les Berges du Lac 2',
        description: 'Spectacular top-floor penthouse with huge wraparound terrace. Features designer lighting, open American kitchen, floor-to-ceiling windows, and private underground double parking.',
        price: 2100,
        depositAmount: 2100,
        city: 'Tunis',
        address: 'Blvd de l\'Euro, Les Berges du Lac 2',
        lat: 36.8329,
        lng: 10.2642,
        propertyType: 'Penthouse',
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        surfaceArea: 185,
        furnished: true,
        petsAllowed: false,
        minLeaseMonths: 6,
        availableFrom: new Date('2026-11-15'),
        status: 'available',
        amenities: ['Elevator', 'Balcony', 'Air Conditioning', 'Parking', 'WiFi', 'Central Heating', 'Security'],
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Modern Minimalist Studio by the Beach',
        description: 'Charming, fully equipped modern studio located 3 minutes walking distance from the Marsa Plage beach. Perfect for young professionals or digital nomads. Fast fiber internet included.',
        price: 850,
        depositAmount: 850,
        city: 'La Marsa',
        address: '8 Avenue Taieb Mhiri',
        lat: 36.8782,
        lng: 10.3247,
        propertyType: 'Studio',
        rooms: 1,
        bedrooms: 1,
        bathrooms: 1,
        surfaceArea: 48,
        furnished: true,
        petsAllowed: false,
        minLeaseMonths: 3,
        availableFrom: new Date('2026-10-28'),
        status: 'available',
        amenities: ['WiFi', 'Air Conditioning', 'Washing Machine', 'Dishwasher'],
        images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Spacious Family Apartment in El Menzah',
        description: 'Quiet 3-bedroom family apartment with double living room, master suite with walk-in closet, central heating, and dedicated basement storage room.',
        price: 1300,
        depositAmount: 1300,
        city: 'Tunis',
        address: 'Avenue Othman Ibn Affane, El Menzah 6',
        lat: 36.8375,
        lng: 10.1712,
        propertyType: 'Apartment',
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        surfaceArea: 140,
        furnished: false,
        petsAllowed: true,
        minLeaseMonths: 12,
        availableFrom: new Date('2026-12-01'),
        status: 'available',
        amenities: ['Elevator', 'Balcony', 'Central Heating', 'Parking', 'Storage'],
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Historic Carthage Duplex with Citrus Garden',
        description: 'Character-filled 2-story duplex located in residential Carthage Byrsa. Boasts traditional high ceilings, a private private courtyard with lemon trees, and renovated marble bathrooms.',
        price: 1950,
        depositAmount: 1950,
        city: 'Carthage',
        address: '22 Rue Hannibal',
        lat: 36.8528,
        lng: 10.3233,
        propertyType: 'Duplex',
        rooms: 5,
        bedrooms: 3,
        bathrooms: 2,
        surfaceArea: 160,
        furnished: true,
        petsAllowed: true,
        minLeaseMonths: 12,
        availableFrom: new Date('2026-11-10'),
        status: 'available',
        amenities: ['Garden', 'Parking', 'WiFi', 'Air Conditioning', 'Central Heating'],
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Cozy City Loft near Avenue Bourguiba',
        description: 'Industrial-chic loft with brick walls, exposed metal beams, and mezzanine sleeping area. Located in the vibrant heart of Tunis downtown.',
        price: 980,
        depositAmount: 980,
        city: 'Tunis',
        address: '42 Avenue Habib Bourguiba',
        lat: 36.8002,
        lng: 10.1865,
        propertyType: 'Loft',
        rooms: 2,
        bedrooms: 1,
        bathrooms: 1,
        surfaceArea: 68,
        furnished: true,
        petsAllowed: false,
        minLeaseMonths: 6,
        availableFrom: new Date('2026-10-30'),
        status: 'reserved',
        amenities: ['Air Conditioning', 'WiFi', 'Elevator', 'Washing Machine'],
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
        ]
    },
    {
        title: 'Exclusive Gammarth Hilltop House',
        description: 'Modern luxury home in Gammarth Superior with private infinity pool, gym, 24/7 security guard post, and smart home automation.',
        price: 4200,
        depositAmount: 4200,
        city: 'La Marsa',
        address: 'Route de Gammarth',
        lat: 36.8995,
        lng: 10.2850,
        propertyType: 'House',
        rooms: 7,
        bedrooms: 5,
        bathrooms: 4,
        surfaceArea: 380,
        furnished: true,
        petsAllowed: true,
        minLeaseMonths: 12,
        availableFrom: new Date('2026-12-15'),
        status: 'draft',
        amenities: ['Swimming Pool', 'Gym', 'Garden', 'Security', 'Parking', 'Air Conditioning', 'WiFi'],
        images: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
        ]
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Create default admin / owner if not exists
        let admin = await User.findOne({ email: 'admin@rentease.com' });
        if (!admin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            admin = await User.create({
                name: 'RentEase Admin',
                email: 'admin@rentease.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Created default admin: admin@rentease.com / password123');
        }

        // Create default tenant if not exists
        let tenant = await User.findOne({ email: 'tenant@rentease.com' });
        if (!tenant) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            tenant = await User.create({
                name: 'Sarah Tenant',
                email: 'tenant@rentease.com',
                password: hashedPassword,
                role: 'user'
            });
            console.log('Created default tenant: tenant@rentease.com / password123');
        }

        // Update existing listings or insert samples
        const existingCount = await Property.countDocuments();
        if (existingCount < 5) {
            for (const propData of sampleProperties) {
                const newP = new Property({
                    ...propData,
                    owner: {
                        id: admin._id,
                        name: admin.name,
                        email: admin.email
                    }
                });
                await newP.save();
            }
            console.log(`Inserted ${sampleProperties.length} rich sample properties.`);
        } else {
            // Ensure existing properties have status and coordinates updated if missing
            await Property.updateMany(
                { status: { $exists: false } },
                { $set: { status: 'available' } }
            );
            console.log(`Existing properties verified.`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err.message);
        process.exit(1);
    }
};

seedDB();
