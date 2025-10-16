# US Drought Monitor Data Source API Documentation

> **Status:** This document describes the external APIs that will be integrated. Implementation is in progress.

This document provides detailed information about the external APIs used by the Drought MCP server to fetch drought severity data.

## Table of Contents

1. [US Drought Monitor GeoJSON Data](#us-drought-monitor-geojson-data)
2. [NDMC Data Services API](#ndmc-data-services-api)
3. [Geocoding Services](#geocoding-services)
4. [Data Update Schedule](#data-update-schedule)
5. [Best Practices](#best-practices)

## US Drought Monitor GeoJSON Data

**Provider**: National Drought Mitigation Center (NDMC)

**Website**: https://droughtmonitor.unl.edu/

**Data Format**: GeoJSON

**Authentication**: None required (public data)

**Update Frequency**: Weekly (Thursdays ~8:30 AM ET)

### Endpoints

#### 1. Current Week Drought Data

Get the most recent drought map as GeoJSON.

**Endpoint**: `GET https://droughtmonitor.unl.edu/data/json/usdm_current.json`

**Response Format**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "DM": 2,
        "OBJECTID": 1234,
        "Shape_Area": 0.0567,
        "Shape_Length": 2.345
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [-105.5, 40.0],
              [-105.0, 40.0],
              [-105.0, 40.5],
              [-105.5, 40.5],
              [-105.5, 40.0]
            ]
          ]
        ]
      }
    }
  ]
}
```

**Drought Magnitude (DM) Values**:
- `0` = D0 (Abnormally Dry)
- `1` = D1 (Moderate Drought)
- `2` = D2 (Severe Drought)
- `3` = D3 (Extreme Drought)
- `4` = D4 (Exceptional Drought)

**Notes**:
- File size: ~5-15 MB depending on drought extent
- Features overlap (D4 areas are also in D3, D2, D1, D0 layers)
- Use highest DM value when point falls in multiple polygons

#### 2. Historical Drought Data

Get drought map for a specific week.

**Endpoint**: `GET https://droughtmonitor.unl.edu/data/json/usdm_YYYYMMDD.json`

**Date Format**: YYYYMMDD (e.g., `20250826` for August 26, 2025)

**Example**:
```
https://droughtmonitor.unl.edu/data/json/usdm_20250826.json
```

**Available Range**: January 4, 2000 to present

**Response**: Same format as current week data

**Note**: Dates correspond to Tuesday release dates (data is for the week ending on that Tuesday)

#### 3. Shapefile Data (Alternative Format)

**Endpoint**: `https://droughtmonitor.unl.edu/data/shapefiles_m/USDM_YYYYMMDD_M.zip`

**Format**: Zipped Shapefile

**Use Case**: When GeoJSON is too large or for GIS software integration

### GeoJSON Processing Strategy

**Point-in-Polygon Lookup**:
```javascript
import * as turf from '@turf/turf';

function getDroughtSeverity(point, geoJSON) {
  let maxSeverity = null;

  for (const feature of geoJSON.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      const severity = feature.properties.DM;
      if (maxSeverity === null || severity > maxSeverity) {
        maxSeverity = severity;
      }
    }
  }

  return maxSeverity !== null ? `D${maxSeverity}` : 'None';
}

// Usage
const point = turf.point([-105.2705, 40.0150]); // Boulder, CO
const severity = getDroughtSeverity(point, usdmGeoJSON);
// Returns: "D2" (Severe Drought)
```

**Caching Strategy**:
- Cache current week GeoJSON for 24 hours
- Cache historical GeoJSON indefinitely (doesn't change)
- Store in memory or Redis
- Cache key: `usdm:geojson:{YYYYMMDD}`

## NDMC Data Services API

**Base URL**: `https://usdmdataservices.unl.edu/api/`

**Documentation**: https://usdmdataservices.unl.edu/

**Authentication**: None required

**Rate Limit**: Unspecified (be respectful)

### Endpoints

#### 1. State Drought Statistics

Get drought statistics for a state.

**Endpoint**: `GET /StateStatistics/GetDroughtSeverityStatisticsByAreaPercent`

**Parameters**:
- `aoi` (required): State abbreviation (e.g., "CO")
- `startdate` (required): Start date (MM/DD/YYYY)
- `enddate` (required): End date (MM/DD/YYYY)
- `statisticsType` (optional): "1" for categorical percentages

**Example Request**:
```
https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=CO&startdate=08/29/2025&enddate=08/29/2025&statisticsType=1
```

**Example Response**:
```json
[
  {
    "MapDate": "2025-08-29T00:00:00",
    "StateAbbreviation": "CO",
    "StatisticFormatID": 1,
    "D0": 35.21,
    "D1": 28.15,
    "D2": 18.47,
    "D3": 12.23,
    "D4": 0.00,
    "ValidStart": "2025-08-22T00:00:00",
    "ValidEnd": "2025-08-28T23:59:59"
  }
]
```

**Field Descriptions**:
- `D0` through `D4`: Percentage of state area in each drought category
- `MapDate`: Tuesday release date
- `ValidStart`/`ValidEnd`: Week covered by this data

#### 2. County Drought Statistics

Get drought statistics for counties.

**Endpoint**: `GET /CountyStatistics/GetDSCI`

**Parameters**:
- `aoi` (required): State abbreviation or "US"
- `startdate` (required): Start date (MM/DD/YYYY)
- `enddate` (required): End date (MM/DD/YYYY)

**Example Request**:
```
https://usdmdataservices.unl.edu/api/CountyStatistics/GetDSCI?aoi=CO&startdate=08/29/2025&enddate=08/29/2025
```

**Example Response**:
```json
[
  {
    "County": "Boulder",
    "FIPS": "08013",
    "State": "CO",
    "MapDate": "2025-08-29T00:00:00",
    "None": 15.23,
    "D0": 22.45,
    "D1": 18.76,
    "D2": 28.92,
    "D3": 14.64,
    "D4": 0.00,
    "DSCI": 245
  }
]
```

**Field Descriptions**:
- `None`: Percentage not in drought
- `D0`-`D4`: Percentage in each drought category
- `DSCI`: Drought Severity and Coverage Index (0-500)
- `FIPS`: County FIPS code

**DSCI Calculation**:
```
DSCI = (D0 * 1) + (D1 * 2) + (D2 * 3) + (D3 * 4) + (D4 * 5)
```

#### 3. Time Series Statistics

Get historical trends for an area.

**Endpoint**: `GET /TimeSeriesStatistics/GetDroughtSeverityStatisticsByArea`

**Parameters**:
- `aoi` (required): State abbreviation
- `startdate` (required): Start date (MM/DD/YYYY)
- `enddate` (required): End date (MM/DD/YYYY)
- `statisticsType` (optional): "1" for area percentages

**Example Request**:
```
https://usdmdataservices.unl.edu/api/TimeSeriesStatistics/GetDroughtSeverityStatisticsByArea?aoi=CO&startdate=01/01/2025&enddate=08/29/2025&statisticsType=1
```

**Example Response**:
```json
[
  {
    "MapDate": "2025-01-07T00:00:00",
    "D0": 25.3,
    "D1": 15.2,
    "D2": 8.1,
    "D3": 2.3,
    "D4": 0.0
  },
  {
    "MapDate": "2025-01-14T00:00:00",
    "D0": 28.7,
    "D1": 18.9,
    "D2": 10.5,
    "D3": 3.1,
    "D4": 0.0
  }
  // ... weekly data points
]
```

## Geocoding Services

For converting location names to coordinates (when user provides "Boulder, CO" instead of lat/lon).

### Option 1: Nominatim (OpenStreetMap)

**Base URL**: `https://nominatim.openstreetmap.org/`

**Endpoint**: `GET /search`

**Parameters**:
- `q`: Query string (e.g., "Boulder County, Colorado")
- `format`: "json"
- `limit`: Number of results (default: 1)
- `countrycodes`: "us" to limit to United States

**Example Request**:
```
https://nominatim.openstreetmap.org/search?q=Boulder+County,+Colorado&format=json&limit=1&countrycodes=us
```

**Example Response**:
```json
[
  {
    "place_id": 123456,
    "lat": "40.0437238",
    "lon": "-105.3544063",
    "display_name": "Boulder County, Colorado, United States",
    "type": "administrative",
    "importance": 0.6
  }
]
```

**Rate Limit**: 1 request per second (add User-Agent header)

**Required Header**:
```javascript
headers: {
  'User-Agent': 'DroughtMCP/1.0 (contact@example.com)'
}
```

### Option 2: Census Geocoder (US Only)

**Base URL**: `https://geocoding.geo.census.gov/geocoder/`

**Endpoint**: `GET /locations/onelineaddress`

**Parameters**:
- `address`: Location string
- `benchmark`: "Public_AR_Current"
- `format`: "json"

**Example Request**:
```
https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=Boulder,CO&benchmark=Public_AR_Current&format=json
```

**Advantage**: No rate limit, official US government data

## Data Update Schedule

### US Drought Monitor Release Schedule

**Release Day**: Every Thursday

**Release Time**: ~8:30 AM Eastern Time

**Data Period**: Week ending the previous Tuesday

**Example**:
- Thursday, August 29, 2025 release
- Covers: August 22-28, 2025
- File name: `usdm_20250829.json` (Thursday's date)

### Weekly Data Workflow

```javascript
// Check if new data is available
function isNewDataDay() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 4=Thursday
  const hour = now.getHours();

  // Thursday after 9 AM ET (account for timezones)
  return dayOfWeek === 4 && hour >= 12; // 12 PM ET = 9 AM PT
}

// Get expected date for current week's data
function getCurrentDataDate() {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Find most recent Thursday
  let daysBack = (dayOfWeek + 7 - 4) % 7;
  if (daysBack === 0 && now.getHours() < 12) {
    daysBack = 7; // If before release time, use last week
  }

  const thursday = new Date(now);
  thursday.setDate(thursday.getDate() - daysBack);

  return thursday.toISOString().split('T')[0].replace(/-/g, '');
}
```

## Best Practices

### Caching

**Cache TTLs**:
- Current week GeoJSON: 24 hours
- Historical GeoJSON: Forever (doesn't change)
- API statistics: 24 hours
- Geocoding results: 7 days

**Cache Implementation**:
```javascript
// src/api/cache.js
const cache = new Map();

export function getCached(key, ttl = 86400000) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}
```

### Error Handling

**Common Errors**:

1. **404 Not Found**: Historical date doesn't exist
   ```javascript
   // GeoJSON for future dates doesn't exist
   if (response.status === 404) {
     throw new Error(`No drought data available for ${date}`);
   }
   ```

2. **500 Server Error**: USDM server issues
   ```javascript
   // Retry with exponential backoff
   for (let i = 0; i < 3; i++) {
     try {
       return await fetchData();
     } catch (err) {
       await sleep(Math.pow(2, i) * 1000);
     }
   }
   ```

3. **Timeout**: Large GeoJSON files
   ```javascript
   // Increase timeout for GeoJSON
   const response = await axios.get(url, { timeout: 30000 });
   ```

### Rate Limiting

**Best Practices**:
- Cache aggressively (drought data changes weekly)
- Batch requests when possible
- Add delays between requests to same endpoint
- Use User-Agent header to identify your application

**Example Rate Limiter**:
```javascript
class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.delay = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async waitIfNeeded() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.delay) {
      await sleep(this.delay - timeSinceLastRequest);
    }
    this.lastRequest = Date.now();
  }
}

const limiter = new RateLimiter(1); // 1 request per second
await limiter.waitIfNeeded();
const data = await fetchData();
```

### GeoJSON Optimization

**Large File Handling**:
1. **Stream Processing**: Don't load entire file into memory
2. **Spatial Indexing**: Use R-tree for faster lookups
3. **Simplification**: Reduce polygon complexity for visualization
4. **Compression**: gzip GeoJSON before caching

**Example: Streaming GeoJSON**:
```javascript
import { pipeline } from 'stream';
import { createGunzip } from 'zlib';
import JSONStream from 'JSONStream';

async function streamGeoJSON(url) {
  const response = await axios.get(url, {
    responseType: 'stream',
    headers: { 'Accept-Encoding': 'gzip' }
  });

  return new Promise((resolve, reject) => {
    const features = [];
    pipeline(
      response.data,
      createGunzip(),
      JSONStream.parse('features.*'),
      (feature) => {
        features.push(feature);
      },
      (err) => {
        if (err) reject(err);
        else resolve({ type: 'FeatureCollection', features });
      }
    );
  });
}
```

## Testing with Sample Data

### Test Locations

**Different Drought Severities**:
| Location | Coordinates | Typical Severity | Use Case |
|----------|-------------|------------------|----------|
| Phoenix, AZ | 33.45°N, 112.07°W | D2-D4 | Severe drought testing |
| Boulder, CO | 40.01°N, 105.27°W | D0-D2 | Moderate drought |
| Seattle, WA | 47.61°N, 122.33°W | None-D0 | No drought |
| California Central Valley | 36.75°N, 119.77°W | D1-D3 | Agricultural drought |

### Sample API Calls

**Test Current Data**:
```bash
# Get current GeoJSON
curl https://droughtmonitor.unl.edu/data/json/usdm_current.json > current.json

# Get state statistics for Colorado
curl "https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=CO&startdate=08/29/2025&enddate=08/29/2025&statisticsType=1"

# Geocode a location
curl "https://nominatim.openstreetmap.org/search?q=Boulder+County,+Colorado&format=json&limit=1"
```

## References

- [US Drought Monitor](https://droughtmonitor.unl.edu/)
- [NDMC Data Services](https://usdmdataservices.unl.edu/)
- [GeoJSON Specification](https://geojson.org/)
- [Turf.js Documentation](https://turfjs.org/)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
- [Census Geocoder](https://geocoding.geo.census.gov/)
