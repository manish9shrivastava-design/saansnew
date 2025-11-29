'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, PlusSquare, Table2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';

const navItems = [
  { href: '/schema', label: 'Schema Definition', icon: ListChecks },
  { href: '/data-entry', label: 'Data Entry', icon: PlusSquare },
  { href: '/data-viewer', label: 'Data Viewer', icon: Table2 },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const activeItem = navItems.find((item) => pathname.startsWith(item.href));
    return activeItem ? activeItem.label : 'Dashboard';
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2.5">
            <AppLogo />
            <span className="font-headline text-lg font-semibold">Tabular Data</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter/>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="shrink-0" />
          <h1 className="flex-1 text-xl font-semibold font-headline tracking-tight">
            {getPageTitle()}
          </h1>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
