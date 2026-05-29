"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

const LABEL_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  book: "Book Appointment",
  symptoms: "Symptom Checker",
  chat: "Messages",
  messages: "Messages",
  prescriptions: "Prescriptions",
  recommendations: "AI Recommendations",
  records: "Medical Records",
  consultations: "Consultations",
  patients: "Patients",
  schedule: "Schedule",
  register: "Join as Doctor",
  users: "Users",
  doctors: "Doctors",
  reports: "Reports",
  "audit-logs": "Audit Logs",
  settings: "Settings",
  profile: "Profile",
  password: "Password",
  sessions: "Sessions",
  "two-factor": "Two-Factor Authentication",
  appearance: "Appearance",
  alerts: "Alerts",
  health: "Health Information",
  professional: "Professional Info",
}

const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  appointments: "Appointment Details",
  consultations: "Consultation",
  prescriptions: "Prescription Details",
}

const STANDALONE_SEGMENTS: Record<string, string> = {
  book: "book",
  chat: "chat",
}

export function DynamicBreadcrumbs({ rootLabel }: { rootLabel: string }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const role = segments[0]
  const items: { label: string; href: string }[] = [
    { label: rootLabel, href: `/${role}/dashboard` },
  ]

  let currentPath = `/${role}`

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    if (!segment || segment === "dashboard") continue

    const isDynamic = /^[0-9a-f]{8,}/.test(segment) || /^\d+$/.test(segment)

    if (isDynamic) {
      const parentSegment = segments[i - 1] ?? ""
      items.push({
        label: DYNAMIC_SEGMENT_LABELS[parentSegment] || "Details",
        href: currentPath,
      })
    } else {
      const isStandalone = !!STANDALONE_SEGMENTS[segment]
      if (isStandalone) {
        const lastIdx = items.length - 1
        if (lastIdx >= 0) {
          items[lastIdx] = {
            label: LABEL_MAP[segment] || items[lastIdx]!.label,
            href: currentPath,
          }
        }
      } else {
        items.push({
          label:
            LABEL_MAP[segment] ||
            segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
          href: currentPath,
        })
      }
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.flatMap((item, index) => {
          const content =
            index === items.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Link href={item.href} />}>
                {item.label}
              </BreadcrumbLink>
            )
          return index === 0
            ? [<BreadcrumbItem key={item.href}>{content}</BreadcrumbItem>]
            : [
                <BreadcrumbSeparator key={`sep-${index}`} />,
                <BreadcrumbItem key={item.href}>{content}</BreadcrumbItem>,
              ]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
