"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixAdminRole = fixAdminRole;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../src/modules/auth/user.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function fixAdminRole() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Learnmentor';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        const adminUsers = await user_model_1.User.find({ role: { $in: ['admin', 'tutor', 'student'] } });
        console.log(`Found ${adminUsers.length} users with lowercase roles`);
        for (const user of adminUsers) {
            let newRole = user.role;
            if (user.role === 'admin')
                newRole = 'ADMIN';
            if (user.role === 'student')
                newRole = 'STUDENT';
            if (user.role === 'tutor')
                newRole = 'TUTOR';
            if (newRole !== user.role) {
                await user_model_1.User.updateOne({ _id: user._id }, { role: newRole });
                console.log(`✅ Updated user ${user.email}: ${user.role} → ${newRole}`);
            }
        }
        console.log('✅ Admin role fix completed successfully');
    }
    catch (error) {
        console.error('❌ Error fixing admin role:', error);
        throw error;
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
}
if (require.main === module) {
    fixAdminRole()
        .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=fix-admin-role.js.map