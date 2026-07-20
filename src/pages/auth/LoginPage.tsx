import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shirt, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authService.login({
        username: data.username,
        password: data.password,
      });
      const auth = res.data.data;

      login({
        token: auth.token,
        refreshToken: auth.refreshToken,
        username: auth.username,
        role: auth.role,
        fullName: auth.fullName,
      });

      toast.success(`Welcome back, ${auth.fullName || auth.username}!`);

      if (auth.role === "ROLE_USER") {
        navigate("/billing");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      // Check if backend returned IP_VERIFICATION_REQUIRED
      const errorData = err?.response?.data;
      if (errorData?.error === "IP_VERIFICATION_REQUIRED") {
        // Navigate to OTP verification screen, passing credentials and IP
        navigate("/verify-ip", {
          state: {
            username: data.username,
            password: data.password,
            ipAddress: errorData.ipAddress || "Unknown",
          },
        });
        return;
      }

      const message = err?.response?.data?.message || "Invalid username or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16
                          rounded-2xl bg-primary/10 border border-primary/20 mb-4"
          >
            <Shirt className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">RKT Apparels</h1>
          <p className="text-sm text-text-muted mt-1">Billing Management System</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Username" placeholder="Enter your username" error={errors.username?.message} autoComplete="username" {...register("username")} />

            <div className="relative">
              <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" error={errors.password?.message} autoComplete="current-password" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-text-muted hover:text-text-primary" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="text-xs text-text-muted text-center mt-6">Having trouble? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
}
