import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[0.05em] uppercase ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[hsl(0,0%,12%)] text-white hover:bg-[hsl(0,0%,20%)] active:bg-[hsl(0,0%,15%)] shadow-md hover:shadow-lg active:shadow-md active:scale-[0.98] font-semibold [&_svg]:text-white",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.98]",
        outline:
          "border border-foreground/25 bg-[hsl(0,0%,92%)] hover:bg-[hsl(0,0%,88%)] hover:border-foreground/35 text-foreground active:bg-[hsl(0,0%,85%)] active:scale-[0.98] shadow-sm hover:shadow-md",
        secondary:
          "bg-[hsl(0,0%,90%)] text-foreground hover:bg-[hsl(0,0%,86%)] active:bg-[hsl(0,0%,82%)] shadow-sm hover:shadow-md active:shadow-sm active:scale-[0.98] border border-border/60",
        ghost: "hover:bg-[hsl(0,0%,92%)] hover:text-foreground active:bg-[hsl(0,0%,88%)] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/70",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 px-3.5 py-2 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
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
