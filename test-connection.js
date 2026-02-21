#!/usr/bin/env node

/**
 * Connection Test Script
 * Tests the connection between frontend and backend
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

async function testConnection() {
    console.log('🧪 Testing Backend-Frontend Connection...\n');

    // Test 1: Backend Health Check
    try {
        console.log('1️⃣  Testing Backend Health...');
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ Backend is healthy:', healthResponse.data);
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
        return;
    }

    // Test 2: Backend API Routes
    try {
        console.log('\n2️⃣  Testing Backend API Routes...');
        
        // Test registration
        const testUser = {
            email: `testuser${Date.now()}@example.com`,
            password: 'TestPassword123!',
            fullName: 'Test User',
            role: 'STUDENT'
        };

        const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testUser);
        console.log('✅ Registration works:', registerResponse.data.message);

        // Test login
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login works:', loginResponse.data.message);

    } catch (error) {
        console.log('❌ API test failed:', error.response?.data?.message || error.message);
    }

    // Test 3: CORS Check
    try {
        console.log('\n3️⃣  Testing CORS Configuration...');
        const corsResponse = await axios.options(`${API_BASE}/api/auth/register`);
        console.log('✅ CORS is configured correctly');
    } catch (error) {
        console.log('⚠️  CORS might have issues:', error.message);
    }

    console.log('\n🎯 Connection test completed!');
}

// Run the test
testConnection().catch(console.error);