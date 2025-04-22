import { Link } from "react-router-dom";
import Button from "../components/Button";
import { FiAlertTriangle } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <FiAlertTriangle className="text-primary-600 dark:text-primary-400 text-6xl mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Link to="/">
          <Button size="lg">Go to Home Page</Button>
        </Link>
        <Link to="/contact">
          <Button variant="outline" size="lg">
            Contact Support
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
