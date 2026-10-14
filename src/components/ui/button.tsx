import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[2px] text-[0.8rem] font-medium tracking-[0.04em] ring-offset-background transition-[background-color,border-color,color,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-500 font-body",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-foreground/15 bg-transparent text-foreground hover:border-primary/60 hover:text-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost: "hover:bg-foreground/[0.04] hover:text-primary",
        link: "text-primary underline-offset-[6px] decoration-primary/40 hover:underline",
        // Signature call to action: solid champagne, small caps, no bounce.
        gold: "bg-primary text-primary-foreground uppercase tracking-[0.18em] text-[0.7rem] font-semibold hover:bg-gold-light shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)] [&:hover_svg]:translate-x-0.5",
        "gold-outline": "border border-primary/50 bg-transparent text-primary uppercase tracking-[0.18em] text-[0.7rem] font-semibold hover:bg-primary hover:text-primary-foreground",
        hero: "bg-primary text-primary-foreground uppercase tracking-[0.2em] text-[0.72rem] font-semibold px-9 hover:bg-gold-light shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)] [&:hover_svg]:translate-x-0.5",
        "hero-outline": "border border-foreground/25 bg-transparent text-foreground uppercase tracking-[0.2em] text-[0.72rem] font-semibold px-9 hover:border-foreground hover:bg-foreground hover:text-background",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        xl: "h-14 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
