import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

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

    try {
      return await this.prisma.review.create({
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
    } catch (err: unknown) {
      // Handle race condition: two concurrent requests both pass the check above
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "P2002"
      ) {
        throw new ConflictException(
          "You have already reviewed this appointment",
        )
      }
      throw err
    }
  }

  /**
   * Get all reviews for a doctor (public).
   */
  async getDoctorReviews(doctorId: string, limit = 50, offset = 0) {
    const where = { doctorId }
    const [items, total, agg] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ])

    return {
      items,
      total,
      limit,
      offset,
      averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
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
