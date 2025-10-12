import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw } from "lucide-react";

const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

type OtpForm = z.infer<typeof otpSchema>;

export default function VerifyOtp() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [timer, setTimer] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  // Get userId and type from URL params
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const type = params.get('type') || 'login';
  const requires2FA = params.get('requires2FA') === 'true';

  const form = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        userId,
        code: data.code,
        type,
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      if (data.requires2FA) {
        // Navigate to 2FA verification
        setLocation(`/verify-otp?userId=${userId}&type=two_factor&requires2FA=false`);
        toast({
          title: "Two-Factor Authentication Required",
          description: "Please check your email for the 2FA code",
        });
        setTimer(600); // 10 minutes for 2FA
        setCanResend(false);
        form.reset();
      } else if (data.user) {
        // Login successful - invalidate auth cache to refetch user
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.hotelName}!`,
        });
        setLocation("/hotel");
      } else {
        // Password reset or other flow completed
        toast({
          title: "Verification Successful",
          description: "OTP verified successfully",
        });
        if (type === 'password_reset') {
          setLocation(`/reset-password?userId=${userId}&code=${data.code}`);
        }
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP code",
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", { userId, type });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Resent",
        description: "A new code has been sent to your email",
      });
      setTimer(type === 'two_factor' ? 600 : 900);
      setCanResend(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Resend Failed",
        description: error.message || "Failed to resend OTP",
      });
    },
  });

  const onSubmit = (data: OtpForm) => {
    verifyOtpMutation.mutate(data);
  };

  const handleResend = () => {
    resendOtpMutation.mutate();
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>No user ID provided. Please try logging in again.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation("/")} data-testid="button-back-to-login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = type === 'two_factor' ? 'Two-Factor Authentication' : 
                type === 'password_reset' ? 'Verify Reset Code' : 
                'Verify Your Email';
  
  const description = type === 'two_factor' 
    ? 'Enter the 6-digit code sent to your email for two-factor authentication' 
    : type === 'password_reset'
    ? 'Enter the 6-digit code sent to your email to reset your password'
    : 'We sent a 6-digit code to your email. Enter it below to complete login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold" data-testid="text-verify-title">
            {title}
          </CardTitle>
          <CardDescription data-testid="text-verify-description">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        disabled={verifyOtpMutation.isPending}
                        data-testid="input-otp-code"
                        className="text-center text-2xl tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="text-center text-sm text-muted-foreground" data-testid="text-timer">
                {timer > 0 ? (
                  <>Code expires in <span className="font-semibold">{formatTime(timer)}</span></>
                ) : (
                  <span className="text-destructive">Code expired</span>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtpMutation.isPending || timer === 0}
                data-testid="button-verify"
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
              </Button>
            </form>
          </Form>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || resendOtpMutation.isPending}
              data-testid="button-resend-otp"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
            </Button>
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
