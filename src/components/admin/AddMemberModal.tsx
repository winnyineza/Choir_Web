import { useState, useEffect, useRef } from "react";
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
import { addMember, updateMember, type Member, type EmergencyContact } from "@/lib/dataService";
import { Loader2, Cake, Upload, User, X, Phone, ChevronDown, ChevronUp } from "lucide-react";

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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photo, setPhoto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    relationship: "Spouse",
    phone: "",
    altPhone: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Populate form when editing
  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setEmail(editMember.email);
      setPhone(editMember.phone);
      setVoice(editMember.voice);
      setStatus(editMember.status);
      setDateOfBirth(editMember.dateOfBirth || "");
      setPhoto(editMember.photo || "");
      if (editMember.emergencyContact) {
        setEmergencyContact(editMember.emergencyContact);
        setShowEmergencyContact(true);
      }
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
    setDateOfBirth("");
    setPhoto("");
    setShowEmergencyContact(false);
    setEmergencyContact({
      name: "",
      relationship: "Spouse",
      phone: "",
      altPhone: "",
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for localStorage storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      const memberData = { 
        name, 
        email, 
        phone, 
        voice, 
        status, 
        dateOfBirth: dateOfBirth || undefined,
        photo: photo || undefined,
        emergencyContact: emergencyContact.name ? emergencyContact : undefined,
      };
      if (editMember) {
        updateMember(editMember.id, memberData);
        toast({
          title: "Member Updated",
          description: `${name} has been updated successfully.`,
        });
      } else {
        addMember(memberData);
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
      <DialogContent className="sm:max-w-md bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl gold-text">
            {editMember ? "Edit Member" : "Add New Member"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {photo ? (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <User className="w-8 h-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {photo && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Change Photo
              </button>
            )}
          </div>

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
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-primary" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 bg-secondary border-primary/20"
              max={new Date().toISOString().split('T')[0]}
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

          {/* Emergency Contact Section */}
          <div className="border border-primary/20 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEmergencyContact(!showEmergencyContact)}
              className="w-full p-3 flex items-center justify-between bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-primary" />
                Emergency Contact
              </span>
              {showEmergencyContact ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showEmergencyContact && (
              <div className="p-3 space-y-3 bg-secondary/30">
                <div>
                  <Label htmlFor="ecName">Contact Name</Label>
                  <Input
                    id="ecName"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    placeholder="Emergency contact name"
                    className="mt-1 bg-secondary border-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="ecRelationship">Relationship</Label>
                  <Select
                    value={emergencyContact.relationship}
                    onValueChange={(v) => setEmergencyContact({ ...emergencyContact, relationship: v as EmergencyContact["relationship"] })}
                  >
                    <SelectTrigger className="mt-1 bg-secondary border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ecPhone">Phone Number</Label>
                  <Input
                    id="ecPhone"
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                    placeholder="078xxxxxxx"
                    className="mt-1 bg-secondary border-primary/20"
                  />
                </div>
                <div>
                  <Label htmlFor="ecAltPhone">Alternative Phone (Optional)</Label>
                  <Input
                    id="ecAltPhone"
                    value={emergencyContact.altPhone || ""}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, altPhone: e.target.value })}
                    placeholder="078xxxxxxx"
                    className="mt-1 bg-secondary border-primary/20"
                  />
                </div>
              </div>
            )}
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


