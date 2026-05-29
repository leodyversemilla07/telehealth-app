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
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Send,
  Settings,
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
      url: "/doctor/dashboard",
      icon: <LayoutDashboard />,
      isActive: true,
    },
    {
      title: "Consultations",
      url: "/doctor/consultations",
      icon: <ClipboardList />,
    },
    {
      title: "Patients",
      url: "/doctor/patients",
      icon: <Users />,
    },
    {
      title: "Medical Records",
      url: "/doctor/records",
      icon: <FileText />,
    },
    {
      title: "Schedule",
      url: "/doctor/schedule",
      icon: <CalendarDays />,
    },
    {
      title: "Profile",
      url: "/doctor/settings/profile",
      icon: <Settings />,
    },
  ],
  navSecondary: [
    { title: "Support", url: "#", icon: <LifeBuoy /> },
    { title: "Feedback", url: "#", icon: <Send /> },
  ],
}

export function SidebarDoctor({
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
            <SidebarMenuButton
              size="lg"
              render={<a href="/doctor/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Stethoscope className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Doctor</span>
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
