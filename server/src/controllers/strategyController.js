const asyncHandler = require("express-async-handler");
const Strategy = require("../models/strategyModel");
const backtestService = require("../services/backtestService");

// @desc    Get all strategies for a user
// @route   GET /api/strategies
// @access  Private
const getStrategies = asyncHandler(async (req, res) => {
  const strategies = await Strategy.find({ user: req.user.id });
  res.status(200).json(strategies);
});

// @desc    Get single strategy
// @route   GET /api/strategies/:id
// @access  Private
const getStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);

  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  // Make sure the logged in user matches the strategy user
  if (strategy.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to access this strategy");
  }

  res.status(200).json(strategy);
});

// @desc    Create new strategy
// @route   POST /api/strategies
// @access  Private
const createStrategy = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    res.status(400);
    throw new Error("Please add a strategy name");
  }

  // Remove any client-side id field to prevent duplicate key errors
  const { id, _id, ...strategyData } = req.body;

  // Clean up any nested objects to ensure no id fields remain
  let cleanedBlocks = [];
  if (strategyData.blocks && Array.isArray(strategyData.blocks)) {
    cleanedBlocks = strategyData.blocks.map((block) => {
      // Create a fresh copy excluding any id fields
      const { id, _id, ...blockData } = block;
      return blockData;
    });
  }

  try {
    const strategy = await Strategy.create({
      name: strategyData.name,
      description: strategyData.description || "",
      marketType: strategyData.marketType || "stocks",
      timeframe: strategyData.timeframe || "1d",
      symbols: strategyData.symbols || [],
      blocks: cleanedBlocks,
      status: strategyData.status || "draft",
      user: req.user.id,
    });

    res.status(201).json(strategy);
  } catch (error) {
    // Handle MongoDB duplicate key error if it still occurs
    if (error.code === 11000) {
      console.error("Duplicate key error:", error);
      res.status(400);
      throw new Error(
        `Duplicate key error. Please try again with a different name.`
      );
    }
    throw error;
  }
});

// @desc    Update strategy
// @route   PUT /api/strategies/:id
// @access  Private
const updateStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);

  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  // Make sure the logged in user matches the strategy user
  if (strategy.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to update this strategy");
  }

  // Remove any client-side id field to prevent duplicate key errors
  const { id, _id, ...strategyData } = req.body;

  // Handle any nested blocks that may contain client-side IDs
  if (strategyData.blocks) {
    strategyData.blocks = strategyData.blocks.map((block) => {
      // Create a copy without the id field if it exists
      const { id, ...blockData } = block;
      return blockData;
    });
  }

  const updatedStrategy = await Strategy.findByIdAndUpdate(
    req.params.id,
    strategyData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedStrategy);
});

// @desc    Delete strategy
// @route   DELETE /api/strategies/:id
// @access  Private
const deleteStrategy = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);

  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  // Make sure the logged in user matches the strategy user
  if (strategy.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to delete this strategy");
  }

  await Strategy.findByIdAndDelete(req.params.id);

  res.status(200).json({ id: req.params.id });
});

// @desc    Add backtest result to strategy
// @route   POST /api/strategies/:id/backtest
// @access  Private
const addBacktestResult = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);

  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  // Make sure the logged in user matches the strategy user
  if (strategy.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to add backtest to this strategy");
  }

  try {
    // Normalize and validate the backtest result
    const backtestResult = normalizeBacktestResult(req.body);

    // Add to strategy's backtest results array
    strategy.backtestResults.push(backtestResult);
    await strategy.save();

    res.status(201).json(strategy);
  } catch (error) {
    console.error("Error adding backtest result:", error);
    res.status(400);
    throw new Error(`Failed to add backtest result: ${error.message}`);
  }
});

// @desc    Run backtest on a strategy
// @route   POST /api/strategies/:id/run-backtest
// @access  Private
const runStrategyBacktest = asyncHandler(async (req, res) => {
  const strategy = await Strategy.findById(req.params.id);

  if (!strategy) {
    res.status(404);
    throw new Error("Strategy not found");
  }

  // Make sure the logged in user matches the strategy user
  if (strategy.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to backtest this strategy");
  }

  try {
    // Get backtest options from request body
    const options = {
      symbol: req.body.symbol || "SPY",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      initialCapital: req.body.initialCapital || 10000,
      timeframe: req.body.timeframe || "1d",
      strategy: "custom", // Always use custom strategy for user-defined strategies
    };

    // Run the backtest - the service will automatically fall back to mock results if needed
    const backtestResult = await backtestService.runBacktest(
      strategy.toObject(),
      options
    );

    // Normalize backtest result to ensure it fits the schema
    const normalizedResult = normalizeBacktestResult(backtestResult);

    // Add backtest result to the strategy
    strategy.backtestResults.push(normalizedResult);
    await strategy.save();

    res.status(200).json({
      strategy: strategy,
      backtestResult: backtestResult, // Return the original result to the client
    });
  } catch (error) {
    console.error("Error running backtest:", error);
    res.status(500);
    throw new Error(`Failed to run backtest: ${error.message}`);
  }
});

/**
 * Normalize backtest result to ensure compatibility with the database schema
 * @param {Object} result - Raw backtest result
 * @returns {Object} - Normalized result
 */
const normalizeBacktestResult = (result) => {
  // Create a base normalized object with minimum required fields
  const normalized = {
    startDate: result.startDate || new Date().toISOString().split("T")[0],
    endDate: result.endDate || new Date().toISOString().split("T")[0],
    initialCapital: parseFloat(
      result.initialCapital || result.parameters?.initialCapital || 10000
    ),
    finalCapital: parseFloat(
      result.finalCapital ||
        result.metrics?.finalCapital ||
        result.initialCapital ||
        10000
    ),
    totalReturn: parseFloat(
      result.totalReturn || result.metrics?.totalReturn || 0
    ),
    totalTrades: parseInt(result.totalTrades || 0),
    winningTrades: parseInt(result.winningTrades || 0),
    losingTrades: parseInt(result.losingTrades || 0),
    winRate: parseFloat(result.winRate || result.metrics?.winRate || 0),
    avgWin: parseFloat(result.avgWin || result.metrics?.averageWin || 0),
    avgLoss: parseFloat(result.avgLoss || result.metrics?.averageLoss || 0),
    maxDrawdown: parseFloat(
      result.maxDrawdown || result.metrics?.maxDrawdown || 0
    ),
    sharpeRatio: parseFloat(
      result.sharpeRatio || result.metrics?.sharpeRatio || 0
    ),
  };

  // Handle trades array if present
  if (result.trades && Array.isArray(result.trades)) {
    // Ensure trades have the right format
    normalized.trades = result.trades.map((trade) => ({
      date: trade.exitDate || new Date().toISOString().split("T")[0],
      type: trade.type || "unknown",
      price: parseFloat(trade.exitPrice || 0),
      quantity: 1, // Default quantity
      value: parseFloat(trade.profit || 0),
    }));
  } else {
    normalized.trades = [];
  }

  return normalized;
};

module.exports = {
  getStrategies,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  addBacktestResult,
  runStrategyBacktest,
};
