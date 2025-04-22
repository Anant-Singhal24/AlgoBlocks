const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Get MongoDB URI from environment or use default for local development
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

console.log("Using MongoDB URI:", MONGO_URI);

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const fixDuplicateKeys = async () => {
  try {
    // Get database and collection
    const db = mongoose.connection.db;
    const strategiesCollection = db.collection("strategies");

    console.log("Checking for problematic indexes...");

    // List all indexes
    const indexes = await strategiesCollection.indexes();
    console.log("Current indexes:", JSON.stringify(indexes, null, 2));

    // Find and drop all indexes related to 'id' field
    for (const index of indexes) {
      if (index.key && index.key.id) {
        console.log(
          `Found index on 'id' field: "${index.name}". Dropping it...`
        );
        try {
          await strategiesCollection.dropIndex(index.name);
          console.log(`Index ${index.name} dropped successfully`);
        } catch (err) {
          console.error(`Error dropping index ${index.name}:`, err);
        }
      }
    }

    // Update or remove documents with null 'id' value
    const nullIdResult = await strategiesCollection.updateMany(
      { id: null },
      { $unset: { id: "" } } // Remove the 'id' field entirely
    );

    console.log(
      `Cleaned up ${nullIdResult.modifiedCount} strategies with null id fields`
    );

    // Create a new non-unique, sparse index for 'id' field
    await strategiesCollection.createIndex(
      { id: 1 },
      {
        unique: false,
        sparse: true,
        name: "id_non_unique_sparse_index",
        background: true,
      }
    );

    console.log("Created new non-unique sparse index for id field");

    // Check if there are still documents with id: null
    const nullIdCount = await strategiesCollection.countDocuments({ id: null });
    if (nullIdCount > 0) {
      console.log(
        `WARNING: Still found ${nullIdCount} documents with null id. These may cause issues.`
      );
    }

    // Count strategies
    const strategyCount = await strategiesCollection.countDocuments();
    console.log(`Total strategy count: ${strategyCount}`);

    console.log("Fix completed successfully");
  } catch (error) {
    console.error("Error fixing duplicate keys:", error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

// Run the function
fixDuplicateKeys();
