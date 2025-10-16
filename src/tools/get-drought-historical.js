/**
 * get_drought_historical tool
 * Retrieve historical drought data and trends (simplified implementation)
 */

import { z } from 'zod';
import { ndmcClient } from '../api/ndmc-client.js';
import { isValidState, US_STATES } from '../location/resolver.js';
import { logInfo } from '../logger.js';

const inputSchema = z.object({
  state: z.string().length(2),
  start_date: z.string(),
  end_date: z.string(),
  aggregation: z.enum(['weekly', 'monthly']).default('weekly')
});

export const getDroughtHistoricalTool = {
  name: 'get_drought_historical',
  description: 'Retrieve historical drought data and trends for a state over a date range. Shows drought severity progression over time.',
  inputSchema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State abbreviation (required)',
        minLength: 2,
        maxLength: 2
      },
      start_date: {
        type: 'string',
        description: 'Start date (ISO 8601, required)'
      },
      end_date: {
        type: 'string',
        description: 'End date (ISO 8601, required)'
      },
      aggregation: {
        type: 'string',
        description: 'Data aggregation level',
        enum: ['weekly', 'monthly'],
        default: 'weekly'
      }
    },
    required: ['state', 'start_date', 'end_date']
  }
};

export async function handleGetDroughtHistorical(args) {
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

    logInfo('Getting historical drought data', params);

    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);

    const startDateStr = ndmcClient.formatDate(startDate);
    const endDateStr = ndmcClient.formatDate(endDate);

    // Fetch historical statistics
    const stats = await ndmcClient.getStateStatistics(stateCode, startDateStr, endDateStr);

    // Analyze trend
    const trend = analyzeTrend(stats);

    const result = {
      location: US_STATES[stateCode],
      stateCode,
      time_period: {
        start: params.start_date,
        end: params.end_date
      },
      trend,
      timeline: stats.map(entry => ({
        date: entry.MapDate,
        D0: entry.D0 || 0,
        D1: entry.D1 || 0,
        D2: entry.D2 || 0,
        D3: entry.D3 || 0,
        D4: entry.D4 || 0
      })),
      dataPoints: stats.length
    };

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'get_drought_historical',
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
        message: error.message || 'Failed to get historical drought data',
        details: error.details || error.toString()
      },
      metadata: {
        tool: 'get_drought_historical',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

function analyzeTrend(stats) {
  if (stats.length < 2) {
    return { direction: 'insufficient_data', description: 'Not enough data points to analyze trend' };
  }

  const first = stats[0];
  const last = stats[stats.length - 1];

  // Compare severe+ drought (D2, D3, D4)
  const firstSevere = (first.D2 || 0) + (first.D3 || 0) + (first.D4 || 0);
  const lastSevere = (last.D2 || 0) + (last.D3 || 0) + (last.D4 || 0);

  const change = lastSevere - firstSevere;

  let direction, description;
  if (Math.abs(change) < 5) {
    direction = 'stable';
    description = 'Drought conditions have remained relatively stable';
  } else if (change > 0) {
    direction = 'worsening';
    description = `Drought has intensified (+${change.toFixed(1)}% in severe+ drought)`;
  } else {
    direction = 'improving';
    description = `Drought has lessened (${change.toFixed(1)}% in severe+ drought)`;
  }

  return { direction, description, severityChange: change };
}

export default getDroughtHistoricalTool;
