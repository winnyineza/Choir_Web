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
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Clock,
  Copy,
  Check,
  Trash2,
  UserX,
  UserCheck,
  AlertCircle,
  Music,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllAdminUsers,
  getAllInvites,
  createInvite,
  deleteInvite,
  deactivateAdminUser,
  reactivateAdminUser,
  deleteAdminUser,
  getRoleLabel,
  isMemberAdmin,
  type AdminUser,
  type AdminInvite,
  type AdminRole,
} from "@/lib/adminService";
import { getAllMembers, type Member } from "@/lib/dataService";

export function AdminTeamManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  
  // Invite form
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const loadData = () => {
    setAdmins(getAllAdminUsers());
    setInvites(getAllInvites().filter(i => !i.used));
    setMembers(getAllMembers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get members who are not already admins
  const availableMembers = members.filter(m => !isMemberAdmin(m.id));

  // Get member info for an admin
  const getMemberForAdmin = (admin: AdminUser): Member | undefined => {
    if (!admin.memberId) return undefined;
    return members.find(m => m.id === admin.memberId);
  };

  // Handle member selection - auto-fill name and email
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (memberId) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setInviteName(member.name);
        setInviteEmail(member.email);
      }
    } else {
      setInviteName("");
      setInviteEmail("");
    }
  };

  const handleCreateInvite = () => {
    if (!selectedMemberId) {
      toast({
        title: "Select a Member",
        description: "Please select a choir member to invite as admin",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail || !inviteName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      createInvite(inviteEmail, inviteName, inviteRole, currentUser!.id, selectedMemberId);
      toast({
        title: "Invite Created!",
        description: `Invite sent to ${inviteEmail}`,
      });
      setIsInviteModalOpen(false);
      setSelectedMemberId("");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("admin");
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteLink = (invite: AdminInvite) => {
    const link = `${window.location.origin}/admin/login?invite=${invite.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(invite.id);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  const handleDeleteInvite = (id: string) => {
    deleteInvite(id);
    loadData();
    toast({
      title: "Invite Deleted",
      description: "The invite has been cancelled",
    });
  };

  const handleToggleUserStatus = (user: AdminUser) => {
    try {
      if (user.isActive) {
        deactivateAdminUser(user.id);
        toast({
          title: "User Deactivated",
          description: `${user.name} can no longer access the admin panel`,
        });
      } else {
        reactivateAdminUser(user.id);
        toast({
          title: "User Reactivated",
          description: `${user.name} can now access the admin panel again`,
        });
      }
      loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently delete ${user.name}? This cannot be undone.`)) {
      return;
    }
    
    try {
      deleteAdminUser(user.id);
      loadData();
      toast({
        title: "User Deleted",
        description: `${user.name} has been removed`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold gold-text">Admin Team</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage admin access and permissions
          </p>
        </div>
        <Button variant="gold" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {admins.filter(a => a.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Admins</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {invites.length}
              </p>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {admins.filter(a => a.role === "super_admin").length}
              </p>
              <p className="text-sm text-muted-foreground">Super Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Users List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Team Members</h3>
        <div className="space-y-2">
          {admins.map((admin) => {
            const member = getMemberForAdmin(admin);
            return (
              <div
                key={admin.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  admin.isActive
                    ? "bg-secondary/50 border-primary/10"
                    : "bg-muted/50 border-muted opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    admin.role === "super_admin" ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    {admin.role === "super_admin" ? (
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    ) : (
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{admin.name}</span>
                      {admin.id === currentUser?.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          You
                        </span>
                      )}
                      {!admin.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                          Inactive
                        </span>
                      )}
                      {/* Show member info if linked */}
                      {member && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {member.voicePart}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleLabel(admin.role)} • Last login: {admin.lastLogin ? formatDate(admin.lastLogin) : "Never"}
                    </p>
                  </div>
                </div>
                
                {admin.id !== currentUser?.id && admin.role !== "super_admin" && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUserStatus(admin)}
                    >
                      {admin.isActive ? (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Reactivate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(admin)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Pending Invites</h3>
          <div className="space-y-2">
            {invites.map((invite) => {
              const member = invite.memberId ? members.find(m => m.id === invite.memberId) : undefined;
              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{invite.name}</span>
                        {member && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {member.voicePart}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {formatDate(invite.expiresAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invite)}
                    >
                      {copiedInvite === invite.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteInvite(invite.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md bg-charcoal border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl gold-text">
              Invite New Admin
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Member Selector */}
            <div className="space-y-2">
              <Label htmlFor="memberSelect">Select Choir Member *</Label>
              <Select value={selectedMemberId} onValueChange={handleMemberSelect}>
                <SelectTrigger className="bg-secondary border-primary/20">
                  <SelectValue placeholder="Choose a member to promote..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available members
                    </SelectItem>
                  ) : (
                    availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <span>{member.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({member.voicePart})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only choir members can be made admins. Add them as a member first.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteName">Full Name</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Auto-filled from member"
                className="bg-secondary border-primary/20"
                disabled={!!selectedMemberId}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Auto-filled from member"
                className="bg-secondary border-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                You can edit the email if different from member record
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AdminRole)}>
                <SelectTrigger className="bg-secondary border-primary/20">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Super Admins can manage other admins and access all settings
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  An invite link will be generated. Share it with the new admin to complete their registration.
                  The link expires in 7 days.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setSelectedMemberId("");
                  setInviteName("");
                  setInviteEmail("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleCreateInvite}
                disabled={!selectedMemberId}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
