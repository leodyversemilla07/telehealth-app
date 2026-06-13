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
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Send,
  Users,
} from "lucide-react"
import Image from "next/image"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

const data = {
  practice: [
    {
      title: "Dashboard",
      url: "/doctor/dashboard",
      icon: <LayoutDashboard />,
    },
    {
      title: "Consultations",
      url: "/doctor/consultations",
      icon: <ClipboardList />,
    },
    {
      title: "Schedule",
      url: "/doctor/schedule",
      icon: <CalendarDays />,
    },
  ],
  patients: [
    {
      title: "Patients",
      url: "/doctor/patients",
      icon: <Users />,
    },
    {
      title: "Messages",
      url: "/doctor/chat",
      icon: <MessageSquare />,
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
  role = "doctor",
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
              render={
                <a href="/doctor/dashboard">
                  <span className="sr-only">Doctor dashboard</span>
                </a>
              }
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
        <NavMain items={data.practice} label="Practice" />
        <NavMain items={data.patients} label="Patient Care" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} role={role} />
      </SidebarFooter>
    </Sidebar>
  )
}
