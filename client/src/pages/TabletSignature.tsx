import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tablet, CheckCircle, ScrollText } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import type { RegistrationContract, Hotel } from "@shared/schema";
import { getDeviceMetadata } from "@/lib/deviceInfo";

const defaultContractTerms = `REGISTRATION AGREEMENT

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

export default function TabletSignature() {
  const [currentContract, setCurrentContract] = useState<RegistrationContract | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get device info from localStorage
  const deviceId = localStorage.getItem("deviceId");
  const deviceName = localStorage.getItem("deviceName");
  const hotelId = localStorage.getItem("hotelId");

  // Fetch hotel details to get custom contract terms
  const { data: hotel } = useQuery<Hotel>({
    queryKey: ["/api/hotels", hotelId],
    queryFn: async () => {
      const response = await fetch(`/api/hotels/${hotelId}`);
      if (!response.ok) throw new Error("Failed to fetch hotel");
      return response.json();
    },
    enabled: !!hotelId,
  });

  const contractTerms = hotel?.contractTerms || defaultContractTerms;

  // Initialize WebSocket
  const { send, isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "receive_contract") {
        const { contractId, assignmentId, contract } = message.payload;
        setCurrentContract(contract);
        setAssignmentId(assignmentId || contractId);
        setIsSigned(false);
        setEmail(contract.email || "");
        setPhone(contract.phone || "");
        
        // Clear signature pad if it exists
        if (signaturePad) {
          signaturePad.clear();
        }
        
        toast({
          title: "Contract Received",
          description: `Registration card for ${contract.guestName}`,
        });
        
        // Notify server that contract is being viewed
        send({
          type: "contract_viewed",
          payload: {
            contractId,
            assignmentId: assignmentId || contractId,
          },
        });
      }
    },
  });

  useEffect(() => {
    // Check if device is registered
    if (!deviceId || !hotelId) {
      setLocation("/tablet/register");
      return;
    }

    // Register device with WebSocket when connected
    if (isConnected && deviceId && hotelId) {
      const metadata = getDeviceMetadata();
      send({
        type: "register_device",
        payload: {
          deviceId,
          hotelId,
          deviceType: "tablet",
          ...metadata,
        },
      });
    }
  }, [isConnected, deviceId, hotelId, setLocation, send]);

  const handleClearSignature = () => {
    signaturePad?.clear();
    setIsSigned(false);
  };

  const handleSaveSignature = () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide a signature before saving",
        variant: "destructive",
      });
      return;
    }

    const signatureDataUrl = signaturePad.toDataURL();
    
    console.log("[Tablet] Sending contract_signed with:", {
      contractId: currentContract?.id,
      assignmentId,
      email,
      phone,
      hasSignature: !!signatureDataUrl
    });
    
    // Send signature to server via WebSocket with updated contact info
    send({
      type: "contract_signed",
      payload: {
        contractId: currentContract?.id,
        assignmentId,
        signatureDataUrl,
        email,
        phone,
      },
    });
    
    setIsSigned(true);
    
    toast({
      title: "Signature Saved",
      description: "Contract has been signed successfully",
    });

    // Clear contract after 2 seconds
    setTimeout(() => {
      setCurrentContract(null);
      setAssignmentId(null);
      setIsSigned(false);
      setEmail("");
      setPhone("");
      signaturePad?.clear();
    }, 2000);
  };

  // Redirect if not registered
  if (!deviceId || !deviceName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Device Not Registered</CardTitle>
            <CardDescription>
              Please register this device first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => setLocation("/tablet/register")}
              data-testid="button-register-device"
            >
              Register Device
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for contract
  if (!currentContract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Tablet className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl">{deviceName}</CardTitle>
            <CardDescription className="text-center text-lg">
              {isConnected ? "Ready to receive contracts" : "Connecting to server..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`h-4 w-4 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <p className="text-muted-foreground">
              Waiting for registration card to be sent from the main dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display contract with signature
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-device-name">
              {deviceName}
            </h1>
            <p className="text-muted-foreground">Digital Registration Card</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Contract Details */}
        <Card data-testid="card-contract-details">
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
            <CardDescription>Please review and sign below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Guest Name</Label>
                <p className="text-lg font-semibold mt-1" data-testid="text-guest-name">
                  {currentContract.guestName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Room</Label>
                <p className="text-lg mt-1" data-testid="text-room">
                  {currentContract.roomNumber || "TBD"}
                </p>
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSigned}
                  className="mt-1"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSigned}
                  className="mt-1"
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Check-in</Label>
                <p className="text-lg mt-1" data-testid="text-checkin">
                  {currentContract.arrivalDate}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Check-out</Label>
                <p className="text-lg mt-1" data-testid="text-checkout">
                  {currentContract.departureDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms */}
        <Card data-testid="card-contract-terms">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              <CardTitle>Terms and Conditions</CardTitle>
            </div>
            <CardDescription>
              Please review before signing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-muted/30 max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {contractTerms}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              By signing below, you acknowledge that you have read and agree to the above terms and conditions.
            </p>
          </CardContent>
        </Card>

        {/* Signature Pad */}
        <Card data-testid="card-signature">
          <CardHeader>
            <CardTitle>Guest Signature</CardTitle>
            <CardDescription>
              Please sign using your finger or stylus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={canvasRef}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg bg-white dark:bg-gray-900 p-2"
              data-testid="div-signature-canvas"
            >
              <SignatureCanvas
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: "w-full h-48 md:h-64 cursor-crosshair",
                }}
                backgroundColor="transparent"
                penColor="black"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClearSignature}
                data-testid="button-clear-signature"
                disabled={isSigned}
              >
                Clear
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveSignature}
                data-testid="button-save-signature"
                disabled={isSigned}
              >
                {isSigned ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Signed
                  </>
                ) : (
                  "Save Signature"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
