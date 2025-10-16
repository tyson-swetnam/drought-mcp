/**
 * get_drought_by_area tool
 * Get drought statistics for a state or region
 */

import { z } from 'zod';
import { ndmcClient } from '../api/ndmc-client.js';
import { transformStatistics } from '../schemas/wildfire-schema.js';
import { isValidState, US_STATES } from '../location/resolver.js';
import { logInfo } from '../logger.js';

const inputSchema = z.object({
  state: z.string().length(2),
  include_counties: z.boolean().default(false),
  date: z.string().optional()
});

export const getDroughtByAreaTool = {
  name: 'get_drought_by_area',
  description: 'Get drought statistics for a state or region. Returns area percentages for each drought category (D0-D4) and optionally county-level breakdown.',
  inputSchema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State abbreviation (required, e.g., "CO")',
        minLength: 2,
        maxLength: 2
      },
      include_counties: {
        type: 'boolean',
        description: 'Include county-level breakdown',
        default: false
      },
      date: {
        type: 'string',
        description: 'Specific date (ISO 8601), defaults to latest'
      }
    },
    required: ['state']
  }
};

export async function handleGetDroughtByArea(args) {
  const startTime = Date.now();

  try {
    const params = inputSchema.parse(args);
    const stateCode = params.state.toUpperCase();

    if (!isValidState(stateCode)) {
      throw {
        code: 'INVALID_STATE',
        message: `Invalid state code: ${params.state}`
      };
    }

    logInfo('Getting drought by area', { state: stateCode, includeCounties: params.include_counties });

    // Determine date
    const date = params.date ? new Date(params.date) : new Date();
    const dateStr = ndmcClient.formatDate(date);

    // Fetch state statistics
    const stateStats = await ndmcClient.getStateStatistics(stateCode, dateStr, dateStr);

    // Transform to standard format
    const result = transformStatistics(stateStats, {
      state: stateCode,
      stateName: US_STATES[stateCode]
    });

    // Fetch county data if requested
    if (params.include_counties) {
      const countyStats = await ndmcClient.getCountyStatistics(stateCode, dateStr, dateStr);
      result.counties = countyStats.map(county => ({
        name: county.County,
        fips: county.FIPS,
        drought_categories: {
          None: county.None || 0,
          D0: county.D0 || 0,
          D1: county.D1 || 0,
          D2: county.D2 || 0,
          D3: county.D3 || 0,
          D4: county.D4 || 0
        },
        dsci: county.DSCI || 0
      }));
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'get_drought_by_area',
        executionTime: duration,
        timestamp: new Date().toISOString(),
        dataSource: 'NDMC Data Services API'
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      error: {
        code: error.code || 'TOOL_ERROR',
        message: error.message || 'Failed to get drought by area',
        details: error.details || error.toString()
      },
      metadata: {
        tool: 'get_drought_by_area',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default getDroughtByAreaTool;
