"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CalendarDays, ClipboardList, Video } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export default function DoctorDashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return

    const role = (session?.user as { role?: string } | undefined)?.role

    if (!session) {
      router.replace("/sign-in")
      return
    }

    if (role === "PATIENT") {
      router.replace("/patient/dashboard")
      return
    }

    if (role === "ADMIN") {
      router.replace("/admin/dashboard")
    }
  }, [isPending, router, session])

  if (isPending || !session) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Track consultations, schedules, and active patient appointments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Appointment Queue
            </CardTitle>
            <CardDescription>
              Review and manage today’s consultations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/consultations" />}
              size="sm"
            >
              Open consultations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4" />
              Video Consults
            </CardTitle>
            <CardDescription>
              Join secure live consultations directly from appointment details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/consultations" />}
              size="sm"
              variant="secondary"
            >
              Join a consultation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Patient Notes
            </CardTitle>
            <CardDescription>
              Document diagnoses, treatment plans, and prescriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/doctor/patients" />}
              size="sm"
              variant="outline"
            >
              Open patient list
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
