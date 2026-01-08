// Admin User Management Service
// Handles multi-user admin authentication with roles

const ADMIN_USERS_KEY = "choir_admin_users";
const ADMIN_INVITES_KEY = "choir_admin_invites";
const AUDIT_LOG_KEY = "choir_audit_log";

export type AdminRole = "super_admin" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed
  role: AdminRole;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
  isActive: boolean;
}

export interface AdminInvite {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  inviteCode: string;
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  used: boolean;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// Default Super Admin - Change this to your email!
const DEFAULT_SUPER_ADMIN: AdminUser = {
  id: "super-admin-001",
  email: "w.ineza@alustudent.com", // Your email
  name: "Winny Ineza",
  password: "SuperAdmin@2024", // Change this!
  role: "super_admin",
  createdAt: new Date().toISOString(),
  isActive: true,
};

// Initialize admin users with super admin if empty
function initializeAdminUsers(): void {
  const existing = localStorage.getItem(ADMIN_USERS_KEY);
  if (!existing) {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify([DEFAULT_SUPER_ADMIN]));
  } else {
    // Ensure super admin exists
    const users: AdminUser[] = JSON.parse(existing);
    const hasSuperAdmin = users.some(u => u.role === "super_admin");
    if (!hasSuperAdmin) {
      users.push(DEFAULT_SUPER_ADMIN);
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
    }
  }
}

// Get all admin users
export function getAllAdminUsers(): AdminUser[] {
  initializeAdminUsers();
  const data = localStorage.getItem(ADMIN_USERS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get admin user by email
export function getAdminByEmail(email: string): AdminUser | null {
  const users = getAllAdminUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get admin user by ID
export function getAdminById(id: string): AdminUser | null {
  const users = getAllAdminUsers();
  return users.find(u => u.id === id) || null;
}

// Authenticate admin user
export function authenticateAdmin(email: string, password: string): AdminUser | null {
  const user = getAdminByEmail(email);
  if (!user) return null;
  if (!user.isActive) return null;
  if (user.password !== password) return null;
  
  // Update last login
  updateAdminUser(user.id, { lastLogin: new Date().toISOString() });
  
  // Log the action
  addAuditLog(user, "LOGIN", "Admin logged in");
  
  return user;
}

// Create admin user (only super_admin can do this)
export function createAdminUser(
  data: Omit<AdminUser, "id" | "createdAt" | "isActive">,
  createdBy: string
): AdminUser {
  const users = getAllAdminUsers();
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error("An admin with this email already exists");
  }
  
  const newUser: AdminUser = {
    ...data,
    id: `admin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy,
    isActive: true,
  };
  
  users.push(newUser);
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  
  return newUser;
}

// Update admin user
export function updateAdminUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
  const users = getAllAdminUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  // Prevent changing super_admin role
  if (users[index].role === "super_admin" && updates.role && updates.role !== "super_admin") {
    throw new Error("Cannot change super admin role");
  }
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  
  return users[index];
}

// Deactivate admin user (soft delete)
export function deactivateAdminUser(id: string): boolean {
  const users = getAllAdminUsers();
  const user = users.find(u => u.id === id);
  
  // Cannot deactivate super admin
  if (user?.role === "super_admin") {
    throw new Error("Cannot deactivate super admin");
  }
  
  return updateAdminUser(id, { isActive: false }) !== null;
}

// Reactivate admin user
export function reactivateAdminUser(id: string): boolean {
  return updateAdminUser(id, { isActive: true }) !== null;
}

// Delete admin user permanently (only super_admin)
export function deleteAdminUser(id: string): boolean {
  const users = getAllAdminUsers();
  const user = users.find(u => u.id === id);
  
  if (user?.role === "super_admin") {
    throw new Error("Cannot delete super admin");
  }
  
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(filtered));
  return true;
}

// ============ INVITE SYSTEM ============

// Generate invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all invites
export function getAllInvites(): AdminInvite[] {
  const data = localStorage.getItem(ADMIN_INVITES_KEY);
  return data ? JSON.parse(data) : [];
}

// Create invite
export function createInvite(
  email: string,
  name: string,
  role: AdminRole,
  createdBy: string
): AdminInvite {
  // Check if user already exists
  if (getAdminByEmail(email)) {
    throw new Error("An admin with this email already exists");
  }
  
  const invites = getAllInvites();
  
  // Check if invite already exists for this email
  const existingInvite = invites.find(
    i => i.email.toLowerCase() === email.toLowerCase() && !i.used
  );
  if (existingInvite) {
    throw new Error("An active invite already exists for this email");
  }
  
  const invite: AdminInvite = {
    id: `invite-${Date.now()}`,
    email,
    name,
    role,
    inviteCode: generateInviteCode(),
    createdAt: new Date().toISOString(),
    createdBy,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    used: false,
  };
  
  invites.push(invite);
  localStorage.setItem(ADMIN_INVITES_KEY, JSON.stringify(invites));
  
  return invite;
}

// Validate invite code
export function validateInvite(code: string): AdminInvite | null {
  const invites = getAllInvites();
  const invite = invites.find(i => i.inviteCode === code && !i.used);
  
  if (!invite) return null;
  if (new Date(invite.expiresAt) < new Date()) return null;
  
  return invite;
}

// Use invite to create account
export function useInvite(code: string, password: string): AdminUser | null {
  const invite = validateInvite(code);
  if (!invite) return null;
  
  // Create the user
  const user = createAdminUser(
    {
      email: invite.email,
      name: invite.name,
      password,
      role: invite.role,
      createdBy: invite.createdBy,
    },
    invite.createdBy
  );
  
  // Mark invite as used
  const invites = getAllInvites();
  const index = invites.findIndex(i => i.id === invite.id);
  if (index !== -1) {
    invites[index].used = true;
    localStorage.setItem(ADMIN_INVITES_KEY, JSON.stringify(invites));
  }
  
  return user;
}

// Delete invite
export function deleteInvite(id: string): boolean {
  const invites = getAllInvites().filter(i => i.id !== id);
  localStorage.setItem(ADMIN_INVITES_KEY, JSON.stringify(invites));
  return true;
}

// ============ AUDIT LOG ============

// Get audit log
export function getAuditLog(limit: number = 100): AuditLogEntry[] {
  const data = localStorage.getItem(AUDIT_LOG_KEY);
  const logs: AuditLogEntry[] = data ? JSON.parse(data) : [];
  return logs.slice(0, limit);
}

// Add audit log entry
export function addAuditLog(
  user: AdminUser,
  action: string,
  details: string
): void {
  const logs = getAuditLog(1000); // Keep last 1000 entries
  
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  
  logs.unshift(entry); // Add to beginning
  
  // Keep only last 1000 entries
  const trimmed = logs.slice(0, 1000);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
}

// Clear old audit logs (older than 90 days)
export function cleanupAuditLog(): void {
  const logs = getAuditLog(10000);
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const filtered = logs.filter(l => new Date(l.timestamp).getTime() > cutoff);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(filtered));
}

// ============ ROLE HELPERS ============

export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function canManageUsers(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function canViewAuditLog(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function getRoleLabel(role: AdminRole): string {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "admin": return "Admin";
    default: return role;
  }
}

// Initialize on load
initializeAdminUsers();

