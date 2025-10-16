/**
 * Health check tool for drought-mcp server
 * Verifies server is operational and reports status
 */

import { z } from 'zod';
import { config } from '../config.js';
import { logInfo } from '../logger.js';

/**
 * Health check tool definition
 */
export const healthCheckTool = {
  name: 'health_check',
  description: 'Check the health and status of the drought-mcp server. Returns server version, configuration, and operational status.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

/**
 * Health check handler
 * @returns {Promise<Object>} Health check result
 */
export async function handleHealthCheck() {
  const startTime = Date.now();

  try {
    logInfo('Health check requested');

    // Gather health information
    const healthInfo = {
      status: 'healthy',
      serverName: config.serverName,
      serverVersion: config.serverVersion,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      configuration: {
        logLevel: config.logLevel,
        cacheTtlSeconds: config.cacheTtlSeconds,
        enableGeoJsonProcessing: config.enableGeoJsonProcessing,
        enableHistoricalAnalysis: config.enableHistoricalAnalysis,
        usdmDataFormat: config.usdmDataFormat
      },
      endpoints: {
        usdmApi: config.usdmApiBaseUrl,
        usdmGisData: config.usdmGisDataUrl
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    const duration = Date.now() - startTime;

    return {
      success: true,
      data: healthInfo,
      metadata: {
        tool: 'health_check',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: `Health check failed: ${error.message}`,
        details: error.toString()
      },
      metadata: {
        tool: 'health_check',
        executionTime: duration,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default healthCheckTool;
