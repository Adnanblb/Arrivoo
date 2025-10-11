import { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { HotelCard } from "@/components/HotelCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  CheckCircle,
  Plus,
  Search,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// TODO: Remove mock data when implementing real backend
const mockHotels = [
  {
    id: "1",
    name: "Grand Plaza Hotel",
    location: "New York, NY",
    isConnected: true,
    guestCount: 342,
  },
  {
    id: "2",
    name: "Seaside Resort",
    location: "Miami, FL",
    isConnected: true,
    guestCount: 156,
  },
  {
    id: "3",
    name: "Mountain View Lodge",
    location: "Denver, CO",
    isConnected: false,
    guestCount: 89,
  },
  {
    id: "4",
    name: "City Center Inn",
    location: "Chicago, IL",
    isConnected: true,
    guestCount: 234,
  },
];

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHotels = mockHotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGuests = mockHotels.reduce((acc, hotel) => acc + hotel.guestCount, 0);
  const activeHotels = mockHotels.filter((h) => h.isConnected).length;

  const handleManage = (id: string) => {
    console.log("Manage hotel:", id);
  };

  const handleAddHotel = () => {
    console.log("Add new hotel");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage hotels and monitor check-ins
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                data-testid="button-toggle-theme"
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <Button
                data-testid="button-logout"
                variant="ghost"
                size="icon"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatsCard
            title="Total Hotels"
            value={mockHotels.length}
            icon={Building2}
            trend={{ value: "+2", isPositive: true }}
          />
          <StatsCard
            title="Active Check-ins Today"
            value={147}
            icon={Users}
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatsCard
            title="Total Guests (Month)"
            value={totalGuests.toLocaleString()}
            icon={CheckCircle}
            trend={{ value: "+8%", isPositive: true }}
          />
        </div>

        {/* Hotels Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-xl font-semibold">Connected Hotels</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-hotels"
                  type="search"
                  placeholder="Search hotels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button
                data-testid="button-add-hotel"
                onClick={handleAddHotel}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Hotel</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                id={hotel.id}
                name={hotel.name}
                location={hotel.location}
                isConnected={hotel.isConnected}
                guestCount={hotel.guestCount}
                onManage={handleManage}
              />
            ))}
          </div>

          {filteredHotels.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hotels found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
