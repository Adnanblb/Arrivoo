import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PmsReservation } from "@shared/schema";

const lookupSchema = z.object({
  confirmationNumber: z.string().min(1, "Confirmation number is required"),
});

type LookupForm = z.infer<typeof lookupSchema>;

export default function NewCheckin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reservationData, setReservationData] = useState<PmsReservation | null>(null);

  const form = useForm<LookupForm>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      confirmationNumber: "",
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (data: LookupForm) => {
      const response = await apiRequest("POST", "/api/pms/lookup", {
        confirmationNumber: data.confirmationNumber,
        hotelId: "f39d5d3b-a803-42c6-a266-e84fbbad98dd", // Grand Plaza Hotel (Supabase)
      });
      return await response.json() as PmsReservation;
    },
    onSuccess: (data: PmsReservation) => {
      setReservationData(data);
      toast({
        title: "Reservation Found!",
        description: `Found reservation for ${data.guestName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reservation Not Found",
        description: error.message || "No reservation found with that confirmation number",
        variant: "destructive",
      });
    },
  });

  const handleLookup = (data: LookupForm) => {
    lookupMutation.mutate(data);
  };

  const handleProceedToCheckin = () => {
    if (reservationData) {
      // Navigate to guest checkin page with reservation data
      setLocation(`/guest-checkin?data=${encodeURIComponent(JSON.stringify(reservationData))}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/hotel")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">New Check-in</h1>
          <p className="text-muted-foreground mt-1">
            Enter the confirmation number to lookup reservation details
          </p>
        </div>

        {/* Lookup Form */}
        <Card className="mb-6" data-testid="card-lookup-form">
          <CardHeader>
            <CardTitle>Reservation Lookup</CardTitle>
            <CardDescription>
              Enter the guest's confirmation number to retrieve their reservation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleLookup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Confirmation Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="confirmationNumber"
                    data-testid="input-confirmation-number"
                    placeholder="e.g., RES-2024-001"
                    {...form.register("confirmationNumber")}
                    disabled={lookupMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={lookupMutation.isPending}
                    data-testid="button-lookup"
                  >
                    {lookupMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Lookup
                      </>
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmationNumber && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmationNumber.message}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Reservation Details */}
        {reservationData && (
          <Card data-testid="card-reservation-details">
            <CardHeader>
              <CardTitle>Reservation Details</CardTitle>
              <CardDescription>Review the information before proceeding to check-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Guest Name</Label>
                  <p className="font-medium" data-testid="text-guest-name">
                    {reservationData.guestName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservation Number</Label>
                  <p className="font-medium" data-testid="text-reservation-number">
                    {reservationData.reservationNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room Type</Label>
                  <p className="font-medium" data-testid="text-room-type">
                    {reservationData.roomType || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room Number</Label>
                  <p className="font-medium" data-testid="text-room-number">
                    {reservationData.roomNumber || "To be assigned"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-in Date</Label>
                  <p className="font-medium" data-testid="text-checkin-date">
                    {reservationData.arrivalDate}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-out Date</Label>
                  <p className="font-medium" data-testid="text-checkout-date">
                    {reservationData.departureDate}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Number of Nights</Label>
                  <p className="font-medium" data-testid="text-nights">
                    {reservationData.numberOfNights}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Number of Guests</Label>
                  <p className="font-medium" data-testid="text-guests">
                    {reservationData.numberOfGuests || "N/A"}
                  </p>
                </div>
                {reservationData.email && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium" data-testid="text-email">
                      {reservationData.email}
                    </p>
                  </div>
                )}
                {reservationData.phone && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium" data-testid="text-phone">
                      {reservationData.phone}
                    </p>
                  </div>
                )}
                {reservationData.specialRequests && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Special Requests</Label>
                    <p className="font-medium" data-testid="text-special-requests">
                      {reservationData.specialRequests}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleProceedToCheckin}
                  className="flex-1"
                  data-testid="button-proceed-checkin"
                >
                  Proceed to Registration
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReservationData(null);
                    form.reset();
                  }}
                  data-testid="button-clear"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
