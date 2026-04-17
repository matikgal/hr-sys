"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-[13px] font-medium tracking-tight transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary active:scale-[0.98]",
        outline: "bg-card border border-border text-foreground hover:bg-accent shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "text-foreground/80 hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive",
        link: "text-foreground underline-offset-4 hover:underline rounded-none shadow-none p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 gap-2",
        xs: "h-7 px-2.5 gap-1.5 text-[12px]",
        sm: "h-8 px-3 gap-1.5 text-[12px]",
        lg: "h-10 px-5 gap-2.5 text-[14px]",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
