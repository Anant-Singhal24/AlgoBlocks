import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Start a new paper trading session
 * @param {String} strategyId - ID of the strategy to trade
 * @param {Object} options - Paper trading options
 * @param {String} token - JWT auth token
 * @returns {Promise<Object>} Created session
 */
export const startSession = async (strategyId, options = {}, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/paper-trading`,
      {
        strategyId,
        initialCapital: options.initialCapital,
        symbols: options.symbols,
        timeframe: options.timeframe,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error starting paper trading session:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to start paper trading session"
    );
  }
};

/**
 * Get all paper trading sessions for the current user
 * @param {String} token - JWT auth token
 * @returns {Promise<Array>} List of paper trading sessions
 */
export const getSessions = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/paper-trading`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching paper trading sessions:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch paper trading sessions"
    );
  }
};

/**
 * Get a specific paper trading session
 * @param {String} sessionId - ID of the session to fetch
 * @param {String} token - JWT auth token
 * @returns {Promise<Object>} Paper trading session
 */
export const getSession = async (sessionId, token) => {
  try {
    const response = await axios.get(`${API_URL}/paper-trading/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching paper trading session:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch paper trading session"
    );
  }
};

/**
 * Update a paper trading session with latest market data
 * @param {String} sessionId - ID of the session to update
 * @param {String} token - JWT auth token
 * @returns {Promise<Object>} Updated session
 */
export const updateSession = async (sessionId, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/paper-trading/${sessionId}/update`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating paper trading session:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to update paper trading session"
    );
  }
};

/**
 * Stop a paper trading session
 * @param {String} sessionId - ID of the session to stop
 * @param {String} token - JWT auth token
 * @returns {Promise<Object>} Final session state
 */
export const stopSession = async (sessionId, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/paper-trading/${sessionId}/stop`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error stopping paper trading session:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to stop paper trading session"
    );
  }
};

/**
 * Delete a paper trading session
 * @param {String} sessionId - ID of the session to delete
 * @param {String} token - JWT auth token
 * @returns {Promise<Object>} Success response
 */
export const deleteSession = async (sessionId, token) => {
  try {
    const response = await axios.delete(
      `${API_URL}/paper-trading/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting paper trading session:", error);
    throw (
      error.response?.data?.message ||
      error.message ||
      "Failed to delete paper trading session"
    );
  }
};
