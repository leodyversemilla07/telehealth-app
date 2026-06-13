import { Button } from "@workspace/ui/components/button"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function DoctorNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mx-auto">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist in the Doctor
            Workspace.
          </p>
        </div>
        <Button render={<Link href="/doctor/dashboard" />} className="gap-2">
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
