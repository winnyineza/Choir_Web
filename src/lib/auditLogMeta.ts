export interface AuditActionCategory {
  label: string;
  color: string;
  actions: string[];
}

export const AUDIT_ACTION_CATEGORIES: Record<string, AuditActionCategory> = {
  auth: {
    label: "Authentication",
    color: "text-green-500 bg-green-500/10 border-green-500/20",
    actions: ["LOGIN", "LOGOUT", "PASSWORD_CHANGE", "PASSWORD_RESET"],
  },
  members: {
    label: "Members",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    actions: ["CREATE_MEMBER", "UPDATE_MEMBER", "DELETE_MEMBER", "BULK_UPDATE_MEMBERS", "BULK_DELETE_MEMBERS"],
  },
  contributions: {
    label: "Contributions",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    actions: [
      "CREATE_CONTRIBUTION",
      "UPDATE_CONTRIBUTION",
      "DELETE_CONTRIBUTION",
      "RECORD_CONTRIBUTIONS",
      "CREATE_CONTRIBUTION_TYPE",
      "UPDATE_CONTRIBUTION_TYPE",
      "DELETE_CONTRIBUTION_TYPE",
      "TOGGLE_CONTRIBUTION_TYPE",
      "MONTHLY_DUES_TOLERATED",
      "MONTHLY_DUES_TOLERANCE_REMOVED",
    ],
  },
  expenses: {
    label: "Expenses",
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    actions: ["CREATE_EXPENSE", "UPDATE_EXPENSE", "DELETE_EXPENSE"],
  },
  donations: {
    label: "Donations",
    color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    actions: ["CREATE_DONATION", "UPDATE_DONATION", "DELETE_DONATION"],
  },
  events: {
    label: "Events & Tickets",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    actions: ["CREATE_EVENT", "UPDATE_EVENT", "DELETE_EVENT", "SCAN_TICKET"],
  },
  leave: {
    label: "Leave Requests",
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    actions: ["APPROVE_LEAVE", "DENY_LEAVE", "CREATE_LEAVE"],
  },
  gallery: {
    label: "Gallery",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    actions: ["ADD_GALLERY", "DELETE_GALLERY", "BULK_DELETE_GALLERY", "UPLOAD_GALLERY"],
  },
  music: {
    label: "Music Releases",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    actions: ["CREATE_ALBUM", "UPDATE_ALBUM", "DELETE_ALBUM", "CREATE_VIDEO", "UPDATE_VIDEO", "DELETE_VIDEO"],
  },
  announcements: {
    label: "Announcements",
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    actions: ["CREATE_ANNOUNCEMENT", "UPDATE_ANNOUNCEMENT", "DELETE_ANNOUNCEMENT", "TOGGLE_ANNOUNCEMENT_PIN", "TOGGLE_ANNOUNCEMENT_ACTIVE"],
  },
  disciplinary: {
    label: "Disciplinary",
    color: "text-red-600 bg-red-600/10 border-red-600/20",
    actions: ["CREATE_DISCIPLINARY", "UPDATE_DISCIPLINARY", "DELETE_DISCIPLINARY", "RESOLVE_DISCIPLINARY"],
  },
  documents: {
    label: "Documents",
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    actions: ["UPLOAD_DOCUMENT", "UPDATE_DOCUMENT", "DELETE_DOCUMENT", "TOGGLE_DOCUMENT_VISIBILITY"],
  },
  meetings: {
    label: "Meetings",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    actions: ["CREATE_MEETING", "UPDATE_MEETING", "DELETE_MEETING", "APPROVE_MEETING"],
  },
  inventory: {
    label: "Inventory",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    actions: ["CREATE_INVENTORY", "UPDATE_INVENTORY", "DELETE_INVENTORY", "ASSIGN_INVENTORY", "RETURN_INVENTORY"],
  },
  promos: {
    label: "Promos",
    color: "text-lime-500 bg-lime-500/10 border-lime-500/20",
    actions: ["CREATE_PROMO", "UPDATE_PROMO", "DELETE_PROMO", "TOGGLE_PROMO"],
  },
  admin: {
    label: "Admin Team",
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    actions: [
      "CREATE_INVITE",
      "DELETE_INVITE",
      "CREATE_ADMIN_INVITE",
      "DELETE_ADMIN_INVITE",
      "RESEND_ADMIN_INVITE",
      "DEACTIVATE_ADMIN",
      "REACTIVATE_ADMIN",
      "SEND_MEMBER_INVITE",
      "BULK_SEND_INVITES",
      "UPDATE_SETTINGS",
    ],
  },
};

export function getAuditCategoryKey(action: string): string {
  for (const [key, category] of Object.entries(AUDIT_ACTION_CATEGORIES)) {
    if (category.actions.some((entry) => action.includes(entry) || action === entry)) {
      return key;
    }
  }
  return "other";
}

export function getActionsForAuditCategory(category: string): string[] {
  if (category === "all" || category === "other") return [];
  return AUDIT_ACTION_CATEGORIES[category]?.actions || [];
}
