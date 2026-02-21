// Create Test User for Password Reset Testing
const fetch = require('node-fetch');

async function createTestUser() {
    console.log('👤 Creating test user for password reset testing...\n');

    try {
        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'TestPassword@123',
                fullName: 'Test User',
                role: 'STUDENT'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Test user created successfully!');
            console.log('📧 Email: test@example.com');
            console.log('🔑 Password: TestPassword@123');
            console.log('\n🎯 Ready to test password reset!');
        } else {
            if (result.message?.includes('already exists')) {
                console.log('ℹ️  Test user already exists - ready to test!');
                console.log('📧 Email: test@example.com');
            } else {
                console.log('❌ Failed to create test user:', result.message);
            }
        }

        console.log('\n🚀 Now run: node test-password-reset-fix.js');

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    }
}

createTestUser();