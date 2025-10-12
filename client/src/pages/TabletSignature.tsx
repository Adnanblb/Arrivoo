import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tablet, CheckCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import type { RegistrationContract } from "@shared/schema";

export default function TabletSignature() {
  const [currentContract, setCurrentContract] = useState<RegistrationContract | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [signaturePad, setSignaturePad] = useState<SignatureCanvas | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get device info from localStorage
  const deviceId = localStorage.getItem("deviceId");
  const deviceName = localStorage.getItem("deviceName");
  const hotelId = localStorage.getItem("hotelId");

  // Initialize WebSocket
  const { send, isConnected } = useWebSocket({
    onMessage: (message) => {
      console.log("Received message:", message);
      
      if (message.type === "receive_contract") {
        const { contractId, contract } = message.payload;
        setCurrentContract(contract);
        setAssignmentId(contractId);
        setIsSigned(false);
        
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
            assignmentId: contractId,
          },
        });
      }
      
      if (message.type === "contract_status_update") {
        // Handle status updates from other devices
        console.log("Contract status update:", message.payload);
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
      send({
        type: "register_device",
        payload: {
          deviceId,
          hotelId,
          deviceType: "tablet",
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
    
    // Send signature to server via WebSocket
    send({
      type: "contract_signed",
      payload: {
        contractId: currentContract?.id,
        assignmentId,
        signatureDataUrl,
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
                <label className="text-sm font-medium text-muted-foreground">Guest Name</label>
                <p className="text-lg font-semibold" data-testid="text-guest-name">
                  {currentContract.guestName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg" data-testid="text-email">
                  {currentContract.email || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-lg" data-testid="text-phone">
                  {currentContract.phone || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Room</label>
                <p className="text-lg" data-testid="text-room">
                  {currentContract.roomNumber || "TBD"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Check-in</label>
                <p className="text-lg" data-testid="text-checkin">
                  {currentContract.arrivalDate}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Check-out</label>
                <p className="text-lg" data-testid="text-checkout">
                  {currentContract.departureDate}
                </p>
              </div>
            </div>
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
