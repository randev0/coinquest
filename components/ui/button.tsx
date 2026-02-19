import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-pixel text-[9px] tracking-wider uppercase transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "btn-game text-mmorpg-parchment px-4 py-2 rounded-sm",
        gold: "btn-gold px-4 py-2 rounded-sm font-pixel",
        destructive: "bg-mmorpg-danger text-white hover:bg-mmorpg-dangerLight px-4 py-2 rounded-sm border border-mmorpg-dangerLight/40",
        outline: "border border-mmorpg-border bg-transparent text-mmorpg-steel hover:text-mmorpg-parchment px-4 py-2 rounded-sm",
        ghost: "text-mmorpg-steel hover:text-mmorpg-parchment hover:bg-mmorpg-border/30 px-3 py-2 rounded-sm",
        link: "text-mmorpg-accentBlue underline-offset-4 hover:underline px-0",
      },
      size: {
        default: "h-9",
        sm: "h-7 text-[8px] px-3",
        lg: "h-11 text-[10px] px-6",
        icon: "h-9 w-9",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
