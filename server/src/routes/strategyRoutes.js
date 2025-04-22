const express = require("express");
const router = express.Router();
const {
  getStrategies,
  getStrategy,
  createStrategy,
  updateStrategy,
  deleteStrategy,
  addBacktestResult,
  runStrategyBacktest,
} = require("../controllers/strategyController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes in this router
router.use(protect);

router.route("/").get(getStrategies).post(createStrategy);

router
  .route("/:id")
  .get(getStrategy)
  .put(updateStrategy)
  .delete(deleteStrategy);

router.route("/:id/backtest").post(addBacktestResult);

router.route("/:id/run-backtest").post(runStrategyBacktest);

module.exports = router;
