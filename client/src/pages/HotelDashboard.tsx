import { useState } from "react";
import { ArrivalsTable } from "@/components/ArrivalsTable";
import { GuestCard } from "@/components/GuestCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, LogOut, RefreshCw, Download, Mail, Phone, MapPin, Calendar, Plus, Search } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";

// TODO: Remove mock data when implementing real backend
const mockArrivals = [
  {
    id: "1",
    guestName: "John Smith",
    reservationNumber: "RES-2024-001",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 15, 2025",
    roomNumber: "Suite 302",
    status: "completed" as const,
  },
  {
    id: "2",
    guestName: "Sarah Johnson",
    reservationNumber: "RES-2024-002",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 13, 2025",
    roomNumber: "Room 215",
    status: "pending" as const,
  },
  {
    id: "3",
    guestName: "Michael Chen",
    reservationNumber: "RES-2024-003",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 18, 2025",
    roomNumber: "Suite 401",
    status: "pending" as const,
  },
  {
    id: "4",
    guestName: "Emily Davis",
    reservationNumber: "RES-2024-004",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 14, 2025",
    roomNumber: "Room 118",
    status: "completed" as const,
  },
  {
    id: "5",
    guestName: "Robert Wilson",
    reservationNumber: "RES-2024-005",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 16, 2025",
    roomNumber: "Suite 205",
    status: "pending" as const,
  },
];

export default function HotelDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedGuest, setSelectedGuest] = useState<typeof mockArrivals[0] | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const filteredArrivals = mockArrivals.filter((arrival) => {
    if (filter === "all") return true;
    return arrival.status === filter;
  });

  const handleSendToTablet = (id: string) => {
    const guest = mockArrivals.find((a) => a.id === id);
    console.log("Send to tablet:", id);
    toast({
      title: "Sent to Tablet",
      description: `Check-in form sent to tablet for ${guest?.guestName}`,
    });
  };

  const handleViewDetails = (id: string) => {
    const guest = mockArrivals.find((a) => a.id === id);
    console.log("View details:", id);
    if (guest) {
      setSelectedGuest(guest);
    }
  };

  const handleRefresh = () => {
    console.log("Refresh arrivals from Opera Cloud");
    toast({
      title: "Refreshing Data",
      description: "Syncing with Opera Cloud PMS...",
    });
  };

  const handleExport = () => {
    console.log("Export daily report");
    toast({
      title: "Exporting Report",
      description: "Preparing daily arrivals report for download...",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Signed Out",
      description: "You have been successfully logged out",
    });
    setTimeout(() => setLocation("/"), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-hotel-name">
                Grand Plaza Hotel
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Today's Arrivals - Oct 11, 2025
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="button-refresh"
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                data-testid="button-toggle-theme"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button
                data-testid="button-logout"
                variant="ghost"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filter Tabs & Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger data-testid="tab-all" value="all">
                  All ({mockArrivals.length})
                </TabsTrigger>
                <TabsTrigger data-testid="tab-pending" value="pending">
                  Pending ({mockArrivals.filter((a) => a.status === "pending").length})
                </TabsTrigger>
                <TabsTrigger data-testid="tab-completed" value="completed">
                  Completed ({mockArrivals.filter((a) => a.status === "completed").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                data-testid="button-new-checkin"
                onClick={() => setLocation("/new-checkin")}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Plus className="h-4 w-4" />
                New Check-in
              </Button>
              <Button
                data-testid="button-search-contracts"
                variant="outline"
                onClick={() => setLocation("/contracts")}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Search className="h-4 w-4" />
                Search Contracts
              </Button>
              <Button
                data-testid="button-export"
                variant="outline"
                onClick={handleExport}
                className="gap-2 hidden md:flex"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <ArrivalsTable
              arrivals={filteredArrivals}
              onSendToTablet={handleSendToTablet}
              onViewDetails={handleViewDetails}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredArrivals.map((arrival) => (
              <GuestCard
                key={arrival.id}
                {...arrival}
                onSendToTablet={handleSendToTablet}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {filteredArrivals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No {filter !== "all" ? filter : ""} arrivals for today
            </div>
          )}
        </div>
      </main>

      {/* Guest Details Dialog */}
      <Dialog open={!!selectedGuest} onOpenChange={(open) => !open && setSelectedGuest(null)}>
        <DialogContent data-testid="dialog-guest-details">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGuest?.guestName}</DialogTitle>
            <DialogDescription>Reservation Details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Reservation Number</p>
                  <p className="font-medium" data-testid="text-reservation-number">
                    {selectedGuest?.reservationNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Room Number</p>
                  <p className="font-medium" data-testid="text-room-number">
                    {selectedGuest?.roomNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in Date</p>
                  <p className="font-medium" data-testid="text-checkin-date">
                    {selectedGuest?.checkInDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out Date</p>
                  <p className="font-medium" data-testid="text-checkout-date">
                    {selectedGuest?.checkOutDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium" data-testid="text-guest-email">
                    {(selectedGuest?.guestName?.toLowerCase()?.replace(' ', '.')) ?? 'guest'}@email.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium" data-testid="text-guest-phone">
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                data-testid="button-send-to-tablet-dialog"
                onClick={() => {
                  if (selectedGuest) {
                    handleSendToTablet(selectedGuest.id);
                    setSelectedGuest(null);
                  }
                }}
                className="flex-1"
              >
                Send to Tablet
              </Button>
              <Button 
                data-testid="button-close-dialog"
                variant="outline" 
                onClick={() => setSelectedGuest(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
