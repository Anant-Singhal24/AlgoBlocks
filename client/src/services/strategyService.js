import axios from "axios";

const API_URL = "/api/strategies";

// Enhanced axios instance with better error handling
const apiClient = axios.create({
  baseURL: "/api",
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "API Response Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// Create a new strategy
export const createStrategy = async (strategyData, token) => {
  try {
    // Sanitize the data by removing client-side IDs before sending to server
    const sanitizedData = sanitizeStrategyData(strategyData);

    // Extra safeguard: explicitly ensure no 'id' field is present
    delete sanitizedData.id;
    delete sanitizedData._id;

    console.log(
      "Creating strategy with data:",
      JSON.stringify(sanitizedData, null, 2)
    );
    const response = await apiClient.post("/strategies", sanitizedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Strategy creation error:", error);

    // Special handling for duplicate key error
    if (
      error.response?.status === 500 &&
      error.response?.data?.message?.includes("duplicate key error")
    ) {
      throw new Error(
        "Duplicate strategy error. Please try again with different data."
      );
    }

    throw new Error(
      error.response?.data?.message || "Failed to create strategy"
    );
  }
};

// Get all strategies for the user
export const getStrategies = async (token) => {
  try {
    const response = await apiClient.get("/strategies", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Get strategies error:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch strategies"
    );
  }
};

// Get a single strategy by ID
export const getStrategy = async (id, token) => {
  try {
    const response = await apiClient.get(`/strategies/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Get strategy ${id} error:`, error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch strategy"
    );
  }
};

// Update a strategy
export const updateStrategy = async (id, strategyData, token) => {
  try {
    // Sanitize the data by removing client-side IDs before sending to server
    const sanitizedData = sanitizeStrategyData(strategyData);

    console.log(
      `Updating strategy ${id} with data:`,
      JSON.stringify(sanitizedData, null, 2)
    );
    const response = await apiClient.put(`/strategies/${id}`, sanitizedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Update strategy ${id} error:`, error);
    throw new Error(
      error.response?.data?.message || "Failed to update strategy"
    );
  }
};

// Delete a strategy
export const deleteStrategy = async (id, token) => {
  try {
    const response = await apiClient.delete(`/strategies/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Delete strategy ${id} error:`, error);
    throw new Error(
      error.response?.data?.message || "Failed to delete strategy"
    );
  }
};

// Add a backtest result to a strategy
export const addBacktestResult = async (id, backtestResult, token) => {
  try {
    console.log(
      `Adding backtest to strategy ${id} with data:`,
      JSON.stringify(backtestResult, null, 2)
    );

    // Normalize the backtest result to ensure compatibility with the database schema
    const normalizedResult = normalizeBacktestResult(backtestResult);

    const response = await apiClient.post(
      `/strategies/${id}/backtest`,
      normalizedResult,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Add backtest to strategy ${id} error:`, error);
    throw new Error(
      error.response?.data?.message || "Failed to add backtest result"
    );
  }
};

/**
 * Normalize backtest result to ensure compatibility with the database schema
 * @param {Object} result - The backtest result from the API
 * @returns {Object} - Normalized backtest result
 */
const normalizeBacktestResult = (result) => {
  // Create a base structure with required fields
  const normalized = {
    strategy: result.strategy || "Custom Strategy",
    symbol: result.symbol || "Unknown",
    startDate: result.startDate || new Date().toISOString().split("T")[0],
    endDate: result.endDate || new Date().toISOString().split("T")[0],
    initialCapital: parseFloat(result.initialCapital || 10000),
  };

  // Handle metrics either as a nested object or individual properties
  if (result.metrics) {
    normalized.metrics = result.metrics;

    // Ensure individual metric fields are set for the schema
    normalized.totalReturn = result.metrics.totalReturn || 0;
    normalized.winRate = result.metrics.winRate || 0;
    normalized.maxDrawdown = result.metrics.maxDrawdown || 0;
    normalized.sharpeRatio = result.metrics.sharpeRatio || 0;
    normalized.averageWin = result.metrics.averageWin || 0;
    normalized.averageLoss = result.metrics.averageLoss || 0;
  }

  // Ensure trades array is properly formatted
  if (result.trades && Array.isArray(result.trades)) {
    // Convert any string dates to proper format and ensure numeric values are numbers
    normalized.trades = result.trades.map((trade) => ({
      entryDate:
        typeof trade.entryDate === "string"
          ? trade.entryDate
          : new Date(trade.entryDate).toISOString().split("T")[0],
      exitDate:
        typeof trade.exitDate === "string"
          ? trade.exitDate
          : new Date(trade.exitDate).toISOString().split("T")[0],
      entryPrice: parseFloat(trade.entryPrice),
      exitPrice: parseFloat(trade.exitPrice),
      type: trade.type || "unknown",
      profit: parseFloat(trade.profit || 0),
    }));

    // Calculate trade statistics
    const winningTrades = normalized.trades.filter((t) => t.profit > 0);
    const losingTrades = normalized.trades.filter((t) => t.profit <= 0);

    normalized.totalTrades = normalized.trades.length;
    normalized.winningTrades = winningTrades.length;
    normalized.losingTrades = losingTrades.length;
  } else {
    normalized.trades = [];
    normalized.totalTrades = 0;
    normalized.winningTrades = 0;
    normalized.losingTrades = 0;
  }

  // Include equity curve if present
  if (result.equity && Array.isArray(result.equity)) {
    normalized.equity = result.equity.map((v) => parseFloat(v));

    // Calculate final capital if not provided
    if (!normalized.finalCapital && normalized.equity.length > 0) {
      normalized.finalCapital = normalized.equity[normalized.equity.length - 1];
    }
  } else {
    normalized.equity = [normalized.initialCapital];
    normalized.finalCapital = normalized.initialCapital;
  }

  // Include any other fields from the original result
  return {
    ...normalized,
    data: result.data || {},
    parameters: result.parameters || {},
    message: result.message || "",
  };
};

// Run a backtest for a strategy
export const runBacktest = async (id, backtestOptions, token) => {
  try {
    console.log(
      `Running backtest for strategy ${id} with options:`,
      backtestOptions
    );

    const response = await apiClient.post(
      `/strategies/${id}/run-backtest`,
      backtestOptions,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout for backtest requests
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Run backtest error for strategy ${id}:`, error);

    // Handle specific error types
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "The request timed out. The backtest may be taking too long or the service is unavailable."
      );
    }

    if (!error.response) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }

    if (error.response.status === 401) {
      throw new Error("Authentication error. Please log in again.");
    }

    if (error.response.status === 503) {
      throw new Error(
        "Backtest service is currently unavailable. Please try again later."
      );
    }

    throw new Error(error.response?.data?.message || "Failed to run backtest");
  }
};

// Helper function to sanitize strategy data before sending to server
const sanitizeStrategyData = (data) => {
  // Create a deep copy of the data
  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove id and _id fields from the root level
  delete sanitized.id;
  delete sanitized._id;

  // Sanitize blocks if they exist
  if (sanitized.blocks && Array.isArray(sanitized.blocks)) {
    sanitized.blocks = sanitized.blocks.map((block) => {
      // Create a fresh copy without any id fields
      const blockCopy = { ...block };
      delete blockCopy.id;
      delete blockCopy._id;
      return blockCopy;
    });
  }

  // Sanitize backtestResults if they exist
  if (sanitized.backtestResults && Array.isArray(sanitized.backtestResults)) {
    sanitized.backtestResults = sanitized.backtestResults.map((result) => {
      // Create a fresh copy without any id fields
      const resultCopy = { ...result };
      delete resultCopy.id;
      delete resultCopy._id;
      return resultCopy;
    });
  }

  return sanitized;
};
