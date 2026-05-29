import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a review for a completed appointment.
   * Only the patient who attended the appointment can leave a review.
   */
  async createReview(
    patientId: string,
    appointmentId: string,
    rating: number,
    comment?: string,
  ) {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5")
    }

    // Verify appointment exists and is completed
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { reviews: true },
    })

    if (!appointment) {
      throw new NotFoundException("Appointment not found")
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException("You can only review your own appointments")
    }

    if (appointment.status !== "COMPLETED") {
      throw new BadRequestException("Can only review completed appointments")
    }

    if (appointment.reviews.length > 0) {
      throw new ConflictException("You have already reviewed this appointment")
    }

    return this.prisma.review.create({
      data: {
        patientId,
        doctorId: appointment.doctorId,
        appointmentId,
        rating,
        comment: comment || null,
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    })
  }

  /**
   * Get all reviews for a doctor (public).
   */
  async getDoctorReviews(doctorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { doctorId },
      include: {
        patient: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    return {
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    }
  }

  /**
   * Get reviews given by the current patient.
   */
  async getPatientReviews(patientId: string) {
    return this.prisma.review.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  /**
   * Check if a patient has reviewed a specific appointment.
   */
  async hasReviewed(patientId: string, appointmentId: string) {
    const review = await this.prisma.review.findUnique({
      where: {
        patientId_appointmentId: { patientId, appointmentId },
      },
    })
    return { hasReviewed: !!review, review }
  }
}
