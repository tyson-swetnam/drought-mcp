/**
 * Cache management for drought-mcp
 * Implements in-memory caching with TTL support
 */

import { config } from '../config.js';
import { logCache, logDebug } from '../logger.js';

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} data - Cached data
 * @property {number} timestamp - When the entry was cached
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Simple in-memory cache
 */
class Cache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.maxSize = config.cacheMaxSize;

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*|null} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      logCache(key, false);
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      logCache(key, false);
      return null;
    }

    this.hits++;
    logCache(key, true);
    return entry.data;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} [ttl] - Time to live in milliseconds (defaults to config.cacheTtlSeconds * 1000)
   */
  set(key, data, ttl) {
    // Use default TTL if not provided
    const cacheTtl = ttl !== undefined ? ttl : config.cacheTtlSeconds * 1000;

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logDebug('Cache full, removed oldest entry', { key: firstKey });
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: cacheTtl
    });

    logDebug('Cache set', { key, ttl: cacheTtl });
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logDebug('Cache entry deleted', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    logDebug('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      maxSize: this.maxSize
    };
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logDebug('Cache cleanup completed', { entriesRemoved: removed });
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    const interval = config.cacheCleanupInterval * 1000; // Convert to ms
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);

    logDebug('Cache cleanup scheduled', { intervalSeconds: config.cacheCleanupInterval });
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logDebug('Cache cleanup stopped');
    }
  }
}

/**
 * Global cache instance
 */
export const cache = new Cache();

/**
 * Cache key generators
 */
export const CacheKeys = {
  /**
   * Generate key for current USDM GeoJSON
   * @returns {string} Cache key
   */
  usdmCurrent: () => 'usdm:geojson:current',

  /**
   * Generate key for historical USDM GeoJSON
   * @param {string} date - Date in YYYYMMDD format
   * @returns {string} Cache key
   */
  usdmHistorical: (date) => `usdm:geojson:${date}`,

  /**
   * Generate key for state statistics
   * @param {string} state - State abbreviation
   * @param {string} date - Date string
   * @returns {string} Cache key
   */
  stateStats: (state, date) => `ndmc:state:${state}:${date}`,

  /**
   * Generate key for county statistics
   * @param {string} state - State abbreviation
   * @param {string} date - Date string
   * @returns {string} Cache key
   */
  countyStats: (state, date) => `ndmc:county:${state}:${date}`,

  /**
   * Generate key for geocoding result
   * @param {string} location - Location string
   * @returns {string} Cache key
   */
  geocode: (location) => `geocode:${location.toLowerCase().replace(/\s+/g, '_')}`
};

export default cache;
