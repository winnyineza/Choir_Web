import { useState, useEffect, useRef } from "react";
import logo from "@/assets/LogoTSC.jpg";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/NotificationSettings";
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
  Download,
  Printer,
  Phone,
  User,
  Settings,
  Pencil,
  Save,
  ClipboardList,
  Star,
  CheckSquare,
  MessageSquare,
  Camera,
  Trash2,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useToast } from "@/hooks/use-toast";
import { getAllMembers, getSettings, updateMember, type Member, type EmergencyContact, type Settings } from "@/lib/dataService";
import { BirthdayAlert } from "@/components/BirthdayAlert";
import {
  verifyPortalPin,
  createLeaveRequest,
  generateLeaveRequestId,
  getLeaveRequestsByEmail,
  validateLeaveRequestDate,
  MINIMUM_NOTICE_DAYS,
  REQUIRED_APPROVALS,
  type LeaveRequest,
} from "@/lib/leaveService";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "@/lib/emailVerificationService";
import { notifyLeaveRequestCreated } from "@/lib/notificationEmailService";
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
import { getAllMeetings, type MeetingMinutes } from "@/lib/meetingService";
import { formatCurrency } from "@/lib/flutterwave";
import { cn } from "@/lib/utils";
import {
  getActiveSurveysForMembers,
  hasRespondedToSurvey,
  submitSurveyResponse,
  type Survey,
  type SurveyQuestion,
} from "@/lib/surveyService";
import { exportMemberStatement } from "@/lib/exportUtils";
import { confirmDestructiveAction } from "@/lib/confirmDestructiveAction";

type View = "pin" | "dashboard" | "leave-form" | "verify" | "submit" | "success" | "attendance" | "requests" | "contributions";

const RESEND_COOLDOWN_SECONDS = 60;

interface ReceiptDisplayData {
  choirName: string;
  choirEmail: string;
  choirPhone: string;
  choirAddress: string;
  receiptNumber: string;
  issuedDate: string;
  memberName: string;
  description: string;
  period?: string;
  paymentMethod: string;
  reference?: string;
  amountLabel: string;
  recordedBy: string;
}

function getReceiptDisplayData(receipt: Contribution, settings: Settings): ReceiptDisplayData {
  const fallbackDescription = receipt.category === "monthly" ? "Monthly Dues" : receipt.category === "special" ? "Special Contribution" : "Contribution";
  return {
    choirName: settings.choirName || "Serenades of Praise Choir",
    choirEmail: settings.email || "theserenadeschoir@gmail.com",
    choirPhone: settings.phone || "+250 780 623 144",
    choirAddress: settings.address || "Kacyiru SDA Church, Kigali, Rwanda",
    receiptNumber: receipt.id.slice(0, 8).toUpperCase(),
    issuedDate: new Date(receipt.createdAt).toLocaleDateString(),
    memberName: receipt.memberName,
    description: receipt.typeName || fallbackDescription,
    period: receipt.month && receipt.year ? `${getMonthName(receipt.month)} ${receipt.year}` : undefined,
    paymentMethod: (receipt.paymentMethod || "cash").replace(/^./, (value) => value.toUpperCase()),
    reference: receipt.reference || undefined,
    amountLabel: formatCurrency(receipt.amount),
    recordedBy: receipt.recordedBy || "System",
  };
}

function buildReceiptPrintHtml(receipt: ReceiptDisplayData): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${receipt.choirName} Receipt ${receipt.receiptNumber}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #101828;
        --muted: #667085;
        --line: #e4e7ec;
        --gold: #d4af37;
        --blue: #1d4ed8;
        --blue-soft: #dbeafe;
        --surface: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        font-family: "Montserrat", "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        color: var(--ink);
      }
      .receipt {
        max-width: 760px;
        margin: 0 auto;
        background: var(--surface);
        border: 1px solid rgba(212, 175, 55, 0.22);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(16, 24, 40, 0.08);
      }
      .hero {
        background:
          radial-gradient(circle at top right, rgba(212, 175, 55, 0.28), transparent 32%),
          linear-gradient(135deg, #0b0b0b 0%, #16120a 100%);
        color: white;
        padding: 28px 32px;
      }
      .hero-inner {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: center;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .brand img {
        width: 72px;
        height: 72px;
        border-radius: 999px;
        object-fit: cover;
        border: 3px solid rgba(212, 175, 55, 0.38);
        background: rgba(255,255,255,0.08);
      }
      .eyebrow {
        display: inline-flex;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(212, 175, 55, 0.14);
        color: #f3d67a;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .brand h1 {
        margin: 10px 0 4px;
        font-size: 28px;
        line-height: 1.1;
      }
      .brand p {
        margin: 0;
        color: rgba(255,255,255,0.72);
        font-size: 14px;
      }
      .receipt-no {
        text-align: right;
      }
      .receipt-no .label {
        color: rgba(255,255,255,0.64);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .receipt-no .value {
        display: block;
        margin-top: 8px;
        font-size: 26px;
        font-weight: 700;
      }
      .body {
        padding: 30px 32px 24px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 22px;
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: 22px;
        padding: 20px;
        background: #fff;
      }
      .panel h2 {
        margin: 0 0 16px;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .detail {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 8px 0;
        border-bottom: 1px solid #f2f4f7;
      }
      .detail:last-child { border-bottom: none; padding-bottom: 0; }
      .detail span:first-child { color: var(--muted); }
      .detail span:last-child { font-weight: 600; text-align: right; }
      .amount-box {
        margin-top: 24px;
        border-radius: 24px;
        padding: 26px;
        background: linear-gradient(135deg, var(--blue-soft) 0%, #eff6ff 100%);
        border: 1px solid rgba(29, 78, 216, 0.18);
        text-align: center;
      }
      .amount-box p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .amount-box strong {
        display: block;
        margin-top: 12px;
        color: var(--blue);
        font-size: 40px;
        line-height: 1;
      }
      .footer {
        margin-top: 24px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-end;
        padding-top: 22px;
        border-top: 1px solid var(--line);
      }
      .footer small {
        display: block;
        color: var(--muted);
        line-height: 1.6;
      }
      .signature {
        text-align: right;
      }
      .signature .name {
        margin-top: 10px;
        font-weight: 700;
      }
      @media print {
        body { padding: 0; background: white; }
        .receipt { box-shadow: none; border-radius: 0; border: none; max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="hero">
        <div class="hero-inner">
          <div class="brand">
            <img src="${logo}" alt="${receipt.choirName} logo" />
            <div>
              <span class="eyebrow">Official Contribution Receipt</span>
              <h1>${receipt.choirName}</h1>
              <p>${receipt.choirAddress}</p>
            </div>
          </div>
          <div class="receipt-no">
            <span class="label">Receipt No</span>
            <span class="value">${receipt.receiptNumber}</span>
          </div>
        </div>
      </div>
      <div class="body">
        <div class="meta-grid">
          <div class="panel">
            <h2>Receipt Details</h2>
            <div class="detail"><span>Issued Date</span><span>${receipt.issuedDate}</span></div>
            <div class="detail"><span>Member</span><span>${receipt.memberName}</span></div>
            <div class="detail"><span>Description</span><span>${receipt.description}</span></div>
            ${receipt.period ? `<div class="detail"><span>Period</span><span>${receipt.period}</span></div>` : ""}
          </div>
          <div class="panel">
            <h2>Payment Details</h2>
            <div class="detail"><span>Method</span><span>${receipt.paymentMethod}</span></div>
            ${receipt.reference ? `<div class="detail"><span>Reference</span><span>${receipt.reference}</span></div>` : ""}
            <div class="detail"><span>Recorded By</span><span>${receipt.recordedBy}</span></div>
            <div class="detail"><span>Contact</span><span>${receipt.choirEmail}<br />${receipt.choirPhone}</span></div>
          </div>
        </div>
        <div class="amount-box">
          <p>Amount Paid</p>
          <strong>${receipt.amountLabel}</strong>
        </div>
        <div class="footer">
          <div>
            <small>Issued by ${receipt.choirName}</small>
            <small>${receipt.choirAddress}</small>
            <small>${receipt.choirEmail} • ${receipt.choirPhone}</small>
          </div>
          <div class="signature">
            <small>Recorded by</small>
            <div class="name">${receipt.recordedBy}</div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

const getLastVerificationSendAt = (email: string): number | null => {
  if (typeof window === "undefined" || !email) return null;
  const raw = window.localStorage.getItem(`choir_leave_verification_last_sent:${email.toLowerCase()}`);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const setLastVerificationSendAt = (email: string) => {
  if (typeof window === "undefined" || !email) return;
  window.localStorage.setItem(`choir_leave_verification_last_sent:${email.toLowerCase()}` , Date.now().toString());
};

const NAVIGABLE_VIEWS = new Set<View>(["dashboard", "attendance", "contributions", "requests", "leave-form"]);

export default function MemberPortal() {
  useDocumentTitle("Member Portal");
  const { toast } = useToast();

  // State — hash-based navigation for sub-pages
  const [view, setViewState] = useState<View>("pin");

  const setView = (newView: View) => {
    setViewState(newView);
    if (NAVIGABLE_VIEWS.has(newView)) {
      const hash = newView === "dashboard" ? "" : newView;
      window.history.pushState(null, "", hash ? `#${hash}` : window.location.pathname);
    }
  };

  // Listen for browser back/forward (only when logged in)
  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.replace("#", "") as View;
      if (hash && NAVIGABLE_VIEWS.has(hash)) {
        setViewState(hash);
      } else if (view !== "pin") {
        setViewState("dashboard");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [view]);
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
  const [pendingLeaveRequestId, setPendingLeaveRequestId] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);

  // Data
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<ReturnType<typeof getMemberAttendanceStatsByEmail> | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [contributionStatus, setContributionStatus] = useState<MemberContributionStatus | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingMinutes[]>([]);
  const [choirSettings, setChoirSettings] = useState<Settings>({
    choirName: "Serenades of Praise Choir",
    choirDescription: "",
    foundedYear: "2024",
    address: "Kacyiru SDA Church, Kigali, Rwanda",
    phone: "+250 780 623 144",
    email: "theserenadeschoir@gmail.com",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    whatsapp: "",
    welcomeTitle: "",
    welcomeMessage: "",
    backgroundImage: "",
    joinHeroImage: "",
    choirImage1: "",
    choirImage2: "",
    choirImage3: "",
  });

  // Profile editing
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState<EmergencyContact>({
    name: "",
    relationship: "Spouse",
    phone: "",
    altPhone: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editPhoto, setEditPhoto] = useState<string | undefined>(undefined);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Surveys
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | number | string[]>>({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Contribution | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const selectedReceiptDisplay = selectedReceipt ? getReceiptDisplayData(selectedReceipt, choirSettings) : null;

  useEffect(() => {
    getSettings().then(setChoirSettings).catch(() => {
      // Keep the fallback branding if settings fail to load.
    });
  }, []);

  // Load announcements when PIN is verified
  useEffect(() => {
    if (view !== "pin") {
      getActiveAnnouncements("members").then(setAnnouncements);
    }
  }, [view]);

  // Load contributions when member logs in
  useEffect(() => {
    if (memberInfo) {
      const loadContributions = async () => {
        const [contributions, status] = await Promise.all([
          getContributionsByMemberEmail(memberInfo.email),
          getMemberContributionStatus(memberInfo.id, memberInfo.name, memberInfo.email),
        ]);
        setMyContributions(contributions);
        setContributionStatus(status);
      };
      loadContributions();
    }
  }, [memberInfo]);

  // Populate edit form when member info is loaded
  useEffect(() => {
    if (memberInfo) {
      setEditName(memberInfo.name || "");
      setEditPhone(memberInfo.phone || "");
      setEditDateOfBirth(memberInfo.dateOfBirth || "");
      setEditPhoto(memberInfo.photo || undefined);
      if (memberInfo.emergencyContact) {
        setEditEmergencyContact(memberInfo.emergencyContact);
      } else {
        setEditEmergencyContact({ name: "", relationship: "Spouse", phone: "", altPhone: "" });
      }
      // Load active surveys
      getActiveSurveysForMembers().then(setActiveSurveys);
    }
  }, [memberInfo]);

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!memberInfo) return;
    
    setIsSavingProfile(true);
    try {
      const updatedMember = await updateMember(memberInfo.id, {
        name: editName,
        phone: editPhone,
        photo: editPhoto || undefined,
        dateOfBirth: editDateOfBirth || undefined,
        emergencyContact: editEmergencyContact.name ? editEmergencyContact : undefined,
      });
      
      if (updatedMember) {
        setMemberInfo(updatedMember);
        toast({
          title: "Profile Updated",
          description: "Your information has been saved successfully.",
        });
        setShowProfileEdit(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle survey open
  const handleOpenSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSurveyAnswers({});
    setShowSurveyModal(true);
  };

  // Handle survey submit
  const handleSubmitSurvey = async () => {
    if (!selectedSurvey || !memberInfo) return;
    
    // Check if all required questions are answered
    const unanswered = (selectedSurvey.questions || []).filter(q => !surveyAnswers[q.id]);
    if (unanswered.length > 0) {
      toast({
        title: "Please answer all questions",
        description: `${unanswered.length} question(s) remaining.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      await submitSurveyResponse({
        surveyId: selectedSurvey.id,
        memberId: memberInfo.id,
        answers: surveyAnswers,
      });
      
      toast({
        title: "Survey Submitted!",
        description: "Thank you for your feedback.",
      });
      setShowSurveyModal(false);
      setSelectedSurvey(null);
      setSurveyAnswers({});
      // Refresh surveys list
      const surveys = await getActiveSurveysForMembers();
      setActiveSurveys(surveys);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

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

  const loadUpcomingMeetingsForMember = async (member: Member) => {
    try {
      const meetings = await getAllMeetings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const memberName = member.name.trim().toLowerCase();

      const visibleUpcoming = meetings
        .filter((meeting) => {
          const meetingDateOnly = String(meeting.date || "").slice(0, 10);
          const meetingDate = new Date(`${meetingDateOnly}T00:00:00`);
          if (Number.isNaN(meetingDate.getTime())) return false;
          if (meetingDate < today) return false;

          if (meeting.type === "committee") {
            const committeeNames = (meeting.attendees || []).map((name) => String(name).trim().toLowerCase());
            if (committeeNames.length === 0) return true;
            return committeeNames.includes(memberName);
          }

          return true;
        })
        .sort((a, b) => {
          const aDateTime = new Date(`${String(a.date).slice(0, 10)}T${a.startTime || "00:00"}:00`).getTime();
          const bDateTime = new Date(`${String(b.date).slice(0, 10)}T${b.startTime || "00:00"}:00`).getTime();
          return aDateTime - bDateTime;
        })
        .slice(0, 6);

      setUpcomingMeetings(visibleUpcoming);
    } catch {
      setUpcomingMeetings([]);
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
  const handleEmailLogin = async () => {
    const members = await getAllMembers();
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

    // Mark invite as accepted on first portal login
    if (member.inviteStatus !== "accepted") {
      await updateMember(member.id, { inviteStatus: "accepted" });
    }

    const [attendance, attStats, requests] = await Promise.all([
      getAttendanceByMemberEmail(email),
      getMemberAttendanceStatsByEmail(email),
      getLeaveRequestsByEmail(email),
    ]);
    setMyAttendance(attendance);
    setAttendanceStats(attStats);
    setMyRequests(requests);
    await loadUpcomingMeetingsForMember(member);
    
    toast({
      title: `Welcome, ${member.name}! 👋`,
      description: "Your personal data has been loaded.",
    });
  };

  // Refresh data when email changes
  useEffect(() => {
    if (memberInfo && email) {
      Promise.all([
        getAttendanceByMemberEmail(email),
        getMemberAttendanceStatsByEmail(email),
        getLeaveRequestsByEmail(email),
      ]).then(([att, attStats, reqs]) => {
        setMyAttendance(att);
        setAttendanceStats(attStats);
        setMyRequests(reqs);
      });
      loadUpcomingMeetingsForMember(memberInfo);
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
    if (!email) {
      toast({
        title: "Email Required",
        description: "Enter your email before requesting a verification code.",
        variant: "destructive",
      });
      return;
    }

    const lastSentAt = getLastVerificationSendAt(email);
    if (lastSentAt) {
      const elapsed = Math.floor((Date.now() - lastSentAt) / 1000);
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
        setCanResend(false);
        setResendTimer(remaining);
        toast({
          title: "Please wait",
          description: `You can resend a code in ${remaining}s` ,
        });
        setView("submit");
        return;
      }
    }

    setIsLoading(true);

    try {
      const leaveRequestId = pendingLeaveRequestId || generateLeaveRequestId();
      setPendingLeaveRequestId(leaveRequestId);

      const result = await sendVerificationCode(email, memberInfo?.name || "Member", leaveRequestId);

      if (result.success) {
        if (result.code) {
          setDevCode(result.code);
        }
        setLastVerificationSendAt(email);
        toast({
          title: "Code sent! 📧",
          description: result.message,
        });
        setCanResend(false);
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setView("submit");
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        setCanResend(true);
        setResendTimer(0);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      setCanResend(true);
      setResendTimer(0);
    } finally {
      setIsLoading(false);
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

  // Initialize resend timer and state from any existing cooldown in localStorage
  useEffect(() => {
    if (!email) return;

    const lastSentAt = getLastVerificationSendAt(email);
    if (!lastSentAt) {
      return;
    }

    const elapsed = Math.floor((Date.now() - lastSentAt) / 1000);
    if (elapsed >= RESEND_COOLDOWN_SECONDS) {
      setCanResend(true);
      setResendTimer(0);
    } else {
      setCanResend(false);
      setResendTimer(RESEND_COOLDOWN_SECONDS - elapsed);
    }
  }, [email]);

  const focusVerificationInput = (index: number) => {
    const input = document.getElementById(`code-${index}`) as HTMLInputElement | null;
    input?.focus();
  };

  const fillVerificationCode = (rawValue: string, startIndex = 0) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 6 - startIndex).split("");
    if (digits.length === 0) return;

    const newCode = [...verificationCode];
    digits.forEach((digit, offset) => {
      newCode[startIndex + offset] = digit;
    });
    setVerificationCode(newCode);

    const nextIndex = Math.min(startIndex + digits.length, 5);
    focusVerificationInput(nextIndex);
  };

  // Verification code input handling
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      fillVerificationCode(value, index);
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      focusVerificationInput(index + 1);
    }
  };

  const handleCodePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillVerificationCode(e.clipboardData.getData("text"), index);
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      focusVerificationInput(index - 1);
    }
  };

  // Verify code and submit
  const handleVerifyAndSubmit = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyEmailCode(email, code);

    if (result.success) {
      const leaveResult = await createLeaveRequest({
        id: pendingLeaveRequestId || generateLeaveRequestId(),
        memberId: memberInfo?.id || "",
        memberName: memberInfo?.name || "",
        memberEmail: email,
        startDate,
        endDate,
        reason,
      });

      // Check if there was an error (e.g., date validation failed)
      if (leaveResult && 'error' in leaveResult) {
        toast({
          title: "Request Failed",
          description: leaveResult.error,
          variant: "destructive",
        });
        setView("request");
        return;
      }

      // Notify approvers via email
      notifyLeaveRequestCreated(memberInfo?.name || email, startDate, endDate, reason);

      setView("success");
      toast({
        title: "Request submitted! ✅",
        description: `Your leave request has been sent for review. It requires ${REQUIRED_APPROVALS} approvals.`,
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
    setPendingLeaveRequestId(null);
    setDevCode(null);
    setView("dashboard");
    // Refresh requests
    if (email) {
      getLeaveRequestsByEmail(email).then(setMyRequests);
    }
  };

  const getStatusBadge = (status: LeaveRequest["status"], request?: LeaveRequest) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
              <Clock className="w-3 h-3" /> Awaiting Review
            </span>
            {request && (
              <span className="text-[10px] text-muted-foreground">
                {request.approvalCount || 0}/{REQUIRED_APPROVALS} approvals
              </span>
            )}
          </div>
        );
      case "partial":
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs">
              <Clock className="w-3 h-3" /> In Progress
            </span>
            {request && (
              <span className="text-[10px] text-muted-foreground">
                {request.approvalCount || 0}/{REQUIRED_APPROVALS} approvals
              </span>
            )}
          </div>
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

    const handleDeleteLeaveRequest = async (request: LeaveRequest) => {
      if (request.status !== "pending" && request.status !== "partial") {
        toast({
          title: "Cannot remove request",
          description: "Only pending or in-progress requests can be removed.",
          variant: "destructive",
        });
        return;
      }

      const confirmed = confirmDestructiveAction({
        action: "remove",
        subject: "this leave request",
        warning: "This will permanently remove your request so admins can no longer review it.",
        confirmWord: "REMOVE",
      });

      if (!confirmed) return;

      setDeletingRequestId(request.id);
      try {
        const success = await deleteLeaveRequest(request.id);
        if (!success) {
          toast({
            title: "Error",
            description: "Failed to remove leave request. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setMyRequests((prev) => prev.filter((r) => r.id !== request.id));
        toast({
          title: "Leave request removed",
          description: "Your leave request has been removed successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove leave request. Please try again.",
          variant: "destructive",
        });
      } finally {
        setDeletingRequestId(null);
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
                {/* Birthday Alert */}
                {memberInfo && (
                  <BirthdayAlert 
                    currentUserEmail={memberInfo.email}
                    currentUserName={memberInfo.name}
                  />
                )}
                
                {/* Header */}
                <div className="card-glass rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {memberInfo && (
                        memberInfo.photo ? (
                          <img src={memberInfo.photo} alt={memberInfo.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 hidden sm:block" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center hidden sm:flex">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )
                      )}
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
                    </div>
                    
                    {!memberInfo && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-secondary border-primary/20 w-full sm:w-64"
                        />
                        <Button variant="gold" onClick={handleEmailLogin} className="w-full sm:w-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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

                  <button
                    onClick={() => {
                      if (!memberInfo) {
                        toast({
                          title: "Enter your email first",
                          description: "We need your email to edit your profile.",
                        });
                        return;
                      }
                      setShowProfileEdit(true);
                    }}
                    className="card-glass rounded-2xl p-6 text-left hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">My Profile</h3>
                        <p className="text-sm text-muted-foreground">Edit your profile information</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Upcoming Meetings */}
                {memberInfo && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Meetings
                    </h2>
                    {upcomingMeetings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingMeetings.map((meeting) => (
                          <div key={meeting.id} className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-foreground">{meeting.title}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                {meeting.type === "committee" ? "Committee" : "General"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(meeting.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                              {meeting.startTime ? ` • ${meeting.startTime}` : ""}
                            </p>
                            {meeting.location && (
                              <p className="text-xs text-muted-foreground mt-1">📍 {meeting.location}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No upcoming meetings available right now.</p>
                    )}
                  </div>
                )}

                {/* Emergency Contact (if logged in and has one) */}
                {memberInfo && memberInfo.emergencyContact && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      Emergency Contact
                    </h2>
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{memberInfo.emergencyContact.name}</p>
                          <p className="text-sm text-muted-foreground">{memberInfo.emergencyContact.relationship}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="w-3 h-3 text-primary" />
                              {memberInfo.emergencyContact.phone}
                            </p>
                            {memberInfo.emergencyContact.altPhone && (
                              <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {memberInfo.emergencyContact.altPhone} (Alt)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProfileEdit(true)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                )}

                {/* Profile & Settings */}
                {memberInfo && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      My Profile
                    </h2>
                    <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-4">
                        {memberInfo.photo ? (
                          <img src={memberInfo.photo} alt={memberInfo.name} className="w-12 h-12 rounded-full object-cover border border-primary/30" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{memberInfo.name}</p>
                          <p className="text-sm text-muted-foreground">{memberInfo.voice} • {memberInfo.status}</p>
                          <p className="text-xs text-muted-foreground mt-1">{memberInfo.phone || "No phone added"}</p>
                        </div>
                      </div>
                    </div>
                    {!memberInfo.emergencyContact && (
                      <p className="text-sm text-yellow-500/80 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please add your emergency contact information.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setShowProfileEdit(true)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </div>
                )}

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
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(request.status, request)}
                            {(request.status === "pending" || request.status === "partial") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] mt-1"
                                  disabled={deletingRequestId === request.id}
                                  onClick={() => handleDeleteLeaveRequest(request)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  {deletingRequestId === request.id ? "Removing..." : "Cancel"}
                                </Button>
                                <span className="text-[10px] text-muted-foreground text-right max-w-[220px]">
                                  Only pending or in-progress requests can be removed.
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Surveys (if logged in and there are surveys) */}
                {memberInfo && activeSurveys.length > 0 && (
                  <div className="card-glass rounded-2xl p-6">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      Surveys
                    </h2>
                    <div className="space-y-3">
                      {activeSurveys.map(survey => {
                        const hasResponded = hasRespondedToSurvey(survey.id, memberInfo.id);
                        return (
                          <div 
                            key={survey.id} 
                            className={cn(
                              "p-4 rounded-xl border transition-all",
                              hasResponded 
                                ? "bg-green-500/10 border-green-500/30" 
                                : "bg-primary/10 border-primary/30 hover:bg-primary/20 cursor-pointer"
                            )}
                            onClick={() => !hasResponded && handleOpenSurvey(survey)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground">{survey.title}</h3>
                                {survey.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              {hasResponded ? (
                                <div className="flex items-center gap-1 text-green-500">
                                  <CheckCircle className="w-5 h-5" />
                                  <span className="text-xs">Completed</span>
                                </div>
                              ) : (
                                <Button variant="gold" size="sm">
                                  Take Survey
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(request.status, request)}
                              {(request.status === "pending" || request.status === "partial") && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] mt-1"
                                    disabled={deletingRequestId === request.id}
                                    onClick={() => handleDeleteLeaveRequest(request)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    {deletingRequestId === request.id ? "Removing..." : "Cancel"}
                                  </Button>
                                  <span className="text-[10px] text-muted-foreground text-right max-w-[260px]">
                                    Only pending or in-progress requests can be removed.
                                  </span>
                                </>
                              )}
                            </div>
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
                          min={(() => {
                            const minDate = new Date();
                            minDate.setDate(minDate.getDate() + MINIMUM_NOTICE_DAYS);
                            return minDate.toISOString().split("T")[0];
                          })()}
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
                      autoComplete={index === 0 ? "one-time-code" : undefined}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onPaste={(e) => handleCodePaste(index, e)}
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
                  <div className="flex items-center justify-between">
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
                    {memberInfo && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download Statement
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={async () => {
                              await exportMemberStatement(memberInfo.id, memberInfo.name, memberInfo.email, "pdf");
                              toast({ title: "Statement Downloaded", description: "Your contribution statement has been exported to PDF" });
                            }}
                          >
                            PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              await exportMemberStatement(memberInfo.id, memberInfo.name, memberInfo.email, "excel");
                              toast({ title: "Statement Downloaded", description: "Your contribution statement has been exported to Excel" });
                            }}
                          >
                            Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Summary Stats */}
                {contributionStatus && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="card-glass rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(contributionStatus.totalPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center border border-red-500/30 bg-red-500/5">
                      <p className="text-2xl font-bold text-red-500">
                        {formatCurrency(contributionStatus.totalOutstanding)}
                      </p>
                      <p className="text-xs text-red-400">Total Outstanding</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center border border-sky-500/20 bg-sky-500/5">
                      <p className="text-2xl font-bold text-sky-400">
                        {formatCurrency(contributionStatus.monthlyDuesPaid)}
                      </p>
                      <p className="text-xs text-sky-200/80">Monthly Dues</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center border border-cyan-500/20 bg-cyan-500/5">
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(contributionStatus.specialContributions)}
                      </p>
                      <p className="text-xs text-cyan-200/80">Special Contributions</p>
                    </div>
                    <div className="card-glass rounded-xl p-4 text-center border border-orange-500/30 bg-orange-500/5">
                      <p className="text-2xl font-bold text-orange-500">
                        {formatCurrency(contributionStatus.outstandingFines)}
                      </p>
                      <p className="text-xs text-orange-400">Outstanding Fines</p>
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
                        <div 
                          key={item.typeId} 
                          className={cn(
                            "p-3 rounded-lg",
                            item.isPaid ? "bg-green-500/10" : "bg-secondary/50 border-l-4 border-l-red-500"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{item.typeName}</span>
                            {item.isPaid ? (
                              <span className="flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle className="w-4 h-4" /> Paid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400 text-sm font-medium">
                                <AlertCircle className="w-4 h-4" /> 
                                {formatCurrency(item.expectedAmount - item.paidAmount)} due
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected: {formatCurrency(item.expectedAmount)}</span>
                            <span className={item.isPaid ? "text-green-400" : "text-foreground"}>
                              Paid: {formatCurrency(item.paidAmount)}
                            </span>
                          </div>
                          {!item.isPaid && (
                            <div className="mt-2">
                              <div className="w-full h-2 bg-red-500/20 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${Math.min(100, (item.paidAmount / item.expectedAmount) * 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-red-400 mt-1">
                                {((item.paidAmount / item.expectedAmount) * 100).toFixed(0)}% paid • 
                                <span className="font-medium"> {formatCurrency(item.expectedAmount - item.paidAmount)} remaining</span>
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
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-green-500">
                                {formatCurrency(contribution.amount)}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedReceipt(contribution)}
                                className="text-xs"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Receipt
                              </Button>
                            </div>
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

                {/* Receipt Modal */}
                <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
                  <DialogContent className="w-[min(92vw,880px)] max-w-4xl bg-background border-primary/20 max-h-[92vh] overflow-y-auto p-0">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 px-6 pt-6">
                        <FileText className="w-5 h-5 text-primary" />
                        Payment Receipt
                      </DialogTitle>
                      <DialogDescription className="px-6 text-muted-foreground text-sm">
                        View and download your payment receipt
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedReceiptDisplay && (
                      <div className="space-y-6 px-6 pb-6" id="receipt-content">
                        <div
                          className="overflow-hidden rounded-3xl border border-primary/20 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
                          style={{ fontFamily: '"Montserrat", "Segoe UI", sans-serif' }}
                        >
                          <div className="relative overflow-hidden border-b border-primary/20 bg-[linear-gradient(135deg,#080808_0%,#17120a_58%,#23190a_100%)] px-5 py-6 md:px-8 md:py-7">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.22),transparent_32%)]" />
                            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                              <div className="flex items-start gap-4">
                                <img
                                  src={logo}
                                  alt={`${selectedReceiptDisplay.choirName} logo`}
                                  className="mt-1 h-16 w-16 shrink-0 rounded-full border-2 border-primary/40 object-cover shadow-lg"
                                />
                                <div className="min-w-0">
                                  <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/90">
                                    Official Contribution Receipt
                                  </p>
                                  <h3 className="mt-3 max-w-[18ch] text-balance font-display text-2xl font-bold leading-tight text-white md:max-w-none md:text-4xl">
                                    {selectedReceiptDisplay.choirName}
                                  </h3>
                                  <div className="mt-3 grid gap-1 text-sm text-white/70">
                                    {selectedReceiptDisplay.choirAddress && <p>{selectedReceiptDisplay.choirAddress}</p>}
                                    <p>
                                      {selectedReceiptDisplay.choirEmail}
                                      {selectedReceiptDisplay.choirPhone ? ` • ${selectedReceiptDisplay.choirPhone}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-sm md:min-w-[210px] md:text-right">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Receipt No</p>
                                <p className="mt-2 font-mono text-lg font-semibold text-white">
                                  {selectedReceiptDisplay.receiptNumber}
                                </p>
                                <p className="mt-2 text-xs text-white/65">{selectedReceiptDisplay.issuedDate}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-5 p-5 md:p-8">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="rounded-2xl border border-border/80 bg-secondary/25 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  Receipt Details
                                </p>
                                <div className="mt-4 space-y-4 text-sm">
                                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                    <span className="text-muted-foreground">Member</span>
                                    <span className="font-medium text-foreground">
                                      {selectedReceiptDisplay.memberName}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                    <span className="text-muted-foreground">Description</span>
                                    <span className="font-medium text-foreground">
                                      {selectedReceiptDisplay.description}
                                    </span>
                                  </div>
                                  {selectedReceiptDisplay.period && (
                                    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                      <span className="text-muted-foreground">Period</span>
                                      <span className="font-medium text-foreground">
                                        {selectedReceiptDisplay.period}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/80 bg-secondary/25 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                  Payment Details
                                </p>
                                <div className="mt-4 space-y-4 text-sm">
                                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                    <span className="text-muted-foreground">Method</span>
                                    <span className="font-medium text-foreground">
                                      {selectedReceiptDisplay.paymentMethod}
                                    </span>
                                  </div>
                                  {selectedReceiptDisplay.reference && (
                                    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                      <span className="text-muted-foreground">Reference</span>
                                      <span className="break-all font-mono font-medium text-foreground">
                                        {selectedReceiptDisplay.reference}
                                      </span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                                    <span className="text-muted-foreground">Recorded By</span>
                                    <span className="font-medium text-foreground">
                                      {selectedReceiptDisplay.recordedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[1.75rem] border border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_0%,rgba(59,130,246,0.08)_100%)] p-6 text-center md:p-8">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                                Amount Paid
                              </p>
                              <p className="mt-3 text-4xl font-bold text-sky-400 md:text-5xl">
                                {selectedReceiptDisplay.amountLabel}
                              </p>
                            </div>

                            <div className="grid gap-4 border-t border-primary/15 pt-4 text-xs text-muted-foreground md:grid-cols-2">
                              <div className="space-y-1 rounded-2xl bg-secondary/20 p-4">
                                <p>Issued by {selectedReceiptDisplay.choirName}</p>
                                {selectedReceiptDisplay.choirAddress && <p>{selectedReceiptDisplay.choirAddress}</p>}
                              </div>
                              <div className="space-y-1 rounded-2xl bg-secondary/20 p-4 text-left md:text-right">
                                <p>Recorded by {selectedReceiptDisplay.recordedBy}</p>
                                <p>Thank you for supporting the ministry.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            if (selectedReceiptDisplay) {
                              const printWindow = window.open("", "_blank");
                              if (!printWindow) return;
                              printWindow.document.write(buildReceiptPrintHtml(selectedReceiptDisplay));
                              printWindow.document.close();
                              printWindow.focus();
                              printWindow.print();
                            }
                          }}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Receipt
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Profile Edit Modal - available from dashboard and contributions */}
            <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
                  <DialogContent className="max-w-xl bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-primary" />
                        My Profile
                      </DialogTitle>
                      <DialogDescription>
                        Update your profile information. Email and voice part cannot be changed.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-5 pt-4">
                      {/* Profile Photo */}
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="relative w-20 h-20 rounded-full cursor-pointer group"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          {editPhoto ? (
                            <img
                              src={editPhoto}
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary transition-colors"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
                              <User className="w-8 h-8 text-primary/60" />
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          {editPhoto ? "Change Photo" : "Add Photo"}
                        </button>
                        {editPhoto && (
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:underline"
                            onClick={() => setEditPhoto(undefined)}
                          >
                            Remove Photo
                          </button>
                        )}
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              toast({ title: "File Too Large", description: "Photo must be under 2MB.", variant: "destructive" });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {/* Row 1: Name + Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Name</Label>
                          <Input
                            id="profile-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Full name"
                            className="bg-secondary border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g., 078 123 4567"
                            className="bg-secondary border-primary/20"
                          />
                        </div>
                      </div>

                      {/* Row 2: Email (read-only) + Voice (read-only) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-email">Email</Label>
                          <Input
                            id="profile-email"
                            type="email"
                            value={memberInfo?.email || ""}
                            readOnly
                            disabled
                            className="bg-muted border-primary/20 text-muted-foreground cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">Contact an admin to change.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-voice">Voice Part</Label>
                          <Input
                            id="profile-voice"
                            value={memberInfo?.voice || ""}
                            readOnly
                            disabled
                            className="bg-muted border-primary/20 text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label htmlFor="profile-dob">Date of Birth</Label>
                        <div className="relative sm:max-w-[calc(50%-0.5rem)]">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="profile-dob"
                            type="date"
                            value={editDateOfBirth}
                            onChange={(e) => setEditDateOfBirth(e.target.value)}
                            className="pl-10 bg-secondary border-primary/20"
                          />
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Emergency Contact</Label>
                        
                        {/* EC Row 1: Name + Relationship */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="ec-name" className="text-sm">Contact Name</Label>
                            <Input
                              id="ec-name"
                              value={editEmergencyContact.name}
                              onChange={(e) => setEditEmergencyContact({ ...editEmergencyContact, name: e.target.value })}
                              placeholder="Full name"
                              className="bg-secondary border-primary/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ec-relationship" className="text-sm">Relationship</Label>
                            <Select
                              value={editEmergencyContact.relationship}
                              onValueChange={(v) => setEditEmergencyContact({ ...editEmergencyContact, relationship: v as EmergencyContact["relationship"] })}
                            >
                              <SelectTrigger className="bg-secondary border-primary/20">
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
                        </div>

                        {/* EC Row 2: Phone + Alt Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="ec-phone" className="text-sm">Phone</Label>
                            <Input
                              id="ec-phone"
                              type="tel"
                              value={editEmergencyContact.phone}
                              onChange={(e) => setEditEmergencyContact({ ...editEmergencyContact, phone: e.target.value })}
                              placeholder="Primary phone"
                              className="bg-secondary border-primary/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ec-alt-phone" className="text-sm">Alt. Phone (Optional)</Label>
                            <Input
                              id="ec-alt-phone"
                              type="tel"
                              value={editEmergencyContact.altPhone || ""}
                              onChange={(e) => setEditEmergencyContact({ ...editEmergencyContact, altPhone: e.target.value })}
                              placeholder="Backup phone"
                              className="bg-secondary border-primary/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowProfileEdit(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="gold"
                          className="flex-1"
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                        >
                          {isSavingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Settings Modal */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogContent className="max-w-lg bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Settings
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground text-sm">
                        Manage your notification preferences
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="pt-4">
                      <NotificationSettings />
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Survey Response Modal */}
                <Dialog open={showSurveyModal} onOpenChange={(open) => { setShowSurveyModal(open); if (!open) setSelectedSurvey(null); }}>
                  <DialogContent className="max-w-lg bg-background border-primary/20 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        {selectedSurvey?.title}
                      </DialogTitle>
                      <DialogDescription>{selectedSurvey?.description || 'Complete this survey'}</DialogDescription>
                    </DialogHeader>
                    
                    {selectedSurvey && (
                      <div className="space-y-6 pt-4">
                        {(selectedSurvey.questions || []).map((question, index) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-muted-foreground font-medium mt-1">Q{index + 1}</span>
                              {question.type === 'text' && <MessageSquare className="w-4 h-4 text-primary mt-1" />}
                              {question.type === 'rating' && <Star className="w-4 h-4 text-primary mt-1" />}
                              {question.type === 'multi' && <CheckSquare className="w-4 h-4 text-primary mt-1" />}
                              <p className="font-medium text-foreground">{question.prompt}</p>
                            </div>
                            
                            {/* Text answer */}
                            {question.type === 'text' && (
                              <Textarea
                                value={(surveyAnswers[question.id] as string) || ""}
                                onChange={(e) => setSurveyAnswers({ ...surveyAnswers, [question.id]: e.target.value })}
                                placeholder="Type your answer..."
                                className="bg-secondary border-primary/20"
                                rows={3}
                              />
                            )}
                            
                            {/* Rating (1-5) */}
                            {question.type === 'rating' && (
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setSurveyAnswers({ ...surveyAnswers, [question.id]: n })}
                                    className={cn(
                                      "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-semibold transition-all",
                                      surveyAnswers[question.id] === n
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "bg-secondary border-primary/20 hover:border-primary/50 text-foreground"
                                    )}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Multiple choice */}
                            {question.type === 'multi' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option, optIdx) => {
                                  const selected = Array.isArray(surveyAnswers[question.id])
                                    ? (surveyAnswers[question.id] as string[]).includes(option)
                                    : surveyAnswers[question.id] === option;
                                  
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => {
                                        const current = surveyAnswers[question.id];
                                        if (Array.isArray(current)) {
                                          // Multi-select mode
                                          if (current.includes(option)) {
                                            setSurveyAnswers({
                                              ...surveyAnswers,
                                              [question.id]: current.filter(o => o !== option)
                                            });
                                          } else {
                                            setSurveyAnswers({
                                              ...surveyAnswers,
                                              [question.id]: [...current, option]
                                            });
                                          }
                                        } else {
                                          // Single select or first selection
                                          setSurveyAnswers({ ...surveyAnswers, [question.id]: option });
                                        }
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                                        selected
                                          ? "bg-primary/20 border-primary"
                                          : "bg-secondary border-primary/20 hover:border-primary/50"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                                        selected ? "bg-primary border-primary" : "border-muted-foreground"
                                      )}>
                                        {selected && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                                      </div>
                                      <span className="text-sm text-foreground">{option}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setShowSurveyModal(false); setSelectedSurvey(null); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="gold"
                            className="flex-1"
                            onClick={handleSubmitSurvey}
                            disabled={isSubmittingSurvey}
                          >
                            {isSubmittingSurvey ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Survey
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
