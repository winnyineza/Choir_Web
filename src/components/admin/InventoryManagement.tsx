import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  getAllInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  getAllAssignments,
  assignItem,
  returnItem,
  getCategoryLabel,
  getConditionLabel,
  getConditionColor,
  exportInventoryToCSV,
  type InventoryItem,
  type ItemCategory,
  type ItemCondition,
  type ItemAssignment,
} from "@/lib/inventoryService";
import { getAllMembers, type Member } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Users,
  AlertTriangle,
  CheckCircle,
  Box,
  Music2,
  Monitor,
  Armchair,
  MoreHorizontal,
  UserPlus,
  RotateCcw,
  MapPin,
} from "lucide-react";

const categoryIcons: Record<ItemCategory, any> = {
  robes: Box,
  instruments: Music2,
  electronics: Monitor,
  furniture: Armchair,
  music_stands: Package,
  other: Package,
};

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCondition, setFilterCondition] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as ItemCategory,
    quantity: 1,
    condition: "good" as ItemCondition,
    location: "",
    description: "",
    purchaseDate: "",
    purchasePrice: "",
    serialNumber: "",
    notes: "",
  });

  // Assignment states
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignQuantity, setAssignQuantity] = useState(1);
  const [assignNotes, setAssignNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setItems(getAllInventoryItems());
    setMembers(getAllMembers().filter(m => m.status === "Active"));
  };

  const stats = getInventoryStats();

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesCondition = filterCondition === "all" || item.condition === filterCondition;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in name and location",
        variant: "destructive",
      });
      return;
    }

    if (selectedItem) {
      updateInventoryItem(selectedItem.id, {
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "UPDATE_INVENTORY", `Updated inventory item: ${formData.name}`);
      }
      toast({ title: "Item Updated", description: "Inventory item has been updated." });
    } else {
      createInventoryItem({
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      });
      if (currentUser) {
        addAuditLog(currentUser, "CREATE_INVENTORY", `Added inventory item: ${formData.name} (qty: ${formData.quantity})`);
      }
      toast({ title: "Item Added", description: "New inventory item has been added." });
    }

    loadData();
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    const item = items.find(i => i.id === id);
    try {
      const deleted = await deleteInventoryItem(id);
      if (deleted) {
        if (currentUser && item) {
          addAuditLog(currentUser, "DELETE_INVENTORY", `Deleted inventory item: ${item.name}`);
        }
        toast({ title: "Item Deleted", description: "Inventory item has been deleted." });
        await loadData();
      } else {
        toast({ title: "Error", description: "Item not found or could not be deleted", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!selectedItem || !assignMemberId) return;

    const member = members.find(m => m.id === assignMemberId);
    if (!member) return;

    try {
      const result = await assignItem(
        selectedItem.id,
        assignMemberId,
        member.name,
        assignQuantity,
        assignNotes
      );

      if (result) {
        if (currentUser) {
          addAuditLog(currentUser, "ASSIGN_INVENTORY", `Assigned ${selectedItem.name} (qty: ${assignQuantity}) to ${member.name}`);
        }
        toast({ title: "Item Assigned", description: `${selectedItem.name} assigned to ${member.name}.` });
        await loadData();
        setShowAssignModal(false);
        resetAssignForm();
      } else {
        toast({ title: "Error", description: "Not enough items available.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to assign item", variant: "destructive" });
    }
  };

  const handleReturn = async (assignmentId: string) => {
    if (!confirm("Return this item?")) return;
    try {
      const returned = await returnItem(assignmentId);
      if (returned) {
        if (currentUser) {
          addAuditLog(currentUser, "RETURN_INVENTORY", `Item returned to inventory`);
        }
        toast({ title: "Item Returned", description: "Item has been returned to inventory." });
        await loadData();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to return item", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportInventoryToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Inventory exported to CSV." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      category: "other",
      quantity: 1,
      condition: "good",
      location: "",
      description: "",
      purchaseDate: "",
      purchasePrice: "",
      serialNumber: "",
      notes: "",
    });
  };

  const resetAssignForm = () => {
    setAssignMemberId("");
    setAssignQuantity(1);
    setAssignNotes("");
    setSelectedItem(null);
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      condition: item.condition,
      location: item.location,
      description: item.description || "",
      purchaseDate: item.purchaseDate || "",
      purchasePrice: item.purchasePrice?.toString() || "",
      serialNumber: item.serialNumber || "",
      notes: item.notes || "",
    });
    setShowAddModal(true);
  };

  const openAssignModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAssignQuantity(1);
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.totalItems}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Item Types</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Box className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{stats.totalQuantity}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Items</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xl font-bold">{stats.assignedCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Assigned</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold">{stats.totalQuantity - stats.assignedCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Available</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xl font-bold text-orange-400">{stats.needsRepairCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Needs Repair</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Value</span>
            <span className="text-lg font-bold">{stats.totalValue.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">RWF</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="robes">Robes & Uniforms</SelectItem>
            <SelectItem value="instruments">Instruments</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="music_stands">Music Stands</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-[140px] bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="needs_repair">Needs Repair</SelectItem>
            <SelectItem value="unusable">Unusable</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button variant="gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No inventory items found</p>
          <Button variant="gold" className="mt-4" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="card-glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary/10">
              <tr>
                <th className="text-left p-3 text-xs font-medium">Item</th>
                <th className="text-left p-3 text-xs font-medium">Category</th>
                <th className="text-center p-3 text-xs font-medium">Qty</th>
                <th className="text-center p-3 text-xs font-medium">Available</th>
                <th className="text-left p-3 text-xs font-medium">Condition</th>
                <th className="text-left p-3 text-xs font-medium hidden md:table-cell">Location</th>
                <th className="text-right p-3 text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {filteredItems.map((item) => {
                const CategoryIcon = categoryIcons[item.category];
                const itemAssignments = assignments.filter(a => a.itemId === item.id);
                return (
                  <tr key={item.id} className="hover:bg-primary/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CategoryIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.serialNumber && (
                            <p className="text-xs text-muted-foreground">SN: {item.serialNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {getCategoryLabel(item.category)}
                    </td>
                    <td className="p-3 text-center font-medium">{item.quantity}</td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "font-medium",
                        item.available === 0 ? "text-red-400" : "text-green-400"
                      )}>
                        {item.available}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full", getConditionColor(item.condition))}>
                        {getConditionLabel(item.condition)}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {item.available > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => openAssignModal(item)} title="Assign">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      {/* Show assignments */}
                      {itemAssignments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {itemAssignments.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-xs bg-secondary/50 rounded px-2 py-1">
                              <span className="text-muted-foreground">{a.memberName} ({a.quantity})</span>
                              <button
                                onClick={() => handleReturn(a.id)}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Return
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedItem ? "Edit Item" : "Add Inventory Item"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedItem ? "Update inventory item details" : "Add a new item to inventory"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Choir Robe - Size M"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ItemCategory })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="robes">Robes & Uniforms</SelectItem>
                    <SelectItem value="instruments">Instruments</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="music_stands">Music Stands</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Condition</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v as ItemCondition })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    <SelectItem value="unusable">Unusable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Storage Room A"
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Purchase Price (RWF)</Label>
                <Input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="0"
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Serial Number</Label>
              <Input
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Optional"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes"
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                {selectedItem ? "Update" : "Add"} Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={(open) => { if (!open) { setShowAssignModal(false); resetAssignForm(); } }}>
        <DialogContent className="sm:max-w-md bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Assign Item</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Assign this inventory item to a member
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  Available: {selectedItem.available} of {selectedItem.quantity}
                </p>
              </div>

              <div>
                <Label>Assign To *</Label>
                <Select value={assignMemberId} onValueChange={setAssignMemberId}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem.available}
                  value={assignQuantity}
                  onChange={(e) => setAssignQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.available))}
                  className="mt-1 bg-secondary"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="mt-1 bg-secondary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowAssignModal(false); resetAssignForm(); }}>
                  Cancel
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleAssign} disabled={!assignMemberId}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

