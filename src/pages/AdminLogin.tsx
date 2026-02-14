import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { validateInvite, redeemInvite, requestPasswordReset, validateResetToken, resetPassword } from "@/lib/adminService";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validateEmail, validatePassword, checkRateLimit, LOGIN_RATE_LIMIT, sanitizeString } from "@/lib/validation";
import { Music2, Lock, Mail, AlertCircle, Loader2, User, Shield, CheckCircle, ArrowLeft, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

type View = "login" | "signup" | "forgot" | "reset";

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const resetToken = searchParams.get("reset");
  
  const [view, setView] = useState<View>(() => {
    if (inviteCode) return "signup";
    if (resetToken) return "reset";
    return "login";
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Validate invite code and reset token asynchronously
  const [invite, setInvite] = useState<any>(null);
  const [validReset, setValidReset] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(!!(inviteCode || resetToken));

  useEffect(() => {
    async function validate() {
      if (inviteCode) {
        const result = await validateInvite(inviteCode);
        setInvite(result);
      }
      if (resetToken) {
        const result = await validateResetToken(resetToken);
        setValidReset(result);
      }
      setValidationLoading(false);
    }
    validate();
  }, [inviteCode, resetToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0]);
      return;
    }

    // Check password is not empty
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    // Client-side rate limiting (additional layer)
    const rateLimitKey = `login_${emailValidation.sanitizedValue}`;
    const rateCheck = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
    if (!rateCheck.allowed) {
      const minutesRemaining = Math.ceil(rateCheck.resetIn / 60000);
      setError(`Too many login attempts. Please wait ${minutesRemaining} minute(s) before trying again.`);
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedEmail = sanitizeString(emailValidation.sanitizedValue || email);
      const result = await login(sanitizedEmail, password, rememberMe);
      if (result.success) {
        navigate("/admin");
      } else {
        // Show appropriate error message
        let errorMessage = result.error || "Invalid email or password";
        
        // Add remaining attempts info if available
        if (result.remainingAttempts !== undefined && result.remainingAttempts > 0) {
          errorMessage += ` (${result.remainingAttempts} attempts remaining)`;
        }
        
        // Show lockout info
        if (result.isLocked && result.lockoutUntil) {
          const lockoutTime = result.lockoutUntil.toLocaleTimeString();
          errorMessage = `Account temporarily locked due to too many failed attempts. Try again after ${lockoutTime}`;
        }
        
        setError(errorMessage);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!invite) {
      setError("Invalid or expired invite code");
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(". "));
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const user = await redeemInvite(inviteCode!, password);
      if (user) {
        setSignupSuccess(true);
        setTimeout(async () => {
          const result = await login(user.email, password, true);
          if (result.success) {
            navigate("/admin");
          }
        }, 2000);
      } else {
        setError("Failed to create account. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email);
      if (result) {
        const resetLink = `${window.location.origin}/admin/login?reset=${result.token}`;
        const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        if (isDev) {
          // Development: show link directly
          setSuccess(`DEV MODE: Reset link generated.\n\nReset Link: ${resetLink}`);
          navigator.clipboard.writeText(resetLink).catch(() => {});
        } else {
          // Production: send email via Netlify function
          try {
            const emailRes = await fetch("/.netlify/functions/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: [{ email, name: email }],
                subject: "Password Reset - Serenades of Praise Admin",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; padding: 30px; color: #fff;">
                    <h1 style="color: #d4a537;">Password Reset</h1>
                    <p>You requested a password reset for your admin account.</p>
                    <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #d4a537, #b8860b); color: #000; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">Reset Password</a>
                    </div>
                    <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                    <p style="color: #666; font-size: 11px; margin-top: 20px;">Serenades of Praise Choir</p>
                  </div>
                `,
              }),
            });

            if (emailRes.ok) {
              setSuccess("A password reset link has been sent to your email. Check your inbox.");
            } else {
              // Email failed, show link as fallback
              setSuccess(`Reset link generated but email failed to send.\n\nReset Link: ${resetLink}`);
              navigator.clipboard.writeText(resetLink).catch(() => {});
            }
          } catch {
            setSuccess(`Reset link generated but email failed to send.\n\nReset Link: ${resetLink}`);
            navigator.clipboard.writeText(resetLink).catch(() => {});
          }
        }
      } else {
        setError("No account found with this email address");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const success = await resetPassword(resetToken!, password);
      if (success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/admin/login");
          setView("login");
          setPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show signup success screen
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 text-foreground">
            Account Created!
          </h1>
          <p className="text-muted-foreground mb-4">
            Welcome to the admin team, {invite?.name}!
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show loading while validating invite/reset tokens
  if (validationLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating...</p>
        </div>
      </div>
    );
  }

  // Show invalid invite message
  if (inviteCode && !invite && view === "signup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 text-foreground">
            Invalid Invite
          </h1>
          <p className="text-muted-foreground mb-6">
            This invite link is invalid or has expired.
          </p>
          <Button variant="outline" onClick={() => { setView("login"); navigate("/admin/login"); }}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show invalid reset token message
  if (resetToken && !validReset && view === "reset") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2 text-foreground">
            Invalid Reset Link
          </h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Button variant="outline" onClick={() => { setView("forgot"); navigate("/admin/login"); }}>
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music2 className="w-7 h-7 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-display text-2xl font-bold mt-4 gold-text">
            Admin Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Serenades of Praise Choir
          </p>
        </div>

        {/* Card */}
        <div className="card-glass rounded-3xl p-8">
          {/* SIGNUP VIEW */}
          {view === "signup" && invite && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Welcome, {invite.name}!
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your password to complete setup
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    {invite.role === "super_admin" ? "Full Administrator" : "Admin"} Access
                  </span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={invite.email}
                      disabled
                      className="pl-10 bg-secondary border-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* LOGIN VIEW */}
          {view === "login" && (
            <>
              <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
                Sign In
              </h2>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === "forgot" && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Reset Password
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email to receive a reset link
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm whitespace-pre-wrap break-all">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </form>
            </>
          )}

          {/* RESET PASSWORD VIEW */}
          {view === "reset" && validReset && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Create New Password
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  for {validReset.email}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-secondary border-primary/20"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-primary/10 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Website
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Lock className="w-3 h-3 inline mr-1" />
          Secure admin access. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
