import { GuestCard } from "../GuestCard";

export default function GuestCardExample() {
  const handleSendToTablet = (id: string) => {
    console.log("Send to tablet:", id);
  };

  const handleViewDetails = (id: string) => {
    console.log("View details:", id);
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Guest Card (Mobile View)</h2>
        <div className="space-y-4">
          <GuestCard
            id="1"
            guestName="John Smith"
            reservationNumber="RES-2024-001"
            checkInDate="Oct 11, 2025"
            checkOutDate="Oct 15, 2025"
            roomNumber="Suite 302"
            status="completed"
            onSendToTablet={handleSendToTablet}
            onViewDetails={handleViewDetails}
          />
          <GuestCard
            id="2"
            guestName="Sarah Johnson"
            reservationNumber="RES-2024-002"
            checkInDate="Oct 11, 2025"
            checkOutDate="Oct 13, 2025"
            roomNumber="Room 215"
            status="pending"
            onSendToTablet={handleSendToTablet}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </div>
  );
}
