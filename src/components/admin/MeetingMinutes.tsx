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
  getAllMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  approveMeeting,
  getMeetingStats,
  getMeetingTypeLabel,
  getMeetingTypeColor,
  exportMeetingToText,
  exportMeetingsToCSV,
  type MeetingMinutes as MeetingMinutesType,
  type MeetingType,
  type MeetingAgendaItem,
  type MeetingStats,
} from "@/lib/meetingService";
import { getAttendanceByDate, hasAttendanceForDate, saveAttendance, getSessionByDate, deleteAttendanceForDate } from "@/lib/attendanceService";
import {
  createOrUpdateGoogleMeeting,
  deleteGoogleMeeting,
  getGoogleConnectionStatus,
  getGoogleOAuthStartUrl,
  type GoogleConnectionStatus,
} from "@/lib/googleMeetService";
import { getAllMembers, type Member } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import { addAuditLog, canApproveMeetingMinutes } from "@/lib/adminService";
import { notifyMeetingMinutesApproved } from "@/lib/notificationEmailService";
import { getMembersOnLeaveForDate } from "@/lib/leaveService";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export function MeetingMinutesComponent() {
  type InviteScope = "all_active" | "selected_people";

  const [meetings, setMeetings] = useState<MeetingMinutesType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinutesType | null>(null);
  const [expandedAgenda, setExpandedAgenda] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [googleConnection, setGoogleConnection] = useState<GoogleConnectionStatus>({
    connected: false,
    googleEmail: null,
    connectedAt: null,
  });
  const [googleBusy, setGoogleBusy] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    type: "general" as MeetingType,
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    chairperson: "",
    secretary: "",
    attendees: [] as string[],
    absentees: [] as string[],
    openingPrayer: "",
    closingPrayer: "",
    nextMeetingDate: "",
    notes: "",
    syncGoogleCalendar: true,
    createGoogleMeet: true,
    inviteScope: "all_active" as InviteScope,
    inviteeNames: [] as string[],
  });

  const [agendaItems, setAgendaItems] = useState<Omit<MeetingAgendaItem, "id">[]>([]);
  const [stats, setStats] = useState<MeetingStats>({
    totalMeetings: 0,
    thisMonth: 0,
    byType: { general: 0, committee: 0 },
    drafts: 0,
    approved: 0,
  });

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  useEffect(() => {
    const prefillAttendance = async () => {
      if (!formData.date || !showAddModal) return;
      if (formData.attendees.length > 0 || formData.absentees.length > 0) return;

      try {
        const records = await getAttendanceByDate(formData.date);
        if (records.length === 0) return;

        const attendees = records
          .filter((record) => record.status === "present" || record.status === "late")
          .map((record) => record.memberName);
        const absentees = records
          .filter((record) => record.status === "absent" || record.status === "excused")
          .map((record) => record.memberName);

        if (attendees.length === 0 && absentees.length === 0) return;

        setFormData((prev) => {
          if (prev.attendees.length > 0 || prev.absentees.length > 0) return prev;
          return {
            ...prev,
            attendees,
            absentees,
          };
        });
      } catch {
        // Best-effort prefill only.
      }
    };

    prefillAttendance();
  }, [formData.date, formData.attendees.length, formData.absentees.length, showAddModal]);

  const loadData = async () => {
    const [meetingsData, statsData, membersData] = await Promise.all([
      getAllMeetings(),
      getMeetingStats(),
      getAllMembers(),
    ]);

    if (currentUser?.id) {
      try {
        const status = await getGoogleConnectionStatus(currentUser.id);
        setGoogleConnection(status);
      } catch {
        setGoogleConnection({ connected: false, googleEmail: null, connectedAt: null });
      }
    }

    setMeetings(meetingsData);
    setStats(statsData);
    setMembers(membersData);
  };

  const handleConnectGoogle = async () => {
    if (!currentUser?.id) {
      toast({ title: "Error", description: "Admin authentication required", variant: "destructive" });
      return;
    }

    try {
      setGoogleBusy(true);
      const authUrl = await getGoogleOAuthStartUrl(currentUser.id, "/admin");
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Google Connection Failed",
        description: error.message || "Unable to start Google OAuth",
        variant: "destructive",
      });
    } finally {
      setGoogleBusy(false);
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chairperson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || m.type === filterType;
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in title, date, and location",
        variant: "destructive",
      });
      return;
    }

    const meetingData = {
      ...formData,
      agenda: agendaItems.map((item, i) => ({
        ...item,
        id: `agenda_${Date.now()}_${i}`,
      })),
    };

    try {
      let savedMeeting: MeetingMinutesType | null = null;

      if (selectedMeeting) {
        savedMeeting = await updateMeeting(selectedMeeting.id, meetingData);
        if (currentUser) {
          addAuditLog(currentUser, "UPDATE_MEETING", `Updated meeting minutes: ${formData.title}`);
        }
        toast({ title: "Meeting Updated", description: "Meeting details have been updated." });
      } else {
        savedMeeting = await createMeeting(meetingData);
        if (currentUser) {
          addAuditLog(currentUser, "CREATE_MEETING", `Created meeting minutes: ${formData.title}`);
        }
        toast({ title: "Meeting Created", description: "New meeting has been created." });
      }

      if (!savedMeeting) {
        throw new Error("Failed to save meeting");
      }

      const hasAttendance = await hasAttendanceForDate(savedMeeting.date);
      if (!hasAttendance) {
        const membersOnLeave = await getMembersOnLeaveForDate(savedMeeting.date);
        const membersOnLeaveIds = new Set(membersOnLeave.map((leave) => leave.memberId));
        const attendanceSeed = members
          .filter((member) => member.status === "Active")
          .map((member) => ({
            memberId: member.id,
            memberName: member.name,
            memberEmail: member.email,
            memberVoice: member.voice,
            status: membersOnLeaveIds.has(member.id) ? "excused" as const : "absent" as const,
          }));

        if (attendanceSeed.length > 0) {
          await saveAttendance(
            savedMeeting.date,
            attendanceSeed,
            `[Meeting] ${savedMeeting.title || "Meeting Session"}`,
            currentUser?.name || "Admin",
          );
          toast({
            title: "Attendance Draft Created",
            description: "Attendance was auto-created for this meeting date. You can edit it on the attendance tab.",
          });
        }
      }

      if (formData.syncGoogleCalendar && currentUser?.id && googleConnection.connected) {
        try {
          const membersOnLeave = await getMembersOnLeaveForDate(savedMeeting.date);
          const membersOnLeaveIds = new Set(membersOnLeave.map((leave) => leave.memberId));
          const eligibleMembers = members.filter(
            (member) => member.status === "Active" && Boolean(member.email) && !membersOnLeaveIds.has(member.id),
          );
          const selectedNames = formData.inviteeNames.length > 0 ? formData.inviteeNames : formData.attendees;
          const selectedPeopleEmails = eligibleMembers
            .filter((member) => selectedNames.includes(member.name))
            .map((member) => member.email.trim());

          const audienceEmails = formData.inviteScope === "selected_people"
            ? selectedPeopleEmails
            : eligibleMembers.map((member) => member.email.trim());

          const alwaysIncludedEmails = [currentUser.email]
            .filter((email): email is string => Boolean(email && email.trim()))
            .map((email) => email.trim());

          const attendeeEmails = Array.from(new Set([...audienceEmails, ...alwaysIncludedEmails]));

          const synced = await createOrUpdateGoogleMeeting(currentUser.id, {
            meetingId: savedMeeting.id,
            googleEventId: selectedMeeting?.googleEventId || undefined,
            title: savedMeeting.title,
            description: savedMeeting.notes || "Choir meeting",
            location: savedMeeting.location,
            date: savedMeeting.date,
            startTime: savedMeeting.startTime || "09:00",
            endTime: savedMeeting.endTime || undefined,
            timezone: "Africa/Lagos",
            includeMeetLink: formData.createGoogleMeet,
            attendeeEmails,
          });

          await updateMeeting(savedMeeting.id, {
            googleEventId: synced.googleEventId,
            googleMeetLink: synced.googleMeetLink,
            googleEventLink: synced.googleEventLink || undefined,
            googleConferenceId: synced.googleConferenceId || undefined,
          });

          toast({
            title: "Google Calendar Synced",
            description: formData.createGoogleMeet
              ? `Meeting event and Google Meet link were updated. ${attendeeEmails.length} invitee(s) were notified via Google Calendar.`
              : `Meeting event was updated without a Meet link. ${attendeeEmails.length} invitee(s) were notified via Google Calendar.`,
          });
        } catch (error: any) {
          toast({
            title: "Saved Locally",
            description: error.message || "Meeting was saved, but Google sync failed.",
            variant: "destructive",
          });
        }
      } else if (formData.syncGoogleCalendar && !googleConnection.connected) {
        toast({
          title: "Google Not Connected",
          description: "Meeting saved, but Google Calendar is not connected yet.",
        });
      } else if (
        !formData.syncGoogleCalendar &&
        selectedMeeting?.googleEventId &&
        currentUser?.id &&
        googleConnection.connected
      ) {
        try {
          await deleteGoogleMeeting(currentUser.id, savedMeeting.id, selectedMeeting.googleEventId);
          toast({
            title: "Google Calendar Unsynced",
            description: "Google Calendar event was removed for this meeting.",
          });
        } catch (error: any) {
          toast({
            title: "Saved Locally",
            description: error.message || "Meeting was saved, but Google event removal failed.",
            variant: "destructive",
          });
        }
      }

      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save meeting", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting record?")) return;
    const meeting = meetings.find(m => m.id === id);
    try {
      if (meeting?.googleEventId && currentUser?.id) {
        await deleteGoogleMeeting(currentUser.id, id, meeting.googleEventId);
      }

      const deleted = await deleteMeeting(id);
      if (deleted) {
        let attendanceDeleted = false;
        if (meeting?.date) {
          const linkedSession = await getSessionByDate(meeting.date);
          const isLinkedAttendance = Boolean(
            linkedSession && meeting.title && (
              linkedSession.title === `[Meeting] ${meeting.title}` ||
              linkedSession.title === meeting.title
            ),
          );

          if (isLinkedAttendance) {
            attendanceDeleted = await deleteAttendanceForDate(meeting.date);
          }
        }

        if (currentUser && meeting) {
          addAuditLog(currentUser, "DELETE_MEETING", `Deleted meeting minutes: ${meeting.title}`);
        }
        toast({
          title: "Meeting Deleted",
          description: attendanceDeleted
            ? "Meeting and its linked attendance were deleted."
            : "Meeting has been deleted.",
        });
        await loadData();
      } else {
        toast({ title: "Error", description: "Meeting not found or could not be deleted", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete meeting", variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    if (!canApproveMeetingMinutes(currentUser)) {
      toast({
        title: "Not Allowed",
        description: "Only Super Admin, Main Admin, Secretary, or Reviewer can approve meeting minutes.",
        variant: "destructive",
      });
      return;
    }

    const meeting = meetings.find(m => m.id === id);
    try {
      const result = await approveMeeting(id, currentUser?.name || "Admin");
      if (result) {
        if (currentUser && meeting) {
          addAuditLog(currentUser, "APPROVE_MEETING", `Approved meeting minutes: ${meeting.title}`);
        }
        // Notify approvers that meeting minutes are available
        if (meeting) {
          notifyMeetingMinutesApproved(meeting.title, meeting.date, currentUser?.name || "Admin");
        }
        toast({ title: "Meeting Approved", description: "Meeting minutes have been approved and approvers will be notified." });
        await loadData();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to approve meeting", variant: "destructive" });
    }
  };

  const handleExportMeeting = (meeting: MeetingMinutesType) => {
    const text = exportMeetingToText(meeting);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting_${meeting.date}_${meeting.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Meeting minutes exported." });
  };

  const handleExportAll = async () => {
    try {
      const csv = await exportMeetingsToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meetings_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: "All meetings exported to CSV." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedMeeting(null);
    setFormData({
      title: "",
      type: "general",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      chairperson: "",
      secretary: "",
      attendees: [],
      absentees: [],
      openingPrayer: "",
      closingPrayer: "",
      nextMeetingDate: "",
      notes: "",
      syncGoogleCalendar: true,
      createGoogleMeet: true,
      inviteScope: "all_active",
      inviteeNames: [],
    });
    setAgendaItems([]);
  };

  const openEditModal = (meeting: MeetingMinutesType) => {
    setSelectedMeeting(meeting);
    setFormData({
      title: meeting.title,
      type: meeting.type,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime || "",
      location: meeting.location,
      chairperson: meeting.chairperson,
      secretary: meeting.secretary,
      attendees: meeting.attendees,
      absentees: meeting.absentees || [],
      openingPrayer: meeting.openingPrayer || "",
      closingPrayer: meeting.closingPrayer || "",
      nextMeetingDate: meeting.nextMeetingDate || "",
      notes: meeting.notes || "",
      syncGoogleCalendar: Boolean(meeting.googleEventId),
      createGoogleMeet: Boolean(meeting.googleMeetLink),
      inviteScope: meeting.type === "committee" ? "selected_people" : "all_active",
      inviteeNames: meeting.attendees || [],
    });
    setAgendaItems(meeting.agenda.map(({ id, ...rest }) => rest));
    setShowAddModal(true);
  };

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, {
      title: "",
      discussion: "",
      decision: "",
      actionItem: "",
      responsible: "",
    }]);
  };

  const updateAgendaItem = (index: number, updates: Partial<MeetingAgendaItem>) => {
    const newItems = [...agendaItems];
    newItems[index] = { ...newItems[index], ...updates };
    setAgendaItems(newItems);
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const toggleAttendee = (memberName: string) => {
    if (formData.attendees.includes(memberName)) {
      setFormData({
        ...formData,
        attendees: formData.attendees.filter(a => a !== memberName),
      });
    } else {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, memberName],
        absentees: formData.absentees.filter(a => a !== memberName),
      });
    }
  };

  const toggleAbsentee = (memberName: string) => {
    if (formData.absentees.includes(memberName)) {
      setFormData({
        ...formData,
        absentees: formData.absentees.filter(a => a !== memberName),
      });
    } else {
      setFormData({
        ...formData,
        absentees: [...formData.absentees, memberName],
        attendees: formData.attendees.filter(a => a !== memberName),
      });
    }
  };

  const toggleInvitee = (memberName: string) => {
    if (formData.inviteeNames.includes(memberName)) {
      setFormData({
        ...formData,
        inviteeNames: formData.inviteeNames.filter((name) => name !== memberName),
      });
    } else {
      setFormData({
        ...formData,
        inviteeNames: [...formData.inviteeNames, memberName],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold">{stats.totalMeetings}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total Meetings</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold">{stats.thisMonth}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold">{stats.approved}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Approved</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-xl font-bold text-orange-400">{stats.drafts}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Drafts</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xl font-bold">{stats.byType.general}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">General</p>
        </div>
        <div className="card-glass rounded-xl p-3">
          <div className="flex items-center justify-between">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-xl font-bold">{stats.byType.committee}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Committee</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary"
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] bg-secondary">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="committee">Committee</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExportAll}>
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>

        <Button variant="outline" onClick={handleConnectGoogle} disabled={googleBusy || !currentUser?.id}>
          <Calendar className="w-4 h-4 mr-2" />
          {googleConnection.connected ? "Reconnect Google" : "Connect Google"}
        </Button>

        <Button variant="gold" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Meeting
        </Button>
      </div>

      {googleConnection.connected && (
        <p className="text-xs text-muted-foreground">
          Google Calendar connected as <span className="text-primary">{googleConnection.googleEmail}</span>
        </p>
      )}

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="card-glass rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No meetings found</p>
          <Button variant="gold" className="mt-4" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="card-glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", getMeetingTypeColor(meeting.type))}>
                      {getMeetingTypeLabel(meeting.type)}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      meeting.status === "approved"
                        ? "text-green-400 bg-green-400/20"
                        : "text-orange-400 bg-orange-400/20"
                    )}>
                      {meeting.status === "approved" ? "Approved" : "Draft"}
                    </span>
                  </div>

                  <h3 className="font-medium text-lg">{meeting.title}</h3>

                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.startTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {meeting.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meeting.attendees.length} attendees
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Chaired by: {meeting.chairperson} | Secretary: {meeting.secretary}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {meeting.googleMeetLink && (
                      <a
                        href={meeting.googleMeetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs text-primary hover:underline"
                      >
                        Open Google Meet
                      </a>
                    )}
                    {meeting.googleEventLink && (
                      <a
                        href={meeting.googleEventLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-xs text-primary/90 hover:underline"
                      >
                        Open Google Calendar Event
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMeeting(meeting); setShowViewModal(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportMeeting(meeting)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  {meeting.status === "draft" && canApproveMeetingMinutes(currentUser) && (
                    <Button variant="ghost" size="sm" onClick={() => handleApprove(meeting.id)}>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(meeting)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(meeting.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Agenda Preview */}
              {meeting.agenda.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <button
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    onClick={() => setExpandedAgenda(expandedAgenda === meeting.id ? null : meeting.id)}
                  >
                    {expandedAgenda === meeting.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {meeting.agenda.length} Agenda Item{meeting.agenda.length > 1 ? "s" : ""}
                  </button>
                  {expandedAgenda === meeting.id && (
                    <div className="mt-2 space-y-2">
                      {meeting.agenda.map((item, i) => (
                        <div key={item.id} className="text-sm pl-4 border-l-2 border-primary/20">
                          <p className="font-medium">{i + 1}. {item.title}</p>
                          {item.decision && <p className="text-muted-foreground">Decision: {item.decision}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-2xl bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">
              {selectedMeeting ? "Edit Meeting" : "New Meeting"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {selectedMeeting ? "Update meeting details and minutes" : "Create a meeting first, then add minutes (optional)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Meeting Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Monthly General Meeting - January 2026"
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      type: v as MeetingType,
                      inviteScope: v === "committee" ? "selected_people" : "all_active",
                    })
                  }
                >
                  <SelectTrigger className="mt-1 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Meeting</SelectItem>
                    <SelectItem value="committee">Committee Meeting</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Meeting type is currently limited to General or Committee.
                </p>
              </div>
              <div>
                <Label>Location *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Church Hall"
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chairperson</Label>
                <Input
                  value={formData.chairperson}
                  onChange={(e) => setFormData({ ...formData, chairperson: e.target.value })}
                  placeholder="Meeting chair"
                  className="mt-1 bg-secondary"
                />
              </div>
              <div>
                <Label>Secretary</Label>
                <Input
                  value={formData.secretary}
                  onChange={(e) => setFormData({ ...formData, secretary: e.target.value })}
                  placeholder="Minutes taker"
                  className="mt-1 bg-secondary"
                />
              </div>
            </div>

            {/* Attendance */}
            <div>
              <Label className="mb-2 block">Attendance</Label>
              <div className="max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                <div className="flex flex-wrap gap-2">
                  {members.filter(m => m.status === "Active").map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAttendee(m.name)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full border transition-colors",
                        formData.attendees.includes(m.name)
                          ? "bg-green-400/20 border-green-400/50 text-green-400"
                          : formData.absentees.includes(m.name)
                          ? "bg-red-400/20 border-red-400/50 text-red-400"
                          : "bg-secondary border-primary/20 hover:border-primary/40"
                      )}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to mark present. {formData.attendees.length} present, {formData.absentees.length} absent.
              </p>
            </div>

            {/* Agenda */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Agenda Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {agendaItems.map((item, index) => (
                  <div key={index} className="p-3 bg-secondary/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <Input
                      placeholder="Agenda topic"
                      value={item.title}
                      onChange={(e) => updateAgendaItem(index, { title: e.target.value })}
                      className="bg-secondary"
                    />
                    <Textarea
                      placeholder="Discussion notes"
                      value={item.discussion}
                      onChange={(e) => updateAgendaItem(index, { discussion: e.target.value })}
                      className="bg-secondary min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Decision made"
                        value={item.decision || ""}
                        onChange={(e) => updateAgendaItem(index, { decision: e.target.value })}
                        className="bg-secondary"
                      />
                      <Input
                        placeholder="Action item"
                        value={item.actionItem || ""}
                        onChange={(e) => updateAgendaItem(index, { actionItem: e.target.value })}
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                ))}
                {agendaItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No agenda items yet. Click "Add Item" to start.
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="mt-1 bg-secondary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="syncGoogleCalendar"
                type="checkbox"
                checked={formData.syncGoogleCalendar}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    syncGoogleCalendar: e.target.checked,
                    createGoogleMeet: e.target.checked ? formData.createGoogleMeet : false,
                  })
                }
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="syncGoogleCalendar" className="text-sm">
                Sync this meeting to Google Calendar
              </Label>
            </div>

            <div className="flex items-center gap-2 pl-6">
              <input
                id="createGoogleMeet"
                type="checkbox"
                checked={formData.createGoogleMeet}
                disabled={!formData.syncGoogleCalendar}
                onChange={(e) => setFormData({ ...formData, createGoogleMeet: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="createGoogleMeet" className="text-sm">
                Add Google Meet link to Google Calendar event
              </Label>
            </div>

            <div className="pl-6">
              <Label className="text-sm">Google Invite Audience</Label>
              <Select
                value={formData.inviteScope}
                onValueChange={(value) => setFormData({ ...formData, inviteScope: value as InviteScope })}
              >
                <SelectTrigger className="mt-1 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_active">All active members (except approved leave)</SelectItem>
                  <SelectItem value="selected_people">Selected people only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                For committee or special targeting, choose "Selected people only" and pick invitees below.
              </p>
            </div>
            {formData.inviteScope === "selected_people" && (
              <div className="pl-6">
                <Label className="text-sm">Select Invitees</Label>
                <div className="mt-1 max-h-32 overflow-y-auto bg-secondary/50 rounded-lg p-2">
                  <div className="flex flex-wrap gap-2">
                    {members.filter((m) => m.status === "Active").map((m) => (
                      <button
                        key={`invitee-${m.id}`}
                        type="button"
                        onClick={() => toggleInvitee(m.name)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border transition-colors",
                          formData.inviteeNames.includes(m.name)
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "bg-secondary border-primary/20 hover:border-primary/40"
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.inviteeNames.length} invitee(s) selected. If none is selected, attendance list is used as fallback.
                </p>
              </div>
            )}
            {!googleConnection.connected && formData.syncGoogleCalendar && (
              <p className="text-xs text-orange-400">
                Google Calendar is not connected yet. Save will work, but event sync will be skipped.
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmit}>
                {selectedMeeting ? "Update Meeting" : "Save Meeting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-2xl bg-charcoal border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gold-text">Meeting Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              View meeting details and minutes
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 text-xs rounded-full", getMeetingTypeColor(selectedMeeting.type))}>
                  {getMeetingTypeLabel(selectedMeeting.type)}
                </span>
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  selectedMeeting.status === "approved"
                    ? "text-green-400 bg-green-400/20"
                    : "text-orange-400 bg-orange-400/20"
                )}>
                  {selectedMeeting.status === "approved" ? "Approved" : "Draft"}
                </span>
              </div>

              <h2 className="text-xl font-bold">{selectedMeeting.title}</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span> {selectedMeeting.date}
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span> {selectedMeeting.startTime}
                  {selectedMeeting.endTime && ` - ${selectedMeeting.endTime}`}
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span> {selectedMeeting.location}
                </div>
                <div>
                  <span className="text-muted-foreground">Chairperson:</span> {selectedMeeting.chairperson}
                </div>
              </div>

              {(selectedMeeting.googleMeetLink || selectedMeeting.googleEventLink) && (
                <div className="flex flex-wrap gap-3 text-sm">
                  {selectedMeeting.googleMeetLink && (
                    <a
                      href={selectedMeeting.googleMeetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open Google Meet
                    </a>
                  )}
                  {selectedMeeting.googleEventLink && (
                    <a
                      href={selectedMeeting.googleEventLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary/90 hover:underline"
                    >
                      Open Google Calendar Event
                    </a>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Attendees ({selectedMeeting.attendees.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedMeeting.attendees.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-green-400/20 text-green-400">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {selectedMeeting.agenda.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Agenda & Minutes</h3>
                  <div className="space-y-3">
                    {selectedMeeting.agenda.map((item, i) => (
                      <div key={item.id} className="p-3 bg-secondary/50 rounded-lg">
                        <h4 className="font-medium">{i + 1}. {item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.discussion}</p>
                        {item.decision && (
                          <p className="text-sm mt-2">
                            <span className="text-green-400">Decision:</span> {item.decision}
                          </p>
                        )}
                        {item.actionItem && (
                          <p className="text-sm mt-1">
                            <span className="text-blue-400">Action:</span> {item.actionItem}
                            {item.responsible && ` (${item.responsible})`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeeting.notes && (
                <div>
                  <h3 className="font-medium mb-2">Additional Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedMeeting.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button variant="gold" className="flex-1" onClick={() => handleExportMeeting(selectedMeeting)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

