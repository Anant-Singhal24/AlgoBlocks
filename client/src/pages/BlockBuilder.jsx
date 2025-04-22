import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Droppable, Draggable } from "react-beautiful-dnd";
import DragDropContext from "../context/DragDropContext";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  FiSave,
  FiPlay,
  FiPlus,
  FiX,
  FiMenu,
  FiSettings,
  FiBarChart2,
  FiActivity,
  FiCalendar,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  createStrategy,
  getStrategy,
  updateStrategy,
  addBacktestResult,
  runBacktest,
} from "../services/strategyService";
import { getDefaultStartDate, getCurrentDate } from "../utils/dateUtils";

// Block categories with their components
const blockCategories = [
  {
    id: "indicators",
    name: "Indicators",
    blocks: [
      {
        id: "sma",
        name: "Simple Moving Average",
        icon: <FiActivity />,
        color:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        id: "ema",
        name: "Exponential Moving Average",
        icon: <FiActivity />,
        color:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        id: "rsi",
        name: "Relative Strength Index",
        icon: <FiActivity />,
        color:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        id: "macd",
        name: "MACD",
        icon: <FiActivity />,
        color:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
      {
        id: "bb",
        name: "Bollinger Bands",
        icon: <FiActivity />,
        color:
          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      },
    ],
  },
  {
    id: "conditions",
    name: "Conditions",
    blocks: [
      {
        id: "crossover",
        name: "Crossover",
        icon: <FiBarChart2 />,
        color:
          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        id: "threshold",
        name: "Threshold",
        icon: <FiBarChart2 />,
        color:
          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      },
      {
        id: "price_action",
        name: "Price Action",
        icon: <FiBarChart2 />,
        color:
          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      },
    ],
  },
  {
    id: "actions",
    name: "Actions",
    blocks: [
      {
        id: "buy",
        name: "Buy Order",
        icon: <FiSettings />,
        color:
          "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        id: "sell",
        name: "Sell Order",
        icon: <FiSettings />,
        color:
          "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        id: "stop_loss",
        name: "Stop Loss",
        icon: <FiSettings />,
        color:
          "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
      {
        id: "take_profit",
        name: "Take Profit",
        icon: <FiSettings />,
        color:
          "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      },
    ],
  },
];

const BlockBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState({
    name: "",
    description: "",
    blocks: [],
  });
  const [showBlocksPanel, setShowBlocksPanel] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("indicators");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [backtestOptions, setBacktestOptions] = useState({
    symbol: "SPY",
    startDate: getDefaultStartDate(),
    endDate: getCurrentDate(),
    initialCapital: 10000,
    timeframe: "1d",
  });

  useEffect(() => {
    const loadStrategy = async () => {
      try {
        setLoading(true);

        if (id) {
          // Fetch strategy from API
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          try {
            const strategyData = await getStrategy(id, token);
            setStrategy(strategyData);
          } catch (error) {
            toast.error("Failed to load strategy");
          }
        } else {
          setStrategy({
            name: "New Strategy",
            description: "",
            blocks: [],
          });
        }
        setLoading(false);
      } catch (error) {
        toast.error("Error loading strategy");
        setLoading(false);
      }
    };

    loadStrategy();
  }, [id]);

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Adding a new block from the blocks panel
    if (source.droppableId === "blocks-panel") {
      const categoryId = selectedCategory;
      const category = blockCategories.find((cat) => cat.id === categoryId);
      if (!category) return;

      const blockIndex = source.index;
      const block = category.blocks[blockIndex];

      // Generate a unique ID by combining the block type with a timestamp and random number
      const newId = `${block.id}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Determine correct type based on category
      const blockType =
        category.id === "indicators"
          ? "indicator"
          : category.id === "conditions"
          ? "condition"
          : category.id === "actions"
          ? "action"
          : "indicator";

      const newBlock = {
        id: newId,
        type: blockType, // Set type based on category
        subtype: block.id, // Set subtype to the specific block identifier
        name: block.name,
        settings: {},
      };

      setStrategy((prev) => ({
        ...prev,
        blocks: [...prev.blocks, newBlock],
      }));

      // Select the newly added block for editing
      setSelectedBlock(newBlock);
      setIsSettingsModalOpen(true);
      return;
    }

    // Reordering strategy blocks
    if (
      source.droppableId === "strategy-blocks" &&
      destination.droppableId === "strategy-blocks"
    ) {
      const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
      };

      const newBlocks = reorder(
        strategy.blocks,
        source.index,
        destination.index
      );

      setStrategy((prev) => ({
        ...prev,
        blocks: newBlocks,
      }));
    }
  };

  const handleRemoveBlock = (blockId) => {
    setStrategy((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== blockId),
    }));
  };

  const handleEditBlock = (block) => {
    setSelectedBlock(block);
    setIsSettingsModalOpen(true);
  };

  const handleSaveBlockSettings = (settings) => {
    if (!selectedBlock) return;

    setStrategy((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === selectedBlock.id ? { ...block, settings } : block
      ),
    }));

    setIsSettingsModalOpen(false);
    setSelectedBlock(null);
  };

  const handleSaveStrategy = async () => {
    if (!strategy.name.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to save strategies");
        setLoading(false);
        return;
      }

      // Prepare strategy data, ensuring blocks have correct structure
      const strategyData = {
        name: strategy.name,
        description: strategy.description,
        marketType: strategy.marketType,
        symbols: strategy.symbols,
        timeframe: strategy.timeframe,
        blocks: strategy.blocks.map((block) => {
          // Create a clean block with correct schema fields
          const { id, _id, ...blockData } = block;

          // Ensure block has proper type and subtype
          // If block already has the right format, keep it
          if (
            block.type &&
            block.subtype &&
            ["indicator", "condition", "action"].includes(block.type)
          ) {
            return blockData;
          }

          // Otherwise determine type based on subtype
          const blockType = getBlockType(block.subtype || block.type);

          return {
            ...blockData,
            type: blockType,
            subtype: block.subtype || block.type, // Use existing subtype or fallback to type
            position: block.position || 0,
          };
        }),
        status: "draft",
      };

      // Log the data being sent to the server for debugging
      console.log(
        "Strategy data being sent:",
        JSON.stringify(strategyData, null, 2)
      );

      // Determine if we're creating a new strategy or updating an existing one
      let savedStrategy;

      if (id) {
        // Update existing strategy
        console.log(`Updating strategy: ${id}`);
        savedStrategy = await updateStrategy(id, strategyData, token);
        toast.success("Strategy updated successfully");
      } else {
        // Create new strategy
        console.log("Creating new strategy");
        savedStrategy = await createStrategy(strategyData, token);
        // Update URL to include the new strategy ID without reloading the page
        window.history.pushState({}, "", `/builder/${savedStrategy._id}`);
        // Update state with the new ID
        setStrategy(savedStrategy);
        toast.success("Strategy created successfully");
      }

      // Update local state with the saved data
      setLoading(false);

      return savedStrategy;
    } catch (error) {
      console.error("Save strategy error:", error);
      toast.error(error.message || "Failed to save strategy");
      setLoading(false);
      return null;
    }
  };

  // Helper function to determine block type based on its subtype
  const getBlockType = (subtype) => {
    // Check which category the block belongs to
    for (const category of blockCategories) {
      const found = category.blocks.find((b) => b.id === subtype);
      if (found) {
        // Map category ID to block type expected by server
        switch (category.id) {
          case "indicators":
            return "indicator";
          case "conditions":
            return "condition";
          case "actions":
            return "action";
          default:
            return "indicator";
        }
      }
    }
    return "indicator"; // Default fallback
  };

  const handleRunBacktest = async () => {
    // First save the strategy if it's not saved yet
    if (!strategy._id) {
      toast.error("Please save your strategy before running a backtest");
      return;
    }

    // Open the backtest configuration modal
    setIsBacktestModalOpen(true);
  };

  const handleBacktestOptionChange = (e) => {
    const { name, value } = e.target;
    setBacktestOptions({
      ...backtestOptions,
      [name]: name === "initialCapital" ? parseFloat(value) : value,
    });
  };

  const handleSubmitBacktest = async () => {
    // Close the modal
    setIsBacktestModalOpen(false);

    // Show loading toast
    toast.loading("Running backtest...", { id: "backtest-loading" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Run the backtest with real API
      const result = await runBacktest(strategy._id, backtestOptions, token);

      // Update local state with the updated strategy including the new backtest
      setStrategy(result.strategy);

      // Dismiss loading toast and show success
      toast.dismiss("backtest-loading");

      // Check if this is a mock result (indicated by a message property)
      if (
        result.backtestResult &&
        result.backtestResult.message &&
        result.backtestResult.message.includes("simulated")
      ) {
        toast.success(
          "Backtest completed with simulated data. The Python backtesting service is currently unavailable."
        );
      } else {
        toast.success("Backtest completed successfully!");
      }

      // Navigate to the backtest results page
      navigate(`/backtest-results/${strategy._id}`, {
        state: {
          backtestResult: result.backtestResult,
          strategy: result.strategy,
        },
      });
    } catch (error) {
      toast.dismiss("backtest-loading");

      // More user-friendly error message
      if (
        error.message &&
        error.message.includes("service is currently unavailable")
      ) {
        toast.error(
          "The backtesting service is currently unavailable. Please try again later."
        );
      } else {
        toast.error(`Failed to run backtest: ${error.message}`);
      }

      console.error("Backtest error:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {id ? `Edit Strategy: ${strategy.name}` : "Create New Strategy"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {strategy.description ||
              "Build your trading strategy by dragging blocks into the workflow"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={handleRunBacktest}
          >
            <FiPlay className="mr-2" />
            Run Backtest
          </Button>
          <Button className="flex items-center" onClick={handleSaveStrategy}>
            <FiSave className="mr-2" />
            Save Strategy
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Blocks Panel */}
          <div
            className={`w-full md:w-1/4 ${
              showBlocksPanel ? "block" : "hidden md:block"
            }`}
          >
            <Card title="Building Blocks" className="h-full">
              <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {blockCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <Droppable droppableId="blocks-panel" isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {blockCategories
                      .find((cat) => cat.id === selectedCategory)
                      ?.blocks.map((block, index) => (
                        <Draggable
                          key={block.id}
                          draggableId={block.id}
                          index={index}
                          isDragDisabled={false}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center p-3 rounded-md cursor-pointer ${
                                block.color
                              } border border-transparent hover:border-gray-300 dark:hover:border-gray-600 ${
                                snapshot.isDragging
                                  ? "dragging shadow-lg opacity-80"
                                  : ""
                              }`}
                            >
                              <div className="mr-3">{block.icon}</div>
                              <span className="font-medium">{block.name}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          </div>

          {/* Strategy Builder Canvas */}
          <div className="w-full md:w-3/4">
            <Card
              title="Strategy Workflow"
              subtitle="Drag and drop blocks to build your strategy"
              className="h-full"
            >
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  fullWidth
                  className="flex items-center justify-center"
                  onClick={() => setShowBlocksPanel(!showBlocksPanel)}
                >
                  {showBlocksPanel ? (
                    <>
                      <FiX className="mr-2" />
                      Hide Blocks Panel
                    </>
                  ) : (
                    <>
                      <FiMenu className="mr-2" />
                      Show Blocks Panel
                    </>
                  )}
                </Button>
              </div>

              <Droppable droppableId="strategy-blocks" isDropDisabled={false}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4"
                  >
                    {strategy.blocks.length > 0 ? (
                      <div className="space-y-4">
                        {strategy.blocks
                          .filter((block) => block && block.id) // Ensure blocks have IDs
                          .map((block, index) => {
                            // Find block category and color
                            let blockColor =
                              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                            for (const category of blockCategories) {
                              const foundBlock = category.blocks.find(
                                (b) => b.id === (block.subtype || block.type)
                              );
                              if (foundBlock) {
                                blockColor = foundBlock.color;
                                break;
                              }
                            }

                            // Ensure draggableId is a string
                            const draggableId = String(block.id);

                            return (
                              <Draggable
                                key={draggableId}
                                draggableId={draggableId}
                                index={index}
                                isDragDisabled={false}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center justify-between p-4 rounded-md ${blockColor} border border-gray-200 dark:border-gray-700 ${
                                      snapshot.isDragging
                                        ? "dragging shadow-lg"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-move mr-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                      >
                                        <FiMenu />
                                      </div>
                                      <div>
                                        <h4 className="font-medium">
                                          {block.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          {block.type}{" "}
                                          {block.subtype
                                            ? `(${block.subtype})`
                                            : ""}
                                        </p>
                                        {block.settings &&
                                          Object.keys(block.settings).length >
                                            0 && (
                                            <p className="text-xs mt-1 opacity-80">
                                              {Object.entries(block.settings)
                                                .map(
                                                  ([key, value]) =>
                                                    `${key}: ${value}`
                                                )
                                                .join(", ")}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleEditBlock(block)}
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        aria-label="Edit block"
                                      >
                                        <FiSettings />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRemoveBlock(block.id)
                                        }
                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        aria-label="Remove block"
                                      >
                                        <FiX />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <FiPlus className="text-4xl mb-2" />
                        <p>Drag blocks here to build your strategy</p>
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          </div>
        </div>
      </DragDropContext>

      {/* Block Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={
          selectedBlock ? `Configure ${selectedBlock.name}` : "Block Settings"
        }
        size="md"
      >
        {selectedBlock && (
          <BlockSettingsForm
            block={selectedBlock}
            onSave={handleSaveBlockSettings}
            onCancel={() => setIsSettingsModalOpen(false)}
          />
        )}
      </Modal>

      {/* Backtest Configuration Modal */}
      <Modal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
        title="Configure Backtest"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symbol
            </label>
            <div className="flex items-center">
              <FiBarChart2 className="text-gray-400 mr-2" />
              <input
                type="text"
                name="symbol"
                value={backtestOptions.symbol}
                onChange={handleBacktestOptionChange}
                className="input"
                placeholder="SPY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <div className="flex items-center">
              <FiCalendar className="text-gray-400 mr-2" />
              <input
                type="date"
                name="startDate"
                value={backtestOptions.startDate}
                onChange={handleBacktestOptionChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <div className="flex items-center">
              <FiCalendar className="text-gray-400 mr-2" />
              <input
                type="date"
                name="endDate"
                value={backtestOptions.endDate}
                onChange={handleBacktestOptionChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Capital
            </label>
            <div className="flex items-center">
              <FiDollarSign className="text-gray-400 mr-2" />
              <input
                type="number"
                name="initialCapital"
                value={backtestOptions.initialCapital}
                onChange={handleBacktestOptionChange}
                className="input"
                min="1000"
                step="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeframe
            </label>
            <div className="flex items-center">
              <FiClock className="text-gray-400 mr-2" />
              <select
                name="timeframe"
                value={backtestOptions.timeframe}
                onChange={handleBacktestOptionChange}
                className="input"
              >
                <option value="1d">Daily (1d)</option>
                <option value="1h">Hourly (1h)</option>
                <option value="1w">Weekly (1w)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsBacktestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitBacktest}>Run Backtest</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Simple Block Settings Form Component
const BlockSettingsForm = ({ block, onSave, onCancel }) => {
  const [settings, setSettings] = useState(block.settings || {});

  // Different settings based on block type
  const renderSettings = () => {
    // Determine which settings to render based on block subtype
    const blockType = block.subtype || block.type;

    switch (blockType) {
      // Indicator blocks
      case "sma":
      case "ema":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.period || "14"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    period: parseInt(e.target.value) || 14,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                value={settings.source || "close"}
                onChange={(e) =>
                  setSettings({ ...settings, source: e.target.value })
                }
                className="input"
              >
                <option value="open">Open</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="close">Close</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </>
        );

      case "rsi":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.period || "14"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    period: parseInt(e.target.value) || 14,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overbought Level
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.overbought || "70"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    overbought: parseInt(e.target.value) || 70,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Oversold Level
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.oversold || "30"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    oversold: parseInt(e.target.value) || 30,
                  })
                }
                className="input"
              />
            </div>
          </>
        );

      case "macd":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fast Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.fastPeriod || "12"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    fastPeriod: parseInt(e.target.value) || 12,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slow Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.slowPeriod || "26"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    slowPeriod: parseInt(e.target.value) || 26,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signal Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.signalPeriod || "9"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    signalPeriod: parseInt(e.target.value) || 9,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                value={settings.source || "close"}
                onChange={(e) =>
                  setSettings({ ...settings, source: e.target.value })
                }
                className="input"
              >
                <option value="open">Open</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="close">Close</option>
              </select>
            </div>
          </>
        );

      case "bb":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <input
                type="number"
                min="1"
                value={settings.period || "20"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    period: parseInt(e.target.value) || 20,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard Deviations
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={settings.stdDev || "2"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    stdDev: parseFloat(e.target.value) || 2,
                  })
                }
                className="input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                value={settings.source || "close"}
                onChange={(e) =>
                  setSettings({ ...settings, source: e.target.value })
                }
                className="input"
              >
                <option value="open">Open</option>
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="close">Close</option>
              </select>
            </div>
          </>
        );

      // Condition blocks
      case "crossover":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Indicator
              </label>
              <select
                value={settings.firstIndicator || ""}
                onChange={(e) =>
                  setSettings({ ...settings, firstIndicator: e.target.value })
                }
                className="input"
              >
                <option value="">Select Indicator</option>
                <option value="price">Price</option>
                <option value="sma">SMA</option>
                <option value="ema">EMA</option>
                <option value="macd">MACD</option>
                <option value="rsi">RSI</option>
                <option value="bb_upper">Bollinger Upper</option>
                <option value="bb_middle">Bollinger Middle</option>
                <option value="bb_lower">Bollinger Lower</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comparison
              </label>
              <select
                value={settings.comparison || "crosses_above"}
                onChange={(e) =>
                  setSettings({ ...settings, comparison: e.target.value })
                }
                className="input"
              >
                <option value="crosses_above">Crosses Above</option>
                <option value="crosses_below">Crosses Below</option>
                <option value="is_above">Is Above</option>
                <option value="is_below">Is Below</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Second Indicator/Value
              </label>
              <select
                value={settings.secondIndicator || ""}
                onChange={(e) =>
                  setSettings({ ...settings, secondIndicator: e.target.value })
                }
                className="input"
              >
                <option value="">Select Indicator</option>
                <option value="price">Price</option>
                <option value="sma">SMA</option>
                <option value="ema">EMA</option>
                <option value="macd">MACD</option>
                <option value="rsi">RSI</option>
                <option value="bb_upper">Bollinger Upper</option>
                <option value="bb_middle">Bollinger Middle</option>
                <option value="bb_lower">Bollinger Lower</option>
                <option value="value">Fixed Value</option>
              </select>
            </div>
            {settings.secondIndicator === "value" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fixed Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.value || "0"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input"
                />
              </div>
            )}
          </>
        );

      case "threshold":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Indicator
              </label>
              <select
                value={settings.indicator || ""}
                onChange={(e) =>
                  setSettings({ ...settings, indicator: e.target.value })
                }
                className="input"
              >
                <option value="">Select Indicator</option>
                <option value="price">Price</option>
                <option value="sma">SMA</option>
                <option value="ema">EMA</option>
                <option value="macd">MACD</option>
                <option value="rsi">RSI</option>
                <option value="bb_upper">Bollinger Upper</option>
                <option value="bb_middle">Bollinger Middle</option>
                <option value="bb_lower">Bollinger Lower</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comparison
              </label>
              <select
                value={settings.comparison || "greater_than"}
                onChange={(e) =>
                  setSettings({ ...settings, comparison: e.target.value })
                }
                className="input"
              >
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="equal_to">Equal To</option>
                <option value="greater_equal">Greater Than or Equal</option>
                <option value="less_equal">Less Than or Equal</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Threshold Value
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.value || "0"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </div>
          </>
        );

      case "price_action":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern Type
              </label>
              <select
                value={settings.pattern || "candle"}
                onChange={(e) =>
                  setSettings({ ...settings, pattern: e.target.value })
                }
                className="input"
              >
                <option value="candle">Candlestick Pattern</option>
                <option value="gap">Gap</option>
                <option value="volume">Volume Spike</option>
                <option value="range">Range Breakout</option>
              </select>
            </div>

            {settings.pattern === "candle" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Candlestick Pattern
                </label>
                <select
                  value={settings.candlePattern || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, candlePattern: e.target.value })
                  }
                  className="input"
                >
                  <option value="doji">Doji</option>
                  <option value="hammer">Hammer</option>
                  <option value="engulfing_bullish">Bullish Engulfing</option>
                  <option value="engulfing_bearish">Bearish Engulfing</option>
                  <option value="morning_star">Morning Star</option>
                  <option value="evening_star">Evening Star</option>
                  <option value="shooting_star">Shooting Star</option>
                </select>
              </div>
            )}

            {settings.pattern === "gap" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gap Direction
                </label>
                <select
                  value={settings.gapDirection || "up"}
                  onChange={(e) =>
                    setSettings({ ...settings, gapDirection: e.target.value })
                  }
                  className="input"
                >
                  <option value="up">Gap Up</option>
                  <option value="down">Gap Down</option>
                </select>
              </div>
            )}

            {settings.pattern === "volume" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume Threshold (% above average)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.volumeThreshold || "200"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      volumeThreshold: parseInt(e.target.value) || 200,
                    })
                  }
                  className="input"
                />
              </div>
            )}

            {settings.pattern === "range" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Range Period (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.rangePeriod || "20"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        rangePeriod: parseInt(e.target.value) || 20,
                      })
                    }
                    className="input"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Breakout Direction
                  </label>
                  <select
                    value={settings.breakoutDirection || "up"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        breakoutDirection: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="up">Upward Breakout</option>
                    <option value="down">Downward Breakout</option>
                  </select>
                </div>
              </>
            )}
          </>
        );

      // Action blocks
      case "buy":
      case "sell":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Type
              </label>
              <select
                value={settings.orderType || "market"}
                onChange={(e) =>
                  setSettings({ ...settings, orderType: e.target.value })
                }
                className="input"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>

            {settings.orderType === "limit" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limit Price (% from current)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={
                    settings.limitPrice ||
                    (blockType === "buy" ? "-0.5" : "0.5")
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      limitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input"
                />
              </div>
            )}

            {settings.orderType === "stop" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stop Price (% from current)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={
                    settings.stopPrice || (blockType === "buy" ? "0.5" : "-0.5")
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      stopPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position Size
              </label>
              <select
                value={settings.sizeType || "percentage"}
                onChange={(e) =>
                  setSettings({ ...settings, sizeType: e.target.value })
                }
                className="input"
              >
                <option value="percentage">Percentage of Capital</option>
                <option value="fixed">Fixed USD Amount</option>
                <option value="shares">Number of Shares</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {settings.sizeType === "percentage"
                  ? "Percentage (%)"
                  : settings.sizeType === "fixed"
                  ? "Amount (USD)"
                  : "Shares"}
              </label>
              <input
                type="number"
                min="0"
                step={
                  settings.sizeType === "percentage"
                    ? "1"
                    : settings.sizeType === "fixed"
                    ? "100"
                    : "1"
                }
                value={
                  settings.size ||
                  (settings.sizeType === "percentage"
                    ? "100"
                    : settings.sizeType === "fixed"
                    ? "1000"
                    : "10")
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    size: parseFloat(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </div>
          </>
        );

      case "stop_loss":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={settings.type || "percentage"}
                onChange={(e) =>
                  setSettings({ ...settings, type: e.target.value })
                }
                className="input"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Price</option>
                <option value="atr">ATR Multiple</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {settings.type === "percentage"
                  ? "Percentage (%)"
                  : settings.type === "fixed"
                  ? "Price Level"
                  : "ATR Multiple"}
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  settings.value ||
                  (settings.type === "percentage"
                    ? "2"
                    : settings.type === "fixed"
                    ? "0"
                    : "2")
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </div>

            {settings.type === "atr" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ATR Period
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.atrPeriod || "14"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      atrPeriod: parseInt(e.target.value) || 14,
                    })
                  }
                  className="input"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trailing Stop
              </label>
              <select
                value={settings.trailing || "false"}
                onChange={(e) =>
                  setSettings({ ...settings, trailing: e.target.value })
                }
                className="input"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </>
        );

      case "take_profit":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={settings.type || "percentage"}
                onChange={(e) =>
                  setSettings({ ...settings, type: e.target.value })
                }
                className="input"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Price</option>
                <option value="rr">Risk/Reward Ratio</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {settings.type === "percentage"
                  ? "Percentage (%)"
                  : settings.type === "fixed"
                  ? "Price Level"
                  : "Risk/Reward Ratio"}
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  settings.value ||
                  (settings.type === "percentage"
                    ? "5"
                    : settings.type === "fixed"
                    ? "0"
                    : "2")
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                className="input"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exit Method
              </label>
              <select
                value={settings.exitMethod || "full"}
                onChange={(e) =>
                  setSettings({ ...settings, exitMethod: e.target.value })
                }
                className="input"
              >
                <option value="full">Exit Full Position</option>
                <option value="partial">Partial Exit</option>
              </select>
            </div>

            {settings.exitMethod === "partial" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exit Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.exitPercentage || "50"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      exitPercentage: parseInt(e.target.value) || 50,
                    })
                  }
                  className="input"
                />
              </div>
            )}
          </>
        );

      default:
        return (
          <p className="text-gray-600 dark:text-gray-400">
            No configuration options available for this block.
          </p>
        );
    }
  };

  return (
    <div>
      {renderSettings()}

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(settings)}>Save Settings</Button>
      </div>
    </div>
  );
};

export default BlockBuilder;
