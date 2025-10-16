# US Drought Monitor MCP Server Implementation Plan

> **Current Status:** Planning and Documentation Phase (Phase 0)
> **Last Updated:** October 2025

## Overview

This document outlines the implementation plan for the US Drought Monitor MCP server. The server will provide current and historical drought severity data for wildfire risk assessment, agricultural planning, and water resource management.

**Project Status:**
- ✅ Phase 0: Planning and Documentation - **COMPLETE**
- ⏳ Phase 1: Core MCP Server Setup - **NEXT**
- ⏳ Phase 2-7: Implementation phases pending

## Objectives

1. Create an MCP server that exposes US Drought Monitor data through standardized tools
2. Format data to conform to the wildfire_prompt_template.json schema
3. Support location-based drought severity queries (point, county, state)
4. Enable historical drought trend analysis
5. Integrate drought severity into wildfire risk assessments

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude / MCP Client                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────────────┐
│                    Drought MCP Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tool Handler │  │ Schema       │  │ GeoJSON      │      │
│  │              │  │ Transformer  │  │ Processor    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────┐       │
│  │            API Client Manager                     │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │       │
│  │  │  USDM      │  │  NDMC      │  │  Geocoder  │ │       │
│  │  │  GeoJSON   │  │  API       │  │            │ │       │
│  │  └────────────┘  └────────────┘  └────────────┘ │       │
│  └───────────────────────────────────────────────────┘       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│              External Data Sources                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐      │
│  │ US Drought │  │ NDMC Data  │  │ Geocoding        │      │
│  │ Monitor    │  │ Services   │  │ Service          │      │
│  └────────────┘  └────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js (v18+)
- **MCP SDK**: @modelcontextprotocol/sdk
- **HTTP Client**: axios
- **GeoJSON Processing**: @turf/turf
- **Schema Validation**: zod
- **Testing**: jest
- **Development**: JavaScript with JSDoc

## Implementation Phases

### Phase 0: Planning and Documentation ✅ COMPLETE

**Goal**: Create comprehensive planning documentation

**Completed**:
- [x] README.md with project overview
- [x] package.json with dependencies
- [x] .env.example configuration
- [x] STATUS.md project tracking
- [x] This implementation plan

**Deliverables**: ✅
- Complete project documentation
- Tool specifications
- Data schema overview

### Phase 1: Core MCP Server Setup

**Goal**: Create the basic MCP server infrastructure

**Tasks**:
- [ ] Initialize Node.js project structure
- [ ] Install MCP SDK and dependencies
- [ ] Create MCP server entry point (src/index.js)
- [ ] Implement server initialization and lifecycle
- [ ] Set up environment variable configuration
- [ ] Create basic error handling framework
- [ ] Add logging infrastructure (Winston)
- [ ] Create health check tool

**Deliverables**:
- Running MCP server that can be registered with Claude Desktop
- Basic logging and error handling
- Configuration from environment variables

**Files**:
```
src/
├── index.js              # MCP server entry point
├── config.js             # Configuration loader
└── logger.js             # Logging utility
```

**Estimated Time**: 2-3 days

### Phase 2: GeoJSON and Location Processing

**Goal**: Build capability to process US Drought Monitor GeoJSON data and resolve locations

**Tasks**:
- [ ] Implement GeoJSON downloader for USDM weekly data
- [ ] Create point-in-polygon lookup (Turf.js)
- [ ] Implement county/state FIPS code resolver
- [ ] Add geocoding integration (for location name → coordinates)
- [ ] Create location resolver utility
- [ ] Implement bounding box queries for areas
- [ ] Add caching for GeoJSON data (24-hour TTL)
- [ ] Handle GeoJSON parsing errors

**Deliverables**:
- GeoJSON processor that can determine drought severity for any US location
- Location resolution (name, lat/lon, county, state → drought data)
- Cached GeoJSON data to minimize downloads

**Files**:
```
src/
├── geojson/
│   ├── downloader.js     # Fetch USDM GeoJSON
│   ├── processor.js      # Point-in-polygon, queries
│   └── cache.js          # GeoJSON caching
├── location/
│   ├── geocoder.js       # Location name → coordinates
│   └── resolver.js       # Unified location resolution
└── utils/
    └── fips.js           # FIPS code utilities
```

**Estimated Time**: 3-4 days

### Phase 3: USDM API Client Implementation

**Goal**: Build client for US Drought Monitor data services

**Tasks**:
- [ ] Implement NDMC Data Services API client
  - [ ] County/state statistics endpoint
  - [ ] Historical time series endpoint
  - [ ] Area percentage calculations
- [ ] Create GeoJSON data fetcher
  - [ ] Current week GeoJSON
  - [ ] Historical GeoJSON archives
- [ ] Add response parsing and validation
- [ ] Implement error handling and retries
- [ ] Create cache strategy (24-hour for current, longer for historical)
- [ ] Add rate limiting protection

**Deliverables**:
- API client that fetches USDM data
- GeoJSON data access
- Historical data retrieval
- Unit tests for API client

**Files**:
```
src/api/
├── base-client.js        # Base HTTP client with retries
├── usdm-client.js        # USDM GeoJSON client
├── ndmc-client.js        # NDMC API client
└── cache.js              # Cache management
```

**API Endpoints Used**:

1. **USDM GeoJSON Data**:
   - Current: `https://droughtmonitor.unl.edu/data/json/usdm_current.json`
   - Historical: `https://droughtmonitor.unl.edu/data/json/usdm_YYYYMMDD.json`

2. **NDMC Data Services API**:
   - Statistics: `https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent`
   - County data: `https://usdmdataservices.unl.edu/api/CountyStatistics/GetDSCI`

**Estimated Time**: 3-4 days

### Phase 4: Schema Transformation

**Goal**: Transform USDM drought data to wildfire schema format

**Tasks**:
- [ ] Create schema definitions based on wildfire_prompt_template.json
- [ ] Implement transformer for drought_conditions section
  - [ ] Map D0-D4 severity to schema
  - [ ] Calculate area percentages
  - [ ] Add severity descriptions
- [ ] Extend risk_assessment with drought contribution
  - [ ] Drought severity → wildfire risk points (0-50)
  - [ ] Calculate overall risk level
- [ ] Add data_sources metadata
- [ ] Implement validation against schema
- [ ] Handle missing/incomplete data

**Deliverables**:
- Schema transformation modules
- Unit tests with sample drought data
- Validation against wildfire_prompt_template schema

**Files**:
```
src/schemas/
├── wildfire-schema.js    # Schema from template
├── drought-schema.js     # Drought data schema
└── transformer.js        # Transform USDM → wildfire format

src/utils/
├── risk-calculator.js    # Drought → wildfire risk
└── validators.js         # Schema validators
```

**Drought Risk Mapping**:
```javascript
const DROUGHT_RISK_POINTS = {
  'None': 0,
  'D0': 10,
  'D1': 20,
  'D2': 30,
  'D3': 40,
  'D4': 50
};
```

**Estimated Time**: 2-3 days

### Phase 5: MCP Tool Implementation

**Goal**: Implement the four core MCP tools

**Tasks**:
- [ ] Implement `get_drought_current` tool
  - [ ] Parameter validation
  - [ ] Location resolution
  - [ ] Fetch drought data
  - [ ] Transform to schema
  - [ ] Return formatted response
- [ ] Implement `get_drought_by_area` tool
  - [ ] State/county validation
  - [ ] Area statistics
  - [ ] Optional county breakdown
- [ ] Implement `get_drought_historical` tool
  - [ ] Date range validation
  - [ ] Time series data fetching
  - [ ] Trend analysis
  - [ ] Aggregation (weekly/monthly)
- [ ] Implement `get_drought_statistics` tool
  - [ ] Statistical calculations
  - [ ] Year-over-year comparisons
  - [ ] Regional summaries

**Deliverables**:
- Four working MCP tools
- Integration tests for each tool
- Error handling for all edge cases

**Files**:
```
src/tools/
├── index.js              # Tool registry
├── get-current.js        # get_drought_current
├── get-by-area.js        # get_drought_by_area
├── get-historical.js     # get_drought_historical
└── get-statistics.js     # get_drought_statistics
```

**Tool Specifications**:

#### Tool 1: get_drought_current
```json
{
  "name": "get_drought_current",
  "description": "Get current drought conditions for a location",
  "inputSchema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "Location name (e.g., 'Boulder County, CO')"
      },
      "latitude": {
        "type": "number",
        "description": "Latitude (-90 to 90)"
      },
      "longitude": {
        "type": "number",
        "description": "Longitude (-180 to 180)"
      },
      "state": {
        "type": "string",
        "description": "State abbreviation (e.g., 'CO')"
      },
      "county": {
        "type": "string",
        "description": "County name"
      },
      "format": {
        "type": "string",
        "enum": ["json", "wildfire_schema"],
        "default": "wildfire_schema"
      }
    }
  }
}
```

#### Tool 2: get_drought_by_area
```json
{
  "name": "get_drought_by_area",
  "description": "Get drought statistics for a state or region",
  "inputSchema": {
    "type": "object",
    "properties": {
      "state": {
        "type": "string",
        "description": "State abbreviation (required)"
      },
      "include_counties": {
        "type": "boolean",
        "default": false
      },
      "date": {
        "type": "string",
        "format": "date-time",
        "description": "Specific date (defaults to latest)"
      }
    },
    "required": ["state"]
  }
}
```

#### Tool 3: get_drought_historical
```json
{
  "name": "get_drought_historical",
  "description": "Retrieve historical drought data and trends",
  "inputSchema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" },
      "latitude": { "type": "number" },
      "longitude": { "type": "number" },
      "state": { "type": "string" },
      "start_date": {
        "type": "string",
        "format": "date-time",
        "description": "Start date (required)"
      },
      "end_date": {
        "type": "string",
        "format": "date-time",
        "description": "End date (required)"
      },
      "aggregation": {
        "type": "string",
        "enum": ["weekly", "monthly"],
        "default": "weekly"
      }
    },
    "required": ["start_date", "end_date"]
  }
}
```

#### Tool 4: get_drought_statistics
```json
{
  "name": "get_drought_statistics",
  "description": "Get statistical summaries and comparisons",
  "inputSchema": {
    "type": "object",
    "properties": {
      "state": { "type": "string" },
      "region": { "type": "string" },
      "compare_to": {
        "type": "string",
        "enum": ["last_year", "10_year_avg", "historical_avg"]
      }
    }
  }
}
```

**Estimated Time**: 3-4 days

### Phase 6: Testing and Validation

**Goal**: Comprehensive testing and quality assurance

**Tasks**:
- [ ] Write unit tests for all modules (>80% coverage)
- [ ] Create integration tests with mock APIs
- [ ] Test against real US Drought Monitor data
- [ ] Validate output schemas
- [ ] Test geographic edge cases (state borders, Alaska, Hawaii)
- [ ] Test historical data queries (2000-present)
- [ ] Performance testing
- [ ] Error scenario testing
- [ ] Documentation review

**Deliverables**:
- Complete test suite
- Test coverage report
- Performance benchmarks

**Files**:
```
tests/
├── unit/
│   ├── api-clients.test.js
│   ├── geojson-processor.test.js
│   ├── transformers.test.js
│   └── tools.test.js
├── integration/
│   └── mcp-tools.test.js
├── fixtures/
│   ├── sample-usdm-geojson.json
│   └── sample-drought-data.json
└── mocks/
    └── api-responses.js
```

**Test Cases**:
1. **Location Resolution**: Various input formats resolve correctly
2. **Drought Severity**: D0-D4 categories mapped correctly
3. **Historical Queries**: Time series data retrieved and aggregated
4. **Schema Validation**: All outputs conform to wildfire schema
5. **Edge Cases**: Missing data, inactive areas, date ranges
6. **Geographic**: State borders, territories, ocean points

**Estimated Time**: 2-3 days

### Phase 7: Documentation and Examples

**Goal**: Provide clear documentation for users and developers

**Tasks**:
- [ ] Complete README.md with usage examples
- [ ] Document each MCP tool with examples
- [ ] Create architecture.md with diagrams
- [ ] Write data_schema.md with mapping details
- [ ] Document API endpoints and data sources
- [ ] Add troubleshooting guide
- [ ] Create example integration with fire-behavior
- [ ] Add CONTRIBUTING.md guidelines

**Deliverables**:
- Complete documentation in docs/
- Example code snippets
- Integration guide

**Estimated Time**: 1-2 days

### Phase 8: Integration with fire-behavior

**Goal**: Connect Drought MCP server to fire-behavior application

**Tasks**:
- [ ] Update fire-behavior backend to call Drought MCP tools
- [ ] Modify risk calculation to include drought severity
- [ ] Update frontend to display drought information
- [ ] Add location → drought condition mapping
- [ ] Test end-to-end data flow
- [ ] Add fallback mechanisms if drought data unavailable
- [ ] Document integration steps

**Deliverables**:
- Working integration between fire-behavior and Drought MCP
- Updated fire-behavior documentation

**Integration Points**:

In fire-behavior `server/` (Python backend):
```python
async def calculate_risk(location):
    # Get drought conditions
    drought = await drought_mcp.get_drought_current(
        location=location,
        format="wildfire_schema"
    )

    # Get weather data (from RAWS MCP)
    weather = await raws_mcp.get_raws_current(...)

    # Calculate combined risk
    risk_score = 0
    risk_score += weather_risk_points(weather)
    risk_score += drought['drought_conditions']['severity_level'] * 10

    return determine_risk_level(risk_score)
```

**Estimated Time**: 2-3 days

## Data Sources

### US Drought Monitor

**GeoJSON Data**:
- Current: `https://droughtmonitor.unl.edu/data/json/usdm_current.json`
- Historical: `https://droughtmonitor.unl.edu/data/json/usdm_YYYYMMDD.json`
- Format: GeoJSON with MultiPolygon features
- Update: Weekly (Thursdays ~8:30 AM ET)

**GeoJSON Structure**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "DM": 2,  // Drought magnitude (0-4)
        "OBJECTID": 1,
        "Shape_Area": 0.123,
        "Shape_Length": 45.678
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[lon, lat], ...]]]
      }
    }
  ]
}
```

### NDMC Data Services API

**Base URL**: `https://usdmdataservices.unl.edu/api/`

**Key Endpoints**:
1. State Statistics: `/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent`
2. County Statistics: `/CountyStatistics/GetDSCI`
3. Historical Time Series: `/TimeSeriesStatistics/...`

**Authentication**: None (public API)

## Risk Assessment and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| GeoJSON processing slow | Medium | Cache parsed GeoJSON, use spatial indexing |
| USDM data unavailable | High | Cache last week's data, provide fallback |
| Location not resolved | Medium | Support multiple input formats, geocoding service |
| Historical data gaps | Low | Handle missing weeks, interpolate if needed |
| Schema changes | Low | Version schema, add validators |

## Timeline

- **Phase 0**: Complete ✅
- **Phase 1**: 2-3 days
- **Phase 2**: 3-4 days
- **Phase 3**: 3-4 days
- **Phase 4**: 2-3 days
- **Phase 5**: 3-4 days
- **Phase 6**: 2-3 days
- **Phase 7**: 1-2 days
- **Phase 8**: 2-3 days

**Total**: ~18-25 days (assuming full-time development)

## Success Criteria

1. MCP server successfully registers with Claude Desktop
2. All four tools return valid, schema-compliant data
3. Successfully retrieves drought data for any US location
4. Historical queries work from 2000 to present
5. Test coverage > 80%
6. Documentation complete and clear
7. fire-behavior successfully integrates drought data

## Next Steps

1. Review and approve implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Test with sample USDM GeoJSON data
5. Identify test locations for each drought category

## References

- [MCP SDK Documentation](https://github.com/anthropics/model-context-protocol)
- [US Drought Monitor](https://droughtmonitor.unl.edu/)
- [NDMC Data Services](https://usdmdataservices.unl.edu/)
- [Turf.js Documentation](https://turfjs.org/)
- [fire-behavior repository](https://github.com/EliSchillinger/fire-behavior)
- [wildfire_prompt_template.json](../fire-behavior/prompts/wildfire_prompt_template.json)
