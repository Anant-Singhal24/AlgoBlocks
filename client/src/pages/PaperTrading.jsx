import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  getSessions,
  startSession,
  updateSession,
  stopSession,
  deleteSession,
} from "../services/paperTradingService";
import { getStrategies } from "../services/strategyService";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  FiPlay,
  FiRefreshCw,
  FiPause,
  FiTrash2,
  FiTrendingUp,
  FiDollarSign,
  FiBarChart2,
  FiPlusCircle,
  FiList,
  FiClock,
} from "react-icons/fi";

const PaperTrading = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    strategyId: "",
    initialCapital: 10000,
    symbols: ["SPY"],
    timeframe: "1d",
  });
  const [updateInterval, setUpdateInterval] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch active paper trading sessions
        const sessionsData = await getSessions(token);
        setSessions(sessionsData);

        // Fetch available strategies for trading
        const strategiesData = await getStrategies(token);
        setStrategies(strategiesData);

        setLoading(false);
      } catch (error) {
        toast.error("Failed to load paper trading data");
        setLoading(false);
      }
    };

    fetchData();

    // Clean up any intervals on unmount
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  // Update active session at regular intervals
  useEffect(() => {
    if (activeSession) {
      // Clear any existing interval
      if (updateInterval) {
        clearInterval(updateInterval);
      }

      // Set up a new interval to update the active session
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const updatedSession = await updateSession(activeSession.id, token);

          // Update both the active session and the sessions list
          setActiveSession(updatedSession);
          setSessions((prev) =>
            prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
          );
        } catch (error) {
          console.error("Failed to update session:", error);
          // Don't show toasts on every failed update to avoid spamming
        }
      }, 10000); // Update every 10 seconds

      setUpdateInterval(interval);

      // Clean up on unmount or when active session changes
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewSessionForm({ ...newSessionForm, [name]: value });
  };

  const handleSymbolsChange = (e) => {
    setNewSessionForm({
      ...newSessionForm,
      symbols: e.target.value.split(",").map((s) => s.trim()),
    });
  };

  const handleStartSession = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const newSession = await startSession(
        newSessionForm.strategyId,
        {
          initialCapital: parseFloat(newSessionForm.initialCapital),
          symbols: newSessionForm.symbols,
          timeframe: newSessionForm.timeframe,
        },
        token
      );

      // Add to sessions and set as active
      setSessions([...sessions, newSession]);
      setActiveSession(newSession);
      setModalOpen(false);

      toast.success("Paper trading session started");
      setLoading(false);
    } catch (error) {
      toast.error("Failed to start paper trading session");
      setLoading(false);
    }
  };

  const handleActivateSession = (session) => {
    setActiveSession(session);
  };

  const handleUpdateSession = async (sessionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const updatedSession = await updateSession(sessionId, token);

      // Update both the active session and the sessions list
      if (activeSession && activeSession.id === updatedSession.id) {
        setActiveSession(updatedSession);
      }

      setSessions(
        sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      );

      setLoading(false);
      toast.success("Session updated with latest market data");
    } catch (error) {
      toast.error("Failed to update session");
      setLoading(false);
    }
  };

  const handleStopSession = async (sessionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const stoppedSession = await stopSession(sessionId, token);

      // Update sessions list
      setSessions(
        sessions.map((s) => (s.id === stoppedSession.id ? stoppedSession : s))
      );

      // If this was the active session, clear it
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null);
      }

      setLoading(false);
      toast.success("Paper trading session stopped");
    } catch (error) {
      toast.error("Failed to stop session");
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await deleteSession(sessionId, token);

      // Remove from sessions list
      setSessions(sessions.filter((s) => s.id !== sessionId));

      // If this was the active session, clear it
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null);
      }

      setLoading(false);
      toast.success("Paper trading session deleted");
    } catch (error) {
      toast.error("Failed to delete session");
      setLoading(false);
    }
  };

  // Render helpers
  const renderMetric = (label, value, icon) => (
    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="mr-3 text-lg text-blue-500 dark:text-blue-400">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const getReturnColorClass = (value) => {
    if (value > 0) return "text-green-500 dark:text-green-400";
    if (value < 0) return "text-red-500 dark:text-red-400";
    return "";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Paper Trading</h1>
        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          icon={<FiPlusCircle />}
        >
          New Session
        </Button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          {/* Active Session Dashboard */}
          {activeSession && (
            <Card className="mb-8 p-0">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    {activeSession.strategy.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Started:{" "}
                    {new Date(activeSession.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleUpdateSession(activeSession.id)}
                    variant="secondary"
                    size="sm"
                    icon={<FiRefreshCw />}
                  >
                    Update
                  </Button>
                  <Button
                    onClick={() => handleStopSession(activeSession.id)}
                    variant="warning"
                    size="sm"
                    icon={<FiPause />}
                  >
                    Stop
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {renderMetric(
                    "Initial Capital",
                    formatCurrency(activeSession.initialCapital),
                    <FiDollarSign />
                  )}
                  {renderMetric(
                    "Current Value",
                    formatCurrency(activeSession.currentCapital),
                    <FiTrendingUp />
                  )}
                  {renderMetric(
                    "Return",
                    <span
                      className={getReturnColorClass(
                        activeSession.metrics.percentReturn
                      )}
                    >
                      {formatPercentage(activeSession.metrics.percentReturn)} (
                      {formatCurrency(activeSession.metrics.totalPnL)})
                    </span>,
                    <FiBarChart2 />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {renderMetric(
                    "Total Trades",
                    activeSession.metrics.totalTrades,
                    <FiList />
                  )}
                  {renderMetric(
                    "Win Rate",
                    activeSession.metrics.totalTrades > 0
                      ? formatPercentage(activeSession.metrics.winRate)
                      : "N/A",
                    <FiTrendingUp />
                  )}
                  {renderMetric(
                    "Cash Balance",
                    formatCurrency(activeSession.cashBalance),
                    <FiDollarSign />
                  )}
                  {renderMetric(
                    "Last Updated",
                    new Date(activeSession.lastUpdated).toLocaleTimeString(),
                    <FiClock />
                  )}
                </div>

                {/* Positions Table */}
                <h3 className="text-lg font-medium mb-3">Open Positions</h3>
                {activeSession.positions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Symbol
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Avg. Cost
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Current Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Value
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            P&L
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {activeSession.positions.map((position) => {
                          const value =
                            position.quantity * position.currentPrice;
                          const pnl =
                            position.quantity *
                            (position.currentPrice - position.averageCost);
                          const pnlPercent =
                            (position.currentPrice / position.averageCost - 1) *
                            100;

                          return (
                            <tr key={position.symbol}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {position.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {position.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(position.averageCost)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(position.currentPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(value)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${getReturnColorClass(
                                  pnl
                                )}`}
                              >
                                {formatCurrency(pnl)} (
                                {formatPercentage(pnlPercent)})
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No open positions
                  </p>
                )}

                {/* Recent Transactions */}
                <h3 className="text-lg font-medium mt-8 mb-3">
                  Recent Transactions
                </h3>
                {activeSession.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Symbol
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            Total
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            P&L
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {activeSession.transactions
                          .slice(-10)
                          .reverse()
                          .map((tx, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(tx.time).toLocaleTimeString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    tx.type === "buy"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  }`}
                                >
                                  {tx.type === "buy" ? "BUY" : "SELL"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {tx.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {tx.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(tx.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(tx.total)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {tx.profitLoss ? (
                                  <span
                                    className={getReturnColorClass(
                                      tx.profitLoss
                                    )}
                                  >
                                    {formatCurrency(tx.profitLoss)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No transactions yet
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* All Sessions List */}
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4">All Sessions</h2>

            {sessions.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You don't have any paper trading sessions yet
                  </p>
                  <Button
                    onClick={() => setModalOpen(true)}
                    variant="primary"
                    icon={<FiPlusCircle />}
                  >
                    Start a Session
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {sessions.map((session) => (
                  <Card key={session.id} className="p-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold">
                        {session.strategy.name}
                        {session.status === "stopped" && (
                          <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            STOPPED
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Started: {new Date(session.startTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Initial Capital
                          </p>
                          <p className="font-medium">
                            {formatCurrency(session.initialCapital)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Current Value
                          </p>
                          <p className="font-medium">
                            {formatCurrency(session.currentCapital)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Return
                          </p>
                          <p
                            className={`font-medium ${getReturnColorClass(
                              session.metrics.percentReturn
                            )}`}
                          >
                            {formatPercentage(session.metrics.percentReturn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Positions
                          </p>
                          <p className="font-medium">
                            {session.positions.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between space-x-2">
                        {session.status !== "stopped" ? (
                          <>
                            {activeSession &&
                            activeSession.id === session.id ? (
                              <Button
                                onClick={() => setActiveSession(null)}
                                variant="secondary"
                                size="sm"
                                className="flex-1"
                              >
                                Hide Details
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleActivateSession(session)}
                                variant="primary"
                                size="sm"
                                icon={<FiPlay />}
                                className="flex-1"
                              >
                                View Details
                              </Button>
                            )}
                            <Button
                              onClick={() => handleStopSession(session.id)}
                              variant="warning"
                              size="sm"
                              icon={<FiPause />}
                              className="flex-1"
                            >
                              Stop
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleActivateSession(session)}
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          >
                            View Summary
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteSession(session.id)}
                          variant="danger"
                          size="sm"
                          icon={<FiTrash2 />}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* New Session Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Start Paper Trading Session"
      >
        <form onSubmit={handleStartSession}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Strategy
            </label>
            <select
              name="strategyId"
              value={newSessionForm.strategyId}
              onChange={handleFormChange}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select a strategy</option>
              {strategies.map((strategy) => (
                <option key={strategy._id} value={strategy._id}>
                  {strategy.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Capital
            </label>
            <input
              type="number"
              name="initialCapital"
              value={newSessionForm.initialCapital}
              onChange={handleFormChange}
              min="1"
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Symbols (comma-separated)
            </label>
            <input
              type="text"
              name="symbols"
              value={newSessionForm.symbols.join(", ")}
              onChange={handleSymbolsChange}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Timeframe
            </label>
            <select
              name="timeframe"
              value={newSessionForm.timeframe}
              onChange={handleFormChange}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
              <option value="1M">1 Month</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              onClick={() => setModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              Start Trading
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaperTrading;
