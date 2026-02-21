import mongoose from 'mongoose';
import { User } from '../src/modules/auth/user.model';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fix admin role case - ensures admin role is uppercase 'ADMIN'
 */
async function fixAdminRole() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Learnmentor';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find users with lowercase admin role
        const adminUsers = await User.find({ role: { $in: ['admin', 'tutor', 'student'] } });
        
        console.log(`Found ${adminUsers.length} users with lowercase roles`);

        for (const user of adminUsers) {
            let newRole = user.role;
            
            // Convert to uppercase
            if (user.role === 'admin') newRole = 'ADMIN';
            if (user.role === 'student') newRole = 'STUDENT';
            if (user.role === 'tutor') newRole = 'TUTOR';

            if (newRole !== user.role) {
                await User.updateOne(
                    { _id: user._id },
                    { role: newRole }
                );
                console.log(`✅ Updated user ${user.email}: ${user.role} → ${newRole}`);
            }
        }

        console.log('✅ Admin role fix completed successfully');
    } catch (error) {
        console.error('❌ Error fixing admin role:', error);
        throw error;
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the script
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

export { fixAdminRole };