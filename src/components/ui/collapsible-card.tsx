import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleCardProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleCard({
  isExpanded,
  onToggleExpanded,
  header,
  children,
  className,
}: CollapsibleCardProps) {
  return (
    <Card className={className || "p-4 sm:p-6"}>
      {/* Header - Clickable */}
      <div
        className="flex items-center gap-2 sm:gap-3 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex-1 min-w-0">{header}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded();
          }}
          className="h-8 w-8 shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div
          className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </Card>
  );
}
