import * as React from "react";

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "flex h-10 w-full min-w-0 rounded-xl border border-input/85 bg-background/90 px-3 py-2 text-base text-foreground shadow-[0_10px_25px_-22px_rgba(15,23,42,0.8)] transition-[border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/85 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/35 focus-visible:ring-[3px]",
                "selection:bg-primary selection:text-primary-foreground",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
