import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border font-pixel text-[8px] uppercase tracking-wider px-1.5 py-0.5 transition-colors",
  {
    variants: {
      variant: {
        default: "border-mmorpg-border bg-mmorpg-panel text-mmorpg-steelLight",
        gold: "border-mmorpg-gold/40 bg-mmorpg-gold/10 text-mmorpg-gold",
        success: "border-mmorpg-success/40 bg-mmorpg-success/10 text-mmorpg-successLight",
        warning: "border-mmorpg-warning/40 bg-mmorpg-warning/10 text-mmorpg-warningLight",
        danger: "border-mmorpg-danger/40 bg-mmorpg-danger/10 text-mmorpg-dangerLight",
        teal: "border-mmorpg-teal/40 bg-mmorpg-teal/10 text-mmorpg-teal",
        purple: "border-mmorpg-purple/40 bg-mmorpg-purple/10 text-mmorpg-purpleLight",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
