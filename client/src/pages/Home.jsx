import { Link } from "react-router-dom";
import { FiBarChart2, FiTrendingUp, FiLayers, FiShield } from "react-icons/fi";
import Button from "../components/Button";

const Home = () => {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="text-primary-600 dark:text-primary-400">
                Empower
              </span>{" "}
              Your Trading with Algorithms
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Build, test, and deploy algorithmic trading strategies without
              coding. AlgoBlocks makes algorithmic trading accessible to
              everyone.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register">
                <Button size="lg">Get Started for Free</Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Automate Your Trading
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              AlgoBlocks provides all the tools you need to create sophisticated
              trading strategies without writing code.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6">
                <FiBarChart2 className="text-primary-600 dark:text-primary-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Visual Strategy Builder
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Drag and drop blocks to build your trading strategy without any
                coding knowledge.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6">
                <FiTrendingUp className="text-primary-600 dark:text-primary-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Powerful Backtesting
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Test your strategies against historical data to evaluate
                performance before going live.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6">
                <FiLayers className="text-primary-600 dark:text-primary-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Prebuilt Components
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access a library of pre-built indicators and strategy components
                to jump-start your trading.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6">
                <FiShield className="text-primary-600 dark:text-primary-400 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Risk Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built-in risk management tools to protect your capital and
                optimize your trading.
              </p>
            </div>

            {/* New feature */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6">
                <FiTrendingUp className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Real-time Market Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access up-to-date financial data from top exchanges and markets.
                View price charts, track performance, and stay informed with our
                comprehensive market data integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 dark:bg-primary-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Join thousands of traders who have already started using AlgoBlocks
            to automate their trading strategies.
          </p>
          <Link to="/register">
            <Button
              variant="secondary"
              size="lg"
              className="text-primary-900 bg-white hover:bg-gray-100"
            >
              Start Building Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
