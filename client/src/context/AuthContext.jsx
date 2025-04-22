import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(0);

  // Use useCallback to memoize the validateToken function
  const validateToken = useCallback(
    async (force = false) => {
      const token = localStorage.getItem("token");

      // If no token, clear user and return
      if (!token) {
        setUser(null);
        setLoading(false);
        return false;
      }

      // Skip validation if it was checked recently (within last minute) unless forced
      const now = Date.now();
      if (!force && lastChecked && now - lastChecked < 60000) {
        setLoading(false);
        return !!user;
      }

      try {
        // Set token for all axios requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        axios.defaults.headers.common["Content-Type"] = "application/json";

        const { data } = await axios.get("/api/auth/me");
        setUser(data.user);
        setLastChecked(now);
        setLoading(false);
        return true;
      } catch (error) {
        console.error("Token validation failed:", error);
        // Clear token on auth failure
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        delete axios.defaults.headers.common["Content-Type"];
        setUser(null);
        setLastChecked(now);
        setLoading(false);
        return false;
      }
    },
    [user, lastChecked]
  );

  useEffect(() => {
    validateToken();

    // Set up periodic authentication check
    const intervalId = setInterval(() => {
      // Only check if the user is logged in (token exists)
      if (localStorage.getItem("token")) {
        validateToken();
      }
    }, 15 * 60 * 1000); // Check every 15 minutes

    return () => clearInterval(intervalId);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });

      // Store token in localStorage
      localStorage.setItem("token", data.token);

      // Set Authorization header for all future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      axios.defaults.headers.common["Content-Type"] = "application/json";

      // Format user data to match what /api/auth/me returns
      // Check if user data exists and extract id safely
      const userData = {
        id: (data.user && (data.user._id || data.user.id)) || "",
        name: data.user ? data.user.name : "",
        email: data.user ? data.user.email : "",
      };

      // Update user state
      setUser(userData);
      setLastChecked(Date.now());

      toast.success("Logged in successfully");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await axios.post("/api/auth/register", userData);
      toast.success("Registration successful! Please log in.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, validateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
