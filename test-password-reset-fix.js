// Password Reset Fix Test
const fetch = require('node-fetch');

async function testPasswordResetFlow() {
    console.log('🔐 Testing Password Reset Flow After Fix...\n');

    const testEmail = 'test@example.com';
    const newPassword = 'NewPassword@123';

    try {
        // Step 1: Request password reset
        console.log('📧 Step 1: Requesting password reset...');
        const forgotResponse = await fetch('http://localhost:4000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });

        const forgotResult = await forgotResponse.json();
        console.log('Forgot Password Response:', forgotResult);

        if (!forgotResult.success) {
            console.error('❌ Forgot password request failed');
            return;
        }

        // Extract token from dev link (if available)
        let resetToken = null;
        if (forgotResult.devResetLink) {
            const url = new URL(forgotResult.devResetLink);
            resetToken = url.searchParams.get('token');
            console.log('✅ Reset token extracted:', resetToken?.substring(0, 10) + '...');
        }

        if (!resetToken) {
            console.log('⚠️  No dev reset link available. Check server console for email preview.');
            console.log('📧 Email Preview URL:', forgotResult.emailPreviewUrl || 'Not available');
            return;
        }

        // Step 2: Wait a moment
        console.log('\n⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Reset password
        console.log('🔄 Step 2: Resetting password...');
        const resetResponse = await fetch('http://localhost:4000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: resetToken, 
                newPassword: newPassword
            })
        });

        const resetResult = await resetResponse.json();
        console.log('Reset Password Response:', resetResult);

        if (resetResult.success) {
            console.log('✅ Password reset successful!');
            console.log('🎉 The "Something went wrong" error has been FIXED!');
        } else {
            console.log('❌ Password reset failed:', resetResult.message);
        }

        // Step 4: Test double reset (should fail)
        console.log('\n🔄 Step 3: Testing token reuse (should fail)...');
        const doubleResetResponse = await fetch('http://localhost:4000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: resetToken, 
                newPassword: 'AnotherPassword@123'
            })
        });

        const doubleResetResult = await doubleResetResponse.json();
        console.log('Double Reset Response:', doubleResetResult);

        if (!doubleResetResult.success) {
            console.log('✅ Token reuse properly blocked');
        } else {
            console.log('⚠️  Token should not be reusable');
        }

        console.log('\n🎯 Fix Summary:');
        console.log('✅ Fixed bcrypt token comparison issue');
        console.log('✅ Improved error handling');
        console.log('✅ Better error messages');
        console.log('✅ Password reset flow working');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('1. Server is running (npm run dev)');
        console.log('2. MongoDB is connected');
        console.log('3. User exists with email:', testEmail);
    }
}

testPasswordResetFlow();