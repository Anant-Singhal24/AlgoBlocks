import { useState, useEffect } from "react";
import { FiArrowUp, FiArrowDown, FiExternalLink } from "react-icons/fi";
import Card from "./Card";
import { fetchMarketData } from "../services/marketDataService";

const MarketOverview = () => {
  const [marketData, setMarketData] = useState({
    indices: [],
    topMovers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getMarketData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData();
        setMarketData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading market data:", err);
        setError("Failed to load market data");
        setLoading(false);
      }
    };

    getMarketData();

    // Refresh data every 5 minutes
    const interval = setInterval(getMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderValue = (value, changePercent) => {
    const isPositive = parseFloat(changePercent) >= 0;
    return (
      <div className="flex items-center">
        <span className="text-lg font-semibold">{value}</span>
        <span
          className={`ml-2 flex items-center text-sm ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPositive ? (
            <FiArrowUp className="mr-1" />
          ) : (
            <FiArrowDown className="mr-1" />
          )}
          {isPositive ? "+" : ""}
          {changePercent}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="p-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 text-center">
          <p className="text-red-500">{error}</p>
          <button
            className="mt-2 text-sm text-blue-500 hover:text-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Market Overview
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Latest market indices and top movers
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Major Indices
          </h3>
          <div className="space-y-3">
            {marketData.indices.map((index) => (
              <div
                key={index.symbol}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{index.symbol}</span>
                {renderValue(index.price, index.changePercent)}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Top Movers
          </h3>
          <div className="space-y-3">
            {marketData.topMovers.map((stock) => (
              <div
                key={stock.symbol}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{stock.symbol}</span>
                {renderValue(`$${stock.price}`, stock.changePercent)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-right">
          <a
            href="https://www.marketwatch.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Detailed Market Data <FiExternalLink className="ml-1" />
          </a>
        </div>
      </div>
    </Card>
  );
};

export default MarketOverview;
