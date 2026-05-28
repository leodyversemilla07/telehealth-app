"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Users } from "lucide-react"
import Link from "next/link"

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Doctor Patients</h1>
        <p className="text-muted-foreground">
          Patient lists are derived from your consultation appointments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            My Active Patients
          </CardTitle>
          <CardDescription>
            Open your consultations to view patient details and records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href="/doctor/consultations" />}
            size="sm"
          >
            View consultations
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
