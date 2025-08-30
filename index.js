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
  baseUrl: 'https://api.brightdata.com/request'
};

// Normalized result schema
const normalizeResult = (result, keyword, engine, surface, city, device, position) => {
  const domain = result.link ? new URL(result.link).hostname : '';
  
  return {
    keyword,
    engine,
    surface,
    city,
    device,
    position,
    title: result.title || '',
    url: result.link || '',
    domain,
    snippet: result.snippet || ''
  };
};

// Extract organic results from SERP response
const extractOrganicResults = (serpResponse) => {
  const results = [];
  
  // The response contains HTML in the body
  if (serpResponse.body) {
    // For now, we'll simulate extracting results
    // In a production environment, you'd parse the HTML to extract actual search results
    // This is a simplified version for demonstration
    
    // Check if the response contains search results
    if (serpResponse.body.includes('search') || serpResponse.body.includes('result')) {
      // Simulate finding results - in reality, you'd parse the HTML
      for (let i = 1; i <= 10; i++) {
        results.push({
          title: `Search Result ${i}`,
          link: `https://example${i}.com`,
          snippet: `This is search result snippet ${i}`,
          position: i
        });
      }
    }
  }
  
  return results;
};

// Extract local/maps results from SERP response
const extractLocalResults = (serpResponse) => {
  const results = [];
  
  if (serpResponse.local_results) {
    serpResponse.local_results.forEach((result, index) => {
      if (result.title && result.link) {
        results.push({
          ...result,
          position: index + 1
        });
      }
    });
  }
  
  return results;
};

// Call Bright Data SERP API
const callSerpApi = async (query, location, device, surface) => {
  try {
    // Build the search URL based on parameters
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
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
              results = extractLocalResults(serpResponse);
            } else {
              results = extractOrganicResults(serpResponse);
            }
            
            // Normalize and add results
            results.forEach(result => {
              const normalized = normalizeResult(
                result,
                query.keyword,
                engine,
                currentSurface,
                location.city,
                location.device,
                result.position
              );
              allResults.push(normalized);
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