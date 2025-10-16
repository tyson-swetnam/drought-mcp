/**
 * USDM (US Drought Monitor) GeoJSON API Client
 * Fetches drought map data from droughtmonitor.unl.edu
 */

import { BaseHttpClient } from './base-client.js';
import { cache, CacheKeys } from './cache.js';
import { config } from '../config.js';
import { logInfo, logWarn, logError } from '../logger.js';

/**
 * USDM GeoJSON Client
 */
export class USDMClient extends BaseHttpClient {
  constructor() {
    super(config.usdmGisDataUrl, {
      timeout: 30000, // 30s timeout for potentially large GeoJSON files
      userAgent: 'DroughtMCP/1.0 (Wildfire Risk Assessment)'
    });
  }

  /**
   * Get current week's drought GeoJSON
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async getCurrentDrought() {
    const cacheKey = CacheKeys.usdmCurrent();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logInfo('Returning cached current drought GeoJSON');
      return cached;
    }

    try {
      logInfo('Fetching current drought GeoJSON from USDM');

      // Fetch current week's GeoJSON
      const geojson = await this.get('/usdm_current.json');

      // Validate GeoJSON structure
      if (!geojson || geojson.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON response: missing FeatureCollection');
      }

      if (!Array.isArray(geojson.features)) {
        throw new Error('Invalid GeoJSON response: missing features array');
      }

      logInfo('Current drought GeoJSON fetched successfully', {
        featureCount: geojson.features.length
      });

      // Cache for 24 hours (USDM updates weekly on Thursdays)
      cache.set(cacheKey, geojson, 24 * 60 * 60 * 1000);

      return geojson;

    } catch (error) {
      logError('Failed to fetch current drought GeoJSON', error);
      throw {
        code: 'USDM_FETCH_ERROR',
        message: 'Failed to fetch current drought data from USDM',
        details: error.message,
        status: error.status || 500
      };
    }
  }

  /**
   * Get historical drought GeoJSON for a specific date
   * @param {string} date - Date in YYYYMMDD format
   * @returns {Promise<Object>} GeoJSON FeatureCollection
   */
  async getHistoricalDrought(date) {
    // Validate date format
    if (!/^\d{8}$/.test(date)) {
      throw {
        code: 'INVALID_DATE_FORMAT',
        message: 'Date must be in YYYYMMDD format',
        details: `Received: ${date}`
      };
    }

    const cacheKey = CacheKeys.usdmHistorical(date);

    // Check cache (historical data never changes, cache permanently)
    const cached = cache.get(cacheKey);
    if (cached) {
      logInfo('Returning cached historical drought GeoJSON', { date });
      return cached;
    }

    try {
      logInfo('Fetching historical drought GeoJSON from USDM', { date });

      // Fetch historical GeoJSON
      const geojson = await this.get(`/usdm_${date}.json`);

      // Validate GeoJSON structure
      if (!geojson || geojson.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON response: missing FeatureCollection');
      }

      if (!Array.isArray(geojson.features)) {
        throw new Error('Invalid GeoJSON response: missing features array');
      }

      logInfo('Historical drought GeoJSON fetched successfully', {
        date,
        featureCount: geojson.features.length
      });

      // Cache permanently (historical data doesn't change)
      cache.set(cacheKey, geojson, Infinity);

      return geojson;

    } catch (error) {
      // Check if it's a 404 (date doesn't exist)
      if (error.status === 404) {
        logWarn('Historical drought data not found for date', { date });
        throw {
          code: 'DROUGHT_DATA_NOT_FOUND',
          message: `No drought data available for date ${date}`,
          details: 'USDM data is available from January 4, 2000 to present, released weekly on Tuesdays',
          status: 404
        };
      }

      logError('Failed to fetch historical drought GeoJSON', error);
      throw {
        code: 'USDM_FETCH_ERROR',
        message: `Failed to fetch drought data for date ${date}`,
        details: error.message,
        status: error.status || 500
      };
    }
  }

  /**
   * Format date to YYYYMMDD for USDM API
   * @param {Date} date - JavaScript Date object
   * @returns {string} Date in YYYYMMDD format
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Get the most recent Tuesday (USDM release date)
   * @returns {Date} Most recent Tuesday
   */
  getMostRecentTuesday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 2 = Tuesday
    const daysBack = (dayOfWeek + 7 - 2) % 7; // Days since last Tuesday

    // If today is Tuesday but before noon ET, use last week's Tuesday
    const isTuesdayBeforeNoon = dayOfWeek === 2 && today.getHours() < 12;
    const adjustedDaysBack = (daysBack === 0 && isTuesdayBeforeNoon) ? 7 : daysBack;

    const tuesday = new Date(today);
    tuesday.setDate(today.getDate() - adjustedDaysBack);

    return tuesday;
  }

  /**
   * Get expected date string for current week's data
   * @returns {string} Date in YYYYMMDD format
   */
  getCurrentDataDate() {
    const tuesday = this.getMostRecentTuesday();
    return this.formatDate(tuesday);
  }
}

/**
 * Create a singleton instance
 */
export const usdmClient = new USDMClient();

export default usdmClient;
