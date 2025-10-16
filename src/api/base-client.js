/**
 * Base HTTP client with retry logic and error handling
 */

import axios from 'axios';
import { logApiRequest, logApiResponse, logError, logWarn } from '../logger.js';

/**
 * Base HTTP client class
 */
export class BaseHttpClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || 30000; // 30 second default
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': options.userAgent || 'DroughtMCP/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Make HTTP GET request with retry logic
   * @param {string} url - Request URL
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(url, options = {}) {
    const method = 'GET';
    const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;

    logApiRequest(method, fullUrl);

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.client.get(url, options);
        const duration = Date.now() - startTime;

        logApiResponse(method, fullUrl, response.status, duration);

        return response.data;

      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (except 429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw this.createError(error, method, fullUrl);
        }

        // Log retry attempt
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logWarn(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`, {
            url: fullUrl,
            error: error.message
          });
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    logError(`Request failed after ${this.maxRetries} attempts`, lastError);
    throw this.createError(lastError, method, fullUrl);
  }

  /**
   * Make HTTP POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, options = {}) {
    const method = 'POST';
    const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;

    logApiRequest(method, fullUrl);

    try {
      const startTime = Date.now();
      const response = await this.client.post(url, data, options);
      const duration = Date.now() - startTime;

      logApiResponse(method, fullUrl, response.status, duration);

      return response.data;

    } catch (error) {
      logError('POST request failed', error);
      throw this.createError(error, method, fullUrl);
    }
  }

  /**
   * Create standardized error object
   * @param {Error} error - Original error
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @returns {Error} Standardized error
   */
  createError(error, method, url) {
    const standardError = new Error();

    if (error.response) {
      // Server responded with error status
      standardError.message = `HTTP ${error.response.status}: ${error.response.statusText}`;
      standardError.code = 'HTTP_ERROR';
      standardError.status = error.response.status;
      standardError.data = error.response.data;
    } else if (error.request) {
      // Request made but no response received
      standardError.message = 'No response received from server';
      standardError.code = 'NO_RESPONSE';
      standardError.status = 0;
    } else {
      // Error setting up request
      standardError.message = error.message;
      standardError.code = 'REQUEST_ERROR';
      standardError.status = 0;
    }

    standardError.method = method;
    standardError.url = url;
    standardError.originalError = error;

    return standardError;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BaseHttpClient;
