import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoStats,
  type PromoCode,
} from "@/lib/promoService";
import { getAllEvents, type Event } from "@/lib/dataService";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Percent,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export function PromoManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    minPurchase: 0,
    maxUses: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eventId: "",
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const [stats, setStats] = useState({ total: 0, active: 0, totalUses: 0 });

  const loadData = async () => {
    const [codes, promoStats, eventsData] = await Promise.all([
      getAllPromoCodes(),
      getPromoStats(),
      getAllEvents(),
    ]);
    setPromoCodes(codes);
    setEvents(eventsData);
    setStats(promoStats);
  };

  // Filter codes
  const filteredCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase());
    const now = new Date();
    const isExpired = new Date(code.validUntil) < now;
    const isNotYetValid = new Date(code.validFrom) > now;
    
    if (filterStatus === "active") return matchesSearch && code.isActive && !isExpired && !isNotYetValid;
    if (filterStatus === "expired") return matchesSearch && isExpired;
    if (filterStatus === "inactive") return matchesSearch && !code.isActive;
    if (filterStatus === "scheduled") return matchesSearch && isNotYetValid;
    return matchesSearch;
  });

  const getCodeStatus = (code: PromoCode) => {
    const now = new Date();
    if (!code.isActive) return { label: "Inactive", color: "text-muted-foreground", bg: "bg-muted/20" };
    if (new Date(code.validUntil) < now) return { label: "Expired", color: "text-red-400", bg: "bg-red-400/20" };
    if (new Date(code.validFrom) > now) return { label: "Scheduled", color: "text-blue-400", bg: "bg-blue-400/20" };
    if (code.maxUses > 0 && code.usedCount >= code.maxUses) return { label: "Maxed Out", color: "text-orange-400", bg: "bg-orange-400/20" };
    return { label: "Active", color: "text-green-400", bg: "bg-green-400/20" };
  };

  const handleSubmit = async () => {
    if (!formData.discountValue || !formData.validFrom || !formData.validUntil) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedPromo) {
        await updatePromoCode(selectedPromo.id, formData);
        if (currentUser) {
          addAuditLog(currentUser, "UPDATE_PROMO", `Updated promo code: ${selectedPromo.code}`);
        }
        toast({ title: "Promo Updated", description: "Promo code has been updated." });
      } else {
        await createPromoCode(formData);
        if (currentUser) {
          addAuditLog(currentUser, "CREATE_PROMO", `Created new promo code`);
        }
        toast({ title: "Promo Created", description: "A new promo code has been generated." });
      }
      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to save promo code", variant: "destructive" });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    const promo = promoCodes.find(p => p.id === id);
    deletePromoCode(id);
    if (currentUser && promo) {
      addAuditLog(currentUser, "DELETE_PROMO", `Deleted promo code: ${promo.code}`);
    }
    toast({ title: "Promo Deleted", description: "Promo code has been deleted." });
    loadData();
  };

  const handleToggleActive = async (code: PromoCode) => {
    await updatePromoCode(code.id, { isActive: !code.isActive });
    if (currentUser) {
      addAuditLog(currentUser, "TOGGLE_PROMO", `${code.isActive ? "Deactivated" : "Activated"} promo code: ${code.code}`);
    }
    await loadData();
    toast({
      title: code.isActive ? "Deactivated" : "Activated",
      description: `Promo code ${code.code} has been ${code.isActive ? "deactivated" : "activated"}.`,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `${code} copied to clipboard.` });
  };

  const openEdit = (code: PromoCode) => {
    setSelectedPromo(code);
    setFormData({
      discountType: code.discountType,
      discountValue: code.discountValue,
      minPurchase: code.minPurchase,
      maxUses: code.maxUses,
      validFrom: code.validFrom.split("T")[0],
      validUntil: code.validUntil.split("T")[0],
      eventId: code.eventId || "",
      isActive: code.isActive,
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setSelectedPromo(null);
    setFormData({
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
      maxUses: 0,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      eventId: "",
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Codes</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold">{stats.active}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{stats.totalUses}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Uses</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search promo codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Codes</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Code
        </Button>
      </div>

      {/* Codes List */}
      {filteredCodes.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No promo codes found</p>
          <Button variant="gold" className="mt-4" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Code
          </Button>
        </div>
      ) : (
        <div className="card-glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary/10">
              <tr>
                <th className="text-left p-3 text-xs font-medium">Code</th>
                <th className="text-left p-3 text-xs font-medium">Discount</th>
                <th className="text-left p-3 text-xs font-medium">Usage</th>
                <th className="text-left p-3 text-xs font-medium">Valid Period</th>
                <th className="text-left p-3 text-xs font-medium">Event</th>
                <th className="text-left p-3 text-xs font-medium">Status</th>
                <th className="text-right p-3 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filteredCodes.map((code) => {
                const status = getCodeStatus(code);
                return (
                  <tr key={code.id} className="hover:bg-primary/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary">{code.code}</code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-1 hover:bg-primary/10 rounded"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {code.discountType === "percentage" ? (
                          <>
                            <Percent className="w-3 h-3 text-muted-foreground" />
                            <span>{code.discountValue}%</span>
                          </>
                        ) : (
                          <>
                            <span>{code.discountValue.toLocaleString()} RWF</span>
                          </>
                        )}
                      </div>
                      {code.minPurchase > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Min: {code.minPurchase.toLocaleString()} RWF
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{code.usedCount}</span>
                      {code.maxUses > 0 && (
                        <span className="text-muted-foreground">/{code.maxUses}</span>
                      )}
                      {code.maxUses === 0 && (
                        <span className="text-muted-foreground text-xs ml-1">(unlimited)</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(code.validFrom).toLocaleDateString()} - {new Date(code.validUntil).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {code.eventId ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          {events.find(e => e.id === code.eventId)?.title || "Event"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">All Events</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full", status.bg, status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(code)}
                          title={code.isActive ? "Deactivate" : "Activate"}
                        >
                          {code.isActive ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(code)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedPromo ? "Edit Promo Code" : "Create Promo Code"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedPromo ? "Update promotional code settings" : "Create a new discount code for events"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedPromo && (
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground">Code</p>
                <code className="font-mono text-2xl font-bold text-primary">{selectedPromo.code}</code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(v) => setFormData({ ...formData, discountType: v as any })}
                >
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (RWF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                  placeholder={formData.discountType === "percentage" ? "10" : "5000"}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Purchase (RWF)</Label>
                <Input
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1 bg-secondary"
                />
                <p className="text-xs text-muted-foreground mt-1">0 = no minimum</p>
              </div>
              <div>
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1 bg-secondary"
                />
                <p className="text-xs text-muted-foreground mt-1">0 = unlimited</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From *</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Valid Until *</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Limit to Event (Optional)</Label>
              <Select
                value={formData.eventId || "all"}
                onValueChange={(v) => setFormData({ ...formData, eventId: v === "all" ? "" : v })}
              >
                <SelectTrigger className="mt-1 bg-secondary">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                {selectedPromo ? "Update" : "Create"} Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

