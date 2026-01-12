// Donation Service - Track all donations received

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  method: "bank" | "mtn" | "airtel" | "cash" | "other";
  reference?: string;
  message?: string;
  date: string;
  recordedBy: string;
  createdAt: string;
}

const STORAGE_KEY = "choir_donations";

export function getAllDonations(): Donation[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getDonationById(id: string): Donation | undefined {
  return getAllDonations().find(d => d.id === id);
}

export function createDonation(donation: Omit<Donation, "id" | "createdAt">): Donation {
  const donations = getAllDonations();
  const newDonation: Donation = {
    ...donation,
    id: `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  donations.push(newDonation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
  return newDonation;
}

export function updateDonation(id: string, updates: Partial<Donation>): Donation | null {
  const donations = getAllDonations();
  const index = donations.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  donations[index] = { ...donations[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
  return donations[index];
}

export function deleteDonation(id: string): boolean {
  const donations = getAllDonations();
  const filtered = donations.filter(d => d.id !== id);
  if (filtered.length === donations.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getDonationStats() {
  const donations = getAllDonations();
  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const thisMonth = donations.filter(d => {
    const date = new Date(d.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, d) => sum + d.amount, 0);
  
  const byMethod = donations.reduce((acc, d) => {
    acc[d.method] = (acc[d.method] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);
  
  return { total, thisMonth, count: donations.length, byMethod };
}

