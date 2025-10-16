/**
 * Configuration loader for drought-mcp server
 * Loads and validates environment variables and provides default values
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Server configuration
 */
export const config = {
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',

  // Cache configuration
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10), // 24 hours default
  cacheMaxSize: parseInt(process.env.CACHE_MAX_SIZE || '500', 10),
  cacheCleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '3600', 10),

  // Data source configuration
  usdmDataFormat: process.env.USDM_DATA_FORMAT || 'json',
  enableHistoricalAnalysis: process.env.ENABLE_HISTORICAL_ANALYSIS !== 'false',

  // Geographic data handling
  enableGeoJsonProcessing: process.env.ENABLE_GEOJSON_PROCESSING !== 'false',
  coordinatePrecision: parseInt(process.env.COORDINATE_PRECISION || '4', 10),

  // API endpoints
  usdmApiBaseUrl: process.env.USDM_API_BASE_URL || 'https://usdmdataservices.unl.edu/api',
  usdmGisDataUrl: process.env.USDM_GIS_DATA_URL || 'https://droughtmonitor.unl.edu/data/json',

  // Geocoding service
  geocodingService: process.env.GEOCODING_SERVICE || 'nominatim',
  geocodingUserAgent: process.env.GEOCODING_USER_AGENT || 'DroughtMCP/1.0',

  // Rate limiting
  rateLimitPerSecond: parseInt(process.env.RATE_LIMIT_PER_SECOND || '1', 10),

  // Server metadata
  serverName: 'drought-mcp',
  serverVersion: '1.0.0',
  serverDescription: 'US Drought Monitor MCP Server for wildfire risk assessment'
};

/**
 * Validate configuration
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig() {
  const errors = [];

  if (config.cacheTtlSeconds < 0) {
    errors.push('CACHE_TTL_SECONDS must be non-negative');
  }

  if (config.coordinatePrecision < 1 || config.coordinatePrecision > 10) {
    errors.push('COORDINATE_PRECISION must be between 1 and 10');
  }

  if (!['json', 'geojson', 'csv'].includes(config.usdmDataFormat)) {
    errors.push('USDM_DATA_FORMAT must be one of: json, geojson, csv');
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }

  return true;
}

/**
 * Get configuration value by key
 * @param {string} key - Configuration key
 * @returns {*} Configuration value
 */
export function getConfig(key) {
  return config[key];
}

export default config;
