import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import {
  FiPlus,
  FiEdit2,
  FiPlay,
  FiEye,
  FiTrash2,
  FiCopy,
  FiSearch,
  FiFilter,
  FiTag,
  FiCalendar,
  FiBarChart2,
  FiClock,
  FiSave,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  getStrategies,
  deleteStrategy,
  updateStrategy,
} from "../services/strategyService";
import { useAuth } from "../context/AuthContext";

const Strategies = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const location = useLocation();
  const navigate = useNavigate();

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);

      // Get token for authentication
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to view strategies");
        setLoading(false);
        return;
      }

      // Fetch strategies from API
      const data = await getStrategies(token);

      // Filter out any invalid strategies and ensure all required fields
      const validStrategies = data.filter(
        (strategy) => strategy && strategy._id
      );
      setStrategies(validStrategies);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      toast.error("Failed to load strategies");
      setStrategies([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  useEffect(() => {
    // Handle incoming strategy with backtest result
    if (location.state?.strategy && location.state?.backtestResult) {
      const { strategy, backtestResult } = location.state;
      console.log("Received strategy with backtest result:", strategy);

      // Clear the location state to prevent duplicate processing on navigation
      navigate(location.pathname, { replace: true, state: {} });

      // Refresh strategies
      fetchStrategies();

      toast.success(`Backtest for "${strategy.name}" saved successfully`);
    }
  }, [location.state, navigate, fetchStrategies]);

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Cannot delete strategy: Invalid ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this strategy?")) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("You must be logged in to delete strategies");
          return;
        }

        // Delete strategy using service
        await deleteStrategy(id, token);

        // Update local state
        setStrategies((prev) => prev.filter((strategy) => strategy._id !== id));

        toast.success("Strategy deleted successfully");
      } catch (error) {
        console.error("Error deleting strategy:", error);
        toast.error("Failed to delete strategy");
      }
    }
  };

  const handleEditClick = (strategy) => {
    setCurrentStrategy(strategy);
    setEditForm({
      name: strategy.name,
      description: strategy.description || "",
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    try {
      if (!currentStrategy || !currentStrategy._id) {
        toast.error("Invalid strategy selected");
        return;
      }

      // Validate form
      if (!editForm.name.trim()) {
        toast.error("Strategy name is required");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to update strategies");
        return;
      }

      // Create updated strategy object
      const updatedStrategy = {
        ...currentStrategy,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      };

      // Update strategy using service
      await updateStrategy(currentStrategy._id, updatedStrategy, token);

      // Update local state
      setStrategies((prev) =>
        prev.map((strategy) =>
          strategy._id === currentStrategy._id
            ? { ...strategy, ...updatedStrategy }
            : strategy
        )
      );

      setEditModalOpen(false);
      toast.success("Strategy updated successfully");
    } catch (error) {
      console.error("Error updating strategy:", error);
      toast.error("Failed to update strategy");
    }
  };

  const handleRunBacktest = (strategyId) => {
    // Navigate to builder with strategy ID to run backtest
    navigate(`/builder/${strategyId}?action=backtest`);
  };

  // Filter strategies based on search term and status filter
  const filteredStrategies = strategies
    .filter(
      (strategy) =>
        // Filter by search term (case insensitive)
        (strategy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        // Filter by status
        (statusFilter === "all" || strategy.status === statusFilter)
    )
    .sort((a, b) => {
      // Sort strategies based on selected field and order
      switch (sortBy) {
        case "name":
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "status":
          return sortOrder === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        case "backtests":
          return sortOrder === "asc"
            ? (a.backtestResults?.length || 0) -
                (b.backtestResults?.length || 0)
            : (b.backtestResults?.length || 0) -
                (a.backtestResults?.length || 0);
        case "performance":
          const aPerformance = a.backtestResults?.length
            ? a.backtestResults[a.backtestResults.length - 1].totalReturn || 0
            : 0;
          const bPerformance = b.backtestResults?.length
            ? b.backtestResults[b.backtestResults.length - 1].totalReturn || 0
            : 0;
          return sortOrder === "asc"
            ? aPerformance - bPerformance
            : bPerformance - aPerformance;
        case "updatedAt":
        default:
          const aDate = new Date(a.updatedAt || 0);
          const bDate = new Date(b.updatedAt || 0);
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Strategies
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and monitor all your trading strategies
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
                placeholder="Search strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Strategies Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredStrategies.map((strategy) => (
          <Card key={strategy._id} className="h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {strategy.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {strategy.description || "No description"}
                </p>
              </div>
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
            </div>

            <div className="flex flex-col space-y-3 my-4 flex-grow">
              <div className="flex items-center text-sm">
                <FiBarChart2 className="text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Performance:
                </span>
                <span className="ml-2">
                  {strategy.backtestResults?.length ? (
                    <span
                      className={
                        strategy.backtestResults[
                          strategy.backtestResults.length - 1
                        ].totalReturn >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {strategy.backtestResults[
                        strategy.backtestResults.length - 1
                      ].totalReturn.toFixed(2)}
                      %
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      No backtest
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <FiClock className="text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Backtests:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {strategy.backtestResults?.length || 0}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <FiCalendar className="text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Updated:
                </span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date(strategy.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link
                to={`/strategies/${strategy._id}`}
                className="flex-1 btn-sm bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 dark:text-primary-400 text-center rounded-md py-1 text-sm flex items-center justify-center"
              >
                <FiEye className="mr-1" />
                View
              </Link>
              <Link
                to={`/builder/${strategy._id}`}
                className="flex-1 btn-sm bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 text-center rounded-md py-1 text-sm flex items-center justify-center"
              >
                <FiEdit2 className="mr-1" />
                Edit
              </Link>
              <button
                onClick={() => handleRunBacktest(strategy._id)}
                className="flex-1 btn-sm bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 text-center rounded-md py-1 text-sm flex items-center justify-center"
              >
                <FiPlay className="mr-1" />
                Test
              </button>
              {strategy.backtestResults?.length > 0 && (
                <Link
                  to={`/backtest-results/${strategy._id}`}
                  className="flex-1 btn-sm bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 text-center rounded-md py-1 text-sm flex items-center justify-center"
                >
                  <FiBarChart2 className="mr-1" />
                  Results
                </Link>
              )}
              <button
                onClick={() => handleEditClick(strategy)}
                className="btn-sm bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:text-amber-400 text-center rounded-md py-1 px-2 text-sm flex items-center justify-center"
                title="Edit Details"
              >
                <FiTag />
              </button>
              <button
                onClick={() => handleDelete(strategy._id)}
                className="btn-sm bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 text-center rounded-md py-1 px-2 text-sm flex items-center justify-center"
                title="Delete Strategy"
              >
                <FiTrash2 />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FiBarChart2 className="text-gray-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== "all"
                ? "No strategies match your filters"
                : "No strategies yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try changing your search terms or filters to find what you're looking for."
                : "Create your first trading strategy to start building and testing your investment ideas."}
            </p>
            {!(searchTerm || statusFilter !== "all") && (
              <Link to="/builder">
                <Button className="flex items-center">
                  <FiPlus className="mr-2" />
                  Create New Strategy
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* List View (Alternative) */}
      {filteredStrategies.length > 0 && (
        <Card
          title="Strategies List View"
          subtitle="Detailed view of all your strategies"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Strategy Name
                      {sortBy === "name" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === "status" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("performance")}
                  >
                    <div className="flex items-center">
                      Performance
                      {sortBy === "performance" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("backtests")}
                  >
                    <div className="flex items-center">
                      Backtests
                      {sortBy === "backtests" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <div className="flex items-center">
                      Last Updated
                      {sortBy === "updatedAt" && (
                        <span className="ml-1">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStrategies.map((strategy) => (
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
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
                      <p className="text-sm">
                        {strategy.backtestResults?.length ? (
                          <span
                            className={
                              strategy.backtestResults[
                                strategy.backtestResults.length - 1
                              ].totalReturn >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {strategy.backtestResults[
                              strategy.backtestResults.length - 1
                            ].totalReturn.toFixed(2)}
                            %
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            No data
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {strategy.backtestResults?.length || 0}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(strategy.updatedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right">
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
                          <FiEdit2 />
                        </Link>
                        <button
                          onClick={() => handleRunBacktest(strategy._id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
                          title="Run Backtest"
                        >
                          <FiPlay />
                        </button>
                        {strategy.backtestResults?.length > 0 && (
                          <Link
                            to={`/backtest-results/${strategy._id}`}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                            title="View Backtest Results"
                          >
                            <FiBarChart2 />
                          </Link>
                        )}
                        <button
                          onClick={() => handleEditClick(strategy)}
                          className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 p-1"
                          title="Edit Details"
                        >
                          <FiTag />
                        </button>
                        <button
                          onClick={() => handleDelete(strategy._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                          title="Delete Strategy"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Strategy Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Strategy Details"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Strategy Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="input w-full"
              placeholder="Enter strategy name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              className="input w-full h-32"
              placeholder="Describe your strategy (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="flex items-center"
            >
              <FiX className="mr-2" />
              Cancel
            </Button>
            <Button onClick={handleEditSave} className="flex items-center">
              <FiSave className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Strategies;
