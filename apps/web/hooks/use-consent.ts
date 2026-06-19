"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface ConsentLog {
  id: string
  userId: string
  consentType: string
  granted: boolean
  ipAddress: string | null
  createdAt: string
}

export const consentKeys = {
  all: ["consent"] as const,
  logs: () => [...consentKeys.all, "logs"] as const,
}

const CONSENT_TYPES = [
  {
    id: "privacy_policy",
    label: "Privacy Policy",
    description:
      "Agree to the processing of personal data in accordance with the Data Privacy Act (RA 10173)",
  },
  {
    id: "data_sharing",
    label: "Data Sharing",
    description:
      "Share medical data with healthcare providers for treatment, diagnosis, and care coordination",
  },
  {
    id: "recording",
    label: "Consultation Recording",
    description:
      "Allow recording of video/audio consultations for medical documentation and quality assurance",
  },
  {
    id: "marketing",
    label: "Marketing Communications",
    description:
      "Receive promotional materials, health tips, and platform updates via email or SMS",
  },
] as const

export type ConsentType = (typeof CONSENT_TYPES)[number]["id"]

export function useConsentLogs() {
  return useQuery({
    queryKey: consentKeys.logs(),
    queryFn: () => apiClient.get<ConsentLog[]>("/consent"),
  })
}

export function useRecordConsent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { consentType: ConsentType; granted: boolean }) =>
      apiClient.post<ConsentLog, typeof data>("/consent", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consentKeys.logs() })
    },
  })
}

/**
 * Get the latest status for each consent type from the logs.
 * Returns a map of consentType → granted boolean, defaulting to false.
 */
export function useConsentStatus() {
  const { data: logs = [] } = useConsentLogs()

  const status: Record<string, boolean> = {}
  for (const type of CONSENT_TYPES) {
    const latest = logs
      .filter((log) => log.consentType === type.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
    status[type.id] = latest?.granted ?? false
  }

  return status
}

export { CONSENT_TYPES }
