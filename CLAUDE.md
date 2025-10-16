# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides access to US Drought Monitor data for wildfire risk assessment, agricultural planning, and water resource management. The server formats drought severity data to integrate with the fire-behavior application's wildfire risk assessment schema.

**Current Status:** Planning and documentation phase complete. Implementation (src/) has not been created yet.

## Core Concepts

### US Drought Monitor Integration
- Data source: USDM GeoJSON files and NDMC Data Services API
- Update frequency: Weekly (Thursdays ~8:30 AM ET)
- Drought categories: D0 (Abnormally Dry) through D4 (Exceptional Drought)
- Data format: GeoJSON with MultiPolygon features containing drought severity

### Wildfire Risk Integration
- Drought severity contributes to wildfire risk scoring (0-50 points)
- Data must conform to wildfire_prompt_template.json schema from fire-behavior app
- D0=10 points, D1=20, D2=30, D3=40, D4=50 points added to overall risk

## Development Commands

### Package Management
```bash
npm install              # Install dependencies
```

### Running the Server
```bash
npm start               # Start MCP server
npm run dev             # Start with auto-reload (--watch)
```

### Testing
```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage   # Run tests with coverage report
```

### Code Quality
```bash
npm run lint            # Check code style
npm run lint:fix        # Auto-fix linting issues
```

## Architecture

### Project Structure (planned)
```
src/
├── index.js              # MCP server entry point
├── config.js             # Configuration loader
├── logger.js             # Winston logging utility
├── tools/                # MCP tool implementations
│   ├── index.js          # Tool registry
│   ├── get-current.js    # get_drought_current tool
│   ├── get-by-area.js    # get_drought_by_area tool
│   ├── get-historical.js # get_drought_historical tool
│   └── get-statistics.js # get_drought_statistics tool
├── api/                  # External API clients
│   ├── base-client.js    # HTTP client with retries
│   ├── usdm-client.js    # USDM GeoJSON client
│   ├── ndmc-client.js    # NDMC API client
│   └── cache.js          # Cache management
├── geojson/              # GeoJSON processing
│   ├── downloader.js     # Fetch USDM GeoJSON
│   ├── processor.js      # Point-in-polygon queries (Turf.js)
│   └── cache.js          # GeoJSON caching
├── location/             # Location resolution
│   ├── geocoder.js       # Location name → coordinates
│   └── resolver.js       # Unified location resolution
├── schemas/              # Data schemas
│   ├── wildfire-schema.js # Schema from wildfire_prompt_template
│   ├── drought-schema.js  # Drought data schema
│   └── transformer.js     # Transform USDM → wildfire format
└── utils/                # Helper functions
    ├── fips.js           # FIPS code utilities
    ├── risk-calculator.js # Drought → wildfire risk scoring
    └── validators.js      # Schema validators
```

### Key Components

1. **MCP Server (index.js)**: Entry point using @modelcontextprotocol/sdk
2. **Tool Handlers**: Four MCP tools (get_drought_current, get_drought_by_area, get_drought_historical, get_drought_statistics)
3. **API Clients**: Fetch from USDM GeoJSON endpoints and NDMC Data Services API
4. **GeoJSON Processor**: Point-in-polygon lookup using @turf/turf for location-based queries
5. **Schema Transformer**: Convert USDM data to wildfire_prompt_template.json format
6. **Cache Layer**: 24-hour TTL for current data, permanent cache for historical data

## MCP Tools Specification

### 1. get_drought_current
Get current drought conditions for a specific location.

**Parameters:**
- `location` (string, optional): Location name (e.g., "Boulder County, CO")
- `latitude`/`longitude` (number, optional): Coordinates
- `state`/`county` (string, optional): State abbreviation and county name
- `format` (string, optional): "json" or "wildfire_schema" (default)

**Returns:** Current drought severity (D0-D4), area percentage, risk assessment, data sources

### 2. get_drought_by_area
Get drought statistics for a state or region.

**Parameters:**
- `state` (string, required): State abbreviation
- `include_counties` (boolean, optional): Include county-level breakdown
- `date` (string, optional): Specific date (ISO 8601)

**Returns:** State-wide drought percentages by category, optional county breakdown

### 3. get_drought_historical
Retrieve historical drought data and trends.

**Parameters:**
- Location parameters (same as get_drought_current)
- `start_date`/`end_date` (string, required): Date range (ISO 8601)
- `aggregation` (string, optional): "weekly" or "monthly"

**Returns:** Time series data, trend analysis (worsening/improving), severity changes

### 4. get_drought_statistics
Get statistical summaries and comparisons.

**Parameters:**
- `state` or `region` (string, optional)
- `compare_to` (string, optional): "last_year", "10_year_avg", "historical_avg"

**Returns:** Statistical summaries with historical comparisons

## Data Sources

### USDM GeoJSON Data
- Current week: `https://droughtmonitor.unl.edu/data/json/usdm_current.json`
- Historical: `https://droughtmonitor.unl.edu/data/json/usdm_YYYYMMDD.json`
- Format: GeoJSON FeatureCollection with `DM` property (0-4 for D0-D4)
- Features overlap (D4 areas also in D3, D2, D1, D0) - use highest severity

### NDMC Data Services API
- Base URL: `https://usdmdataservices.unl.edu/api/`
- State statistics: `/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent`
- County statistics: `/CountyStatistics/GetDSCI`
- Historical time series: `/TimeSeriesStatistics/GetDroughtSeverityStatisticsByArea`
- No authentication required (public API)

## Implementation Guidelines

### GeoJSON Processing
- Use @turf/turf for point-in-polygon operations
- Handle overlapping drought polygons (take maximum DM value)
- Cache parsed GeoJSON in memory (24-hour TTL for current, permanent for historical)
- GeoJSON files can be 5-15 MB - consider streaming for large files

### Location Resolution
- Support three input methods: location name, lat/lon coordinates, or state/county
- Use Nominatim (OpenStreetMap) for geocoding location names to coordinates
- Respect Nominatim's 1 req/sec rate limit and require User-Agent header
- Cache geocoding results for 7 days

### Caching Strategy
- Current week GeoJSON: 24 hours (updates weekly Thursday mornings)
- Historical GeoJSON: Cache permanently (data never changes)
- API statistics: 24 hours
- Geocoding results: 7 days
- Use in-memory cache for development, consider Redis for production

### Schema Transformation
- Transform USDM data to match wildfire_prompt_template.json structure
- Map D0-D4 categories to severity_level (0-4) and descriptive text
- Calculate drought contribution to wildfire risk (D0=10pts through D4=50pts)
- Include data_sources array with USDM attribution
- Add "as_of" timestamp indicating data freshness

### Error Handling
- Handle 404 errors for non-existent historical dates gracefully
- Implement exponential backoff retry for 500 server errors
- Increase timeout to 30s for large GeoJSON downloads
- Return null/None for locations with no drought (don't error)
- Handle locations outside US boundaries

### Data Freshness
- USDM releases data every Thursday ~8:30 AM ET
- Data represents week ending previous Tuesday
- Before Thursday 9 AM ET, use previous week's data
- Include "as_of" field in responses showing data date

## Testing Approach

### Unit Tests
- API client functions with mocked HTTP responses
- GeoJSON processor with fixture data
- Schema transformer with sample USDM data
- Location resolver with various input formats

### Integration Tests
- End-to-end MCP tool invocations
- Real USDM API calls (may be slow, consider mocking)
- Geographic edge cases (state borders, Alaska, Hawaii, ocean points)

### Test Locations
Use these representative locations for testing different drought conditions:
- Phoenix, AZ (33.45°N, 112.07°W): Typically D2-D4 (severe)
- Boulder, CO (40.01°N, 105.27°W): Typically D0-D2 (moderate)
- Seattle, WA (47.61°N, 122.33°W): Typically None-D0 (minimal)
- California Central Valley (36.75°N, 119.77°W): Typically D1-D3 (agricultural drought)

### Test Coverage Target
Aim for >80% code coverage

## Configuration

### Environment Variables (.env)
- `LOG_LEVEL`: Logging verbosity (default: "info")
- `CACHE_TTL_SECONDS`: Cache duration (default: 86400 = 24 hours)
- `USDM_DATA_FORMAT`: Preferred format "json", "geojson", or "csv" (default: "json")
- `ENABLE_HISTORICAL_ANALYSIS`: Enable historical trend analysis (default: true)

### MCP Server Registration
Add to Claude Desktop config:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drought-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/drought-mcp/src/index.js"],
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

**Note**: Replace `/absolute/path/to/drought-mcp` with the actual path. After editing, restart Claude Desktop.

## Key Dependencies

### Core
- `@modelcontextprotocol/sdk`: MCP server framework
- `@turf/turf`: GeoJSON geometric operations (point-in-polygon)
- `axios`: HTTP client for API requests
- `zod`: Schema validation
- `dotenv`: Environment configuration
- `winston`: Structured logging

### Development
- `jest`: Testing framework (use with NODE_OPTIONS=--experimental-vm-modules for ESM)
- `eslint`: Code linting

## Integration with fire-behavior

This MCP server is designed to integrate with the fire-behavior application:
- Drought data supplements weather data from raws-mcp server
- Both conform to wildfire_prompt_template.json schema
- Combined risk calculation: weather risk + drought risk = total wildfire risk
- Drought provides fuel moisture context for fire behavior modeling

## Related Projects

- fire-behavior: https://github.com/EliSchillinger/fire-behavior (wildfire risk interface)
- raws-mcp: Weather station data MCP server (companion project)
- US Drought Monitor: https://droughtmonitor.unl.edu/ (data source)

## Important Notes for Implementation

1. **No src/ directory yet**: The implementation phase hasn't started. Follow the structure in docs/implementation_plan.md.

2. **GeoJSON overlap handling**: USDM GeoJSON features overlap (a D4 area is also in D3, D2, D1, D0 layers). Always use the maximum DM value when a point falls in multiple polygons.

3. **Weekly data timing**: USDM data is dated to the Thursday release date but covers the week ending the previous Tuesday. File `usdm_20250829.json` (Aug 29 = Thursday) contains data for Aug 22-28.

4. **Date format differences**: USDM GeoJSON uses YYYYMMDD in filenames, but NDMC API uses MM/DD/YYYY in parameters. Handle both formats.

5. **FIPS codes**: County-level data uses FIPS codes (e.g., "08013" for Boulder County, CO). Include FIPS lookup utilities.

6. **ESM modules**: This project uses `"type": "module"` in package.json. Use ESM imports/exports, not CommonJS require().

7. **Testing with NODE_OPTIONS**: Jest requires `NODE_OPTIONS=--experimental-vm-modules` for ESM support (already configured in package.json scripts).

## Documentation References

- README.md: User-facing documentation with usage examples
- docs/implementation_plan.md: 8-phase implementation roadmap with detailed tasks
- docs/api_endpoints.md: External API documentation and examples
- STATUS.md: Current project status and next steps
