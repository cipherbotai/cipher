/**
 * Advanced Pattern Recognition Module for Cipher Extension
 * Provides sophisticated chart pattern detection and analysis
 */

// Pattern detection confidence thresholds
const PATTERN_CONFIDENCE_THRESHOLD = 0.65;

// Supported chart patterns
const CHART_PATTERNS = {
  HEAD_AND_SHOULDERS: 'HEAD_AND_SHOULDERS',
  INVERSE_HEAD_AND_SHOULDERS: 'INVERSE_HEAD_AND_SHOULDERS',
  DOUBLE_TOP: 'DOUBLE_TOP',
  DOUBLE_BOTTOM: 'DOUBLE_BOTTOM',
  TRIPLE_TOP: 'TRIPLE_TOP',
  TRIPLE_BOTTOM: 'TRIPLE_BOTTOM',
  ASCENDING_TRIANGLE: 'ASCENDING_TRIANGLE',
  DESCENDING_TRIANGLE: 'DESCENDING_TRIANGLE',
  SYMMETRICAL_TRIANGLE: 'SYMMETRICAL_TRIANGLE',
  BULL_FLAG: 'BULL_FLAG',
  BEAR_FLAG: 'BEAR_FLAG',
  BULL_PENNANT: 'BULL_PENNANT',
  BEAR_PENNANT: 'BEAR_PENNANT',
  CUP_AND_HANDLE: 'CUP_AND_HANDLE',
  ROUNDING_BOTTOM: 'ROUNDING_BOTTOM',
  ROUNDING_TOP: 'ROUNDING_TOP',
  WEDGE: 'WEDGE',
  CHANNEL: 'CHANNEL'
};

// Pattern type categories
const PATTERN_TYPES = {
  REVERSAL: 'REVERSAL',
  CONTINUATION: 'CONTINUATION',
  BILATERAL: 'BILATERAL'
};

// Pattern strength signals
const PATTERN_STRENGTH = {
  STRONG: 'STRONG',
  MODERATE: 'MODERATE',
  WEAK: 'WEAK'
};

// Classification of patterns
const PATTERN_CLASSIFICATION = {
  [CHART_PATTERNS.HEAD_AND_SHOULDERS]: {
    type: PATTERN_TYPES.REVERSAL,
    direction: 'bearish',
    description: 'Three peaks with the middle peak being the highest'
  },
  [CHART_PATTERNS.INVERSE_HEAD_AND_SHOULDERS]: {
    type: PATTERN_TYPES.REVERSAL,
    direction: 'bullish',
    description: 'Three valleys with the middle valley being the lowest'
  },
  [CHART_PATTERNS.DOUBLE_TOP]: {
    type: PATTERN_TYPES.REVERSAL,
    direction: 'bearish',
    description: 'Two peaks at approximately the same price level'
  },
  [CHART_PATTERNS.DOUBLE_BOTTOM]: {
    type: PATTERN_TYPES.REVERSAL,
    direction: 'bullish',
    description: 'Two valleys at approximately the same price level'
  },
  // ... other pattern classifications
};

/**
 * Moving Average calculation
 */
const calculateMA = (prices, period) => {
  if (prices.length < period) {
    return [];
  }
  
  const result = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((total, price) => total + price, 0);
    result.push(sum / period);
  }
  
  return result;
};

/**
 * Bollinger Bands calculation
 */
const calculateBollingerBands = (prices, period = 20, multiplier = 2) => {
  if (prices.length < period) {
    return { upper: [], middle: [], lower: [] };
  }
  
  const middle = calculateMA(prices, period);
  const upper = [];
  const lower = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((total, price) => total + price, 0) / period;
    
    const squaredDiffs = slice.map(price => Math.pow(price - avg, 2));
    const variance = squaredDiffs.reduce((total, diff) => total + diff, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper.push(middle[i - (period - 1)] + (multiplier * stdDev));
    lower.push(middle[i - (period - 1)] - (multiplier * stdDev));
  }
  
  return { upper, middle, lower };
};

/**
 * Fibonacci Retracement Levels
 */
const calculateFibonacciLevels = (highPrice, lowPrice) => {
  const diff = highPrice - lowPrice;
  return {
    level0: highPrice,
    level23_6: highPrice - (diff * 0.236),
    level38_2: highPrice - (diff * 0.382),
    level50: highPrice - (diff * 0.5),
    level61_8: highPrice - (diff * 0.618),
    level78_6: highPrice - (diff * 0.786),
    level100: lowPrice
  };
};

/**
 * Detect Double Top pattern
 */
const detectDoubleTop = (prices, volumes, threshold = PATTERN_CONFIDENCE_THRESHOLD) => {
  if (prices.length < 30) return null;
  
  let peaks = [];
  // Find peaks in the price data
  for (let i = 5; i < prices.length - 5; i++) {
    const window = prices.slice(i - 5, i + 6);
    const currentPrice = prices[i];
    if (currentPrice === Math.max(...window)) {
      peaks.push({ index: i, price: currentPrice });
    }
  }
  
  // Need at least 2 peaks to continue
  if (peaks.length < 2) return null;
  
  // Sort peaks by price (descending) then by index (ascending)
  peaks.sort((a, b) => {
    if (b.price !== a.price) return b.price - a.price;
    return a.index - b.index;
  });
  
  // Get top 2 peaks
  const topPeaks = peaks.slice(0, 2).sort((a, b) => a.index - b.index);
  
  // Peaks should be at least 10 bars apart
  if (topPeaks[1].index - topPeaks[0].index < 10) return null;
  
  // Peaks should be at approximately the same price level (within 3%)
  const priceDiffPercentage = Math.abs(topPeaks[0].price - topPeaks[1].price) / topPeaks[0].price;
  if (priceDiffPercentage > 0.03) return null;
  
  // Find valley between peaks
  let valleyIndex = -1;
  let valleyPrice = Infinity;
  
  for (let i = topPeaks[0].index + 1; i < topPeaks[1].index; i++) {
    if (prices[i] < valleyPrice) {
      valleyPrice = prices[i];
      valleyIndex = i;
    }
  }
  
  // Valley should be significantly lower than peaks (at least 3%)
  const valleyDepthPercentage = (topPeaks[0].price - valleyPrice) / topPeaks[0].price;
  if (valleyDepthPercentage < 0.03) return null;
  
  // Volume should generally decrease on the second peak
  const firstPeakVolume = volumes[topPeaks[0].index];
  const secondPeakVolume = volumes[topPeaks[1].index];
  const volumeDecrease = firstPeakVolume > secondPeakVolume;
  
  // Calculate pattern confidence
  let confidence = 0.5;
  
  // Adjust confidence based on various factors
  if (priceDiffPercentage < 0.01) confidence += 0.1; // Peaks very close in price
  if (valleyDepthPercentage > 0.05) confidence += 0.1; // Deep valley
  if (volumeDecrease) confidence += 0.1; // Volume confirmation
  if (topPeaks[1].index > prices.length - 5) confidence += 0.1; // Recent second peak
  
  if (confidence < threshold) return null;
  
  return {
    pattern: CHART_PATTERNS.DOUBLE_TOP,
    confidence,
    direction: 'bearish',
    points: {
      firstPeak: { index: topPeaks[0].index, price: topPeaks[0].price },
      valley: { index: valleyIndex, price: valleyPrice },
      secondPeak: { index: topPeaks[1].index, price: topPeaks[1].price }
    },
    priceTarget: valleyPrice - (topPeaks[0].price - valleyPrice), // Projection based on pattern height
    patternHeight: topPeaks[0].price - valleyPrice,
    strength: confidence > 0.8 ? PATTERN_STRENGTH.STRONG : 
              confidence > 0.7 ? PATTERN_STRENGTH.MODERATE : 
              PATTERN_STRENGTH.WEAK
  };
};

/**
 * Detect Double Bottom pattern
 */
const detectDoubleBottom = (prices, volumes, threshold = PATTERN_CONFIDENCE_THRESHOLD) => {
  if (prices.length < 30) return null;
  
  let valleys = [];
  // Find valleys in the price data
  for (let i = 5; i < prices.length - 5; i++) {
    const window = prices.slice(i - 5, i + 6);
    const currentPrice = prices[i];
    if (currentPrice === Math.min(...window)) {
      valleys.push({ index: i, price: currentPrice });
    }
  }
  
  // Need at least 2 valleys to continue
  if (valleys.length < 2) return null;
  
  // Sort valleys by price (ascending) then by index (ascending)
  valleys.sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return a.index - b.index;
  });
  
  // Get bottom 2 valleys
  const bottomValleys = valleys.slice(0, 2).sort((a, b) => a.index - b.index);
  
  // Valleys should be at least 10 bars apart
  if (bottomValleys[1].index - bottomValleys[0].index < 10) return null;
  
  // Valleys should be at approximately the same price level (within 3%)
  const priceDiffPercentage = Math.abs(bottomValleys[0].price - bottomValleys[1].price) / bottomValleys[0].price;
  if (priceDiffPercentage > 0.03) return null;
  
  // Find peak between valleys
  let peakIndex = -1;
  let peakPrice = -Infinity;
  
  for (let i = bottomValleys[0].index + 1; i < bottomValleys[1].index; i++) {
    if (prices[i] > peakPrice) {
      peakPrice = prices[i];
      peakIndex = i;
    }
  }
  
  // Peak should be significantly higher than valleys (at least 3%)
  const peakHeightPercentage = (peakPrice - bottomValleys[0].price) / bottomValleys[0].price;
  if (peakHeightPercentage < 0.03) return null;
  
  // Volume should generally increase on the second valley and afterward
  const firstValleyVolume = volumes[bottomValleys[0].index];
  const secondValleyVolume = volumes[bottomValleys[1].index];
  const volumeIncrease = secondValleyVolume > firstValleyVolume;
  
  // Calculate pattern confidence
  let confidence = 0.5;
  
  // Adjust confidence based on various factors
  if (priceDiffPercentage < 0.01) confidence += 0.1; // Valleys very close in price
  if (peakHeightPercentage > 0.05) confidence += 0.1; // High peak
  if (volumeIncrease) confidence += 0.1; // Volume confirmation
  if (bottomValleys[1].index > prices.length - 5) confidence += 0.1; // Recent second valley
  
  if (confidence < threshold) return null;
  
  return {
    pattern: CHART_PATTERNS.DOUBLE_BOTTOM,
    confidence,
    direction: 'bullish',
    points: {
      firstValley: { index: bottomValleys[0].index, price: bottomValleys[0].price },
      peak: { index: peakIndex, price: peakPrice },
      secondValley: { index: bottomValleys[1].index, price: bottomValleys[1].price }
    },
    priceTarget: peakPrice + (peakPrice - bottomValleys[0].price), // Projection based on pattern height
    patternHeight: peakPrice - bottomValleys[0].price,
    strength: confidence > 0.8 ? PATTERN_STRENGTH.STRONG : 
              confidence > 0.7 ? PATTERN_STRENGTH.MODERATE : 
              PATTERN_STRENGTH.WEAK
  };
};

/**
 * Detect Head and Shoulders pattern
 */
const detectHeadAndShoulders = (prices, volumes, threshold = PATTERN_CONFIDENCE_THRESHOLD) => {
  if (prices.length < 40) return null;
  
  let peaks = [];
  // Find peaks in the price data
  for (let i = 5; i < prices.length - 5; i++) {
    const window = prices.slice(i - 5, i + 6);
    const currentPrice = prices[i];
    if (currentPrice === Math.max(...window)) {
      peaks.push({ index: i, price: currentPrice });
    }
  }
  
  // Need at least 3 peaks to continue
  if (peaks.length < 3) return null;
  
  // Sort peaks by index (ascending)
  peaks.sort((a, b) => a.index - b.index);
  
  // Look for head and shoulders pattern (three peaks with middle peak higher)
  for (let i = 0; i < peaks.length - 2; i++) {
    const leftShoulder = peaks[i];
    const head = peaks[i + 1];
    const rightShoulder = peaks[i + 2];
    
    // Head must be higher than both shoulders
    if (head.price <= leftShoulder.price || head.price <= rightShoulder.price) {
      continue;
    }
    
    // Shoulders should be at approximately the same level (within 10%)
    const shoulderDiffPercentage = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price;
    if (shoulderDiffPercentage > 0.1) {
      continue;
    }
    
    // Find valleys between peaks
    let leftValleyIndex = -1;
    let leftValleyPrice = Infinity;
    for (let j = leftShoulder.index + 1; j < head.index; j++) {
      if (prices[j] < leftValleyPrice) {
        leftValleyPrice = prices[j];
        leftValleyIndex = j;
      }
    }
    
    let rightValleyIndex = -1;
    let rightValleyPrice = Infinity;
    for (let j = head.index + 1; j < rightShoulder.index; j++) {
      if (prices[j] < rightValleyPrice) {
        rightValleyPrice = prices[j];
        rightValleyIndex = j;
      }
    }
    
    // Valleys should form a neckline (approximately horizontal)
    const valleyDiffPercentage = Math.abs(leftValleyPrice - rightValleyPrice) / leftValleyPrice;
    if (valleyDiffPercentage > 0.05) {
      continue;
    }
    
    // Volume should generally be highest at left shoulder and decrease toward right shoulder
    const volumePattern = volumes[leftShoulder.index] > volumes[head.index] && 
                         volumes[head.index] > volumes[rightShoulder.index];
    
    // Calculate pattern confidence
    let confidence = 0.5;
    
    // Adjust confidence based on various factors
    if (shoulderDiffPercentage < 0.05) confidence += 0.1; // Shoulders very close in price
    if (valleyDiffPercentage < 0.02) confidence += 0.1; // Neckline is very horizontal
    if (volumePattern) confidence += 0.1; // Volume confirmation
    if (rightShoulder.index > prices.length - 8) confidence += 0.1; // Pattern recently completed
    
    // Additional confidence if valleys are clearly defined
    const leftValleyDepth = (leftShoulder.price - leftValleyPrice) / leftShoulder.price;
    const rightValleyDepth = (rightShoulder.price - rightValleyPrice) / rightShoulder.price;
    if (leftValleyDepth > 0.03 && rightValleyDepth > 0.03) confidence += 0.1;
    
    if (confidence < threshold) continue;
    
    // Calculate neckline
    const neckline = (leftValleyPrice + rightValleyPrice) / 2;
    
    return {
      pattern: CHART_PATTERNS.HEAD_AND_SHOULDERS,
      confidence,
      direction: 'bearish',
      points: {
        leftShoulder: { index: leftShoulder.index, price: leftShoulder.price },
        head: { index: head.index, price: head.price },
        rightShoulder: { index: rightShoulder.index, price: rightShoulder.price },
        leftValley: { index: leftValleyIndex, price: leftValleyPrice },
        rightValley: { index: rightValleyIndex, price: rightValleyPrice }
      },
      neckline,
      priceTarget: neckline - (head.price - neckline), // Projection based on pattern height
      patternHeight: head.price - neckline,
      strength: confidence > 0.8 ? PATTERN_STRENGTH.STRONG : 
                confidence > 0.7 ? PATTERN_STRENGTH.MODERATE : 
                PATTERN_STRENGTH.WEAK
    };
  }
  
  return null;
};

/**
 * Detect multiple patterns in price data
 */
const detectPatterns = (prices, volumes, threshold = PATTERN_CONFIDENCE_THRESHOLD) => {
  const patterns = [];
  
  // Run all pattern detection algorithms
  const doubleTop = detectDoubleTop(prices, volumes, threshold);
  if (doubleTop) patterns.push(doubleTop);
  
  const doubleBottom = detectDoubleBottom(prices, volumes, threshold);
  if (doubleBottom) patterns.push(doubleBottom);
  
  const headAndShoulders = detectHeadAndShoulders(prices, volumes, threshold);
  if (headAndShoulders) patterns.push(headAndShoulders);
  
  // Add more pattern detections here
  
  // Sort patterns by confidence (descending)
  patterns.sort((a, b) => b.confidence - a.confidence);
  
  return patterns;
};

/**
 * Calculate support and resistance levels
 */
const findSupportResistanceLevels = (prices, minTouches = 2, sensitivity = 0.03) => {
  const levels = [];
  const priceLevels = new Map();
  
  // Group prices into levels
  for (const price of prices) {
    let foundLevel = false;
    
    // Check if price is close to any existing level
    for (const [level, touches] of priceLevels.entries()) {
      const diff = Math.abs(price - level) / level;
      if (diff < sensitivity) {
        // Update level with average
        const newLevel = (level * touches.length + price) / (touches.length + 1);
        touches.push(price);
        priceLevels.delete(level);
        priceLevels.set(newLevel, touches);
        foundLevel = true;
        break;
      }
    }
    
    // If not close to any existing level, create a new one
    if (!foundLevel) {
      priceLevels.set(price, [price]);
    }
  }
  
  // Filter levels by minimum number of touches
  for (const [level, touches] of priceLevels.entries()) {
    if (touches.length >= minTouches) {
      levels.push({
        price: level,
        strength: Math.min(1, touches.length / 5), // Normalize strength between 0-1
        touches: touches.length
      });
    }
  }
  
  // Sort levels by price (ascending)
  levels.sort((a, b) => a.price - b.price);
  
  return levels;
};

/**
 * Calculate pivot points (classic method)
 */
const calculatePivotPoints = (high, low, close) => {
  const pivotPoint = (high + low + close) / 3;
  
  return {
    pivot: pivotPoint,
    r1: 2 * pivotPoint - low,
    r2: pivotPoint + (high - low),
    r3: high + 2 * (pivotPoint - low),
    s1: 2 * pivotPoint - high,
    s2: pivotPoint - (high - low),
    s3: low - 2 * (high - pivotPoint)
  };
};

/**
 * Analyze pattern and generate trading recommendation
 */
const analyzePattern = (pattern, currentPrice) => {
  if (!pattern) return null;
  
  let recommendation = {
    action: 'HOLD', // BUY, SELL, HOLD
    confidence: pattern.confidence,
    pattern: pattern.pattern,
    direction: pattern.direction,
    targetPrice: pattern.priceTarget,
    stopLossPrice: null,
    riskRewardRatio: null,
    reasoning: []
  };
  
  switch (pattern.pattern) {
    case CHART_PATTERNS.DOUBLE_TOP:
      // For a double top, we want to sell if price is below the valley (neckline break)
      if (currentPrice < pattern.points.valley.price) {
        recommendation.action = 'SELL';
        recommendation.stopLossPrice = Math.max(pattern.points.firstPeak.price, pattern.points.secondPeak.price);
        recommendation.reasoning.push('Price has broken below the neckline of a double top pattern');
        recommendation.reasoning.push('Target price is set at pattern height projected below neckline');
      } else {
        recommendation.action = 'HOLD';
        recommendation.reasoning.push('Double top detected but price has not broken below the neckline yet');
        recommendation.reasoning.push('Consider selling if price breaks below ' + pattern.points.valley.price.toFixed(8));
      }
      break;
      
    case CHART_PATTERNS.DOUBLE_BOTTOM:
      // For a double bottom, we want to buy if price is above the peak (neckline break)
      if (currentPrice > pattern.points.peak.price) {
        recommendation.action = 'BUY';
        recommendation.stopLossPrice = Math.min(pattern.points.firstValley.price, pattern.points.secondValley.price);
        recommendation.reasoning.push('Price has broken above the neckline of a double bottom pattern');
        recommendation.reasoning.push('Target price is set at pattern height projected above neckline');
      } else {
        recommendation.action = 'HOLD';
        recommendation.reasoning.push('Double bottom detected but price has not broken above the neckline yet');
        recommendation.reasoning.push('Consider buying if price breaks above ' + pattern.points.peak.price.toFixed(8));
      }
      break;
      
    case CHART_PATTERNS.HEAD_AND_SHOULDERS:
      // For head and shoulders, sell if price is below the neckline
      if (currentPrice < pattern.neckline) {
        recommendation.action = 'SELL';
        recommendation.stopLossPrice = pattern.points.rightShoulder.price;
        recommendation.reasoning.push('Price has broken below the neckline of a head and shoulders pattern');
        recommendation.reasoning.push('Target price is set at pattern height projected below neckline');
      } else {
        recommendation.action = 'HOLD';
        recommendation.reasoning.push('Head and shoulders pattern detected but price has not broken below the neckline yet');
        recommendation.reasoning.push('Consider selling if price breaks below ' + pattern.neckline.toFixed(8));
      }
      break;
      
    // Add more pattern-specific analysis
      
    default:
      recommendation.action = 'HOLD';
      recommendation.reasoning.push('Pattern detected but no specific action recommendation');
  }
  
  // Calculate risk-reward ratio if we have stop loss and target prices
  if (recommendation.stopLossPrice && recommendation.targetPrice) {
    if (recommendation.action === 'BUY') {
      const potentialProfit = recommendation.targetPrice - currentPrice;
      const potentialLoss = currentPrice - recommendation.stopLossPrice;
      recommendation.riskRewardRatio = potentialProfit / potentialLoss;
    } else if (recommendation.action === 'SELL') {
      const potentialProfit = currentPrice - recommendation.targetPrice;
      const potentialLoss = recommendation.stopLossPrice - currentPrice;
      recommendation.riskRewardRatio = potentialProfit / potentialLoss;
    }
  }
  
  return recommendation;
};

// Export the module functions
window.cipherPatternRecognition = {
  CHART_PATTERNS,
  PATTERN_TYPES,
  PATTERN_STRENGTH,
  detectPatterns,
  findSupportResistanceLevels,
  calculatePivotPoints,
  calculateFibonacciLevels,
  calculateBollingerBands,
  analyzePattern
}; 