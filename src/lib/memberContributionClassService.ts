import { dbGetAll, dbInsert, generateId } from './supabaseDB';
import { addAuditLog, canChangeContributionClass, type AdminUser } from './adminService';
import { getMemberById, updateMember, type Member } from './dataService';

export type ContributionClass = "Class 1" | "Class 2" | "Class 3";

export interface MemberContributionClassChange {
  id: string;
  memberId: string;
  oldClass?: ContributionClass;
  newClass: ContributionClass | undefined;
  changedByAdminId: string;
  changedByName: string;
  changedByRole: AdminUser["role"];
  reason?: string;
  changedAt: string;
}

const MEMBER_CLASS_CHANGES_KEY = "choir_member_class_changes";

export const CONTRIBUTION_CLASSES: ContributionClass[] = ["Class 1", "Class 2", "Class 3"];

export function isContributionClass(value: string | null | undefined): value is ContributionClass {
  return value === "Class 1" || value === "Class 2" || value === "Class 3";
}

export function getClassAmountForMember(type: {
  specialAmountMode?: "flat_per_member" | "class_based";
  amount: number;
  class1Amount?: number;
  class2Amount?: number;
  class3Amount?: number;
}, memberClass?: string | null): number {
  if (type.specialAmountMode !== "class_based") {
    return type.amount;
  }

  if (memberClass === "Class 1") return type.class1Amount ?? type.amount;
  if (memberClass === "Class 2") return type.class2Amount ?? type.amount;
  if (memberClass === "Class 3") return type.class3Amount ?? type.amount;
  return 0;
}

export async function getMemberContributionClassHistory(memberId: string): Promise<MemberContributionClassChange[]> {
  const all = await dbGetAll<MemberContributionClassChange>(MEMBER_CLASS_CHANGES_KEY);
  return all.filter((entry) => entry.memberId === memberId);
}

export async function updateMemberContributionClass(params: {
  memberId: string;
  newClass: ContributionClass | undefined;
  changedBy: Pick<AdminUser, "id" | "email" | "name" | "role">;
  reason?: string;
}): Promise<Member | null> {
  if (!canChangeContributionClass(params.changedBy)) {
    throw new Error("You do not have permission to change contribution class.");
  }

  const member = await getMemberById(params.memberId);
  if (!member) {
    throw new Error("Member not found.");
  }

  const oldClass = member.specialContributionClass;
  if (oldClass === params.newClass) {
    return member;
  }

  const updated = await updateMember(params.memberId, {
    specialContributionClass: params.newClass,
  });

  if (!updated) {
    throw new Error("Failed to update member class.");
  }

  await dbInsert<MemberContributionClassChange>(MEMBER_CLASS_CHANGES_KEY, {
    id: `class-change-${generateId()}`,
    memberId: params.memberId,
    oldClass,
    newClass: params.newClass,
    changedByAdminId: params.changedBy.id,
    changedByName: params.changedBy.name,
    changedByRole: params.changedBy.role,
    reason: params.reason,
    changedAt: new Date().toISOString(),
  });

  await addAuditLog(
    params.changedBy,
    "UPDATE_MEMBER_CONTRIBUTION_CLASS",
    `Changed ${member.name} class from ${oldClass || "Unassigned"} to ${params.newClass || "Unassigned"}${params.reason ? ` (${params.reason})` : ""}`
  );

  return updated;
}
