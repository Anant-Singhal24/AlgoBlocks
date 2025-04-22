const { MongoClient } = require("mongodb");

async function dropIndex() {
  // Default connection for local development
  const uri = "mongodb://localhost:27017/test";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const collection = db.collection("strategies");

    // List all indexes
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);

    // Find the problematic index
    const idIndex = indexes.find((index) => index.key && index.key.id === 1);

    if (idIndex) {
      // Drop the index
      await collection.dropIndex(idIndex.name);
      console.log(`Successfully dropped index: ${idIndex.name}`);

      // Remove id field from documents with null id
      const result = await collection.updateMany(
        { id: null },
        { $unset: { id: "" } }
      );
      console.log(`Updated ${result.modifiedCount} documents with null id`);
    } else {
      console.log("No problematic index found");
    }

    // Create a new non-unique sparse index
    await collection.createIndex(
      { id: 1 },
      { unique: false, sparse: true, name: "id_non_unique_sparse" }
    );
    console.log("Created new non-unique sparse index");

    console.log("Operation completed successfully");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

dropIndex().catch(console.error);
