import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  authenticateAdmin, 
  getAdminById, 
  addAuditLog,
  type AdminUser, 
  type AdminRole 
} from "@/lib/adminService";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "sop_admin_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        const isExpired = Date.now() > tokenData.expiry;
        
        if (!isExpired && tokenData.userId) {
          // Get the user data
          const user = getAdminById(tokenData.userId);
          if (user && user.isActive) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          }
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user = authenticateAdmin(email, password);
    
    if (user) {
      // Set token with 24-hour expiry
      const tokenData = {
        userId: user.id,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData));
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog(currentUser, "LOGOUT", "Admin logged out");
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        currentUser, 
        login, 
        logout,
        isSuperAdmin,
      }}
    >
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
