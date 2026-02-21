"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = seedAdmin;
const auth_repository_1 = require("./auth.repository");
const user_model_1 = require("./user.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@learnmentor.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const existingAdmin = await user_model_1.User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return;
        }
        const passwordHash = await auth_repository_1.AuthRepository.hashPassword(adminPassword);
        const admin = await auth_repository_1.AuthRepository.createUser(adminEmail, passwordHash, 'ADMIN', 'System Administrator');
        await auth_repository_1.AuthRepository.updateVerificationStatus(admin._id.toString(), true);
        await auth_repository_1.AuthRepository.updateActiveStatus(admin._id.toString(), true);
        console.log('✅ Admin user created successfully');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('   ⚠️  IMPORTANT: Change the admin password after first login!');
    }
    catch (error) {
        console.error('❌ Error seeding admin user:', error);
        throw error;
    }
}
if (require.main === module) {
    const mongoose = require('mongoose');
    const connectDB = require('../../config/db').default;
    connectDB()
        .then(() => seedAdmin())
        .then(() => {
        console.log('Seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=auth.seeding.js.map