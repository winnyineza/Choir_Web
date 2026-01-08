import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { 
  authenticateAdmin, 
  getAdminById, 
  addAuditLog,
  type AdminUser, 
} from "@/lib/adminService";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isSuperAdmin: boolean;
  sessionTimeRemaining: number | null;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "sop_admin_auth";
const SESSION_DURATION_DEFAULT = 30 * 60 * 1000; // 30 minutes
const SESSION_DURATION_REMEMBER = 7 * 24 * 60 * 60 * 1000; // 7 days
const INACTIVITY_WARNING = 5 * 60 * 1000; // 5 minutes before expiry

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Calculate session time remaining
  useEffect(() => {
    if (!sessionExpiry || !isAuthenticated) {
      setSessionTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = sessionExpiry - Date.now();
      if (remaining <= 0) {
        // Session expired - auto logout
        logout();
      } else {
        setSessionTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry, isAuthenticated]);

  // Activity tracking for session extension (only if not "remember me")
  useEffect(() => {
    if (!isAuthenticated || rememberMe) return;

    const resetActivity = () => {
      // Only extend if more than 5 minutes have been used
      if (sessionExpiry && sessionExpiry - Date.now() < SESSION_DURATION_DEFAULT - INACTIVITY_WARNING) {
        extendSession();
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [isAuthenticated, rememberMe, sessionExpiry]);

  // Load session on mount
  useEffect(() => {
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        const isExpired = Date.now() > tokenData.expiry;
        
        if (!isExpired && tokenData.userId) {
          const user = getAdminById(tokenData.userId);
          if (user && user.isActive) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setSessionExpiry(tokenData.expiry);
            setRememberMe(tokenData.rememberMe || false);
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

  const login = async (email: string, password: string, remember: boolean = false): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user = authenticateAdmin(email, password);
    
    if (user) {
      const duration = remember ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
      const expiry = Date.now() + duration;
      
      const tokenData = {
        userId: user.id,
        expiry,
        rememberMe: remember,
      };
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData));
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setSessionExpiry(expiry);
      setRememberMe(remember);
      return true;
    }
    
    return false;
  };

  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog(currentUser, "LOGOUT", "Admin logged out");
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSessionExpiry(null);
    setRememberMe(false);
  }, [currentUser]);

  const extendSession = useCallback(() => {
    if (!isAuthenticated || !currentUser) return;
    
    const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
    const newExpiry = Date.now() + duration;
    
    const tokenData = {
      userId: currentUser.id,
      expiry: newExpiry,
      rememberMe,
    };
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData));
    setSessionExpiry(newExpiry);
  }, [isAuthenticated, currentUser, rememberMe]);

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
        sessionTimeRemaining,
        extendSession,
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
