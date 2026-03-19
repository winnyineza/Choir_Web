// Donation Service - Track all donations received
// Supabase-based data management (via supabaseDB)

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  method: "bank" | "mtn" | "airtel" | "card" | "cash" | "other";
  reference?: string;
  message?: string;
  date: string;
  recordedBy: string;
  createdAt: string;
}

const STORAGE_KEY = "serenades_donations";

export async function getAllDonations(): Promise<Donation[]> {
  return dbGetAll<Donation>(STORAGE_KEY);
}

export async function getDonationById(id: string): Promise<Donation | undefined> {
  const donation = await dbGetById<Donation>(STORAGE_KEY, id);
  return donation ?? undefined;
}

export async function createDonation(
  donation: Omit<Donation, "id" | "createdAt">
): Promise<Donation> {
  const newDonation = {
    ...donation,
    id: `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  return dbInsert<Donation>(STORAGE_KEY, newDonation);
}

export async function updateDonation(
  id: string,
  updates: Partial<Donation>
): Promise<Donation | null> {
  try {
    return await dbUpdate<Donation>(STORAGE_KEY, id, updates);
  } catch {
    return null;
  }
}

export async function deleteDonation(id: string): Promise<boolean> {
  try {
    await dbDelete(STORAGE_KEY, id);
    return true;
  } catch {
    return false;
  }
}

export async function getDonationStats(): Promise<{
  total: number;
  thisMonth: number;
  count: number;
  byMethod: Record<string, number>;
}> {
  const donations = await getAllDonations();
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const now = new Date();
  const thisMonth = donations
    .filter((d) => {
      const date = new Date(d.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.amount, 0);

  const byMethod = donations.reduce(
    (acc, d) => {
      acc[d.method] = (acc[d.method] || 0) + d.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return { total, thisMonth, count: donations.length, byMethod };
}
