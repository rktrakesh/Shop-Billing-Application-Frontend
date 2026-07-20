import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function IpOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Data passed from LoginPage when backend returns IP_VERIFICATION_REQUIRED
  const state = location.state as {
    username: string;
    password: string;
    ipAddress: string;
  } | null;

  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);

  if (!state?.username) {
    // Landed here without context — go back to login
    navigate("/login", { replace: true });
    return null;
  }

  const handleVerify = async () => {
    if (!emailOtp.trim() || emailOtp.length < 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify the OTP — get session token
      const verifyRes = await authService.verifyIpOtp({
        username: state.username,
        emailOtp: emailOtp.trim(),
      });
      const { sessionToken } = verifyRes.data.data;

      // Step 2: Re-attempt login with the session token
      const loginRes = await authService.login({
        username: state.username,
        password: state.password,
        sessionToken,
      });
      const auth = loginRes.data.data;

      login({
        token: auth.token,
        refreshToken: auth.refreshToken,
        username: auth.username,
        role: auth.role,
        fullName: auth.fullName,
      });

      toast.success(`Welcome back, ${auth.fullName || auth.username}!`);
      navigate(auth.role === "ROLE_USER" ? "/billing" : "/dashboard", { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      // Re-trigger login to send a new OTP
      await authService
        .login({
          username: state.username,
          password: state.password,
        })
        .catch(() => {
          // Expected — will return 403 IP_VERIFICATION_REQUIRED and send a new OTP
        });
      toast.success("A new OTP has been sent to the admin email");
      setEmailOtp("");
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-8 shadow-xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full bg-warning/10 border border-warning/20
                            flex items-center justify-center"
            >
              <ShieldAlert className="h-8 w-8 text-warning" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">Verify Your Location</h1>
          <p className="text-sm text-text-muted text-center mb-6">
            You're logging in from an unrecognized IP address.
            <br />
            An OTP has been sent to the admin email.
          </p>

          {/* IP info */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-warning">
              <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                Login attempt from: <span className="font-mono font-semibold">{state.ipAddress}</span>
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1 ml-5">
              Logging in as: <span className="font-medium text-text-primary">{state.username}</span>
            </p>
          </div>

          {/* OTP instructions */}
          <div
            className="flex items-start gap-3 mb-6 p-3 bg-primary/5 border
                          border-primary/20 rounded-xl"
          >
            <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              Ask the shop admin to check their email at <span className="font-medium text-text-primary">tri***********h**2@****mail.in</span> and share the 6-digit OTP with you.
            </p>
          </div>

          {/* OTP input */}
          <div className="space-y-4">
            <Input label="Enter 6-digit OTP" placeholder="000000" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && handleVerify()} className="text-center text-xl font-mono tracking-widest" maxLength={6} autoFocus />

            <Button className="w-full" size="lg" onClick={handleVerify} disabled={emailOtp.length < 6 || loading} loading={loading}>
              Verify & Login
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button onClick={() => navigate("/login")} className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </button>

              <button onClick={handleResend} disabled={loading} className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                Resend OTP
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-text-muted text-center mt-6">
            OTP expires in <span className="font-medium">15 minutes</span>. Contact the admin if you need help.
          </p>
        </div>
      </div>
    </div>
  );
}
