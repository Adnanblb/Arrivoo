import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Send, Eye } from "lucide-react";

interface Arrival {
  id: string;
  guestName: string;
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber: string;
  status: "completed" | "pending";
}

interface ArrivalsTableProps {
  arrivals: Arrival[];
  onSendToTablet: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function ArrivalsTable({
  arrivals,
  onSendToTablet,
  onViewDetails,
}: ArrivalsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest Name</TableHead>
            <TableHead className="hidden md:table-cell">Reservation #</TableHead>
            <TableHead className="hidden lg:table-cell">Check-in</TableHead>
            <TableHead className="hidden lg:table-cell">Check-out</TableHead>
            <TableHead className="hidden sm:table-cell">Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arrivals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No arrivals for today
              </TableCell>
            </TableRow>
          ) : (
            arrivals.map((arrival) => (
              <TableRow key={arrival.id} data-testid={`row-arrival-${arrival.id}`}>
                <TableCell className="font-medium" data-testid={`text-guest-${arrival.id}`}>
                  {arrival.guestName}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm">
                  {arrival.reservationNumber}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{arrival.checkInDate}</TableCell>
                <TableCell className="hidden lg:table-cell">{arrival.checkOutDate}</TableCell>
                <TableCell className="hidden sm:table-cell">{arrival.roomNumber}</TableCell>
                <TableCell>
                  <StatusBadge status={arrival.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      data-testid={`button-view-${arrival.id}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(arrival.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {arrival.status === "pending" && (
                      <Button
                        data-testid={`button-send-tablet-${arrival.id}`}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => onSendToTablet(arrival.id)}
                      >
                        <Send className="h-3 w-3" />
                        <span className="hidden sm:inline">Send to Tablet</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
