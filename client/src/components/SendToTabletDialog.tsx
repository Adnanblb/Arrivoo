import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { Tablet, Wifi, WifiOff, CheckCircle2, Monitor, Smartphone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Device {
  id: string;
  hotelId: string;
  deviceName: string;
  deviceType: string;
  isOnline?: boolean;
  browser?: string;
  os?: string;
  screenSize?: string;
  lastSeen?: string | Date;
}

interface SendToTabletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contractData: {
    id: string; // Required - must be the actual contract/reservation ID
    guestName: string;
    reservationNumber: string;
    checkInDate: string;
    checkOutDate: string;
    roomNumber: string;
  };
  hotelId: string;
}

// Generate persistent dashboard device ID
const getDashboardDeviceId = () => {
  const stored = sessionStorage.getItem("dashboard-device-id");
  if (stored) return stored;
  
  const newId = `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem("dashboard-device-id", newId);
  return newId;
};

// Helper function to get device icon based on OS
const getDeviceIcon = (os?: string) => {
  if (!os) return Tablet;
  const osLower = os.toLowerCase();
  if (osLower.includes("ios") || osLower.includes("ipad")) return Tablet;
  if (osLower.includes("android")) return Smartphone;
  if (osLower.includes("windows") || osLower.includes("mac") || osLower.includes("linux")) return Monitor;
  return Tablet;
};

// Helper function to format last seen time
const getLastSeenText = (lastSeen?: string | Date, isOnline?: boolean) => {
  if (isOnline) return "Active now";
  if (!lastSeen) return "Never seen";
  
  try {
    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch {
    return "Never seen";
  }
};

export function SendToTabletDialog({
  isOpen,
  onClose,
  contractData,
  hotelId,
}: SendToTabletDialogProps) {
  const { toast } = useToast();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [onlineDevices, setOnlineDevices] = useState<Set<string>>(new Set());
  const dashboardDeviceId = useRef(getDashboardDeviceId());
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch devices for this hotel
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices", hotelId],
    enabled: isOpen && !!hotelId,
  });

  // WebSocket for real-time device status and sending contracts
  const { send, lastMessage, isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "device_list_update") {
        const deviceIds = new Set<string>(
          message.payload.devices
            .filter((d: any) => d.isOnline)
            .map((d: any) => d.deviceId as string)
        );
        setOnlineDevices(deviceIds);
      }

      if (message.type === "contract_sent_confirmation") {
        // Validate this confirmation is for our current contract
        const expectedContractId = contractData?.id;
        if (message.payload.contractId !== expectedContractId) {
          console.warn("Received confirmation for different contract, ignoring");
          return;
        }
        
        // Clear timeout
        if (sendTimeoutRef.current) {
          clearTimeout(sendTimeoutRef.current);
          sendTimeoutRef.current = null;
        }
        
        setIsSending(false);
        
        if (message.payload.success) {
          toast({
            title: "Contract Sent",
            description: `Check-in form sent to tablet successfully`,
          });
          onClose();
        } else {
          toast({
            title: "Failed to Send",
            description: message.payload.error || "The tablet is offline or unavailable",
            variant: "destructive",
          });
        }
      }
    },
  });

  // Register as dashboard device when connected
  useEffect(() => {
    if (isConnected && isOpen) {
      send({
        type: "register_device",
        payload: {
          deviceId: dashboardDeviceId.current,
          hotelId,
          deviceType: "dashboard",
        },
      });
    }
  }, [isConnected, isOpen, hotelId, send]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsSending(false);
      setSelectedDeviceId(null);
      
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup on unmount - deregister device
  useEffect(() => {
    return () => {
      // Clear timeout
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
      
      // Deregister dashboard device to keep server roster clean
      if (isConnected && send) {
        send({
          type: "unregister_device",
          payload: {
            deviceId: dashboardDeviceId.current,
          },
        });
      }
    };
  }, [isConnected, send]);

  const handleSendToTablet = () => {
    if (!selectedDeviceId) {
      toast({
        title: "No Device Selected",
        description: "Please select a tablet to send the contract to",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    // Set timeout for send operation (10 seconds)
    sendTimeoutRef.current = setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Send Timeout",
        description: "The request timed out. Please check the tablet connection and try again.",
        variant: "destructive",
      });
    }, 10000);

    // Send contract to selected device via WebSocket
    send({
      type: "send_contract_to_device",
      payload: {
        contractId: contractData.id, // Use actual contract ID
        deviceId: selectedDeviceId,
        contract: contractData,
      },
    });
  };

  // Merge devices with online status
  const devicesWithStatus = devices.map((device) => ({
    ...device,
    isOnline: onlineDevices.has(device.id),
  }));

  // Filter to only show tablet devices (not dashboards)
  const tabletDevices = devicesWithStatus.filter(
    (device) => device.deviceType === "tablet"
  );

  const onlineTablets = tabletDevices.filter((d) => d.isOnline);
  const offlineTablets = tabletDevices.filter((d) => !d.isOnline);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            Send to Tablet
          </DialogTitle>
          <DialogDescription>
            Select a tablet to send the check-in form to {contractData.guestName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest Info Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="font-semibold">{contractData.guestName}</p>
                <p className="text-sm text-muted-foreground">
                  {contractData.reservationNumber} • Room {contractData.roomNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {contractData.checkInDate} - {contractData.checkOutDate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Device List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Available Tablets</h3>
              <Badge variant="outline" data-testid="badge-device-count">
                {onlineTablets.length} online
              </Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading devices...
              </div>
            ) : tabletDevices.length === 0 ? (
              <div className="text-center py-8">
                <Tablet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No tablets registered</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use "How to Add Tablet" to register a new device
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Online Tablets First */}
                {onlineTablets.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.os);
                  return (
                    <Card
                      key={device.id}
                      className={`cursor-pointer transition-colors hover-elevate ${
                        selectedDeviceId === device.id
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedDeviceId(device.id)}
                      data-testid={`device-card-${device.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <DeviceIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{device.deviceName}</p>
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                  <Wifi className="h-3 w-3 mr-1" />
                                  Online
                                </Badge>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                {device.os && device.browser && (
                                  <p className="text-xs text-muted-foreground">
                                    {device.browser} • {device.os}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getLastSeenText(device.lastSeen, device.isOnline)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {selectedDeviceId === device.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Offline Tablets */}
                {offlineTablets.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.os);
                  return (
                    <Card
                      key={device.id}
                      className="opacity-60"
                      data-testid={`device-card-offline-${device.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{device.deviceName}</p>
                              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted">
                                <WifiOff className="h-3 w-3 mr-1" />
                                Offline
                              </Badge>
                            </div>
                            <div className="mt-1 space-y-0.5">
                              {device.os && device.browser && (
                                <p className="text-xs text-muted-foreground">
                                  {device.browser} • {device.os}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {getLastSeenText(device.lastSeen, device.isOnline)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              data-testid="button-cancel-send"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendToTablet}
              disabled={!selectedDeviceId || isSending || onlineTablets.length === 0}
              data-testid="button-confirm-send"
            >
              {isSending ? "Sending..." : "Send to Tablet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
