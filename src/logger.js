/**
 * Logging infrastructure for drought-mcp server
 * Uses Winston for structured logging
 */

import winston from 'winston';
import { config } from './config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ],
  exitOnError: false
});

/**
 * Log levels:
 * - error: Error messages
 * - warn: Warning messages
 * - info: Informational messages
 * - debug: Debug messages
 */

/**
 * Log an error
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or metadata
 */
export function logError(message, error = {}) {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack });
  } else {
    logger.error(message, error);
  }
}

/**
 * Log a warning
 * @param {string} message - Warning message
 * @param {Object} metadata - Additional metadata
 */
export function logWarn(message, metadata = {}) {
  logger.warn(message, metadata);
}

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} metadata - Additional metadata
 */
export function logInfo(message, metadata = {}) {
  logger.info(message, metadata);
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} metadata - Additional metadata
 */
export function logDebug(message, metadata = {}) {
  logger.debug(message, metadata);
}

/**
 * Log API request
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} metadata - Additional metadata
 */
export function logApiRequest(method, url, metadata = {}) {
  logger.info(`API Request: ${method} ${url}`, metadata);
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} status - Response status code
 * @param {number} duration - Request duration in ms
 */
export function logApiResponse(method, url, status, duration) {
  logger.info(`API Response: ${method} ${url} - ${status} (${duration}ms)`);
}

/**
 * Log cache hit/miss
 * @param {string} key - Cache key
 * @param {boolean} hit - Whether it was a cache hit
 */
export function logCache(key, hit) {
  logger.debug(`Cache ${hit ? 'HIT' : 'MISS'}: ${key}`);
}

/**
 * Log tool invocation
 * @param {string} toolName - Name of the MCP tool
 * @param {Object} params - Tool parameters
 */
export function logToolInvocation(toolName, params = {}) {
  logger.info(`Tool invoked: ${toolName}`, { params });
}

/**
 * Log tool result
 * @param {string} toolName - Name of the MCP tool
 * @param {boolean} success - Whether the tool succeeded
 * @param {number} duration - Execution duration in ms
 */
export function logToolResult(toolName, success, duration) {
  logger.info(`Tool completed: ${toolName} - ${success ? 'SUCCESS' : 'FAILURE'} (${duration}ms)`);
}

export default logger;
