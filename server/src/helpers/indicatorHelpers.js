/**
 * Helper functions for processing technical indicators
 */

/**
 * Apply technical indicator based on its subtype
 * @param {Object} block - The indicator block from the strategy
 * @param {Object} marketData - Market data to apply the indicator to
 * @returns {Object} Calculated indicator values
 */
const applyIndicator = (block, marketData) => {
  const { subtype, settings } = block;

  // Extract price data for the required symbol
  const symbol = settings.symbol || Object.keys(marketData)[0];
  const priceData = marketData[symbol];

  if (!priceData || !priceData.history) {
    throw new Error(`No historical data found for ${symbol}`);
  }

  // Select the calculation function based on indicator type
  switch (subtype) {
    case "sma":
      return calculateSMA(priceData, settings);
    case "ema":
      return calculateEMA(priceData, settings);
    case "rsi":
      return calculateRSI(priceData, settings);
    case "macd":
      return calculateMACD(priceData, settings);
    case "bb":
      return calculateBollingerBands(priceData, settings);
    default:
      throw new Error(`Unknown indicator type: ${subtype}`);
  }
};

/**
 * Calculate Simple Moving Average
 * @param {Object} priceData - Historical price data
 * @param {Object} settings - Indicator settings
 * @returns {Object} Calculated SMA values
 */
const calculateSMA = (priceData, settings) => {
  const period = settings.period || 14;
  const priceField = settings.priceField || "close";

  const prices = priceData.history.map((candle) => candle[priceField]);

  if (prices.length < period) {
    throw new Error(
      `Not enough data to calculate SMA(${period}). Need at least ${period} periods.`
    );
  }

  // Calculate SMA
  const smaValues = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sum = slice.reduce((total, price) => total + price, 0);
    smaValues.push(sum / period);
  }

  return {
    value: smaValues[smaValues.length - 1],
    history: smaValues,
    period,
    timestamp: priceData.timestamp,
  };
};

/**
 * Calculate Exponential Moving Average
 * @param {Object} priceData - Historical price data
 * @param {Object} settings - Indicator settings
 * @returns {Object} Calculated EMA values
 */
const calculateEMA = (priceData, settings) => {
  const period = settings.period || 12;
  const priceField = settings.priceField || "close";

  const prices = priceData.history.map((candle) => candle[priceField]);

  if (prices.length < period) {
    throw new Error(
      `Not enough data to calculate EMA(${period}). Need at least ${period} periods.`
    );
  }

  // Calculate multiplier: (2 / (period + 1))
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA
  const initialSMA =
    prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

  // Calculate EMA values
  const emaValues = [initialSMA];

  for (let i = period; i < prices.length; i++) {
    const ema =
      (prices[i] - emaValues[emaValues.length - 1]) * multiplier +
      emaValues[emaValues.length - 1];
    emaValues.push(ema);
  }

  return {
    value: emaValues[emaValues.length - 1],
    history: emaValues,
    period,
    timestamp: priceData.timestamp,
  };
};

/**
 * Calculate Relative Strength Index
 * @param {Object} priceData - Historical price data
 * @param {Object} settings - Indicator settings
 * @returns {Object} Calculated RSI values
 */
const calculateRSI = (priceData, settings) => {
  const period = settings.period || 14;
  const priceField = settings.priceField || "close";

  const prices = priceData.history.map((candle) => candle[priceField]);

  if (prices.length < period + 1) {
    throw new Error(
      `Not enough data to calculate RSI(${period}). Need at least ${
        period + 1
      } periods.`
    );
  }

  // Calculate price changes
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Calculate gains and losses
  const gains = changes.map((change) => (change > 0 ? change : 0));
  const losses = changes.map((change) => (change < 0 ? Math.abs(change) : 0));

  // Calculate average gain and average loss
  let avgGain =
    gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss =
    losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate RSI values
  const rsiValues = [];

  // First RSI value
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
  let rsi = 100 - 100 / (1 + rs);
  rsiValues.push(rsi);

  // Subsequent RSI values with smoothing
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsi = 100 - 100 / (1 + rs);
    rsiValues.push(rsi);
  }

  return {
    value: rsiValues[rsiValues.length - 1],
    history: rsiValues,
    period,
    timestamp: priceData.timestamp,
    overbought: settings.overbought || 70,
    oversold: settings.oversold || 30,
  };
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Object} priceData - Historical price data
 * @param {Object} settings - Indicator settings
 * @returns {Object} Calculated MACD values
 */
const calculateMACD = (priceData, settings) => {
  const fastPeriod = settings.fastPeriod || 12;
  const slowPeriod = settings.slowPeriod || 26;
  const signalPeriod = settings.signalPeriod || 9;
  const priceField = settings.priceField || "close";

  const prices = priceData.history.map((candle) => candle[priceField]);

  if (prices.length < slowPeriod + signalPeriod) {
    throw new Error(
      `Not enough data to calculate MACD(${fastPeriod},${slowPeriod},${signalPeriod})`
    );
  }

  // Calculate fast EMA
  const fastEMA = calculateEMA(
    { history: priceData.history, timestamp: priceData.timestamp },
    { period: fastPeriod, priceField }
  );

  // Calculate slow EMA
  const slowEMA = calculateEMA(
    { history: priceData.history, timestamp: priceData.timestamp },
    { period: slowPeriod, priceField }
  );

  // Calculate MACD line = Fast EMA - Slow EMA
  const macdLine = [];
  for (
    let i = 0;
    i < fastEMA.history.length && i < slowEMA.history.length;
    i++
  ) {
    macdLine.push(fastEMA.history[i] - slowEMA.history[i]);
  }

  // Calculate Signal line = 9-period EMA of MACD line
  let signalLine = [];
  if (macdLine.length >= signalPeriod) {
    // Calculate initial SMA
    const initialSMA =
      macdLine.slice(0, signalPeriod).reduce((sum, value) => sum + value, 0) /
      signalPeriod;

    // Calculate EMA values
    signalLine = [initialSMA];
    const multiplier = 2 / (signalPeriod + 1);

    for (let i = signalPeriod; i < macdLine.length; i++) {
      const ema =
        (macdLine[i] - signalLine[signalLine.length - 1]) * multiplier +
        signalLine[signalLine.length - 1];
      signalLine.push(ema);
    }
  }

  // Calculate Histogram = MACD line - Signal line
  const histogram = [];
  for (let i = 0; i < macdLine.length && i < signalLine.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return {
    value: {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1],
    },
    history: {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram,
    },
    settings: {
      fastPeriod,
      slowPeriod,
      signalPeriod,
    },
    timestamp: priceData.timestamp,
  };
};

/**
 * Calculate Bollinger Bands
 * @param {Object} priceData - Historical price data
 * @param {Object} settings - Indicator settings
 * @returns {Object} Calculated Bollinger Bands values
 */
const calculateBollingerBands = (priceData, settings) => {
  const period = settings.period || 20;
  const deviations = settings.deviations || 2;
  const priceField = settings.priceField || "close";

  const prices = priceData.history.map((candle) => candle[priceField]);

  if (prices.length < period) {
    throw new Error(
      `Not enough data to calculate Bollinger Bands(${period},${deviations})`
    );
  }

  // Calculate SMA
  const sma = calculateSMA(priceData, { period, priceField });

  // Calculate standard deviation and bands
  const upperBand = [];
  const lowerBand = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma.history[i - (period - 1)];

    // Calculate standard deviation
    const variance =
      slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    // Calculate bands
    upperBand.push(mean + deviations * stdDev);
    lowerBand.push(mean - deviations * stdDev);
  }

  return {
    value: {
      middle: sma.value,
      upper: upperBand[upperBand.length - 1],
      lower: lowerBand[lowerBand.length - 1],
    },
    history: {
      middle: sma.history,
      upper: upperBand,
      lower: lowerBand,
    },
    settings: {
      period,
      deviations,
    },
    timestamp: priceData.timestamp,
  };
};

module.exports = {
  applyIndicator,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
};
