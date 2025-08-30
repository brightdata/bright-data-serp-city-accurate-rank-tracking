#!/usr/bin/env node

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getCanonicalName, generateUule } from './geo-targets.js';

dotenv.config();

// Configuration
const CONFIG = {
  apiToken: process.env.BRIGHT_DATA_API_KEY || 'YOUR_API_KEY',
  zone: process.env.BRIGHT_DATA_ZONE || 'serp_api1',
  baseUrl: 'https://api.brightdata.com/request'
};

// Single test data
const TEST_DATA = {
  query: 'pizza near me',
  location: {
    city: 'New York',
    country: 'US',
    language: 'en',
    device: 'desktop'
  }
};

// Test the updated geo location system
const testUpdatedGeoSystem = async () => {
  try {
    console.log('🧪 Testing updated geo location system...\n');
    
    console.log('Test Query:', TEST_DATA.query);
    console.log('Test Location:', TEST_DATA.location);
    console.log('API Token:', CONFIG.apiToken ? '✅ Set' : '❌ Missing');
    console.log('---\n');
    
    // Build the search URL with new geo parameters
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(TEST_DATA.query)}`;
    
    // Add geo location parameter using the new system
    if (TEST_DATA.location.city && TEST_DATA.location.country) {
      try {
        // Get canonical name from geo targets system
        const canonicalName = await getCanonicalName(TEST_DATA.location.city, TEST_DATA.location.country);
        
        // Generate uule parameter
        const uule = generateUule(canonicalName);
        searchUrl += `&uule=${uule}`;
        
        console.log(`📍 Geo targeting: ${canonicalName} -> ${uule}`);
      } catch (error) {
        console.warn(`⚠️ Could not generate uule: ${error.message}`);
        // Fallback: use basic location parameters
        searchUrl += `&gl=${TEST_DATA.location.country}&hl=${TEST_DATA.location.language}`;
      }
    }
    
    // Add language parameter
    if (TEST_DATA.location.language) {
      searchUrl += `&hl=${TEST_DATA.location.language}`;
    }
    
    console.log('\nGenerated Search URL:', searchUrl);
    console.log('---\n');
    
    // Make API call
    console.log('Making API call...');
    
    const response = await axios.post(CONFIG.baseUrl, {
      zone: CONFIG.zone,
      url: searchUrl,
      format: 'json'
    }, {
      headers: {
        'Authorization': `Bearer ${CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ API call successful!');
    console.log('Response status:', response.status);
    console.log('Response keys:', Object.keys(response.data));
    
    if (response.data.body) {
      console.log('Response body length:', response.data.body.length);
      console.log('Response contains search results:', response.data.body.includes('search'));
      
      // Save response for inspection
      const outputDir = 'output';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const responsePath = path.join(outputDir, 'final-test-response.json');
      fs.writeFileSync(responsePath, JSON.stringify(response.data, null, 2));
      console.log(`\n📁 Full response saved to: ${responsePath}`);
      
      // Check if response contains expected content
      const body = response.data.body;
      const hasPizzaResults = body.includes('pizza') || body.includes('Pizza');
      const hasLocationResults = body.includes('New York') || body.includes('NY');
      
      console.log('\n📊 Response Analysis:');
      console.log('- Contains pizza results:', hasPizzaResults ? '✅' : '❌');
      console.log('- Contains location results:', hasLocationResults ? '✅' : '❌');
      console.log('- Response size:', (body.length / 1024).toFixed(2), 'KB');
      
      if (hasPizzaResults && hasLocationResults) {
        console.log('\n🎉 Updated geo location system working correctly!');
        return true;
      } else {
        console.log('\n⚠️ Geo location targeting may not be working as expected.');
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Run the test
console.log('🚀 Testing updated geo location system...\n');

testUpdatedGeoSystem()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Final test successful! Ready to run full version.');
      console.log('\nNext steps:');
      console.log('1. Review the saved response in output/final-test-response.json');
      console.log('2. If everything looks good, run: npm run dev');
    } else {
      console.log('\n❌ Final test failed. Check the response and fix issues.');
    }
  })
  .catch((error) => {
    console.error('❌ Test error:', error);
  }); 