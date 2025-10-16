# Developer Guide

This guide provides comprehensive information for developers working on the drought-mcp server.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Implementation Guidelines](#implementation-guidelines)
5. [Testing Strategy](#testing-strategy)
6. [Code Style and Conventions](#code-style-and-conventions)
7. [API Client Implementation](#api-client-implementation)
8. [Debugging Tips](#debugging-tips)
9. [Performance Considerations](#performance-considerations)
10. [Deployment](#deployment)

## Architecture Overview

The drought-mcp server follows a modular architecture designed for maintainability, testability, and extensibility.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude / MCP Client                     │
│                   (Claude Desktop, etc.)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol (stdio)
┌─────────────────────▼───────────────────────────────────────┐
│                    Drought MCP Server                        │
│                      (Node.js Process)                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              MCP Server Core                          │  │
│  │         (@modelcontextprotocol/sdk)                   │  │
│  └─────────────────────┬─────────────────────────────────┘  │
│                        │                                     │
│  ┌─────────────────────▼─────────────────────────────────┐  │
│  │              Tool Registry                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Current  │  │ By Area  │  │Historical│  ┌─────┐  │  │
│  │  │ Drought  │  │ Drought  │  │ Drought  │  │Stats│  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬──┘  │  │
│  └───────┼─────────────┼─────────────┼───────────┼─────┘  │
│          │             │             │           │         │
│  ┌───────▼─────────────▼─────────────▼───────────▼─────┐  │
│  │           Business Logic Layer                       │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │  │   Schema     │  │  GeoJSON    │  │  Location  │  │  │
│  │  │ Transformer  │  │  Processor  │  │  Resolver  │  │  │
│  │  └──────────────┘  └─────────────┘  └────────────┘  │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │            API Client Manager                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │  │
│  │  │   USDM     │  │   NDMC     │  │   Geocoder   │   │  │
│  │  │  GeoJSON   │  │  API       │  │  (Nominatim) │   │  │
│  │  │  Client    │  │  Client    │  │              │   │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘   │  │
│  └─────────┼────────────────┼────────────────┼──────────┘  │
│            │                │                │              │
│  ┌─────────▼────────────────▼────────────────▼──────────┐  │
│  │              Cache Layer (In-Memory)                 │  │
│  │  - Current GeoJSON (24h TTL)                         │  │
│  │  - Historical GeoJSON (permanent)                    │  │
│  │  - Geocoding results (7 days)                        │  │
│  │  - API responses (24h)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Logging & Monitoring (Winston)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│              External Data Sources                           │
│  ┌────────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ US Drought     │  │ NDMC Data  │  │ OpenStreetMap    │  │
│  │ Monitor        │  │ Services   │  │ Nominatim        │  │
│  │ GeoJSON Files  │  │ REST API   │  │ Geocoding API    │  │
│  └────────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. MCP Server Core (`src/index.js`)
- Entry point for the MCP server
- Handles MCP protocol communication via stdio
- Registers and manages MCP tools
- Provides server lifecycle management

#### 2. Tool Handlers (`src/tools/`)
- Implements the four core MCP tools
- Validates input parameters using Zod schemas
- Orchestrates calls to business logic layer
- Formats responses according to MCP specifications

#### 3. Business Logic Layer
- **Schema Transformer** (`src/schemas/transformer.js`): Converts USDM data to wildfire_prompt_template.json format
- **GeoJSON Processor** (`src/geojson/processor.js`): Point-in-polygon queries using Turf.js
- **Location Resolver** (`src/location/resolver.js`): Resolves location names, coordinates, and FIPS codes

#### 4. API Clients (`src/api/`)
- **Base Client**: Reusable HTTP client with retry logic and error handling
- **USDM Client**: Fetches GeoJSON drought maps
- **NDMC Client**: Retrieves statistics from NDMC Data Services API
- **Cache Manager**: In-memory caching with configurable TTLs

#### 5. Utilities (`src/utils/`)
- **FIPS Utilities**: County and state FIPS code lookups
- **Risk Calculator**: Maps drought severity to wildfire risk points
- **Validators**: Schema validation helpers

## Project Structure

```
drought-mcp/
├── src/                          # Source code
│   ├── index.js                  # MCP server entry point
│   ├── config.js                 # Configuration loader (env vars)
│   ├── logger.js                 # Winston logging setup
│   │
│   ├── tools/                    # MCP tool implementations
│   │   ├── index.js              # Tool registry
│   │   ├── get-current.js        # get_drought_current
│   │   ├── get-by-area.js        # get_drought_by_area
│   │   ├── get-historical.js     # get_drought_historical
│   │   └── get-statistics.js     # get_drought_statistics
│   │
│   ├── api/                      # External API clients
│   │   ├── base-client.js        # HTTP client with retries
│   │   ├── usdm-client.js        # USDM GeoJSON fetcher
│   │   ├── ndmc-client.js        # NDMC API client
│   │   └── cache.js              # Cache management
│   │
│   ├── geojson/                  # GeoJSON processing
│   │   ├── downloader.js         # Download USDM GeoJSON
│   │   ├── processor.js          # Point-in-polygon queries
│   │   └── cache.js              # GeoJSON-specific cache
│   │
│   ├── location/                 # Location resolution
│   │   ├── geocoder.js           # Location name → coordinates
│   │   └── resolver.js           # Unified location lookup
│   │
│   ├── schemas/                  # Data schemas
│   │   ├── wildfire-schema.js    # Wildfire template schema
│   │   ├── drought-schema.js     # Drought data schema
│   │   └── transformer.js        # USDM → wildfire format
│   │
│   └── utils/                    # Helper functions
│       ├── fips.js               # FIPS code utilities
│       ├── risk-calculator.js    # Drought → risk points
│       └── validators.js         # Zod validators
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   │   ├── api-clients.test.js
│   │   ├── geojson.test.js
│   │   ├── transformers.test.js
│   │   └── tools.test.js
│   ├── integration/              # Integration tests
│   │   └── mcp-tools.test.js
│   ├── fixtures/                 # Test data
│   │   ├── sample-geojson.json
│   │   └── sample-responses.json
│   └── mocks/                    # Mock implementations
│       └── api-mocks.js
│
├── docs/                         # Documentation
│   ├── DEVELOPER.md              # This file
│   ├── USER_GUIDE.md             # User documentation
│   ├── EXAMPLES.md               # Usage examples
│   ├── CONTRIBUTING.md           # Contribution guide
│   ├── implementation_plan.md    # Development roadmap
│   └── api_endpoints.md          # API reference
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore patterns
├── package.json                  # Dependencies and scripts
├── CLAUDE.md                     # AI assistant guidance
├── README.md                     # Project overview
└── LICENSE                       # Apache 2.0 license
```

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git
- Text editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tyson-swetnam/drought-mcp.git
   cd drought-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env if you need custom configuration
   ```

4. **Verify installation**:
   ```bash
   npm run lint
   ```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**:
   ```bash
   # Run tests
   npm test

   # Run with watch mode during development
   npm run dev

   # Check code style
   npm run lint
   ```

3. **Run tests with coverage**:
   ```bash
   npm run test:coverage
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Running the MCP Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

**Register with Claude Desktop**:

Edit your Claude Desktop configuration:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drought": {
      "command": "node",
      "args": ["/absolute/path/to/drought-mcp/src/index.js"]
    }
  }
}
```

## Implementation Guidelines

### GeoJSON Processing

USDM GeoJSON files have overlapping features (a D4 area is also contained in D3, D2, D1, D0 polygons). Always use the **maximum DM value** when a point falls in multiple polygons.

**Implementation Pattern**:
```javascript
import * as turf from '@turf/turf';

/**
 * Get drought severity for a point location
 * @param {number[]} coordinates - [longitude, latitude]
 * @param {Object} geoJSON - USDM GeoJSON FeatureCollection
 * @returns {string|null} Drought severity (D0-D4) or null
 */
function getDroughtSeverity(coordinates, geoJSON) {
  const point = turf.point(coordinates);
  let maxSeverity = null;

  for (const feature of geoJSON.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      const dm = feature.properties.DM;
      if (maxSeverity === null || dm > maxSeverity) {
        maxSeverity = dm;
      }
    }
  }

  return maxSeverity !== null ? `D${maxSeverity}` : null;
}
```

**Performance Optimization**:
- Sort features by DM in descending order (check D4 first)
- Use spatial indexing for large datasets (R-tree)
- Cache parsed GeoJSON objects

### Location Resolution

Support three input methods:

1. **Location name** (e.g., "Boulder County, CO")
2. **Coordinates** (latitude/longitude)
3. **State/County** (e.g., state="CO", county="Boulder")

**Implementation Pattern**:
```javascript
async function resolveLocation(params) {
  // Priority 1: Use coordinates if provided
  if (params.latitude && params.longitude) {
    return {
      type: 'coordinates',
      lat: params.latitude,
      lon: params.longitude
    };
  }

  // Priority 2: Use state/county FIPS lookup
  if (params.state && params.county) {
    const fips = await getFipsCode(params.state, params.county);
    const coords = await getCountyCentroid(fips);
    return {
      type: 'fips',
      lat: coords.lat,
      lon: coords.lon,
      fips
    };
  }

  // Priority 3: Geocode location name
  if (params.location) {
    const result = await geocodeLocation(params.location);
    return {
      type: 'geocoded',
      lat: result.lat,
      lon: result.lon,
      displayName: result.display_name
    };
  }

  throw new Error('No valid location parameter provided');
}
```

### Caching Strategy

Different data types require different cache TTLs:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Current week GeoJSON | 24 hours | USDM updates weekly (Thursday) |
| Historical GeoJSON | Permanent | Historical data never changes |
| API statistics | 24 hours | Same update schedule as GeoJSON |
| Geocoding results | 7 days | Location coordinates rarely change |

**Implementation Pattern**:
```javascript
// src/api/cache.js
export class Cache {
  constructor() {
    this.store = new Map();
  }

  get(key, ttl = 86400000) { // Default: 24 hours
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key, data) {
    this.store.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

// Usage
const cache = new Cache();

// Cache current GeoJSON (24 hour TTL)
cache.set('geojson:current', geoJSON);
const data = cache.get('geojson:current', 24 * 60 * 60 * 1000);

// Cache historical GeoJSON (permanent - use very long TTL)
cache.set('geojson:20250829', historicalData);
const historical = cache.get('geojson:20250829', Infinity);
```

### Schema Transformation

Transform USDM data to conform to `wildfire_prompt_template.json` schema:

**Drought Severity Mapping**:
```javascript
const DROUGHT_SEVERITY_MAP = {
  'D0': {
    severity_level: 1,
    severity_name: 'Abnormally Dry',
    description: 'Going into drought or coming out of drought. Short-term dryness slowing growth.',
    risk_points: 10
  },
  'D1': {
    severity_level: 2,
    severity_name: 'Moderate Drought',
    description: 'Some damage to crops and pastures. Streams and wells low.',
    risk_points: 20
  },
  'D2': {
    severity_level: 3,
    severity_name: 'Severe Drought',
    description: 'Crop losses likely. Water shortages common. Water restrictions imposed.',
    risk_points: 30
  },
  'D3': {
    severity_level: 4,
    severity_name: 'Extreme Drought',
    description: 'Major crop/pasture losses. Widespread water shortages. Increased wildfire danger.',
    risk_points: 40
  },
  'D4': {
    severity_level: 5,
    severity_name: 'Exceptional Drought',
    description: 'Exceptional crop/pasture losses. Water emergencies. Extreme wildfire danger.',
    risk_points: 50
  }
};

function transformToWildfireSchema(droughtData, location) {
  const severity = DROUGHT_SEVERITY_MAP[droughtData.severity] || {
    severity_level: 0,
    severity_name: 'No Drought',
    description: 'No drought conditions present.',
    risk_points: 0
  };

  return {
    location: location.displayName || `${location.lat}, ${location.lon}`,
    as_of: droughtData.date,
    drought_conditions: {
      severity: droughtData.severity,
      severity_name: severity.severity_name,
      severity_level: severity.severity_level,
      area_percent: droughtData.areaPercent,
      description: severity.description
    },
    risk_assessment: {
      overall_risk: getRiskLevel(severity.risk_points),
      drought_contribution: severity.risk_points,
      notes: generateRiskNotes(droughtData.severity)
    },
    data_sources: [
      {
        name: 'US Drought Monitor',
        type: 'drought',
        url: 'https://droughtmonitor.unl.edu/'
      }
    ],
    notes: `Data updated weekly on Thursdays. Current data reflects week ending ${droughtData.validEnd}.`
  };
}

function getRiskLevel(points) {
  if (points >= 40) return 'Extreme';
  if (points >= 30) return 'High';
  if (points >= 20) return 'Moderate';
  if (points >= 10) return 'Low';
  return 'Minimal';
}
```

### Error Handling

Implement robust error handling at every layer:

**1. API Client Errors**:
```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
        ...options
      });
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new NotFoundError(`Resource not found: ${url}`);
      }

      if (error.response?.status >= 500 && attempt < maxRetries - 1) {
        // Server error - retry with exponential backoff
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      if (error.code === 'ECONNABORTED') {
        throw new TimeoutError(`Request timeout: ${url}`);
      }

      throw error;
    }
  }
}
```

**2. Location Resolution Errors**:
```javascript
async function resolveLocation(params) {
  try {
    // ... location resolution logic
  } catch (error) {
    if (error instanceof GeocodeError) {
      throw new Error(`Unable to geocode location: ${params.location}. Please provide coordinates instead.`);
    }
    if (error instanceof FipsNotFoundError) {
      throw new Error(`County not found: ${params.county}, ${params.state}`);
    }
    throw error;
  }
}
```

**3. GeoJSON Processing Errors**:
```javascript
function getDroughtSeverity(coordinates, geoJSON) {
  try {
    // Validate coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new ValidationError('Coordinates must be [longitude, latitude]');
    }

    const [lon, lat] = coordinates;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      throw new ValidationError('Coordinates out of valid range');
    }

    // Check if location is in US
    if (!isInUnitedStates([lon, lat])) {
      return null; // Outside US - no drought data
    }

    // ... point-in-polygon logic
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ProcessingError(`Failed to process GeoJSON: ${error.message}`);
  }
}
```

### Data Freshness

USDM releases data every Thursday ~8:30 AM ET. Handle data timing correctly:

```javascript
/**
 * Get the date of the most recent USDM release
 * @returns {string} Date in YYYYMMDD format
 */
function getCurrentUSDMDate() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sunday, 4=Thursday
  const hourUTC = now.getUTCHours();

  // Find most recent Thursday
  let daysBack = (dayOfWeek + 7 - 4) % 7;

  // If it's Thursday but before release time (8:30 AM ET = 12:30 PM UTC)
  if (daysBack === 0 && hourUTC < 13) {
    daysBack = 7; // Use last week's data
  }

  const thursday = new Date(now);
  thursday.setUTCDate(thursday.getUTCDate() - daysBack);

  const year = thursday.getUTCFullYear();
  const month = String(thursday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(thursday.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}
```

## Testing Strategy

### Unit Tests

Test individual functions and modules in isolation:

```javascript
// tests/unit/geojson-processor.test.js
import { describe, test, expect } from '@jest/globals';
import { getDroughtSeverity } from '../../src/geojson/processor.js';
import sampleGeoJSON from '../fixtures/sample-geojson.json';

describe('GeoJSON Processor', () => {
  test('should return correct drought severity for point', () => {
    const coordinates = [-105.2705, 40.0150]; // Boulder, CO
    const severity = getDroughtSeverity(coordinates, sampleGeoJSON);
    expect(severity).toBe('D2');
  });

  test('should return null for point with no drought', () => {
    const coordinates = [-122.3321, 47.6062]; // Seattle, WA
    const severity = getDroughtSeverity(coordinates, sampleGeoJSON);
    expect(severity).toBeNull();
  });

  test('should handle overlapping polygons correctly', () => {
    // Point that falls in D2, D1, and D0 polygons
    const coordinates = [-105.0, 40.0];
    const severity = getDroughtSeverity(coordinates, sampleGeoJSON);
    expect(severity).toBe('D2'); // Should return highest severity
  });
});
```

### Integration Tests

Test complete MCP tool flows:

```javascript
// tests/integration/mcp-tools.test.js
import { describe, test, expect, beforeAll } from '@jest/globals';
import { DroughtMCPServer } from '../../src/index.js';

describe('MCP Tools Integration', () => {
  let server;

  beforeAll(() => {
    server = new DroughtMCPServer();
  });

  test('get_drought_current should return valid response', async () => {
    const result = await server.callTool('get_drought_current', {
      latitude: 40.0150,
      longitude: -105.2705,
      format: 'wildfire_schema'
    });

    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('drought_conditions');
    expect(result.drought_conditions).toHaveProperty('severity');
    expect(result.drought_conditions.severity).toMatch(/^D[0-4]$/);
  });
});
```

### Test Coverage Goals

- **Overall**: > 80%
- **Critical paths** (API clients, GeoJSON processing): > 90%
- **Utilities**: > 85%

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode
npm test -- --watch

# Specific test file
npm test -- tests/unit/geojson-processor.test.js
```

## Code Style and Conventions

### JavaScript Style

- Use ESM imports/exports (not CommonJS require)
- Use `const` by default, `let` when necessary, never `var`
- Prefer arrow functions for callbacks
- Use async/await over promises where possible
- Use template literals for string interpolation

### Naming Conventions

- **Files**: kebab-case (e.g., `geojson-processor.js`)
- **Classes**: PascalCase (e.g., `class DroughtProcessor`)
- **Functions**: camelCase (e.g., `function getDroughtSeverity()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `const MAX_RETRIES = 3`)
- **Private variables**: Prefix with underscore (e.g., `_cache`)

### JSDoc Comments

Document all public functions:

```javascript
/**
 * Get current drought severity for a location
 * @param {Object} params - Location parameters
 * @param {string} [params.location] - Location name
 * @param {number} [params.latitude] - Latitude
 * @param {number} [params.longitude] - Longitude
 * @param {string} [params.format='wildfire_schema'] - Output format
 * @returns {Promise<Object>} Drought data in specified format
 * @throws {ValidationError} If parameters are invalid
 * @throws {NotFoundError} If location cannot be resolved
 */
async function getCurrentDrought(params) {
  // Implementation
}
```

### Error Handling Pattern

Create custom error classes:

```javascript
// src/utils/errors.js
export class DroughtMCPError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DroughtMCPError {}
export class NotFoundError extends DroughtMCPError {}
export class APIError extends DroughtMCPError {}
export class ProcessingError extends DroughtMCPError {}
```

## API Client Implementation

### Base HTTP Client

Create a reusable base client with retry logic:

```javascript
// src/api/base-client.js
import axios from 'axios';
import { logger } from '../logger.js';

export class BaseClient {
  constructor(baseURL, options = {}) {
    this.client = axios.create({
      baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'User-Agent': 'DroughtMCP/1.0',
        ...options.headers
      }
    });
  }

  async get(url, options = {}) {
    const maxRetries = options.maxRetries || 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.debug(`GET ${url} (attempt ${attempt + 1}/${maxRetries})`);
        const response = await this.client.get(url, options);
        return response.data;
      } catch (error) {
        const shouldRetry = this._shouldRetry(error, attempt, maxRetries);

        if (!shouldRetry) {
          throw this._handleError(error);
        }

        await this._backoff(attempt);
      }
    }
  }

  _shouldRetry(error, attempt, maxRetries) {
    if (attempt >= maxRetries - 1) return false;
    if (error.response?.status >= 500) return true;
    if (error.code === 'ECONNRESET') return true;
    return false;
  }

  _backoff(attempt) {
    const delay = Math.pow(2, attempt) * 1000;
    logger.debug(`Backing off for ${delay}ms`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      throw new APIError(`HTTP ${status}: ${data?.message || 'Unknown error'}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError('Request timeout');
    }
    throw error;
  }
}
```

## Debugging Tips

### Enable Debug Logging

Set `LOG_LEVEL=debug` in `.env`:

```bash
LOG_LEVEL=debug npm run dev
```

### MCP Protocol Debugging

Use the MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector node src/index.js
```

### Common Issues

**1. GeoJSON not loading**:
- Check network connectivity
- Verify URL is correct
- Check cache expiration
- Increase timeout in axios config

**2. Location not found**:
- Verify spelling of location name
- Try using lat/lon instead
- Check geocoding service is available
- Verify coordinates are in valid range

**3. Tool not responding**:
- Check server logs for errors
- Verify tool is registered correctly
- Check parameter validation
- Test with MCP Inspector

### Logging Best Practices

```javascript
import { logger } from './logger.js';

// Use appropriate log levels
logger.error('Critical error', { error: err.message, stack: err.stack });
logger.warn('Potential issue', { issue: 'stale cache' });
logger.info('Operation completed', { operation: 'fetch', duration: 120 });
logger.debug('Detailed info', { coordinates: [lon, lat], severity: 'D2' });
```

## Performance Considerations

### GeoJSON Processing Optimization

1. **Spatial Indexing**: Use R-tree for faster point-in-polygon queries
2. **Feature Sorting**: Sort features by DM descending, check highest severity first
3. **Polygon Simplification**: Reduce polygon complexity for faster processing

### Caching Strategy

1. **Aggressive Caching**: Drought data changes weekly - cache liberally
2. **Memory Management**: Clear old cache entries periodically
3. **Preloading**: Fetch and cache current week data on server startup

### API Request Optimization

1. **Batch Requests**: Combine multiple queries when possible
2. **Conditional Requests**: Use ETag headers to avoid re-downloading unchanged data
3. **Compression**: Request gzip-compressed responses

## Deployment

### Environment Variables

Production configuration:

```bash
# .env.production
LOG_LEVEL=info
CACHE_TTL_SECONDS=86400
USDM_DATA_FORMAT=json
ENABLE_HISTORICAL_ANALYSIS=true
```

### Health Monitoring

Implement health check endpoint:

```javascript
server.addTool({
  name: 'health',
  description: 'Health check for MCP server',
  inputSchema: z.object({}),
  handler: async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache_size: cache.size(),
      uptime: process.uptime()
    };
  }
});
```

### Production Deployment

1. **Process Management**: Use PM2 or systemd
2. **Logging**: Rotate logs with Winston transports
3. **Monitoring**: Track error rates and response times
4. **Backup**: Maintain fallback data sources

## Additional Resources

- [MCP SDK Documentation](https://github.com/anthropics/model-context-protocol)
- [Turf.js API Reference](https://turfjs.org/docs/)
- [US Drought Monitor Data Services](https://droughtmonitor.unl.edu/)
- [Implementation Plan](implementation_plan.md)
- [API Endpoints Documentation](api_endpoints.md)

## Getting Help

- Review [examples](EXAMPLES.md) for common use cases
- Check [user guide](USER_GUIDE.md) for general usage
- Open an issue on GitHub for bugs
- Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for contribution process
