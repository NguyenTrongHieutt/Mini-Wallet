import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="alert" className={cn("rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive", className)} {...props} />;
}
