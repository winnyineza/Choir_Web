import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addMember, getAllMembers, type Member } from "@/lib/dataService";
import { sendBulkInvites } from "@/lib/memberInviteService";
import { Loader2, Plus, Trash2, Users, Send } from "lucide-react";

interface BulkAddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MemberRow {
  name: string;
  email: string;
  phone: string;
  voice: Member["voice"];
}

const emptyRow = (): MemberRow => ({ name: "", email: "", phone: "", voice: "Soprano" });

export function BulkAddMembersModal({ isOpen, onClose, onSuccess }: BulkAddMembersModalProps) {
  const [rows, setRows] = useState<MemberRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendInvites, setSendInvites] = useState(true);
  const [results, setResults] = useState<{ added: number; skipped: number; invited: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const updateRow = (index: number, field: keyof MemberRow, value: string) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const addMultipleRows = (count: number) => {
    setRows(prev => [...prev, ...Array.from({ length: count }, () => emptyRow())]);
  };

  const validRows = rows.filter(r => r.name.trim() && r.email.trim());

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      toast({ title: "No valid members", description: "Please fill in at least one member's name and email.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResults(null);
    const errors: string[] = [];
    let added = 0;
    let skipped = 0;

    // Check for duplicates in current members
    const existingMembers = await getAllMembers();
    const existingEmails = new Set(existingMembers.map(m => m.email.toLowerCase()));
    // Also check for duplicates within the batch
    const seenEmails = new Set<string>();

    const addedMembers: Array<{ id: string; email: string; name: string }> = [];

    for (const row of validRows) {
      const emailLower = row.email.trim().toLowerCase();

      if (existingEmails.has(emailLower)) {
        errors.push(`${row.email} - already exists`);
        skipped++;
        continue;
      }

      if (seenEmails.has(emailLower)) {
        errors.push(`${row.email} - duplicate in this batch`);
        skipped++;
        continue;
      }

      seenEmails.add(emailLower);

      try {
        const member = await addMember({
          name: row.name.trim(),
          email: row.email.trim(),
          phone: row.phone.trim(),
          voice: row.voice,
          status: "Pending",
          joinedDate: new Date().toISOString().split("T")[0],
        });
        addedMembers.push({ id: member.id, email: member.email, name: member.name });
        added++;
      } catch (err: any) {
        errors.push(`${row.email} - ${err.message || "failed to add"}`);
      }
    }

    // Send invites if requested
    let invited = 0;
    if (sendInvites && addedMembers.length > 0) {
      try {
        const inviteResult = await sendBulkInvites(addedMembers);
        invited = inviteResult.sent;
        if (inviteResult.failed > 0) {
          errors.push(`${inviteResult.failed} invite(s) failed to send`);
        }
      } catch {
        errors.push("Failed to send invites");
      }
    }

    setResults({ added, skipped, invited, errors });
    setIsLoading(false);

    if (added > 0) {
      toast({
        title: `${added} Member${added > 1 ? "s" : ""} Added`,
        description: sendInvites ? `${invited} invite${invited > 1 ? "s" : ""} sent.` : undefined,
      });
      onSuccess();
    }
  };

  const handleClose = () => {
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Bulk Add Members
          </DialogTitle>
          <DialogDescription>
            Add multiple members at once. Only Name and Email are required.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="card-glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{results.added}</p>
                <p className="text-xs text-muted-foreground">Added</p>
              </div>
              <div className="card-glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{results.invited}</p>
                <p className="text-xs text-muted-foreground">Invites Sent</p>
              </div>
              <div className="card-glass rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-500">{results.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>
            {results.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-sm font-medium text-red-500 mb-1">Issues:</p>
                {results.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">{e}</p>
                ))}
              </div>
            )}
            <Button onClick={handleClose} variant="gold" className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_0.7fr_0.6fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Name *</span>
              <span>Email *</span>
              <span>Phone</span>
              <span>Voice</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_0.7fr_0.6fr_auto] gap-2 items-center">
                  <Input
                    placeholder="Full name"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                    className="h-9 text-sm bg-secondary border-primary/20"
                  />
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(i, "email", e.target.value)}
                    className="h-9 text-sm bg-secondary border-primary/20"
                  />
                  <Input
                    placeholder="078..."
                    value={row.phone}
                    onChange={(e) => updateRow(i, "phone", e.target.value)}
                    className="h-9 text-sm bg-secondary border-primary/20"
                  />
                  <Select value={row.voice} onValueChange={(v) => updateRow(i, "voice", v)}>
                    <SelectTrigger className="h-9 text-sm bg-secondary border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soprano">Soprano</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                      <SelectItem value="Tenor">Tenor</SelectItem>
                      <SelectItem value="Bass">Bass</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add rows */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addRow} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Row
              </Button>
              <Button variant="outline" size="sm" onClick={() => addMultipleRows(5)} className="text-xs">
                +5 Rows
              </Button>
              <Button variant="outline" size="sm" onClick={() => addMultipleRows(10)} className="text-xs">
                +10 Rows
              </Button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-2 border-t border-primary/10">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvites}
                  onChange={(e) => setSendInvites(e.target.checked)}
                  className="rounded"
                />
                <Send className="w-3.5 h-3.5 text-primary" />
                Send portal invites to all members
              </label>
              <span className="text-xs text-muted-foreground">
                {validRows.length} valid member{validRows.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Submit */}
            <Button
              variant="gold"
              className="w-full"
              disabled={isLoading || validRows.length === 0}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding {validRows.length} members...</>
              ) : (
                <><Users className="w-4 h-4 mr-2" /> Add {validRows.length} Member{validRows.length !== 1 ? "s" : ""}{sendInvites ? " & Send Invites" : ""}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
