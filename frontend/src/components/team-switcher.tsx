"use client"

import { Link } from "react-router-dom"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "./ui/sidebar"

export function TeamSwitcher({
    teams,
}: {
    teams: {
        name: string
        plan: string
    }[]
}) {
    const activeTeam = teams[0]

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    size="lg"
                    className="h-auto rounded-2xl border border-qal-border/70 bg-qal-surface px-3 py-3 hover:bg-white data-[active=true]:bg-white"
                >
                    <Link to="/" className="gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-qal-primary text-sm font-bold text-white">
                            Q
                        </div>
                        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-['Sora'] text-lg font-semibold text-qal-text-primary">
                                Qal<span className="text-cyan-600">.ai</span>
                            </span>
                            <span className="truncate text-xs text-qal-text-secondary">{activeTeam.plan}</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
