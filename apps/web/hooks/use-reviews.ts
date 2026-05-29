"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export interface Review {
  id: string
  patientId: string
  doctorId: string
  appointmentId: string
  rating: number
  comment: string | null
  createdAt: string
  patient: {
    id: string
    name: string | null
    image: string | null
  }
}

export interface DoctorReviewsResponse {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export const reviewKeys = {
  all: ["reviews"] as const,
  doctor: (doctorId: string) =>
    [...reviewKeys.all, "doctor", doctorId] as const,
  patient: () => [...reviewKeys.all, "patient"] as const,
  check: (appointmentId: string) =>
    [...reviewKeys.all, "check", appointmentId] as const,
}

export function useDoctorReviews(doctorId: string) {
  return useQuery({
    queryKey: reviewKeys.doctor(doctorId),
    queryFn: () =>
      apiClient.get<DoctorReviewsResponse>(`/reviews/doctor/${doctorId}`),
    enabled: !!doctorId,
  })
}

export function usePatientReviews() {
  return useQuery({
    queryKey: reviewKeys.patient(),
    queryFn: () => apiClient.get<Review[]>("/reviews/patient"),
  })
}

export function useCheckReview(appointmentId: string) {
  return useQuery({
    queryKey: reviewKeys.check(appointmentId),
    queryFn: () =>
      apiClient.get<{ hasReviewed: boolean; review: Review | null }>(
        `/reviews/check/${appointmentId}`,
      ),
    enabled: !!appointmentId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      appointmentId: string
      rating: number
      comment?: string
    }) =>
      apiClient.post<Review>(`/reviews/${data.appointmentId}`, {
        rating: data.rating,
        comment: data.comment,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.patient() })
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
    },
  })
}
