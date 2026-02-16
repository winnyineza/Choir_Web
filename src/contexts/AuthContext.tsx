import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { 
  loginAdmin,
  getAdminById,
  addAuditLog,
  type AdminUser,
  type LoginResult,
} from "@/lib/adminService";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  loginDirect: (user: AdminUser, rememberMe?: boolean) => void;
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

  // Calculate session time remaining
  useEffect(() => {
    if (!sessionExpiry || !isAuthenticated) {
      setSessionTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = sessionExpiry - Date.now();
      if (remaining <= 0) {
        logout();
      } else {
        setSessionTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry, isAuthenticated, logout]);

  // Activity tracking for session extension (only if not "remember me")
  useEffect(() => {
    if (!isAuthenticated || rememberMe) return;

    const resetActivity = () => {
      if (sessionExpiry && sessionExpiry - Date.now() < SESSION_DURATION_DEFAULT - INACTIVITY_WARNING) {
        extendSession();
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetActivity));
    };
  }, [isAuthenticated, rememberMe, sessionExpiry, extendSession]);

  // Load session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (authToken) {
        try {
          const tokenData = JSON.parse(authToken);
          const isExpired = Date.now() > tokenData.expiry;
          
          if (!isExpired && tokenData.userId) {
            const user = await getAdminById(tokenData.userId);
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
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, remember: boolean = false): Promise<LoginResult> => {
    // Add small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = await loginAdmin(email, password);
    
    if (result.success && result.user) {
      const duration = remember ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
      const expiry = Date.now() + duration;
      
      const tokenData = {
        userId: result.user.id,
        expiry,
        rememberMe: remember,
      };
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData));
      
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setSessionExpiry(expiry);
      setRememberMe(remember);
    }
    
    return result;
  };

  // Direct login - skip password verification (for post-signup, where we already have the user)
  const loginDirect = (user: AdminUser, remember: boolean = true) => {
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
    
    addAuditLog(user, "LOGIN", "Logged in after account creation");
  };

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        currentUser, 
        login,
        loginDirect,
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
