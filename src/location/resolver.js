/**
 * Location resolver
 * Resolves location strings, coordinates, and state/county to coordinates
 */

import { logInfo, logDebug } from '../logger.js';

// Simple US state codes
export const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

/**
 * Validate US state code
 * @param {string} state - State abbreviation
 * @returns {boolean} True if valid
 */
export function isValidState(state) {
  return US_STATES.hasOwnProperty(state.toUpperCase());
}

/**
 * Validate coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {{valid: boolean, error?: string}}
 */
export function validateCoordinates(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
}

/**
 * Resolve location to coordinates
 * @param {Object} params - Location parameters
 * @param {string} [params.location] - Location string
 * @param {number} [params.latitude] - Latitude
 * @param {number} [params.longitude] - Longitude
 * @param {string} [params.state] - State abbreviation
 * @param {string} [params.county] - County name
 * @returns {Promise<Object>} Resolved location with coordinates
 */
export async function resolveLocation(params) {
  // If coordinates are provided, validate and return them
  if (params.latitude !== undefined && params.longitude !== undefined) {
    const validation = validateCoordinates(params.latitude, params.longitude);
    if (!validation.valid) {
      throw {
        code: 'INVALID_COORDINATES',
        message: validation.error
      };
    }

    return {
      latitude: params.latitude,
      longitude: params.longitude,
      source: 'coordinates',
      location: `${params.latitude.toFixed(4)}, ${params.longitude.toFixed(4)}`
    };
  }

  // If state is provided (with or without county)
  if (params.state) {
    const stateCode = params.state.toUpperCase();

    if (!isValidState(stateCode)) {
      throw {
        code: 'INVALID_STATE',
        message: `Invalid state code: ${params.state}`
      };
    }

    // For now, return state-level info (full geocoding would be added later)
    const locationString = params.county
      ? `${params.county} County, ${US_STATES[stateCode]}`
      : US_STATES[stateCode];

    logDebug('Resolved state location', { state: stateCode, county: params.county });

    return {
      state: stateCode,
      stateName: US_STATES[stateCode],
      county: params.county,
      source: 'state',
      location: locationString,
      // Note: Real implementation would geocode to get center point
      requiresAreaQuery: true
    };
  }

  // If location string is provided
  if (params.location) {
    // Simplified: Extract state code if present
    const stateMatch = params.location.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
      const stateCode = stateMatch[1];
      if (isValidState(stateCode)) {
        return {
          state: stateCode,
          stateName: US_STATES[stateCode],
          source: 'location_string',
          location: params.location,
          requiresAreaQuery: true
        };
      }
    }

    throw {
      code: 'LOCATION_RESOLUTION_FAILED',
      message: 'Unable to resolve location. Please provide coordinates or state code.',
      details: `Location string: ${params.location}`
    };
  }

  throw {
    code: 'MISSING_LOCATION',
    message: 'No location provided. Specify either coordinates (lat/lon), state, or location string.'
  };
}

export default {
  resolveLocation,
  validateCoordinates,
  isValidState,
  US_STATES
};
