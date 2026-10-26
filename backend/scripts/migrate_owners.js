const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Property = require('../models/Property');
const User = require('../models/User');

dotenv.config({ path: __dirname + '/../.env' });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentease';

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for owner migration...');

        // 1. Ensure admin account exists
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
            console.log('Created admin account');
        }

        // 2. Ensure a sample owner account exists (owner@rentease.com)
        let owner = await User.findOne({ email: 'owner@rentease.com' });
        if (!owner) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            owner = await User.create({
                name: 'Marc Landlord',
                email: 'owner@rentease.com',
                password: hashedPassword,
                role: 'owner'
            });
            console.log('Created owner account: owner@rentease.com / password123');
        }

        // 3. Migrate properties with raw MongoDB collection to handle schema type changes cleanly
        const rawCollection = mongoose.connection.collection('properties');
        const allProperties = await rawCollection.find({}).toArray();

        for (const p of allProperties) {
            let ownerId = admin._id;

            if (p.owner && typeof p.owner === 'object' && p.owner.id) {
                try {
                    ownerId = new mongoose.Types.ObjectId(p.owner.id);
                } catch {
                    ownerId = admin._id;
                }
            } else if (p.owner && mongoose.Types.ObjectId.isValid(p.owner)) {
                ownerId = new mongoose.Types.ObjectId(p.owner);
            }

            // Assign at least two properties specifically to our sample owner for verification
            if (p.title && (p.title.includes('Marsa') || p.title.includes('Duplex'))) {
                ownerId = owner._id;
            }

            await rawCollection.updateOne(
                { _id: p._id },
                {
                    $set: {
                        owner: ownerId,
                        ownerDetails: {
                            name: ownerId.equals(owner._id) ? owner.name : admin.name,
                            email: ownerId.equals(owner._id) ? owner.email : admin.email
                        }
                    }
                }
            );
        }

        console.log(`Migrated ${allProperties.length} properties to valid owner ObjectIds.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
};

migrate();
