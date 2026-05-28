"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CalendarPlus, FileText, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

export default function PatientDashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return

    const role = (session?.user as { role?: string } | undefined)?.role

    if (!session) {
      router.replace("/sign-in")
      return
    }

    if (role === "DOCTOR") {
      router.replace("/doctor/dashboard")
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
        <h1 className="text-2xl font-bold tracking-tight">Patient Dashboard</h1>
        <p className="text-muted-foreground">
          Manage consultations, records, and next care steps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" />
              Book Appointment
            </CardTitle>
            <CardDescription>
              Find an available doctor and reserve a slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              onClick={() => router.push("/patient/appointments/book")}
            >
              Book now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4" />
              Find Doctors
            </CardTitle>
            <CardDescription>
              Browse approved doctors by specialty.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push("/patient/appointments/book")}
            >
              Browse doctors
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Medical Records
            </CardTitle>
            <CardDescription>
              Review your consultation history and prescriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/patient/prescriptions")}
            >
              Open records
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
