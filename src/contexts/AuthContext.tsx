import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple credentials - In production, this should be in a secure backend
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "serenades2024",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const authToken = localStorage.getItem("sop_admin_auth");
    if (authToken) {
      const tokenData = JSON.parse(authToken);
      const isExpired = Date.now() > tokenData.expiry;
      if (!isExpired) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("sop_admin_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Set token with 24-hour expiry
      const tokenData = {
        authenticated: true,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem("sop_admin_auth", JSON.stringify(tokenData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("sop_admin_auth");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
