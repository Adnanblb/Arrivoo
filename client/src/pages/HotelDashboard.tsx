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
import { Moon, Sun, LogOut, RefreshCw, Download, Mail, Phone, MapPin, Calendar, Plus, Search, Settings, FileText, Edit } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { PmsConfiguration, RegistrationContract } from "@shared/schema";

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
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedGuest, setSelectedGuest] = useState<typeof mockArrivals[0] | null>(null);
  const [selectedContract, setSelectedContract] = useState<RegistrationContract | null>(null);
  const [sendToTabletGuest, setSendToTabletGuest] = useState<typeof mockArrivals[0] | null>(null);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [shouldAutoSendToTablet, setShouldAutoSendToTablet] = useState(false);
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [editGuestData, setEditGuestData] = useState({
    roomNumber: "",
    numberOfNights: "",
  });
  const [manualCheckInData, setManualCheckInData] = useState({
    guestName: "",
    roomNumber: "",
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: "",
    numberOfNights: "",
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Use authenticated user's hotel ID
  const hotelId = user?.hotelId || "";
  const hotelName = user?.hotelName || "Hotel";
  const logoUrl = user?.logoUrl;

  // Set hotelId in localStorage for Settings page to access
  useEffect(() => {
    if (hotelId) {
      localStorage.setItem("hotelId", hotelId);
    }
  }, [hotelId]);

  // Fetch PMS configuration for this hotel
  const { data: pmsConfig } = useQuery<PmsConfiguration>({
    queryKey: ['/api/pms-config', hotelId],
    enabled: !!hotelId,
  });

  // Fetch hotel details for contract terms
  const { data: hotel } = useQuery({
    queryKey: ["/api/hotels", hotelId],
    enabled: !!hotelId,
    queryFn: async () => {
      const response = await fetch(`/api/hotels/${hotelId}`);
      if (!response.ok) throw new Error("Failed to fetch hotel");
      return response.json();
    },
  });

  // Fetch real arrivals from API (limited to 8)
  const { data: apiArrivals = [], refetch: refetchArrivals } = useQuery<any[]>({
    queryKey: ['/api/arrivals', hotelId],
    enabled: !!hotelId,
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
          hotelId: hotelId,
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

  const deleteArrivalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/arrivals/${id}`, {});
      return await response.json();
    },
    onSuccess: async () => {
      // Invalidate arrivals cache to refresh the dashboard
      await queryClient.invalidateQueries({ queryKey: ['/api/arrivals', hotelId] });
      toast({
        title: "Deleted",
        description: "Reservation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete reservation",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this reservation?")) {
      deleteArrivalMutation.mutate(id);
    }
  };

  const updateArrivalMutation = useMutation({
    mutationFn: async (data: { id: string; roomNumber: string; numberOfNights: string }) => {
      const response = await apiRequest("PUT", `/api/arrivals/${data.id}`, {
        roomNumber: data.roomNumber,
        numberOfNights: parseInt(data.numberOfNights),
      });
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/arrivals', hotelId] });
      toast({
        title: "Updated",
        description: "Reservation updated successfully",
      });
      setIsEditingGuest(false);
      setSelectedGuest(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update reservation",
      });
    },
  });

  const handleEditGuest = () => {
    if (selectedGuest) {
      // Calculate current number of nights
      const checkIn = new Date(selectedGuest.checkInDate);
      const checkOut = new Date(selectedGuest.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      setEditGuestData({
        roomNumber: selectedGuest.roomNumber,
        numberOfNights: nights.toString(),
      });
      setIsEditingGuest(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedGuest && editGuestData.roomNumber && editGuestData.numberOfNights) {
      updateArrivalMutation.mutate({
        id: selectedGuest.id,
        roomNumber: editGuestData.roomNumber,
        numberOfNights: editGuestData.numberOfNights,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGuest(false);
    setEditGuestData({
      roomNumber: "",
      numberOfNights: "",
    });
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

  const createManualCheckInMutation = useMutation({
    mutationFn: async (data: typeof manualCheckInData) => {
      const response = await apiRequest("POST", "/api/contracts/manual", {
        hotelId: hotelId,
        guestName: data.guestName,
        roomNumber: data.roomNumber,
        arrivalDate: data.checkInDate,
        departureDate: data.checkOutDate || undefined,
        numberOfNights: data.numberOfNights ? parseInt(data.numberOfNights) : undefined,
      });
      return await response.json();
    },
    onSuccess: async (contract) => {
      // Invalidate arrivals cache to refresh the dashboard
      await queryClient.invalidateQueries({ queryKey: ['/api/arrivals', hotelId] });
      
      const message = shouldAutoSendToTablet 
        ? "Manual check-in created successfully. Send it to a tablet now."
        : "Manual check-in saved successfully";
      
      toast({
        title: "Check-In Created",
        description: message,
      });
      setShowManualCheckIn(false);
      // Reset form
      setManualCheckInData({
        guestName: "",
        roomNumber: "",
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: "",
        numberOfNights: "",
      });
      
      // Conditionally open send to tablet dialog
      if (shouldAutoSendToTablet) {
        setSendToTabletGuest({
          id: contract.id,
          guestName: contract.guestName,
          reservationNumber: contract.reservationNumber,
          roomNumber: contract.roomNumber,
          checkInDate: contract.arrivalDate,
          checkOutDate: contract.departureDate,
          status: "pending" as const,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Create Check-In",
        description: error.message || "Could not create manual check-in",
      });
    },
  });

  const handleManualCheckInSubmit = () => {
    // Validate required fields
    if (!manualCheckInData.guestName || !manualCheckInData.roomNumber) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in guest name and room number",
      });
      return;
    }

    // Validate that either checkOutDate or numberOfNights is provided
    if (!manualCheckInData.checkOutDate && !manualCheckInData.numberOfNights) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide either check-out date or number of nights",
      });
      return;
    }

    createManualCheckInMutation.mutate(manualCheckInData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Hotel Logo */}
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={hotelName}
                  className="h-12 w-auto object-contain"
                  data-testid="img-hotel-logo"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-hotel-name">
                  {hotelName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Today's Arrivals - {format(new Date(), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="button-new-checkin"
                onClick={() => setShowManualCheckIn(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Check-In
              </Button>
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
              onDelete={handleDelete}
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
                onDelete={handleDelete}
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
      <Dialog open={!!selectedGuest} onOpenChange={(open) => {
        if (!open) {
          setSelectedGuest(null);
          setIsEditingGuest(false);
        }
      }}>
        <DialogContent data-testid="dialog-guest-details">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedGuest?.guestName}</DialogTitle>
            <DialogDescription>
              {isEditingGuest ? "Edit Reservation Details" : "Reservation Details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {!isEditingGuest ? (
              // View mode
              <>
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
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    data-testid="button-edit-guest"
                    variant="outline"
                    onClick={handleEditGuest}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
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
                    variant="ghost" 
                    onClick={() => setSelectedGuest(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              // Edit mode
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room Number *</label>
                    <input
                      type="text"
                      data-testid="input-edit-room-number"
                      placeholder="302"
                      value={editGuestData.roomNumber}
                      onChange={(e) => setEditGuestData({ ...editGuestData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Nights *</label>
                    <input
                      type="number"
                      data-testid="input-edit-nights"
                      placeholder="3"
                      min="1"
                      value={editGuestData.numberOfNights}
                      onChange={(e) => setEditGuestData({ ...editGuestData, numberOfNights: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Check-in date: {selectedGuest?.checkInDate}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    data-testid="button-save-edit"
                    onClick={handleSaveEdit}
                    disabled={updateArrivalMutation.isPending}
                    className="flex-1"
                  >
                    {updateArrivalMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    data-testid="button-cancel-edit"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateArrivalMutation.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
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
              data-testid="button-download-contract"
              onClick={() => {
                if (selectedContract?.id) {
                  window.open(`/api/contracts/${selectedContract.id}/pdf`, '_blank');
                }
              }}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
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

      {/* Manual Check-In Dialog */}
      <Dialog open={showManualCheckIn} onOpenChange={setShowManualCheckIn}>
        <DialogContent className="max-w-md" data-testid="dialog-manual-checkin">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              New Manual Check-In
            </DialogTitle>
            <DialogDescription>
              Create a new guest registration without PMS lookup
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Guest Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Guest Name *</label>
              <input
                type="text"
                data-testid="input-guest-name"
                placeholder="John Doe"
                value={manualCheckInData.guestName}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, guestName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Room Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Number *</label>
              <input
                type="text"
                data-testid="input-room-number"
                placeholder="302"
                value={manualCheckInData.roomNumber}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            {/* Check-In Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-In Date</label>
              <input
                type="date"
                data-testid="input-checkin-date"
                value={manualCheckInData.checkInDate}
                onChange={(e) => setManualCheckInData({ ...manualCheckInData, checkInDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground">Auto-filled with today's date</p>
            </div>

            {/* Check-Out Date OR Number of Nights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-Out Date</label>
                <input
                  type="date"
                  data-testid="input-checkout-date"
                  value={manualCheckInData.checkOutDate}
                  onChange={(e) => setManualCheckInData({ 
                    ...manualCheckInData, 
                    checkOutDate: e.target.value,
                    numberOfNights: "" // Clear nights if date is set
                  })}
                  disabled={!!manualCheckInData.numberOfNights}
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">OR Nights</label>
                <input
                  type="number"
                  data-testid="input-nights"
                  placeholder="3"
                  min="1"
                  value={manualCheckInData.numberOfNights}
                  onChange={(e) => setManualCheckInData({ 
                    ...manualCheckInData, 
                    numberOfNights: e.target.value,
                    checkOutDate: "" // Clear date if nights is set
                  })}
                  disabled={!!manualCheckInData.checkOutDate}
                  className="w-full px-3 py-2 border rounded-md bg-background disabled:opacity-50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Provide either check-out date or number of nights *</p>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button
              data-testid="button-create-and-send"
              onClick={() => {
                setShouldAutoSendToTablet(true);
                handleManualCheckInSubmit();
              }}
              disabled={createManualCheckInMutation.isPending}
              className="w-full"
            >
              {createManualCheckInMutation.isPending ? "Creating..." : "Create & Send to Tablet"}
            </Button>
            <Button
              data-testid="button-save-only"
              variant="outline"
              onClick={() => {
                setShouldAutoSendToTablet(false);
                handleManualCheckInSubmit();
              }}
              disabled={createManualCheckInMutation.isPending}
              className="w-full"
            >
              Save Only
            </Button>
            <Button
              data-testid="button-cancel-checkin"
              variant="ghost"
              onClick={() => setShowManualCheckIn(false)}
              disabled={createManualCheckInMutation.isPending}
              className="w-full"
            >
              Cancel
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
          hotelId={hotelId}
        />
      )}
    </div>
  );
}
