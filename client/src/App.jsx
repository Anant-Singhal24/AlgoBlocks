import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import {
  applyDragDropPolyfill,
  addDragEnhancements,
} from "./utils/dragDropPolyfill";

// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const BlockBuilder = lazy(() => import("./pages/BlockBuilder"));
const Strategies = lazy(() => import("./pages/Strategies"));
const MarketData = lazy(() => import("./pages/MarketData"));
const PaperTrading = lazy(() => import("./pages/PaperTrading"));
const BacktestResults = lazy(() => import("./pages/BacktestResults"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Login/Register routes that redirect to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { validateToken } = useAuth();

  // Apply drag and drop polyfills and enhancements
  useEffect(() => {
    applyDragDropPolyfill();
    addDragEnhancements();
  }, []);

  // Validate token only when app is focused after being unfocused
  useEffect(() => {
    let wasUnfocused = false;

    const handleBlur = () => {
      wasUnfocused = true;
    };

    const handleFocus = () => {
      if (wasUnfocused) {
        validateToken();
        wasUnfocused = false;
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [validateToken]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market-data" element={<MarketData />} />

            {/* Public routes - redirect to dashboard if logged in */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder"
              element={
                <ProtectedRoute>
                  <BlockBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builder/:id"
              element={
                <ProtectedRoute>
                  <BlockBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategies"
              element={
                <ProtectedRoute>
                  <Strategies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backtest-results/:id"
              element={
                <ProtectedRoute>
                  <BacktestResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/paper-trading"
              element={
                <ProtectedRoute>
                  <PaperTrading />
                </ProtectedRoute>
              }
            />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
