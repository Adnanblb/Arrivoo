import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  hotelName: string;
  hotelId: string;
  role: string;
  logoUrl: string | null;
  twoFactorEnabled: boolean;
}

interface Hotel {
  id: string;
  name: string;
  logoUrl: string | null;
  pmsType: string;
}

interface AuthContextType {
  user: User | null;
  hotel: Hotel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  // Query to get current user
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Handle 401 as unauthenticated state (not an error)
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      // Don't throw on 401 - treat as unauthenticated
      if (response.status === 401) {
        return { authenticated: false };
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      return await response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return await response.json();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
      // Redirect to login
      setLocation("/");
    },
  });

  const user = (data as any)?.authenticated ? (data as any).user : null;
  const hotel = (data as any)?.authenticated ? (data as any).hotel : null;
  const isAuthenticated = Boolean((data as any)?.authenticated);

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hotel,
        isAuthenticated,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
