import { AuthRepository } from './auth.repository';
import { User } from './user.model';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed admin user
 * This script creates an admin account if it doesn't exist
 */
export async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@learnmentor.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return;
        }

        // Hash password
        const passwordHash = await AuthRepository.hashPassword(adminPassword);

        // Create admin user
        const admin = await AuthRepository.createUser(
            adminEmail,
            passwordHash,
            'ADMIN',
            'System Administrator'
        );

        // Ensure admin is verified and active
        await AuthRepository.updateVerificationStatus(admin._id.toString(), true);
        await AuthRepository.updateActiveStatus(admin._id.toString(), true);

        console.log('✅ Admin user created successfully');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  IMPORTANT: Change the admin password after first login!');
    } catch (error) {
        console.error('❌ Error seeding admin user:', error);
        throw error;
    }
}

/**
 * Run seeding if this file is executed directly
 */
if (require.main === module) {
    const mongoose = require('mongoose');
    const connectDB = require('../../config/db').default;

    connectDB()
        .then(() => seedAdmin())
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error: any) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}
