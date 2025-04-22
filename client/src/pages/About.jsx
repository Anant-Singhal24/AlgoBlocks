import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { FiUsers, FiTarget, FiCode, FiTrendingUp } from "react-icons/fi";

// Mission points data
const missionPoints = [
  {
    icon: <FiUsers />,
    title: "Accessibility",
    description:
      "Making algorithmic trading accessible to everyone regardless of technical background.",
  },
  {
    icon: <FiTarget />,
    title: "Empowerment",
    description:
      "Providing traders with tools to make data-driven decisions and automate strategies.",
  },
  {
    icon: <FiCode />,
    title: "Simplicity",
    description:
      "Creating complex strategies through an intuitive visual interface without coding.",
  },
  {
    icon: <FiTrendingUp />,
    title: "Performance",
    description:
      "Enabling traders to backtest and optimize their strategies for maximum returns.",
  },
];

// Story sections data
const storyData = [
  {
    title: "The Beginning",
    paragraphs: [
      "AlgoBlocks was born out of frustration. Our founders, who had been active in the trading community for years, saw that retail traders were at a disadvantage when competing against algorithmic trading systems used by institutions.",
      "They recognized that while these algorithms offered significant advantages, they required programming skills that most traders didn't have. This realization led to a simple question: What if we could make algorithmic trading accessible to everyone?",
    ],
  },
  {
    title: "Our Development",
    paragraphs: [
      "After months of development and feedback from early users, we launched AlgoBlocks with a simple visual interface that allowed traders to build algorithms by connecting blocks that represented different trading components.",
      "Since then, we've continuously improved our platform, adding powerful backtesting capabilities, more sophisticated building blocks, and enhanced risk management tools.",
    ],
  },
  {
    title: "Looking Forward",
    paragraphs: [
      "Today, AlgoBlocks is helping thousands of traders automate their strategies and improve their results. We're committed to continuing our mission of democratizing algorithmic trading, and we have ambitious plans for the future.",
      "We're working on integrating with more brokers, expanding our library of strategy components, and developing advanced features to help our users stay ahead in the markets.",
    ],
  },
];

const About = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About AlgoBlocks
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            We're on a mission to democratize algorithmic trading by making it
            accessible to everyone, regardless of coding experience or technical
            background.
          </p>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-12 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                AlgoBlocks was founded on the belief that algorithmic trading
                shouldn't be limited to institutions and programmers. We're
                building tools to empower retail traders with the same
                capabilities that were previously only available to
                professionals.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our platform makes it possible for anyone to create, test, and
                deploy sophisticated trading strategies without writing a single
                line of code, leveling the playing field for all market
                participants.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                {missionPoints.map((point, index) => (
                  <div
                    key={`mission-${index}`}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                  >
                    <div className="text-4xl text-primary-600 dark:text-primary-400 mb-4">
                      {point.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Story
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The journey behind AlgoBlocks and how we're revolutionizing the
              world of algorithmic trading.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {storyData.map((section, index) => (
              <div
                key={`story-${index}`}
                className={`mb-12 pb-12 ${
                  index < storyData.length - 1
                    ? "border-b border-gray-200 dark:border-gray-700"
                    : ""
                }`}
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h3>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p
                    key={`paragraph-${index}-${pIndex}`}
                    className="text-lg text-gray-600 dark:text-gray-300 mb-4"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 dark:bg-primary-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Join Us on Our Mission
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
            Be part of the revolution in algorithmic trading. Create your first
            strategy today!
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="text-primary-900 bg-white hover:bg-gray-100"
              >
                Get Started for Free
              </Button>
            </Link>
            <Link to="/features">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-primary-700"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
