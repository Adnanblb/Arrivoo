import { StatsCard } from "../StatsCard";
import { Building2, Users, CheckCircle } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Stats Cards</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Hotels"
            value={24}
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
            value="3,421"
            icon={CheckCircle}
            trend={{ value: "+8%", isPositive: true }}
          />
        </div>
      </div>
    </div>
  );
}
