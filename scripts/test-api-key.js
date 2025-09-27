#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.SAM_API_KEY;

async function testApiKey() {
  console.log('🔑 Testing SAM.gov API Key...');
  console.log('📧 Account Email: founder@ixcoach.com');
  console.log('🆔 Account ID: c3299178-73e5-4a87-bffe-b76cc6b4d350');
  console.log('🔐 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT FOUND');
  console.log('⏰ Test Time:', new Date().toISOString());
  console.log('');

  if (!API_KEY) {
    console.error('❌ No API key found in environment variables');
    return;
  }

  // Test endpoints in order of complexity
  const endpoints = [
    {
      name: 'Opportunities API (Simplest)',
      url: `https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&noticeType=solicitation&limit=1`
    },
    {
      name: 'Entity Management API',
      url: `https://api.sam.gov/entity-information/v3/entities?api_key=${API_KEY}&samRegistered=Yes&includeSections=entityRegistration&page=0&size=1`
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing: ${endpoint.name}`);
    try {
      const response = await axios.get(endpoint.url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SAMx-ContractDiscovery/1.0'
        }
      });

      console.log('✅ SUCCESS!');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📏 Response Size: ${JSON.stringify(response.data).length} bytes`);
      
      if (endpoint.name.includes('Opportunities')) {
        const opportunities = response.data.opportunitiesData || [];
        console.log(`🎯 Found ${opportunities.length} opportunities`);
        if (opportunities.length > 0) {
          console.log(`📋 Sample: ${opportunities[0].title || 'No title'}`);
        }
      }
      
      console.log('');
      return true; // API key is working
      
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status || error.code}`);
      
      if (error.response?.data) {
        console.log(`💬 Error: ${JSON.stringify(error.response.data)}`);
      }
      
      console.log('');
    }
  }

  console.log('🚨 API Key Status: NOT ACTIVE YET');
  console.log('');
  console.log('📋 Troubleshooting Steps:');
  console.log('1. ✉️  Check email and verify your account');
  console.log('2. 📄 Accept API terms at: https://open.gsa.gov/api/opportunities-api/');
  console.log('3. ⏳ Wait up to 24 hours for activation');
  console.log('4. 📞 Contact support if still failing after 24h');
  console.log('');
  
  return false;
}

// Run the test
testApiKey().then(success => {
  if (success) {
    console.log('🎉 API Key is active! You can now sync contracts.');
    process.exit(0);
  } else {
    console.log('⏳ API Key not ready yet. Try again later.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
});