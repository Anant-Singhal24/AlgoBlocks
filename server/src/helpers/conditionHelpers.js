/**
 * Helper functions for evaluating trading conditions
 */

/**
 * Evaluate a condition block based on its subtype
 * @param {Object} block - The condition block from the strategy
 * @param {Object} marketData - Market data to apply the condition to
 * @param {Object} indicators - Calculated indicators from previous blocks
 * @returns {Boolean} Whether the condition is true or false
 */
const evaluateCondition = (block, marketData, indicators) => {
  const { subtype, settings } = block;

  // Select the condition evaluation function based on subtype
  switch (subtype) {
    case "crossover":
      return evaluateCrossover(settings, marketData, indicators);
    case "threshold":
      return evaluateThreshold(settings, marketData, indicators);
    case "price_action":
      return evaluatePriceAction(settings, marketData, indicators);
    default:
      throw new Error(`Unknown condition type: ${subtype}`);
  }
};

/**
 * Evaluate a crossover condition
 * @param {Object} settings - Condition settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Boolean} Whether the crossover occurred
 */
const evaluateCrossover = (settings, marketData, indicators) => {
  const { direction, source1Type, source2Type, source1, source2 } = settings;

  // Get values for both sources
  const value1 = getSourceValue(source1Type, source1, marketData, indicators);
  const value2 = getSourceValue(source2Type, source2, marketData, indicators);

  // Get previous values (assuming they are available in history)
  const prevValue1 = getPreviousSourceValue(
    source1Type,
    source1,
    marketData,
    indicators
  );
  const prevValue2 = getPreviousSourceValue(
    source2Type,
    source2,
    marketData,
    indicators
  );

  if (
    value1 === undefined ||
    value2 === undefined ||
    prevValue1 === undefined ||
    prevValue2 === undefined
  ) {
    return false; // Not enough data to evaluate the crossover
  }

  // Check for a bullish crossover (source1 crosses above source2)
  if (direction === "above" || direction === "bullish") {
    return prevValue1 <= prevValue2 && value1 > value2;
  }

  // Check for a bearish crossover (source1 crosses below source2)
  if (direction === "below" || direction === "bearish") {
    return prevValue1 >= prevValue2 && value1 < value2;
  }

  // Any crossover (either direction)
  if (direction === "any") {
    return (
      (prevValue1 <= prevValue2 && value1 > value2) ||
      (prevValue1 >= prevValue2 && value1 < value2)
    );
  }

  return false;
};

/**
 * Evaluate a threshold condition
 * @param {Object} settings - Condition settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Boolean} Whether the threshold condition is met
 */
const evaluateThreshold = (settings, marketData, indicators) => {
  const { sourceType, source, operator, value } = settings;

  // Get the source value
  const sourceValue = getSourceValue(
    sourceType,
    source,
    marketData,
    indicators
  );

  if (sourceValue === undefined) {
    return false; // Source value not available
  }

  // Convert threshold to a number if possible
  const threshold = typeof value === "string" ? parseFloat(value) : value;

  // Evaluate based on the operator
  switch (operator) {
    case "greater_than":
    case ">":
      return sourceValue > threshold;
    case "less_than":
    case "<":
      return sourceValue < threshold;
    case "equals":
    case "==":
    case "===":
      return sourceValue === threshold;
    case "greater_than_equals":
    case ">=":
      return sourceValue >= threshold;
    case "less_than_equals":
    case "<=":
      return sourceValue <= threshold;
    default:
      return false;
  }
};

/**
 * Evaluate a price action condition
 * @param {Object} settings - Condition settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Boolean} Whether the price action condition is met
 */
const evaluatePriceAction = (settings, marketData, indicators) => {
  const { symbol, patternType, lookbackPeriod = 1 } = settings;

  // Get price data for the symbol
  const symbolData = marketData[symbol];
  if (!symbolData || !symbolData.history || symbolData.history.length < 2) {
    return false; // Not enough price data
  }

  const history = symbolData.history;
  const current = history[history.length - 1];
  const previous = history[history.length - 2];

  // Evaluate based on the pattern type
  switch (patternType) {
    case "bullish_candle":
      return current.close > current.open;
    case "bearish_candle":
      return current.close < current.open;
    case "doji":
      // Doji is when open and close are very close to each other
      const bodySize = Math.abs(current.close - current.open);
      const totalRange = current.high - current.low;
      return bodySize / totalRange < 0.1; // Body is less than 10% of total range
    case "hammer":
      if (current.close <= current.open) return false; // Must be bullish
      const lowerWick = Math.min(current.open, current.close) - current.low;
      const hammerBody = Math.abs(current.close - current.open);
      const upperWick = current.high - Math.max(current.open, current.close);
      return lowerWick > 2 * hammerBody && upperWick < hammerBody;
    case "engulfing_bullish":
      return (
        current.close > current.open && // Current is bullish
        previous.close < previous.open && // Previous is bearish
        current.open < previous.close && // Current opens below previous close
        current.close > previous.open
      ); // Current closes above previous open
    case "engulfing_bearish":
      return (
        current.close < current.open && // Current is bearish
        previous.close > previous.open && // Previous is bullish
        current.open > previous.close && // Current opens above previous close
        current.close < previous.open
      ); // Current closes below previous open
    case "higher_high":
      // Check if the current high is higher than all previous highs in the lookback period
      for (let i = 2; i <= lookbackPeriod + 1; i++) {
        if (history.length < i) break;
        if (current.high <= history[history.length - i].high) return false;
      }
      return true;
    case "lower_low":
      // Check if the current low is lower than all previous lows in the lookback period
      for (let i = 2; i <= lookbackPeriod + 1; i++) {
        if (history.length < i) break;
        if (current.low >= history[history.length - i].low) return false;
      }
      return true;
    case "higher_close":
      return current.close > previous.close;
    case "lower_close":
      return current.close < previous.close;
    default:
      return false;
  }
};

/**
 * Get the current value from a specified source
 * @param {String} sourceType - Type of source (indicator, price, etc.)
 * @param {String} source - Source identifier
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Number|undefined} Source value
 */
const getSourceValue = (sourceType, source, marketData, indicators) => {
  switch (sourceType) {
    case "indicator":
      // Return the value of a calculated indicator
      const indicator = indicators[source];
      return indicator?.value;
    case "price":
      // Return a specific price field for a symbol
      const [symbol, field] = source.split(".");
      const symbolData = marketData[symbol];
      if (!symbolData || !symbolData.history || symbolData.history.length === 0)
        return undefined;
      const latestCandle = symbolData.history[symbolData.history.length - 1];
      return latestCandle[field];
    case "value":
      // Return a fixed numeric value
      return parseFloat(source);
    default:
      return undefined;
  }
};

/**
 * Get the previous value from a specified source
 * @param {String} sourceType - Type of source (indicator, price, etc.)
 * @param {String} source - Source identifier
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Number|undefined} Previous source value
 */
const getPreviousSourceValue = (sourceType, source, marketData, indicators) => {
  switch (sourceType) {
    case "indicator":
      // Return the previous value of a calculated indicator
      const indicator = indicators[source];
      if (!indicator || !indicator.history || indicator.history.length < 2)
        return undefined;
      return Array.isArray(indicator.history)
        ? indicator.history[indicator.history.length - 2]
        : indicator.value; // Fallback if history isn't available
    case "price":
      // Return a specific previous price field for a symbol
      const [symbol, field] = source.split(".");
      const symbolData = marketData[symbol];
      if (!symbolData || !symbolData.history || symbolData.history.length < 2)
        return undefined;
      const previousCandle = symbolData.history[symbolData.history.length - 2];
      return previousCandle[field];
    case "value":
      // Previous value of a fixed value is the same
      return parseFloat(source);
    default:
      return undefined;
  }
};

module.exports = {
  evaluateCondition,
  evaluateCrossover,
  evaluateThreshold,
  evaluatePriceAction,
};
