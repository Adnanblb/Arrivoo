import { ArrivalsTable } from "../ArrivalsTable";

const mockArrivals = [
  {
    id: "1",
    guestName: "John Smith",
    reservationNumber: "RES-2024-001",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 15, 2025",
    roomNumber: "Suite 302",
    status: "completed" as const,
  },
  {
    id: "2",
    guestName: "Sarah Johnson",
    reservationNumber: "RES-2024-002",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 13, 2025",
    roomNumber: "Room 215",
    status: "pending" as const,
  },
  {
    id: "3",
    guestName: "Michael Chen",
    reservationNumber: "RES-2024-003",
    checkInDate: "Oct 11, 2025",
    checkOutDate: "Oct 18, 2025",
    roomNumber: "Suite 401",
    status: "pending" as const,
  },
];

export default function ArrivalsTableExample() {
  const handleSendToTablet = (id: string) => {
    console.log("Send to tablet:", id);
  };

  const handleViewDetails = (id: string) => {
    console.log("View details:", id);
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Arrivals Table</h2>
        <ArrivalsTable
          arrivals={mockArrivals}
          onSendToTablet={handleSendToTablet}
          onViewDetails={handleViewDetails}
        />
      </div>
    </div>
  );
}
