// Admin User Management Service
// Handles multi-user admin authentication with roles

import bcrypt from "bcryptjs";
import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, generateId } from './supabaseDB';

const ADMIN_USERS_KEY = "choir_admin_users";
const SALT_ROUNDS = 10;
const ADMIN_INVITES_KEY = "choir_admin_invites";
const AUDIT_LOG_KEY = "choir_audit_log";
const PASSWORD_RESET_KEY = "choir_password_resets";

export type AdminRole = "super_admin" | "main_admin" | "finance" | "secretary" | "disciplinary" | "reviewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  password: string; // Hashed with bcrypt
  role: AdminRole;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
  isActive: boolean;
  memberId?: string; // Link to choir member profile (admins are also members)
  passwordHashed?: boolean; // Track if password has been hashed (for migration)
}

// Hash a password
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// Compare password with hash
export function comparePassword(password: string, hash: string): boolean {
  // If password doesn't look hashed (legacy), do direct comparison
  if (!hash.startsWith("$2")) {
    return password === hash;
  }
  return bcrypt.compareSync(password, hash);
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
  memberId?: string; // Link to choir member
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

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
}

// Lazy initialization - ensure default admin exists when Supabase is empty
let adminUsersInitialized = false;

async function ensureAdminUsersInitialized(): Promise<void> {
  if (adminUsersInitialized) return;

  const users = await dbGetAll<AdminUser>(ADMIN_USERS_KEY);

  if (users.length === 0) {
    const defaultSuperAdmin: AdminUser = {
      id: "super-admin-winny",
      email: "w.ineza@alustudent.com",
      name: "Winny Ineza",
      password: hashPassword("Igiraneza1234@ALU"),
      passwordHashed: true,
      role: "super_admin",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await dbInsert<AdminUser>(ADMIN_USERS_KEY, defaultSuperAdmin);
  } else {
    let needsUpdate = false;
    let usersToUpdate = [...users];

    // Remove old hardcoded super-admin-001 if it exists
    const oldHardcodedIndex = usersToUpdate.findIndex(u => u.id === "super-admin-001");
    if (oldHardcodedIndex !== -1) {
      await dbDelete(ADMIN_USERS_KEY, "super-admin-001");
      usersToUpdate = usersToUpdate.filter(u => u.id !== "super-admin-001");
      needsUpdate = true;
    }

    // Ensure super admin exists
    const superAdminExists = usersToUpdate.some(u => u.email.toLowerCase() === "w.ineza@alustudent.com");
    if (!superAdminExists) {
      const defaultSuperAdmin: AdminUser = {
        id: "super-admin-winny",
        email: "w.ineza@alustudent.com",
        name: "Winny Ineza",
        password: hashPassword("Igiraneza1234@ALU"),
        passwordHashed: true,
        role: "super_admin",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await dbInsert<AdminUser>(ADMIN_USERS_KEY, defaultSuperAdmin);
      needsUpdate = true;
    }

    // Migrate unhashed passwords
    for (const user of usersToUpdate) {
      if (!user.passwordHashed && !user.password.startsWith("$2")) {
        await dbUpdate<AdminUser>(ADMIN_USERS_KEY, user.id, {
          password: hashPassword(user.password),
          passwordHashed: true,
        });
      }
    }
  }

  adminUsersInitialized = true;
}

// Get all admin users
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  await ensureAdminUsersInitialized();
  return dbGetAll<AdminUser>(ADMIN_USERS_KEY);
}

// Get admin user by email
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  const users = await getAllAdminUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get admin user by ID
export async function getAdminById(id: string): Promise<AdminUser | null> {
  return dbGetById<AdminUser>(ADMIN_USERS_KEY, id);
}

// Authenticate admin user
export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  const user = await getAdminByEmail(email);
  if (!user) return null;
  if (!user.isActive) return null;
  if (!comparePassword(password, user.password)) return null;

  await updateAdminUser(user.id, { lastLogin: new Date().toISOString() });
  await addAuditLog(user, "LOGIN", "Admin logged in");

  return user;
}

// Create admin user (only super_admin can do this)
export async function createAdminUser(
  data: Omit<AdminUser, "id" | "createdAt" | "isActive">,
  createdBy: string
): Promise<AdminUser> {
  const users = await getAllAdminUsers();

  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error("An admin with this email already exists");
  }

  const newUser = {
    ...data,
    id: `admin-${Date.now()}`,
    password: hashPassword(data.password),
    createdAt: new Date().toISOString(),
    createdBy,
    isActive: true,
    passwordHashed: true,
  };

  return dbInsert<AdminUser>(ADMIN_USERS_KEY, newUser);
}

// Update admin user
export async function updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
  const user = await dbGetById<AdminUser>(ADMIN_USERS_KEY, id);
  if (!user) return null;

  if (user.role === "super_admin" && updates.role && updates.role !== "super_admin") {
    throw new Error("Cannot change super admin role");
  }

  return dbUpdate<AdminUser>(ADMIN_USERS_KEY, id, updates);
}

// Deactivate admin user (soft delete)
export async function deactivateAdminUser(id: string): Promise<boolean> {
  const user = await dbGetById<AdminUser>(ADMIN_USERS_KEY, id);

  if (user?.role === "super_admin") {
    throw new Error("Cannot deactivate super admin");
  }

  const updated = await updateAdminUser(id, { isActive: false });
  return updated !== null;
}

// Reactivate admin user
export async function reactivateAdminUser(id: string): Promise<boolean> {
  const updated = await updateAdminUser(id, { isActive: true });
  return updated !== null;
}

// Delete admin user permanently (only super_admin)
export async function deleteAdminUser(id: string): Promise<boolean> {
  const user = await dbGetById<AdminUser>(ADMIN_USERS_KEY, id);

  if (user?.role === "super_admin") {
    throw new Error("Cannot delete super admin");
  }

  await dbDelete(ADMIN_USERS_KEY, id);
  return true;
}

// ============ INVITE SYSTEM ============

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all invites
export async function getAllInvites(): Promise<AdminInvite[]> {
  return dbGetAll<AdminInvite>(ADMIN_INVITES_KEY);
}

// Create invite
export async function createInvite(
  email: string,
  name: string,
  role: AdminRole,
  createdBy: string,
  memberId?: string
): Promise<AdminInvite> {
  const existingAdmin = await getAdminByEmail(email);
  if (existingAdmin) {
    throw new Error("An admin with this email already exists");
  }

  const invites = await getAllInvites();
  const existingInvite = invites.find(
    i => i.email.toLowerCase() === email.toLowerCase() && !i.used
  );
  if (existingInvite) {
    throw new Error("An active invite already exists for this email");
  }

  const invite: Omit<AdminInvite, "id" | "createdAt" | "expiresAt"> = {
    email,
    name,
    role,
    inviteCode: generateInviteCode(),
    createdBy,
    used: false,
    memberId,
  };

  return dbInsert<AdminInvite>(ADMIN_INVITES_KEY, {
    ...invite,
    id: `invite-${Date.now()}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

// Validate invite code
export async function validateInvite(code: string): Promise<AdminInvite | null> {
  const invites = await getAllInvites();
  const invite = invites.find(i => i.inviteCode === code && !i.used);

  if (!invite) return null;
  if (new Date(invite.expiresAt) < new Date()) return null;

  return invite;
}

// Use invite to create account
export async function redeemInvite(code: string, password: string): Promise<AdminUser | null> {
  const invite = await validateInvite(code);
  if (!invite) return null;

  const user = await createAdminUser(
    {
      email: invite.email,
      name: invite.name,
      password,
      role: invite.role,
      createdBy: invite.createdBy,
      memberId: invite.memberId,
    },
    invite.createdBy
  );

  await dbUpdate<AdminInvite>(ADMIN_INVITES_KEY, invite.id, { used: true });

  return user;
}

// Delete invite
export async function deleteInvite(id: string): Promise<boolean> {
  try {
    await dbDelete(ADMIN_INVITES_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ AUDIT LOG ============

// Get audit log
export async function getAuditLog(limit: number = 100): Promise<AuditLogEntry[]> {
  const logs = await dbGetAll<AuditLogEntry>(AUDIT_LOG_KEY);
  return logs.slice(0, limit);
}

// Add audit log entry
export async function addAuditLog(
  user: { id: string; email: string; name: string },
  action: string,
  details: string
): Promise<void> {
  const entry: Omit<AuditLogEntry, "id"> = {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  await dbInsert<AuditLogEntry>(AUDIT_LOG_KEY, {
    ...entry,
    id: `log-${Date.now()}`,
  });
}

// Clear old audit logs (older than 90 days)
export async function cleanupAuditLog(): Promise<void> {
  const logs = await dbGetAll<AuditLogEntry>(AUDIT_LOG_KEY);
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const toDelete = logs.filter(l => new Date(l.timestamp).getTime() <= cutoff);

  for (const log of toDelete) {
    await dbDelete(AUDIT_LOG_KEY, log.id);
  }
}

// ============ ROLE HELPERS ============
// These operate on passed data - stay sync

export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function isMainAdmin(user: AdminUser | null): boolean {
  return user?.role === "main_admin";
}

export function canManageUsers(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function canViewAuditLog(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function canAccessSettings(user: AdminUser | null): boolean {
  return user?.role === "super_admin";
}

export function getRoleLabel(role: AdminRole): string {
  switch (role) {
    case "super_admin": return "Administrator";
    case "main_admin": return "Administrator";
    case "finance": return "Finance Officer";
    case "secretary": return "Secretary";
    case "disciplinary": return "Disciplinary Officer";
    case "reviewer": return "Reviewer";
    default: return role;
  }
}

// ============ PERMISSION SYSTEM ============

export type Permission =
  | "dashboard"
  | "members"
  | "members_edit"
  | "events"
  | "tickets"
  | "attendance"
  | "leave"
  | "disciplinary"
  | "contributions"
  | "expenses"
  | "treasury"
  | "announcements"
  | "messages"
  | "releases"
  | "promos"
  | "gallery"
  | "inventory"
  | "minutes"
  | "documents"
  | "voice_balance"
  | "surveys"
  | "analytics"
  | "event_staff"
  | "team"
  | "audit"
  | "settings";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "dashboard", "members", "members_edit", "events", "tickets", "attendance",
    "leave", "disciplinary", "contributions", "expenses", "treasury", "announcements", "messages",
    "releases", "promos", "gallery", "inventory", "minutes", "documents", "voice_balance", "surveys", "analytics", "event_staff", "team", "audit", "settings"
  ],
  main_admin: [
    "dashboard", "members", "members_edit", "events", "tickets", "attendance",
    "leave", "disciplinary", "contributions", "expenses", "treasury", "announcements", "messages",
    "releases", "promos", "gallery", "inventory", "minutes", "documents", "voice_balance", "surveys", "analytics", "settings"
  ],
  finance: [
    "dashboard", "members", "tickets", "contributions", "expenses", "treasury"
  ],
  secretary: [
    "dashboard", "members", "members_edit", "events", "attendance", "leave",
    "announcements", "messages", "releases", "promos", "gallery", "inventory", "minutes", "documents", "voice_balance"
  ],
  disciplinary: [
    "dashboard", "members", "leave", "disciplinary"
  ],
  reviewer: [
    "dashboard", "members", "events", "tickets", "attendance", "leave", "disciplinary",
    "contributions", "expenses", "treasury", "announcements", "messages",
    "releases", "promos", "gallery", "inventory", "minutes", "documents", "voice_balance"
  ],
};

export function hasPermission(user: AdminUser | null, permission: Permission): boolean {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function getUserPermissions(user: AdminUser | null): Permission[] {
  if (!user) return [];
  return ROLE_PERMISSIONS[user.role] || [];
}

export function canEditMembers(user: AdminUser | null): boolean {
  return hasPermission(user, "members_edit");
}

export function isReviewer(user: AdminUser | null): boolean {
  return user?.role === "reviewer";
}

export function canApproveLeave(user: AdminUser | null): boolean {
  if (!user) return false;
  return ["super_admin", "main_admin", "secretary", "disciplinary", "reviewer"].includes(user.role);
}

export function hasWriteAccess(user: AdminUser | null, area: string): boolean {
  if (!user) return false;

  if (user.role === "reviewer") {
    return area === "leave";
  }

  return true;
}

export function getAccessibleTabs(user: AdminUser | null): string[] {
  if (!user) return [];

  const tabPermissionMap: Record<string, Permission> = {
    "dashboard": "dashboard",
    "members": "members",
    "events": "events",
    "tickets": "tickets",
    "attendance": "attendance",
    "leave": "leave",
    "disciplinary": "disciplinary",
    "contributions": "contributions",
    "expenses": "expenses",
    "treasury": "treasury",
    "announcements": "announcements",
    "messages": "messages",
    "releases": "releases",
    "promos": "promos",
    "gallery": "gallery",
    "inventory": "inventory",
    "minutes": "minutes",
    "documents": "documents",
    "voice-balance": "voice_balance",
    "surveys": "surveys",
    "analytics": "analytics",
    "event-staff": "event_staff",
    "team": "team",
    "audit": "audit",
    "settings": "settings",
  };

  const userPermissions = getUserPermissions(user);
  return Object.entries(tabPermissionMap)
    .filter(([_, permission]) => userPermissions.includes(permission))
    .map(([tab, _]) => tab);
}

// Get admin by member ID
export async function getAdminByMemberId(memberId: string): Promise<AdminUser | null> {
  const users = await getAllAdminUsers();
  return users.find(u => u.memberId === memberId) || null;
}

// Check if a member is already an admin
export async function isMemberAdmin(memberId: string): Promise<boolean> {
  const admin = await getAdminByMemberId(memberId);
  return admin !== null;
}

// ============ PASSWORD RESET ============

async function getAllPasswordResets(): Promise<PasswordResetToken[]> {
  return dbGetAll<PasswordResetToken>(PASSWORD_RESET_KEY);
}

function generateResetToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Request password reset - generates token
export async function requestPasswordReset(email: string): Promise<PasswordResetToken | null> {
  const user = await getAdminByEmail(email);
  if (!user) return null;

  const resets = await getAllPasswordResets();
  const filtered = resets.filter(r => r.email.toLowerCase() !== email.toLowerCase());

  const resetToken = await dbInsert<PasswordResetToken>(PASSWORD_RESET_KEY, {
    id: `reset-${Date.now()}`,
    userId: user.id,
    email: user.email,
    token: generateResetToken(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    used: false,
  });

  return resetToken;
}

// Validate reset token
export async function validateResetToken(token: string): Promise<PasswordResetToken | null> {
  const resets = await getAllPasswordResets();
  const resetToken = resets.find(r => r.token === token && !r.used);

  if (!resetToken) return null;
  if (new Date(resetToken.expiresAt) < new Date()) return null;

  return resetToken;
}

// Reset password using token
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const resetToken = await validateResetToken(token);
  if (!resetToken) return false;

  const updated = await updateAdminUser(resetToken.userId, {
    password: hashPassword(newPassword),
    passwordHashed: true
  });
  if (!updated) return false;

  await dbUpdate<PasswordResetToken>(PASSWORD_RESET_KEY, resetToken.id, { used: true });
  await addAuditLog(updated, "PASSWORD_RESET", "Password was reset via reset link");

  return true;
}

// Change password (when logged in)
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await getAdminById(userId);
  if (!user) return false;
  if (!comparePassword(currentPassword, user.password)) return false;

  const updated = await updateAdminUser(userId, {
    password: hashPassword(newPassword),
    passwordHashed: true
  });
  if (!updated) return false;

  await addAuditLog(updated, "PASSWORD_CHANGE", "Password was changed");
  return true;
}

// Password strength checker - pure computation, stay sync
export function checkPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else suggestions.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score++;
  else suggestions.push("Add numbers");

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else suggestions.push("Add special characters (!@#$%...)");

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981"];

  return {
    score,
    label: labels[Math.min(score, 5)],
    color: colors[Math.min(score, 5)],
    suggestions,
  };
}
