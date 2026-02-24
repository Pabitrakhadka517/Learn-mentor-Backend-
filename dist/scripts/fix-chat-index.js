"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || '';
async function fixIndex() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in environment variables');
        process.exit(1);
    }
    console.log('🔌 Connecting to MongoDB...');
    await mongoose_1.default.connect(MONGO_URI);
    console.log('✅ Connected');
    const db = mongoose_1.default.connection.db;
    const collection = db.collection('chatrooms');
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes on chatrooms:');
    indexes.forEach(idx => console.log(' -', JSON.stringify(idx.key), idx.unique ? '[UNIQUE]' : '', idx.sparse ? '[SPARSE]' : ''));
    const bookingIndex = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return keys.length === 1 && keys[0] === 'booking' && idx.unique;
    });
    if (bookingIndex) {
        console.log('\n🗑️  Dropping stale `booking_1` unique index...');
        await collection.dropIndex('booking_1');
        console.log('✅ Dropped `booking_1` index successfully!');
    }
    else {
        console.log('\n✅ No stale `booking_1` unique index found. Nothing to drop.');
    }
    const oldCompound = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return (keys.length === 3 &&
            idx.key['student'] === 1 &&
            idx.key['tutor'] === 1 &&
            idx.key['booking'] === 1 &&
            idx.unique &&
            !idx.sparse);
    });
    if (oldCompound) {
        const oldIndexName = oldCompound.name || 'student_1_tutor_1_booking_1';
        console.log(`\n🗑️  Dropping old non-sparse compound index: ${oldIndexName}...`);
        await collection.dropIndex(oldIndexName);
        console.log(`✅ Dropped old compound index. Mongoose will recreate it as sparse on next start.`);
    }
    else {
        console.log('\n✅ Compound index is already correct (sparse) or does not exist yet.');
    }
    console.log('\n🎉 Index fix complete! Restart your server to apply the new sparse index.');
    await mongoose_1.default.disconnect();
    process.exit(0);
}
fixIndex().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=fix-chat-index.js.map