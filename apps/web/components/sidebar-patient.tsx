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
  Brain,
  CalendarPlus,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Send,
  Stethoscope,
} from "lucide-react"
import Image from "next/image"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

const data = {
  overview: [
    {
      title: "Dashboard",
      url: "/patient/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      title: "Book Appointment",
      url: "/patient/appointments/book",
      icon: <CalendarPlus />,
    },
    {
      title: "Appointments",
      url: "/patient/appointments",
      icon: <Stethoscope />,
    },
    {
      title: "Messages",
      url: "/patient/chat",
      icon: <MessageSquare />,
    },
  ],
  health: [
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
      title: "AI Symptom Checker",
      url: "/patient/symptoms",
      icon: <Brain />,
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
  role = "patient",
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
            <SidebarMenuButton
              size="lg"
              render={<a href="/patient/dashboard" />}
            >
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
        <NavMain items={data.health} label="Health Tools" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}
