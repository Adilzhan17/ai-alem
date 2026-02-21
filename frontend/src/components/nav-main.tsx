"use client"

import { Link, useLocation } from "react-router-dom"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "./ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "./ui/sidebar"

type NavItem = {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: Array<{
        title: string
        url: string
    }>
}

const normalizePath = (path: string) => {
    if (!path || path === "/") return "/"
    return path.endsWith("/") ? path.slice(0, -1) : path
}

const isRouteActive = (current: string, href: string) => {
    const normalizedCurrent = normalizePath(current)
    const normalizedHref = normalizePath(href)
    if (normalizedHref === "/") return normalizedCurrent === "/"
    return normalizedCurrent === normalizedHref || normalizedCurrent.startsWith(`${normalizedHref}/`)
}

export function NavMain({ items }: { items: NavItem[] }) {
    const location = useLocation()
    const pathname = location.pathname

    return (
        <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-qal-text-secondary/80">
                Навигация
            </SidebarGroupLabel>
            <SidebarMenu className="gap-2">
                {items.map((item) => {
                    const hasChildren = Boolean(item.items?.length)
                    const parentActive = hasChildren
                        ? item.items!.some((subItem) => isRouteActive(pathname, subItem.url))
                        : isRouteActive(pathname, item.url)

                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={parentActive}
                                    tooltip={item.title}
                                    className="h-11 rounded-xl border border-transparent bg-transparent px-3 font-semibold text-qal-text-primary hover:border-qal-border/80 hover:bg-white/85 hover:text-qal-primary data-[active=true]:border-qal-primary/30 data-[active=true]:bg-white data-[active=true]:text-qal-primary"
                                >
                                    <Link to={item.url}>
                                        {item.icon && (
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-qal-primary/10 text-qal-primary">
                                                <item.icon className="h-4 w-4" />
                                            </span>
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    }

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive || parentActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={parentActive}
                                        className="h-11 rounded-xl border border-transparent bg-transparent px-3 font-semibold text-qal-text-primary hover:border-qal-border/80 hover:bg-white/85 hover:text-qal-primary data-[active=true]:border-qal-primary/30 data-[active=true]:bg-white data-[active=true]:text-qal-primary"
                                    >
                                        {item.icon && (
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-qal-primary/10 text-qal-primary">
                                                <item.icon className="h-4 w-4" />
                                            </span>
                                        )}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub className="mx-5 mt-1 rounded-lg border-l border-qal-border/80 px-2 py-1">
                                        {item.items?.map((subItem) => {
                                            const subActive = isRouteActive(pathname, subItem.url)
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={subActive}
                                                        className="h-8 rounded-lg px-2 text-sm text-qal-text-secondary hover:bg-white hover:text-qal-primary data-[active=true]:bg-qal-primary/10 data-[active=true]:text-qal-primary"
                                                    >
                                                        <Link to={subItem.url}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}
