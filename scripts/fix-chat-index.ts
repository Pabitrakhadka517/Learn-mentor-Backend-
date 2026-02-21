/**
 * One-time fix script: Drop stale `booking_1` unique index from chatrooms collection.
 *
 * This old index was a single-field unique index on `booking`, which caused:
 *   E11000 duplicate key error collection: Learnmentor.chatrooms index: booking_1 dup key: { booking: null }
 *
 * Because MongoDB treats all `null` values as the same key in a unique index.
 *
 * Run with: npx ts-node scripts/fix-chat-index.ts
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || '';

async function fixIndex() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in environment variables');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db!;
    const collection = db.collection('chatrooms');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes on chatrooms:');
    indexes.forEach(idx => console.log(' -', JSON.stringify(idx.key), idx.unique ? '[UNIQUE]' : '', idx.sparse ? '[SPARSE]' : ''));

    // Drop the stale single-field booking_1 index if it exists
    const bookingIndex = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return keys.length === 1 && keys[0] === 'booking' && idx.unique;
    });

    if (bookingIndex) {
        console.log('\n🗑️  Dropping stale `booking_1` unique index...');
        await collection.dropIndex('booking_1');
        console.log('✅ Dropped `booking_1` index successfully!');
    } else {
        console.log('\n✅ No stale `booking_1` unique index found. Nothing to drop.');
    }

    // Also drop the old non-sparse compound index if it exists, so Mongoose can recreate it as sparse
    const oldCompound = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return (
            keys.length === 3 &&
            idx.key['student'] === 1 &&
            idx.key['tutor'] === 1 &&
            idx.key['booking'] === 1 &&
            idx.unique &&
            !idx.sparse
        );
    });

    if (oldCompound) {
        const oldIndexName = oldCompound.name || 'student_1_tutor_1_booking_1';
        console.log(`\n🗑️  Dropping old non-sparse compound index: ${oldIndexName}...`);
        await collection.dropIndex(oldIndexName);
        console.log(`✅ Dropped old compound index. Mongoose will recreate it as sparse on next start.`);
    } else {
        console.log('\n✅ Compound index is already correct (sparse) or does not exist yet.');
    }

    console.log('\n🎉 Index fix complete! Restart your server to apply the new sparse index.');
    await mongoose.disconnect();
    process.exit(0);
}

fixIndex().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
