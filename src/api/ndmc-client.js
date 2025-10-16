/**
 * NDMC (National Drought Mitigation Center) Data Services API Client
 * Fetches drought statistics from usdmdataservices.unl.edu
 */

import { BaseHttpClient } from './base-client.js';
import { cache, CacheKeys } from './cache.js';
import { config } from '../config.js';
import { logInfo, logError } from '../logger.js';

/**
 * NDMC Data Services API Client
 */
export class NDMCClient extends BaseHttpClient {
  constructor() {
    super(config.usdmApiBaseUrl, {
      timeout: 15000,
      userAgent: 'DroughtMCP/1.0 (Wildfire Risk Assessment)'
    });
  }

  /**
   * Get drought severity statistics for a state
   * @param {string} state - State abbreviation (e.g., 'CO')
   * @param {string} startDate - Start date in MM/DD/YYYY format
   * @param {string} endDate - End date in MM/DD/YYYY format
   * @returns {Promise<Array>} Array of drought statistics by date
   */
  async getStateStatistics(state, startDate, endDate) {
    const cacheKey = CacheKeys.stateStats(state, `${startDate}_${endDate}`);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logInfo('Returning cached state statistics', { state });
      return cached;
    }

    try {
      logInfo('Fetching state drought statistics from NDMC', { state, startDate, endDate });

      const url = `/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent`;
      const params = {
        aoi: state.toUpperCase(),
        startdate: startDate,
        enddate: endDate,
        statisticsType: '1' // Area percentage statistics
      };

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const data = await this.get(`${url}?${queryString}`);

      if (!Array.isArray(data)) {
        throw new Error('Invalid response: expected array of statistics');
      }

      logInfo('State statistics fetched successfully', {
        state,
        recordCount: data.length
      });

      // Cache for 24 hours
      cache.set(cacheKey, data, 24 * 60 * 60 * 1000);

      return data;

    } catch (error) {
      logError('Failed to fetch state statistics', error);
      throw {
        code: 'NDMC_FETCH_ERROR',
        message: `Failed to fetch drought statistics for state ${state}`,
        details: error.message,
        status: error.status || 500
      };
    }
  }

  /**
   * Get county-level drought statistics
   * @param {string} state - State abbreviation (e.g., 'CO')
   * @param {string} startDate - Start date in MM/DD/YYYY format
   * @param {string} endDate - End date in MM/DD/YYYY format
   * @returns {Promise<Array>} Array of county drought statistics
   */
  async getCountyStatistics(state, startDate, endDate) {
    const cacheKey = CacheKeys.countyStats(state, `${startDate}_${endDate}`);

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logInfo('Returning cached county statistics', { state });
      return cached;
    }

    try {
      logInfo('Fetching county drought statistics from NDMC', { state, startDate, endDate });

      const url = `/CountyStatistics/GetDSCI`;
      const params = {
        aoi: state.toUpperCase(),
        startdate: startDate,
        enddate: endDate
      };

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const data = await this.get(`${url}?${queryString}`);

      if (!Array.isArray(data)) {
        throw new Error('Invalid response: expected array of county statistics');
      }

      logInfo('County statistics fetched successfully', {
        state,
        countyCount: data.length
      });

      // Cache for 24 hours
      cache.set(cacheKey, data, 24 * 60 * 60 * 1000);

      return data;

    } catch (error) {
      logError('Failed to fetch county statistics', error);
      throw {
        code: 'NDMC_FETCH_ERROR',
        message: `Failed to fetch county statistics for state ${state}`,
        details: error.message,
        status: error.status || 500
      };
    }
  }

  /**
   * Format JavaScript Date to MM/DD/YYYY
   * @param {Date} date - JavaScript Date object
   * @returns {string} Date in MM/DD/YYYY format
   */
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Parse MM/DD/YYYY string to Date object
   * @param {string} dateString - Date in MM/DD/YYYY format
   * @returns {Date} JavaScript Date object
   */
  parseDate(dateString) {
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
}

/**
 * Create a singleton instance
 */
export const ndmcClient = new NDMCClient();

export default ndmcClient;
