# US Drought Monitor MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Status](https://img.shields.io/badge/status-planning-yellow)](docs/implementation_plan.md)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple)](https://github.com/anthropics/model-context-protocol)

A Model Context Protocol (MCP) server that provides access to US Drought Monitor data for wildfire risk assessment, agricultural planning, and water resource management.

> **Current Status:** This project is in the planning and documentation phase. The implementation (`src/` directory) has not been created yet. See [Implementation Plan](docs/implementation_plan.md) for the development roadmap and [STATUS.md](STATUS.md) for current progress.

## Overview

This MCP server integrates with the US Drought Monitor data services to provide current and historical drought severity information. The server formats data to align with the wildfire information schema used by the [fire-behavior](https://github.com/EliSchillinger/fire-behavior) application, as drought conditions are a critical factor in wildfire risk assessment.

### What is the US Drought Monitor?

The US Drought Monitor (USDM) is a weekly map of drought conditions across the United States, produced jointly by:
- National Drought Mitigation Center (NDMC)
- USDA
- National Oceanic and Atmospheric Administration (NOAA)

**Drought Categories:**
- **D0**: Abnormally Dry (going into drought, coming out of drought)
- **D1**: Moderate Drought
- **D2**: Severe Drought
- **D3**: Extreme Drought
- **D4**: Exceptional Drought

**Key Indicators:**
- Precipitation levels
- Soil moisture
- Stream flows
- Groundwater levels
- Snowpack (where applicable)
- Vegetation health

## Features

- Fetch current drought conditions by location (lat/lon, county, state)
- Retrieve historical drought data and trends
- Calculate drought severity scores
- Integrate drought data with wildfire risk assessments
- Format data to match wildfire_prompt_template.json schema
- Support for GeoJSON, JSON, and CSV formats
- Weekly updates (USDM releases new data every Thursday)

## How It Works

The Drought MCP server acts as a bridge between Claude (or other MCP clients) and US Drought Monitor data services:

1. **Location Query**: You ask Claude about drought conditions at a specific location
2. **Area Identification**: The server identifies the relevant county/state or geographic area
3. **Data Retrieval**: Current drought severity data is fetched from USDM APIs
4. **Historical Analysis**: Optional trend analysis showing drought progression/recession
5. **Risk Integration**: Drought severity is translated into wildfire risk factors
6. **Response**: Formatted data is returned to Claude for analysis and presentation

## Installation

> **Prerequisites:** Node.js 18.0.0 or higher

```bash
# Clone the repository
git clone https://github.com/tyson-swetnam/drought-mcp.git
cd drought-mcp

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if needed (most USDM APIs are public)
```

## Configuration

### MCP Server Configuration

Add to your Claude Desktop configuration:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drought-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/drought-mcp/src/index.js"
      ],
      "cwd": "/absolute/path/to/drought-mcp",
      "env": {
        "LOG_LEVEL": "info",
        "CACHE_TTL_SECONDS": "86400",
        "USDM_DATA_FORMAT": "json",
        "ENABLE_HISTORICAL_ANALYSIS": "true"
      },
      "autoApprove": [
        "get_drought_current",
        "get_drought_by_area",
        "get_drought_historical",
        "get_drought_statistics"
      ],
      "timeout": 60
    }
  }
}
```

**Important Notes:**
- Replace `/absolute/path/to/drought-mcp` with the actual absolute path to your drought-mcp directory
- Use the absolute path to `src/index.js`, not a relative path
- The `autoApprove` list enables automatic execution of drought tools without manual confirmation
- After editing the config file, restart Claude Desktop for changes to take effect

### Optional Configuration

Create a `.env` file for advanced configuration:

```env
# Optional: Caching configuration
CACHE_TTL_SECONDS=86400  # 24 hours (USDM updates weekly)
LOG_LEVEL=info

# Optional: Data source preferences
USDM_DATA_FORMAT=json  # json, geojson, or csv
ENABLE_HISTORICAL_ANALYSIS=true
```

## Usage

### Starting the Server

```bash
# Start the MCP server
npm start

# Or start with auto-reload for development
npm run dev
```

### Example Queries

Once configured with Claude Desktop, you can ask:

- "What are the current drought conditions in Boulder County, Colorado?"
- "Show me drought severity for California"
- "Has the drought situation in Texas improved over the last 6 months?"
- "What's the drought level at coordinates 40.0°N, 105.2°W?"
- "How does drought severity affect wildfire risk in my area?"

## Available Tools

### 1. get_drought_current

Get current drought conditions for a location.

**Parameters:**
- `location` (string, optional): Location name (e.g., "Boulder County, CO")
- `latitude` (number, optional): Latitude (-90 to 90)
- `longitude` (number, optional): Longitude (-180 to 180)
- `state` (string, optional): State abbreviation (e.g., "CO")
- `county` (string, optional): County name
- `format` (string, optional): Output format - "json" | "wildfire_schema" (default: "wildfire_schema")

**Note:** Provide either `location`, OR `latitude/longitude`, OR `state/county`.

**Example Request:**
```json
{
  "latitude": 40.0150,
  "longitude": -105.2705,
  "format": "wildfire_schema"
}
```

**Example Response:**
```json
{
  "location": "Boulder County, Colorado",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": {
    "severity": "D2",
    "severity_name": "Severe Drought",
    "severity_level": 2,
    "area_percent": 85,
    "description": "Crop losses likely. Water shortages common. Water restrictions imposed."
  },
  "risk_assessment": {
    "overall_risk": "High",
    "notes": "Severe drought conditions significantly increase wildfire risk. Low fuel moisture and stressed vegetation create highly flammable conditions."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ],
  "notes": "Data updated weekly on Thursdays. Current data reflects week ending 2025-08-29."
}
```

### 2. get_drought_by_area

Get drought statistics for a state or region.

**Parameters:**
- `state` (string, required): State abbreviation (e.g., "CO", "CA")
- `include_counties` (boolean, optional): Include county-level breakdown (default: false)
- `date` (string, optional): Specific date (ISO 8601), defaults to latest

**Example Request:**
```json
{
  "state": "CO",
  "include_counties": true
}
```

**Example Response:**
```json
{
  "state": "Colorado",
  "state_code": "CO",
  "as_of": "2025-08-29T00:00:00Z",
  "summary": {
    "area_sq_miles": 104094,
    "drought_categories": {
      "D0": { "percent": 35.2, "area_sq_miles": 36640 },
      "D1": { "percent": 28.1, "area_sq_miles": 29250 },
      "D2": { "percent": 18.5, "area_sq_miles": 19257 },
      "D3": { "percent": 12.2, "area_sq_miles": 12699 },
      "D4": { "percent": 0, "area_sq_miles": 0 }
    },
    "drought_free_percent": 6.0
  },
  "counties": [
    {
      "name": "Boulder",
      "fips": "08013",
      "severity": "D2",
      "percent_in_drought": 85
    }
  ]
}
```

### 3. get_drought_historical

Retrieve historical drought data and trends.

**Parameters:**
- `location` (string, optional): Location name
- `latitude` (number, optional): Latitude
- `longitude` (number, optional): Longitude
- `state` (string, optional): State abbreviation
- `start_date` (string, required): Start date (ISO 8601)
- `end_date` (string, required): End date (ISO 8601)
- `aggregation` (string, optional): "weekly" | "monthly" (default: "weekly")

**Example Request:**
```json
{
  "latitude": 40.0150,
  "longitude": -105.2705,
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-08-29T00:00:00Z",
  "aggregation": "monthly"
}
```

**Example Response:**
```json
{
  "location": "Boulder County, Colorado",
  "time_period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-08-29T00:00:00Z"
  },
  "trend": {
    "direction": "worsening",
    "severity_change": "+2 categories",
    "description": "Drought conditions have intensified from D0 to D2 over the period"
  },
  "timeline": [
    {
      "date": "2025-01-01T00:00:00Z",
      "severity": "D0",
      "severity_level": 0
    },
    {
      "date": "2025-02-01T00:00:00Z",
      "severity": "D0",
      "severity_level": 0
    },
    {
      "date": "2025-03-01T00:00:00Z",
      "severity": "D1",
      "severity_level": 1
    }
  ]
}
```

### 4. get_drought_statistics

Get statistical summaries and comparisons.

**Parameters:**
- `state` (string, optional): State abbreviation
- `region` (string, optional): Region name (e.g., "Southwest", "Great Plains")
- `compare_to` (string, optional): Comparison period - "last_year" | "10_year_avg" | "historical_avg"

**Example Request:**
```json
{
  "state": "CA",
  "compare_to": "last_year"
}
```

**Example Response:**
```json
{
  "state": "California",
  "current": {
    "date": "2025-08-29T00:00:00Z",
    "in_drought_percent": 72.3,
    "severe_or_worse_percent": 45.1
  },
  "comparison": {
    "date": "2024-08-29T00:00:00Z",
    "in_drought_percent": 65.8,
    "severe_or_worse_percent": 38.2
  },
  "analysis": {
    "change": "+6.5% area in drought",
    "trend": "worsening",
    "notable": "Severe drought (D2+) increased by 6.9 percentage points"
  }
}
```

## Data Schema

The server outputs drought data in a format compatible with the fire-behavior `wildfire_prompt_template.json` schema, extending it with drought-specific fields.

**Drought Severity Integration:**

Drought conditions are integrated into the wildfire risk assessment as follows:

| Drought Category | Severity Level | Wildfire Risk Contribution |
|------------------|----------------|----------------------------|
| None | 0 | None (0 points) |
| D0 (Abnormally Dry) | 1 | Low (+10 points) |
| D1 (Moderate) | 2 | Moderate (+20 points) |
| D2 (Severe) | 3 | High (+30 points) |
| D3 (Extreme) | 4 | Very High (+40 points) |
| D4 (Exceptional) | 5 | Extreme (+50 points) |

See [Data Schema Documentation](docs/data_schema.md) for complete mapping details.

## Data Sources

This MCP server connects to:

1. **US Drought Monitor Data Services**
   - Website: https://droughtmonitor.unl.edu/
   - GIS Data: https://droughtmonitor.unl.edu/DmData/GISData.aspx
   - Data format: GeoJSON, Shapefile, JSON, CSV
   - Update frequency: Weekly (Thursdays)

2. **NDMC Data API**
   - API endpoint: https://usdmdataservices.unl.edu/api/
   - County/state statistics
   - Historical time series

3. **NOAA Drought Portal** (supplemental)
   - Website: https://www.drought.gov/
   - Additional drought indicators

## Drought Severity Descriptions

### D0 - Abnormally Dry
- Going into drought: short-term dryness slowing planting, growth of crops or pastures
- Coming out of drought: some lingering water deficits; pastures or crops not fully recovered

### D1 - Moderate Drought
- Some damage to crops, pastures
- Streams, reservoirs, or wells low; some water shortages developing or imminent
- Voluntary water-use restrictions requested

### D2 - Severe Drought
- Crop or pasture losses likely
- Water shortages common
- Water restrictions imposed

### D3 - Extreme Drought
- Major crop/pasture losses
- Widespread water shortages or restrictions
- Increased wildfire danger

### D4 - Exceptional Drought
- Exceptional and widespread crop/pasture losses
- Shortages of water in reservoirs, streams, and wells creating water emergencies
- Extreme wildfire danger

## Integration with fire-behavior

Drought data enhances wildfire risk assessments:

1. **Drought as a Risk Multiplier**: Severe drought increases wildfire risk significantly
2. **Fuel Moisture Correlation**: Drought severity correlates with low fuel moisture
3. **Vegetation Stress**: Prolonged drought creates highly flammable dead vegetation
4. **Water Availability**: Drought affects firefighting water supply
5. **Historical Context**: Drought trends help predict fire season severity

See [Fire Behavior Integration Guide](docs/fire_behavior_integration.md) for detailed integration steps.

## Common Use Cases

### Wildfire Risk Assessment
```
Query: "What's the drought situation in Boulder County and how does it affect fire risk?"

Response includes:
- Current drought severity (D0-D4)
- Drought duration and trend
- Impact on fuel moisture and vegetation
- Contribution to overall wildfire risk score
```

### Agricultural Planning
```
Query: "Show me drought conditions across California's Central Valley"

Response includes:
- County-level drought severity
- Percent of agricultural land in drought
- Comparison to historical averages
```

### Water Resource Management
```
Query: "How have drought conditions changed in the Colorado River basin over the past year?"

Response includes:
- Multi-state drought trends
- Severity changes by region
- Comparison to previous year
```

## Troubleshooting

### No Data Returned

**Location Not Found:**
- Verify location name spelling
- Try using state + county instead of city name
- Or use precise lat/lon coordinates

**Date Out of Range:**
- USDM data available from 2000-01-04 to present
- Historical queries limited to this range

### Stale Data

The USDM updates weekly on Thursdays. If you query on a Wednesday, you'll get the previous week's data. This is normal and expected.

**To check data currency:**
- Look at the `as_of` field in responses
- Data should be dated to the most recent Tuesday

### Cache Issues

Drought data changes only weekly, so caching is aggressive (24 hours default):

1. To force refresh, restart the server
2. Modify `CACHE_TTL_SECONDS` in `.env`
3. Wait for next Thursday's USDM update

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run in development mode with auto-reload
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

## Project Structure

```
drought-mcp/
├── src/
│   ├── index.js           # MCP server entry point
│   ├── tools/             # MCP tool implementations
│   ├── api/               # API client modules
│   ├── schemas/           # Data validation schemas
│   └── utils/             # Helper functions
├── docs/
│   ├── architecture.md    # System architecture
│   ├── implementation_plan.md
│   ├── data_schema.md     # Schema mapping details
│   ├── api_endpoints.md   # External API documentation
│   └── fire_behavior_integration.md
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── CONTRIBUTING.md
└── README.md
```

## Contributing

We welcome contributions! Whether it's bug fixes, new features, documentation improvements, or examples, your help is appreciated.

### Ways to Contribute
- Report bugs and suggest features via GitHub issues
- Improve documentation and examples
- Submit pull requests with bug fixes or enhancements
- Help test the MCP server with real-world use cases
- Share your integration experiences

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines and development workflow.

## License

Apache 2.0 - See LICENSE file for details

## Documentation

### User Documentation
- [User Guide](docs/USER_GUIDE.md) - Complete guide for end users
- [Examples](docs/EXAMPLES.md) - Comprehensive usage examples and sample outputs
- [API Endpoints](docs/api_endpoints.md) - External API documentation

### Developer Documentation
- [Developer Guide](docs/DEVELOPER.md) - Architecture, development setup, and implementation details
- [Implementation Plan](docs/implementation_plan.md) - 8-phase development roadmap
- [Contributing Guidelines](docs/CONTRIBUTING.md) - How to contribute to this project
- [CLAUDE.md](CLAUDE.md) - AI assistant guidance for working with this codebase

## Related Projects

- [fire-behavior](https://github.com/EliSchillinger/fire-behavior) - Wildfire information interface
- [raws-mcp](https://github.com/tyson-swetnam/raws-mcp) - RAWS weather data MCP server
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - MCP specification
- [US Drought Monitor](https://droughtmonitor.unl.edu/) - Official USDM website

## Acknowledgments

- **Data Source**: US Drought Monitor (NDMC, USDA, NOAA)
- **Schema**: Based on fire-behavior application's `wildfire_prompt_template.json`
- **Partners**: National Drought Mitigation Center, National Integrated Drought Information System

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/tyson-swetnam/drought-mcp/issues)
- Check the [docs/](docs/) directory for detailed documentation
- Review [troubleshooting](#troubleshooting) section above

## Status

This project is currently in the **planning and documentation phase**. The core implementation is being developed. See the [Implementation Plan](docs/implementation_plan.md) for timeline and milestones.

## Weekly Data Updates

The US Drought Monitor releases new data every Thursday morning (typically by 8:30 AM ET). The MCP server automatically fetches the latest data when queried. For time-sensitive applications, query after Thursday morning for the most current drought assessment.
