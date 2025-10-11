import { HotelCard } from "../HotelCard";

export default function HotelCardExample() {
  const handleManage = (id: string) => {
    console.log("Manage hotel:", id);
  };

  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Hotel Cards</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <HotelCard
            id="1"
            name="Grand Plaza Hotel"
            location="New York, NY"
            isConnected={true}
            guestCount={342}
            onManage={handleManage}
          />
          <HotelCard
            id="2"
            name="Seaside Resort"
            location="Miami, FL"
            isConnected={false}
            guestCount={156}
            onManage={handleManage}
          />
        </div>
      </div>
    </div>
  );
}
