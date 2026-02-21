"use client";

import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Globe, Sparkles } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLanguage } from "../../LanguageContext";

interface AppLayoutProps {
    children: React.ReactNode;
}

const prettifySegment = (segment: string) =>
    segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function AppLayout({ children }: AppLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    const pathSegments = useMemo(
        () => location.pathname.split("/").filter(Boolean),
        [location.pathname],
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/results?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <SidebarProvider className="app-shell-frame">
            <div className="app-shell-grid" />
            <div className="app-shell-glow teal" />
            <div className="app-shell-glow sky" />

            <AppSidebar />

            <SidebarInset className="bg-transparent">
                <header className="sticky top-0 z-30 px-3 pt-3 md:px-6 md:pt-5">
                    <div className="app-header-shell flex min-h-16 items-center gap-2 rounded-2xl px-3 py-2 md:px-4">
                        <div className="flex min-w-0 items-center gap-2">
                            <SidebarTrigger className="rounded-lg border border-border/70 bg-white/75 text-foreground hover:bg-white" />
                            <Separator orientation="vertical" className="mx-1 h-5 bg-border/70" />

                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink asChild>
                                            <Link to="/dashboard" className="font-medium text-muted-foreground hover:text-foreground">
                                                Qal.ai
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {pathSegments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                                    {pathSegments.map((segment, index) => {
                                        const isLast = index === pathSegments.length - 1;
                                        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                                        const label = prettifySegment(segment);

                                        return (
                                            <React.Fragment key={href}>
                                                <BreadcrumbItem>
                                                    {isLast ? (
                                                        <BreadcrumbPage className="font-semibold text-foreground">
                                                            {label}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink asChild className="hidden capitalize md:block">
                                                            <Link to={href}>{label}</Link>
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                                            </React.Fragment>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        <div className="ml-auto flex items-center gap-2 md:gap-3">
                            <form onSubmit={handleSearch} className="relative hidden w-full max-w-sm md:block">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search modules, listings, actions..."
                                    className="h-9 w-[220px] rounded-xl bg-white/80 pl-9 lg:w-[320px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl bg-white/85">
                                        <Globe className="h-4 w-4" />
                                        <span className="hidden text-xs md:inline">{language.toUpperCase()}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setLanguage("en")}>
                                        English {language === "en" && "✓"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage("ru")}>
                                        Русский {language === "ru" && "✓"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage("kk")}>
                                        Қазақша {language === "kk" && "✓"}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 flex-col px-3 pb-4 pt-3 md:px-6 md:pt-5">
                    <main className="app-content-shell app-page-shell app-scroll flex-1 overflow-auto p-3 md:p-6">
                        {children}
                    </main>

                    <footer className="app-footer-shell mt-4 flex items-center justify-between px-2 py-3 text-[11px] font-medium">
                        <p>Qal.ai Workspace</p>
                        <p className="hidden items-center gap-1 md:inline-flex">
                            <Sparkles className="h-3.5 w-3.5 text-qal-primary" />
                            Real estate orchestration platform
                        </p>
                    </footer>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
