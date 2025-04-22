const mongoose = require("mongoose");
const Strategy = require("../models/strategyModel");
const { applyIndicator } = require("../helpers/indicatorHelpers");
const { evaluateCondition } = require("../helpers/conditionHelpers");
const { executeAction } = require("../helpers/actionHelpers");

// Paper Trading Session Model (in-memory storage for now)
const paperTradingSessions = new Map();

/**
 * Create a new paper trading session
 * @param {String} userId - User ID
 * @param {String} strategyId - Strategy ID
 * @param {Object} options - Paper trading options
 * @returns {Object} - Paper trading session
 */
const createSession = async (userId, strategyId, options = {}) => {
  try {
    // Fetch the strategy
    const strategy = await Strategy.findById(strategyId);

    if (!strategy) {
      throw new Error("Strategy not found");
    }

    if (strategy.user.toString() !== userId) {
      throw new Error("Not authorized to access this strategy");
    }

    // Create a unique session ID
    const sessionId = `${userId}-${strategyId}-${Date.now()}`;

    // Set up the session with default options
    const session = {
      id: sessionId,
      userId,
      strategyId,
      strategy: strategy.toObject(),
      status: "active",
      startTime: new Date(),
      initialCapital: options.initialCapital || 10000,
      currentCapital: options.initialCapital || 10000,
      cashBalance: options.initialCapital || 10000,
      positions: [],
      transactions: [],
      metrics: {
        totalPnL: 0,
        percentReturn: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
      },
      settings: {
        symbols: options.symbols || strategy.symbols || ["SPY"],
        timePeriod: options.timePeriod || "1d",
        autoRun: options.autoRun || false,
        riskPerTrade: options.riskPerTrade || 0.02, // 2% per trade
      },
      lastUpdated: new Date(),
      errors: [],
    };

    // Store the session
    paperTradingSessions.set(sessionId, session);

    return session;
  } catch (error) {
    console.error("Error creating paper trading session:", error);
    throw error;
  }
};

/**
 * Get a paper trading session
 * @param {String} sessionId - Session ID
 * @param {String} userId - User ID for authorization
 * @returns {Object} - Paper trading session
 */
const getSession = (sessionId, userId) => {
  const session = paperTradingSessions.get(sessionId);

  if (!session) {
    throw new Error("Paper trading session not found");
  }

  if (session.userId !== userId) {
    throw new Error("Not authorized to access this session");
  }

  return session;
};

/**
 * Get all paper trading sessions for a user
 * @param {String} userId - User ID
 * @returns {Array} - Array of paper trading sessions
 */
const getUserSessions = (userId) => {
  const userSessions = [];

  for (const [_, session] of paperTradingSessions) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }

  return userSessions;
};

/**
 * Update a paper trading session with new market data
 * @param {String} sessionId - Session ID
 * @param {Object} marketData - Latest market data
 * @returns {Object} - Updated session
 */
const updateSession = (sessionId, marketData) => {
  const session = paperTradingSessions.get(sessionId);

  if (!session) {
    throw new Error("Paper trading session not found");
  }

  try {
    // Process the market data through the strategy
    const { signals, indicators } = processStrategy(
      session.strategy,
      marketData
    );

    // Execute any signals (buy/sell orders)
    if (signals.length > 0) {
      executeSignals(session, signals, marketData);
    }

    // Update positions with latest prices
    updatePositions(session, marketData);

    // Update session metrics
    updateMetrics(session);

    // Update last update time
    session.lastUpdated = new Date();

    return session;
  } catch (error) {
    console.error("Error updating paper trading session:", error);
    session.errors.push({
      time: new Date(),
      message: error.message,
    });
    return session;
  }
};

/**
 * Process a strategy with the latest market data to generate trading signals
 * @param {Object} strategy - Trading strategy
 * @param {Object} marketData - Latest market data
 * @returns {Object} - Trading signals and calculated indicators
 */
const processStrategy = (strategy, marketData) => {
  const signals = [];
  const indicators = {};

  try {
    // Process indicator blocks first
    for (const block of strategy.blocks) {
      if (block.type === "indicator") {
        const indicatorResult = applyIndicator(block, marketData);
        indicators[block.id] = indicatorResult;
      }
    }

    // Process condition blocks
    for (const block of strategy.blocks) {
      if (block.type === "condition") {
        const conditionResult = evaluateCondition(
          block,
          marketData,
          indicators
        );

        // If condition is true, process connected action blocks
        if (conditionResult) {
          const actions = strategy.blocks.filter((b) => b.type === "action");
          for (const actionBlock of actions) {
            const signal = executeAction(actionBlock, marketData, indicators);
            if (signal) {
              signals.push(signal);
            }
          }
        }
      }
    }

    return { signals, indicators };
  } catch (error) {
    console.error("Error processing strategy:", error);
    return { signals: [], indicators: {} };
  }
};

/**
 * Execute trading signals in the paper trading session
 * @param {Object} session - Paper trading session
 * @param {Array} signals - Trading signals
 * @param {Object} marketData - Latest market data
 */
const executeSignals = (session, signals, marketData) => {
  for (const signal of signals) {
    const { symbol, action, price, quantity, riskLevel } = signal;

    // Default to current market price if not specified
    const executionPrice = price || marketData[symbol]?.price || 0;

    if (executionPrice <= 0) {
      session.errors.push({
        time: new Date(),
        message: `Cannot execute ${action} for ${symbol} with invalid price: ${executionPrice}`,
      });
      continue;
    }

    // Calculate quantity based on risk level and available capital if not specified
    let tradeQuantity = quantity;
    if (!tradeQuantity) {
      const riskAmount =
        session.cashBalance * (riskLevel || session.settings.riskPerTrade);
      tradeQuantity = Math.floor(riskAmount / executionPrice);
    }

    // Execute the trade based on action type
    if (action === "buy" || action === "long") {
      // Check if we have enough cash
      const cost = executionPrice * tradeQuantity;
      if (cost > session.cashBalance) {
        session.errors.push({
          time: new Date(),
          message: `Insufficient funds to buy ${tradeQuantity} shares of ${symbol} at ${executionPrice}`,
        });
        continue;
      }

      // Add to positions
      const existingPosition = session.positions.find(
        (p) => p.symbol === symbol
      );
      if (existingPosition) {
        // Average down the position
        const totalShares = existingPosition.quantity + tradeQuantity;
        const totalCost =
          existingPosition.averageCost * existingPosition.quantity +
          executionPrice * tradeQuantity;
        existingPosition.averageCost = totalCost / totalShares;
        existingPosition.quantity = totalShares;
        existingPosition.lastUpdated = new Date();
      } else {
        // Create new position
        session.positions.push({
          symbol,
          quantity: tradeQuantity,
          averageCost: executionPrice,
          currentPrice: executionPrice,
          openTime: new Date(),
          lastUpdated: new Date(),
        });
      }

      // Update cash balance
      session.cashBalance -= cost;

      // Add transaction record
      session.transactions.push({
        time: new Date(),
        type: "buy",
        symbol,
        quantity: tradeQuantity,
        price: executionPrice,
        total: cost,
      });
    } else if (action === "sell" || action === "short") {
      // Find the position
      const positionIndex = session.positions.findIndex(
        (p) => p.symbol === symbol
      );

      if (positionIndex === -1) {
        session.errors.push({
          time: new Date(),
          message: `Cannot sell ${symbol} - no position found`,
        });
        continue;
      }

      const position = session.positions[positionIndex];

      // Check if we have enough shares
      if (position.quantity < tradeQuantity) {
        session.errors.push({
          time: new Date(),
          message: `Cannot sell ${tradeQuantity} shares of ${symbol} - only have ${position.quantity}`,
        });
        continue;
      }

      // Calculate sale value
      const saleValue = executionPrice * tradeQuantity;

      // Calculate profit/loss
      const profitLoss =
        (executionPrice - position.averageCost) * tradeQuantity;

      // Update the position
      position.quantity -= tradeQuantity;

      // If fully closed, remove the position
      if (position.quantity <= 0) {
        session.positions.splice(positionIndex, 1);
      } else {
        position.lastUpdated = new Date();
      }

      // Update cash balance
      session.cashBalance += saleValue;

      // Add transaction record
      session.transactions.push({
        time: new Date(),
        type: "sell",
        symbol,
        quantity: tradeQuantity,
        price: executionPrice,
        total: saleValue,
        profitLoss,
      });
    }
  }
};

/**
 * Update positions with latest market prices
 * @param {Object} session - Paper trading session
 * @param {Object} marketData - Latest market data
 */
const updatePositions = (session, marketData) => {
  for (const position of session.positions) {
    const { symbol } = position;

    // Update current price if we have data for this symbol
    if (marketData[symbol] && marketData[symbol].price) {
      position.currentPrice = marketData[symbol].price;
      position.lastUpdated = new Date();
    }
  }
};

/**
 * Update session metrics
 * @param {Object} session - Paper trading session
 */
const updateMetrics = (session) => {
  // Calculate current portfolio value
  let portfolioValue = session.cashBalance;

  for (const position of session.positions) {
    portfolioValue += position.currentPrice * position.quantity;
  }

  // Calculate profit/loss
  const totalPnL = portfolioValue - session.initialCapital;
  const percentReturn = (totalPnL / session.initialCapital) * 100;

  // Calculate trade metrics
  const completedTrades = session.transactions.filter((t) => t.type === "sell");
  const winningTrades = completedTrades.filter((t) => t.profitLoss > 0);
  const losingTrades = completedTrades.filter((t) => t.profitLoss <= 0);

  // Update session
  session.currentCapital = portfolioValue;
  session.metrics = {
    totalPnL,
    percentReturn,
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate:
      completedTrades.length > 0
        ? (winningTrades.length / completedTrades.length) * 100
        : 0,
  };
};

/**
 * Stop a paper trading session
 * @param {String} sessionId - Session ID
 * @param {String} userId - User ID for authorization
 * @returns {Object} - Final session state
 */
const stopSession = (sessionId, userId) => {
  const session = paperTradingSessions.get(sessionId);

  if (!session) {
    throw new Error("Paper trading session not found");
  }

  if (session.userId !== userId) {
    throw new Error("Not authorized to stop this session");
  }

  // Mark session as stopped
  session.status = "stopped";
  session.endTime = new Date();

  return session;
};

/**
 * Delete a paper trading session
 * @param {String} sessionId - Session ID
 * @param {String} userId - User ID for authorization
 * @returns {Boolean} - Success status
 */
const deleteSession = (sessionId, userId) => {
  const session = paperTradingSessions.get(sessionId);

  if (!session) {
    return false;
  }

  if (session.userId !== userId) {
    throw new Error("Not authorized to delete this session");
  }

  return paperTradingSessions.delete(sessionId);
};

module.exports = {
  createSession,
  getSession,
  getUserSessions,
  updateSession,
  stopSession,
  deleteSession,
};
