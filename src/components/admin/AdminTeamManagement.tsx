import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Wallet,
  FileText,
  Gavel,
  Crown,
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
  addAuditLog,
  type AdminUser,
  type AdminInvite,
  type AdminRole,
} from "@/lib/adminService";
import { getAllMembers, type Member } from "@/lib/dataService";
import { sendAdminInviteEmail } from "@/lib/memberInviteService";

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
  const [inviteRole, setInviteRole] = useState<AdminRole>("secretary");
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const loadData = async () => {
    const [adminsList, invitesList, membersList] = await Promise.all([
      getAllAdminUsers(),
      getAllInvites(),
      getAllMembers(),
    ]);
    setAdmins(adminsList);
    setInvites(invitesList.filter(i => !i.used));
    setMembers(membersList);
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

  const handleCreateInvite = async () => {
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
      const invite = await createInvite(inviteEmail, inviteName, inviteRole, currentUser!.id, selectedMemberId);
      if (currentUser) {
        await addAuditLog(currentUser, "CREATE_ADMIN_INVITE", `Created invite for ${inviteName} (${inviteEmail}) as ${getRoleLabel(inviteRole)}`);
      }

      // Send the invite email with the code
      const emailResult = await sendAdminInviteEmail(
        inviteEmail,
        inviteName,
        getRoleLabel(inviteRole),
        invite.inviteCode
      );

      if (emailResult.success) {
        toast({
          title: "Invite Sent!",
          description: `Invite email sent to ${inviteEmail} with their invite code.`,
        });
      } else {
        // Invite was created but email failed — still show success with warning
        toast({
          title: "Invite Created (Email Issue)",
          description: `Invite created but email failed: ${emailResult.message}. You can copy the invite link instead.`,
          variant: "destructive",
        });
      }

      setIsInviteModalOpen(false);
      setSelectedMemberId("");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("secretary");
      await loadData();
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
    const invite = invites.find(i => i.id === id);
    deleteInvite(id);
    if (currentUser && invite) {
      addAuditLog(currentUser, "DELETE_ADMIN_INVITE", `Cancelled invite for ${invite.name} (${invite.email})`);
    }
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
        if (currentUser) {
          addAuditLog(currentUser, "DEACTIVATE_ADMIN", `Deactivated admin: ${user.name}`);
        }
        toast({
          title: "User Deactivated",
          description: `${user.name} can no longer access the admin panel`,
        });
      } else {
        reactivateAdminUser(user.id);
        if (currentUser) {
          addAuditLog(currentUser, "REACTIVATE_ADMIN", `Reactivated admin: ${user.name}`);
        }
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {admins.filter(a => a.isActive && (currentUser?.role === "super_admin" || a.role !== "super_admin")).length}
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
        <div className="col-span-2 p-4 rounded-xl bg-secondary/50 border border-primary/10">
          <p className="text-sm text-muted-foreground mb-2">Role Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {currentUser?.role === "super_admin" && (
              <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                {admins.filter(a => (a.role === "super_admin" || a.role === "main_admin") && a.isActive).length} Administrators
              </span>
            )}
            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
              {admins.filter(a => a.role === "main_admin" && a.isActive).length} Main Admin
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
              {admins.filter(a => a.role === "finance" && a.isActive).length} Finance
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
              {admins.filter(a => a.role === "secretary" && a.isActive).length} Secretary
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400">
              {admins.filter(a => a.role === "disciplinary" && a.isActive).length} Disciplinary
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
              {admins.filter(a => a.role === "reviewer" && a.isActive).length} Reviewer
            </span>
          </div>
        </div>
      </div>

      {/* Admin Users List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Team Members</h3>
        <div className="space-y-2">
          {admins.filter((admin) => {
            // Hide super_admin from non-super-admin users
            if (admin.role === "super_admin" && currentUser?.role !== "super_admin") {
              return false;
            }
            return true;
          }).map((admin) => {
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
                    admin.role === "super_admin" ? "bg-primary/20" : 
                    admin.role === "main_admin" ? "bg-blue-500/20" :
                    admin.role === "finance" ? "bg-green-500/20" :
                    admin.role === "secretary" ? "bg-purple-500/20" :
                    admin.role === "disciplinary" ? "bg-orange-500/20" : "bg-secondary"
                  }`}>
                    {admin.role === "super_admin" ? (
                      <Crown className="w-5 h-5 text-primary" />
                    ) : admin.role === "main_admin" ? (
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                    ) : admin.role === "finance" ? (
                      <Wallet className="w-5 h-5 text-green-500" />
                    ) : admin.role === "secretary" ? (
                      <FileText className="w-5 h-5 text-purple-500" />
                    ) : admin.role === "disciplinary" ? (
                      <Gavel className="w-5 h-5 text-orange-500" />
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
            <DialogDescription className="text-muted-foreground text-sm">
              Send an invitation to add a new administrator
            </DialogDescription>
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
                  <SelectItem value="super_admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Full Administrator</span>
                      <span className="text-xs text-muted-foreground">Full access + admin management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="main_admin">
                    <div className="flex flex-col">
                      <span className="font-medium">Main Admin</span>
                      <span className="text-xs text-muted-foreground">Full access (no admin management)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="finance">
                    <div className="flex flex-col">
                      <span className="font-medium">Finance</span>
                      <span className="text-xs text-muted-foreground">Treasury, contributions, expenses, tickets</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="secretary">
                    <div className="flex flex-col">
                      <span className="font-medium">Secretary</span>
                      <span className="text-xs text-muted-foreground">Members, events, attendance, gallery, announcements</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="disciplinary">
                    <div className="flex flex-col">
                      <span className="font-medium">Disciplinary</span>
                      <span className="text-xs text-muted-foreground">Leave requests + disciplinary records</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reviewer">
                    <div className="flex flex-col">
                      <span className="font-medium">Reviewer</span>
                      <span className="text-xs text-muted-foreground">View-only access, can only approve leave requests</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
