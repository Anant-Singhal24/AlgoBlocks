const axios = require("axios");

// Configuration
const BACKTEST_SERVICE_URL =
  process.env.BACKTEST_SERVICE_URL || "http://localhost:5001";

/**
 * Run a backtest on a strategy
 * @param {Object} strategy - The strategy object with blocks, parameters, etc.
 * @param {Object} options - Options for the backtest (timeframe, dates, etc.)
 * @returns {Promise<Object>} - Backtest results
 */
const runBacktest = async (strategy, options = {}) => {
  try {
    console.log("Running backtest for strategy:", strategy.name);

    // Combine strategy data with backtest options
    const backtestConfig = {
      name: strategy.name,
      description: strategy.description,
      blocks: strategy.blocks,
      symbol: options.symbol || "SPY", // Default to SPY
      startDate: options.startDate || getDefaultStartDate(),
      endDate: options.endDate || new Date().toISOString().split("T")[0],
      initialCapital: options.initialCapital || 10000,
      timeframe: options.timeframe || "1d",
      strategy: "custom", // Always use the custom strategy in the Python service
    };

    console.log(
      "Sending backtest request with config:",
      JSON.stringify(backtestConfig, null, 2)
    );

    // Check if the Python service is available
    const isServiceRunning = await isBacktestServiceRunning();

    if (isServiceRunning) {
      // Send request to the Python backtest service
      try {
        const response = await axios.post(
          `${BACKTEST_SERVICE_URL}/backtest`,
          backtestConfig
        );

        if (response.data && response.data.error) {
          throw new Error(response.data.error);
        }

        console.log("Backtest completed successfully");
        return response.data;
      } catch (serviceError) {
        console.error("Error from backtest service:", serviceError.message);
        console.log("Falling back to mock backtest results");
        return generateMockBacktestResults(backtestConfig);
      }
    } else {
      console.log("Backtest service unavailable, using mock results");
      return generateMockBacktestResults(backtestConfig);
    }
  } catch (error) {
    console.error("Error running backtest:", error.message);
    throw new Error(`Backtest error: ${error.message}`);
  }
};

/**
 * Generate mock backtest results when the backtest service is unavailable
 * @param {Object} config - Strategy and backtest configuration
 * @returns {Object} Mock backtest results
 */
const generateMockBacktestResults = (config) => {
  const { symbol, startDate, endDate, initialCapital, name } = config;
  const finalCapital = initialCapital * (1 + (Math.random() * 0.3 - 0.1)); // ±20% change

  // Calculate performance metrics
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;
  const winRate = Math.random() * 60 + 20; // 20% to 80%
  const numTrades = Math.floor(Math.random() * 20) + 5; // 5 to 25 trades
  const winningTrades = Math.floor(numTrades * (winRate / 100));
  const losingTrades = numTrades - winningTrades;

  // Calculate average win/loss amounts
  const avgWinAmount = initialCapital * 0.02 * (1 + Math.random()); // 2-4% per winning trade
  const avgLossAmount = initialCapital * 0.01 * (1 + Math.random()); // 1-2% per losing trade

  // Mock trades
  const trades = [];
  const startTimestamp = new Date(startDate).getTime();
  const endTimestamp = new Date(endDate).getTime();
  const timeRange = endTimestamp - startTimestamp;

  // Generate random start price between 50 and 500
  let basePrice = 100 + Math.random() * 400;

  for (let i = 0; i < numTrades; i++) {
    const entryTimestamp = startTimestamp + Math.random() * (timeRange * 0.7);
    const exitTimestamp = entryTimestamp + Math.random() * (timeRange * 0.3);

    const entryDate = new Date(entryTimestamp).toISOString().split("T")[0];
    const exitDate = new Date(exitTimestamp).toISOString().split("T")[0];

    const entryPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% variation
    const exitPrice = entryPrice * (1 + (Math.random() * 0.2 - 0.1)); // ±10% variation

    basePrice = exitPrice; // Update price for next trade

    const isLong = Math.random() > 0.5;
    const tradeType = isLong ? "long" : "short";

    // Calculate profit based on trade type
    let profit;
    if (isLong) {
      profit = (exitPrice - entryPrice) * (initialCapital / entryPrice);
    } else {
      profit = (entryPrice - exitPrice) * (initialCapital / entryPrice);
    }

    trades.push({
      entryDate: entryDate,
      exitDate: exitDate,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      type: tradeType,
      profit: parseFloat(profit.toFixed(2)),
    });
  }

  // Sort trades by date
  trades.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

  // Calculate equity curve
  let equity = [initialCapital];
  let currentEquity = initialCapital;
  for (const trade of trades) {
    currentEquity += trade.profit;
    equity.push(parseFloat(currentEquity.toFixed(2)));
  }

  // Generate data points for price chart
  const numDays = Math.max(
    30,
    Math.floor((endTimestamp - startTimestamp) / (24 * 60 * 60 * 1000))
  );
  const dates = [];
  const prices = [];

  let simulatedPrice = basePrice * 0.5; // Start at half the final price
  for (let i = 0; i <= numDays; i++) {
    const date = new Date(startTimestamp + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split("T")[0]);

    // Generate a somewhat realistic price movement
    const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // ±1% daily change
    simulatedPrice = simulatedPrice * randomFactor;
    prices.push(parseFloat(simulatedPrice.toFixed(2)));
  }

  // Calculate max drawdown
  let peak = equity[0];
  let maxDrawdown = 0;
  for (const value of equity) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  // Prepare the result structure that matches our MongoDB schema
  return {
    // Required fields for MongoDB
    strategy: "Custom Strategy (Simulated)",
    symbol: symbol,
    startDate: startDate,
    endDate: endDate,
    initialCapital: parseFloat(initialCapital),
    finalCapital: parseFloat(currentEquity.toFixed(2)),

    // Metrics as a nested object (for the frontend)
    metrics: {
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      winRate: parseFloat(winRate.toFixed(2)),
      averageWin: parseFloat(avgWinAmount.toFixed(2)),
      averageLoss: parseFloat(avgLossAmount.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: parseFloat((Math.random() * 1.5).toFixed(2)),
    },

    // Individual metric fields (for the MongoDB schema)
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalTrades: numTrades,
    winningTrades: winningTrades,
    losingTrades: losingTrades,
    winRate: parseFloat(winRate.toFixed(2)),
    avgWin: parseFloat(avgWinAmount.toFixed(2)),
    avgLoss: parseFloat(avgLossAmount.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    sharpeRatio: parseFloat((Math.random() * 1.5).toFixed(2)),

    // Chart data
    data: {
      dates: dates,
      prices: prices,
    },

    // Trade records
    trades: trades,

    // Equity curve
    equity: equity,

    // Additional info
    parameters: config,
    message:
      "This is a simulated backtest result as the Python backtesting service is currently unavailable.",
  };
};

/**
 * Get a default start date (1 year ago)
 * @returns {string} ISO date string YYYY-MM-DD
 */
const getDefaultStartDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
};

/**
 * Check if the backtest service is running
 * @returns {Promise<boolean>} Whether the service is running
 */
const isBacktestServiceRunning = async () => {
  try {
    // Try to ping the service
    await axios.get(`${BACKTEST_SERVICE_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    console.error("Backtest service is not available:", error.message);
    return false;
  }
};

module.exports = {
  runBacktest,
  isBacktestServiceRunning,
};
