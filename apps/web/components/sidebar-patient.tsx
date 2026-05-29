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
  CalendarPlus,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  Send,
  Settings,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/patient/dashboard",
      icon: <LayoutDashboard />,
      isActive: true,
    },
    {
      title: "Find Doctors",
      url: "/patient/appointments/book",
      icon: <Stethoscope />,
    },
    {
      title: "AI Recommendations",
      url: "/patient/recommendations",
      icon: <Sparkles />,
    },
    {
      title: "Appointments",
      url: "/patient/appointments",
      icon: <CalendarPlus />,
    },
    {
      title: "Messages",
      url: "/patient/messages",
      icon: <MessageSquareText />,
    },
    {
      title: "Medical Records",
      url: "/patient/records",
      icon: <ClipboardList />,
    },
    {
      title: "Prescriptions",
      url: "/patient/prescriptions",
      icon: <FileText />,
    },
    {
      title: "Profile",
      url: "/patient/settings/profile",
      icon: <Settings />,
    },
  ],
  navSecondary: [
    { title: "Support", url: "#", icon: <LifeBuoy /> },
    { title: "Feedback", url: "#", icon: <Send /> },
  ],
}

export function SidebarPatient({
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
              render={<a href="/patient/dashboard" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <UserRound className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Patient</span>
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
