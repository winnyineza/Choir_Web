// Ticket Order Service
// Manages ticket orders with Supabase (via supabaseDB)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, dbQuery, generateId } from './supabaseDB';
import { reduceTicketAvailability, checkTicketAvailability } from './dataService';

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string;
  perks: string[];
  available: number;
  sold?: number;
  maxPerPerson: number;
}

export interface TicketOrder {
  id: string;
  txRef: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImage?: string;
  tickets: {
    tierId: string;
    tierName: string;
    quantity: number;
    priceEach: number;
  }[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  promoCode?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "used";
  archivedAt?: string;
  archivedReason?: string;
  paymentMethod: "mtn" | "airtel" | "card" | "bank";
  transactionId?: string;
  qrCodeData: string;
  createdAt: string;
  confirmedAt?: string;
}

const ORDERS_KEY = "sop_ticket_orders";
const SERVICE_FEE = 500; // RWF

// Get all orders from Supabase
export async function getAllOrders(): Promise<TicketOrder[]> {
  return dbGetAll<TicketOrder>(ORDERS_KEY);
}

// Get orders by status
export async function getOrdersByStatus(status: TicketOrder["status"]): Promise<TicketOrder[]> {
  const orders = await getAllOrders();
  return orders.filter((order) => order.status === status);
}

// Get order by ID
export async function getOrderById(id: string): Promise<TicketOrder | undefined> {
  const order = await dbGetById<TicketOrder>(ORDERS_KEY, id);
  return order ?? undefined;
}

// Get order by transaction reference
export async function getOrderByTxRef(txRef: string): Promise<TicketOrder | undefined> {
  const orders = await dbQuery<TicketOrder>(ORDERS_KEY, 'tx_ref', txRef);
  return orders[0] ?? undefined;
}

// Create new order with availability validation
export async function createOrder(
  order: Omit<TicketOrder, "id" | "createdAt" | "status" | "serviceFee" | "total" | "qrCodeData">
): Promise<{ success: boolean; order?: TicketOrder; error?: string }> {
  const ticketRequests = order.tickets.map((t) => ({
    tierId: t.tierId,
    quantity: t.quantity,
  }));

  const availability = await checkTicketAvailability(order.eventId, ticketRequests);
  if (!availability.available) {
    return { success: false, error: availability.message };
  }

  const txRef = order.txRef;
  const qrCodeData = txRef;
  const discount = order.discount || 0;
  const finalSubtotal = Math.max(0, order.subtotal - discount);

  const newOrder: Omit<TicketOrder, "id" | "createdAt"> & { id?: string; createdAt?: string } = {
    ...order,
    id: `ORD-${Date.now()}`,
    status: "pending",
    serviceFee: SERVICE_FEE,
    discount,
    total: finalSubtotal + SERVICE_FEE,
    qrCodeData,
    createdAt: new Date().toISOString(),
  };

  try {
    const inserted = await dbInsert<TicketOrder>(ORDERS_KEY, newOrder);
    return { success: true, order: inserted };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create order' };
  }
}

// Confirm order and reduce ticket availability
export async function confirmOrder(
  orderId: string,
  transactionId?: string
): Promise<TicketOrder | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const ticketPurchases = order.tickets.map((t) => ({
    tierId: t.tierId,
    quantity: t.quantity,
  }));

  await reduceTicketAvailability(order.eventId, ticketPurchases);

  try {
    return await dbUpdate<TicketOrder>(ORDERS_KEY, orderId, {
      status: "confirmed",
      transactionId: transactionId || order.transactionId,
      confirmedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

// Update order status
export async function updateOrderStatus(
  id: string,
  status: TicketOrder["status"],
  transactionId?: string
): Promise<TicketOrder | null> {
  const order = await getOrderById(id);
  if (!order) return null;

  try {
    return await dbUpdate<TicketOrder>(ORDERS_KEY, id, {
      status,
      transactionId: transactionId ?? order.transactionId,
      confirmedAt: status === "confirmed" ? new Date().toISOString() : order.confirmedAt,
    });
  } catch {
    return null;
  }
}

// Confirm order by transaction reference (called by webhook/callback)
export async function confirmOrderByTxRef(txRef: string, transactionId: string): Promise<TicketOrder | null> {
  const order = await getOrderByTxRef(txRef);
  if (!order) return null;
  return confirmOrder(order.id, transactionId);
}

// Get order statistics
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  used: number;
  archived: number;
  revenue: number;
}> {
  const orders = await getAllOrders();
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    used: orders.filter((o) => o.status === "used").length,
    archived: orders.filter((o) => !!o.archivedAt).length,
    revenue: orders
      .filter((o) => o.status === "confirmed" || o.status === "used")
      .reduce((sum, o) => sum + o.total, 0),
  };
}

// Calculate service fee (sync - no storage access)
export function getServiceFee(): number {
  return SERVICE_FEE;
}

// Delete order (admin only)
export async function deleteOrder(id: string): Promise<boolean> {
  try {
    await dbDelete(ORDERS_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Clear all orders (admin only - for fresh start)
export async function clearAllOrders(): Promise<void> {
  const orders = await getAllOrders();
  for (const order of orders) {
    await dbDelete(ORDERS_KEY, order.id);
  }
}

// Get pending order stats
export async function getPendingOrderStats(): Promise<{
  total: number;
  olderThan1Hour: number;
  olderThan24Hours: number;
  olderThan7Days: number;
  potentialRevenue: number;
}> {
  const orders = await getAllOrders();
  const pendingOrders = orders.filter((o) => o.status === "pending");

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;

  return {
    total: pendingOrders.length,
    olderThan1Hour: pendingOrders.filter((o) => now - new Date(o.createdAt).getTime() > oneHour).length,
    olderThan24Hours: pendingOrders.filter((o) => now - new Date(o.createdAt).getTime() > oneDay).length,
    olderThan7Days: pendingOrders.filter((o) => now - new Date(o.createdAt).getTime() > oneWeek).length,
    potentialRevenue: pendingOrders.reduce((sum, o) => sum + o.total, 0),
  };
}

// Clean up old pending orders - Returns the number of orders cancelled
export async function cleanupOldPendingOrders(maxAgeHours: number = 24): Promise<number> {
  const orders = await getAllOrders();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  let cleanedCount = 0;

  for (const order of orders) {
    if (order.status === "pending") {
      const orderAge = now - new Date(order.createdAt).getTime();
      if (orderAge > maxAgeMs) {
        await dbUpdate<TicketOrder>(ORDERS_KEY, order.id, {
          status: "cancelled",
          archivedAt: new Date().toISOString(),
          archivedReason: `Auto-cancelled pending order older than ${maxAgeHours}h`,
        });
        cleanedCount++;
      }
    }
  }

  return cleanedCount;
}

// Delete pending orders completely (not just cancel)
export async function deletePendingOrders(maxAgeHours: number = 24): Promise<number> {
  const orders = await getAllOrders();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  for (const order of orders) {
    if (order.status === "pending") {
      const orderAge = now - new Date(order.createdAt).getTime();
      if (orderAge > maxAgeMs) {
        await dbUpdate<TicketOrder>(ORDERS_KEY, order.id, {
          status: "cancelled",
          archivedAt: new Date().toISOString(),
          archivedReason: `Archived old pending order (>${maxAgeHours}h)`,
        });
        deletedCount++;
      }
    }
  }

  return deletedCount;
}

export async function getArchivedOrders(): Promise<TicketOrder[]> {
  const orders = await getAllOrders();
  return orders
    .filter((order) => !!order.archivedAt)
    .sort((a, b) => new Date(b.archivedAt || b.createdAt).getTime() - new Date(a.archivedAt || a.createdAt).getTime());
}
