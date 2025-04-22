import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  FiTrendingUp,
  FiBarChart2,
  FiLayers,
  FiPlus,
  FiExternalLink,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getStrategies, deleteStrategy } from "../services/strategyService";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalStrategies: 0,
    activeStrategies: 0,
    totalBacktests: 0,
    averageReturn: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch strategies
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          // Use strategyService instead of direct axios call
          const strategiesData = await getStrategies(token);

          // Filter out any invalid strategies
          const validStrategies = strategiesData.filter(
            (strategy) => strategy && strategy._id
          );
          setStrategies(validStrategies);

          // Calculate stats
          const activeStrategies = validStrategies.filter(
            (strategy) => strategy.status === "active"
          ).length;

          // Get backtest count
          const backtestCount = validStrategies.reduce(
            (count, strategy) =>
              count + (strategy.backtestResults?.length || 0),
            0
          );

          setStats({
            totalStrategies: validStrategies.length,
            activeStrategies,
            totalBacktests: backtestCount,
            averageReturn: calculateAverageReturn(validStrategies),
          });
        } catch (error) {
          console.error("Error fetching strategies:", error);
          // Use empty data if API fails
          setStrategies([]);
          setStats({
            totalStrategies: 0,
            activeStrategies: 0,
            totalBacktests: 0,
            averageReturn: 0,
          });
        }

        // Fetch real market data
        try {
          const marketResponse = await axios.get("/api/market/overview");

          // Format the market data for display
          const formattedMarketData = {
            indices: marketResponse.data.indices.map((index) => ({
              name: index.name,
              value: parseFloat(index.price).toFixed(2),
              change: `${
                index.percentChange >= 0 ? "+" : ""
              }${index.percentChange.toFixed(2)}%`,
              direction: index.percentChange >= 0 ? "up" : "down",
            })),
            topMovers:
              marketResponse.data.topGainers?.slice(0, 3).map((stock) => ({
                symbol: stock.symbol,
                price: parseFloat(stock.price).toFixed(2),
                change: `+${parseFloat(stock.percentChange).toFixed(2)}%`,
              })) || [],
          };

          setMarketData(formattedMarketData);
        } catch (error) {
          console.error("Error fetching market data:", error);
          // Fallback to placeholder data
          setMarketData({
            indices: [
              {
                name: "S&P 500",
                value: "4,585.25",
                change: "+0.38%",
                direction: "up",
              },
              {
                name: "Nasdaq",
                value: "14,298.76",
                change: "+0.95%",
                direction: "up",
              },
              {
                name: "Dow Jones",
                value: "36,125.98",
                change: "-0.12%",
                direction: "down",
              },
            ],
            topMovers: [
              { symbol: "AAPL", price: "178.85", change: "+2.45%" },
              { symbol: "MSFT", price: "345.22", change: "+1.78%" },
              { symbol: "GOOGL", price: "132.67", change: "+1.23%" },
            ],
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to calculate average return from strategies
  const calculateAverageReturn = (strategies) => {
    const strategiesWithReturns = strategies.filter(
      (strategy) =>
        strategy.backtestResults && strategy.backtestResults.length > 0
    );

    if (strategiesWithReturns.length === 0) return 0;

    const totalReturn = strategiesWithReturns.reduce((sum, strategy) => {
      // Use the latest backtest result
      const latestBacktest = strategy.backtestResults.slice(-1)[0];
      return sum + (latestBacktest.totalReturn || 0);
    }, 0);

    return (totalReturn / strategiesWithReturns.length).toFixed(2);
  };

  // Add a function to handle strategy deletion
  const handleDeleteStrategy = async (strategyId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this strategy?")) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to delete strategies");
        return;
      }

      // Use strategyService instead of direct axios call
      await deleteStrategy(strategyId, token);

      // Update strategies state
      const updatedStrategies = strategies.filter(
        (strategy) => strategy._id !== strategyId
      );
      setStrategies(updatedStrategies);

      // Update stats
      const activeStrategies = updatedStrategies.filter(
        (strategy) => strategy.status === "active"
      ).length;
      const backtestCount = updatedStrategies.reduce(
        (count, strategy) => count + (strategy.backtestResults?.length || 0),
        0
      );

      setStats({
        totalStrategies: updatedStrategies.length,
        activeStrategies,
        totalBacktests: backtestCount,
        averageReturn: calculateAverageReturn(updatedStrategies),
      });

      toast.success("Strategy deleted successfully");
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy");
    }
  };

  // Filter strategies based on search term
  const filteredStrategies = strategies.filter(
    (strategy) =>
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.name || "Trader"}!
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/builder">
            <Button className="flex items-center">
              <FiPlus className="mr-2" />
              Create New Strategy
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <FiLayers className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-white/80">Total Strategies</p>
              <h3 className="text-2xl font-bold">{stats.totalStrategies}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <FiTrendingUp className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-white/80">Active Strategies</p>
              <h3 className="text-2xl font-bold">{stats.activeStrategies}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <FiBarChart2 className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-white/80">Total Backtests</p>
              <h3 className="text-2xl font-bold">{stats.totalBacktests}</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-white/20 mr-4">
              <FiTrendingUp className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-white/80">Avg. Return</p>
              <h3 className="text-2xl font-bold">{stats.averageReturn}%</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Market Overview */}
      {marketData && (
        <Card
          title="Market Overview"
          subtitle="Latest market indices and top movers"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Major Indices
              </h4>
              <div className="space-y-3">
                {marketData.indices.map((index, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span className="font-medium">{index.name}</span>
                    <div className="flex items-center">
                      <span className="font-bold mr-2">{index.value}</span>
                      <span
                        className={`${
                          index.direction === "up"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {index.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Top Movers
              </h4>
              <div className="space-y-3">
                {marketData.topMovers.map((stock, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span className="font-bold">{stock.symbol}</span>
                    <div className="flex items-center">
                      <span className="mr-2">${stock.price}</span>
                      <span className="text-green-500">{stock.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              to="/market-data"
              className="flex items-center text-primary-600 dark:text-primary-400 font-medium"
            >
              <span className="mr-2">View Detailed Market Data</span>
              <FiExternalLink />
            </Link>
          </div>
        </Card>
      )}

      {/* Recent Strategies with Search */}
      <Card
        title="Your Strategies"
        subtitle="Manage and monitor your trading strategies"
      >
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 input"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Strategy Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStrategies.length > 0 ? (
                filteredStrategies.map((strategy) => (
                  <tr
                    key={strategy._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {strategy.name}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {strategy.description || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          strategy.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : strategy.status === "paused"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {strategy.status.charAt(0).toUpperCase() +
                          strategy.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {strategy.backtestResults?.length > 0
                          ? `${strategy.backtestResults[
                              strategy.backtestResults.length - 1
                            ].totalReturn.toFixed(2)}%`
                          : "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(
                          strategy.updatedAt || strategy.lastUpdated
                        ).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/strategies/${strategy._id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-1"
                          title="View Strategy"
                        >
                          <FiEye />
                        </Link>
                        <Link
                          to={`/builder/${strategy._id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="Edit Strategy"
                        >
                          <FiEdit />
                        </Link>
                        <button
                          onClick={() => handleDeleteStrategy(strategy._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Delete Strategy"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm
                      ? "No strategies match your search."
                      : "No strategies found. Create your first strategy to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {strategies.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Link
              to="/strategies"
              className="text-primary-600 dark:text-primary-400 font-medium flex items-center"
            >
              <span className="mr-2">View All Strategies</span>
              <FiExternalLink />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
