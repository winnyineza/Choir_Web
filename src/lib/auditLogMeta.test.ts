import { describe, expect, it } from "vitest";

import { AUDIT_ACTION_CATEGORIES, getActionsForAuditCategory, getAuditCategoryKey } from "./auditLogMeta";

describe("auditLogMeta", () => {
  it("maps known contribution actions to contributions category", () => {
    expect(getAuditCategoryKey("CREATE_CONTRIBUTION_TYPE")).toBe("contributions");
    expect(getAuditCategoryKey("MONTHLY_DUES_TOLERATED")).toBe("contributions");
  });

  it("returns other for unknown actions", () => {
    expect(getAuditCategoryKey("SOMETHING_NEW")).toBe("other");
  });

  it("returns category actions for valid category", () => {
    const actions = getActionsForAuditCategory("admin");
    expect(actions.length).toBeGreaterThan(0);
    expect(actions).toContain("CREATE_ADMIN_INVITE");
  });

  it("returns empty list for all or other categories", () => {
    expect(getActionsForAuditCategory("all")).toEqual([]);
    expect(getActionsForAuditCategory("other")).toEqual([]);
  });

  it("keeps contributions category synced with known additions", () => {
    const contributionActions = AUDIT_ACTION_CATEGORIES.contributions.actions;
    expect(contributionActions).toContain("TOGGLE_CONTRIBUTION_TYPE");
    expect(contributionActions).toContain("MONTHLY_DUES_TOLERANCE_REMOVED");
  });
});
