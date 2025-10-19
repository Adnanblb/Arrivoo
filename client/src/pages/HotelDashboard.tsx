import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrivalsTable } from "@/components/ArrivalsTable";
import { GuestCard } from "@/components/GuestCard";
import { AddTabletGuide } from "@/components/AddTabletGuide";
import { SendToTabletDialog } from "@/components/SendToTabletDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, LogOut, RefreshCw, Download, Mail, Phone, MapPin, Calendar, Plus, Search, Settings, FileText } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { PmsConfiguration, RegistrationContract } from "@shared/schema";

// Grand Plaza Hotel ID from Supabase database
const MOCK_HOTEL_ID = "f39d5d3b-a803-42c6-a266-e84fbbad98dd"; // Grand Plaza Hotel

// Helper function to format PMS type names
function formatPmsName(pmsType: string): string {
  const pmsNames: Record<string, string> = {
    opera_cloud: "Opera Cloud",
    opera: "Opera Cloud",
    protel: "Protel",
    cloudbeds: "Cloudbeds",
  };
  return pmsNames[pmsType.toLowerCase()] || pmsType;
}

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
  const [selectedContract, setSelectedContract] = useState<RegistrationContract | null>(null);
  const [sendToTabletGuest, setSendToTabletGuest] = useState<typeof mockArrivals[0] | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Set hotelId in localStorage for Settings page to access
  useEffect(() => {
    localStorage.setItem("hotelId", MOCK_HOTEL_ID);
  }, []);

  // Fetch PMS configuration for this hotel
  const { data: pmsConfig } = useQuery<PmsConfiguration>({
    queryKey: ['/api/pms-config', MOCK_HOTEL_ID],
  });

  // Fetch hotel details for contract terms
  const { data: hotel } = useQuery({
    queryKey: ["/api/hotels", MOCK_HOTEL_ID],
    queryFn: async () => {
      const response = await fetch(`/api/hotels/${MOCK_HOTEL_ID}`);
      if (!response.ok) throw new Error("Failed to fetch hotel");
      return response.json();
    },
  });

  // Fetch real arrivals from API
  const { data: apiArrivals = [], refetch: refetchArrivals } = useQuery<any[]>({
    queryKey: ['/api/arrivals', MOCK_HOTEL_ID],
  });

  // WebSocket connection for real-time updates
  useWebSocket({
    onMessage: (message) => {
      if (message.type === "contract_status_update" && message.payload?.status === "signed") {
        // Refetch arrivals to get updated check-in status
        refetchArrivals();
        
        // Auto-switch to completed tab
        setFilter("completed");
        
        // Show success toast
        toast({
          title: "Check-in Completed",
          description: "Guest has successfully completed their check-in",
        });
      }
    },
  });

  // Map API arrivals to the format expected by ArrivalsTable
  const arrivals = apiArrivals.map(arrival => ({
    id: arrival.id, // This is the UUID from database
    guestName: arrival.guestName || arrival.guest_name,
    reservationNumber: arrival.reservationNumber || arrival.reservation_number,
    checkInDate: arrival.checkInDate || arrival.check_in_date,
    checkOutDate: arrival.checkOutDate || arrival.check_out_date,
    roomNumber: arrival.roomNumber || arrival.room_number,
    status: arrival.hasCheckedIn || arrival.has_checked_in ? "completed" as const : "pending" as const,
  }));

  const filteredArrivals = arrivals.filter((arrival) => {
    if (filter === "all") return true;
    return arrival.status === filter;
  });

  const handleSendToTablet = async (id: string) => {
    const arrival = arrivals.find((a) => a.id === id);
    if (!arrival) return;

    // Check if arrival already has a contract in the database
    const arrivalData = apiArrivals.find(a => a.id === id);
    
    try {
      let contractId = arrivalData?.contractId || arrivalData?.contract_id;
      
      if (!contractId) {
        // Create a contract from the arrival data
        const contractData = {
          hotelId: MOCK_HOTEL_ID,
          guestName: arrivalData.guestName || arrivalData.guest_name,
          email: arrivalData.email || "",
          phone: arrivalData.phoneNumber || arrivalData.phone_number || "",
          idNumber: "",
          reservationNumber: arrivalData.reservationNumber || arrivalData.reservation_number,
          confirmationNumber: arrivalData.reservationNumber || arrivalData.reservation_number,
          roomNumber: arrivalData.roomNumber || arrivalData.room_number,
          roomType: arrivalData.roomType || arrivalData.room_type || "",
          arrivalDate: arrivalData.checkInDate || arrivalData.check_in_date,
          departureDate: arrivalData.checkOutDate || arrivalData.check_out_date,
          numberOfNights: arrivalData.numberOfNights || arrivalData.number_of_nights || 1,
          status: "pending",
        };
        
        const response = await apiRequest("POST", "/api/contracts", contractData);
        const contract = await response.json();
        contractId = contract.id;
      }
      
      // Pass the arrival data with the contract ID
      setSendToTabletGuest({
        ...arrival,
        id: contractId, // Use contract ID, not arrival ID!
      });
    } catch (error) {
      console.error("Failed to create contract:", error);
      toast({
        title: "Error",
        description: "Failed to prepare contract for tablet",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (id: string) => {
    const guest = arrivals.find((a) => a.id === id);
    if (!guest) return;

    // If guest is completed, fetch the full contract
    if (guest.status === "completed") {
      try {
        // Find the arrival data to get the contract ID
        const arrivalData = apiArrivals.find(a => a.id === id);
        const contractId = arrivalData?.contractId || arrivalData?.contract_id;
        
        if (contractId) {
          // Fetch the full contract
          const response = await fetch(`/api/contracts/${contractId}`);
          if (response.ok) {
            const contract = await response.json();
            setSelectedContract(contract);
            return;
          } else {
            toast({
              variant: "destructive",
              title: "Failed to Load Contract",
              description: "Unable to fetch contract details. Showing basic information instead.",
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Contract Not Found",
            description: "This arrival doesn't have an associated contract yet.",
          });
        }
      } catch (error) {
        console.error("Failed to fetch contract:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while loading the contract.",
        });
      }
    }
    
    // Fallback to showing basic guest info for pending or on error
    setSelectedGuest(guest);
  };

  const handleRefresh = () => {
    const pmsName = pmsConfig ? formatPmsName(pmsConfig.pmsType) : "PMS";
    refetchArrivals();
    toast({
      title: "Refreshing Data",
      description: `Syncing with ${pmsName}...`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Report",
      description: "Preparing daily arrivals report for download...",
    });
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return await response.json();
    },
    onSuccess: async () => {
      // Invalidate auth cache to clear user state
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out",
      });
      setTimeout(() => setLocation("/"), 1000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Failed to log out",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
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
                data-testid="button-settings"
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/settings")}
              >
                <Settings className="h-5 w-5" />
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
              <AddTabletGuide />
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

      {/* Full Contract Details Dialog (for completed check-ins) */}
      <Dialog open={!!selectedContract} onOpenChange={(open) => { if (!open) setSelectedContract(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-contract-details">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Registration Contract
            </DialogTitle>
            <DialogDescription>
              Completed check-in for {selectedContract?.guestName}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Guest Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Guest Name</p>
                    <p className="font-medium" data-testid="text-contract-guest-name">{selectedContract?.guestName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium" data-testid="text-contract-email">{selectedContract?.email || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium" data-testid="text-contract-phone">{selectedContract?.phone || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ID Number</p>
                    <p className="font-medium">{selectedContract?.idNumber || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Reservation Number</p>
                    <p className="font-medium font-mono" data-testid="text-contract-reservation">{selectedContract?.reservationNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Room Number</p>
                    <p className="font-medium">{selectedContract?.roomNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Check-in Date</p>
                    <p className="font-medium">{selectedContract?.arrivalDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Check-out Date</p>
                    <p className="font-medium">{selectedContract?.departureDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Number of Nights</p>
                    <p className="font-medium">{selectedContract?.numberOfNights}</p>
                  </div>
                  {selectedContract?.roomType && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p className="font-medium">{selectedContract.roomType}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Terms */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Terms & Conditions</h3>
                <div className="bg-muted/50 rounded-md p-4 border">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" data-testid="text-contract-terms">
                    {hotel?.contractTerms || "REGISTRATION AGREEMENT\n\nBy signing this registration form, the guest acknowledges and agrees to the terms and conditions of the hotel."}
                  </pre>
                </div>
              </div>

              {/* Digital Signature */}
              {selectedContract?.signatureDataUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Digital Signature</h3>
                  <div className="bg-muted/50 rounded-md p-4 border">
                    <img
                      src={selectedContract.signatureDataUrl}
                      alt="Guest Signature"
                      className="max-w-md mx-auto border rounded bg-white"
                      data-testid="img-contract-signature"
                    />
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Signed on {selectedContract.registeredAt ? new Date(selectedContract.registeredAt).toLocaleString() : "Unknown date"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              data-testid="button-close-contract"
              variant="outline" 
              onClick={() => setSelectedContract(null)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Tablet Dialog */}
      {sendToTabletGuest && (
        <SendToTabletDialog
          isOpen={!!sendToTabletGuest}
          onClose={() => setSendToTabletGuest(null)}
          contractData={sendToTabletGuest}
          hotelId={MOCK_HOTEL_ID}
        />
      )}
    </div>
  );
}
