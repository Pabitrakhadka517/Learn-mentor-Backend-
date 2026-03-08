import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
};

console.log(`Testing Cloud: ${config.cloud_name}`);

cloudinary.config(config);

async function testConnection() {
    try {
        const result = await cloudinary.api.ping();
        console.log('SUCCESS:', result);
    } catch (error: any) {
        console.log('FULL ERROR OBJECT:');
        console.log(JSON.stringify(error, null, 2));

        if (error.error) {
            console.log('INNER ERROR:', JSON.stringify(error.error, null, 2));
        }
    }
}

testConnection();
