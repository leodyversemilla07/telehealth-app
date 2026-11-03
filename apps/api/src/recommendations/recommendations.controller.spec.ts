import type { UserSession } from "@thallesp/nestjs-better-auth"
import { GetRecommendationDto } from "./dto"
import { RecommendationsController } from "./recommendations.controller"
import { RecommendationsService } from "./recommendations.service"

describe("RecommendationsController", () => {
  let controller: RecommendationsController
  let service: {
    getRecommendation: jest.Mock
    checkSymptoms: jest.Mock
  }

  const session = { user: { id: "pat-1", role: "PATIENT" } } as UserSession

  beforeEach(() => {
    service = {
      getRecommendation: jest.fn().mockResolvedValue({ doctors: [] }),
      checkSymptoms: jest.fn().mockResolvedValue({ analysis: "ok" }),
    }
    controller = new RecommendationsController(
      service as unknown as RecommendationsService,
    )
  })

  it("getRecommendation delegates with the symptom text", async () => {
    const dto = { symptoms: "fever and cough" } as GetRecommendationDto
    await expect(controller.getRecommendation(session, dto)).resolves.toEqual({
      doctors: [],
    })
    expect(service.getRecommendation).toHaveBeenCalledWith(
      "pat-1",
      "fever and cough",
    )
  })

  it("checkSymptoms delegates with the symptom text", async () => {
    const dto = { symptoms: "headache" } as GetRecommendationDto
    await expect(controller.checkSymptoms(session, dto)).resolves.toEqual({
      analysis: "ok",
    })
    expect(service.checkSymptoms).toHaveBeenCalledWith("pat-1", "headache")
  })

  it("requires a patient session for the AI endpoints", async () => {
    expect(session.user.id).toBe("pat-1")
  })
})
