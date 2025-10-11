import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings, Wifi, WifiOff } from "lucide-react";

interface HotelCardProps {
  id: string;
  name: string;
  location: string;
  isConnected: boolean;
  guestCount: number;
  onManage: (id: string) => void;
}

export function HotelCard({
  id,
  name,
  location,
  isConnected,
  guestCount,
  onManage,
}: HotelCardProps) {
  return (
    <Card data-testid={`card-hotel-${id}`} className="hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg" data-testid={`text-hotel-name-${id}`}>
              {name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{location}</p>
          </div>
        </div>
        <Badge
          data-testid={`badge-connection-${id}`}
          variant={isConnected ? "default" : "destructive"}
          className="gap-1"
        >
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{guestCount}</span> guests checked in this month
        </div>
      </CardContent>
      <CardFooter>
        <Button
          data-testid={`button-manage-${id}`}
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => onManage(id)}
        >
          <Settings className="h-4 w-4" />
          Manage Hotel
        </Button>
      </CardFooter>
    </Card>
  );
}
