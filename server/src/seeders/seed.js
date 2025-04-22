const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Strategy = require("../models/strategyModel");

// Load environment variables
dotenv.config();

// Connect to database
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected for seeding"))
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Hash password function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Strategy.deleteMany();

    console.log("Data cleaned");

    // Create users
    const password = await hashPassword("password123");

    const demoUser = await User.create({
      name: "Demo User",
      email: "demo@example.com",
      password,
    });

    const johnDoe = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password,
    });

    console.log("Users created");

    // Create strategies for Demo User
    const strategies = [
      {
        name: "Moving Average Crossover",
        description:
          "A strategy that triggers buy/sell signals when a fast moving average crosses a slow moving average",
        status: "active",
        marketType: "stocks",
        symbols: ["AAPL", "MSFT", "GOOGL"],
        timeframe: "1d",
        user: demoUser._id,
        blocks: [
          {
            type: "indicator",
            name: "Simple Moving Average",
            subtype: "sma",
            settings: { period: 20, source: "close" },
            position: 0,
          },
          {
            type: "indicator",
            name: "Simple Moving Average",
            subtype: "sma",
            settings: { period: 50, source: "close" },
            position: 1,
          },
          {
            type: "condition",
            name: "Crossover",
            subtype: "crossover",
            settings: {
              comparison: "crosses_above",
              indicator1: 0, // References first SMA
              indicator2: 1, // References second SMA
            },
            position: 2,
          },
          {
            type: "action",
            name: "Buy Order",
            subtype: "buy",
            settings: { amount: 100, orderType: "market" },
            position: 3,
          },
        ],
      },
      {
        name: "RSI Overbought/Oversold",
        description:
          "Identifies potential reversal points when RSI reaches extreme levels",
        status: "paused",
        marketType: "forex",
        symbols: ["EUR/USD", "GBP/USD"],
        timeframe: "4h",
        user: demoUser._id,
        blocks: [
          {
            type: "indicator",
            name: "Relative Strength Index",
            subtype: "rsi",
            settings: { period: 14, overbought: 70, oversold: 30 },
            position: 0,
          },
          {
            type: "condition",
            name: "Threshold",
            subtype: "threshold",
            settings: {
              indicator: 0,
              comparison: "crosses_below",
              value: 30,
            },
            position: 1,
          },
          {
            type: "action",
            name: "Buy Order",
            subtype: "buy",
            settings: { amount: 1000, orderType: "market" },
            position: 2,
          },
        ],
      },
    ];

    await Strategy.insertMany(strategies);
    console.log("Strategies created");

    console.log("Database seeded!");
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
