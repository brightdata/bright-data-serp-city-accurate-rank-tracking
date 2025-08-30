# SERP Rank Tracker

A Node.js tool for tracking search engine rankings across multiple keywords, cities, and devices using the Bright Data SERP API.

## Features

- **Multi-engine support**: Google and Bing search engines
- **Multi-surface support**: Organic search and Maps results
- **Geographic targeting**: Track rankings across different cities and countries
- **Device targeting**: Desktop and mobile results
- **Normalized output**: Consistent JSON and CSV formats
- **Deduplication**: Remove duplicate domains from results
- **Rate limiting**: Built-in delays to avoid API limits

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd serp-rank-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Configure your Bright Data API credentials:
```bash
cp env.example .env
```

Edit `.env` and add your Bright Data API key:
```
BRIGHT_DATA_API_KEY=your_actual_api_key_here
BRIGHT_DATA_ZONE=serp_api1
```

## Input Files

### queries.csv
Contains keywords to track with optional brand column:
```csv
keyword,brand
"best pizza near me",
"coffee shops",
"dentist office",
"plumber services",
"restaurant delivery",
"hair salon",
"gym fitness center",
"car repair shop",
"pharmacy drugstore",
"bakery pastry shop"
```

### locations.csv
Contains target locations with device specifications:
```csv
city,country,language,device
"New York","US","en","desktop"
"Los Angeles","US","en","desktop"
"Chicago","US","en","mobile"
"London","GB","en","desktop"
"Paris","FR","fr","mobile"
"Toronto","CA","en","desktop"
"Berlin","DE","de","mobile"
"Tokyo","JP","ja","desktop"
"Sydney","AU","en","mobile"
"Mexico City","MX","es","desktop"
```

## Usage

### Basic Usage
```bash
npm run dev -- --engine google --surface search --queries data/queries.csv --locations data/locations.csv
```

### Include Maps Results
```bash
npm run dev -- --engine google --surface search --queries data/queries.csv --locations data/locations.csv --maps
```

### Custom File Paths
```bash
npm run dev -- --queries /path/to/custom/queries.csv --locations /path/to/custom/locations.csv
```

### Different Search Engine
```bash
npm run dev -- --engine bing --surface search --queries data/queries.csv --locations data/locations.csv
```

## Command Line Options

- `-e, --engine <engine>`: Search engine (google, bing) [default: google]
- `-s, --surface <surface>`: Search surface (search, maps) [default: search]
- `-q, --queries <path>`: Path to queries CSV file [default: data/queries.csv]
- `-l, --locations <path>`: Path to locations CSV file [default: data/locations.csv]
- `--maps`: Include maps surface results [default: false]

## Output

The tool generates two output files in the `output/` directory:

### ranks.json
Normalized JSON format with all ranking data:
```json
[
  {
    "keyword": "best pizza near me",
    "engine": "google",
    "surface": "search",
    "city": "New York",
    "device": "desktop",
    "position": 1,
    "title": "Best Pizza Places Near Me - Yelp",
    "url": "https://www.yelp.com/search?find_desc=pizza",
    "domain": "www.yelp.com",
    "snippet": "Find the best Pizza places near you on Yelp..."
  }
]
```

### ranks.csv
Same data in CSV format with columns:
- keyword
- engine
- surface
- city
- device
- position
- title
- url
- domain
- snippet

## Output Schema

Each result contains:
- **keyword**: The search query
- **engine**: Search engine used (google, bing)
- **surface**: Search surface (search, maps)
- **city**: Target city
- **device**: Device type (desktop, mobile)
- **position**: Ranking position (1-based)
- **title**: Result title
- **url**: Result URL
- **domain**: Extracted domain from URL
- **snippet**: Result snippet/description

## Rate Limiting

The tool includes a 1-second delay between API calls to respect rate limits. For production use, consider adjusting this based on your Bright Data plan limits.

## Error Handling

- Invalid API tokens are caught and reported
- Missing input files trigger helpful error messages
- API failures are logged but don't stop the entire process
- Network timeouts are set to 30 seconds

## Dependencies

- **axios**: HTTP client for API calls
- **commander**: CLI argument parsing
- **csv-parser**: CSV file reading
- **csv-writer**: CSV file writing
- **dotenv**: Environment variable management

## Bright Data SERP API

This tool uses the [Bright Data SERP API](https://github.com/luminati-io/bright-data-serp-api-nodejs-project) to access search engine results without being blocked. The API provides:

- Real search engine results
- Geographic targeting using Google's `uule` parameter
- Device-specific results
- Multiple search surfaces (organic, maps)
- High success rates

### Geo Location Targeting

The tool uses Google's `uule` parameter for precise geographic targeting, which provides more accurate location-based search results than traditional `gl` and `hl` parameters. The `uule` parameter follows the format:

```
&uule=w+CAIQICIN[Canonical Name]
```

Where the canonical name follows the format: `City,State,Country` (e.g., "New York,New York,United States").

#### Supported Locations

The tool automatically generates proper canonical names for the following locations:

**United States:**
- New York, New York, United States
- Los Angeles, California, United States  
- Chicago, Illinois, United States

**International:**
- London, England, United Kingdom
- Paris, France
- Toronto, Ontario, Canada
- Berlin, Germany
- Tokyo, Japan
- Sydney, Australia
- Mexico City, Mexico

This approach is based on the [Google Ads API geo targets documentation](https://developers.google.com/google-ads/api/data/geotargets) and provides more reliable geographic targeting for search results.

## Troubleshooting

### API Key Issues
- Verify your Bright Data API key is correct
- Check that your zone name is valid
- Ensure your account has sufficient credits

### File Path Issues
- Use absolute paths if relative paths don't work
- Ensure CSV files are properly formatted
- Check file permissions

### Rate Limiting
- Increase delays between requests if you hit rate limits
- Consider running smaller batches for large datasets

## License

MIT License - see LICENSE file for details. 