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
import { Tablet, Wifi, WifiOff, CheckCircle2, Monitor, Smartphone, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [onlineDevices, setOnlineDevices] = useState<Set<string>>(new Set());
  const dashboardDeviceId = useRef(getDashboardDeviceId());
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch devices for this hotel
  const { data: devices = [], isLoading, refetch, isRefetching } = useQuery<Device[]>({
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
          setSendError(null); // Clear any previous errors
          toast({
            title: "Contract Sent",
            description: `Check-in form sent to tablet successfully`,
          });
          onClose();
        } else {
          const baseError = message.payload.error || "The tablet is offline or unavailable";
          const errorMsg = `${baseError}. Try refreshing the device list or ensure the tablet is connected to WiFi.`;
          setSendError(errorMsg);
          toast({
            title: "Failed to Send",
            description: errorMsg,
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
      setSendError(null);
      
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
    setSendError(null); // Clear any previous errors

    // Set timeout for send operation (10 seconds)
    sendTimeoutRef.current = setTimeout(() => {
      setIsSending(false);
      const errorMsg = "Connection timeout - The tablet didn't respond in time. Check if the tablet is on the same WiFi network and try refreshing the device list.";
      setSendError(errorMsg);
      toast({
        title: "Send Timeout",
        description: errorMsg,
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

  // Sort online tablets alphabetically by name
  const onlineTablets = tabletDevices
    .filter((d) => d.isOnline)
    .sort((a, b) => a.deviceName.localeCompare(b.deviceName));

  // Sort offline tablets by last seen (most recent first)
  const offlineTablets = tabletDevices
    .filter((d) => !d.isOnline)
    .sort((a, b) => {
      const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      return bTime - aTime; // Most recent first
    });

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Available Tablets</h3>
                <Badge variant="outline" data-testid="badge-device-count">
                  {onlineTablets.length} online
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                disabled={isRefetching}
                data-testid="button-refresh-devices"
                className="flex-shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
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

          {/* Error Alert with Retry */}
          {sendError && !isSending && (
            <Alert variant="destructive" data-testid="alert-send-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="flex-1">{sendError}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendToTablet}
                  disabled={!selectedDeviceId || onlineTablets.length === 0}
                  className="flex-shrink-0"
                  data-testid="button-retry-send"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

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
