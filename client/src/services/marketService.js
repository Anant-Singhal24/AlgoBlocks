import axios from "axios";

// Using Alpha Vantage API for market data
const ALPHA_VANTAGE_API_KEY = "demo"; // Replace with your API key
const BASE_URL = "https://www.alphavantage.co/query";

// Get market overview (global indices)
export const getMarketOverview = async () => {
  try {
    // Get major indices data
    const indices = await Promise.all([
      fetchIndexData("SPY"), // S&P 500
      fetchIndexData("QQQ"), // NASDAQ
      fetchIndexData("DIA"), // Dow Jones
    ]);

    // Get top stocks data for gainers/losers
    const stocksResponse = await axios.get(
      `${BASE_URL}?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    return {
      indices,
      topGainers: stocksResponse.data?.top_gainers || [],
      topLosers: stocksResponse.data?.top_losers || [],
      // We could add more data like sectors, market news
      // but need additional API calls
    };
  } catch (error) {
    console.error("Error fetching market overview:", error);
    throw error;
  }
};

// Fetch index data
const fetchIndexData = async (symbol) => {
  try {
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

// Get historical data for a symbol
export const getHistoricalData = async (symbol, timeframe = "daily") => {
  try {
    // Map timeframes to Alpha Vantage functions
    const functionMap = {
      daily: "TIME_SERIES_DAILY",
      weekly: "TIME_SERIES_WEEKLY",
      monthly: "TIME_SERIES_MONTHLY",
      intraday: "TIME_SERIES_INTRADAY&interval=60min",
    };

    const func = functionMap[timeframe] || functionMap.daily;

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
      throw new Error(`No data found for ${symbol}`);
    }

    // Convert to array format
    const data = Object.entries(timeSeries).map(([date, values]) => ({
      date,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: parseFloat(values["5. volume"]),
    }));

    return {
      symbol,
      timeframe,
      data: data.sort((a, b) => new Date(a.date) - new Date(b.date)),
    };
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw error;
  }
};

// Search for symbols
export const searchSymbols = async (query) => {
  try {
    const response = await axios.get(
      `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const matches = response.data.bestMatches || [];

    return matches.map((match) => ({
      symbol: match["1. symbol"],
      name: match["2. name"],
      exchange: match["4. region"],
    }));
  } catch (error) {
    console.error("Error searching symbols:", error);
    throw error;
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
