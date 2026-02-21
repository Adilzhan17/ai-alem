"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            className="toaster group"
            position="top-right"
            richColors
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-border/80 group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-[0_24px_45px_-28px_rgba(15,23,42,0.55)]",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:rounded-lg group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
