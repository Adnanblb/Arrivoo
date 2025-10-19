import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tablet } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getDeviceMetadata } from "@/lib/deviceInfo";

const deviceSchema = z.object({
  deviceName: z.string().min(1, "Device name is required"),
  hotelId: z.string().min(1, "Please select a hotel"),
});

type DeviceForm = z.infer<typeof deviceSchema>;

export default function DeviceRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<DeviceForm>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceName: "",
      hotelId: "f39d5d3b-a803-42c6-a266-e84fbbad98dd", // Grand Plaza Hotel (Supabase)
    },
  });

  // Initialize WebSocket
  const { send, isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "registration_confirmed") {
        console.log("Device registration confirmed:", message.payload);
        toast({
          title: "Device Registered",
          description: "This device is now connected to the hotel system",
        });
        // Redirect to tablet signature view
        setLocation("/tablet/signature");
      }
    },
  });

  useEffect(() => {
    // Check if device is already registered (stored in localStorage)
    const storedDeviceId = localStorage.getItem("deviceId");
    const storedHotelId = localStorage.getItem("hotelId");
    
    if (storedDeviceId && storedHotelId) {
      setDeviceId(storedDeviceId);
      
      // Re-register with WebSocket on page load
      if (isConnected) {
        send({
          type: "register_device",
          payload: {
            deviceId: storedDeviceId,
            hotelId: storedHotelId,
            deviceType: "tablet",
          },
        });
      }
    }
  }, [isConnected, send]);

  const onSubmit = async (data: DeviceForm) => {
    setIsLoading(true);
    try {
      // Get device metadata
      const metadata = getDeviceMetadata();
      
      // Create device in database
      const response = await apiRequest("POST", "/api/devices", {
        hotelId: data.hotelId,
        deviceName: data.deviceName,
        deviceType: "tablet",
        isOnline: false,
        browser: metadata.browser,
        os: metadata.os,
        screenSize: metadata.screenSize,
      });
      
      const device = await response.json();
      
      // Store device ID in localStorage
      localStorage.setItem("deviceId", device.id);
      localStorage.setItem("hotelId", data.hotelId);
      localStorage.setItem("deviceName", data.deviceName);
      
      setDeviceId(device.id);
      
      // Register with WebSocket
      send({
        type: "register_device",
        payload: {
          deviceId: device.id,
          hotelId: data.hotelId,
          deviceType: "tablet",
          ...metadata,
        },
      });
      
      toast({
        title: "Success",
        description: "Device registered successfully",
      });
    } catch (error) {
      console.error("Device registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to register device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If already registered, show status
  if (deviceId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Tablet className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">Device Registered</CardTitle>
            <CardDescription className="text-center">
              {localStorage.getItem("deviceName")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <Button
              className="w-full"
              onClick={() => setLocation("/tablet/signature")}
              data-testid="button-goto-signature"
            >
              Go to Signature View
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                localStorage.removeItem("deviceId");
                localStorage.removeItem("hotelId");
                localStorage.removeItem("deviceName");
                setDeviceId(null);
              }}
              data-testid="button-unregister"
            >
              Unregister Device
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Tablet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-registration-title">
            Register Tablet
          </h1>
          <p className="text-muted-foreground mt-2">
            Register this device to receive digital registration cards
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
            <CardDescription>
              Give this tablet a friendly name for easy identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="deviceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-device-name"
                          placeholder="e.g., Front Desk iPad 1, Lobby iPad"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a name that helps identify this device's location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-register"
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !isConnected}
                >
                  {isLoading ? "Registering..." : "Register Device"}
                </Button>
                
                {!isConnected && (
                  <p className="text-sm text-destructive text-center">
                    Connecting to server...
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
