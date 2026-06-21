import { categoryColor, categoryLabel } from "../lib/categories";
import type { EventCategory } from "../lib/types";
import { cn } from "../lib/cn";

export function CategoryBadge({
  category,
  className,
}: {
  category: EventCategory;
  className?: string;
}) {
  return (
    <span className={cn("chip", categoryColor(category), className)}>
      {categoryLabel(category)}
    </span>
  );
}
