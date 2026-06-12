"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Calendar, ClipboardList, Clock, HeartPulse, User } from "lucide-react"
import { ErrorAlert } from "@/components/error-alert"
import { useMyAppointments } from "@/hooks/use-appointments"

export default function DoctorRecordsPage() {
  const { data, isPending, error } = useMyAppointments()
  const appointments = data?.appointments ?? []

  const completed = appointments.filter((a) => a.status === "COMPLETED")

  return (
    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Consultation Records
          </CardTitle>
          <CardDescription className="text-sm">
            Review your completed consultations, diagnoses, treatment plans, and
            prescriptions issued.
          </CardDescription>
        </CardHeader>
      </Card>

      {isPending && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Skeleton key={idx} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <ErrorAlert
          title="Failed to retrieve consultation records"
          description={
            error.message ||
            "An unexpected error occurred while communicating with the server."
          }
          className="my-12"
        />
      )}

      {!isPending && !error && completed.length === 0 && (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList className="h-4 w-4" />
            </EmptyMedia>
            <EmptyTitle>No completed consultations</EmptyTitle>
            <EmptyDescription>
              Your completed consultation records will appear here once you
              finish a session and file a clinical chart.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isPending && !error && completed.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {completed.map((appt) => {
            const visitDate = new Date(appt.startTime).toLocaleDateString(
              undefined,
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Manila",
              },
            )

            return (
              <Card
                key={appt.id}
                className="hover:shadow-md transition-all overflow-hidden relative group"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-success" />

                <CardHeader className="pb-3 pl-8">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className="text-xs text-success border-success/30 bg-success/10 font-bold uppercase py-0 leading-none mb-1"
                        >
                          Completed
                        </Badge>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {appt.patient?.name || "Patient"}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="bg-muted/30 border border-border/25 rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 w-fit shrink-0 font-medium text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {visitDate}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pl-8 pb-4 text-left">
                  <Separator className="bg-border/30 mb-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Scheduled Time
                        </span>
                        <p className="text-foreground font-medium text-sm">
                          {new Date(appt.startTime).toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: "Asia/Manila",
                            },
                          )}{" "}
                          &mdash;{" "}
                          {new Date(appt.endTime).toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: "Asia/Manila",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {appt.reason && (
                        <div className="bg-muted/20 border border-border/20 rounded-xl p-4 space-y-1">
                          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                            <HeartPulse className="h-3 w-3" /> Reason
                          </span>
                          <p className="text-foreground text-sm">
                            {appt.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {appt.symptoms && (
                    <div className="mt-4 space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        Patient Reported Symptoms
                      </span>
                      <div className="bg-muted/10 border border-border/20 rounded-xl p-3.5 text-sm leading-relaxed text-foreground italic">
                        &ldquo;{appt.symptoms}&rdquo;
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
