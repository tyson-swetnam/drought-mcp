/**
 * get_drought_current tool
 * Get current drought conditions for a specific location
 */

import { z } from 'zod';
import { usdmClient } from '../api/usdm-client.js';
import { queryDroughtAtPoint } from '../geojson/processor.js';
import { resolveLocation } from '../location/resolver.js';
import { transformToWildfireSchema } from '../schemas/wildfire-schema.js';
import { ndmcClient } from '../api/ndmc-client.js';
import { logInfo } from '../logger.js';

/**
 * Input schema
 */
const inputSchema = z.object({
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  state: z.string().length(2).optional(),
  county: z.string().optional(),
  format: z.enum(['json', 'wildfire_schema']).default('wildfire_schema')
});

/**
 * Tool definition
 */
export const getDroughtCurrentTool = {
  name: 'get_drought_current',
  description: 'Get current drought conditions for a specific location. Provide either coordinates (latitude/longitude), state abbreviation, or location name. Returns drought severity (D0-D4) and wildfire risk contribution.',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'Location name (e.g., "Boulder County, CO")'
      },
      latitude: {
        type: 'number',
        description: 'Latitude (-90 to 90)',
        minimum: -90,
        maximum: 90
      },
      longitude: {
        type: 'number',
        description: 'Longitude (-180 to 180)',
        minimum: -180,
        maximum: 180
      },
      state: {
        type: 'string',
        description: 'State abbreviation (e.g., "CO")',
        minLength: 2,
        maxLength: 2
      },
      county: {
        type: 'string',
        description: 'County name'
      },
      format: {
        type: 'string',
        description: 'Output format',
        enum: ['json', 'wildfire_schema'],
        default: 'wildfire_schema'
      }
    }
  }
};

/**
 * Tool handler
 */
export async function handleGetDroughtCurrent(args) {
  const startTime = Date.now();

  try {
    // Validate input
    const params = inputSchema.parse(args);

    logInfo('Getting current drought conditions', { params });

    // Resolve location
    const resolvedLocation = await resolveLocation(params);

    // If we have coordinates, query GeoJSON
    if (resolvedLocation.latitude && resolvedLocation.longitude) {
      // Fetch current USDM GeoJSON
      const geojson = await usdmClient.getCurrentDrought();

      // Query drought at point
      const droughtData = queryDroughtAtPoint(
        resolvedLocation.latitude,
        resolvedLocation.longitude,
        geojson
      );

      // Get data date
      const dataDate = usdmClient.getCurrentDataDate();

      // Transform to requested format
      let result;
      if (params.format === 'wildfire_schema') {
        result = transformToWildfireSchema(droughtData, {
          locationName: resolvedLocation.location,
          dataDate: `${dataDate.slice(0, 4)}-${dataDate.slice(4, 6)}-${dataDate.slice(6, 8)}T00:00:00Z`
        });
      } else {
        result = droughtData;
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          tool: 'get_drought_current',
          executionTime: duration,
          timestamp: new Date().toISOString(),
          dataSource: 'USDM GeoJSON',
          dataDate
        }
      };
    }

    // If state-level query, use NDMC API
    if (resolvedLocation.state) {
      const today = new Date();
      const dateStr = ndmcClient.formatDate(today);

      const stats = await ndmcClient.getStateStatistics(
        resolvedLocation.state,
        dateStr,
        dateStr
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          state: resolvedLocation.stateName,
          stateCode: resolvedLocation.state,
          statistics: stats[0] || {},
          note: 'For precise point-based drought severity, provide latitude/longitude coordinates.'
        },
        metadata: {
          tool: 'get_drought_current',
          executionTime: duration,
          timestamp: new Date().toISOString(),
          dataSource: 'NDMC Data Services API'
        }
      };
    }

    throw {
      code: 'LOCATION_RESOLUTION_FAILED',
      message: 'Unable to determine location coordinates'
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      error: {
        code: error.code || 'TOOL_ERROR',
        message: error.message || 'Failed to get current drought conditions',
        details: error.details || error.toString()
      },
      metadata: {
        tool: 'get_drought_current',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default getDroughtCurrentTool;
