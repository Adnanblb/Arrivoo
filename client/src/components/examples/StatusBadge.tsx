import { StatusBadge } from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="p-8 bg-background">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Status Badge</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24">Completed:</span>
            <StatusBadge status="completed" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24">Pending:</span>
            <StatusBadge status="pending" />
          </div>
        </div>
      </div>
    </div>
  );
}
