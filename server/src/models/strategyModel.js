const mongoose = require("mongoose");

// Block schema (nested within strategy)
const blockSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["indicator", "condition", "action"],
    },
    name: {
      type: String,
      required: true,
    },
    subtype: {
      type: String,
      required: true,
    },
    // Store settings as flexible JSON
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

// Backtest result schema (nested within strategy)
const backtestResultSchema = mongoose.Schema(
  {
    strategy: {
      type: String,
      required: false,
    },
    symbol: {
      type: String,
      required: false,
    },
    startDate: {
      type: String, // Changed to String to be more flexible
      required: false,
    },
    endDate: {
      type: String, // Changed to String to be more flexible
      required: false,
    },
    initialCapital: {
      type: Number,
      required: false,
      default: 10000,
    },
    finalCapital: {
      type: Number,
      required: false,
    },
    // Metrics can now be a nested object or individual fields
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    totalReturn: {
      type: Number,
      required: false,
    },
    totalTrades: {
      type: Number,
      required: false,
    },
    winningTrades: {
      type: Number,
      required: false,
    },
    losingTrades: {
      type: Number,
      required: false,
    },
    winRate: {
      type: Number,
      required: false,
    },
    avgWin: {
      type: Number,
      required: false,
    },
    avgLoss: {
      type: Number,
      required: false,
    },
    maxDrawdown: {
      type: Number,
      required: false,
    },
    sharpeRatio: {
      type: Number,
      required: false,
    },
    // Make the trades array more flexible to accommodate different formats
    trades: {
      type: [
        {
          type: mongoose.Schema.Types.Mixed, // This allows any structure for trades
        },
      ],
      required: false,
      default: [],
    },
    // Data points for charts
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    // Equity curve
    equity: {
      type: [Number],
      required: false,
      default: [],
    },
    // Any additional parameters or message
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    message: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    strict: false, // Allow additional fields not defined in the schema
  }
);

// Main strategy schema
const strategySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Please add a strategy name"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "draft",
    },
    marketType: {
      type: String,
      enum: ["stocks", "forex", "crypto", "futures", "options"],
      default: "stocks",
    },
    symbols: {
      type: [String],
      default: [],
    },
    timeframe: {
      type: String,
      enum: ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"],
      default: "1d",
    },
    blocks: [blockSchema],
    backtestResults: [backtestResultSchema],
  },
  {
    timestamps: true,
    // Set id to false to prevent Mongoose from using _id as 'id' virtually
    id: false,
  }
);

// Hook to remove any 'id' field from the document before saving
strategySchema.pre("save", function (next) {
  // Delete any 'id' property if it exists
  if (this.id !== undefined) {
    delete this.id;
  }
  next();
});

module.exports = mongoose.model("Strategy", strategySchema);
