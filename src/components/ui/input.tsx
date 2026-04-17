import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-1 text-[13px] text-foreground transition-all outline-none placeholder:text-muted-foreground focus-visible:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
