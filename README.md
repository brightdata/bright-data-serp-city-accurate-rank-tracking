# 🚀 Bright Data SERP Rank Tracker - Node.js Project

[![Bright Data Promo](https://github.com/luminati-io/LinkedIn-Scraper/raw/main/Proxies%20and%20scrapers%20GitHub%20bonus%20banner.png)](https://brightdata.com/)

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Daily%20Tracking-blue?style=for-the-badge&logo=github)](https://github.com/your-username/bright-data-serp-rank-tracker-nodejs-project/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A powerful Node.js tool for tracking search engine rankings across multiple keywords, cities, and devices using the Bright Data SERP API. Perfect for SEO professionals, marketers, and businesses needing comprehensive rank tracking data.

## ✨ Features

- **🔍 Multi-Query Support**: Process hundreds of keywords simultaneously
- **🌍 Geo-Targeting**: Accurate city-based results using Google's `uule` parameter
- **📱 Device Targeting**: Support for both desktop and mobile search results
- **⚡ Concurrent Processing**: Configurable concurrency for optimal performance
- **📊 Dual Output**: JSON and CSV exports with timestamps
- **🔄 Smart Deduplication**: Remove duplicate results by domain
- **📈 Real-time Progress**: Live tracking of processing status
- **🌐 International Coverage**: Support for multiple countries and languages
- **💾 Cached Geo Data**: Efficient geo-targeting with local caching

## 🏗️ Architecture

The script uses a sophisticated architecture that:
- Parses Bright Data API responses (which return data in a `body` field)
- Extracts organic search results with proper field mapping
- Implements controlled concurrency to avoid API rate limits
- Provides comprehensive error handling and logging
- Generates clean, structured output for analysis

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Bright Data SERP API account
- Valid API key and zone

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd bright-data-serp-city-accurate-rank-tracking
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your credentials:
```env
BRIGHT_DATA_API_KEY=your_api_key_here
BRIGHT_DATA_ZONE=serp_api1
```

### 3. Run the Script

```bash
# Basic run with default settings
npm run dev

# With custom concurrency
npm run dev -- --concurrency 10

# Test with smaller dataset
npm run dev -- --queries data/test-queries.csv --locations data/test-locations.csv
```

## 🤖 Automated Daily Tracking

The repository includes GitHub Actions for automated daily rank tracking:

- **⏰ Schedule**: Runs every day at 6:00 AM Europe time
- **🎯 Manual Trigger**: Can be run manually anytime
- **📊 Results**: Automatically uploaded as artifacts
- **🔐 Secure**: Uses GitHub Secrets for API credentials

**Setup**: See [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) for detailed configuration.

## 📁 Input Files

### Queries CSV (`data/queries.csv`)
```csv
keyword,brand
"best pizza near me",
"coffee shops",
"dentist office",
"plumber services",
"restaurant delivery"
```

### Locations CSV (`data/locations.csv`)
```csv
city,country,language,device
"New York","US","en","desktop"
"Los Angeles","US","en","desktop"
"London","GB","en","desktop"
"Paris","FR","fr","mobile"
"Tokyo","JP","ja","desktop"
```

## 🎯 Usage Examples

### Basic Usage
```bash
npm run dev
```
Processes all queries and locations with default concurrency (5).

### Custom Concurrency
```bash
npm run dev -- --concurrency 10
```
Processes 10 requests simultaneously for faster execution.

### Test Run
```bash
npm run dev -- --queries data/test-queries.csv --locations data/test-locations.csv --concurrency 3
```
Perfect for testing with a smaller dataset (2 queries × 2 cities = 4 tasks).

### Include Maps Results
```bash
npm run dev -- --surface maps --maps
```
Collects both organic and local/maps results.

### Demo Mode
```bash
npm run demo
```
Shows the interface and capabilities without making API calls (perfect for presentations).

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run the main SERP rank tracking script |
| `npm run start` | Alias for `npm run dev` |
| `npm run demo` | Run demo mode (no API calls) |

## 📊 Output Format

### JSON Structure
```json
{
  "keyword": "coffee shops",
  "engine": "google",
  "surface": "search",
  "city": "New York",
  "country": "US",
  "device": "desktop",
  "position": 1,
  "title": "Coffeehouse",
  "url": "https://en.wikipedia.org/wiki/Coffeehouse",
  "domain": "en.wikipedia.org",
  "snippet": "A coffeehouse, coffee shop, or café..."
}
```

### CSV Columns
- `keyword` - Search query
- `engine` - Search engine (google/bing)
- `surface` - Search surface (search/maps)
- `city` - Target city
- `country` - Target country
- `device` - Device type (desktop/mobile)
- `position` - Ranking position
- `title` - Result title
- `url` - Result URL
- `domain` - Extracted domain
- `snippet` - Result description

## ⚙️ Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--engine` | Search engine (google/bing) | `google` |
| `--surface` | Search surface (search/maps) | `search` |
| `--queries` | Path to queries CSV | `data/queries.csv` |
| `--locations` | Path to locations CSV | `data/locations.csv` |
| `--maps` | Include maps surface | `false` |
| `--concurrency` | Number of concurrent requests | `5` |

## 🌍 Supported Locations

The script supports international locations with proper geo-targeting:

- **North America**: US, Canada
- **Europe**: UK, France, Germany
- **Asia**: Japan
- **Oceania**: Australia
- **Latin America**: Mexico

Each location uses Google's `uule` parameter for precise geo-targeting.

## 📈 Performance

### Test Results
- **Small Dataset** (2×2): 25 results in ~30 seconds
- **Full Scale** (10×10): 314 results in ~2 minutes
- **Concurrency**: Configurable from 1-20+ requests

### Optimization Tips
- Use concurrency of 5-10 for optimal performance
- Test with smaller datasets first
- Monitor API rate limits
- Cache geo-targeting data locally

## 🔧 Troubleshooting

### Common Issues

**API Timeout Errors**
```bash
# Reduce concurrency
npm run dev -- --concurrency 3
```

**No Results Found**
- Check API key and zone configuration
- Verify query format and location data
- Ensure Bright Data account has sufficient credits

**Geo-Targeting Issues**
- Verify city/country combinations
- Check geo-targets cache
- Review uule parameter generation

### Debug Mode
The script includes comprehensive logging:
- API response structure analysis
- Geo-targeting parameter generation
- Progress tracking for each task
- Error details for failed requests

## 🏗️ Project Structure

```
├── index.js              # Main application script
├── geo-targets.js        # Geo-targeting utilities
├── data/                 # Input CSV files
│   ├── queries.csv      # Keywords to track
│   └── locations.csv    # Target cities/locations
├── output/              # Generated results
├── package.json         # Dependencies and scripts
├── .env                 # Environment configuration
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues related to:
- **Script functionality**: Check this README and troubleshoot section
- **Bright Data API**: Contact Bright Data support
- **Geo-targeting**: Review geo-targets.js and location data

## 🎯 Demo Ready

This repository is optimized for demos with:
- ✅ Clean, organized code structure
- ✅ Comprehensive documentation
- ✅ Working examples and sample data
- ✅ Performance benchmarks
- ✅ Troubleshooting guide
- ✅ Professional README

Perfect for showcasing SERP rank tracking capabilities to clients, stakeholders, or technical teams! 