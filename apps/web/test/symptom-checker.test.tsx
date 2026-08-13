import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: vi.fn() },
}))

vi.mock("@workspace/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

async function renderSymptomChecker() {
  const SymptomCheckerPage = (await import("@/app/patient/symptoms/page"))
    .default

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SymptomCheckerPage />
    </QueryClientProvider>,
  )
}

describe("SymptomCheckerPage", () => {
  it("renders the page title and description", async () => {
    await renderSymptomChecker()
    expect(screen.getByText("AI Symptom Checker")).toBeDefined()
  })

  it("renders the symptoms textarea", async () => {
    await renderSymptomChecker()
    const textarea = screen.getByPlaceholderText(
      /I've been experiencing a persistent headache/i,
    )
    expect(textarea).toBeDefined()
  })

  it("shows character count", async () => {
    await renderSymptomChecker()
    expect(screen.getByText("0/1000")).toBeDefined()
  })

  it("renders the analyze button", async () => {
    await renderSymptomChecker()
    expect(screen.getByText("Analyze Symptoms")).toBeDefined()
  })

  it("analyze button is disabled when textarea is empty", async () => {
    await renderSymptomChecker()
    const button = screen.getByText("Analyze Symptoms").closest("button")
    expect(button?.hasAttribute("disabled")).toBe(true)
  })

  it("analyze button becomes enabled when symptoms are typed", async () => {
    await renderSymptomChecker()
    const user = userEvent.setup()
    const textarea = screen.getByPlaceholderText(
      /I've been experiencing a persistent headache/i,
    )
    await user.type(textarea, "I have a headache")

    const button = screen.getByText("Analyze Symptoms").closest("button")
    expect(button?.hasAttribute("disabled")).toBe(false)
  })

  it("has a textarea with maxlength attribute", async () => {
    await renderSymptomChecker()
    const textarea = screen.getByPlaceholderText(
      /I've been experiencing a persistent headache/i,
    )
    expect(textarea.getAttribute("maxlength")).toBe("1000")
  })

  it("updates character count as user types", async () => {
    await renderSymptomChecker()
    const user = userEvent.setup()
    const textarea = screen.getByPlaceholderText(
      /I've been experiencing a persistent headache/i,
    )
    await user.type(textarea, "Hello")
    expect(screen.getByText("5/1000")).toBeDefined()
  })
})
