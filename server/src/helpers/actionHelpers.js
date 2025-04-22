/**
 * Helper functions for executing trading actions
 */

/**
 * Execute a trading action based on its subtype
 * @param {Object} block - The action block from the strategy
 * @param {Object} marketData - Market data to use for execution
 * @param {Object} indicators - Calculated indicators from previous blocks
 * @returns {Object|null} Trading signal to be executed
 */
const executeAction = (block, marketData, indicators) => {
  const { subtype, settings } = block;

  // Select the action execution function based on subtype
  switch (subtype) {
    case "buy":
      return executeBuyOrder(settings, marketData, indicators);
    case "sell":
      return executeSellOrder(settings, marketData, indicators);
    case "stop_loss":
      return executeStopLoss(settings, marketData, indicators);
    case "take_profit":
      return executeTakeProfit(settings, marketData, indicators);
    default:
      console.error(`Unknown action type: ${subtype}`);
      return null;
  }
};

/**
 * Execute a buy order
 * @param {Object} settings - Action settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Object} Buy order signal
 */
const executeBuyOrder = (settings, marketData, indicators) => {
  const {
    symbol = "SPY",
    orderType = "market",
    quantity,
    price,
    riskLevel = 0.02,
  } = settings;

  // Get current price if not specified or for market orders
  let executionPrice = price;
  if (!executionPrice || orderType === "market") {
    const symbolData = marketData[symbol];
    if (!symbolData || !symbolData.price) {
      console.error(`No price data available for ${symbol}`);
      return null;
    }
    executionPrice = symbolData.price;
  }

  // Create a buy signal
  return {
    action: "buy",
    symbol,
    orderType,
    price: executionPrice,
    quantity: quantity ? parseInt(quantity, 10) : undefined,
    riskLevel: parseFloat(riskLevel),
    timestamp: new Date(),
  };
};

/**
 * Execute a sell order
 * @param {Object} settings - Action settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Object} Sell order signal
 */
const executeSellOrder = (settings, marketData, indicators) => {
  const {
    symbol = "SPY",
    orderType = "market",
    quantity,
    price,
    percentage = 100, // Default to selling all (100%)
  } = settings;

  // Get current price if not specified or for market orders
  let executionPrice = price;
  if (!executionPrice || orderType === "market") {
    const symbolData = marketData[symbol];
    if (!symbolData || !symbolData.price) {
      console.error(`No price data available for ${symbol}`);
      return null;
    }
    executionPrice = symbolData.price;
  }

  // Calculate quantity if percentage is specified but not quantity
  let executionQuantity = quantity;
  if (!executionQuantity && percentage) {
    // Note: The actual quantity will be calculated in the paper trading service
    // based on the current position size
    executionQuantity = undefined; // Let the service handle it
  }

  // Create a sell signal
  return {
    action: "sell",
    symbol,
    orderType,
    price: executionPrice,
    quantity: executionQuantity ? parseInt(executionQuantity, 10) : undefined,
    percentage: parseFloat(percentage) / 100, // Convert to decimal (e.g., 50% -> 0.5)
    timestamp: new Date(),
  };
};

/**
 * Execute a stop loss order
 * @param {Object} settings - Action settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Object|null} Stop loss signal if triggered
 */
const executeStopLoss = (settings, marketData, indicators) => {
  const {
    symbol = "SPY",
    type = "price", // price or percentage
    value, // Stop price or percentage from entry
    trailingType = "none", // none, fixed, percentage
    trailingValue = 0,
  } = settings;

  // Get current price data
  const symbolData = marketData[symbol];
  if (!symbolData || !symbolData.price) {
    console.error(`No price data available for ${symbol}`);
    return null;
  }

  const currentPrice = symbolData.price;

  // This is just a signal to set up a stop loss, not an actual execution
  // The paper trading service will track and execute the stop loss when triggered
  return {
    action: "stop_loss",
    symbol,
    type,
    value: parseFloat(value),
    price: currentPrice, // Current price when the stop is set
    trailingType,
    trailingValue: parseFloat(trailingValue || 0),
    timestamp: new Date(),
  };
};

/**
 * Execute a take profit order
 * @param {Object} settings - Action settings
 * @param {Object} marketData - Market data
 * @param {Object} indicators - Calculated indicators
 * @returns {Object|null} Take profit signal if triggered
 */
const executeTakeProfit = (settings, marketData, indicators) => {
  const {
    symbol = "SPY",
    type = "price", // price or percentage
    value, // Target price or percentage from entry
  } = settings;

  // Get current price data
  const symbolData = marketData[symbol];
  if (!symbolData || !symbolData.price) {
    console.error(`No price data available for ${symbol}`);
    return null;
  }

  const currentPrice = symbolData.price;

  // This is just a signal to set up a take profit, not an actual execution
  // The paper trading service will track and execute the take profit when triggered
  return {
    action: "take_profit",
    symbol,
    type,
    value: parseFloat(value),
    price: currentPrice, // Current price when the take profit is set
    timestamp: new Date(),
  };
};

/**
 * Calculate position size based on risk management settings
 * @param {Object} settings - Risk management settings
 * @param {Number} accountSize - Current account size
 * @param {Number} price - Asset price
 * @param {Number} stopLossPrice - Stop loss price
 * @returns {Number} Quantity to trade
 */
const calculatePositionSize = (settings, accountSize, price, stopLossPrice) => {
  const { riskPerTrade = 0.02 } = settings; // Default 2% risk per trade

  // Calculate risk amount in currency
  const riskAmount = accountSize * riskPerTrade;

  // Calculate risk per share
  const riskPerShare = Math.abs(price - stopLossPrice);

  // Calculate position size
  const positionSize = Math.floor(riskAmount / riskPerShare);

  return positionSize;
};

module.exports = {
  executeAction,
  executeBuyOrder,
  executeSellOrder,
  executeStopLoss,
  executeTakeProfit,
  calculatePositionSize,
};
