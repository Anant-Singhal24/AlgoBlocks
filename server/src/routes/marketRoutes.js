const express = require("express");
const {
  getMarketOverview,
  getHistoricalData,
  searchSymbols,
  getMarketData,
  searchStocks,
} = require("../controllers/marketController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/overview", getMarketOverview);

// Protected routes (require authentication)
router.get("/history/:symbol", protect, getHistoricalData);
router.get("/search", protect, searchSymbols);

// New routes for paper trading
router.get("/data/:symbol", protect, getMarketData);
router.get("/stocks/search", protect, searchStocks);

module.exports = router;
