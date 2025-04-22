import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { getStrategy } from "../services/strategyService";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";

const BacktestResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBacktestData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }

        // Fetch the strategy data which includes backtest results
        const strategyData = await getStrategy(id, token);
        setStrategy(strategyData);

        // Get the most recent backtest result
        if (
          strategyData.backtestResults &&
          strategyData.backtestResults.length > 0
        ) {
          setBacktestResult(
            strategyData.backtestResults[
              strategyData.backtestResults.length - 1
            ]
          );
        } else {
          setError("No backtest results found for this strategy");
        }
      } catch (err) {
        console.error("Error fetching backtest results:", err);
        setError(err.message || "Failed to load backtest results");
        toast.error("Error loading backtest results");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBacktestData();
    } else {
      setError("Invalid backtest ID");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
        </div>
        <Card className="text-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <FiBarChart2 className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              Please return to the strategies page and try again.
            </p>
            <Link
              to="/strategies"
              className="btn bg-primary-600 hover:bg-primary-700 text-white"
            >
              View All Strategies
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mr-4"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {strategy?.name} - Backtest Results
          </h1>
        </div>
      </div>

      {/* Backtest Overview Card */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Backtest Summary</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {`${backtestResult?.symbol || "Unknown"} from ${
                backtestResult?.startDate
              } to ${backtestResult?.endDate}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to={`/builder/${strategy?._id}`}
              className="btn-sm bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-md px-4 py-2"
            >
              Edit Strategy
            </Link>
            <Link
              to={`/builder/${strategy?._id}?action=backtest`}
              className="btn-sm bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-md px-4 py-2"
            >
              Run New Backtest
            </Link>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 mr-4">
              <FiTrendingUp className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Return
              </p>
              <h3
                className={`text-xl font-bold ${
                  backtestResult?.totalReturn >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {backtestResult?.totalReturn?.toFixed(2)}%
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 mr-4">
              <FiBarChart2 className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Win Rate
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {backtestResult?.winRate?.toFixed(2)}%
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20 mr-4">
              <FiDollarSign className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Initial Capital
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                ${backtestResult?.initialCapital?.toLocaleString()}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20 mr-4">
              <FiClock className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Trades
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {backtestResult?.totalTrades}
              </h3>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BacktestResults;
