import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import {
  FiLayers,
  FiBarChart2,
  FiTrendingUp,
  FiShield,
  FiCpu,
  FiTool,
  FiDatabase,
  FiActivity,
} from "react-icons/fi";

// Feature sections data
const mainFeatures = [
  {
    title: "Visual Block-Based Strategy Builder",
    description:
      "Our intuitive drag-and-drop interface makes it easy to create sophisticated trading strategies without writing code. Simply connect blocks that represent different components of your strategy.",
    benefits: [
      "Drag and drop indicators, conditions, and actions to build your strategy",
      "Combine multiple indicators to create complex entry and exit conditions",
      "Add risk management components to protect your capital",
    ],
    buttonText: "Try It Now",
    buttonLink: "/register",
  },
  {
    title: "Powerful Backtesting Engine",
    description:
      "Test your strategies against historical market data to see how they would have performed. Our backtesting engine provides detailed analytics and visualizations to help you understand and improve your strategies.",
    benefits: [
      "Test against years of historical data across multiple markets",
      "View detailed performance metrics, including profit/loss, drawdown, and Sharpe ratio",
      "Visualize trades on interactive charts to understand your strategy's behavior",
    ],
    buttonText: "Backtest Your Strategy",
    buttonLink: "/register",
  },
  {
    title: "Paper Trading & Live Deployment",
    description:
      "Once you've built and tested your strategy, you can deploy it to paper trading to simulate real trading without financial risk, and then move to live trading when you're ready.",
    benefits: [
      "Paper trade with real-time market data to validate your strategy",
      "Track your strategy's performance with real-time analytics",
      "Seamlessly transition from paper trading to live trading when ready",
    ],
    buttonText: "Deploy Your Strategy",
    buttonLink: "/register",
  },
];

// Additional features
const additionalFeatures = [
  {
    icon: <FiCpu />,
    title: "Wide Range of Indicators",
    description:
      "Access 50+ technical indicators including moving averages, RSI, MACD, and Bollinger Bands.",
  },
  {
    icon: <FiTool />,
    title: "Strategy Templates",
    description:
      "Start with pre-built strategy templates for common trading approaches like trend following and mean reversion.",
  },
  {
    icon: <FiShield />,
    title: "Risk Management Tools",
    description:
      "Protect your capital with stop-loss, take-profit, position sizing, and portfolio diversification tools.",
  },
  {
    icon: <FiActivity />,
    title: "Performance Analytics",
    description:
      "Track and analyze your strategy's performance with detailed metrics and interactive charts.",
  },
  {
    icon: <FiDatabase />,
    title: "Historical Data",
    description:
      "Access years of historical market data for stocks, ETFs, forex, and cryptocurrencies.",
  },
  {
    icon: <FiTrendingUp />,
    title: "Market Data Integration",
    description:
      "Connect to real-time market data from multiple sources for testing and live trading.",
  },
];


const Features = () => {
  // Helper function to render check icon
  const CheckIcon = () => (
    <div className="flex-shrink-0 h-6 w-6 text-primary-600 dark:text-primary-400">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );

  // Function to render a feature
  const renderFeature = (feature, index) => {
    return (
      <div
        key={`feature-${index}`}
        className="grid md:grid-cols-2 gap-12 items-center mb-24"
      >
        <div
          className={`${
            feature.imageFirst ? "order-2 md:order-1" : "order-2"
          } bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg`}
        >
          <img
            src={feature.imageSrc}
            alt={feature.imageAlt}
            className="w-full h-auto"
          />
        </div>
        <div className={feature.imageFirst ? "order-1 md:order-2" : "order-1"}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {feature.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {feature.description}
          </p>
          <ul className="space-y-4 mb-8">
            {feature.benefits.map((benefit, i) => (
              <li key={`benefit-${index}-${i}`} className="flex items-start">
                <CheckIcon />
                <p className="ml-3 text-gray-600 dark:text-gray-300">
                  {benefit}
                </p>
              </li>
            ))}
          </ul>
          <Link to={feature.buttonLink}>
            <Button size="lg">{feature.buttonText}</Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Features for Algorithmic Trading
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            AlgoBlocks combines simplicity with powerful capabilities to give
            you everything you need to create, test, and deploy successful
            trading strategies.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {mainFeatures.map(renderFeature)}
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              More Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              AlgoBlocks is packed with features to help you create successful
              trading strategies.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div
                key={`additional-${index}`}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 dark:bg-primary-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Join thousands of traders who are already using AlgoBlocks to create
            and automate their trading strategies.
          </p>
          <Link to="/register">
            <Button
              variant="secondary"
              size="lg"
              className="text-primary-900 bg-white hover:bg-gray-100"
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Features;
