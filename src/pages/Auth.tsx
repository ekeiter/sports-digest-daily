import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface AuthFormData {
  email: string;
  password: string;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues
  } = useForm<AuthFormData>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session && event === 'SIGNED_IN') {
          navigate('/splash');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        navigate('/splash');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;

        setConfirmationEmail(data.email);
        setShowConfirmation(true);
        reset();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        const needsConfirm = !user?.email_confirmed_at;
        
        if (!needsConfirm) {
          await supabase.rpc("ensure_my_subscriber");
        }

        toast({
          title: "Success",
          description: "Signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: confirmationEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) throw error;

      await supabase.rpc("ensure_my_subscriber");
      
      toast({
        title: "Email Confirmed",
        description: "Your email has been successfully verified.",
      });
      
      navigate("/splash");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Check your email for the password reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {showForgotPassword ? (
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : showConfirmation ? (
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent you a confirmation email with a 6-digit code. Enter it below to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button
              onClick={handleVerifyOTP}
              className="w-full"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirmation(false);
                setIsSignUp(false);
                setOtpCode("");
              }}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Create an account" : "Sign in to Sports Digest"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp 
                ? "Enter your email and password to create your account"
                : "Enter your email and password to sign in"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Please wait..." : (isSignUp ? "Sign up" : "Sign in")}
              </Button>

              {!isSignUp && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  reset();
                }}
                className="text-sm"
              >
                {isSignUp 
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
