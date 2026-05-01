import { describe, expect, it } from "vitest";

import { buildContributionAuditBackfillPreview } from "./auditBackfillService";

describe("auditBackfillService", () => {
  it("builds chronological preview entries for contributions and types", () => {
    const preview = buildContributionAuditBackfillPreview(
      [
        {
          id: "c1",
          memberId: "m1",
          memberName: "Alice",
          memberEmail: "alice@example.com",
          typeId: "t1",
          typeName: "Project Fund",
          category: "special",
          amount: 10000,
          recordedBy: "Admin",
          createdAt: "2026-01-10T10:00:00.000Z",
        },
      ] as any,
      [
        {
          id: "t1",
          name: "Project Fund",
          category: "special",
          amount: 10000,
          isActive: true,
          createdAt: "2026-01-05T10:00:00.000Z",
        },
      ] as any,
    );

    expect(preview).toHaveLength(2);
    expect(preview[0].action).toBe("CREATE_CONTRIBUTION_TYPE");
    expect(preview[1].action).toBe("CREATE_CONTRIBUTION");
  });

  it("filters entries by since date", () => {
    const preview = buildContributionAuditBackfillPreview(
      [
        {
          id: "c1",
          memberId: "m1",
          memberName: "Alice",
          memberEmail: "alice@example.com",
          typeId: "t1",
          typeName: "Project Fund",
          category: "special",
          amount: 10000,
          recordedBy: "Admin",
          createdAt: "2026-01-10T10:00:00.000Z",
        },
      ] as any,
      [
        {
          id: "t1",
          name: "Project Fund",
          category: "special",
          amount: 10000,
          isActive: true,
          createdAt: "2026-01-05T10:00:00.000Z",
        },
      ] as any,
      "2026-01-08T00:00:00.000Z",
    );

    expect(preview).toHaveLength(1);
    expect(preview[0].action).toBe("CREATE_CONTRIBUTION");
  });
});
