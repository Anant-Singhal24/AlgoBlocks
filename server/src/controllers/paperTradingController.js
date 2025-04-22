const asyncHandler = require("express-async-handler");
const paperTradingService = require("../services/paperTradingService");
const marketService = require("../services/marketService");

// @desc    Start a new paper trading session
// @route   POST /api/paper-trading
// @access  Private
const startSession = asyncHandler(async (req, res) => {
  const { strategyId, initialCapital, symbols, timeframe } = req.body;

  if (!strategyId) {
    res.status(400);
    throw new Error("Strategy ID is required");
  }

  try {
    const session = await paperTradingService.createSession(
      req.user.id,
      strategyId,
      {
        initialCapital: initialCapital || 10000,
        symbols: symbols,
        timePeriod: timeframe || "1d",
      }
    );

    res.status(201).json(session);
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to start paper trading session: ${error.message}`);
  }
});

// @desc    Get all paper trading sessions for the user
// @route   GET /api/paper-trading
// @access  Private
const getUserSessions = asyncHandler(async (req, res) => {
  try {
    const sessions = paperTradingService.getUserSessions(req.user.id);
    res.status(200).json(sessions);
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to get paper trading sessions: ${error.message}`);
  }
});

// @desc    Get a single paper trading session
// @route   GET /api/paper-trading/:id
// @access  Private
const getSession = asyncHandler(async (req, res) => {
  try {
    const session = paperTradingService.getSession(req.params.id, req.user.id);
    res.status(200).json(session);
  } catch (error) {
    res.status(404);
    throw new Error(`Paper trading session not found: ${error.message}`);
  }
});

// @desc    Update paper trading session with latest market data
// @route   PUT /api/paper-trading/:id/update
// @access  Private
const updateSession = asyncHandler(async (req, res) => {
  try {
    // Get the session first to know which symbols we need
    const session = paperTradingService.getSession(req.params.id, req.user.id);

    // Fetch latest market data for the symbols in the session
    const symbols = session.settings.symbols || ["SPY"];
    const marketData = {};

    for (const symbol of symbols) {
      try {
        // Get real-time and historical data
        const data = await marketService.getMarketData(
          symbol,
          session.settings.timePeriod
        );
        marketData[symbol] = data;
      } catch (dataError) {
        console.error(
          `Failed to get market data for ${symbol}:`,
          dataError.message
        );
        // Continue with other symbols even if one fails
      }
    }

    // Update the session with the latest market data
    const updatedSession = paperTradingService.updateSession(
      req.params.id,
      marketData
    );

    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to update paper trading session: ${error.message}`);
  }
});

// @desc    Stop a paper trading session
// @route   PUT /api/paper-trading/:id/stop
// @access  Private
const stopSession = asyncHandler(async (req, res) => {
  try {
    const session = paperTradingService.stopSession(req.params.id, req.user.id);
    res.status(200).json(session);
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to stop paper trading session: ${error.message}`);
  }
});

// @desc    Delete a paper trading session
// @route   DELETE /api/paper-trading/:id
// @access  Private
const deleteSession = asyncHandler(async (req, res) => {
  try {
    const success = paperTradingService.deleteSession(
      req.params.id,
      req.user.id
    );

    if (!success) {
      res.status(404);
      throw new Error("Paper trading session not found");
    }

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to delete paper trading session: ${error.message}`);
  }
});

module.exports = {
  startSession,
  getUserSessions,
  getSession,
  updateSession,
  stopSession,
  deleteSession,
};
