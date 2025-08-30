#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Parse HTML response and extract ranking data
const parseSerpResults = (htmlContent) => {
  const results = [];
  
  try {
    // Extract organic search results using regex patterns
    // This is a simplified parser - in production you might use a proper HTML parser
    
    // Pattern for Google search result divs
    const resultPattern = /<div[^>]*class="[^"]*g[^"]*"[^>]*>(.*?)<\/div>/gs;
    
    // Pattern for title and link
    const titlePattern = /<h3[^>]*>(.*?)<\/h3>/i;
    const linkPattern = /href="([^"]+)"/i;
    
    // Pattern for snippet
    const snippetPattern = /<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)<\/div>/i;
    
    // Pattern for domain
    const domainPattern = /<cite[^>]*>(.*?)<\/cite>/i;
    
    let match;
    let position = 1;
    
    while ((match = resultPattern.exec(htmlContent)) && position <= 20) {
      const resultDiv = match[1];
      
      // Extract title
      const titleMatch = resultDiv.match(titlePattern);
      const title = titleMatch ? cleanHtml(titleMatch[1]) : '';
      
      // Extract link
      const linkMatch = resultDiv.match(linkPattern);
      const link = linkMatch ? linkMatch[1] : '';
      
      // Extract snippet
      const snippetMatch = resultDiv.match(snippetPattern);
      const snippet = snippetMatch ? cleanHtml(snippetMatch[1]) : '';
      
      // Extract domain
      const domainMatch = resultDiv.match(domainPattern);
      const domain = domainMatch ? cleanHtml(domainMatch[1]) : '';
      
      // Only add if we have at least a title and link
      if (title && link) {
        results.push({
          position,
          title,
          url: link,
          domain: domain || extractDomainFromUrl(link),
          snippet: snippet || 'No snippet available'
        });
        position++;
      }
    }
    
  } catch (error) {
    console.error('Error parsing HTML:', error.message);
  }
  
  return results;
};

// Clean HTML tags and entities
const cleanHtml = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

// Extract domain from URL
const extractDomainFromUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return '';
  }
};

// Main parsing function
const parseAndSaveResults = () => {
  try {
    console.log('🔍 Parsing SERP results...\n');
    
    // Read the test response
    const responsePath = 'output/final-test-response.json';
    if (!fs.existsSync(responsePath)) {
      console.error('❌ Response file not found. Run test-final.js first.');
      return;
    }
    
    const responseData = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
    const htmlContent = responseData.body;
    
    if (!htmlContent) {
      console.error('❌ No HTML content found in response.');
      return;
    }
    
    console.log(`📄 Parsing HTML content (${(htmlContent.length / 1024).toFixed(2)} KB)...`);
    
    // Parse the results
    const parsedResults = parseSerpResults(htmlContent);
    
    console.log(`✅ Found ${parsedResults.length} search results\n`);
    
    // Create clean output
    const cleanOutput = {
      query: 'pizza near me',
      location: 'New York, US',
      timestamp: new Date().toISOString(),
      total_results: parsedResults.length,
      results: parsedResults
    };
    
    // Save parsed results
    const outputDir = 'output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const parsedPath = path.join(outputDir, 'parsed-results.json');
    fs.writeFileSync(parsedPath, JSON.stringify(cleanOutput, null, 2));
    
    console.log('📁 Parsed results saved to:', parsedPath);
    console.log('\n📊 Sample Results:');
    
    // Show first 5 results
    parsedResults.slice(0, 5).forEach(result => {
      console.log(`\n${result.position}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Domain: ${result.domain}`);
      console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
    });
    
    if (parsedResults.length > 5) {
      console.log(`\n... and ${parsedResults.length - 5} more results`);
    }
    
    // Also save as CSV for easy review
    const csvPath = path.join(outputDir, 'parsed-results.csv');
    const csvContent = [
      'Position,Title,URL,Domain,Snippet',
      ...parsedResults.map(r => 
        `"${r.position}","${r.title.replace(/"/g, '""')}","${r.url}","${r.domain}","${r.snippet.replace(/"/g, '""')}"`
      )
    ].join('\n');
    
    fs.writeFileSync(csvPath, csvContent);
    console.log('\n📁 CSV results saved to:', csvPath);
    
  } catch (error) {
    console.error('❌ Error parsing results:', error.message);
  }
};

// Run the parser
parseAndSaveResults(); 