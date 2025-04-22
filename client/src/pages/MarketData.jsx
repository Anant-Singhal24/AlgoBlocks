import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiInfo,
  FiCalendar,
} from "react-icons/fi";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

const MarketData = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetchMarketData();
  }, []);

  // Effect for rendering chart when historical data changes
  useEffect(() => {
    if (historicalData && chartRef.current) {
      renderChart();
    }
  }, [historicalData]);

  // Cleanup chart instance when component unmounts
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // Using CoinGecko API for crypto data
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1"
      );

      const formattedData = response.data.map((coin) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_24h,
        changePercent: coin.price_change_percentage_24h,
        volume: coin.total_volume,
        marketCap: coin.market_cap,
        image: coin.image,
        updated: new Date().toLocaleString(),
      }));

      setCryptoData(formattedData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      toast.error(
        "Failed to fetch cryptocurrency data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (symbol) => {
    setLoadingChart(true);
    try {
      // Get market chart data for crypto from CoinGecko
      // For crypto, we need to find the coin id first
      const coin = cryptoData.find((c) => c.symbol === symbol);
      if (coin) {
        const coinId = coin.name.toLowerCase();
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`
        );

        if (response.data && response.data.prices) {
          // Format the prices data
          const data = response.data.prices.map((item) => ({
            date: new Date(item[0]).toISOString().split("T")[0],
            price: item[1],
          }));

          if (data && data.length > 0) {
            setHistoricalData({
              symbol,
              data,
            });
            setSelectedSymbol(symbol);
          } else {
            toast.error("No historical data available for this symbol");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      toast.error("Failed to fetch historical data. Please try again later.");
    } finally {
      setLoadingChart(false);
    }
  };

  // Render chart with Chart.js
  const renderChart = async () => {
    if (!historicalData || !chartRef.current) return;

    try {
      // Dynamically import Chart.js
      const Chart = await import("chart.js/auto");

      // Destroy existing chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");

      // Create new chart
      chartInstance.current = new Chart.default(ctx, {
        type: "line",
        data: {
          labels: historicalData.data.map((item) => item.date),
          datasets: [
            {
              label: `${historicalData.symbol} Price (USD)`,
              data: historicalData.data.map((item) => item.price),
              borderColor: "#4f46e5",
              backgroundColor: "rgba(79, 70, 229, 0.1)",
              borderWidth: 2,
              pointRadius: 3,
              pointBackgroundColor: "#4f46e5",
              fill: true,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: $${context.parsed.y.toFixed(
                    2
                  )}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              grid: {
                color: "rgba(0, 0, 0, 0.05)",
              },
              ticks: {
                callback: function (value) {
                  return "$" + value.toLocaleString();
                },
              },
            },
          },
          interaction: {
            intersect: false,
            mode: "index",
          },
        },
      });
    } catch (error) {
      console.error("Error rendering chart:", error);
      toast.error("Failed to render chart. Please try again.");
    }
  };

  // Filter data based on search term
  const filteredData = cryptoData.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cryptocurrency Market Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time cryptocurrency prices and market information
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            className="flex items-center"
            onClick={fetchMarketData}
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Price Chart */}
      {selectedSymbol && (
        <Card className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              {selectedSymbol} Price Chart
              {loadingChart && <LoadingSpinner size="sm" className="ml-2" />}
            </h2>
            <div className="flex items-center text-sm text-gray-500 mt-2 sm:mt-0">
              <FiCalendar className="mr-1" />
              <span>Last 30 days</span>
            </div>
          </div>

          <div className="w-full h-[400px] relative">
            {loadingChart ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <canvas ref={chartRef}></canvas>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <FiInfo className="mr-1" />
            <span>
              Click on any cryptocurrency in the table below to view its price
              chart
            </span>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="py-3 px-4 text-left">Cryptocurrency</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Change</th>
                    <th className="py-3 px-4 text-right">% Change</th>
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 text-right">Market Cap</th>
                    <th className="py-3 px-4 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr
                      key={item.symbol}
                      className={`border-b border-gray-200 dark:border-gray-700 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      } cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                      onClick={() => fetchHistoricalData(item.symbol)}
                      title={`Click to view ${item.name} price chart`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-6 h-6 mr-2 rounded-full"
                            />
                          )}
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              {item.symbol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <FiDollarSign className="text-gray-500 mr-1" />
                          <span className="font-medium">
                            {item.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          item.change > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.change > 0 ? "+" : ""}
                        {item.change.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`py-3 px-4 text-right ${
                          item.changePercent > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <div className="flex items-center justify-end">
                          {item.changePercent > 0 ? (
                            <FiTrendingUp className="mr-1" />
                          ) : (
                            <FiTrendingDown className="mr-1" />
                          )}
                          {item.changePercent > 0 ? "+" : ""}
                          {parseFloat(item.changePercent).toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${item.volume.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${item.marketCap.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400 text-sm">
                        {item.updated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="text-center py-12">
              <FiSearch className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No data found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm
                  ? "Try changing your search criteria"
                  : "Try refreshing the data or checking back later"}
              </p>
              <Button onClick={fetchMarketData}>Refresh Data</Button>
            </Card>
          )}

          {/* Data attribution */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Cryptocurrency data provided by API</p>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketData;
