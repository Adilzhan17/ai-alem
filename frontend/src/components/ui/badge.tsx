import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow,border-color]",
    {
        variants: {
            variant: {
                default:
                    "border-primary/20 bg-primary/12 text-primary [a&]:hover:bg-primary/18",
                secondary:
                    "border-border/70 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/85",
                destructive:
                    "border-destructive/20 bg-destructive/12 text-destructive [a&]:hover:bg-destructive/18 focus-visible:ring-destructive/20",
                outline:
                    "border-border/80 text-foreground [a&]:hover:border-primary/20 [a&]:hover:bg-accent/60 [a&]:hover:text-accent-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
