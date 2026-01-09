import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Lock,
  Mail,
  Calendar,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  FileText,
  XCircle,
  UserCheck,
  CalendarOff,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Megaphone,
  Info,
  Bell,
  Pin,
  Wallet,
  DollarSign,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/use-toast";
import { getAllMembers, type Member } from "@/lib/dataService";
import {
  verifyPortalPin,
  createLeaveRequest,
  getLeaveRequestsByEmail,
  type LeaveRequest,
} from "@/lib/leaveService";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "@/lib/emailVerificationService";
import {
  getAttendanceByMemberEmail,
  getMemberAttendanceStatsByEmail,
  type AttendanceRecord,
} from "@/lib/attendanceService";
import {
  getActiveAnnouncements,
  type Announcement,
} from "@/lib/announcementService";
import {
  getContributionsByMemberEmail,
  getMemberContributionStatus,
  getActiveContributionTypes,
  getMonthName,
  type Contribution,
  type MemberContributionStatus,
} from "@/lib/contributionService";
import { formatCurrency } from "@/lib/flutterwave";
import { cn } from "@/lib/utils";

type View = "pin" | "dashboard" | "leave-form" | "verify" | "submit" | "success" | "attendance" | "requests" | "contributions";

export default function MemberPortal() {
  useDocumentTitle("Member Portal");
  const { toast } = useToast();

  // State
  const [view, setView] = useState<View>("pin");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isPinError, setIsPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Member data
  const [email, setEmail] = useState("");
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Leave request form data
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Verification
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Data
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<ReturnType<typeof getMemberAttendanceStatsByEmail> | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [contributionStatus, setContributionStatus] = useState<MemberContributionStatus | null>(null);

  // Load announcements when PIN is verified
  useEffect(() => {
    if (view !== "pin") {
      setAnnouncements(getActiveAnnouncements("members"));
    }
  }, [view]);

  // Load contributions when member logs in
  useEffect(() => {
    if (memberInfo) {
      const contributions = getContributionsByMemberEmail(memberInfo.email);
      setMyContributions(contributions);
      setContributionStatus(getMemberContributionStatus(memberInfo.id, memberInfo.name, memberInfo.email));
    }
  }, [memberInfo]);

  // PIN input handling
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setIsPinError(false);

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    if (value && index === 3 && newPin.every((p) => p)) {
      handlePinSubmit(newPin.join(""));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePinSubmit = (pinValue?: string) => {
    const pinToCheck = pinValue || pin.join("");
    if (verifyPortalPin(pinToCheck)) {
      setView("dashboard");
      setIsLoggedIn(true);
      toast({
        title: "Welcome! 🎵",
        description: "You now have access to the member portal.",
      });
    } else {
      setIsPinError(true);
      setPin(["", "", "", ""]);
      toast({
        title: "Invalid PIN",
        description: "Please enter the correct choir PIN.",
        variant: "destructive",
      });
    }
  };

  // Login with email to see personal data
  const handleEmailLogin = () => {
    const members = getAllMembers();
    const member = members.find(
      (m) => m.email?.toLowerCase() === email.toLowerCase()
    );

    if (!member) {
      toast({
        title: "Email not found",
        description: "This email is not registered. Please use your choir email.",
        variant: "destructive",
      });
      return;
    }

    setMemberInfo(member);
    setMyAttendance(getAttendanceByMemberEmail(email));
    setAttendanceStats(getMemberAttendanceStatsByEmail(email));
    setMyRequests(getLeaveRequestsByEmail(email));
    
    toast({
      title: `Welcome, ${member.name}! 👋`,
      description: "Your personal data has been loaded.",
    });
  };

  // Refresh data when email changes
  useEffect(() => {
    if (memberInfo && email) {
      setMyAttendance(getAttendanceByMemberEmail(email));
      setAttendanceStats(getMemberAttendanceStatsByEmail(email));
      setMyRequests(getLeaveRequestsByEmail(email));
    }
  }, [memberInfo, email]);

  // Form submission for leave request
  const handleFormContinue = () => {
    if (!startDate || !endDate || !reason) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setView("verify");
  };

  // Send verification code
  const handleSendCode = async () => {
    setIsLoading(true);
    setCanResend(false);
    setResendTimer(60);

    const result = await sendVerificationCode(email, memberInfo?.name || "Member");

    setIsLoading(false);

    if (result.success) {
      if (result.code) {
        setDevCode(result.code);
      }
      toast({
        title: "Code sent! 📧",
        description: result.message,
      });
      setView("submit");
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Resend timer
  useEffect(() => {
    if (view === "submit" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [view, resendTimer]);

  // Verification code input handling
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify code and submit
  const handleVerifyAndSubmit = () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    const result = verifyEmailCode(email, code);

    if (result.success) {
      createLeaveRequest({
        memberId: memberInfo?.id || "",
        memberName: memberInfo?.name || "",
        memberEmail: email,
        startDate,
        endDate,
        reason,
      });

      setView("success");
      toast({
        title: "Request submitted! ✅",
        description: "Your leave request has been sent to the admins.",
      });
    } else {
      toast({
        title: "Verification failed",
        description: result.message,
        variant: "destructive",
      });
      setVerificationCode(["", "", "", "", "", ""]);
    }
  };

  // Reset leave form
  const resetLeaveForm = () => {
    setStartDate("");
    setEndDate("");
    setReason("");
    setVerificationCode(["", "", "", "", "", ""]);
    setDevCode(null);
    setView("dashboard");
    // Refresh requests
    if (email) {
      setMyRequests(getLeaveRequestsByEmail(email));
    }
  };

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "denied":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <XCircle className="w-3 h-3" /> Denied
          </span>
        );
    }
  };

  const getAttendanceStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" /> Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <XCircle className="w-3 h-3" /> Absent
          </span>
        );
      case "excused":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
            <CalendarOff className="w-3 h-3" /> Excused
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs">
            <Clock className="w-3 h-3" /> Late
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* PIN Entry */}
            {view === "pin" && (
              <div className="card-glass rounded-3xl p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  Member <span className="gold-text">Portal</span>
                </h1>
                <p className="text-muted-foreground mb-8">
                  Enter the choir PIN to access the portal
                </p>

                <div className="flex justify-center gap-3 mb-6">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className={`w-14 h-14 text-center text-2xl font-bold rounded-xl bg-secondary border-2 transition-all outline-none ${
                        isPinError
                          ? "border-destructive animate-shake"
                          : digit
                          ? "border-primary"
                          : "border-primary/20 focus:border-primary"
                      }`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {isPinError && (
                  <p className="text-destructive text-sm mb-4 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Incorrect PIN. Please try again.
                  </p>
                )}

                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => handlePinSubmit()}
                  disabled={!pin.every((p) => p)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Enter Portal
                </Button>

                <p className="text-xs text-muted-foreground mt-6">
                  Don't know the PIN? Contact your choir admin.
                </p>
              </div>
            )}

            {/* Dashboard */}
            {view === "dashboard" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="card-glass rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold">
                        Member <span className="gold-text">Portal</span>
                      </h1>
                      {memberInfo ? (
                        <p className="text-muted-foreground">
                          Welcome back, <span className="text-primary">{memberInfo.name}</span>!
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Enter your email to view your personal data
                        </p>
                      )}
                    </div>
                    
                    {!memberInfo && (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-secondary border-primary/20 w-64"
                        />
                        <Button variant="gold" onClick={handleEmailLogin}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Load My Data
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Announcements */}
                {announcements.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" />
                      Announcements
                    </h2>
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={cn(
                          "card-glass rounded-xl p-4 border-l-4",
                          announcement.priority === "urgent" && "border-l-red-500 bg-red-500/5",
                          announcement.priority === "high" && "border-l-yellow-500 bg-yellow-500/5",
                          announcement.priority === "normal" && "border-l-primary",
                          announcement.type === "event" && "border-l-blue-500",
                          announcement.type === "warning" && "border-l-yellow-500",
                          announcement.type === "success" && "border-l-green-500"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg mt-0.5",
                            announcement.priority === "urgent" ? "bg-red-500/20" : 
                            announcement.type === "warning" ? "bg-yellow-500/20" :
                            announcement.type === "success" ? "bg-green-500/20" :
                            announcement.type === "event" ? "bg-blue-500/20" : "bg-primary/20"
                          )}>
                            {announcement.priority === "urgent" ? (
                              <Bell className="w-4 h-4 text-red-500" />
                            ) : (
                              <Info className={cn(
                                "w-4 h-4",
                                announcement.type === "warning" ? "text-yellow-500" :
                                announcement.type === "success" ? "text-green-500" :
                                announcement.type === "event" ? "text-blue-500" : "text-primary"
                              )} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                              {announcement.isPinned && <Pin className="w-3 h-3 text-primary" />}
                              {announcement.priority === "urgent" && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Urgent</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      if (!memberInfo) {
                        toast({
                          title: "Enter your email first",
                          description: "We need your email to submit a leave request.",
                        });
                        return;
                      }
                      setView("leave-form");
                    }}
                    className="card-glass rounded-2xl p-6 text-left hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <CalendarOff className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Request Leave</h3>
                        <p className="text-sm text-muted-foreground">Submit a leave request</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!memberInfo) {
                        toast({
                          title: "Enter your email first",
                          description: "We need your email to view your attendance.",
                        });
                        return;
                      }
                      setView("attendance");
                    }}
                    className="card-glass rounded-2xl p-6 text-left hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <BarChart3 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">My Attendance</h3>
                        <p className="text-sm text-muted-foreground">View your attendance history</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!memberInfo) {
                        toast({
                          title: "Enter your email first",
                          description: "We need your email to view your contributions.",
                        });
                        return;
                      }
                      setView("contributions");
                    }}
                    className="card-glass rounded-2xl p-6 text-left hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                        <Wallet className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">My Contributions</h3>
                        <p className="text-sm text-muted-foreground">View dues & payments</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Attendance Stats (if logged in) */}
                {memberInfo && attendanceStats && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Attendance Overview
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 rounded-xl bg-secondary/50">
                        <p className="text-3xl font-bold text-primary">{attendanceStats.percentage}%</p>
                        <p className="text-xs text-muted-foreground">Overall Rate</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary/50">
                        <p className="text-3xl font-bold text-green-400">{attendanceStats.present}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary/50">
                        <p className="text-3xl font-bold text-yellow-400">{attendanceStats.excused}</p>
                        <p className="text-xs text-muted-foreground">Excused</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary/50">
                        <p className="text-3xl font-bold text-red-400">{attendanceStats.absent}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                      </div>
                    </div>

                    {attendanceStats.thisMonth.total > 0 && (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-lg font-semibold text-foreground">
                              {attendanceStats.thisMonth.attended}/{attendanceStats.thisMonth.total} sessions
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {attendanceStats.thisMonth.percentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Attendance */}
                    {myAttendance.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Recent:</p>
                        <div className="space-y-2">
                          {myAttendance.slice(0, 3).map((record) => (
                            <div key={record.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                              <span className="text-sm text-foreground">
                                {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              {getAttendanceStatusBadge(record.status)}
                            </div>
                          ))}
                        </div>
                        {myAttendance.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setView("attendance")}
                          >
                            View All ({myAttendance.length} records) →
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Leave Requests (if logged in) */}
                {memberInfo && myRequests.length > 0 && (
                  <div className="card-glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        My Leave Requests
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => setView("requests")}>
                        View All →
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {myRequests.slice(0, 2).map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{request.reason}</p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state if not logged in */}
                {!memberInfo && (
                  <div className="card-glass rounded-2xl p-8 text-center">
                    <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Enter Your Email</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your registered choir email above to view your attendance history and leave requests.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Full Attendance View */}
            {view === "attendance" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setView("dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="font-display text-2xl font-bold">
                    My <span className="gold-text">Attendance</span>
                  </h1>
                </div>

                {attendanceStats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{attendanceStats.percentage}%</p>
                      <p className="text-xs text-muted-foreground">Overall</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-400">{attendanceStats.present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-orange-400">{attendanceStats.late}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-400">{attendanceStats.excused}</p>
                      <p className="text-xs text-muted-foreground">Excused</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-400">{attendanceStats.absent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </div>
                )}

                <div className="card-glass rounded-2xl overflow-hidden">
                  {myAttendance.length > 0 ? (
                    <div className="divide-y divide-primary/10">
                      {myAttendance.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            {record.notes && (
                              <p className="text-xs text-muted-foreground">{record.notes}</p>
                            )}
                          </div>
                          {getAttendanceStatusBadge(record.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Attendance Records</h3>
                      <p className="text-sm text-muted-foreground">
                        Your attendance history will appear here once recorded by admins.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Leave Requests View */}
            {view === "requests" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setView("dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <h1 className="font-display text-2xl font-bold">
                    My Leave <span className="gold-text">Requests</span>
                  </h1>
                </div>

                <div className="card-glass rounded-2xl overflow-hidden">
                  {myRequests.length > 0 ? (
                    <div className="divide-y divide-primary/10">
                      {myRequests.map((request) => (
                        <div key={request.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">{request.reason}</p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          {request.adminNotes && (
                            <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-secondary">
                              Admin note: {request.adminNotes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Leave Requests</h3>
                      <p className="text-sm text-muted-foreground">
                        You haven't submitted any leave requests yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Leave Request Form */}
            {view === "leave-form" && (
              <div className="card-glass rounded-3xl p-8 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h1 className="font-display text-2xl font-bold">
                    Request <span className="gold-text">Leave</span>
                  </h1>
                </div>

                <form className="space-y-5">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">Requesting as:</p>
                    <p className="font-medium text-foreground">{memberInfo?.name}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-10 bg-secondary border-primary/20"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="pl-10 bg-secondary border-primary/20"
                          min={startDate || new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Leave *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please explain why you need leave..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="bg-secondary border-primary/20 resize-none"
                      rows={4}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="gold"
                    className="w-full"
                    onClick={handleFormContinue}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            )}

            {/* Email Verification Step */}
            {view === "verify" && (
              <div className="card-glass rounded-3xl p-8 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">
                  Verify Your <span className="gold-text">Identity</span>
                </h1>
                <p className="text-muted-foreground mb-6">
                  We'll send a verification code to confirm this is you.
                </p>

                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Code will be sent to:
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>

                <Button
                  variant="gold"
                  className="w-full mb-4"
                  onClick={handleSendCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setView("leave-form")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}

            {/* Enter Code & Submit */}
            {view === "submit" && (
              <div className="card-glass rounded-3xl p-8 max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">
                    Code <span className="gold-text">Sent!</span>
                  </h1>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                {devCode && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6 text-center">
                    <p className="text-xs text-yellow-400 mb-1">🔧 Dev Mode - Code:</p>
                    <p className="font-mono text-lg font-bold text-yellow-400">{devCode}</p>
                  </div>
                )}

                <div className="flex justify-center gap-2 mb-6">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-secondary border-2 border-primary/20 focus:border-primary transition-all outline-none"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="text-center mb-6">
                  {canResend ? (
                    <Button variant="link" onClick={handleSendCode} disabled={isLoading}>
                      Resend Code
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Resend in {resendTimer}s</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="text-foreground">
                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full mb-4"
                  onClick={handleVerifyAndSubmit}
                  disabled={!verificationCode.every((d) => d)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & Submit
                </Button>

                <Button variant="ghost" className="w-full" onClick={() => setView("verify")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}

            {/* Success */}
            {view === "success" && (
              <div className="card-glass rounded-3xl p-8 text-center max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  Request <span className="gold-text">Submitted!</span>
                </h1>
                <p className="text-muted-foreground mb-8">
                  Your leave request has been sent for review.
                </p>

                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="text-foreground">
                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="gold-outline" className="flex-1" onClick={resetLeaveForm}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* Contributions View */}
            {view === "contributions" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="card-glass rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <h1 className="font-display text-2xl font-bold">
                        My <span className="gold-text">Contributions</span>
                      </h1>
                      <p className="text-muted-foreground">
                        View your dues and payment history
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                {contributionStatus && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(contributionStatus.totalPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(contributionStatus.monthlyDuesPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">Monthly Dues</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-500">
                        {formatCurrency(contributionStatus.specialContributions)}
                      </p>
                      <p className="text-xs text-muted-foreground">Special Contributions</p>
                    </div>
                  </div>
                )}

                {/* Outstanding Dues */}
                {contributionStatus && contributionStatus.unpaidMonths.length > 0 && (
                  <div className="card-glass rounded-2xl p-6 border-l-4 border-l-red-500">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Outstanding Monthly Dues
                    </h2>
                    <div className="space-y-2">
                      {contributionStatus.unpaidMonths.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                          <span className="text-foreground">
                            {getMonthName(item.month)} {item.year}
                          </span>
                          <span className="font-semibold text-red-400">
                            {formatCurrency(item.expectedAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Please contact the choir treasurer to make payments.
                    </p>
                  </div>
                )}

                {/* Special Contributions Status */}
                {contributionStatus && contributionStatus.specialStatus.length > 0 && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Special Contributions
                    </h2>
                    <div className="space-y-3">
                      {contributionStatus.specialStatus.map((item) => (
                        <div key={item.typeId} className="p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{item.typeName}</span>
                            {item.isPaid ? (
                              <span className="flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" /> Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected: {formatCurrency(item.expectedAmount)}</span>
                            <span className={item.isPaid ? "text-green-400" : "text-foreground"}>
                              Paid: {formatCurrency(item.paidAmount)}
                            </span>
                          </div>
                          {!item.isPaid && item.paidAmount > 0 && (
                            <div className="mt-2">
                              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(100, (item.paidAmount / item.expectedAmount) * 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {((item.paidAmount / item.expectedAmount) * 100).toFixed(0)}% paid
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment History */}
                <div className="card-glass rounded-2xl p-6">
                  <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Payment History
                  </h2>
                  {myContributions.length > 0 ? (
                    <div className="space-y-3">
                      {myContributions
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((contribution) => (
                          <div key={contribution.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                contribution.category === "monthly" ? "bg-blue-500/20" : "bg-yellow-500/20"
                              )}>
                                <DollarSign className={cn(
                                  "w-4 h-4",
                                  contribution.category === "monthly" ? "text-blue-500" : "text-yellow-500"
                                )} />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{contribution.typeName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {contribution.month && contribution.year
                                    ? `${getMonthName(contribution.month)} ${contribution.year}`
                                    : new Date(contribution.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-500">
                              {formatCurrency(contribution.amount)}
                            </p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No contributions recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
