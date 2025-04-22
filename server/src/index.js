const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Function to fix MongoDB index issue
const fixMongoDBDuplicateKeyIssue = async () => {
  try {
    // Get the MongoDB connection from mongoose
    const mongoose = require("mongoose");
    const db = mongoose.connection;

    // Wait until database is connected
    if (db.readyState !== 1) {
      console.log("Waiting for database connection before fixing indexes...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("Checking for problematic indexes...");
    const strategiesCollection = db.collection("strategies");

    // List all indexes
    const indexes = await strategiesCollection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    // Check for problematic index
    for (const index of indexes) {
      if (index.key && index.key.id === 1) {
        console.log(
          `Found index on 'id' field: "${index.name}". Attempting to drop it...`
        );
        try {
          await strategiesCollection.dropIndex(index.name);
          console.log(`Successfully dropped index: ${index.name}`);
        } catch (err) {
          console.error(`Error dropping index ${index.name}:`, err);
        }
      }
    }

    // Clean up documents with null id
    const result = await strategiesCollection.updateMany(
      { id: null },
      { $unset: { id: "" } }
    );
    console.log(`Removed 'id' field from ${result.modifiedCount} documents`);

    console.log("MongoDB index fix completed");
  } catch (error) {
    console.error("Error fixing MongoDB indexes:", error);
  }
};

// Connect to database
connectDB().then(async () => {
  // Run index fix after connecting to the database
  await fixMongoDBDuplicateKeyIssue();
});

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/strategies", require("./routes/strategyRoutes"));
app.use("/api/market", require("./routes/marketRoutes"));
app.use("/api/paper-trading", require("./routes/paperTradingRoutes"));

// API test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is running" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
