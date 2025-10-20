import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: async (data) => {
      // OTP system disabled - direct login
      if (data.success && data.user) {
        // Invalidate auth query to refetch user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });
        
        // Redirect based on user role
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/hotel");
        }
      } else if (data.requiresOtp) {
        // OTP flow (currently disabled but kept for future reactivation)
        setLocation(`/verify-otp?userId=${data.userId}&type=login&requires2FA=${data.requires2FA || false}`);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  // Temporary dev bypass - skip login
  const handleSkipLogin = () => {
    // Just navigate to hotel dashboard without authentication
    setLocation("/hotel");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <div className="text-4xl font-bold text-primary" data-testid="text-arrivo-logo">Arrivo</div>
            <p className="text-sm text-muted-foreground mt-1">Hotel Check-In Platform</p>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-login-title">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to your hotel account to manage arrivals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="hotel@example.com"
                        disabled={loginMutation.isPending}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={loginMutation.isPending}
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => setLocation("/forgot-password")}
            data-testid="link-forgot-password"
          >
            Forgot Password?
          </Button>
          {/* Temporary dev bypass */}
          <Button
            variant="outline"
            className="text-sm w-full"
            onClick={handleSkipLogin}
            data-testid="button-skip-login"
          >
            🚀 Skip Login (Dev Mode)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
