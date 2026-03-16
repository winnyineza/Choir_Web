import { ReactNode } from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface RecordsTableShellProps {
  children: ReactNode;
  className?: string;
  maxHeightClassName?: string;
}

export function RecordsTableShell({
  children,
  className,
  maxHeightClassName = "max-h-[34rem]",
}: RecordsTableShellProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl", className)}>
      <ScrollArea className={cn("w-full", maxHeightClassName)}>
        <div className="min-w-full">{children}</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
