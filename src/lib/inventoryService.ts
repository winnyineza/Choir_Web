// Inventory Service - manages choir equipment and assets

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

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ INVENTORY ITEMS ============

export function getAllInventoryItems(): InventoryItem[] {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveItems(items: InventoryItem[]): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
  return getAllInventoryItems().find(item => item.id === id);
}

export function getInventoryByCategory(category: ItemCategory): InventoryItem[] {
  return getAllInventoryItems().filter(item => item.category === category);
}

export function createInventoryItem(data: Omit<InventoryItem, "id" | "createdAt" | "available">): InventoryItem {
  const items = getAllInventoryItems();
  
  const newItem: InventoryItem = {
    ...data,
    id: generateId(),
    available: data.quantity,
    createdAt: new Date().toISOString(),
  };
  
  items.push(newItem);
  saveItems(items);
  return newItem;
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const items = getAllInventoryItems();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  // Recalculate available if quantity changed
  if (updates.quantity !== undefined) {
    const assignments = getItemAssignments(id);
    const assignedQty = assignments.reduce((sum, a) => sum + a.quantity, 0);
    updates.available = updates.quantity - assignedQty;
  }
  
  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveItems(items);
  return items[index];
}

export function deleteInventoryItem(id: string): boolean {
  const items = getAllInventoryItems();
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  
  // Also delete assignments for this item
  const assignments = getAllAssignments().filter(a => a.itemId !== id);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  
  saveItems(filtered);
  return true;
}

// ============ ASSIGNMENTS ============

export function getAllAssignments(): ItemAssignment[] {
  try {
    const stored = localStorage.getItem(ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAssignments(assignments: ItemAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function getItemAssignments(itemId: string): ItemAssignment[] {
  return getAllAssignments().filter(a => a.itemId === itemId && !a.returnedAt);
}

export function getMemberAssignments(memberId: string): ItemAssignment[] {
  return getAllAssignments().filter(a => a.memberId === memberId && !a.returnedAt);
}

export function assignItem(
  itemId: string,
  memberId: string,
  memberName: string,
  quantity: number = 1,
  notes?: string
): ItemAssignment | null {
  const item = getInventoryItemById(itemId);
  if (!item || item.available < quantity) return null;
  
  const assignments = getAllAssignments();
  const newAssignment: ItemAssignment = {
    id: `asgn_${Date.now()}`,
    itemId,
    memberId,
    memberName,
    quantity,
    assignedAt: new Date().toISOString(),
    notes,
  };
  
  assignments.push(newAssignment);
  saveAssignments(assignments);
  
  // Update available count
  updateInventoryItem(itemId, { available: item.available - quantity });
  
  return newAssignment;
}

export function returnItem(assignmentId: string): boolean {
  const assignments = getAllAssignments();
  const index = assignments.findIndex(a => a.id === assignmentId);
  if (index === -1) return false;
  
  const assignment = assignments[index];
  assignments[index] = {
    ...assignment,
    returnedAt: new Date().toISOString(),
  };
  
  saveAssignments(assignments);
  
  // Update available count
  const item = getInventoryItemById(assignment.itemId);
  if (item) {
    updateInventoryItem(assignment.itemId, { available: item.available + assignment.quantity });
  }
  
  return true;
}

// ============ STATS ============

export function getInventoryStats(): InventoryStats {
  const items = getAllInventoryItems();
  const assignments = getAllAssignments().filter(a => !a.returnedAt);
  
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

// ============ UTILITIES ============

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

export function exportInventoryToCSV(): string {
  const items = getAllInventoryItems();
  
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

