// Ticket Order Service
// Manages ticket orders with localStorage (replace with backend later)

import { reduceTicketAvailability, checkTicketAvailability } from "./dataService";

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
  eventId: string; // Changed to string to match dataService
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
  discount: number; // Added for promo codes
  total: number;
  promoCode?: string; // Track applied promo code
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "used";
  paymentMethod: "momo" | "card" | "bank";
  transactionId?: string;
  qrCodeData: string; // QR code data for scanning
  createdAt: string;
  confirmedAt?: string;
}

const ORDERS_KEY = "sop_ticket_orders";
const SERVICE_FEE = 500; // RWF

// Get all orders from localStorage
export function getAllOrders(): TicketOrder[] {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get orders by status
export function getOrdersByStatus(status: TicketOrder["status"]): TicketOrder[] {
  return getAllOrders().filter((order) => order.status === status);
}

// Get order by ID
export function getOrderById(id: string): TicketOrder | undefined {
  return getAllOrders().find((order) => order.id === id);
}

// Get order by transaction reference
export function getOrderByTxRef(txRef: string): TicketOrder | undefined {
  return getAllOrders().find((order) => order.txRef === txRef);
}

// Create new order with availability validation
export function createOrder(
  order: Omit<TicketOrder, "id" | "createdAt" | "status" | "serviceFee" | "total" | "qrCodeData">
): { success: boolean; order?: TicketOrder; error?: string } {
  // Check ticket availability first
  const ticketRequests = order.tickets.map((t) => ({
    tierId: t.tierId,
    quantity: t.quantity,
  }));
  
  const availability = checkTicketAvailability(order.eventId, ticketRequests);
  if (!availability.available) {
    return { success: false, error: availability.message };
  }
  
  const orders = getAllOrders();
  
  // Generate unique reference for QR code
  const txRef = order.txRef;
  const qrCodeData = txRef; // QR code contains the transaction reference
  
  // Calculate total with discount
  const discount = order.discount || 0;
  const finalSubtotal = Math.max(0, order.subtotal - discount);
  
  const newOrder: TicketOrder = {
    ...order,
    id: `ORD-${Date.now()}`,
    status: "pending",
    serviceFee: SERVICE_FEE,
    discount,
    total: finalSubtotal + SERVICE_FEE,
    qrCodeData,
    createdAt: new Date().toISOString(),
  };
  
  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  
  return { success: true, order: newOrder };
}

// Confirm order and reduce ticket availability
export function confirmOrder(
  orderId: string,
  transactionId?: string
): TicketOrder | null {
  const orders = getAllOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  
  if (index === -1) return null;
  
  const order = orders[index];
  
  // Reduce ticket availability in the event
  const ticketPurchases = order.tickets.map((t) => ({
    tierId: t.tierId,
    quantity: t.quantity,
  }));
  
  reduceTicketAvailability(order.eventId, ticketPurchases);
  
  // Update order status
  orders[index] = {
    ...orders[index],
    status: "confirmed",
    transactionId: transactionId || orders[index].transactionId,
    confirmedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return orders[index];
}

// Update order status
export function updateOrderStatus(
  id: string,
  status: TicketOrder["status"],
  transactionId?: string
): TicketOrder | null {
  const orders = getAllOrders();
  const index = orders.findIndex((o) => o.id === id);
  
  if (index === -1) return null;
  
  orders[index] = {
    ...orders[index],
    status,
    transactionId: transactionId || orders[index].transactionId,
    confirmedAt: status === "confirmed" ? new Date().toISOString() : orders[index].confirmedAt,
  };
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return orders[index];
}

// Confirm order by transaction reference (called by webhook/callback)
export function confirmOrderByTxRef(txRef: string, transactionId: string): TicketOrder | null {
  const order = getOrderByTxRef(txRef);
  if (!order) return null;
  return updateOrderStatus(order.id, "confirmed", transactionId);
}

// Get order statistics
export function getOrderStats() {
  const orders = getAllOrders();
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    used: orders.filter((o) => o.status === "used").length,
    revenue: orders
      .filter((o) => o.status === "confirmed" || o.status === "used")
      .reduce((sum, o) => sum + o.total, 0),
  };
}

// Calculate service fee
export function getServiceFee(): number {
  return SERVICE_FEE;
}

// Delete order (admin only)
export function deleteOrder(id: string): boolean {
  const orders = getAllOrders();
  const filtered = orders.filter((o) => o.id !== id);
  
  if (filtered.length === orders.length) return false;
  
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
  return true;
}

// Clear all orders (admin only - for fresh start)
export function clearAllOrders(): void {
  localStorage.removeItem(ORDERS_KEY);
}

