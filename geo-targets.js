#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import csv from 'csv-parser';

// Google's official geo targets URL
const GOOGLE_GEO_TARGETS_URL = 'https://developers.google.com/google-ads/api/data/geotargets';

// Local cache file for geo targets
const GEO_TARGETS_CACHE = 'data/geo-targets-cache.json';

// Generate uule parameter from canonical name
const generateUule = (canonicalName) => {
  // Google's uule format: "w+CAIQICIN[Base64 encoded canonical name]"
  // The canonical name should be encoded in Base64
  try {
    // Convert to Base64
    const encoded = Buffer.from(canonicalName).toString('base64');
    return `w+CAIQICIN${encoded}`;
  } catch (error) {
    console.error('Error generating uule:', error.message);
    // Fallback: use URL encoding
    const encoded = encodeURIComponent(canonicalName);
    return `w+CAIQICIN${encoded}`;
  }
};

// Get geo targets from Google (or use cached version)
const getGeoTargets = async () => {
  try {
    // Check if we have cached data
    if (fs.existsSync(GEO_TARGETS_CACHE)) {
      console.log('📁 Using cached geo targets data');
      const cached = JSON.parse(fs.readFileSync(GEO_TARGETS_CACHE, 'utf8'));
      return cached;
    }

    console.log('🌐 Fetching fresh geo targets data...');
    
    // For now, we'll create a basic mapping
    // In production, you could fetch from Google's official CSV
    const geoTargets = {
      'US': {
        'New York': 'New York,New York,United States',
        'Los Angeles': 'Los Angeles,California,United States',
        'Chicago': 'Chicago,Illinois,United States',
        'Houston': 'Houston,Texas,United States',
        'Phoenix': 'Phoenix,Arizona,United States'
      },
      'GB': {
        'London': 'London,England,United Kingdom',
        'Manchester': 'Manchester,England,United Kingdom',
        'Birmingham': 'Birmingham,England,United Kingdom'
      },
      'FR': {
        'Paris': 'Paris,France',
        'Marseille': 'Marseille,France',
        'Lyon': 'Lyon,France'
      },
      'CA': {
        'Toronto': 'Toronto,Ontario,Canada',
        'Montreal': 'Montreal,Quebec,Canada',
        'Vancouver': 'Vancouver,British Columbia,Canada'
      },
      'DE': {
        'Berlin': 'Berlin,Germany',
        'Munich': 'Munich,Bavaria,Germany',
        'Hamburg': 'Hamburg,Germany'
      },
      'JP': {
        'Tokyo': 'Tokyo,Japan',
        'Osaka': 'Osaka,Japan',
        'Kyoto': 'Kyoto,Japan'
      },
      'AU': {
        'Sydney': 'Sydney,New South Wales,Australia',
        'Melbourne': 'Melbourne,Victoria,Australia',
        'Brisbane': 'Brisbane,Queensland,Australia'
      },
      'MX': {
        'Mexico City': 'Mexico City,Mexico',
        'Guadalajara': 'Guadalajara,Jalisco,Mexico',
        'Monterrey': 'Monterrey,Nuevo Leon,Mexico'
      }
    };

    // Cache the data
    const outputDir = path.dirname(GEO_TARGETS_CACHE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(GEO_TARGETS_CACHE, JSON.stringify(geoTargets, null, 2));
    console.log('💾 Geo targets data cached');

    return geoTargets;
    
  } catch (error) {
    console.error('Error fetching geo targets:', error);
    return null;
  }
};

// Get canonical name for a city/country combination
const getCanonicalName = async (city, country) => {
  const geoTargets = await getGeoTargets();
  
  if (geoTargets && geoTargets[country] && geoTargets[country][city]) {
    return geoTargets[country][city];
  }
  
  // Fallback: generate basic canonical name
  return `${city},${country}`;
};

// Generate uule parameter for a location
const generateUuleForLocation = async (city, country) => {
  const canonicalName = await getCanonicalName(city, country);
  return generateUule(canonicalName);
};

// Test the geo targets functionality
const testGeoTargets = async () => {
  console.log('🧪 Testing geo targets functionality...\n');
  
  const testLocations = [
    { city: 'New York', country: 'US' },
    { city: 'London', country: 'GB' },
    { city: 'Tokyo', country: 'JP' }
  ];
  
  for (const location of testLocations) {
    const canonicalName = await getCanonicalName(location.city, location.country);
    const uule = generateUule(canonicalName);
    
    console.log(`${location.city}, ${location.country}:`);
    console.log(`  Canonical: ${canonicalName}`);
    console.log(`  UULE: ${uule}`);
    console.log('');
  }
};

// Export functions for use in other modules
export {
  getGeoTargets,
  getCanonicalName,
  generateUuleForLocation,
  generateUule
};

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGeoTargets();
} 