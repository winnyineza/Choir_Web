import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import {
  getAllEventStaff,
  addEventStaff,
  updateEventStaff,
  deleteEventStaff,
  assignStaffToEvent,
  removeStaffFromEvent,
  getActiveEvents,
  getScanRecordsByStaff,
  type EventStaff,
  type Event,
} from "@/lib/dataService";
import {
  Plus,
  Pencil,
  Trash2,
  User,
  IdCard,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  UserPlus,
  Shield,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function EventStaffManagement() {
  const [staff, setStaff] = useState<EventStaff[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<EventStaff | null>(null);
  const [assigningStaff, setAssigningStaff] = useState<EventStaff | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phone: "",
    email: "",
    status: "active" as "active" | "inactive",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStaff(getAllEventStaff());
    setEvents(getActiveEvents());
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nationalId: "",
      phone: "",
      email: "",
      status: "active",
    });
    setEditingStaff(null);
  };

  const handleOpenModal = (staffMember?: EventStaff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        name: staffMember.name,
        nationalId: staffMember.nationalId,
        phone: staffMember.phone,
        email: staffMember.email || "",
        status: staffMember.status,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.nationalId || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, national ID, and phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate National ID (16 digits for Rwanda)
    if (formData.nationalId.replace(/\D/g, "").length !== 16) {
      toast({
        title: "Invalid National ID",
        description: "National ID must be 16 digits.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate National ID
    const existingStaff = staff.find(
      (s) => s.nationalId === formData.nationalId && s.id !== editingStaff?.id
    );
    if (existingStaff) {
      toast({
        title: "Duplicate National ID",
        description: "A staff member with this National ID already exists.",
        variant: "destructive",
      });
      return;
    }

    if (editingStaff) {
      updateEventStaff(editingStaff.id, formData);
      toast({ title: "Staff Updated", description: `${formData.name} has been updated.` });
    } else {
      addEventStaff({ ...formData, assignedEvents: [] });
      toast({ title: "Staff Added", description: `${formData.name} has been added.` });
    }

    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = (staffMember: EventStaff) => {
    if (confirm(`Are you sure you want to delete ${staffMember.name}?`)) {
      deleteEventStaff(staffMember.id);
      toast({ title: "Staff Deleted", description: `${staffMember.name} has been removed.` });
      loadData();
    }
  };

  const handleAssignEvent = (eventId: string) => {
    if (!assigningStaff) return;
    
    if (assigningStaff.assignedEvents.includes(eventId)) {
      removeStaffFromEvent(assigningStaff.id, eventId);
      toast({ title: "Unassigned", description: `Removed from event.` });
    } else {
      assignStaffToEvent(assigningStaff.id, eventId);
      toast({ title: "Assigned", description: `Assigned to event.` });
    }
    loadData();
    // Refresh the assigning staff data
    const updated = getAllEventStaff().find((s) => s.id === assigningStaff.id);
    if (updated) setAssigningStaff(updated);
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nationalId.includes(searchQuery) ||
      s.phone.includes(searchQuery)
  );

  const getScansCount = (staffId: string) => {
    return getScanRecordsByStaff(staffId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Event Staff
          </h2>
          <p className="text-muted-foreground">
            Manage staff who scan tickets at event entrances
          </p>
        </div>
        <Button variant="gold" onClick={() => handleOpenModal()}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-primary/20"
        />
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{staff.length}</div>
          <div className="text-sm text-muted-foreground">Total Staff</div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="text-2xl font-bold text-green-500">
            {staff.filter((s) => s.status === "active").length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="card-glass rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">
            {staff.reduce((sum, s) => sum + getScansCount(s.id), 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Scans</div>
        </div>
      </div>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">No Staff Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No staff match your search." : "Add your first event staff member."}
          </p>
          {!searchQuery && (
            <Button variant="gold" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="card-glass rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{staffMember.name}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        staffMember.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}
                    >
                      {staffMember.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <IdCard className="w-3 h-3" />
                      {staffMember.nationalId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {staffMember.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      {getScansCount(staffMember.id)} scans
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {staffMember.assignedEvents.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No events assigned</span>
                    ) : (
                      staffMember.assignedEvents.map((eventId) => {
                        const event = events.find((e) => e.id === eventId);
                        return event ? (
                          <span
                            key={eventId}
                            className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary"
                          >
                            {event.title}
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    setAssigningStaff(staffMember);
                    setIsAssignModalOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(staffMember)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(staffMember)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jean Mugabo"
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="nationalId">National ID * (16 digits)</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setFormData({ ...formData, nationalId: value });
                }}
                placeholder="1199880012345678"
                className="mt-1 bg-secondary border-primary/20 font-mono"
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.nationalId.length}/16 digits
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+250 788 123 456"
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@example.com"
                className="mt-1 bg-secondary border-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Inactive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSave} className="flex-1">
                {editingStaff ? "Update" : "Add Staff"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Events Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display">
              Assign Events to {assigningStaff?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {events.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming events available
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {events.map((event) => {
                  const isAssigned = assigningStaff?.assignedEvents.includes(event.id);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all",
                        isAssigned
                          ? "bg-primary/20 border-primary"
                          : "bg-secondary/50 border-primary/10 hover:border-primary/30"
                      )}
                      onClick={() => handleAssignEvent(event.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.date} • {event.location}
                          </p>
                        </div>
                        {isAssigned ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

