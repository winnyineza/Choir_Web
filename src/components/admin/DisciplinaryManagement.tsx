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
  getAllDisciplinaryRecords,
  createDisciplinaryRecord,
  updateDisciplinaryRecord,
  resolveDisciplinaryRecord,
  deleteDisciplinaryRecord,
  getDisciplinaryStats,
  exportDisciplinaryToCSV,
  type DisciplinaryRecord,
  type DisciplinaryStats,
} from "@/lib/disciplinaryService";
import { getAllMembers, type Member } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog } from "@/lib/adminService";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Ban,
  DollarSign,
  Clock,
  UserX,
  Award,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";

const typeConfig = {
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "Warning" },
  suspension: { icon: Ban, color: "text-orange-500", bg: "bg-orange-500/20", label: "Suspension" },
  fine: { icon: DollarSign, color: "text-red-500", bg: "bg-red-500/20", label: "Fine" },
  probation: { icon: Clock, color: "text-purple-500", bg: "bg-purple-500/20", label: "Probation" },
  expulsion: { icon: UserX, color: "text-red-600", bg: "bg-red-600/20", label: "Expulsion" },
  commendation: { icon: Award, color: "text-green-500", bg: "bg-green-500/20", label: "Commendation" },
};

const severityConfig = {
  minor: { color: "text-blue-400", bg: "bg-blue-400/20", label: "Minor" },
  moderate: { color: "text-yellow-400", bg: "bg-yellow-400/20", label: "Moderate" },
  major: { color: "text-red-400", bg: "bg-red-400/20", label: "Major" },
};

const statusConfig = {
  active: { color: "text-red-400", bg: "bg-red-400/20", label: "Active" },
  resolved: { color: "text-green-400", bg: "bg-green-400/20", label: "Resolved" },
  appealed: { color: "text-yellow-400", bg: "bg-yellow-400/20", label: "Under Appeal" },
  expired: { color: "text-muted-foreground", bg: "bg-muted/20", label: "Expired" },
};

export function DisciplinaryManagement() {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    memberId: "",
    type: "warning" as DisciplinaryRecord["type"],
    severity: "minor" as DisciplinaryRecord["severity"],
    reason: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    expiryDate: "",
    actionTaken: "",
  });
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [showWitnessDropdown, setShowWitnessDropdown] = useState(false);
  const [resolution, setResolution] = useState("");
  const [stats, setStats] = useState<DisciplinaryStats>({ total: 0, active: 0, resolved: 0, warnings: 0, suspensions: 0, fines: 0, commendations: 0, byMember: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [recordsData, statsData] = await Promise.all([
      getAllDisciplinaryRecords(),
      getDisciplinaryStats(),
    ]);
    setRecords(recordsData);
    setStats(statsData);
    setMembers(getAllMembers());
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || r.type === filterType;
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group by member
  const recordsByMember = filteredRecords.reduce((acc, record) => {
    if (!acc[record.memberId]) {
      acc[record.memberId] = { memberName: record.memberName, records: [] };
    }
    acc[record.memberId].records.push(record);
    return acc;
  }, {} as Record<string, { memberName: string; records: DisciplinaryRecord[] }>);

  const handleSubmit = async () => {
    if (!formData.memberId || !formData.reason || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const member = members.find(m => m.id === formData.memberId);
    if (!member) return;

    try {
      if (selectedRecord) {
        await updateDisciplinaryRecord(selectedRecord.id, {
          ...formData,
          memberName: member.name,
          witnesses: selectedWitnesses.length > 0 ? selectedWitnesses.map(id => {
            const w = members.find(m => m.id === id);
            return w?.name || id;
          }) : undefined,
        });
        if (currentUser) {
          addAuditLog(currentUser, "UPDATE_DISCIPLINARY", `Updated disciplinary record for ${member.name}`);
        }
        toast({ title: "Record Updated", description: "Disciplinary record has been updated." });
      } else {
        await createDisciplinaryRecord({
          ...formData,
          memberName: member.name,
          issuedBy: currentUser?.id || "",
          issuedByName: currentUser?.name || "Admin",
          witnesses: selectedWitnesses.length > 0 ? selectedWitnesses.map(id => {
            const w = members.find(m => m.id === id);
            return w?.name || id;
          }) : undefined,
        });
        if (currentUser) {
          addAuditLog(currentUser, "CREATE_DISCIPLINARY", `Created disciplinary record for ${member.name}: ${formData.type}`);
        }
        toast({ title: "Record Created", description: "Disciplinary record has been created." });
      }
      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save record", variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!selectedRecord || !resolution) {
      toast({
        title: "Error",
        description: "Please provide a resolution",
        variant: "destructive",
      });
      return;
    }

    try {
      await resolveDisciplinaryRecord(selectedRecord.id, resolution, currentUser?.name || "Admin");
      if (currentUser) {
        addAuditLog(currentUser, "RESOLVE_DISCIPLINARY", `Resolved disciplinary record for ${selectedRecord.memberName}`);
      }
      toast({ title: "Record Resolved", description: "Disciplinary record has been resolved." });
      await loadData();
      setShowResolveModal(false);
      setResolution("");
      setSelectedRecord(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to resolve record", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const record = records.find(r => r.id === id);
    try {
      const deleted = await deleteDisciplinaryRecord(id);
      if (deleted) {
        if (currentUser && record) {
          addAuditLog(currentUser, "DELETE_DISCIPLINARY", `Deleted disciplinary record for ${record.memberName}`);
        }
        toast({ title: "Record Deleted", description: "Disciplinary record has been deleted." });
        await loadData();
      } else {
        toast({ title: "Error", description: "Record not found or could not be deleted", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    try {
      const csv = await exportDisciplinaryToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `disciplinary_records_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "Disciplinary records exported to CSV." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      memberId: "",
      type: "warning",
      severity: "minor",
      reason: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      expiryDate: "",
      actionTaken: "",
    });
    setSelectedWitnesses([]);
    setShowWitnessDropdown(false);
    setSelectedRecord(null);
  };

  const openEditModal = (record: DisciplinaryRecord) => {
    setSelectedRecord(record);
    setFormData({
      memberId: record.memberId,
      type: record.type,
      severity: record.severity,
      reason: record.reason,
      description: record.description,
      date: record.date.split("T")[0],
      expiryDate: record.expiryDate?.split("T")[0] || "",
      actionTaken: record.actionTaken || "",
    });
    // Find member IDs for witnesses by name
    if (record.witnesses && record.witnesses.length > 0) {
      const witnessIds = record.witnesses.map(witnessName => {
        const member = members.find(m => m.name === witnessName);
        return member?.id || "";
      }).filter(id => id !== "");
      setSelectedWitnesses(witnessIds);
    } else {
      setSelectedWitnesses([]);
    }
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Records</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xl font-bold text-red-400">{stats.active}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Active</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold text-green-400">{stats.resolved}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Resolved</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-xl font-bold">{stats.warnings}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Warnings</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Ban className="w-4 h-4 text-orange-500" />
            <span className="text-xl font-bold">{stats.suspensions}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Suspensions</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <DollarSign className="w-4 h-4 text-red-500" />
            <span className="text-xl font-bold">{stats.fines}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Fines</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Award className="w-4 h-4 text-green-500" />
            <span className="text-xl font-bold">{stats.commendations}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Commendations</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by member or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="warning">Warnings</SelectItem>
            <SelectItem value="suspension">Suspensions</SelectItem>
            <SelectItem value="fine">Fines</SelectItem>
            <SelectItem value="probation">Probation</SelectItem>
            <SelectItem value="expulsion">Expulsion</SelectItem>
            <SelectItem value="commendation">Commendations</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="appealed">Appealed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button variant="gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Record
        </Button>
      </div>

      {/* Records by Member */}
      <div className="space-y-4">
        {Object.entries(recordsByMember).length === 0 ? (
          <div className="card-glass rounded-xl p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No disciplinary records found</p>
          </div>
        ) : (
          Object.entries(recordsByMember).map(([memberId, { memberName, records: memberRecords }]) => (
            <div key={memberId} className="card-glass rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedMember(expandedMember === memberId ? null : memberId)}
                className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {memberRecords.length} record{memberRecords.length !== 1 ? "s" : ""} •{" "}
                      {memberRecords.filter(r => r.status === "active").length} active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {memberRecords.some(r => r.status === "active") && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                      Active Records
                    </span>
                  )}
                  {expandedMember === memberId ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedMember === memberId && (
                <div className="border-t border-primary/10 divide-y divide-primary/10">
                  {memberRecords.map((record) => {
                    const TypeIcon = typeConfig[record.type].icon;
                    return (
                      <div key={record.id} className="p-4 flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", typeConfig[record.type].bg)}>
                          <TypeIcon className={cn("w-5 h-5", typeConfig[record.type].color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-sm font-medium", typeConfig[record.type].color)}>
                              {typeConfig[record.type].label}
                            </span>
                            <span className={cn("px-2 py-0.5 text-xs rounded-full", severityConfig[record.severity].bg, severityConfig[record.severity].color)}>
                              {severityConfig[record.severity].label}
                            </span>
                            <span className={cn("px-2 py-0.5 text-xs rounded-full", statusConfig[record.status].bg, statusConfig[record.status].color)}>
                              {statusConfig[record.status].label}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1">{record.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(record.date).toLocaleDateString()}
                            </span>
                            <span>Issued by: {record.issuedByName}</span>
                            {record.expiryDate && (
                              <span>Expires: {new Date(record.expiryDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedRecord(record); setShowViewModal(true); }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {record.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedRecord(record); setShowResolveModal(true); }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedRecord ? "Edit Record" : "New Disciplinary Record"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedRecord ? "Update disciplinary record details" : "Create a new disciplinary record for a member"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Member *</Label>
              <Select value={formData.memberId} onValueChange={(v) => setFormData({ ...formData, memberId: v })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="fine">Fine</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="expulsion">Expulsion</SelectItem>
                    <SelectItem value="commendation">Commendation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v as any })}>
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div>
              <Label>Reason *</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief reason"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the incident"
                className="mt-1 bg-secondary min-h-[100px]"
              />
            </div>

            <div>
              <Label>Action Taken</Label>
              <Input
                value={formData.actionTaken}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                placeholder="What action was taken?"
                className="mt-1 bg-secondary"
              />
            </div>

            <div>
              <Label>Witnesses (Optional)</Label>
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() => setShowWitnessDropdown(!showWitnessDropdown)}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-secondary border border-primary/20 text-left hover:border-primary/40 transition-colors"
                >
                  <span className={cn("text-sm", selectedWitnesses.length === 0 && "text-muted-foreground")}>
                    {selectedWitnesses.length === 0 
                      ? "Select witnesses..." 
                      : `${selectedWitnesses.length} witness${selectedWitnesses.length > 1 ? "es" : ""} selected`}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showWitnessDropdown && "rotate-180")} />
                </button>
                {showWitnessDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-charcoal border border-primary/20 rounded-md shadow-lg">
                    {members
                      .filter(m => m.status === "Active" && m.id !== formData.memberId)
                      .map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWitnesses.includes(m.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWitnesses([...selectedWitnesses, m.id]);
                              } else {
                                setSelectedWitnesses(selectedWitnesses.filter(id => id !== m.id));
                              }
                            }}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm">{m.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{m.voice}</span>
                        </label>
                      ))}
                    {members.filter(m => m.status === "Active" && m.id !== formData.memberId).length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No other members available</p>
                    )}
                  </div>
                )}
              </div>
              {selectedWitnesses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedWitnesses.map(id => {
                    const m = members.find(mem => mem.id === id);
                    return m ? (
                      <span 
                        key={id} 
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary"
                      >
                        {m.name}
                        <button
                          type="button"
                          onClick={() => setSelectedWitnesses(selectedWitnesses.filter(wid => wid !== id))}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                {selectedRecord ? "Update" : "Create"} Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={(open) => { if (!open) { setShowViewModal(false); setSelectedRecord(null); } }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Record Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              View disciplinary record details and history
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-lg", typeConfig[selectedRecord.type].bg)}>
                  {(() => { const Icon = typeConfig[selectedRecord.type].icon; return <Icon className={cn("w-6 h-6", typeConfig[selectedRecord.type].color)} />; })()}
                </div>
                <div>
                  <p className="font-medium">{selectedRecord.memberName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", typeConfig[selectedRecord.type].bg, typeConfig[selectedRecord.type].color)}>
                      {typeConfig[selectedRecord.type].label}
                    </span>
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", statusConfig[selectedRecord.status].bg, statusConfig[selectedRecord.status].color)}>
                      {statusConfig[selectedRecord.status].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedRecord.reason}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p>{selectedRecord.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{new Date(selectedRecord.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Severity</p>
                    <p className={severityConfig[selectedRecord.severity].color}>{severityConfig[selectedRecord.severity].label}</p>
                  </div>
                </div>
                {selectedRecord.expiryDate && (
                  <div>
                    <p className="text-muted-foreground">Expiry Date</p>
                    <p>{new Date(selectedRecord.expiryDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedRecord.actionTaken && (
                  <div>
                    <p className="text-muted-foreground">Action Taken</p>
                    <p>{selectedRecord.actionTaken}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Issued By</p>
                  <p>{selectedRecord.issuedByName}</p>
                </div>
                {selectedRecord.witnesses && selectedRecord.witnesses.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Witnesses</p>
                    <p>{selectedRecord.witnesses.join(", ")}</p>
                  </div>
                )}
                {selectedRecord.resolution && (
                  <div>
                    <p className="text-muted-foreground">Resolution</p>
                    <p>{selectedRecord.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={showResolveModal} onOpenChange={(open) => { if (!open) { setShowResolveModal(false); setSelectedRecord(null); setResolution(""); } }}>
        <DialogContent className="sm:max-w-md bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Resolve Record</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Add resolution notes to close this record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Resolving: <span className="text-foreground">{selectedRecord?.reason}</span> for{" "}
              <span className="text-foreground">{selectedRecord?.memberName}</span>
            </p>
            <div>
              <Label>Resolution *</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                className="mt-1 bg-secondary min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowResolveModal(false); setResolution(""); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleResolve}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

