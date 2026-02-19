"use client";

import * as React from "react"; // Added React import since it's used implicitly in JSX
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

function AspectRatio({
    ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
    return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
