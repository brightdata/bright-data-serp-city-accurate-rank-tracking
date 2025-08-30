#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import axios from 'axios';
import dotenv from 'dotenv';
import { getCanonicalName, generateUule } from './geo-targets.js';

dotenv.config();

const program = new Command();

// Configuration
const CONFIG = {
  apiToken: process.env.BRIGHT_DATA_API_KEY || 'YOUR_API_KEY',
  zone: process.env.BRIGHT_DATA_ZONE || 'serp_api1',
  baseUrl: 'https://api.brightdata.com/request',
  format: "raw"
};

// Extract domain from URL
const extractDomainFromUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.startsWith('www.') ? domain.substring(4) : domain;
  } catch (error) {
    return url;
  }
};

// Extract organic results from SERP response
const extractOrganicResults = (serpResponse, query, location, device, surface) => {
  const results = [];
  
  try {
    // Handle JSON results from Bright Data
    if (serpResponse.organic && Array.isArray(serpResponse.organic)) {
      console.log(`📊 Found ${serpResponse.organic.length} organic results in JSON response`);
      
      serpResponse.organic.forEach((result, index) => {
        const position = index + 1;
        const title = result.title || result.link_title || '';
        const url = result.link || result.url || '';
        const snippet = result.snippet || '';
        const domain = extractDomainFromUrl(url);
        
        if (title && url) {
          results.push({
            keyword: query,
            engine: 'google',
            surface: surface,
            city: location.city,
            country: location.country,
            device: device,
            position: position,
            title: title,
            url: url,
            domain: domain,
            snippet: snippet
          });
        }
      });
      
      return results;
    }
    
    console.warn('⚠️ No organic results found in response');
    return results;
    
  } catch (error) {
    console.error('Error extracting organic results:', error.message);
    return results;
  }
};

// Extract local/maps results from SERP response
const extractLocalResults = (serpResponse, query, location, device, surface) => {
  const results = [];
  
  try {
    // Handle JSON results from Bright Data
    if (serpResponse.local_results && Array.isArray(serpResponse.local_results)) {
      console.log(`📊 Found ${serpResponse.local_results.length} local results in JSON response`);
      
      serpResponse.local_results.forEach((result, index) => {
        const position = index + 1;
        const title = result.title || result.link_title || '';
        const url = result.link || result.url || '';
        const snippet = result.snippet || '';
        const domain = extractDomainFromUrl(url);
        
        if (title && url) {
          results.push({
            keyword: query,
            engine: 'google',
            surface: surface,
            city: location.city,
            country: location.country,
            device: device,
            position: position,
            title: title,
            url: url,
            domain: domain,
            snippet: snippet
          });
        }
      });
      
      return results;
    }
    
    console.warn('⚠️ No local results found in response');
    return results;
    
  } catch (error) {
    console.error('Error extracting local results:', error.message);
    return results;
  }
};

// Call Bright Data SERP API
const callSerpApi = async (query, location, device, surface) => {
  try {
    // Build the search URL based on parameters
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1`;
  
    
    // Add geo location parameter using uule format
    // uule format: "w+CAIQICIN[Canonical Name]"
    if (location.city && location.country) {
      try {
        // Get canonical name from geo targets system
        const canonicalName = await getCanonicalName(location.city, location.country);
        
        // Generate uule parameter
        const uule = generateUule(canonicalName);
        searchUrl += `&uule=${uule}`;
        
        console.log(`📍 Geo targeting: ${canonicalName} -> ${uule}`);
      } catch (error) {
        console.warn(`⚠️ Could not generate uule for ${location.city}, ${location.country}: ${error.message}`);
        // Fallback: use basic location parameters
        searchUrl += `&gl=${location.country}&hl=${location.language}`;
      }
    }
    
    // Add language parameter
    if (location.language) {
      searchUrl += `&hl=${location.language}`;
    }
    
    // Add device parameter
    if (device === 'mobile') {
      searchUrl += '&mobile=1';
    }

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

    return response.data;
  } catch (error) {
    console.error(`Error calling SERP API for query "${query}" in ${location.city}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
};

// Read CSV file
const readCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// Write CSV file
const writeCsvFile = async (data, filePath) => {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'keyword', title: 'keyword' },
      { id: 'engine', title: 'engine' },
      { id: 'surface', title: 'surface' },
      { id: 'city', title: 'city' },
      { id: 'device', title: 'device' },
      { id: 'position', title: 'position' },
      { id: 'title', title: 'title' },
      { id: 'url', title: 'url' },
      { id: 'domain', title: 'domain' },
      { id: 'snippet', title: 'snippet' }
    ]
  });

  await csvWriter.writeRecords(data);
};

// Write JSON file
const writeJsonFile = (data, filePath) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Deduplicate results by domain
const deduplicateByDomain = (results) => {
  const seen = new Set();
  return results.filter(result => {
    if (!result.domain) return true;
    if (seen.has(result.domain)) return false;
    seen.add(result.domain);
    return true;
  });
};

// Main rank tracking function
const trackRanks = async (queriesPath, locationsPath, engine, surface, includeMaps = false) => {
  try {
    console.log('Reading input files...');
    const queries = await readCsvFile(queriesPath);
    const locations = await readCsvFile(locationsPath);
    
    console.log(`Loaded ${queries.length} queries and ${locations.length} locations`);
    
    const allResults = [];
    const surfaces = includeMaps ? [surface, 'maps'] : [surface];
    
    for (const query of queries) {
      for (const location of locations) {
        for (const currentSurface of surfaces) {
          console.log(`Processing: "${query.keyword}" in ${location.city} (${currentSurface})`);
          
          const serpResponse = await callSerpApi(
            query.keyword,
            location,
            location.device,
            currentSurface
          );
          
          if (serpResponse) {
            let results = [];
            
            if (currentSurface === 'maps') {
              results = extractLocalResults(serpResponse, query.keyword, location, location.device, currentSurface);
            } else {
              results = extractOrganicResults(serpResponse, query.keyword, location, location.device, currentSurface);
            }
            
            // Normalize and add results
            results.forEach(result => {
              allResults.push(result);
            });
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`Total results collected: ${allResults.length}`);
    
    // Deduplicate by domain
    const deduplicatedResults = deduplicateByDomain(allResults);
    console.log(`Results after deduplication: ${deduplicatedResults.length}`);
    
    // Create output directory
    const outputDir = 'output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write output files
    const jsonPath = path.join(outputDir, 'ranks.json');
    const csvPath = path.join(outputDir, 'ranks.csv');
    
    writeJsonFile(deduplicatedResults, jsonPath);
    await writeCsvFile(deduplicatedResults, csvPath);
    
    console.log(`Results written to:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  CSV: ${csvPath}`);
    
    return deduplicatedResults;
    
  } catch (error) {
    console.error('Error in rank tracking:', error);
    throw error;
  }
};

// CLI setup
program
  .name('serp-rank-tracker')
  .description('SERP rank tracking tool for keywords across cities and devices')
  .version('1.0.0')
  .option('-e, --engine <engine>', 'Search engine (google, bing)', 'google')
  .option('-s, --surface <surface>', 'Search surface (search, maps)', 'search')
  .option('-q, --queries <path>', 'Path to queries CSV file', 'data/queries.csv')
  .option('-l, --locations <path>', 'Path to locations CSV file', 'data/locations.csv')
  .option('--maps', 'Include maps surface results', false)
  .parse();

const options = program.opts();

// Validate inputs
if (!fs.existsSync(options.queries)) {
  console.error(`Queries file not found: ${options.queries}`);
  process.exit(1);
}

if (!fs.existsSync(options.locations)) {
  console.error(`Locations file not found: ${options.locations}`);
  process.exit(1);
}

if (!CONFIG.apiToken || CONFIG.apiToken === 'YOUR_API_KEY') {
  console.error('Please set BRIGHT_DATA_API_KEY environment variable or update CONFIG.apiToken');
  process.exit(1);
}

// Run rank tracking
console.log('Starting SERP rank tracking...');
console.log(`Engine: ${options.engine}`);
console.log(`Surface: ${options.surface}`);
console.log(`Include Maps: ${options.maps}`);
console.log(`Queries: ${options.queries}`);
console.log(`Locations: ${options.locations}`);
console.log('---');

trackRanks(options.queries, options.locations, options.engine, options.surface, options.maps)
  .then(() => {
    console.log('Rank tracking completed successfully!');
  })
  .catch((error) => {
    console.error('Rank tracking failed:', error);
    process.exit(1);
  }); 