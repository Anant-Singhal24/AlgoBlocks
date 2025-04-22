const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  startSession,
  getUserSessions,
  getSession,
  updateSession,
  stopSession,
  deleteSession,
} = require("../controllers/paperTradingController");

// All routes are protected with authentication
router.use(protect);

// Get all sessions and create a new session
router.route("/").get(getUserSessions).post(startSession);

// Get, update, and delete a specific session
router.route("/:id").get(getSession).delete(deleteSession);

// Update a session with latest market data
router.put("/:id/update", updateSession);

// Stop a session
router.put("/:id/stop", stopSession);

module.exports = router;
