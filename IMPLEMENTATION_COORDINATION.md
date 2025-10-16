# Drought MCP Implementation Coordination Plan

**Project Architect**: Claude Code Project-Architect Agent
**Date**: 2025-10-15
**Status**: Phase 0 Complete → Phase 1 Ready to Start

## Executive Summary

This document coordinates the full implementation of the drought-mcp server following the architecture defined in `docs/implementation_plan.md`. The project is transitioning from planning/documentation (Phase 0 - COMPLETE) to active implementation (Phase 1-7).

**Current State:**
- ✅ Complete documentation (README.md, implementation_plan.md, api_endpoints.md)
- ✅ Package.json with dependencies
- ✅ Directory structure created: src/, tests/
- ✅ Agent definitions configured
- ❌ NO implementation code exists yet

**Implementation Strategy:**
- Build incrementally, phase by phase
- Delegate to specialized agents based on expertise
- Verify each phase before proceeding
- Ensure wildfire_prompt_template.json schema compliance
- Test continuously with real USDM data

---

## Phase 1: Core MCP Server Setup

**Goal**: Create the foundational MCP server infrastructure that can register with Claude Desktop and handle basic requests.

**Priority**: CRITICAL - All other phases depend on this

**Estimated Time**: 2-3 days

### Tasks Breakdown

#### Task 1.1: MCP Server Entry Point
**File**: `src/index.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Import @modelcontextprotocol/sdk components (Server, StdioServerTransport)
- Initialize MCP server with metadata (name: "drought", version: "1.0.0")
- Set up tool registration system
- Implement request handlers (ListToolsRequestSchema, CallToolRequestSchema)
- Handle server lifecycle (startup, shutdown, error handling)
- Set up stdio transport for Claude Desktop communication
- Add graceful shutdown on SIGINT/SIGTERM

**Acceptance Criteria**:
- [ ] Server starts without errors
- [ ] Can be registered in Claude Desktop config
- [ ] Responds to tools/list request
- [ ] Handles tool calls with proper error responses
- [ ] Logs startup/shutdown events
- [ ] Exits cleanly on interrupt

**Dependencies**: None (foundational)

**Validation**:
```bash
node src/index.js
# Should start without errors and wait for MCP requests
```

#### Task 1.2: Configuration Loader
**File**: `src/config.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Load environment variables from .env using dotenv
- Export configuration object with:
  - LOG_LEVEL (default: 'info')
  - CACHE_TTL_SECONDS (default: 86400)
  - USDM_DATA_FORMAT (default: 'json')
  - ENABLE_HISTORICAL_ANALYSIS (default: true)
  - USDM_API_BASE_URL (with default)
  - COORDINATE_PRECISION (default: 4)
- Validate configuration on load
- Export typed configuration constants

**Acceptance Criteria**:
- [ ] Loads .env file correctly
- [ ] Provides sensible defaults
- [ ] Exports well-typed configuration
- [ ] Validates required settings
- [ ] Handles missing .env gracefully

**Dependencies**: None

**Validation**:
```javascript
import config from './config.js';
console.log(config.LOG_LEVEL); // Should output 'info' or env value
```

#### Task 1.3: Logging Infrastructure
**File**: `src/logger.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Use Winston for structured logging
- Configure console transport with colors
- Support log levels: error, warn, info, debug
- Include timestamps
- Format: `[TIMESTAMP] [LEVEL] message`
- Export singleton logger instance
- Use LOG_LEVEL from config

**Acceptance Criteria**:
- [ ] Logger instance is created
- [ ] Supports all standard log levels
- [ ] Output is properly formatted
- [ ] Respects LOG_LEVEL configuration
- [ ] Can be imported throughout codebase

**Dependencies**: src/config.js

**Validation**:
```javascript
import logger from './logger.js';
logger.info('Test message');
// Should output: [2025-10-15T10:00:00Z] [info] Test message
```

#### Task 1.4: Basic Health Check Tool
**File**: `src/tools/health.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Create simple health check MCP tool
- Tool name: "health_check"
- No input parameters required
- Returns server status, version, uptime
- Include timestamp of last USDM data update
- Format response as standardized tool output

**Acceptance Criteria**:
- [ ] Tool is properly registered
- [ ] Returns valid MCP tool response
- [ ] Includes server metadata
- [ ] Can be called via MCP protocol

**Dependencies**: src/index.js, src/config.js, src/logger.js

**Validation**: Register in Claude Desktop and call health_check tool

---

### Phase 1 Integration

**Integration Steps**:
1. mcp-node-engineer creates src/index.js with MCP server
2. software-engineer creates src/config.js
3. software-engineer creates src/logger.js
4. mcp-node-engineer integrates logger into index.js
5. mcp-node-engineer creates src/tools/health.js
6. mcp-node-engineer registers health tool in index.js
7. Test server startup and health check

**Validation Checkpoint**:
```bash
# 1. Start server
node src/index.js

# 2. Register in Claude Desktop config
# 3. Query health_check tool
# Expected: Tool returns server status successfully
```

**Success Criteria for Phase 1**:
- [ ] Server starts and runs without errors
- [ ] Registers successfully with Claude Desktop
- [ ] health_check tool returns valid response
- [ ] Logging works correctly
- [ ] Configuration loads properly
- [ ] Clean shutdown works

---

## Phase 2: GeoJSON and Location Processing

**Goal**: Build capability to process USDM GeoJSON data and resolve locations to drought severity.

**Priority**: HIGH - Required for all drought lookup tools

**Estimated Time**: 3-4 days

### Tasks Breakdown

#### Task 2.1: GeoJSON Downloader
**File**: `src/geojson/downloader.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Fetch USDM GeoJSON from URLs:
  - Current: `https://droughtmonitor.unl.edu/data/json/usdm_current.json`
  - Historical: `https://droughtmonitor.unl.edu/data/json/usdm_YYYYMMDD.json`
- Use axios with 30-second timeout (large files)
- Implement retry logic (3 attempts, exponential backoff)
- Validate GeoJSON structure
- Return parsed FeatureCollection
- Handle 404 for historical dates

**Acceptance Criteria**:
- [ ] Downloads current week GeoJSON
- [ ] Downloads historical GeoJSON by date
- [ ] Handles network errors gracefully
- [ ] Validates GeoJSON format
- [ ] Retries on failure

**Dependencies**: src/logger.js, src/config.js

#### Task 2.2: GeoJSON Cache Manager
**File**: `src/geojson/cache.js`

**Assigned To**: `software-engineer`

**Requirements**:
- In-memory Map-based cache
- Cache key format: `geojson:YYYYMMDD`
- TTL: 24 hours for current, infinite for historical
- getCached(date) method
- setCache(date, geojson) method
- Automatic cleanup of expired entries
- Memory management for large GeoJSON files

**Acceptance Criteria**:
- [ ] Caches GeoJSON by date
- [ ] Respects TTL settings
- [ ] Returns cached data when valid
- [ ] Handles cache misses
- [ ] Cleans up expired entries

**Dependencies**: src/logger.js

#### Task 2.3: Point-in-Polygon Processor
**File**: `src/geojson/processor.js`

**Assigned To**: `mcp-node-engineer` (GeoJSON expertise)

**Requirements**:
- Use @turf/turf for point-in-polygon queries
- Function: `getDroughtSeverity(lat, lon, geojson)`
- Handle overlapping polygons (return maximum DM value)
- Support MultiPolygon geometries
- Return drought category: None, D0, D1, D2, D3, D4
- Include area information and properties
- Optimize for repeated queries on same GeoJSON

**Acceptance Criteria**:
- [ ] Correctly identifies drought severity for coordinates
- [ ] Handles overlapping polygons (uses max severity)
- [ ] Returns None for areas outside drought regions
- [ ] Works with MultiPolygon geometries
- [ ] Performs efficiently (< 100ms per query)

**Dependencies**: src/geojson/downloader.js, src/geojson/cache.js

#### Task 2.4: Location Geocoder
**File**: `src/location/geocoder.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Use Nominatim (OpenStreetMap) geocoding API
- Function: `geocode(locationString)`
- Convert location names to lat/lon
- Filter to US locations only
- Add User-Agent header
- Respect 1 req/sec rate limit
- Cache geocoding results (7 days)

**Acceptance Criteria**:
- [ ] Converts location strings to coordinates
- [ ] Filters to US locations
- [ ] Respects rate limits
- [ ] Caches results
- [ ] Handles API failures

**Dependencies**: src/logger.js

#### Task 2.5: Location Resolver
**File**: `src/location/resolver.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Unified interface for location resolution
- Accepts: location string, lat/lon, state/county, FIPS code
- Function: `resolveLocation(params)`
- Returns standardized location object:
  ```javascript
  {
    latitude: number,
    longitude: number,
    name: string,
    county: string,
    state: string,
    fips: string
  }
  ```
- Handles various input formats
- Validates coordinates (-90 to 90 lat, -180 to 180 lon)

**Acceptance Criteria**:
- [ ] Resolves location strings via geocoding
- [ ] Accepts direct lat/lon coordinates
- [ ] Validates all inputs
- [ ] Returns standardized format
- [ ] Handles resolution failures gracefully

**Dependencies**: src/location/geocoder.js

#### Task 2.6: FIPS Code Utilities
**File**: `src/utils/fips.js`

**Assigned To**: `software-engineer`

**Requirements**:
- State abbreviation to FIPS code mapping
- County name to FIPS code lookup
- Validation functions
- Export state/county reference data

**Acceptance Criteria**:
- [ ] Maps state codes to FIPS
- [ ] Validates FIPS codes
- [ ] Provides lookup functions

**Dependencies**: None

---

### Phase 2 Integration

**Integration Steps**:
1. Create downloader.js and test with real USDM URLs
2. Create cache.js and test caching behavior
3. Create processor.js and test with sample GeoJSON
4. Create geocoder.js with rate limiting
5. Create resolver.js integrating all location methods
6. Create fips.js utility
7. Integration test: "Boulder, CO" → drought severity

**Validation Checkpoint**:
```javascript
import { resolveLocation } from './location/resolver.js';
import { getDroughtSeverity } from './geojson/processor.js';
import { downloadGeoJSON } from './geojson/downloader.js';

const location = await resolveLocation({ location: "Boulder, CO" });
const geojson = await downloadGeoJSON('current');
const severity = getDroughtSeverity(location.latitude, location.longitude, geojson);
console.log(severity); // Should output: "D2" or similar
```

**Success Criteria for Phase 2**:
- [ ] Can download current USDM GeoJSON
- [ ] Can download historical GeoJSON by date
- [ ] GeoJSON caching works correctly
- [ ] Point-in-polygon returns accurate drought severity
- [ ] Location geocoding works
- [ ] Location resolver handles all input types
- [ ] Integration test passes

---

## Phase 3: API Client Implementation

**Goal**: Build clients for USDM GeoJSON and NDMC Data Services API with caching and rate limiting.

**Priority**: HIGH - Required for area statistics and historical data

**Estimated Time**: 3-4 days

### Tasks Breakdown

#### Task 3.1: Base HTTP Client
**File**: `src/api/base-client.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Create base HTTP client using axios
- Implement retry logic (3 attempts, exponential backoff)
- Standard error handling and transformation
- Request/response logging
- Timeout configuration
- User-Agent header
- Base class for other API clients

**Acceptance Criteria**:
- [ ] Handles network errors gracefully
- [ ] Retries failed requests
- [ ] Logs requests and responses
- [ ] Transforms errors consistently
- [ ] Can be extended by specific clients

**Dependencies**: src/logger.js, src/config.js

#### Task 3.2: USDM GeoJSON Client
**File**: `src/api/usdm-client.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Extends base-client
- Methods:
  - `getCurrentGeoJSON()` - current week data
  - `getHistoricalGeoJSON(date)` - specific date
  - `getDateForWeek(date)` - find Tuesday date for week
- Integrates with geojson/cache.js
- Validates GeoJSON responses
- Handles 404 for missing historical data

**Acceptance Criteria**:
- [ ] Fetches current GeoJSON
- [ ] Fetches historical GeoJSON by date
- [ ] Uses cache appropriately
- [ ] Handles missing data
- [ ] Returns validated GeoJSON

**Dependencies**: src/api/base-client.js, src/geojson/cache.js

#### Task 3.3: NDMC Data Services Client
**File**: `src/api/ndmc-client.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Extends base-client
- Base URL: `https://usdmdataservices.unl.edu/api/`
- Methods:
  - `getStateStatistics(state, startDate, endDate)` - state drought %
  - `getCountyStatistics(state, startDate, endDate)` - county data
  - `getTimeSeries(state, startDate, endDate)` - historical trends
- Date format conversion (YYYY-MM-DD → MM/DD/YYYY for API)
- Response parsing and validation
- Cache responses (24-hour TTL)

**Acceptance Criteria**:
- [ ] Fetches state statistics
- [ ] Fetches county statistics
- [ ] Fetches time series data
- [ ] Converts date formats correctly
- [ ] Caches responses
- [ ] Parses API responses correctly

**Dependencies**: src/api/base-client.js

#### Task 3.4: Cache Management Module
**File**: `src/api/cache.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Generic cache for API responses
- In-memory Map-based storage
- Configurable TTLs by cache type
- Methods: get(key), set(key, value, ttl), clear(key), cleanup()
- Automatic expiration checking
- Memory usage monitoring

**Acceptance Criteria**:
- [ ] Caches API responses
- [ ] Respects TTL settings
- [ ] Provides cache hit/miss logging
- [ ] Cleans up expired entries
- [ ] Monitors memory usage

**Dependencies**: src/logger.js, src/config.js

#### Task 3.5: Rate Limiter
**File**: `src/api/rate-limiter.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Simple rate limiter for API calls
- Configurable requests per second
- Methods: waitIfNeeded(), reset()
- Track last request time
- Delay subsequent requests if needed
- Support per-endpoint limits

**Acceptance Criteria**:
- [ ] Enforces rate limits
- [ ] Delays requests appropriately
- [ ] Supports multiple endpoints
- [ ] Handles concurrent requests

**Dependencies**: None

---

### Phase 3 Integration

**Integration Steps**:
1. Create base-client.js with retry logic
2. Create cache.js for API responses
3. Create rate-limiter.js
4. Create usdm-client.js using base client
5. Create ndmc-client.js using base client
6. Test each client with real API endpoints
7. Verify caching and rate limiting work

**Validation Checkpoint**:
```javascript
import { USDMClient } from './api/usdm-client.js';
import { NDMCClient } from './api/ndmc-client.js';

const usdm = new USDMClient();
const geojson = await usdm.getCurrentGeoJSON();
console.log(`Features: ${geojson.features.length}`);

const ndmc = new NDMCClient();
const stats = await ndmc.getStateStatistics('CO', '2025-08-29', '2025-08-29');
console.log(stats);
```

**Success Criteria for Phase 3**:
- [ ] USDM client fetches GeoJSON data
- [ ] NDMC client fetches statistics
- [ ] Caching reduces redundant API calls
- [ ] Rate limiting prevents excessive requests
- [ ] Error handling works correctly
- [ ] All clients can be used independently

---

## Phase 4: Schema Transformation

**Goal**: Transform USDM data to wildfire_prompt_template.json schema format.

**Priority**: HIGH - Required for wildfire integration

**Estimated Time**: 2-3 days

### Tasks Breakdown

#### Task 4.1: Drought Schema Definitions
**File**: `src/schemas/drought-schema.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Define Zod schemas for drought data structures
- Schema for drought severity (D0-D4)
- Schema for area statistics
- Schema for time series data
- Schema for location data
- Validation functions for each schema

**Acceptance Criteria**:
- [ ] All drought data types have Zod schemas
- [ ] Schemas match API response formats
- [ ] Validation functions are exported
- [ ] TypeScript-style JSDoc types included

**Dependencies**: None

#### Task 4.2: Wildfire Schema Definitions
**File**: `src/schemas/wildfire-schema.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Define Zod schemas matching wildfire_prompt_template.json
- Schema for drought_conditions section
- Schema for risk_assessment section
- Schema for data_sources array
- Schema for complete wildfire response
- Validation functions

**Acceptance Criteria**:
- [ ] Schemas match wildfire_prompt_template.json exactly
- [ ] All required fields are defined
- [ ] Optional fields are marked correctly
- [ ] Validation functions work

**Dependencies**: None

#### Task 4.3: Drought Data Transformer
**File**: `src/schemas/transformer.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Transform USDM drought data to wildfire schema
- Function: `transformToWildfireSchema(droughtData, location)`
- Map D0-D4 to severity descriptions
- Calculate drought contribution to wildfire risk
- Format data_sources array
- Include location metadata
- Add timestamp and notes

**Acceptance Criteria**:
- [ ] Transforms drought data to wildfire schema
- [ ] All required fields are populated
- [ ] Drought severity is correctly mapped
- [ ] Risk assessment is calculated
- [ ] Output validates against wildfire schema

**Dependencies**: src/schemas/drought-schema.js, src/schemas/wildfire-schema.js

#### Task 4.4: Risk Calculator
**File**: `src/utils/risk-calculator.js`

**Assigned To**: `drought-data-interpreter` (domain expertise)

**Requirements**:
- Calculate wildfire risk contribution from drought
- Mapping:
  - None → 0 points
  - D0 → 10 points
  - D1 → 20 points
  - D2 → 30 points
  - D3 → 40 points
  - D4 → 50 points
- Function: `calculateDroughtRisk(severity, areaPercent, duration)`
- Consider area coverage and duration
- Return risk level and description

**Acceptance Criteria**:
- [ ] Calculates risk points correctly
- [ ] Considers area coverage
- [ ] Accounts for drought duration
- [ ] Returns descriptive risk level
- [ ] Matches wildfire assessment standards

**Dependencies**: None

#### Task 4.5: Validators
**File**: `src/utils/validators.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Input validation functions
- Validate coordinates (lat, lon ranges)
- Validate dates (format, range)
- Validate state codes
- Validate drought severity codes
- Validate FIPS codes

**Acceptance Criteria**:
- [ ] All input types can be validated
- [ ] Returns clear error messages
- [ ] Handles edge cases
- [ ] Used throughout codebase

**Dependencies**: None

---

### Phase 4 Integration

**Integration Steps**:
1. Create drought-schema.js with all Zod schemas
2. Create wildfire-schema.js matching template
3. Create validators.js for input validation
4. Create risk-calculator.js with drought expertise
5. Create transformer.js integrating all components
6. Test transformation with sample data
7. Validate output against wildfire schema

**Validation Checkpoint**:
```javascript
import { transformToWildfireSchema } from './schemas/transformer.js';

const droughtData = {
  severity: 'D2',
  severityLevel: 2,
  areaPercent: 85,
  location: { name: 'Boulder County, CO', lat: 40.0, lon: -105.27 }
};

const wildfireData = transformToWildfireSchema(droughtData);
console.log(wildfireData.drought_conditions);
// Should match wildfire_prompt_template.json format
```

**Success Criteria for Phase 4**:
- [ ] All schemas are defined with Zod
- [ ] Transformer converts drought to wildfire format
- [ ] Risk calculator produces correct scores
- [ ] Output validates against wildfire schema
- [ ] Validators work for all input types

---

## Phase 5: MCP Tool Implementation

**Goal**: Implement the four core MCP tools using all previously built components.

**Priority**: CRITICAL - Core functionality

**Estimated Time**: 3-4 days

### Tasks Breakdown

#### Task 5.1: get_drought_current Tool
**File**: `src/tools/get-current.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- MCP tool definition with Zod input schema
- Accept: location string, lat/lon, state/county
- Call location resolver
- Fetch current USDM GeoJSON
- Perform point-in-polygon query
- Transform to wildfire schema
- Return formatted response
- Handle errors gracefully

**Acceptance Criteria**:
- [ ] Tool is properly registered
- [ ] Accepts all location input types
- [ ] Returns current drought severity
- [ ] Output matches wildfire schema
- [ ] Handles invalid locations
- [ ] Error messages are clear

**Dependencies**: All Phase 2, 3, 4 components

**Integration**: Register in src/index.js tools array

#### Task 5.2: get_drought_by_area Tool
**File**: `src/tools/get-by-area.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- MCP tool definition with Zod input schema
- Accept: state code, include_counties flag, optional date
- Call NDMC state statistics API
- Optionally call county statistics API
- Format area percentages by drought category
- Calculate drought-free percentage
- Return state summary and optional county breakdown

**Acceptance Criteria**:
- [ ] Tool is properly registered
- [ ] Returns state drought statistics
- [ ] Includes county breakdown when requested
- [ ] Handles invalid state codes
- [ ] Works with historical dates
- [ ] Output is well-formatted

**Dependencies**: src/api/ndmc-client.js, Phase 2 components

**Integration**: Register in src/index.js tools array

#### Task 5.3: get_drought_historical Tool
**File**: `src/tools/get-historical.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- MCP tool definition with Zod input schema
- Accept: location params, start_date, end_date, aggregation
- Fetch historical GeoJSON for date range
- Build time series of drought severity
- Calculate trends (improving, worsening, stable)
- Support weekly and monthly aggregation
- Return timeline with metadata

**Acceptance Criteria**:
- [ ] Tool is properly registered
- [ ] Fetches historical data for date range
- [ ] Calculates trends correctly
- [ ] Supports both aggregation types
- [ ] Handles missing historical data
- [ ] Output includes trend analysis

**Dependencies**: All Phase 2, 3 components

**Integration**: Register in src/index.js tools array

#### Task 5.4: get_drought_statistics Tool
**File**: `src/tools/get-statistics.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- MCP tool definition with Zod input schema
- Accept: state/region, compare_to parameter
- Fetch current statistics
- Fetch comparison period statistics
- Calculate changes and trends
- Return current, comparison, and analysis

**Acceptance Criteria**:
- [ ] Tool is properly registered
- [ ] Compares to historical periods
- [ ] Calculates percentage changes
- [ ] Identifies significant trends
- [ ] Handles missing comparison data

**Dependencies**: src/api/ndmc-client.js, Phase 2-4 components

**Integration**: Register in src/index.js tools array

#### Task 5.5: Tool Registry
**File**: `src/tools/index.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Export all tools as array
- Standardized tool format
- Tool metadata validation
- Easy registration in main server

**Acceptance Criteria**:
- [ ] All tools are exported
- [ ] Tools follow MCP conventions
- [ ] Easy to add new tools

**Dependencies**: All tool files

---

### Phase 5 Integration

**Integration Steps**:
1. Implement get-current.js with full integration
2. Test get_drought_current with various locations
3. Implement get-by-area.js
4. Test get_drought_by_area with real states
5. Implement get-historical.js
6. Test get_drought_historical with date ranges
7. Implement get-statistics.js
8. Test get_drought_statistics with comparisons
9. Create tools/index.js registry
10. Register all tools in src/index.js
11. Full integration test of all tools

**Validation Checkpoint**:
```bash
# Register server with Claude Desktop
# Test each tool:
# 1. get_drought_current for "Boulder, CO"
# 2. get_drought_by_area for "CO"
# 3. get_drought_historical for date range
# 4. get_drought_statistics for "CA"
```

**Success Criteria for Phase 5**:
- [ ] All four tools are implemented
- [ ] All tools registered with server
- [ ] Tools callable via Claude Desktop
- [ ] Error handling works correctly
- [ ] Output format is consistent
- [ ] Wildfire schema compliance

---

## Phase 6: Testing and Validation

**Goal**: Comprehensive test coverage for all modules and tools.

**Priority**: HIGH - Ensures reliability

**Estimated Time**: 2-3 days

### Tasks Breakdown

#### Task 6.1: Unit Tests - API Clients
**File**: `tests/unit/api-clients.test.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Test USDM client methods
- Test NDMC client methods
- Mock axios responses
- Test caching behavior
- Test rate limiting
- Test error handling

**Acceptance Criteria**:
- [ ] All client methods tested
- [ ] Success paths covered
- [ ] Error paths covered
- [ ] Caching verified
- [ ] Rate limiting verified

**Dependencies**: src/api/

#### Task 6.2: Unit Tests - GeoJSON Processing
**File**: `tests/unit/geojson-processor.test.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Test point-in-polygon queries
- Test overlapping polygon handling
- Test MultiPolygon support
- Use fixture GeoJSON data
- Test edge cases (ocean points, borders)

**Acceptance Criteria**:
- [ ] Point-in-polygon accuracy verified
- [ ] Overlapping polygons handled correctly
- [ ] Edge cases covered
- [ ] Uses realistic test data

**Dependencies**: src/geojson/, tests/fixtures/

#### Task 6.3: Unit Tests - Transformers
**File**: `tests/unit/transformers.test.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Test drought to wildfire schema transformation
- Test risk calculation
- Test schema validation
- Test with various drought severities
- Test with missing data

**Acceptance Criteria**:
- [ ] Transformation accuracy verified
- [ ] Risk calculations correct
- [ ] Schema validation works
- [ ] Handles missing data

**Dependencies**: src/schemas/

#### Task 6.4: Unit Tests - Tools
**File**: `tests/unit/tools.test.js`

**Assigned To**: `software-engineer`

**Requirements**:
- Test each tool handler
- Mock API and GeoJSON calls
- Test input validation
- Test error handling
- Test output format

**Acceptance Criteria**:
- [ ] All tools tested independently
- [ ] Input validation verified
- [ ] Error handling verified
- [ ] Output format correct

**Dependencies**: src/tools/

#### Task 6.5: Integration Tests
**File**: `tests/integration/mcp-tools.test.js`

**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Test full tool execution flow
- Test with real USDM data (or comprehensive mocks)
- Test cross-module integration
- Test wildfire schema compliance
- Test with various test locations

**Acceptance Criteria**:
- [ ] End-to-end flows work
- [ ] Integration between modules verified
- [ ] Wildfire schema output validated
- [ ] Test with realistic scenarios

**Dependencies**: All src/ modules

#### Task 6.6: Test Fixtures and Mocks
**Files**: `tests/fixtures/`, `tests/mocks/`

**Assigned To**: `software-engineer`

**Requirements**:
- Create sample USDM GeoJSON fixture
- Create sample NDMC API response fixtures
- Create API response mocks
- Create test location data

**Acceptance Criteria**:
- [ ] Realistic test data available
- [ ] Covers all drought severities
- [ ] Mocks match real API formats

**Dependencies**: None

---

### Phase 6 Integration

**Integration Steps**:
1. Create test fixtures and mocks
2. Write unit tests for each module
3. Write integration tests
4. Run full test suite
5. Generate coverage report
6. Fix any identified issues
7. Achieve 80%+ coverage

**Validation Checkpoint**:
```bash
npm test
# All tests should pass

npm run test:coverage
# Coverage should be > 80%
```

**Success Criteria for Phase 6**:
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Test coverage > 80%
- [ ] No critical bugs found
- [ ] Edge cases handled

---

## Phase 7: Final Integration and Validation

**Goal**: End-to-end validation and production readiness.

**Priority**: CRITICAL - Final verification

**Estimated Time**: 1-2 days

### Tasks Breakdown

#### Task 7.1: End-to-End Testing
**Assigned To**: `project-architect` (coordinator)

**Requirements**:
- Test complete flow from Claude Desktop
- Test all tools with real locations
- Test error scenarios
- Test with various date ranges
- Verify wildfire schema compliance
- Test caching and performance

**Acceptance Criteria**:
- [ ] All tools work via Claude Desktop
- [ ] Real USDM data is retrieved correctly
- [ ] Wildfire schema output is correct
- [ ] Error handling is user-friendly
- [ ] Performance is acceptable

**Dependencies**: All previous phases

#### Task 7.2: Documentation Verification
**Assigned To**: `documentation-writer`

**Requirements**:
- Verify README.md is accurate
- Update any implementation details
- Add troubleshooting section
- Document known limitations
- Update STATUS.md

**Acceptance Criteria**:
- [ ] Documentation matches implementation
- [ ] All tools documented correctly
- [ ] Examples work as described
- [ ] Troubleshooting is comprehensive

**Dependencies**: Completed implementation

#### Task 7.3: Code Quality Check
**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Run ESLint on all code
- Fix linting issues
- Review code consistency
- Check JSDoc completeness
- Verify error handling patterns

**Acceptance Criteria**:
- [ ] No linting errors
- [ ] Code follows patterns
- [ ] JSDoc is complete
- [ ] Error handling is consistent

**Dependencies**: All code complete

#### Task 7.4: Performance Validation
**Assigned To**: `mcp-node-engineer`

**Requirements**:
- Test GeoJSON loading performance
- Test point-in-polygon query performance
- Test caching effectiveness
- Optimize if needed
- Document performance characteristics

**Acceptance Criteria**:
- [ ] GeoJSON loads in < 5 seconds
- [ ] Point queries complete in < 100ms
- [ ] Caching reduces API calls by > 90%
- [ ] Performance is documented

**Dependencies**: Completed implementation

---

### Phase 7 Success Criteria

**Final Validation Checklist**:
- [ ] Server starts without errors
- [ ] Registers with Claude Desktop successfully
- [ ] All four tools are callable
- [ ] Real USDM data is retrieved correctly
- [ ] GeoJSON processing is accurate
- [ ] Wildfire schema output validates
- [ ] Error handling is comprehensive
- [ ] Test coverage > 80%
- [ ] Documentation is complete
- [ ] Performance is acceptable
- [ ] Code quality standards met

---

## Agent Delegation Strategy

### Agent Capabilities and Assignments

#### mcp-node-engineer
**Expertise**: MCP server architecture, GeoJSON processing, Node.js performance

**Assigned Tasks**:
- Phase 1: MCP server entry point (index.js), health check tool
- Phase 2: Point-in-polygon processor (critical GeoJSON expertise)
- Phase 3: Base HTTP client
- Phase 4: Schema definitions (drought-schema.js, wildfire-schema.js)
- Phase 5: All four MCP tool implementations
- Phase 6: Integration tests
- Phase 7: Code quality check, performance validation

**Why**: Deep MCP and GeoJSON expertise required for core server and spatial processing

#### software-engineer
**Expertise**: General Node.js development, API integration, testing

**Assigned Tasks**:
- Phase 1: Configuration (config.js), logging (logger.js)
- Phase 2: GeoJSON downloader, cache, location geocoder, location resolver, FIPS utils
- Phase 3: USDM client, NDMC client, cache management, rate limiter
- Phase 4: Validators
- Phase 6: Unit tests for all modules, test fixtures

**Why**: Strong general development skills for supporting infrastructure

#### drought-data-interpreter
**Expertise**: Drought severity analysis, wildfire risk assessment

**Assigned Tasks**:
- Phase 4: Risk calculator (domain expertise for drought-to-fire-risk mapping)
- Phase 7: Validation of drought risk calculations

**Why**: Domain expertise ensures accurate drought severity and wildfire risk calculations

#### documentation-writer
**Expertise**: Technical documentation

**Assigned Tasks**:
- Phase 7: Documentation verification and updates

**Why**: Ensures documentation accuracy and completeness

#### project-architect
**Expertise**: Overall coordination and integration

**Assigned Tasks**:
- All phases: Coordination and integration verification
- Phase 7: End-to-end testing

**Why**: Maintains oversight of complete system integration

---

## Critical Dependencies and Order

**Dependency Chain**:
1. Phase 1 (Server Infrastructure) → MUST complete first
2. Phase 2 (GeoJSON/Location) + Phase 3 (API Clients) → Can run in parallel
3. Phase 4 (Schema Transformation) → Requires Phases 2 & 3
4. Phase 5 (Tools) → Requires Phases 1-4
5. Phase 6 (Testing) → Ongoing, finalizes after Phase 5
6. Phase 7 (Validation) → Requires all previous phases

**Parallel Work Opportunities**:
- Phase 2 and Phase 3 can be developed simultaneously
- Testing (Phase 6) can begin as soon as each module completes
- Documentation can be updated continuously

---

## Quality Assurance Checkpoints

### After Phase 1:
- [ ] Server starts and stops cleanly
- [ ] Can register with Claude Desktop
- [ ] Health check tool works

### After Phase 2:
- [ ] GeoJSON downloads successfully
- [ ] Point-in-polygon returns correct severity
- [ ] Location resolution works for all input types

### After Phase 3:
- [ ] All API clients fetch real data
- [ ] Caching reduces redundant calls
- [ ] Rate limiting works

### After Phase 4:
- [ ] Schemas match wildfire_prompt_template.json
- [ ] Transformation produces valid output
- [ ] Risk calculations are accurate

### After Phase 5:
- [ ] All tools are callable via MCP
- [ ] Tools return correct data
- [ ] Error handling works

### After Phase 6:
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] No critical bugs

### After Phase 7:
- [ ] Production-ready
- [ ] Documentation complete
- [ ] Performance acceptable

---

## Risk Mitigation

### Identified Risks:

1. **GeoJSON File Size**: USDM GeoJSON can be 5-15 MB
   - **Mitigation**: Aggressive caching, compression, stream processing if needed

2. **Point-in-Polygon Performance**: Could be slow with large polygons
   - **Mitigation**: Spatial indexing, caching parsed GeoJSON

3. **API Rate Limits**: USDM/NDMC API may have undocumented limits
   - **Mitigation**: Conservative rate limiting, caching, retry logic

4. **Historical Data Gaps**: Some historical dates may not have data
   - **Mitigation**: Graceful handling, clear error messages

5. **Location Resolution**: Geocoding can fail
   - **Mitigation**: Multiple input methods, fallback to coordinates

6. **Schema Changes**: wildfire_prompt_template.json might evolve
   - **Mitigation**: Schema versioning, validation

---

## Communication Protocol

### Status Updates:
- Each agent provides status at task completion
- Blockers are reported immediately
- Integration issues are escalated to project-architect

### Code Reviews:
- mcp-node-engineer reviews all MCP-related code
- software-engineer reviews all utility code
- drought-data-interpreter reviews risk calculations

### Integration Points:
- Phase transitions require project-architect approval
- Integration testing requires all module owners present
- Schema changes require consensus

---

## Next Steps

**Immediate Actions**:
1. Begin Phase 1, Task 1.1: Create src/index.js (mcp-node-engineer)
2. Begin Phase 1, Task 1.2: Create src/config.js (software-engineer)
3. Begin Phase 1, Task 1.3: Create src/logger.js (software-engineer)

**Coordination**:
- This document serves as the master plan
- Update STATUS.md after each phase completion
- All agents reference this document for task details

**Ready to Start**: Phase 1 can begin immediately

---

## Appendix: Key File Locations

### Source Files (src/):
```
src/
├── index.js                    # MCP server entry point
├── config.js                   # Configuration loader
├── logger.js                   # Logging infrastructure
├── api/
│   ├── base-client.js         # Base HTTP client
│   ├── usdm-client.js         # USDM GeoJSON client
│   ├── ndmc-client.js         # NDMC API client
│   ├── cache.js               # API response cache
│   └── rate-limiter.js        # Rate limiting
├── geojson/
│   ├── downloader.js          # GeoJSON fetcher
│   ├── cache.js               # GeoJSON cache
│   └── processor.js           # Point-in-polygon queries
├── location/
│   ├── geocoder.js            # Location geocoding
│   └── resolver.js            # Location resolution
├── schemas/
│   ├── drought-schema.js      # Drought data schemas
│   ├── wildfire-schema.js     # Wildfire template schemas
│   └── transformer.js         # Data transformation
├── tools/
│   ├── index.js               # Tool registry
│   ├── health.js              # Health check tool
│   ├── get-current.js         # get_drought_current
│   ├── get-by-area.js         # get_drought_by_area
│   ├── get-historical.js      # get_drought_historical
│   └── get-statistics.js      # get_drought_statistics
└── utils/
    ├── fips.js                # FIPS code utilities
    ├── risk-calculator.js     # Drought risk calculations
    └── validators.js          # Input validators
```

### Test Files (tests/):
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

---

**Document Status**: ACTIVE - Ready for Phase 1 implementation
**Last Updated**: 2025-10-15
**Next Review**: After Phase 1 completion
