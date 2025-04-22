const axios = require("axios");

// Configuration
const MARKET_API_URL =
  process.env.MARKET_API_URL || "https://api.polygon.io/v2";
const API_KEY = process.env.POLYGON_API_KEY || "DEMO_KEY"; // Replace with your API key in .env

/**
 * Get market data for a symbol
 * @param {String} symbol - The stock symbol to fetch data for
 * @param {String} timeframe - Timeframe for historical data (1m, 5m, 15m, 1h, 1d, etc.)
 * @returns {Promise<Object>} Market data including price and history
 */
const getMarketData = async (symbol, timeframe = "1d") => {
  try {
    // For demo purposes, we'll generate mock data if we're using the demo key
    if (API_KEY === "DEMO_KEY") {
      return generateMockMarketData(symbol, timeframe);
    }

    // Convert timeframe to API format
    const multiplier = parseInt(timeframe);
    const timespan = timeframe.replace(/[0-9]/g, "");

    // Get latest price
    const priceResponse = await axios.get(
      `${MARKET_API_URL}/aggs/ticker/${symbol}/prev?apiKey=${API_KEY}`
    );

    // Get historical data
    const historyResponse = await axios.get(
      `${MARKET_API_URL}/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/2020-01-01/${getCurrentDate()}?apiKey=${API_KEY}`
    );

    // Format the response
    return {
      symbol,
      price: priceResponse.data.results[0].c,
      timestamp: new Date().toISOString(),
      change: priceResponse.data.results[0].c - priceResponse.data.results[0].o,
      changePercent:
        ((priceResponse.data.results[0].c - priceResponse.data.results[0].o) /
          priceResponse.data.results[0].o) *
        100,
      history: historyResponse.data.results.map((candle) => ({
        time: new Date(candle.t).toISOString(),
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        volume: candle.v,
      })),
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    // If API request fails, fall back to mock data
    return generateMockMarketData(symbol, timeframe);
  }
};

/**
 * Generate mock market data when API is not available
 * @param {String} symbol - Stock symbol
 * @param {String} timeframe - Time period
 * @returns {Object} Generated market data
 */
const generateMockMarketData = (symbol, timeframe) => {
  // Generate a consistent base price for the symbol
  const symbolHash = symbol
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 50 + (symbolHash % 200); // Base price between 50 and 250

  // Current price with some randomness
  const currentPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05));

  // Generate historical data
  const history = [];
  let price = basePrice * 0.9; // Start a bit lower than current

  // Determine number of periods based on timeframe
  const periodsMap = {
    "1m": 390, // One trading day in minutes
    "5m": 78,
    "15m": 26,
    "30m": 13,
    "1h": 7,
    "4h": 20,
    "1d": 252, // Approximately one trading year
    "1w": 52,
    "1M": 12,
  };

  const periods = periodsMap[timeframe] || 100;

  const now = new Date();

  // Generate candles
  for (let i = periods; i >= 0; i--) {
    // Calculate time for this candle
    const candleTime = new Date(now);

    if (timeframe.includes("m")) {
      const minutes = parseInt(timeframe);
      candleTime.setMinutes(candleTime.getMinutes() - i * minutes);
    } else if (timeframe.includes("h")) {
      const hours = parseInt(timeframe);
      candleTime.setHours(candleTime.getHours() - i * hours);
    } else if (timeframe === "1d") {
      candleTime.setDate(candleTime.getDate() - i);
    } else if (timeframe === "1w") {
      candleTime.setDate(candleTime.getDate() - i * 7);
    } else if (timeframe === "1M") {
      candleTime.setMonth(candleTime.getMonth() - i);
    }

    // Generate a somewhat realistic price movement
    const randomFactor = 1 + (Math.random() * 0.06 - 0.03); // ±3% per period
    price = price * randomFactor;

    // Create some intraperiod variance
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    // Add the candle to history
    history.push({
      time: candleTime.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
    });
  }

  // Sort history by time, oldest first
  history.sort((a, b) => new Date(a.time) - new Date(b.time));

  // Change from previous close
  const previousClose =
    history[history.length - 2]?.close || currentPrice * 0.99;
  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    symbol,
    price: parseFloat(currentPrice.toFixed(2)),
    timestamp: new Date().toISOString(),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    history,
  };
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {String} Current date
 */
const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split("T")[0];
};

/**
 * Search for stocks by keyword
 * @param {String} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
const searchStocks = async (query) => {
  try {
    if (API_KEY === "DEMO_KEY") {
      return generateMockSearchResults(query);
    }

    const response = await axios.get(
      `${MARKET_API_URL}/reference/tickers?search=${query}&apiKey=${API_KEY}`
    );

    return response.data.results.map((stock) => ({
      symbol: stock.ticker,
      name: stock.name,
      type: stock.type,
      market: stock.market,
      currency: stock.currency_name,
    }));
  } catch (error) {
    console.error(`Error searching stocks for "${query}":`, error);
    return generateMockSearchResults(query);
  }
};

/**
 * Generate mock search results
 * @param {String} query - Search query
 * @returns {Array} Mock search results
 */
const generateMockSearchResults = (query) => {
  const mockStocks = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "BRK.A",
      name: "Berkshire Hathaway Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "JNJ",
      name: "Johnson & Johnson",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "WMT",
      name: "Walmart Inc.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      type: "CS",
      market: "STOCKS",
      currency: "USD",
    },
  ];

  // Filter based on query
  const lowerQuery = query.toLowerCase();
  return mockStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(lowerQuery) ||
      stock.name.toLowerCase().includes(lowerQuery)
  );
};

module.exports = {
  getMarketData,
  searchStocks,
};
