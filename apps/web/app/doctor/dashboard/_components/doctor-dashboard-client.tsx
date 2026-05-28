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

export function DoctorDashboardClient() {
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
