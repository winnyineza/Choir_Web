import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAuditLog, type AdminUser } from "@/lib/adminService";
import { createAudition, deleteAudition, getAllAuditions, updateAudition, type Audition, type AuditionStatus } from "@/lib/auditionService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Clock, Plus, Search, Star, Trash2, UserCheck, X } from "lucide-react";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";
import { cn } from "@/lib/utils";

const statusOptions: { value: AuditionStatus; label: string; color: string }[] = [
  { value: "scheduled", label: "Scheduled", color: "text-blue-400" },
  { value: "completed", label: "Completed", color: "text-emerald-400" },
  { value: "accepted", label: "Accepted", color: "text-green-400" },
  { value: "waitlist", label: "Waitlist", color: "text-amber-400" },
  { value: "rejected", label: "Rejected", color: "text-red-400" },
];

export function AuditionManagement() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuditionStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Audition | null>(null);
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    scheduledAt: "",
    panelists: "",
    notes: "",
    rating: "",
    recommendedVoice: "",
    status: "scheduled" as AuditionStatus,
  });

  useEffect(() => {
    getAllAuditions().then(setAuditions);
  }, []);

  const filtered = useMemo(() => {
    return auditions.filter((a) => {
      const matchesSearch =
        a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        (a.candidateEmail || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [auditions, search, statusFilter]);

  const resetForm = () => {
    setForm({
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      scheduledAt: "",
      panelists: "",
      notes: "",
      rating: "",
      recommendedVoice: "",
      status: "scheduled",
    });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.candidateName || !form.scheduledAt) {
      toast({ title: "Missing info", description: "Name and schedule are required", variant: "destructive" });
      return;
    }
    const actor = currentUser as AdminUser | undefined;
    try {
      if (editing) {
        const updated = await updateAudition(editing.id, {
          ...form,
          panelists: form.panelists ? form.panelists.split(",").map((p) => p.trim()) : [],
          rating: form.rating ? Number(form.rating) : undefined,
          recommendedVoice: form.recommendedVoice ? (form.recommendedVoice as any) : undefined,
          status: form.status,
        }, actor);
        if (updated) {
          addAuditLog(actor!, "UPDATE", `Updated audition for ${updated.candidateName}`);
          const list = await getAllAuditions();
          setAuditions(list);
        }
      } else {
        const created = await createAudition({
          candidateName: form.candidateName,
          candidateEmail: form.candidateEmail,
          candidatePhone: form.candidatePhone,
          scheduledAt: form.scheduledAt,
          panelists: form.panelists ? form.panelists.split(",").map((p) => p.trim()) : [],
          notes: form.notes,
          rating: form.rating ? Number(form.rating) : undefined,
          recommendedVoice: form.recommendedVoice ? (form.recommendedVoice as any) : undefined,
          status: form.status,
        }, actor);
        addAuditLog(actor!, "CREATE", `Created audition for ${created.candidateName}`);
        const list = await getAllAuditions();
        setAuditions(list);
      }
      resetForm();
      setShowModal(false);
      toast({ title: "Saved", description: "Audition saved successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to save audition", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const audition = auditions.find((item) => item.id === id);
    if (!confirmDestructiveAction({
      action: "delete",
      subject: `audition for ${audition?.candidateName || "this candidate"}`,
      warning: "This audition record will be removed.",
    })) return;

    await deleteAudition(id, currentUser || undefined);
    const list = await getAllAuditions();
    setAuditions(list);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="gold" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Audition
        </Button>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="card-glass rounded-xl p-6 text-center text-muted-foreground">No auditions yet</div>
        )}
        {filtered.map((a) => {
          const statusMeta = statusOptions.find((s) => s.value === a.status);
          return (
            <div key={a.id} className="card-glass rounded-xl p-4 border border-primary/10 flex flex-col gap-2">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-semibold">{a.candidateName}</p>
                  <p className="text-xs text-muted-foreground">{a.candidateEmail || a.candidatePhone || "No contact"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", statusMeta?.color || "text-muted-foreground border-primary/10")}>
                    {statusMeta?.label || a.status}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(a.scheduledAt).toLocaleString()}</span>
                {a.panelists && a.panelists.length > 0 && <span>Panel: {a.panelists.join(", ")}</span>}
                {a.rating !== undefined && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {a.rating}/5</span>}
                {a.recommendedVoice && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {a.recommendedVoice}</span>}
              </div>
              {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(a); setForm({
                  candidateName: a.candidateName,
                  candidateEmail: a.candidateEmail || "",
                  candidatePhone: a.candidatePhone || "",
                  scheduledAt: a.scheduledAt,
                  panelists: a.panelists?.join(", ") || "",
                  notes: a.notes || "",
                  rating: a.rating?.toString() || "",
                  recommendedVoice: a.recommendedVoice || "",
                  status: a.status,
                }); setShowModal(true); }}>
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showModal} onOpenChange={(o) => { if (!o) { resetForm(); setShowModal(false); } else setShowModal(true); }}>
        <DialogContent className="sm:max-w-lg bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Audition" : "New Audition"}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {editing ? "Update audition details" : "Schedule a new audition for a candidate"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Candidate Name *</Label>
              <Input value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.candidateEmail} onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.candidatePhone} onChange={(e) => setForm({ ...form, candidatePhone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Scheduled At *</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AuditionStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Recommended Voice</Label>
              <Select value={form.recommendedVoice} onValueChange={(v) => setForm({ ...form, recommendedVoice: v })}>
                <SelectTrigger><SelectValue placeholder="Select voice" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soprano">Soprano</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Tenor">Tenor</SelectItem>
                  <SelectItem value="Bass">Bass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Panelists (comma separated)</Label>
              <Input value={form.panelists} onChange={(e) => setForm({ ...form, panelists: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { resetForm(); setShowModal(false); }}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSave}>
                <CheckCircle className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

