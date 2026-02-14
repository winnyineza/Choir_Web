// Inventory Service - manages choir equipment and assets

import {
  dbGetAll,
  dbGetById,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbQuery,
  dbDeleteWhere,
  generateId,
} from './supabaseDB';

export type ItemCategory = "robes" | "instruments" | "electronics" | "furniture" | "music_stands" | "other";
export type ItemCondition = "excellent" | "good" | "fair" | "needs_repair" | "unusable";

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  available: number; // How many are not assigned
  condition: ItemCondition;
  location: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  serialNumber?: string;
  notes?: string;
  lastChecked?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemAssignment {
  id: string;
  itemId: string;
  memberId: string;
  memberName: string;
  quantity: number;
  assignedAt: string;
  returnedAt?: string;
  notes?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  byCategory: Record<ItemCategory, number>;
  byCondition: Record<ItemCondition, number>;
  assignedCount: number;
  needsRepairCount: number;
}

const INVENTORY_KEY = "choir_inventory";
const ASSIGNMENTS_KEY = "choir_inventory_assignments";

// ============ INVENTORY ITEMS ============

export async function getAllInventoryItems(): Promise<InventoryItem[]> {
  return dbGetAll<InventoryItem>(INVENTORY_KEY);
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
  const item = await dbGetById<InventoryItem>(INVENTORY_KEY, id);
  return item ?? undefined;
}

export async function getInventoryByCategory(category: ItemCategory): Promise<InventoryItem[]> {
  return dbQuery<InventoryItem>(INVENTORY_KEY, 'category', category);
}

export async function createInventoryItem(
  data: Omit<InventoryItem, "id" | "createdAt" | "available">
): Promise<InventoryItem> {
  const newItem = {
    ...data,
    id: generateId(),
    available: data.quantity,
    createdAt: new Date().toISOString(),
  };
  return dbInsert<InventoryItem>(INVENTORY_KEY, newItem);
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<InventoryItem | null> {
  try {
    const existing = await dbGetById<InventoryItem>(INVENTORY_KEY, id);
    if (!existing) return null;

    // Recalculate available if quantity changed
    if (updates.quantity !== undefined) {
      const assignments = await getItemAssignments(id);
      const assignedQty = assignments.reduce((sum, a) => sum + a.quantity, 0);
      updates.available = updates.quantity - assignedQty;
    }

    const merged = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return await dbUpdate<InventoryItem>(INVENTORY_KEY, id, merged);
  } catch {
    return null;
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
    const existing = await dbGetById<InventoryItem>(INVENTORY_KEY, id);
    if (!existing) return false;

    await dbDeleteWhere(ASSIGNMENTS_KEY, 'item_id', id);
    await dbDelete(INVENTORY_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// ============ ASSIGNMENTS ============

export async function getAllAssignments(): Promise<ItemAssignment[]> {
  return dbGetAll<ItemAssignment>(ASSIGNMENTS_KEY);
}

export async function getItemAssignments(itemId: string): Promise<ItemAssignment[]> {
  const assignments = await dbQuery<ItemAssignment>(ASSIGNMENTS_KEY, 'item_id', itemId);
  return assignments.filter(a => !a.returnedAt);
}

export async function getMemberAssignments(memberId: string): Promise<ItemAssignment[]> {
  const assignments = await dbQuery<ItemAssignment>(ASSIGNMENTS_KEY, 'member_id', memberId);
  return assignments.filter(a => !a.returnedAt);
}

export async function assignItem(
  itemId: string,
  memberId: string,
  memberName: string,
  quantity: number = 1,
  notes?: string
): Promise<ItemAssignment | null> {
  const item = await getInventoryItemById(itemId);
  if (!item || item.available < quantity) return null;

  const newAssignment: Omit<ItemAssignment, "id"> = {
    itemId,
    memberId,
    memberName,
    quantity,
    assignedAt: new Date().toISOString(),
    notes,
  };

  const created = await dbInsert<ItemAssignment>(ASSIGNMENTS_KEY, {
    ...newAssignment,
    id: generateId(),
  });

  await dbUpdate<InventoryItem>(INVENTORY_KEY, itemId, {
    available: item.available - quantity,
    updatedAt: new Date().toISOString(),
  });

  return created;
}

export async function returnItem(assignmentId: string): Promise<boolean> {
  try {
    const assignment = await dbGetById<ItemAssignment>(ASSIGNMENTS_KEY, assignmentId);
    if (!assignment || assignment.returnedAt) return false;

    await dbUpdate<ItemAssignment>(ASSIGNMENTS_KEY, assignmentId, {
      returnedAt: new Date().toISOString(),
    });

    const item = await getInventoryItemById(assignment.itemId);
    if (item) {
      await dbUpdate<InventoryItem>(INVENTORY_KEY, assignment.itemId, {
        available: item.available + assignment.quantity,
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  } catch {
    return false;
  }
}

// ============ STATS ============

export async function getInventoryStats(): Promise<InventoryStats> {
  const items = await getAllInventoryItems();
  const allAssignments = await getAllAssignments();
  const assignments = allAssignments.filter(a => !a.returnedAt);

  const byCategory: Record<ItemCategory, number> = {
    robes: 0,
    instruments: 0,
    electronics: 0,
    furniture: 0,
    music_stands: 0,
    other: 0,
  };

  const byCondition: Record<ItemCondition, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    needs_repair: 0,
    unusable: 0,
  };

  let totalQuantity = 0;
  let totalValue = 0;
  let needsRepairCount = 0;

  items.forEach(item => {
    byCategory[item.category] += item.quantity;
    byCondition[item.condition] += item.quantity;
    totalQuantity += item.quantity;
    totalValue += (item.purchasePrice || 0) * item.quantity;
    if (item.condition === "needs_repair") needsRepairCount += item.quantity;
  });

  return {
    totalItems: items.length,
    totalQuantity,
    totalValue,
    byCategory,
    byCondition,
    assignedCount: assignments.reduce((sum, a) => sum + a.quantity, 0),
    needsRepairCount,
  };
}

// ============ UTILITIES (pure computation - stay sync) ============

export function getCategoryLabel(category: ItemCategory): string {
  const labels: Record<ItemCategory, string> = {
    robes: "Robes & Uniforms",
    instruments: "Instruments",
    electronics: "Electronics",
    furniture: "Furniture",
    music_stands: "Music Stands",
    other: "Other",
  };
  return labels[category];
}

export function getConditionLabel(condition: ItemCondition): string {
  const labels: Record<ItemCondition, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needs_repair: "Needs Repair",
    unusable: "Unusable",
  };
  return labels[condition];
}

export function getConditionColor(condition: ItemCondition): string {
  const colors: Record<ItemCondition, string> = {
    excellent: "text-green-400 bg-green-400/20",
    good: "text-blue-400 bg-blue-400/20",
    fair: "text-yellow-400 bg-yellow-400/20",
    needs_repair: "text-orange-400 bg-orange-400/20",
    unusable: "text-red-400 bg-red-400/20",
  };
  return colors[condition];
}

export async function exportInventoryToCSV(): Promise<string> {
  const items = await getAllInventoryItems();

  const headers = [
    "Name",
    "Category",
    "Quantity",
    "Available",
    "Condition",
    "Location",
    "Purchase Date",
    "Purchase Price",
    "Serial Number",
    "Notes",
  ];

  const rows = items.map(item => [
    item.name,
    getCategoryLabel(item.category),
    item.quantity,
    item.available,
    getConditionLabel(item.condition),
    item.location,
    item.purchaseDate || "",
    item.purchasePrice || "",
    item.serialNumber || "",
    item.notes || "",
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
