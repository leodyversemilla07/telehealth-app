"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import {
  Download,
  FileText,
  FolderClosed,
  Lock,
  type LucideIcon,
  Upload,
} from "lucide-react"
import { useRef, useState } from "react"
import {
  type MedicalDocumentDto,
  type MedicalDocumentType,
  useAppointmentDocuments,
  useUploadDocument,
} from "@/hooks/use-documents"

const TYPE_LABELS: Record<MedicalDocumentType, string> = {
  LAB_RESULT: "Lab Result",
  PRESCRIPTION: "Prescription",
  IMAGING: "Imaging",
  OTHER: "Other",
}

const ACCEPT = ".pdf,image/jpeg,image/png,image/webp"
const DEFAULT_MB = 10

const TYPE_ICONS: Record<MedicalDocumentType, LucideIcon> = {
  LAB_RESULT: FileText,
  PRESCRIPTION: FileText,
  IMAGING: FileText,
  OTHER: FileText,
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface MedicalDocumentsProps {
  appointmentId: string
  /** Whether the viewer may upload documents (patients + assigned doctor). */
  allowUpload?: boolean
  /** Custom description line (viewer-specific wording). */
  description?: string
}

export function MedicalDocumentsCard({
  appointmentId,
  allowUpload = false,
  description,
}: MedicalDocumentsProps) {
  const { data: docs = [], isPending } = useAppointmentDocuments(appointmentId)
  const upload = useUploadDocument()
  const [type, setType] = useState<MedicalDocumentType | "">("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownload = (doc: MedicalDocumentDto) => {
    // Same-origin cookie-authenticated download (proxied through the app).
    const a = document.createElement("a")
    a.href = doc.fileUrl
    a.download = doc.fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleUpload = () => {
    if (!file) {
      toast.add({ title: "Please choose a file to upload", type: "error" })
      return
    }
    if (file.size > DEFAULT_MB * 1024 * 1024) {
      toast.add({
        title: `File is too large. Max allowed size is ${DEFAULT_MB}MB.`,
        type: "error",
      })
      return
    }
    upload.mutate(
      { appointmentId, type: type || undefined, file },
      {
        onSuccess: () => {
          toast.add({
            title: "Document uploaded successfully",
            type: "success",
          })
          setFile(null)
          setType("")
          if (fileInputRef.current) fileInputRef.current.value = ""
        },
        onError: (err) => {
          toast.add({
            title: err.message || "Failed to upload document",
            type: "error",
          })
        },
      },
    )
  }

  return (
    <Card className="text-left">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderClosed className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold">
            Medical Documents
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {description ??
            "Private files shared for this consultation (lab results, prescriptions, imaging). Encrypted at rest in private storage — only you and your doctor can access them."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload */}
        {allowUpload && (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type" className="text-xs">
                  Document Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as MedicalDocumentType)}
                >
                  <SelectTrigger id="doc-type" className="h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as MedicalDocumentType[]).map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">File (max {DEFAULT_MB}MB)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground truncate max-w-full">
                {file ? file.name : "No file selected"}
              </p>
              <Button
                size="sm"
                className="h-9"
                onClick={handleUpload}
                disabled={upload.isPending || !file}
              >
                {upload.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 p-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            No documents have been shared for this consultation yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => {
              const Icon = TYPE_ICONS[doc.type] ?? FileText
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border/30 bg-card p-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[doc.type]} &middot;{" "}
                      {formatBytes(doc.sizeBytes)} &middot;{" "}
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
