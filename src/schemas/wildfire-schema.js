/**
 * Wildfire schema transformer
 * Transforms drought data to wildfire_prompt_template.json format
 */

import { calculateWildfireRisk } from '../utils/risk-calculator.js';

/**
 * Transform drought data to wildfire schema format
 * @param {Object} droughtData - Drought query result
 * @param {Object} [options] - Additional options
 * @returns {Object} Wildfire schema formatted output
 */
export function transformToWildfireSchema(droughtData, options = {}) {
  const { severity, severityName, severityLevel, description, location } = droughtData;

  // Calculate wildfire risk
  const risk = calculateWildfireRisk(severity);

  // Build wildfire schema response
  const response = {
    location: options.locationName || `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°W`,
    as_of: options.dataDate || new Date().toISOString(),
    drought_conditions: {
      severity,
      severity_name: severityName,
      severity_level: severityLevel,
      description
    },
    risk_assessment: {
      drought_contribution: risk.droughtContribution,
      overall_risk: risk.overallRisk,
      notes: risk.notes
    },
    data_sources: [
      {
        name: 'US Drought Monitor',
        type: 'drought',
        url: 'https://droughtmonitor.unl.edu/',
        update_frequency: 'Weekly (Thursdays)'
      }
    ],
    notes: 'USDM data updated weekly on Thursdays. Current data reflects week ending on the most recent Tuesday.'
  };

  return response;
}

/**
 * Transform state/area drought statistics to summary format
 * @param {Object} statsData - Statistics from NDMC API
 * @param {Object} options - Options including state info
 * @returns {Object} Formatted statistics
 */
export function transformStatistics(statsData, options = {}) {
  if (!Array.isArray(statsData) || statsData.length === 0) {
    throw new Error('Invalid statistics data');
  }

  // Use most recent data point
  const latest = statsData[statsData.length - 1];

  return {
    state: options.stateName || options.state,
    state_code: options.state,
    as_of: latest.MapDate || new Date().toISOString(),
    summary: {
      drought_categories: {
        D0: { percent: latest.D0 || 0 },
        D1: { percent: latest.D1 || 0 },
        D2: { percent: latest.D2 || 0 },
        D3: { percent: latest.D3 || 0 },
        D4: { percent: latest.D4 || 0 }
      },
      in_drought_percent: (latest.D0 || 0) + (latest.D1 || 0) + (latest.D2 || 0) + (latest.D3 || 0) + (latest.D4 || 0),
      severe_or_worse_percent: (latest.D2 || 0) + (latest.D3 || 0) + (latest.D4 || 0)
    },
    data_source: {
      name: 'NDMC Data Services',
      url: 'https://usdmdataservices.unl.edu/api/'
    }
  };
}

export default {
  transformToWildfireSchema,
  transformStatistics
};
