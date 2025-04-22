import axios from "axios";

// API key will be configured on the server side for security
// The client will make requests through our backend API

/**
 * Fetches real-time market data for major indices
 * @returns {Promise<Object>} Market data including indices and top movers
 */
export const fetchMarketData = async () => {
  try {
    // Use our backend API which securely handles the API key
    const response = await axios.get("/api/market/overview");

    // If we have data from our backend, use it
    if (response.data && response.data.indices) {
      return {
        indices: response.data.indices,
        topMovers: response.data.topGainers || [],
      };
    }

    // Fallback to direct API call if needed - this should be removed in production
    const indicesResponse = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/%5EGSPC,%5EIXIC,%5EDJI?apikey=${
        process.env.REACT_APP_FINANCIAL_MODELING_PREP_API_KEY || "demo"
      }`
    );

    const gainersResponse = await axios.get(
      `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${
        process.env.REACT_APP_FINANCIAL_MODELING_PREP_API_KEY || "demo"
      }`
    );

    // Process indices data
    const indices = indicesResponse.data.map((index) => {
      const symbol = index.symbol.replace("^", "");
      const formattedSymbol =
        symbol === "GSPC"
          ? "S&P 500"
          : symbol === "IXIC"
          ? "Nasdaq 100"
          : symbol === "DJI"
          ? "Dow Jones"
          : symbol;

      return {
        symbol: formattedSymbol,
        price: index.price.toFixed(2),
        change: index.change.toFixed(2),
        changePercent: index.changesPercentage.toFixed(2),
      };
    });

    // Process top movers data (take top 3)
    const topMovers = gainersResponse.data.slice(0, 3).map((stock) => {
      return {
        symbol: stock.symbol,
        price: parseFloat(stock.price).toFixed(2),
        change: parseFloat(stock.change).toFixed(2),
        changePercent: parseFloat(stock.changesPercentage).toFixed(2),
      };
    });

    return { indices, topMovers };
  } catch (error) {
    console.error("Error fetching market data:", error);

    // Return mock data as fallback
    return {
      indices: [],
    };
  }
};

/**
 * Fetches detailed data for a specific symbol
 * @param {string} symbol Stock or index symbol
 * @returns {Promise<Object>} Detailed market data for the symbol
 */
export const fetchSymbolData = async (symbol) => {
  try {
    // Try to get data from our backend first
    try {
      const backendResponse = await axios.get(`/api/market/${symbol}`);
      if (backendResponse.data) {
        return backendResponse.data;
      }
    } catch (backendError) {
      console.log("Backend request failed, falling back to direct API call");
    }

    // Fallback to direct API call
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${
        process.env.REACT_APP_FINANCIAL_MODELING_PREP_API_KEY || "demo"
      }`
    );

    if (response.data && response.data.length > 0) {
      const data = response.data[0];
      return {
        symbol: data.symbol,
        name: data.name,
        price: data.price.toFixed(2),
        change: data.change.toFixed(2),
        changePercent: data.changesPercentage.toFixed(2),
        open: data.open.toFixed(2),
        high: data.dayHigh.toFixed(2),
        low: data.dayLow.toFixed(2),
        volume: data.volume.toLocaleString(),
        marketCap: (data.marketCap / 1000000000).toFixed(2) + "B",
        pe: data.pe?.toFixed(2) || "N/A",
      };
    }

    throw new Error("No data found for symbol");
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    throw error;
  }
};

export default {
  fetchMarketData,
  fetchSymbolData,
};
