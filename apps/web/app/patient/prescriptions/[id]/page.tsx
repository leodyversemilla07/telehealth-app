"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function PrescriptionDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prescription #{id}</CardTitle>
          <CardDescription>
            Prescription details will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href="/patient/prescriptions" />}
            size="sm"
            variant="outline"
          >
            Back to prescriptions
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
