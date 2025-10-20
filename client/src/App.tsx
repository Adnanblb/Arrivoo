import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import VerifyOtp from "@/pages/VerifyOtp";
import AdminPortal from "@/pages/AdminPortal";
import HotelDashboard from "@/pages/HotelDashboard";
import HotelSettings from "@/pages/HotelSettings";
import Profile from "@/pages/Profile";
import GuestCheckin from "@/pages/GuestCheckin";
import NewCheckin from "@/pages/NewCheckin";
import ContractSearch from "@/pages/ContractSearch";
import DeviceRegistration from "@/pages/DeviceRegistration";
import TabletSignature from "@/pages/TabletSignature";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/verify-otp" component={VerifyOtp} />
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPortal />
        </ProtectedRoute>
      </Route>
      <Route path="/hotel">
        <ProtectedRoute>
          <HotelDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <HotelSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/new-checkin">
        <ProtectedRoute>
          <NewCheckin />
        </ProtectedRoute>
      </Route>
      <Route path="/contracts">
        <ProtectedRoute>
          <ContractSearch />
        </ProtectedRoute>
      </Route>
      <Route path="/checkin/:reservationId?" component={GuestCheckin} />
      <Route path="/guest-checkin" component={GuestCheckin} />
      <Route path="/tablet/register" component={DeviceRegistration} />
      <Route path="/tablet/signature" component={TabletSignature} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
