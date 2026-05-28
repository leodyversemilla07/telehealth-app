"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Reports</h1>
        <p className="text-muted-foreground">
          Reporting dashboards can be integrated here (appointments,
          utilization, and compliance).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports module scaffolded</CardTitle>
          <CardDescription>
            Connect analytics endpoints to populate this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No report widgets configured yet.
        </CardContent>
      </Card>
    </div>
  )
}
