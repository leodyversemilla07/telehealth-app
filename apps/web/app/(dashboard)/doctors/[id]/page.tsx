"use client"

import type { DoctorProfileDto } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Clock,
  HeartPulse,
  MapPin,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDoctor } from "@/hooks/use-doctors"

function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`
}

function DoctorAvatar({ doctor }: { doctor: DoctorProfileDto }) {
  const name = doctor.user.name || "Doctor"
  const imageUrl = doctor.user.image

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={96}
        height={96}
        className="h-24 w-24 rounded-full object-cover"
      />
    )
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
      {initials}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-16 w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="space-y-3">
            <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-52 animate-pulse rounded bg-muted" />
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-5 w-56 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-72 animate-pulse rounded bg-muted" />
          </div>

          <div className="h-px w-full bg-muted" />

          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </CardContent>

        <CardFooter>
          <div className="h-11 w-full animate-pulse rounded bg-muted" />
        </CardFooter>
      </Card>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/doctors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Doctors
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <HeartPulse className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Doctor Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The doctor profile you are looking for does not exist or has been
            removed.
          </p>
          <Link href="/doctors" className="mt-6">
            <Button>Browse Doctors</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: doctor, isLoading, isError } = useDoctor(id)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError || !doctor) {
    return <NotFoundState />
  }

  const doctorName = doctor.user.name || "Doctor"

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/doctors")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctors
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-6">
          <DoctorAvatar doctor={doctor} />
          <div>
            <CardTitle className="text-2xl">{doctorName}</CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="secondary" className="text-sm">
                <HeartPulse className="mr-1 h-3.5 w-3.5" />
                {doctor.specialty}
              </Badge>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bio */}
          {doctor.bio && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                About
              </h3>
              <p className="text-sm leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          <Separator />

          {/* Credentials */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Credentials
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">PRC License:</span>
                <span className="font-medium">{doctor.prcLicenseNumber}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">License Expiry:</span>
                <span className="font-medium">
                  {new Date(doctor.prcLicenseExpiry).toLocaleDateString(
                    "en-PH",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </span>
              </li>
              {doctor.philhealthAccreditation && (
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground">
                    PhilHealth Accreditation:
                  </span>
                  <span className="font-medium">
                    {doctor.philhealthAccreditation}
                  </span>
                </li>
              )}
              {doctor.pdeaS2License && (
                <li className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground">
                    PDEA S2 License:
                  </span>
                  <span className="font-medium">{doctor.pdeaS2License}</span>
                </li>
              )}
            </ul>
          </div>

          <Separator />

          {/* Clinic Address */}
          {doctor.clinicAddress && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Clinic
              </h3>
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <span>{doctor.clinicAddress}</span>
              </p>
            </div>
          )}

          <Separator />

          {/* Consultation Fee */}
          {doctor.pricePerVisit != null && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Consultation Fee
              </h3>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(doctor.pricePerVisit)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  per visit
                </span>
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Link
            href={`/appointments/book?doctorId=${doctor.id}`}
            className="w-full"
          >
            <Button className="w-full" size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
