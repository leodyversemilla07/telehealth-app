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
  FileText,
  History,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Stethoscope,
  Users,
} from "lucide-react"
import Image from "next/image"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

const data = {
  overview: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: <FileText />,
    },
  ],
  management: [
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
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: <History />,
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
  role = "admin",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
  onLogout?: () => void
  role?: "patient" | "doctor" | "admin"
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/admin/dashboard" />}>
              <Image
                src="/logo.png"
                alt="Telehealth"
                width={32}
                height={32}
                className="size-8 rounded-lg object-cover"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Telehealth</span>
                <span className="truncate text-xs">Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.overview} label="Overview" />
        <NavMain items={data.management} label="Management" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}
