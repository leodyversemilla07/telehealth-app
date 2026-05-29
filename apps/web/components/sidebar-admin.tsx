"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  Activity,
  FileText,
  History,
  LifeBuoy,
  Send,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <Activity />,
      isActive: true,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: <Users />,
    },
    {
      title: "Doctors",
      url: "/admin/doctors",
      icon: <Stethoscope />,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: <FileText />,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: <History />,
    },
    {
      title: "Settings",
      url: "/admin/settings/profile",
      icon: <Settings />,
    },
  ],
  navSecondary: [
    { title: "Support", url: "#", icon: <LifeBuoy /> },
    { title: "Feedback", url: "#", icon: <Send /> },
  ],
}

export function SidebarAdmin({
  user,
  onLogout,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
  onLogout?: () => void
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/admin/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Shield className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Admin</span>
                <span className="truncate text-xs">Telehealth Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
