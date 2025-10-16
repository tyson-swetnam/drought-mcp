# User Guide

Welcome to the US Drought Monitor MCP Server user guide. This guide will help you understand, install, and use the drought-mcp server to access current and historical drought data.

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding US Drought Monitor Data](#understanding-us-drought-monitor-data)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Using the MCP Tools](#using-the-mcp-tools)
6. [Understanding the Output](#understanding-the-output)
7. [Use Cases](#use-cases)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)
10. [Data Updates and Freshness](#data-updates-and-freshness)

## Introduction

The US Drought Monitor MCP server provides access to weekly drought assessments across the United States. This data is crucial for:

- **Wildfire Risk Assessment**: Drought conditions significantly increase wildfire danger
- **Agricultural Planning**: Understand water availability for crops and livestock
- **Water Resource Management**: Monitor drought severity for water supply planning
- **Research and Analysis**: Access historical drought trends and patterns

The server integrates with Claude (via Claude Desktop) and other MCP-compatible clients to provide conversational access to drought data.

## Understanding US Drought Monitor Data

### What is the US Drought Monitor?

The US Drought Monitor (USDM) is a weekly map of drought conditions produced collaboratively by:
- National Drought Mitigation Center (NDMC)
- United States Department of Agriculture (USDA)
- National Oceanic and Atmospheric Administration (NOAA)

The USDM is released every Thursday morning and represents drought conditions for the week ending the previous Tuesday.

### Drought Categories

The USDM uses five drought intensity categories:

| Category | Name | Description | Impact |
|----------|------|-------------|--------|
| **D0** | Abnormally Dry | Going into or coming out of drought | Short-term dryness, slowing growth |
| **D1** | Moderate Drought | Some crop/pasture damage | Streams and wells low, water shortages developing |
| **D2** | Severe Drought | Crop/pasture losses likely | Water shortages common, restrictions imposed |
| **D3** | Extreme Drought | Major crop/pasture losses | Widespread water shortages, increased fire risk |
| **D4** | Exceptional Drought | Exceptional losses | Water emergencies, extreme wildfire danger |

### Drought-to-Wildfire Risk Mapping

The drought-mcp server maps drought severity to wildfire risk contributions:

| Drought Level | Wildfire Risk Points | Risk Level |
|--------------|---------------------|------------|
| None | 0 | Minimal |
| D0 | 10 | Low |
| D1 | 20 | Moderate |
| D2 | 30 | High |
| D3 | 40 | Very High |
| D4 | 50 | Extreme |

These points integrate with weather and other factors in the fire-behavior application to calculate overall wildfire risk.

### Key Drought Indicators

The USDM assessment includes:
- Precipitation levels (short-term and long-term)
- Soil moisture content
- Stream flow rates
- Groundwater levels
- Snowpack (in relevant regions)
- Vegetation health (satellite imagery)
- Reported impacts (crops, water supplies, wildfires)

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- Claude Desktop (or another MCP-compatible client)
- Basic familiarity with command line/terminal

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/tyson-swetnam/drought-mcp.git
cd drought-mcp

# Install dependencies
npm install
```

### Step 2: Configure Environment (Optional)

Most users won't need custom configuration, but you can create a `.env` file if needed:

```bash
cp .env.example .env
```

The default settings work for most use cases. See [Configuration](#configuration) for advanced options.

### Step 3: Register with Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**:
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

Add the drought server configuration:

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

**Important**: Replace `/absolute/path/to/drought-mcp` with the actual full path to your drought-mcp directory.

**Example (macOS)**:
```json
{
  "mcpServers": {
    "drought-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/yourname/projects/drought-mcp/src/index.js"
      ],
      "cwd": "/Users/yourname/projects/drought-mcp",
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

**Configuration Notes**:
- `type: "stdio"`: Specifies the communication protocol
- `cwd`: Working directory for the server process
- `env`: Environment variables passed to the server
- `autoApprove`: List of tools that can be executed without manual confirmation
- `timeout`: Maximum execution time (in seconds) for tool calls

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### Verification

Ask Claude: "What MCP servers are available?"

You should see "drought-mcp" listed among the available servers.

## Configuration

### Environment Variables

Create a `.env` file in the project root to customize behavior:

```bash
# Logging level (error, warn, info, debug)
LOG_LEVEL=info

# Cache duration in seconds (default: 86400 = 24 hours)
CACHE_TTL_SECONDS=86400

# Data format preference (json, geojson, csv)
USDM_DATA_FORMAT=json

# Enable historical trend analysis
ENABLE_HISTORICAL_ANALYSIS=true

# Geographic data precision
COORDINATE_PRECISION=4
```

### Configuration Options Explained

**LOG_LEVEL**:
- `error`: Only critical errors
- `warn`: Warnings and errors
- `info`: General information (recommended)
- `debug`: Detailed debugging information

**CACHE_TTL_SECONDS**:
- How long to cache drought data before re-fetching
- Default 24 hours is recommended (USDM updates weekly)

**USDM_DATA_FORMAT**:
- Preferred format for USDM data downloads
- Options: `json`, `geojson`, `csv`
- Default `json` works best for most use cases

## Using the MCP Tools

The drought-mcp server provides four tools for accessing drought data. You can use these tools by asking Claude natural language questions.

### Tool 1: get_drought_current

**Purpose**: Get current drought conditions for a specific location.

**How to Ask Claude**:
- "What are the current drought conditions in Boulder, Colorado?"
- "Show me the drought level at coordinates 40.0°N, 105.2°W"
- "What's the drought severity in San Diego County?"
- "Is there drought in Phoenix right now?"

**What You Can Specify**:
- Location name (e.g., "Boulder County, CO")
- Coordinates (latitude and longitude)
- State and county (e.g., state="CA", county="San Diego")

**Example Interaction**:

**You**: "What's the current drought situation in Boulder, Colorado?"

**Claude** (using get_drought_current):
```
Based on the latest US Drought Monitor data (as of August 29, 2025):

Boulder, Colorado is experiencing **Severe Drought (D2)** conditions:

- Severity Level: D2 (Severe Drought)
- Area Coverage: 85% of the county is affected
- Description: Crop or pasture losses are likely. Water shortages are common,
  and water restrictions have been imposed.

Wildfire Risk Impact:
- Drought contributes +30 points to wildfire risk
- Overall risk level: High
- The severe drought conditions significantly increase wildfire risk due to
  low fuel moisture and stressed vegetation.

This data was last updated: Thursday, August 29, 2025
(Covering the week ending Tuesday, August 27, 2025)
```

### Tool 2: get_drought_by_area

**Purpose**: Get drought statistics for an entire state or region.

**How to Ask Claude**:
- "Show me drought statistics for Colorado"
- "What percentage of California is in drought?"
- "Give me a county breakdown of drought in Arizona"
- "How much of Texas is experiencing severe drought or worse?"

**What You Can Specify**:
- State (required)
- Whether to include county-level breakdown (optional)
- Specific date (optional, defaults to latest)

**Example Interaction**:

**You**: "Show me drought statistics for Colorado with county breakdown"

**Claude** (using get_drought_by_area):
```
Colorado Drought Statistics (as of August 29, 2025):

State Summary:
- Total Area: 104,094 square miles
- Drought-Free: 6.0% (6,246 sq mi)
- D0 (Abnormally Dry): 35.2% (36,640 sq mi)
- D1 (Moderate Drought): 28.1% (29,250 sq mi)
- D2 (Severe Drought): 18.5% (19,257 sq mi)
- D3 (Extreme Drought): 12.2% (12,699 sq mi)
- D4 (Exceptional Drought): 0.0%

Total in Drought (D0+): 94.0%
Total in Severe or Worse (D2+): 30.7%

County Breakdown (top 5 most affected):
1. Yuma County: 100% in D3 (Extreme Drought)
2. Kit Carson County: 98% in D3
3. Prowers County: 95% in D2 (Severe Drought)
4. Boulder County: 85% in D2
5. Weld County: 82% in D2

[Additional counties listed...]
```

### Tool 3: get_drought_historical

**Purpose**: Retrieve historical drought data and identify trends.

**How to Ask Claude**:
- "Show me drought trends in California for the last 6 months"
- "Has the drought in Texas improved over the past year?"
- "What were drought conditions in Boulder from January to August 2025?"
- "Give me monthly drought data for Arizona in 2024"

**What You Can Specify**:
- Location (same options as get_drought_current)
- Start date and end date (required)
- Aggregation level: weekly or monthly (optional)

**Example Interaction**:

**You**: "Has the drought situation in Boulder, Colorado improved over the last 6 months?"

**Claude** (using get_drought_historical):
```
Boulder, Colorado Drought Trends (January - August 2025):

Trend: WORSENING
Severity Change: +2 categories (from D0 to D2)

Timeline:
- January 2025: D0 (Abnormally Dry)
- February 2025: D0 (Abnormally Dry)
- March 2025: D1 (Moderate Drought)
- April 2025: D1 (Moderate Drought)
- May 2025: D1 (Moderate Drought)
- June 2025: D2 (Severe Drought)
- July 2025: D2 (Severe Drought)
- August 2025: D2 (Severe Drought)

Analysis:
Drought conditions have intensified over the 8-month period. The area
transitioned from Abnormally Dry (D0) in January to Severe Drought (D2)
by June, and conditions have remained severe through August. This worsening
trend significantly increases wildfire risk and water resource concerns.
```

### Tool 4: get_drought_statistics

**Purpose**: Get statistical summaries and comparisons to historical averages.

**How to Ask Claude**:
- "How does current California drought compare to last year?"
- "Show me 10-year average drought statistics for the Southwest"
- "Compare current drought in Texas to historical averages"

**What You Can Specify**:
- State or region
- Comparison period: last year, 10-year average, or historical average

**Example Interaction**:

**You**: "How does California's current drought compare to last year?"

**Claude** (using get_drought_statistics):
```
California Drought Comparison

Current (August 29, 2025):
- Total area in drought (D0+): 72.3%
- Severe or worse (D2+): 45.1%

Same Time Last Year (August 29, 2024):
- Total area in drought (D0+): 65.8%
- Severe or worse (D2+): 38.2%

Change:
- +6.5% more area in drought than last year
- +6.9% more area in severe drought or worse

Trend: WORSENING

Analysis:
California's drought has intensified compared to last year. Nearly three-
quarters of the state is now experiencing drought conditions, with nearly
half in severe drought or worse. This represents a significant worsening
trend that has implications for water supply, agriculture, and wildfire risk.
```

## Understanding the Output

### Output Format

The drought-mcp server returns data in a structured format compatible with the wildfire_prompt_template.json schema. Claude will present this information conversationally, but the underlying data includes:

**Key Fields**:
- `location`: Where the data applies
- `as_of`: Date of the drought assessment
- `drought_conditions`: Current drought severity details
- `risk_assessment`: Impact on wildfire risk
- `data_sources`: Where the data came from
- `notes`: Additional context

### Interpreting Drought Severity

**None**: No drought conditions present. Normal precipitation and soil moisture.

**D0 (Abnormally Dry)**:
- First stage of drought or recovery from drought
- Minimal impacts on agriculture
- Some short-term water deficits
- Wildfire risk slightly elevated (+10 points)

**D1 (Moderate Drought)**:
- Noticeable impacts on crops and pastures
- Water levels in streams and wells declining
- Voluntary water conservation requested
- Wildfire risk moderate (+20 points)

**D2 (Severe Drought)**:
- Significant crop and pasture losses
- Water shortages becoming common
- Mandatory water restrictions
- Wildfire risk high (+30 points)

**D3 (Extreme Drought)**:
- Major agricultural losses
- Widespread water shortages
- Fire bans and restrictions in place
- Wildfire risk very high (+40 points)

**D4 (Exceptional Drought)**:
- Catastrophic crop failures
- Water emergencies declared
- Extreme fire danger
- Wildfire risk extreme (+50 points)

### Area Percentages

When drought data includes "area_percent", this indicates what percentage of the specified region (county, state) is experiencing that drought level or worse.

Example: "85% of Boulder County is in D2 (Severe Drought)" means 85% of the county's area is experiencing Severe Drought or more severe conditions.

## Use Cases

### 1. Wildfire Risk Assessment

**Scenario**: You're planning outdoor activities in an area prone to wildfires.

**How to Use**:
1. Ask Claude about current drought conditions in your area
2. Review the wildfire risk contribution
3. Check if there's a worsening trend
4. Consider postponing activities if risk is high

**Example Query**: "I'm planning a camping trip to Boulder, Colorado next week. What are the drought conditions and wildfire risk?"

### 2. Agricultural Planning

**Scenario**: You're a farmer planning crop rotation or irrigation schedules.

**How to Use**:
1. Check current drought conditions for your county
2. Review historical trends to understand if drought is improving or worsening
3. Compare to previous years' conditions
4. Use this data to inform irrigation and planting decisions

**Example Query**: "What are current drought conditions in San Joaquin County, California, and how do they compare to last year at this time?"

### 3. Water Resource Management

**Scenario**: You work for a water utility and need to plan for water supply.

**How to Use**:
1. Monitor drought conditions across your service area
2. Track trends over multiple months
3. Compare current conditions to historical averages
4. Use data to justify water restrictions or conservation campaigns

**Example Query**: "Show me drought trends for Colorado over the past 12 months and compare to the 10-year average"

### 4. Real Estate and Property Analysis

**Scenario**: You're evaluating property in a drought-prone area.

**How to Use**:
1. Check historical drought patterns for the area
2. Assess long-term drought risk
3. Understand water availability concerns
4. Factor drought risk into property decisions

**Example Query**: "What have drought conditions been like in Phoenix, Arizona over the past 5 years?"

### 5. Research and Journalism

**Scenario**: You're writing an article about climate impacts.

**How to Use**:
1. Access historical drought data for specific regions
2. Identify trends and patterns
3. Compare multiple locations
4. Generate statistics and visualizations

**Example Query**: "Compare drought severity in California, Arizona, and New Mexico over the past 3 years"

## Troubleshooting

### Problem: No data returned for my location

**Possible Causes**:
- Location name is misspelled or ambiguous
- Location is outside the United States
- Coordinates are incorrect

**Solutions**:
1. Try different location formats:
   - "Boulder County, Colorado" (full names)
   - "Boulder, CO" (with state abbreviation)
   - Coordinates: latitude=40.0150, longitude=-105.2705

2. Verify location spelling:
   - Use official county names
   - Include state name or abbreviation

3. For international locations:
   - USDM data only covers the United States
   - Check if location is in US territories (Puerto Rico, etc.)

### Problem: Data seems outdated

**Explanation**: USDM data is released weekly on Thursdays.

**What to check**:
1. Look at the "as_of" date in the response
2. If today is Monday-Wednesday, you'll see last Thursday's data
3. New data appears Thursday mornings after ~8:30 AM Eastern Time

**This is normal**: Drought conditions change slowly, so weekly updates are sufficient.

### Problem: Claude says the tool isn't available

**Possible Causes**:
- Server not properly registered with Claude Desktop
- Node.js path is incorrect
- Server crashed or failed to start

**Solutions**:
1. Verify configuration:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Check that the path to `src/index.js` is absolute and correct

3. Test the server manually:
   ```bash
   cd /path/to/drought-mcp
   npm start
   ```

4. Check for error messages in terminal

5. Restart Claude Desktop

### Problem: Slow responses

**Possible Causes**:
- First request downloads large GeoJSON file (~5-15 MB)
- Network connection is slow
- Geocoding service is rate-limited

**Solutions**:
1. Wait for first request to complete (may take 10-30 seconds)
2. Subsequent requests will be faster due to caching
3. Use coordinates instead of location names to skip geocoding

### Problem: Error about invalid coordinates

**Cause**: Coordinates are outside valid range

**Solution**:
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Format: latitude=40.0150, longitude=-105.2705 (not reversed)

### Problem: County not found

**Cause**: County name doesn't match FIPS database

**Solutions**:
1. Try different name formats:
   - "Boulder" vs "Boulder County"
   - Include "County" suffix

2. Use coordinates instead:
   - Look up county coordinates on Google Maps
   - Use those coordinates in your query

## FAQ

### Q: How often is drought data updated?

**A**: Every Thursday morning (~8:30 AM Eastern Time). The data represents conditions for the week ending the previous Tuesday.

### Q: Can I get real-time drought data?

**A**: No. USDM data is updated weekly. Drought is a slow-onset phenomenon, so daily updates aren't necessary or available.

### Q: Does this work outside the United States?

**A**: No. The US Drought Monitor only covers the United States and its territories.

### Q: How accurate is the drought data?

**A**: USDM data is produced by expert analysts using multiple data sources (precipitation, soil moisture, stream flows, satellite imagery, and local reports). It's considered the authoritative source for US drought information.

### Q: Can I download raw data files?

**A**: Yes. The MCP server uses publicly available data from:
- GeoJSON: https://droughtmonitor.unl.edu/data/json/usdm_current.json
- API: https://usdmdataservices.unl.edu/api/

### Q: How far back does historical data go?

**A**: USDM data is available from January 4, 2000 to present.

### Q: What's the difference between D0 and no drought?

**A**: D0 (Abnormally Dry) indicates either:
- Going INTO drought: Short-term dryness, early warning signs
- Coming OUT of drought: Recovery phase, lingering impacts

"No drought" means normal conditions with adequate precipitation and soil moisture.

### Q: Why do some areas show multiple drought categories?

**A**: Different parts of a county or state may have different drought severities. The tool provides:
- Point queries: Drought at specific coordinates
- Area queries: Statistics showing what % is in each category

### Q: How does drought relate to wildfire risk?

**A**: Drought conditions:
- Reduce fuel moisture (dry vegetation burns more easily)
- Stress vegetation (creates dead/dry plant material)
- Lower water availability (harder to fight fires)
- Increase fire intensity and spread rate

Each drought category adds 10 points to wildfire risk (D0=10 through D4=50).

### Q: Can I use this for commercial purposes?

**A**: The drought-mcp server is Apache 2.0 licensed (open source). USDM data is public domain. Check the LICENSE file for full terms.

### Q: Who maintains the US Drought Monitor?

**A**: The USDM is a partnership between:
- National Drought Mitigation Center (NDMC) at University of Nebraska-Lincoln
- USDA (United States Department of Agriculture)
- NOAA (National Oceanic and Atmospheric Administration)

## Data Updates and Freshness

### Weekly Release Schedule

**Release Day**: Every Thursday
**Release Time**: ~8:30 AM Eastern Time (12:30 PM UTC)
**Data Period**: Week ending previous Tuesday

**Example Timeline**:
- Week of August 22-28, 2025 (Tuesday ending)
- Data released: Thursday, August 29, 2025
- Available via MCP: Thursday morning after release

### Data Validity Period

Each week's data is labeled with:
- **Map Date**: Thursday release date (e.g., 2025-08-29)
- **Valid Start**: Previous Tuesday after midnight (e.g., 2025-08-22 00:00:00)
- **Valid End**: Following Tuesday before midnight (e.g., 2025-08-28 23:59:59)

### Checking Data Currency

Always check the `as_of` field in responses to see when data was released.

If you query on:
- **Thursday after 9 AM ET**: You should get this week's new data
- **Monday-Wednesday**: You'll get last Thursday's data
- **Thursday before 9 AM ET**: You'll get last week's data

This is normal and expected - drought conditions change slowly over weeks and months.

### Historical Data Availability

- **Start Date**: January 4, 2000
- **End Date**: Most recent Tuesday
- **Frequency**: Weekly (every Tuesday)
- **Total Weeks**: 1,300+ weeks of data available

## Getting Help

### Documentation Resources

- [README.md](../README.md): Project overview and quick start
- [EXAMPLES.md](EXAMPLES.md): Comprehensive usage examples
- [DEVELOPER.md](DEVELOPER.md): Technical implementation details
- [API Endpoints](api_endpoints.md): External API documentation

### Support Channels

1. **GitHub Issues**: https://github.com/tyson-swetnam/drought-mcp/issues
   - Bug reports
   - Feature requests
   - General questions

2. **Documentation**: Review this guide and other docs

3. **US Drought Monitor**: https://droughtmonitor.unl.edu/
   - Official USDM website
   - Background on drought categories
   - Interactive maps and visualizations

### Providing Feedback

We welcome feedback on:
- Documentation clarity
- Tool functionality
- Feature requests
- Integration experiences
- Use case examples

Open an issue on GitHub or contribute improvements via pull request.

## Acknowledgments

### Data Sources

- **US Drought Monitor**: Primary data source for drought severity
  - Website: https://droughtmonitor.unl.edu/
  - Maintained by NDMC, USDA, and NOAA

- **NDMC Data Services**: API for drought statistics
  - Website: https://usdmdataservices.unl.edu/
  - Provides county/state level statistics

- **OpenStreetMap Nominatim**: Geocoding service
  - Used to convert location names to coordinates

### Credits

The drought-mcp server is an independent project designed to integrate with the [fire-behavior](https://github.com/EliSchillinger/fire-behavior) wildfire risk assessment application.

### License

Apache 2.0 - See LICENSE file for details

---

**Last Updated**: October 2025

For the latest documentation, visit: https://github.com/tyson-swetnam/drought-mcp
