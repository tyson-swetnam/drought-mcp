/**
 * GeoJSON processor for drought data
 * Uses Turf.js for point-in-polygon queries
 */

import * as turf from '@turf/turf';
import { logInfo, logDebug, logError } from '../logger.js';

/**
 * Drought severity mapping
 */
export const DroughtSeverity = {
  NONE: { code: 'None', level: 0, name: 'No Drought', description: 'No drought conditions' },
  D0: { code: 'D0', level: 1, name: 'Abnormally Dry', description: 'Going into drought or coming out of drought' },
  D1: { code: 'D1', level: 2, name: 'Moderate Drought', description: 'Some damage to crops, pastures; water shortages developing' },
  D2: { code: 'D2', level: 3, name: 'Severe Drought', description: 'Crop/pasture losses likely; water shortages common; restrictions imposed' },
  D3: { code: 'D3', level: 4, name: 'Extreme Drought', description: 'Major crop/pasture losses; widespread water shortages; increased fire danger' },
  D4: { code: 'D4', level: 5, name: 'Exceptional Drought', description: 'Exceptional crop/pasture losses; water emergencies; extreme fire danger' }
};

/**
 * Get drought severity by code
 * @param {string|number} code - Drought code ('D0'-'D4') or DM value (0-4)
 * @returns {Object} Drought severity info
 */
export function getDroughtSeverity(code) {
  // Handle DM numeric values (0-4)
  if (typeof code === 'number') {
    const severityKeys = ['D0', 'D1', 'D2', 'D3', 'D4'];
    const key = severityKeys[code];
    return key ? DroughtSeverity[key] : DroughtSeverity.NONE;
  }

  // Handle string codes
  const upperCode = String(code).toUpperCase();
  return DroughtSeverity[upperCode] || DroughtSeverity.NONE;
}

/**
 * Query drought severity at a specific point using GeoJSON
 * @param {number} latitude - Latitude (-90 to 90)
 * @param {number} longitude - Longitude (-180 to 180)
 * @param {Object} geojson - USDM GeoJSON FeatureCollection
 * @returns {Object} Drought severity information
 */
export function queryDroughtAtPoint(latitude, longitude, geojson) {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${latitude} (must be between -90 and 90)`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${longitude} (must be between -180 and 180)`);
    }

    // Validate GeoJSON
    if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      throw new Error('Invalid GeoJSON: must be a FeatureCollection with features array');
    }

    logDebug('Querying drought at point', { latitude, longitude, featureCount: geojson.features.length });

    // Create point
    const point = turf.point([longitude, latitude]);

    // Find maximum drought severity at this point
    // IMPORTANT: USDM GeoJSON has overlapping polygons (D4 areas are also in D3, D2, D1, D0)
    // We must use the MAXIMUM DM value found
    let maxDM = null;
    let foundPolygons = 0;

    for (const feature of geojson.features) {
      try {
        // Check if point is within this feature
        const isInside = turf.booleanPointInPolygon(point, feature);

        if (isInside) {
          foundPolygons++;
          const dm = feature.properties.DM;

          if (dm !== undefined && dm !== null) {
            if (maxDM === null || dm > maxDM) {
              maxDM = dm;
            }
          }
        }
      } catch (error) {
        // Skip invalid features
        logDebug('Skipping invalid feature', { error: error.message });
      }
    }

    // Determine final severity
    const severity = maxDM !== null ? getDroughtSeverity(maxDM) : DroughtSeverity.NONE;

    logDebug('Drought query complete', {
      latitude,
      longitude,
      severity: severity.code,
      polygonsFound: foundPolygons,
      maxDM
    });

    return {
      location: {
        latitude,
        longitude
      },
      severity: severity.code,
      severityLevel: severity.level,
      severityName: severity.name,
      description: severity.description,
      dm: maxDM,
      inDrought: maxDM !== null
    };

  } catch (error) {
    logError('Failed to query drought at point', error);
    throw {
      code: 'GEOJSON_QUERY_ERROR',
      message: 'Failed to query drought severity at location',
      details: error.message
    };
  }
}

/**
 * Calculate bounding box for a set of coordinates
 * @param {Array<Array<number>>} coordinates - Array of [longitude, latitude] pairs
 * @returns {Object} Bounding box {minLon, minLat, maxLon, maxLat}
 */
export function calculateBoundingBox(coordinates) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, minLat, maxLon, maxLat };
}

/**
 * Extract all drought severities present in a GeoJSON
 * @param {Object} geojson - USDM GeoJSON FeatureCollection
 * @returns {Array<Object>} Array of severity information
 */
export function extractDroughtSeverities(geojson) {
  if (!geojson || !Array.isArray(geojson.features)) {
    return [];
  }

  const severities = new Set();

  for (const feature of geojson.features) {
    const dm = feature.properties?.DM;
    if (dm !== undefined && dm !== null) {
      severities.add(dm);
    }
  }

  return Array.from(severities)
    .sort()
    .map(dm => getDroughtSeverity(dm));
}

export default {
  queryDroughtAtPoint,
  getDroughtSeverity,
  calculateBoundingBox,
  extractDroughtSeverities,
  DroughtSeverity
};
