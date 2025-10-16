/**
 * Drought to wildfire risk calculator
 * Maps drought severity (D0-D4) to wildfire risk points
 */

/**
 * Drought severity to wildfire risk point mapping
 * Based on wildfire_prompt_template.json schema
 */
export const DROUGHT_RISK_POINTS = {
  'None': 0,
  'D0': 10,
  'D1': 20,
  'D2': 30,
  'D3': 40,
  'D4': 50
};

/**
 * Risk level thresholds
 */
export const RISK_LEVELS = {
  NONE: { min: 0, max: 0, name: 'None', color: 'green' },
  LOW: { min: 1, max: 15, name: 'Low', color: 'yellow' },
  MODERATE: { min: 16, max: 25, name: 'Moderate', color: 'orange' },
  HIGH: { min: 26, max: 35, name: 'High', color: 'red' },
  VERY_HIGH: { min: 36, max: 45, name: 'Very High', color: 'darkred' },
  EXTREME: { min: 46, max: 100, name: 'Extreme', color: 'purple' }
};

/**
 * Calculate wildfire risk points from drought severity
 * @param {string} severity - Drought severity code (None, D0-D4)
 * @returns {number} Risk points (0-50)
 */
export function calculateRiskPoints(severity) {
  return DROUGHT_RISK_POINTS[severity] || 0;
}

/**
 * Get risk level from points
 * @param {number} points - Risk points
 * @returns {Object} Risk level information
 */
export function getRiskLevel(points) {
  for (const [key, level] of Object.entries(RISK_LEVELS)) {
    if (points >= level.min && points <= level.max) {
      return { ...level, key };
    }
  }
  return RISK_LEVELS.NONE;
}

/**
 * Calculate overall wildfire risk assessment from drought data
 * @param {string} severity - Drought severity code
 * @param {Object} [options] - Additional options
 * @returns {Object} Risk assessment
 */
export function calculateWildfireRisk(severity, options = {}) {
  const points = calculateRiskPoints(severity);
  const level = getRiskLevel(points);

  return {
    droughtContribution: points,
    overallRisk: level.name,
    riskLevel: level.key,
    notes: generateRiskNotes(severity, level)
  };
}

/**
 * Generate risk notes based on drought severity
 * @param {string} severity - Drought severity
 * @param {Object} level - Risk level
 * @returns {string} Risk notes
 */
function generateRiskNotes(severity, level) {
  const notes = {
    'None': 'No drought conditions. Normal fire risk from drought perspective.',
    'D0': 'Abnormally dry conditions. Slight increase in fire risk. Monitor fuel moisture.',
    'D1': 'Moderate drought. Elevated fire risk. Vegetation stress beginning. Exercise caution with fire activities.',
    'D2': 'Severe drought. High fire risk. Significant fuel moisture deficits. Limit burning activities.',
    'D3': 'Extreme drought. Very high fire risk. Widespread vegetation stress creates highly flammable conditions. Extreme caution advised.',
    'D4': 'Exceptional drought. Extreme fire risk. Maximum fuel moisture depletion. Exceptional fire behavior potential. Severe restrictions recommended.'
  };

  return notes[severity] || notes['None'];
}

export default {
  calculateRiskPoints,
  getRiskLevel,
  calculateWildfireRisk,
  DROUGHT_RISK_POINTS,
  RISK_LEVELS
};
