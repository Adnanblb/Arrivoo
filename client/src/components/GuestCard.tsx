import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Eye, Trash2 } from "lucide-react";

interface GuestCardProps {
  id: string;
  guestName: string;
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  status: "completed" | "pending";
  onSendToTablet: (id: string) => void;
  onViewDetails: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GuestCard({
  id,
  guestName,
  reservationNumber,
  checkInDate,
  checkOutDate,
  roomNumber,
  status,
  onSendToTablet,
  onViewDetails,
  onDelete,
}: GuestCardProps) {
  const initials = guestName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card data-testid={`card-guest-${id}`} className="hover-elevate">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg" data-testid={`text-guest-name-${id}`}>
              {guestName}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {reservationNumber}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Room:</span>{" "}
                <span className="font-medium">{roomNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Check-in:</span>{" "}
                <span className="font-medium">{checkInDate}</span>
              </div>
            </div>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button
          data-testid={`button-view-details-${id}`}
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onViewDetails(id)}
        >
          <Eye className="h-3 w-3" />
          View Details
        </Button>
        {status === "pending" && (
          <Button
            data-testid={`button-send-tablet-${id}`}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onSendToTablet(id)}
          >
            <Send className="h-3 w-3" />
            Send to Tablet
          </Button>
        )}
        <Button
          data-testid={`button-delete-${id}`}
          variant="destructive"
          size="sm"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
