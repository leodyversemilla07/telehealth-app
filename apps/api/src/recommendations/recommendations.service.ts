import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@/prisma/prisma.service"

const SYSTEM_PROMPT = `You are a medical specialty classifier. Given patient symptoms or healthcare needs, respond ONLY with a JSON array of relevant medical specialties from this list: General Practice, Internal Medicine, Cardiology, Dermatology, Pediatrics, Obstetrics and Gynecology, Ophthalmology, Otolaryngology (ENT), Orthopedics, Neurology, Psychiatry, Pulmonology, Gastroenterology, Urology, Oncology, Radiology, Anesthesiology, Emergency Medicine, Family Medicine. Example response: ["Cardiology", "Internal Medicine"]`

const SYMPTOM_CHECKER_PROMPT = `You are a medical symptom analyzer. Given patient symptoms, respond with a JSON object containing:
1. "possibleConditions": array of possible conditions with name and likelihood (high/medium/low)
2. "severity": overall severity assessment (low/moderate/high/urgent)
3. "recommendedAction": what the patient should do
4. "specialties": relevant medical specialties to consult

Example response:
{
  "possibleConditions": [
    {"name": "Common Cold", "likelihood": "high"},
    {"name": "Influenza", "likelihood": "medium"},
    {"name": "COVID-19", "likelihood": "low"}
  ],
  "severity": "low",
  "recommendedAction": "Rest, stay hydrated, and monitor symptoms. If symptoms worsen or persist for more than a week, consult a doctor.",
  "specialties": ["General Practice", "Internal Medicine"]
}

IMPORTANT: Only respond with the JSON object, no other text.`

const PRIMARY_MODEL = "nvidia/nemotron-3-super-120b-a12b"
const FALLBACK_MODEL = "qwen/qwen3.5-122b-a10b"
const NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Get AI-powered doctor recommendations based on patient symptoms.
   * 1. Calls NVIDIA NIM to map symptoms → medical specialties
   * 2. Queries the database for approved doctors matching those specialties
   * 3. Returns both the identified specialties and matching doctors
   */
  async getRecommendation(symptoms: string) {
    const specialties = await this.mapSymptomsToSpecialties(symptoms)

    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        isApproved: true,
        specialty: { in: specialties },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return { specialties, doctors }
  }

  /**
   * AI Symptom Checker - provides detailed analysis of symptoms.
   */
  async checkSymptoms(symptoms: string) {
    const apiKey = this.config.get<string>("NIM_API_KEY")

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "NVIDIA NIM API key is not configured",
      )
    }

    // Try primary model, then fallback
    for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const result = await this.callNimApiSymptoms(apiKey, model, symptoms)
        if (result) {
          // Find matching doctors
          const specialties = Array.isArray(result.specialties)
            ? result.specialties.filter(
                (s): s is string => typeof s === "string",
              )
            : []
          const doctors = await this.prisma.doctorProfile.findMany({
            where: {
              isApproved: true,
              specialty: { in: specialties },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          })

          return { ...result, specialties, doctors }
        }
        this.logger.warn(
          `Model ${model} returned empty result, trying fallback`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`NIM API call failed for model ${model}: ${message}`)
      }
    }

    throw new ServiceUnavailableException(
      "Unable to analyze symptoms at this time. Both primary and fallback models are unavailable.",
    )
  }

  /**
   * Call NIM API for symptom analysis.
   */
  private async callNimApiSymptoms(
    apiKey: string,
    model: string,
    symptoms: string,
  ): Promise<Record<string, unknown> | null> {
    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYMPTOM_CHECKER_PROMPT },
          { role: "user", content: `Patient symptoms: ${symptoms}` },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `NIM API returned ${response.status}: ${body.slice(0, 200)}`,
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("Empty response content from NIM API")
    }

    return this.parseSymptomResponse(content)
  }

  /**
   * Parse symptom checker response.
   */
  private parseSymptomResponse(
    content: string,
  ): Record<string, unknown> | null {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()

    try {
      const parsed = JSON.parse(cleaned)
      if (typeof parsed === "object" && parsed !== null) {
        return parsed
      }
      return null
    } catch {
      this.logger.warn(`Failed to parse symptom response: ${cleaned}`)
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          return JSON.parse(match[0])
        } catch {
          // Failed
        }
      }
      return null
    }
  }

  /**
   * Call NVIDIA NIM chat completions (OpenAI-compatible) to classify symptoms.
   * Tries primary model first, falls back to secondary model on failure.
   */
  private async mapSymptomsToSpecialties(symptoms: string): Promise<string[]> {
    const apiKey = this.config.get<string>("NIM_API_KEY")

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "NVIDIA NIM API key is not configured",
      )
    }

    // Try primary model, then fallback
    for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const specialties = await this.callNimApi(apiKey, model, symptoms)
        if (specialties.length > 0) {
          return specialties
        }
        this.logger.warn(
          `Model ${model} returned empty specialties, trying fallback`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`NIM API call failed for model ${model}: ${message}`)
      }
    }

    throw new ServiceUnavailableException(
      "Unable to get AI recommendations at this time. Both primary and fallback models are unavailable.",
    )
  }

  /**
   * Make a single call to the NVIDIA NIM chat completions endpoint
   * and parse the response into a specialties array.
   */
  private async callNimApi(
    apiKey: string,
    model: string,
    symptoms: string,
  ): Promise<string[]> {
    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: symptoms },
        ],
        temperature: 0.2,
        max_tokens: 256,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `NIM API returned ${response.status}: ${body.slice(0, 200)}`,
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("Empty response content from NIM API")
    }

    return this.parseSpecialtiesResponse(content)
  }

  /**
   * Parse the LLM response content into a specialties array.
   * Handles potential markdown code fences and extra whitespace.
   */
  private parseSpecialtiesResponse(content: string): string[] {
    // Strip markdown code fences if present (e.g., ```json ... ```)
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()

    try {
      const parsed = JSON.parse(cleaned)

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      }

      this.logger.warn("NIM response was valid JSON but not an array")
      return []
    } catch {
      this.logger.warn(`Failed to parse NIM response as JSON: ${cleaned}`)
      // Attempt to extract a JSON array from the content using regex
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const extracted = JSON.parse(match[0])
          if (Array.isArray(extracted)) {
            return extracted.filter(
              (item): item is string =>
                typeof item === "string" && item.length > 0,
            )
          }
        } catch {
          // Regex extraction also failed
        }
      }
      return []
    }
  }
}
