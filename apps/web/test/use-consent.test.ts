import { describe, expect, it } from "vitest"
import { CONSENT_TYPES } from "@/hooks/use-consent"

describe("Consent Hook", () => {
  describe("CONSENT_TYPES", () => {
    it("should have 4 consent types", () => {
      expect(CONSENT_TYPES).toHaveLength(4)
    })

    it("should have required fields for each consent type", () => {
      for (const type of CONSENT_TYPES) {
        expect(type).toHaveProperty("id")
        expect(type).toHaveProperty("label")
        expect(type).toHaveProperty("description")
        expect(typeof type.id).toBe("string")
        expect(typeof type.label).toBe("string")
        expect(typeof type.description).toBe("string")
        expect(type.id.length).toBeGreaterThan(0)
        expect(type.label.length).toBeGreaterThan(0)
        expect(type.description.length).toBeGreaterThan(0)
      }
    })

    it("should include privacy_policy consent type", () => {
      const privacyPolicy = CONSENT_TYPES.find((t) => t.id === "privacy_policy")
      expect(privacyPolicy).toBeDefined()
      expect(privacyPolicy?.label).toBe("Privacy Policy")
    })

    it("should include data_sharing consent type", () => {
      const dataSharing = CONSENT_TYPES.find((t) => t.id === "data_sharing")
      expect(dataSharing).toBeDefined()
      expect(dataSharing?.label).toBe("Data Sharing")
    })

    it("should include recording consent type", () => {
      const recording = CONSENT_TYPES.find((t) => t.id === "recording")
      expect(recording).toBeDefined()
      expect(recording?.label).toBe("Consultation Recording")
    })

    it("should include marketing consent type", () => {
      const marketing = CONSENT_TYPES.find((t) => t.id === "marketing")
      expect(marketing).toBeDefined()
      expect(marketing?.label).toBe("Marketing Communications")
    })

    it("should have unique IDs", () => {
      const ids = CONSENT_TYPES.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should have unique labels", () => {
      const labels = CONSENT_TYPES.map((t) => t.label)
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(labels.length)
    })
  })
})
