import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "completed" | "pending";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "completed") {
    return (
      <Badge
        data-testid="badge-status-completed"
        className="bg-chart-2 text-white border-chart-2 gap-1"
      >
        <CheckCircle2 className="h-3 w-3" />
        <span>Completed</span>
      </Badge>
    );
  }

  return (
    <Badge
      data-testid="badge-status-pending"
      variant="destructive"
      className="gap-1"
    >
      <XCircle className="h-3 w-3" />
      <span>Pending</span>
    </Badge>
  );
}
