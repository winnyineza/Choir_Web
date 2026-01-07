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

type Step = "pin" | "form" | "verify" | "submit" | "success";

export default function MemberPortal() {
  useDocumentTitle("Member Portal");
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isPinError, setIsPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);

  // Verification
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // My requests
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [showMyRequests, setShowMyRequests] = useState(false);

  // PIN input handling
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setIsPinError(false);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits entered
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
      setStep("form");
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

  // Email validation
  const handleEmailCheck = () => {
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
      return false;
    }

    setMemberInfo(member);
    return true;
  };

  // Form submission
  const handleFormContinue = () => {
    if (!email || !startDate || !endDate || !reason) {
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

    if (!handleEmailCheck()) return;

    setStep("verify");
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
      setStep("submit");
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
    if (step === "submit" && resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [step, resendTimer]);

  // Verification code input handling
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
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
      // Create the leave request
      createLeaveRequest({
        memberId: memberInfo?.id || "",
        memberName: memberInfo?.name || "",
        memberEmail: email,
        startDate,
        endDate,
        reason,
      });

      setStep("success");
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

  // Load my requests
  useEffect(() => {
    if (email && showMyRequests) {
      setMyRequests(getLeaveRequestsByEmail(email));
    }
  }, [email, showMyRequests]);

  // Reset form
  const resetForm = () => {
    setEmail("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setMemberInfo(null);
    setVerificationCode(["", "", "", "", "", ""]);
    setDevCode(null);
    setStep("form");
    setShowMyRequests(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            {/* PIN Entry */}
            {step === "pin" && (
              <div className="card-glass rounded-3xl p-8 text-center">
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

            {/* Leave Request Form */}
            {step === "form" && (
              <div className="card-glass rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-display text-2xl font-bold">
                    Request <span className="gold-text">Leave</span>
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (email) {
                        setShowMyRequests(!showMyRequests);
                        if (!showMyRequests) {
                          setMyRequests(getLeaveRequestsByEmail(email));
                        }
                      } else {
                        toast({
                          title: "Enter your email first",
                          description: "We need your email to find your requests.",
                        });
                      }
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    My Requests
                  </Button>
                </div>

                {showMyRequests ? (
                  <div className="space-y-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMyRequests(false)}
                      className="mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Form
                    </Button>

                    {myRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No leave requests found for this email.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myRequests.map((request) => (
                          <div
                            key={request.id}
                            className="p-4 rounded-xl bg-secondary/50 border border-primary/10"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-foreground">
                                  {new Date(request.startDate).toLocaleDateString()} -{" "}
                                  {new Date(request.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.reason}
                                </p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                            {request.adminNotes && (
                              <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-secondary">
                                Admin note: {request.adminNotes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-secondary border-primary/20"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use the same email registered with the choir
                      </p>
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
                )}
              </div>
            )}

            {/* Email Verification Step */}
            {step === "verify" && (
              <div className="card-glass rounded-3xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">
                  Verify Your <span className="gold-text">Identity</span>
                </h1>
                <p className="text-muted-foreground mb-6">
                  We need to confirm this is really you.
                </p>

                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    A verification code will be sent to:
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                  {memberInfo && (
                    <p className="text-xs text-primary mt-1">
                      Verified as: {memberInfo.name}
                    </p>
                  )}
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
                  onClick={() => setStep("form")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Form
                </Button>
              </div>
            )}

            {/* Enter Code & Submit */}
            {step === "submit" && (
              <div className="card-glass rounded-3xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="font-display text-2xl font-bold mb-2">
                    Code <span className="gold-text">Sent!</span>
                  </h1>
                  <p className="text-muted-foreground">
                    Enter the 6-digit code sent to {email}
                  </p>
                </div>

                {/* Development mode: Show code */}
                {devCode && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6 text-center">
                    <p className="text-xs text-yellow-400 mb-1">
                      🔧 Development Mode - Code:
                    </p>
                    <p className="font-mono text-lg font-bold text-yellow-400">
                      {devCode}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Resend code in {resendTimer}s
                    </p>
                  )}
                </div>

                {/* Request Summary */}
                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    Leave Request Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member:</span>
                      <span className="text-foreground">{memberInfo?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="text-foreground">
                        {new Date(startDate).toLocaleDateString()} -{" "}
                        {new Date(endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason:</span>
                      <span className="text-foreground text-right max-w-[200px] truncate">
                        {reason}
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
                  Verify & Submit Request
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("verify")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}

            {/* Success */}
            {step === "success" && (
              <div className="card-glass rounded-3xl p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">
                  Request <span className="gold-text">Submitted!</span>
                </h1>
                <p className="text-muted-foreground mb-8">
                  Your leave request has been sent to the choir admins for review.
                </p>

                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 mb-6 text-left">
                  <h3 className="font-semibold text-foreground mb-3">
                    Request Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member:</span>
                      <span className="text-foreground">{memberInfo?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="text-foreground">
                        {new Date(startDate).toLocaleDateString()} -{" "}
                        {new Date(endDate).toLocaleDateString()}
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

                <p className="text-sm text-muted-foreground mb-6">
                  You'll be notified when your request is approved or if more
                  information is needed.
                </p>

                <div className="flex gap-3">
                  <Button variant="gold-outline" className="flex-1" onClick={resetForm}>
                    Submit Another
                  </Button>
                  <Button variant="gold" className="flex-1" asChild>
                    <a href="/">Back to Home</a>
                  </Button>
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

