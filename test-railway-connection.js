/**
 * Railway Backend Connection Test
 * Tests if the backend is properly deployed and responding
 */

const RAILWAY_URL = 'https://ai-doc-analyser-backend-production.up.railway.app';

async function testBackend() {
  console.log('🧪 Testing Railway Backend Connection...\n');
  console.log(`📡 Backend URL: ${RAILWAY_URL}\n`);

  // Test 1: Health Check
  console.log('1️⃣ Testing /health endpoint...');
  try {
    const response = await fetch(`${RAILWAY_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health Check: PASSED');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Health Check: FAILED (Status: ${response.status})`);
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('❌ Health Check: FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n');

  // Test 2: Formats Endpoint
  console.log('2️⃣ Testing /formats endpoint...');
  try {
    const response = await fetch(`${RAILWAY_URL}/formats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Formats Endpoint: PASSED');
      console.log(`   Supported formats: ${data.formats?.length || 0} types`);
    } else {
      console.log(`❌ Formats Endpoint: FAILED (Status: ${response.status})`);
    }
  } catch (error) {
    console.log('❌ Formats Endpoint: FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n');

  // Test 3: CORS Headers
  console.log('3️⃣ Testing CORS configuration...');
  try {
    const response = await fetch(`${RAILWAY_URL}/health`, {
      headers: {
        'Origin': 'https://sujithsa007-ai-doc-analyser-ai-doc.vercel.app'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log('✅ CORS: ENABLED');
      console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
    } else {
      console.log('⚠️ CORS: Headers not found');
    }
  } catch (error) {
    console.log('❌ CORS Test: FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n📊 Test Complete!\n');
}

// Run tests
testBackend().catch(console.error);
