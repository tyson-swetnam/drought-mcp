/**
 * get_drought_statistics tool
 * Get statistical summaries and comparisons (simplified implementation)
 */

import { z } from 'zod';
import { ndmcClient } from '../api/ndmc-client.js';
import { isValidState, US_STATES } from '../location/resolver.js';
import { logInfo } from '../logger.js';

const inputSchema = z.object({
  state: z.string().length(2),
  compare_to: z.enum(['last_year', '10_year_avg', 'historical_avg']).optional()
});

export const getDroughtStatisticsTool = {
  name: 'get_drought_statistics',
  description: 'Get statistical summaries and comparisons for drought conditions. Compare current conditions to last year or historical averages.',
  inputSchema: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'State abbreviation (required)',
        minLength: 2,
        maxLength: 2
      },
      compare_to: {
        type: 'string',
        description: 'Comparison period',
        enum: ['last_year', '10_year_avg', 'historical_avg']
      }
    },
    required: ['state']
  }
};

export async function handleGetDroughtStatistics(args) {
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

    logInfo('Getting drought statistics', params);

    // Get current data
    const today = new Date();
    const todayStr = ndmcClient.formatDate(today);
    const currentStats = await ndmcClient.getStateStatistics(stateCode, todayStr, todayStr);

    const result = {
      state: US_STATES[stateCode],
      stateCode,
      current: {
        date: currentStats[0]?.MapDate || todayStr,
        D0: currentStats[0]?.D0 || 0,
        D1: currentStats[0]?.D1 || 0,
        D2: currentStats[0]?.D2 || 0,
        D3: currentStats[0]?.D3 || 0,
        D4: currentStats[0]?.D4 || 0,
        in_drought_percent: ((currentStats[0]?.D0 || 0) + (currentStats[0]?.D1 || 0) +
          (currentStats[0]?.D2 || 0) + (currentStats[0]?.D3 || 0) + (currentStats[0]?.D4 || 0)),
        severe_or_worse_percent: ((currentStats[0]?.D2 || 0) + (currentStats[0]?.D3 || 0) + (currentStats[0]?.D4 || 0))
      }
    };

    // If comparison requested, fetch comparison data
    if (params.compare_to === 'last_year') {
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastYearStr = ndmcClient.formatDate(lastYear);

      const compareStats = await ndmcClient.getStateStatistics(stateCode, lastYearStr, lastYearStr);

      if (compareStats.length > 0) {
        result.comparison = {
          date: compareStats[0].MapDate,
          in_drought_percent: ((compareStats[0]?.D0 || 0) + (compareStats[0]?.D1 || 0) +
            (compareStats[0]?.D2 || 0) + (compareStats[0]?.D3 || 0) + (compareStats[0]?.D4 || 0)),
          severe_or_worse_percent: ((compareStats[0]?.D2 || 0) + (compareStats[0]?.D3 || 0) + (compareStats[0]?.D4 || 0))
        };

        const change = result.current.in_drought_percent - result.comparison.in_drought_percent;
        result.analysis = {
          change: change.toFixed(1) + '%',
          trend: change > 5 ? 'worsening' : change < -5 ? 'improving' : 'stable'
        };
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'get_drought_statistics',
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
        message: error.message || 'Failed to get drought statistics',
        details: error.details || error.toString()
      },
      metadata: {
        tool: 'get_drought_statistics',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default getDroughtStatisticsTool;
