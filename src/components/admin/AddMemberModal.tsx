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
import { useToast } from "@/hooks/use-toast";
import { addMember, updateMember, type Member } from "@/lib/dataService";
import { Loader2 } from "lucide-react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMember?: Member | null;
}

export function AddMemberModal({ isOpen, onClose, onSuccess, editMember }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [voice, setVoice] = useState<Member["voice"]>("Soprano");
  const [status, setStatus] = useState<Member["status"]>("Pending");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Populate form when editing
  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setEmail(editMember.email);
      setPhone(editMember.phone);
      setVoice(editMember.voice);
      setStatus(editMember.status);
    } else {
      resetForm();
    }
  }, [editMember, isOpen]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setVoice("Soprano");
    setStatus("Pending");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editMember) {
        updateMember(editMember.id, { name, email, phone, voice, status });
        toast({
          title: "Member Updated",
          description: `${name} has been updated successfully.`,
        });
      } else {
        addMember({ name, email, phone, voice, status });
        toast({
          title: "Member Added",
          description: `${name} has been added to the choir.`,
        });
      }
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-charcoal border-primary/20">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {editMember ? "Edit Member" : "Add New Member"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com"
              className="mt-1 bg-secondary border-primary/20"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="078xxxxxxx"
              className="mt-1 bg-secondary border-primary/20"
            />
          </div>

          <div>
            <Label htmlFor="voice">Voice Part *</Label>
            <Select value={voice} onValueChange={(v) => setVoice(v as Member["voice"])}>
              <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                <SelectValue placeholder="Select voice part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Soprano">Soprano</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Tenor">Tenor</SelectItem>
                <SelectItem value="Bass">Bass</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Member["status"])}>
              <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editMember ? (
                "Update Member"
              ) : (
                "Add Member"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

