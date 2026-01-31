// Supabase Authentication Service with Rate Limiting
import { supabase, isSupabaseConfigured } from './supabase';
import bcrypt from 'bcryptjs';
import { checkRateLimitAsync, recordLoginAttemptAsync, addAuditLogAsync } from './supabaseDataService';

// ============ TYPES ============

export type AdminRole = 'super_admin' | 'main_admin' | 'finance' | 'secretary' | 'disciplinary' | 'reviewer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  memberId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdBy?: string;
  createdAt: string;
}

export type Permission =
  | "dashboard" | "members" | "members_edit" | "events" | "tickets" | "attendance"
  | "leave" | "disciplinary" | "contributions" | "expenses" | "treasury" | "announcements"
  | "messages" | "releases" | "promos" | "gallery" | "inventory" | "minutes" | "documents"
  | "voice_balance" | "analytics" | "event_staff" | "team" | "audit" | "settings";

// Role permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "dashboard", "members", "members_edit", "events", "tickets", "attendance",
    "leave", "disciplinary", "contributions", "expenses", "treasury", "announcements",
    "messages", "releases", "promos", "gallery", "inventory", "minutes", "documents",
    "voice_balance", "analytics", "event_staff", "team", "audit", "settings"
  ],
  main_admin: [
    "dashboard", "members", "members_edit", "events", "tickets", "attendance",
    "leave", "contributions", "expenses", "treasury", "announcements",
    "messages", "releases", "promos", "gallery", "inventory", "minutes", "documents",
    "voice_balance", "analytics", "team", "audit"
  ],
  finance: [
    "dashboard", "members", "contributions", "expenses", "treasury", "analytics"
  ],
  secretary: [
    "dashboard", "members", "members_edit", "events", "tickets", "attendance",
    "leave", "announcements", "messages", "gallery", "inventory", "minutes", "documents"
  ],
  disciplinary: [
    "dashboard", "members", "attendance", "leave", "disciplinary"
  ],
  reviewer: [
    "dashboard", "members", "events", "attendance", "announcements", "gallery"
  ],
};

// ============ AUTHENTICATION ============

export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  isLocked?: boolean;
  lockoutUntil?: Date;
  remainingAttempts?: number;
}

export async function authenticateAdminAsync(email: string, password: string): Promise<LoginResult> {
  // Check rate limit first
  const rateLimit = await checkRateLimitAsync(email);
  
  if (rateLimit.isLocked) {
    return {
      success: false,
      error: `Account locked. Try again after ${rateLimit.lockoutUntil?.toLocaleTimeString()}`,
      isLocked: true,
      lockoutUntil: rateLimit.lockoutUntil,
    };
  }

  if (!isSupabaseConfigured()) {
    // Fallback to localStorage authentication
    return authenticateFromLocalStorage(email, password, rateLimit.failedAttempts);
  }

  try {
    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !user) {
      await recordLoginAttemptAsync(email, false);
      const newAttempts = rateLimit.failedAttempts + 1;
      return {
        success: false,
        error: 'Invalid email or password',
        remainingAttempts: Math.max(0, 5 - newAttempts),
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        error: 'Account is disabled. Contact administrator.',
      };
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      await recordLoginAttemptAsync(email, false);
      const newAttempts = rateLimit.failedAttempts + 1;
      return {
        success: false,
        error: 'Invalid email or password',
        remainingAttempts: Math.max(0, 5 - newAttempts),
      };
    }

    // Successful login - record it and update last login
    await recordLoginAttemptAsync(email, true);
    
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const adminUser: AdminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberId: user.member_id,
      isActive: user.is_active,
      lastLogin: new Date().toISOString(),
      createdBy: user.created_by,
      createdAt: user.created_at,
    };

    // Log the login
    await addAuditLogAsync(adminUser, 'LOGIN', 'Successful login');

    return {
      success: true,
      user: adminUser,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }
}

// Fallback localStorage authentication
async function authenticateFromLocalStorage(
  email: string, 
  password: string,
  failedAttempts: number
): Promise<LoginResult> {
  const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
  const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    await recordLoginAttemptAsync(email, false);
    return {
      success: false,
      error: 'Invalid email or password',
      remainingAttempts: Math.max(0, 5 - failedAttempts - 1),
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      error: 'Account is disabled. Contact administrator.',
    };
  }

  // Check password (handle both hashed and legacy plain text)
  let passwordValid = false;
  if (user.passwordHashed) {
    passwordValid = await bcrypt.compare(password, user.password);
  } else {
    passwordValid = user.password === password;
    // Hash the password on successful login
    if (passwordValid) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.passwordHashed = true;
      localStorage.setItem('choir_admin_users', JSON.stringify(users));
    }
  }

  if (!passwordValid) {
    await recordLoginAttemptAsync(email, false);
    return {
      success: false,
      error: 'Invalid email or password',
      remainingAttempts: Math.max(0, 5 - failedAttempts - 1),
    };
  }

  await recordLoginAttemptAsync(email, true);
  user.lastLogin = new Date().toISOString();
  localStorage.setItem('choir_admin_users', JSON.stringify(users));

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      memberId: user.memberId,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdBy: user.createdBy,
      createdAt: user.createdAt,
    },
  };
}

// ============ USER MANAGEMENT ============

export async function createAdminUserAsync(
  userData: {
    email: string;
    name: string;
    password: string;
    role: AdminRole;
    memberId?: string;
  },
  createdBy: string
): Promise<AdminUser> {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    
    if (users.some((u: any) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      passwordHashed: true,
      role: userData.role,
      memberId: userData.memberId,
      isActive: true,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('choir_admin_users', JSON.stringify(users));

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      memberId: newUser.memberId,
      isActive: newUser.isActive,
      createdBy: newUser.createdBy,
      createdAt: newUser.createdAt,
    };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: userData.email,
      name: userData.name,
      password_hash: hashedPassword,
      role: userData.role,
      member_id: userData.memberId,
      is_active: true,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User with this email already exists');
    }
    throw new Error(error.message);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    memberId: data.member_id,
    isActive: data.is_active,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function getAllAdminUsersAsync(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured()) {
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    return users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      memberId: u.memberId,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      createdBy: u.createdBy,
      createdAt: u.createdAt,
    }));
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    memberId: row.member_id,
    isActive: row.is_active,
    lastLogin: row.last_login,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

export async function updateAdminUserAsync(
  id: string,
  updates: Partial<{
    name: string;
    email: string;
    role: AdminRole;
    isActive: boolean;
    memberId: string;
  }>
): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) {
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    const index = users.findIndex((u: any) => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('choir_admin_users', JSON.stringify(users));
    
    return {
      id: users[index].id,
      email: users[index].email,
      name: users[index].name,
      role: users[index].role,
      memberId: users[index].memberId,
      isActive: users[index].isActive,
      lastLogin: users[index].lastLogin,
      createdBy: users[index].createdBy,
      createdAt: users[index].createdAt,
    };
  }

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.memberId !== undefined) dbUpdates.member_id = updates.memberId;

  const { data, error } = await supabase
    .from('admin_users')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating admin user:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    memberId: data.member_id,
    isActive: data.is_active,
    lastLogin: data.last_login,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

export async function deleteAdminUserAsync(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    const filtered = users.filter((u: any) => u.id !== id);
    if (filtered.length === users.length) return false;
    localStorage.setItem('choir_admin_users', JSON.stringify(filtered));
    return true;
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }

  return true;
}

export async function changePasswordAsync(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const passwordValid = user.passwordHashed
      ? await bcrypt.compare(currentPassword, user.password)
      : user.password === currentPassword;

    if (!passwordValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordHashed = true;
    localStorage.setItem('choir_admin_users', JSON.stringify(users));
    
    return { success: true };
  }

  // Fetch user to verify current password
  const { data: user, error: fetchError } = await supabase
    .from('admin_users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: 'User not found' };
  }

  const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  
  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: newHash })
    .eq('id', userId);

  if (error) {
    return { success: false, error: 'Failed to update password' };
  }

  return { success: true };
}

export async function resetPasswordAsync(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const newHash = await bcrypt.hash(newPassword, 10);

  if (!isSupabaseConfigured()) {
    const users = JSON.parse(localStorage.getItem('choir_admin_users') || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index === -1) return false;
    
    users[index].password = newHash;
    users[index].passwordHashed = true;
    localStorage.setItem('choir_admin_users', JSON.stringify(users));
    return true;
  }

  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: newHash })
    .eq('id', userId);

  return !error;
}

// ============ PERMISSIONS ============

export function hasPermission(user: AdminUser, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function getUserPermissions(user: AdminUser): Permission[] {
  return ROLE_PERMISSIONS[user.role] || [];
}

// ============ PASSWORD STRENGTH ============

export function checkPasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Make it longer (at least 8 characters)');

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Include uppercase letters');

  if (/[a-z]/.test(password)) score++;

  if (/\d/.test(password)) score++;
  else suggestions.push('Include numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else suggestions.push('Include symbols');

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 5) label = 'Strong';
  else if (score >= 4) label = 'Good';
  else if (score >= 3) label = 'Fair';

  return { score, label, suggestions };
}
