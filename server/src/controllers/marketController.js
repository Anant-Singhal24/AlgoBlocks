const asyncHandler = require("express-async-handler");
const axios = require("axios");
const marketService = require("../services/marketService");

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo"; // Get API key from environment variables
const BASE_URL = "https://www.alphavantage.co/query";

// Financial Modeling Prep API configuration
const FINANCIAL_MODELING_PREP_API_KEY =
  process.env.FINANCIAL_MODELING_PREP_API_KEY || "demo";
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

// Helper function to fetch index data
const fetchIndexData = async (symbol) => {
  try {
    // Try using Financial Modeling Prep first for more reliable data
    try {
      const response = await axios.get(
        `${FMP_BASE_URL}/quote/${symbol}?apikey=${FINANCIAL_MODELING_PREP_API_KEY}`
      );

      if (response.data && response.data.length > 0) {
        const stock = response.data[0];
        return {
          symbol,
          name: getIndexName(symbol),
          price: parseFloat(stock.price),
          change: parseFloat(stock.change),
          percentChange: parseFloat(stock.changesPercentage),
        };
      }
    } catch (fmpError) {
      console.log("FMP API request failed, falling back to Alpha Vantage");
    }

    // Fallback to Alpha Vantage
    const response = await axios.get(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const quote = response.data["Global Quote"];
    if (!quote) {
      throw new Error(`No data found for ${symbol}`);
    }

    return {
      symbol,
      name: getIndexName(symbol),
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      percentChange: parseFloat(quote["10. change percent"].replace("%", "")),
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    // Return placeholder data in case of error
    return {
      symbol,
      name: getIndexName(symbol),
      price: 0,
      change: 0,
      percentChange: 0,
    };
  }
};

// Helper function to get index name from symbol
const getIndexName = (symbol) => {
  const indexMap = {
    SPY: "S&P 500",
    QQQ: "Nasdaq 100",
    DIA: "Dow Jones",
  };

  return indexMap[symbol] || symbol;
};

// @desc    Get market overview data
// @route   GET /api/market/overview
// @access  Public
const getMarketOverview = async (req, res) => {
  try {
    // Get major indices data
    const indicesPromises = [
      fetchIndexData("SPY"), // S&P 500
      fetchIndexData("QQQ"), // NASDAQ
      fetchIndexData("DIA"), // Dow Jones
    ];

    // Try to get top gainers/losers
    let topGainers = [];
    let topLosers = [];

    try {
      const stocksResponse = await axios.get(
        `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      if (stocksResponse.data) {
        topGainers = (stocksResponse.data.top_gainers || [])
          .slice(0, 3)
          .map((stock) => ({
            symbol: stock.ticker,
            name: stock.ticker, // Alpha Vantage doesn't provide company name in this endpoint
            price: parseFloat(stock.price),
            change: parseFloat(stock.change_amount),
            percentChange: parseFloat(stock.change_percentage.replace("%", "")),
          }));

        topLosers = (stocksResponse.data.top_losers || [])
          .slice(0, 3)
          .map((stock) => ({
            symbol: stock.ticker,
            name: stock.ticker,
            price: parseFloat(stock.price),
            change: parseFloat(stock.change_amount),
            percentChange: parseFloat(stock.change_percentage.replace("%", "")),
          }));
      }
    } catch (error) {
      console.error("Error fetching top gainers/losers:", error);
    }

    // Get sector performance if needed
    // This would require additional API calls to Alpha Vantage

    // Resolve all the promises
    const indices = await Promise.all(indicesPromises);

    // For market news we'd need a separate API call
    // Alpha Vantage has a News API but it's a separate endpoint

    const marketOverview = {
      indices,
      topGainers,
      topLosers,
      sectors: [
        { name: "Technology", performance: 1.2 },
        { name: "Healthcare", performance: -0.5 },
        { name: "Financial", performance: 0.7 },
        { name: "Consumer Cyclical", performance: -0.2 },
        { name: "Communication Services", performance: 0.9 },
      ],
      marketNews: [
        {
          title: "Latest Market Updates",
          summary:
            "Check latest news at financial news sites for up-to-date information.",
          url: "https://www.cnbc.com/markets/",
        },
      ],
    };

    res.json(marketOverview);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch market overview",
      error: error.message,
    });
  }
};

// @desc    Get historical data for a symbol
// @route   GET /api/market/history/:symbol
// @access  Private
const getHistoricalData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = "daily", from, to } = req.query;

    // Validate inputs
    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    // Map timeframes to Alpha Vantage functions
    const functionMap = {
      daily: "TIME_SERIES_DAILY",
      weekly: "TIME_SERIES_WEEKLY",
      monthly: "TIME_SERIES_MONTHLY",
      intraday: "TIME_SERIES_INTRADAY&interval=60min",
    };

    const func = functionMap[timeframe] || functionMap.daily;

    // Call Alpha Vantage API
    const response = await axios.get(
      `${BASE_URL}?function=${func}&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    // Parse the response based on the timeframe
    let timeSeriesKey;
    if (timeframe === "daily") timeSeriesKey = "Time Series (Daily)";
    else if (timeframe === "weekly") timeSeriesKey = "Weekly Time Series";
    else if (timeframe === "monthly") timeSeriesKey = "Monthly Time Series";
    else timeSeriesKey = "Time Series (60min)";

    const timeSeries = response.data[timeSeriesKey];

    if (!timeSeries) {
      return res.status(404).json({ message: `No data found for ${symbol}` });
    }

    // Convert to array format
    let data = Object.entries(timeSeries).map(([date, values]) => ({
      date,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseFloat(values["5. volume"]),
    }));

    // Sort by date
    data = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by date range if provided
    if (from) {
      const fromDate = new Date(from);
      data = data.filter((item) => new Date(item.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      data = data.filter((item) => new Date(item.date) <= toDate);
    }

    res.json({
      symbol,
      timeframe,
      data,
    });
  } catch (error) {
    console.error("Historical data error:", error);
    res.status(500).json({
      message: "Failed to fetch historical data",
      error: error.message,
    });
  }
};

// @desc    Search for stock symbols
// @route   GET /api/market/search
// @access  Private
const searchSymbols = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters" });
    }

    // Call Alpha Vantage API
    const response = await axios.get(
      `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    if (!response.data || !response.data.bestMatches) {
      return res.json([]);
    }

    const results = response.data.bestMatches.map((match) => ({
      symbol: match["1. symbol"],
      name: match["2. name"],
      exchange: match["4. region"],
    }));

    res.json(results);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to search symbols", error: error.message });
  }
};

// @desc    Get market data for a symbol
// @route   GET /api/market/:symbol
// @access  Public
const getMarketData = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { timeframe = "1d" } = req.query;

  if (!symbol) {
    res.status(400);
    throw new Error("Symbol is required");
  }

  try {
    const data = await marketService.getMarketData(symbol, timeframe);
    res.status(200).json(data);
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to fetch market data: ${error.message}`);
  }
});

// @desc    Search for stocks
// @route   GET /api/market/search
// @access  Public
const searchStocks = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    res.status(400);
    throw new Error("Search query is required");
  }

  try {
    const results = await marketService.searchStocks(query);
    res.status(200).json(results);
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
});

module.exports = {
  getMarketOverview,
  getHistoricalData,
  searchSymbols,
  getMarketData,
  searchStocks,
};
