#!/usr/bin/env node

/**
 * Drought MCP Server
 * Provides US Drought Monitor data via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config.js';
import { logInfo, logError, logToolInvocation, logToolResult } from './logger.js';
import { healthCheckTool, handleHealthCheck } from './tools/health.js';
import { getDroughtCurrentTool, handleGetDroughtCurrent } from './tools/get-drought-current.js';
import { getDroughtByAreaTool, handleGetDroughtByArea } from './tools/get-drought-by-area.js';
import { getDroughtHistoricalTool, handleGetDroughtHistorical } from './tools/get-drought-historical.js';
import { getDroughtStatisticsTool, handleGetDroughtStatistics } from './tools/get-drought-statistics.js';

/**
 * MCP Server instance
 */
const server = new Server(
  {
    name: config.serverName,
    version: config.serverVersion,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Registry of all available tools
 */
const allTools = [
  healthCheckTool,
  getDroughtCurrentTool,
  getDroughtByAreaTool,
  getDroughtHistoricalTool,
  getDroughtStatisticsTool
];

/**
 * Tool handlers map
 * Maps tool names to their handler functions
 */
const toolHandlers = {
  health_check: handleHealthCheck,
  get_drought_current: handleGetDroughtCurrent,
  get_drought_by_area: handleGetDroughtByArea,
  get_drought_historical: handleGetDroughtHistorical,
  get_drought_statistics: handleGetDroughtStatistics
};

/**
 * Handle tool list request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logInfo('Tools list requested');
  return {
    tools: allTools
  };
});

/**
 * Handle tool execution request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  logToolInvocation(name, args);

  try {
    // Find the appropriate handler
    const handler = toolHandlers[name];

    if (!handler) {
      const duration = Date.now() - startTime;
      logToolResult(name, false, duration);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: 'TOOL_NOT_FOUND',
                message: `Tool '${name}' not found`,
                availableTools: Object.keys(toolHandlers)
              }
            }, null, 2)
          }
        ]
      };
    }

    // Execute the tool
    const result = await handler(args || {});
    const duration = Date.now() - startTime;

    logToolResult(name, result.success, duration);

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Tool execution error for '${name}'`, error);
    logToolResult(name, false, duration);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'TOOL_EXECUTION_ERROR',
              message: `Failed to execute tool '${name}': ${error.message}`,
              details: error.toString()
            },
            metadata: {
              tool: name,
              executionTime: duration,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }
});

/**
 * Start the MCP server
 */
async function main() {
  // Validate configuration
  if (!validateConfig()) {
    logError('Configuration validation failed');
    process.exit(1);
  }

  logInfo('Starting drought-mcp server', {
    version: config.serverVersion,
    logLevel: config.logLevel,
    cacheTtl: config.cacheTtlSeconds
  });

  // Create transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  logInfo('Drought MCP server started successfully', {
    availableTools: allTools.length
  });

  logInfo('Server is ready to accept requests');
}

/**
 * Error handler
 */
process.on('uncaughtException', (error) => {
  logError('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled rejection', { reason, promise });
});

// Start the server
main().catch((error) => {
  logError('Failed to start server', error);
  process.exit(1);
});
