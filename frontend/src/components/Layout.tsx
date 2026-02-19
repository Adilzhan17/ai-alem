import type { ReactNode } from 'react';
import AppLayout from './layout/AppLayout';

interface LayoutProps {
    children: ReactNode;
    activePage?: string;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}
