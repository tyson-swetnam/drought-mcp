# Usage Examples

This document provides comprehensive examples of using the drought-mcp server to access US Drought Monitor data. Each example includes the query, expected response format, and practical use cases.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Location-Based Queries](#location-based-queries)
3. [State and Regional Queries](#state-and-regional-queries)
4. [Historical Analysis](#historical-analysis)
5. [Statistical Comparisons](#statistical-comparisons)
6. [Wildfire Risk Integration](#wildfire-risk-integration)
7. [Advanced Use Cases](#advanced-use-cases)
8. [Integration Examples](#integration-examples)

## Basic Usage

### Example 1: Simple Location Query

**Query**: "What are the drought conditions in Boulder, Colorado?"

**MCP Tool Used**: `get_drought_current`

**Parameters**:
```json
{
  "location": "Boulder, Colorado",
  "format": "wildfire_schema"
}
```

**Response**:
```json
{
  "location": "Boulder, Colorado",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": {
    "severity": "D2",
    "severity_name": "Severe Drought",
    "severity_level": 3,
    "area_percent": 85,
    "description": "Crop or pasture losses likely. Water shortages common. Water restrictions imposed."
  },
  "risk_assessment": {
    "overall_risk": "High",
    "drought_contribution": 30,
    "notes": "Severe drought conditions significantly increase wildfire risk. Low fuel moisture and stressed vegetation create highly flammable conditions."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ],
  "notes": "Data updated weekly on Thursdays. Current data reflects week ending 2025-08-27."
}
```

**Claude's Response**:
```
Based on the latest US Drought Monitor data (as of August 29, 2025):

Boulder, Colorado is experiencing **Severe Drought (D2)** conditions:

Severity Details:
- Level: D2 (Severe Drought) - level 3 out of 5
- Coverage: 85% of the area is affected
- Impact: Crop or pasture losses are likely. Water shortages are common,
  and water restrictions have been imposed.

Wildfire Risk:
- Drought contributes +30 points to the overall wildfire risk
- Risk Level: High
- The severe drought conditions significantly increase wildfire danger due to
  low fuel moisture and stressed vegetation creating highly flammable conditions.

This assessment covers the week ending Tuesday, August 27, 2025.
Data source: US Drought Monitor (https://droughtmonitor.unl.edu/)
```

**Use Case**: Quickly check current drought conditions for a specific city or county.

---

## Location-Based Queries

### Example 2: Query by Coordinates

**Query**: "What's the drought level at latitude 33.45, longitude -112.07?"

**Parameters**:
```json
{
  "latitude": 33.4484,
  "longitude": -112.0740,
  "format": "wildfire_schema"
}
```

**Response**:
```json
{
  "location": "33.45°N, 112.07°W (Phoenix, Arizona)",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": {
    "severity": "D3",
    "severity_name": "Extreme Drought",
    "severity_level": 4,
    "area_percent": 95,
    "description": "Major crop/pasture losses. Widespread water shortages or restrictions. Increased wildfire danger."
  },
  "risk_assessment": {
    "overall_risk": "Very High",
    "drought_contribution": 40,
    "notes": "Extreme drought conditions create severe wildfire risk. Vegetation is highly stressed and fuel moisture is critically low."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ],
  "notes": "Data updated weekly on Thursdays. Current data reflects week ending 2025-08-27."
}
```

**Use Case**: Check drought conditions for precise geographic coordinates, useful for specific properties or monitoring stations.

---

### Example 3: Query by State and County

**Query**: "Show drought conditions for San Diego County, California"

**Parameters**:
```json
{
  "state": "CA",
  "county": "San Diego",
  "format": "wildfire_schema"
}
```

**Response**:
```json
{
  "location": "San Diego County, California",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": {
    "severity": "D1",
    "severity_name": "Moderate Drought",
    "severity_level": 2,
    "area_percent": 68,
    "description": "Some damage to crops and pastures. Streams, reservoirs, or wells low. Some water shortages developing or imminent. Voluntary water-use restrictions requested."
  },
  "risk_assessment": {
    "overall_risk": "Moderate",
    "drought_contribution": 20,
    "notes": "Moderate drought conditions elevate wildfire risk. Vegetation stress and reduced fuel moisture increase fire susceptibility."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ],
  "notes": "Data updated weekly on Thursdays. Current data reflects week ending 2025-08-27."
}
```

**Use Case**: Get official county-level drought assessment using FIPS-based lookup.

---

### Example 4: Location with No Drought

**Query**: "What are drought conditions in Seattle, Washington?"

**Parameters**:
```json
{
  "location": "Seattle, WA",
  "format": "wildfire_schema"
}
```

**Response**:
```json
{
  "location": "Seattle, Washington",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": {
    "severity": null,
    "severity_name": "No Drought",
    "severity_level": 0,
    "area_percent": 0,
    "description": "No drought conditions present. Normal precipitation and soil moisture levels."
  },
  "risk_assessment": {
    "overall_risk": "Minimal",
    "drought_contribution": 0,
    "notes": "No drought conditions. Normal moisture levels reduce wildfire risk from drought factors."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ],
  "notes": "Data updated weekly on Thursdays. Current data reflects week ending 2025-08-27."
}
```

**Use Case**: Verify that an area has no drought conditions.

---

## State and Regional Queries

### Example 5: State-Wide Drought Statistics

**Query**: "Show me drought statistics for Colorado"

**MCP Tool Used**: `get_drought_by_area`

**Parameters**:
```json
{
  "state": "CO",
  "include_counties": false
}
```

**Response**:
```json
{
  "state": "Colorado",
  "state_code": "CO",
  "as_of": "2025-08-29T00:00:00Z",
  "summary": {
    "area_sq_miles": 104094,
    "drought_categories": {
      "D0": {
        "percent": 35.2,
        "area_sq_miles": 36641
      },
      "D1": {
        "percent": 28.1,
        "area_sq_miles": 29250
      },
      "D2": {
        "percent": 18.5,
        "area_sq_miles": 19257
      },
      "D3": {
        "percent": 12.2,
        "area_sq_miles": 12699
      },
      "D4": {
        "percent": 0.0,
        "area_sq_miles": 0
      }
    },
    "drought_free_percent": 6.0,
    "total_in_drought_percent": 94.0,
    "severe_or_worse_percent": 30.7
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ]
}
```

**Claude's Response**:
```
Colorado Drought Statistics (as of August 29, 2025):

Overall State Summary:
- Total Area: 104,094 square miles
- Drought-Free: 6.0% (6,246 sq mi)
- In Drought (D0+): 94.0% (97,848 sq mi)
- Severe or Worse (D2+): 30.7% (31,956 sq mi)

Breakdown by Drought Category:
- D0 (Abnormally Dry): 35.2% (36,641 sq mi)
- D1 (Moderate Drought): 28.1% (29,250 sq mi)
- D2 (Severe Drought): 18.5% (19,257 sq mi)
- D3 (Extreme Drought): 12.2% (12,699 sq mi)
- D4 (Exceptional Drought): 0.0%

Nearly the entire state (94%) is experiencing some level of drought, with
about a third in severe drought or worse. This widespread drought significantly
impacts agriculture, water resources, and wildfire risk across Colorado.
```

**Use Case**: Get a comprehensive overview of drought across an entire state.

---

### Example 6: State Statistics with County Breakdown

**Query**: "Show me drought statistics for Arizona with county details"

**Parameters**:
```json
{
  "state": "AZ",
  "include_counties": true
}
```

**Response**:
```json
{
  "state": "Arizona",
  "state_code": "AZ",
  "as_of": "2025-08-29T00:00:00Z",
  "summary": {
    "area_sq_miles": 113990,
    "drought_categories": {
      "D0": { "percent": 15.2, "area_sq_miles": 17327 },
      "D1": { "percent": 22.8, "area_sq_miles": 25990 },
      "D2": { "percent": 31.5, "area_sq_miles": 35907 },
      "D3": { "percent": 25.3, "area_sq_miles": 28840 },
      "D4": { "percent": 3.2, "area_sq_miles": 3648 }
    },
    "drought_free_percent": 2.0,
    "total_in_drought_percent": 98.0,
    "severe_or_worse_percent": 60.0
  },
  "counties": [
    {
      "name": "Maricopa",
      "fips": "04013",
      "severity": "D3",
      "percent_in_drought": 92,
      "dsci": 385
    },
    {
      "name": "Pima",
      "fips": "04019",
      "severity": "D3",
      "percent_in_drought": 88,
      "dsci": 372
    },
    {
      "name": "Yuma",
      "fips": "04027",
      "severity": "D4",
      "percent_in_drought": 95,
      "dsci": 425
    },
    {
      "name": "Coconino",
      "fips": "04005",
      "severity": "D2",
      "percent_in_drought": 78,
      "dsci": 298
    }
  ],
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ]
}
```

**Claude's Response**:
```
Arizona Drought Statistics with County Breakdown (August 29, 2025):

Statewide Summary:
- 98% of Arizona is experiencing drought (111,712 of 113,990 sq mi)
- 60% is in severe drought or worse (D2+)
- Only 2% is drought-free

Most Affected Counties:
1. Yuma County: 95% in D4 (Exceptional Drought) - DSCI: 425
2. Maricopa County (Phoenix): 92% in D3 (Extreme Drought) - DSCI: 385
3. Pima County (Tucson): 88% in D3 (Extreme Drought) - DSCI: 372
4. Coconino County (Flagstaff): 78% in D2 (Severe Drought) - DSCI: 298

The Drought Severity and Coverage Index (DSCI) ranges from 0-500, with higher
values indicating more severe and widespread drought.

Arizona is experiencing one of its most severe droughts in recent history,
with critical implications for water supply, agriculture, and wildfire risk.
```

**Use Case**: Analyze drought distribution across counties within a state, identify most affected areas.

---

## Historical Analysis

### Example 7: Six-Month Trend Analysis

**Query**: "Has drought in Boulder, Colorado improved over the last 6 months?"

**MCP Tool Used**: `get_drought_historical`

**Parameters**:
```json
{
  "location": "Boulder, CO",
  "start_date": "2025-03-01T00:00:00Z",
  "end_date": "2025-08-29T00:00:00Z",
  "aggregation": "monthly"
}
```

**Response**:
```json
{
  "location": "Boulder, Colorado",
  "time_period": {
    "start": "2025-03-01T00:00:00Z",
    "end": "2025-08-29T00:00:00Z",
    "duration_weeks": 26
  },
  "trend": {
    "direction": "worsening",
    "severity_change": "+1 category",
    "start_severity": "D1",
    "end_severity": "D2",
    "description": "Drought conditions have intensified from Moderate (D1) to Severe (D2) over the 6-month period"
  },
  "timeline": [
    {
      "date": "2025-03-01T00:00:00Z",
      "severity": "D1",
      "severity_level": 2,
      "severity_name": "Moderate Drought"
    },
    {
      "date": "2025-04-01T00:00:00Z",
      "severity": "D1",
      "severity_level": 2,
      "severity_name": "Moderate Drought"
    },
    {
      "date": "2025-05-01T00:00:00Z",
      "severity": "D1",
      "severity_level": 2,
      "severity_name": "Moderate Drought"
    },
    {
      "date": "2025-06-01T00:00:00Z",
      "severity": "D2",
      "severity_level": 3,
      "severity_name": "Severe Drought"
    },
    {
      "date": "2025-07-01T00:00:00Z",
      "severity": "D2",
      "severity_level": 3,
      "severity_name": "Severe Drought"
    },
    {
      "date": "2025-08-01T00:00:00Z",
      "severity": "D2",
      "severity_level": 3,
      "severity_name": "Severe Drought"
    }
  ],
  "statistics": {
    "avg_severity_level": 2.5,
    "months_in_drought": 6,
    "months_in_severe_plus": 3
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ]
}
```

**Claude's Response**:
```
Boulder, Colorado Drought Trend Analysis (March - August 2025):

Trend: WORSENING

Summary:
Drought conditions have intensified from Moderate Drought (D1) to Severe
Drought (D2) over the 6-month period - a +1 category increase.

Monthly Timeline:
📊 March 2025:  D1 (Moderate Drought)
📊 April 2025:  D1 (Moderate Drought)
📊 May 2025:    D1 (Moderate Drought)
📈 June 2025:   D2 (Severe Drought) ⚠️ Intensified
📈 July 2025:   D2 (Severe Drought)
📈 August 2025: D2 (Severe Drought)

Key Statistics:
- Average severity level: 2.5 (between Moderate and Severe)
- All 6 months experienced drought conditions
- 3 months (50%) in severe drought or worse

Impact:
The worsening trend indicates increasing water stress and elevated wildfire
risk. The transition to severe drought in June suggests continued dry conditions
and below-normal precipitation through summer months.
```

**Use Case**: Analyze drought trends over time to understand if conditions are improving or worsening.

---

### Example 8: Year-Over-Year Historical Comparison

**Query**: "Show me drought conditions in California's Central Valley for all of 2024"

**Parameters**:
```json
{
  "latitude": 36.7468,
  "longitude": -119.7726,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T00:00:00Z",
  "aggregation": "monthly"
}
```

**Response**:
```json
{
  "location": "36.75°N, 119.77°W (Central Valley, California)",
  "time_period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T00:00:00Z",
    "duration_weeks": 52
  },
  "trend": {
    "direction": "improving",
    "severity_change": "-2 categories",
    "start_severity": "D3",
    "end_severity": "D1",
    "description": "Drought conditions improved from Extreme (D3) to Moderate (D1) over the year"
  },
  "timeline": [
    { "date": "2024-01-01T00:00:00Z", "severity": "D3", "severity_level": 4 },
    { "date": "2024-02-01T00:00:00Z", "severity": "D3", "severity_level": 4 },
    { "date": "2024-03-01T00:00:00Z", "severity": "D2", "severity_level": 3 },
    { "date": "2024-04-01T00:00:00Z", "severity": "D2", "severity_level": 3 },
    { "date": "2024-05-01T00:00:00Z", "severity": "D2", "severity_level": 3 },
    { "date": "2024-06-01T00:00:00Z", "severity": "D2", "severity_level": 3 },
    { "date": "2024-07-01T00:00:00Z", "severity": "D1", "severity_level": 2 },
    { "date": "2024-08-01T00:00:00Z", "severity": "D1", "severity_level": 2 },
    { "date": "2024-09-01T00:00:00Z", "severity": "D1", "severity_level": 2 },
    { "date": "2024-10-01T00:00:00Z", "severity": "D1", "severity_level": 2 },
    { "date": "2024-11-01T00:00:00Z", "severity": "D1", "severity_level": 2 },
    { "date": "2024-12-01T00:00:00Z", "severity": "D1", "severity_level": 2 }
  ],
  "statistics": {
    "avg_severity_level": 2.58,
    "months_in_drought": 12,
    "months_in_severe_plus": 6
  }
}
```

**Use Case**: Understand annual drought patterns and seasonal variations.

---

## Statistical Comparisons

### Example 9: Compare to Last Year

**Query**: "How does California's current drought compare to this time last year?"

**MCP Tool Used**: `get_drought_statistics`

**Parameters**:
```json
{
  "state": "CA",
  "compare_to": "last_year"
}
```

**Response**:
```json
{
  "state": "California",
  "current": {
    "date": "2025-08-29T00:00:00Z",
    "in_drought_percent": 72.3,
    "severe_or_worse_percent": 45.1,
    "exceptional_drought_percent": 0.0,
    "drought_categories": {
      "D0": 27.2,
      "D1": 18.0,
      "D2": 22.1,
      "D3": 23.0,
      "D4": 0.0
    }
  },
  "comparison": {
    "date": "2024-08-29T00:00:00Z",
    "in_drought_percent": 65.8,
    "severe_or_worse_percent": 38.2,
    "exceptional_drought_percent": 0.0,
    "drought_categories": {
      "D0": 27.6,
      "D1": 20.0,
      "D2": 18.2,
      "D3": 20.0,
      "D4": 0.0
    }
  },
  "analysis": {
    "change": "+6.5 percentage points more area in drought",
    "trend": "worsening",
    "notable_changes": [
      "Severe drought (D2+) increased by 6.9 percentage points",
      "Extreme drought (D3) increased by 3.0 percentage points"
    ],
    "summary": "California's drought has intensified compared to last year at this time. Nearly three-quarters of the state is now experiencing drought conditions, with nearly half in severe drought or worse."
  },
  "data_sources": [
    {
      "name": "US Drought Monitor",
      "type": "drought",
      "url": "https://droughtmonitor.unl.edu/"
    }
  ]
}
```

**Claude's Response**:
```
California Drought Comparison: 2025 vs 2024

Current Conditions (August 29, 2025):
- Total in drought (D0+): 72.3%
- Severe or worse (D2+): 45.1%
- Extreme drought (D3+): 23.0%

Same Time Last Year (August 29, 2024):
- Total in drought (D0+): 65.8%
- Severe or worse (D2+): 38.2%
- Extreme drought (D3+): 20.0%

Year-Over-Year Change:
📈 +6.5% more area in drought
📈 +6.9% more area in severe drought or worse
📈 +3.0% more area in extreme drought

Trend: WORSENING

Analysis:
California's drought situation has deteriorated compared to last year. The
increase in severe and extreme drought categories indicates more intense
water stress and higher wildfire risk. Agricultural impacts are likely more
severe, and water supply concerns have escalated.
```

**Use Case**: Understand if drought conditions are better or worse than previous year.

---

### Example 10: Compare to 10-Year Average

**Query**: "Compare current Texas drought to the 10-year average"

**Parameters**:
```json
{
  "state": "TX",
  "compare_to": "10_year_avg"
}
```

**Response**:
```json
{
  "state": "Texas",
  "current": {
    "date": "2025-08-29T00:00:00Z",
    "in_drought_percent": 82.5,
    "severe_or_worse_percent": 55.2,
    "exceptional_drought_percent": 8.3
  },
  "comparison": {
    "period": "2015-2024 average for late August",
    "in_drought_percent": 58.7,
    "severe_or_worse_percent": 32.1,
    "exceptional_drought_percent": 3.2
  },
  "analysis": {
    "change": "+23.8 percentage points above 10-year average",
    "trend": "significantly_worse",
    "notable_changes": [
      "Current drought extent 40% higher than typical",
      "Severe drought (D2+) 72% above average",
      "Exceptional drought (D4) 159% above average"
    ],
    "summary": "Texas is experiencing drought conditions significantly worse than the 10-year average for this time of year. The extent and severity of drought are well above typical late-summer levels."
  }
}
```

**Use Case**: Determine if current drought is exceptional compared to recent historical patterns.

---

## Wildfire Risk Integration

### Example 11: Drought Contribution to Wildfire Risk

**Query**: "How does drought affect wildfire risk in Southern California right now?"

**Response Combining Multiple Tools**:

```
Southern California Drought and Wildfire Risk Assessment (August 29, 2025):

Drought Conditions:
- Los Angeles County: D2 (Severe Drought) - 78% coverage
- San Diego County: D1 (Moderate Drought) - 68% coverage
- Riverside County: D3 (Extreme Drought) - 85% coverage
- San Bernardino County: D3 (Extreme Drought) - 82% coverage

Wildfire Risk Contribution from Drought:

Los Angeles County:
- Drought contribution: +30 points (D2)
- Risk level from drought: High
- Impact: Low fuel moisture, stressed vegetation

San Diego County:
- Drought contribution: +20 points (D1)
- Risk level from drought: Moderate
- Impact: Reduced fuel moisture, some vegetation stress

Riverside County:
- Drought contribution: +40 points (D3)
- Risk level from drought: Very High
- Impact: Critically low fuel moisture, widespread vegetation stress

San Bernardino County:
- Drought contribution: +40 points (D3)
- Risk level from drought: Very High
- Impact: Extreme vegetation stress, highly flammable conditions

Overall Assessment:
Southern California's drought conditions significantly elevate wildfire risk
across the region. Inland counties (Riverside, San Bernardino) face the highest
drought-driven fire risk, while coastal counties have somewhat lower but still
elevated risk. Combined with typical summer weather patterns (high temperatures,
low humidity, Santa Ana winds), the region faces a dangerous fire season.

Recommendations:
- Maintain high awareness of fire restrictions
- Prepare emergency evacuation plans
- Clear defensible space around properties
- Monitor local fire danger ratings
```

**Use Case**: Assess how drought specifically contributes to regional wildfire risk.

---

## Advanced Use Cases

### Example 12: Multi-State Regional Analysis

**Query**: "Compare drought across the Four Corners states (Colorado, Utah, Arizona, New Mexico)"

**Using Multiple Queries**:

```
Four Corners Regional Drought Assessment (August 29, 2025):

Colorado:
- In drought (D0+): 94.0%
- Severe+ (D2+): 30.7%
- Dominant category: D0 (35.2%)

Utah:
- In drought (D0+): 88.5%
- Severe+ (D2+): 42.3%
- Dominant category: D2 (28.8%)

Arizona:
- In drought (D0+): 98.0%
- Severe+ (D2+): 60.0%
- Dominant category: D2 (31.5%)

New Mexico:
- In drought (D0+): 96.2%
- Severe+ (D2+): 68.5%
- Dominant category: D3 (35.7%)

Regional Summary:
The Four Corners region is experiencing widespread, severe drought. All four
states have more than 88% of their area in drought, with Arizona and New Mexico
facing the most severe conditions. This represents one of the most significant
droughts in the region's recent history, with major implications for:

- Water supply from Colorado River system
- Agricultural production
- Wildfire risk across the region
- Power generation from hydroelectric facilities
- Tribal water rights and resources

The severity is greatest in New Mexico and Arizona, with exceptional drought
(D4) present in isolated areas of both states.
```

**Use Case**: Regional drought assessment for policy planning or resource allocation.

---

### Example 13: Agricultural Impact Analysis

**Query**: "What's the drought situation in California's Central Valley and how does it affect agriculture?"

**Response**:
```
California Central Valley Agricultural Drought Assessment (August 29, 2025):

Current Drought Conditions:
- Northern Valley (Sacramento area): D1 (Moderate) - 65% coverage
- Central Valley: D2 (Severe) - 82% coverage
- Southern Valley (Fresno area): D3 (Extreme) - 88% coverage

Agricultural Impacts by Drought Category:

Moderate Drought (D1) - Northern Valley:
- Some crop damage, particularly to pastures
- Irrigation needs increased
- Surface water supplies reduced
- Well levels declining

Severe Drought (D2) - Central Valley:
- Likely crop and pasture losses
- Mandatory water restrictions affecting irrigation
- Increased pumping costs as groundwater levels drop
- Reduced crop yields expected

Extreme Drought (D3) - Southern Valley:
- Major crop losses expected
- Widespread water shortages limiting irrigation
- Land fallowing likely necessary
- Economic stress on farming communities

Economic Context:
The Central Valley produces 25% of the nation's food supply on just 1% of
US farmland. Current drought conditions threaten:
- Row crop production (tomatoes, lettuce, cotton)
- Orchard crops (almonds, pistachios, citrus)
- Dairy operations (feed costs, water availability)
- Employment in agricultural sector

Water Supply:
- Federal Central Valley Project allocations reduced
- State Water Project deliveries limited
- Groundwater over-pumping concerns
- Reservoir levels below normal

The severe to extreme drought across most of the Central Valley presents
significant challenges for the 2025 growing season and beyond.
```

**Use Case**: Sector-specific drought impact analysis for decision-making.

---

## Integration Examples

### Example 14: Integration with fire-behavior Application

**Scenario**: Fire-behavior app queries both drought-mcp and raws-mcp to calculate comprehensive wildfire risk.

**Python Integration Code**:
```python
import asyncio
from mcp import Client

async def calculate_wildfire_risk(location):
    """
    Calculate comprehensive wildfire risk combining drought and weather data
    """
    # Get drought conditions
    drought_data = await drought_mcp.call_tool(
        'get_drought_current',
        {
            'location': location,
            'format': 'wildfire_schema'
        }
    )

    # Get current weather from RAWS station
    weather_data = await raws_mcp.call_tool(
        'get_raws_current',
        {
            'location': location
        }
    )

    # Calculate risk components
    drought_risk = drought_data['drought_conditions']['severity_level'] * 10
    weather_risk = calculate_weather_risk(weather_data)

    # Combine into overall risk score
    total_risk = drought_risk + weather_risk

    return {
        'location': location,
        'total_risk_score': total_risk,
        'risk_level': get_risk_level(total_risk),
        'components': {
            'drought': {
                'score': drought_risk,
                'severity': drought_data['drought_conditions']['severity'],
                'description': drought_data['drought_conditions']['description']
            },
            'weather': {
                'score': weather_risk,
                'temperature': weather_data['temperature'],
                'humidity': weather_data['humidity'],
                'wind_speed': weather_data['wind_speed']
            }
        },
        'recommendations': generate_recommendations(total_risk)
    }

def get_risk_level(score):
    """Map numeric score to risk level"""
    if score >= 90: return 'Extreme'
    if score >= 70: return 'Very High'
    if score >= 50: return 'High'
    if score >= 30: return 'Moderate'
    return 'Low'

# Example usage
risk_assessment = await calculate_wildfire_risk('Boulder, CO')
print(f"Wildfire Risk: {risk_assessment['risk_level']}")
print(f"Total Score: {risk_assessment['total_risk_score']}")
```

**Example Output**:
```json
{
  "location": "Boulder, CO",
  "total_risk_score": 75,
  "risk_level": "Very High",
  "components": {
    "drought": {
      "score": 30,
      "severity": "D2",
      "description": "Severe drought conditions with low fuel moisture"
    },
    "weather": {
      "score": 45,
      "temperature": 95,
      "humidity": 12,
      "wind_speed": 25
    }
  },
  "recommendations": [
    "Avoid outdoor burning",
    "Be aware of fire restrictions",
    "Prepare evacuation plan",
    "Monitor local fire danger ratings"
  ]
}
```

**Use Case**: Comprehensive wildfire risk assessment combining multiple data sources.

---

### Example 15: Data Export for Analysis

**Query**: "I need drought data for research - can I export it?"

**Response**:
```
Yes! The drought-mcp server provides structured data that's easy to export.

Option 1: JSON Format (Default)
All responses are in JSON format, which can be saved directly:

{
  "location": "Boulder, CO",
  "as_of": "2025-08-29T00:00:00Z",
  "drought_conditions": { ... }
}

Option 2: Historical Data Export
Use get_drought_historical to get time series data:

# Get 5 years of weekly data
drought_mcp.get_drought_historical({
  location: "Boulder, CO",
  start_date: "2020-01-01",
  end_date: "2025-08-29",
  aggregation: "weekly"
})

# Returns 260+ weekly data points suitable for:
- Statistical analysis
- Trend modeling
- Visualization
- Research publications

Option 3: Batch State Queries
Query multiple states programmatically:

states = ['CA', 'AZ', 'NM', 'TX', 'NV', 'UT', 'CO']
for state in states:
    data = drought_mcp.get_drought_by_area({
        state: state,
        include_counties: true
    })
    save_to_csv(data, f"{state}_drought_data.csv")

Option 4: Direct USDM Access
For large-scale analysis, access USDM data directly:
- GeoJSON: https://droughtmonitor.unl.edu/data/json/usdm_current.json
- API: https://usdmdataservices.unl.edu/api/
- The drought-mcp server uses these same sources

Data Attribution:
When using data in research or publications, please cite:
"Data source: U.S. Drought Monitor (droughtmonitor.unl.edu), accessed via
drought-mcp MCP server"
```

**Use Case**: Academic research, data analysis, and visualization projects.

---

## Tips and Best Practices

### Efficient Querying

1. **Use coordinates when possible**: Faster than location name geocoding
2. **Cache responses**: Drought data changes weekly, no need to query repeatedly
3. **Aggregate historical data**: Use monthly aggregation for long time periods
4. **Batch state queries**: Query all needed states at once

### Interpreting Results

1. **Check the as_of date**: Understand data currency
2. **Consider area_percent**: Not all of a region may be affected equally
3. **Look at trends**: Current severity + trend direction = full picture
4. **Compare to averages**: Context helps interpret severity

### Common Patterns

**Pattern 1: Location Check Before Activity**
```
1. Query current drought for location
2. Check wildfire risk contribution
3. Review any trend (improving/worsening)
4. Make informed decision about outdoor activities
```

**Pattern 2: Regional Monitoring**
```
1. Query state statistics weekly
2. Track changes in severe+ drought percentage
3. Compare to historical averages
4. Adjust water management policies accordingly
```

**Pattern 3: Research Analysis**
```
1. Query historical data for study period
2. Export to CSV/JSON
3. Analyze with statistical tools
4. Visualize trends and patterns
5. Correlate with other datasets (precipitation, temperature, wildfire incidents)
```

---

## Additional Resources

- [User Guide](USER_GUIDE.md) - Complete usage documentation
- [Developer Guide](DEVELOPER.md) - Technical implementation details
- [API Endpoints](api_endpoints.md) - External API reference
- [US Drought Monitor](https://droughtmonitor.unl.edu/) - Official USDM website

---

**Last Updated**: October 2025

For more examples or to suggest additions, please open an issue on GitHub.
