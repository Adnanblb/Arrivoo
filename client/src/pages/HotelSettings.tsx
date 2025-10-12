import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Hotel } from "@shared/schema";

const defaultTerms = `REGISTRATION AGREEMENT

By signing this registration form, the guest acknowledges and agrees to the following terms and conditions:

1. CHECK-IN / CHECK-OUT
   - Check-in time: 3:00 PM
   - Check-out time: 11:00 AM
   - Early check-in or late check-out may be available upon request and subject to availability

2. PAYMENT TERMS
   - All charges must be settled at check-out unless other arrangements have been made
   - The guest is responsible for all charges incurred during their stay
   - A valid credit card or deposit may be required to cover incidental charges

3. CANCELLATION POLICY
   - Cancellations must be made 24 hours prior to arrival to avoid charges
   - No-shows will be charged the full amount of the reservation

4. GUEST RESPONSIBILITIES
   - Guests are responsible for any damage to hotel property during their stay
   - Smoking is prohibited in all guest rooms and indoor areas
   - Guests must comply with all hotel policies and local regulations

5. LIABILITY
   - The hotel is not responsible for loss or damage to personal property
   - Guests should use in-room safes for valuables
   - The hotel reserves the right to refuse service to anyone

6. PRIVACY
   - Guest information will be kept confidential and used only for hotel operations
   - Information may be shared with authorities when required by law

I have read and agree to the above terms and conditions.`;

export default function HotelSettings() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get hotel ID from localStorage (set during login)
  const hotelId = localStorage.getItem("hotelId");

  // Fetch hotel details
  const { data: hotel, isLoading, error } = useQuery<Hotel>({
    queryKey: ["/api/hotels", hotelId],
    queryFn: async () => {
      const response = await fetch(`/api/hotels/${hotelId}`);
      if (!response.ok) throw new Error("Failed to fetch hotel");
      return response.json();
    },
    enabled: !!hotelId,
  });

  const [contractTerms, setContractTerms] = useState(defaultTerms);

  // Update local state when hotel data loads
  useEffect(() => {
    if (hotel && hotel.contractTerms !== undefined && hotel.contractTerms !== null) {
      setContractTerms(hotel.contractTerms);
    }
  }, [hotel]);

  // Mutation to update contract terms
  const updateTermsMutation = useMutation({
    mutationFn: async (terms: string) => {
      return await apiRequest("PATCH", `/api/hotels/${hotelId}/contract-terms`, {
        contractTerms: terms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotels", hotelId] });
      toast({
        title: "Contract Terms Updated",
        description: "The contract terms have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateTermsMutation.mutate(contractTerms);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hotelId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to access settings.</p>
            <p className="text-sm text-muted-foreground mt-2">Hotel ID not found in session.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading hotel settings: {error.message}</p>
            <Button onClick={() => navigate("/hotel")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/hotel")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Hotel Settings</h1>
          <p className="text-muted-foreground">{hotel?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Contract Terms</CardTitle>
          <CardDescription>
            Customize the terms and conditions that guests see and agree to during check-in.
            These terms apply automatically to all reservations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-terms">Contract Terms</Label>
            <Textarea
              id="contract-terms"
              data-testid="textarea-contract-terms"
              value={contractTerms}
              onChange={(e) => setContractTerms(e.target.value)}
              placeholder="Enter your custom contract terms..."
              className="min-h-[400px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              These terms will be displayed to guests on the digital signature page before they sign the registration form.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setContractTerms(defaultTerms)}
              data-testid="button-reset-default"
            >
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateTermsMutation.isPending}
              data-testid="button-save-terms"
            >
              {updateTermsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how guests will see the contract terms on their signature page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-muted/50">
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {contractTerms}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
