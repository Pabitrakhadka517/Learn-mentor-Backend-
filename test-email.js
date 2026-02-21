// Test Email Flow
const fetch = require('node-fetch');

async function testEmailFlow() {
    console.log('🧪 Testing Email Flow...\n');

    try {
        // Test forgot password endpoint
        const response = await fetch('http://localhost:4000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com'
            })
        });

        const result = await response.json();
        
        console.log('📧 Email Test Results:');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.devResetLink) {
            console.log('\n🔗 Development Reset Link:');
            console.log(result.devResetLink);
        }

        if (result.emailPreviewUrl) {
            console.log('\n📷 Email Preview URL (Ethereal):');
            console.log(result.emailPreviewUrl);
            console.log('\n📌 Copy this URL to browser to see the email!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test
testEmailFlow();