import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import HotelDashboard from "@/pages/HotelDashboard";
import GuestCheckin from "@/pages/GuestCheckin";
import NewCheckin from "@/pages/NewCheckin";
import ContractSearch from "@/pages/ContractSearch";
import DeviceRegistration from "@/pages/DeviceRegistration";
import TabletSignature from "@/pages/TabletSignature";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/hotel" component={HotelDashboard} />
      <Route path="/new-checkin" component={NewCheckin} />
      <Route path="/contracts" component={ContractSearch} />
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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
