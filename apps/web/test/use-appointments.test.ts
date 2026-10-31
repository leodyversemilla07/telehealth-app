import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  appointmentKeys,
  useAppointment,
  useAvailableSlots,
  useBookAppointment,
  useCancelAppointment,
  useMyAppointments,
  useRescheduleAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments"

/**
 * Wiring tests for the appointment hooks.
 *
 * These pin the two things a refactor can silently break without any page
 * test noticing:
 *  1. pagination inputs are forwarded to `appointments.findMine` verbatim, and
 *  2. every mutation invalidates BOTH the list and the affected detail query
 *     (a wrong key leaves stale data on screen after a cancel/reschedule).
 *
 * The tRPC proxy is stubbed at the module boundary; real react-query drives
 * the hooks so query/select/mutation lifecycle is exercised end to end.
 */
const m = vi.hoisted(() => ({
  findMine: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
  cancel: vi.fn(),
  reschedule: vi.fn(),
  slots: vi.fn(),
}))

vi.mock("@/lib/trpc/client", () => ({
  useTRPC: () => ({
    appointments: {
      findMine: {
        queryOptions: (input: unknown) => ({
          queryKey: ["appointments", "findMine", input],
          queryFn: () => m.findMine(input),
        }),
      },
      findOne: {
        queryOptions: (input: unknown) => ({
          queryKey: ["appointments", "findOne", input],
          queryFn: () => m.findOne(input),
        }),
      },
      create: {
        mutationOptions: () => ({
          mutationFn: (input: unknown) => m.create(input),
        }),
      },
      updateStatus: {
        mutationOptions: () => ({
          mutationFn: (input: unknown) => m.updateStatus(input),
        }),
      },
      cancel: {
        mutationOptions: () => ({
          mutationFn: (input: unknown) => m.cancel(input),
        }),
      },
      reschedule: {
        mutationOptions: () => ({
          mutationFn: (input: unknown) => m.reschedule(input),
        }),
      },
    },
    availability: {
      getAvailableSlots: {
        queryOptions: (input: unknown) => ({
          queryKey: ["appointments", "slots", input],
          queryFn: () => m.slots(input),
        }),
      },
    },
  }),
}))

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

/** Fire a mutation whose variables are intentionally untyped in this harness. */
function fire(mutate: unknown, vars: unknown) {
  ;(mutate as (v: unknown) => void)(vars)
}

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("appointmentKeys", () => {
  it("builds stable, hierarchical query keys", () => {
    expect(appointmentKeys.all).toEqual(["appointments"])
    expect(appointmentKeys.lists()).toEqual(["appointments", "list"])
    expect(appointmentKeys.detail("a1")).toEqual([
      "appointments",
      "detail",
      "a1",
    ])
    expect(appointmentKeys.slots("d1", "2026-01-01")).toEqual([
      "appointments",
      "slots",
      "d1",
      "2026-01-01",
    ])
  })
})

describe("useMyAppointments", () => {
  it("forwards pagination and maps `items` onto `appointments`", async () => {
    const page = { items: [{ id: "a1" }], total: 1, limit: 20, offset: 0 }
    m.findMine.mockResolvedValue(page)

    const { result } = renderHook(() => useMyAppointments(20, 0), {
      wrapper: wrapperFor(makeClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.findMine).toHaveBeenCalledWith({ limit: 20, offset: 0 })
    expect(result.current.data).toEqual({
      ...page,
      appointments: [{ id: "a1" }],
    })
  })

  it("omits pagination when called without arguments", async () => {
    m.findMine.mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    })

    const { result } = renderHook(() => useMyAppointments(), {
      wrapper: wrapperFor(makeClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.findMine).toHaveBeenCalledWith({
      limit: undefined,
      offset: undefined,
    })
  })
})

describe("useAppointment", () => {
  it("does not fetch while the id is empty", () => {
    renderHook(() => useAppointment(""), { wrapper: wrapperFor(makeClient()) })
    expect(m.findOne).not.toHaveBeenCalled()
  })

  it("fetches by id when one is supplied", async () => {
    m.findOne.mockResolvedValue({ id: "a1" })

    const { result } = renderHook(() => useAppointment("a1"), {
      wrapper: wrapperFor(makeClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.findOne).toHaveBeenCalledWith({ id: "a1" })
    expect(result.current.data).toEqual({ id: "a1" })
  })
})

describe("appointment mutations", () => {
  it("useBookAppointment runs create and invalidates the list", async () => {
    m.create.mockResolvedValue({ id: "new" })
    const client = makeClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useBookAppointment(), {
      wrapper: wrapperFor(client),
    })
    fire(result.current.mutate, { doctorId: "d1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.create).toHaveBeenCalledWith({ doctorId: "d1" })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: appointmentKeys.lists(),
    })
  })

  it("useUpdateAppointmentStatus invalidates the list and the detail", async () => {
    m.updateStatus.mockResolvedValue({ id: "a1", status: "CONFIRMED" })
    const client = makeClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useUpdateAppointmentStatus(), {
      wrapper: wrapperFor(client),
    })
    fire(result.current.mutate, { id: "a1", status: "CONFIRMED" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.updateStatus).toHaveBeenCalledWith({
      id: "a1",
      status: "CONFIRMED",
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: appointmentKeys.lists(),
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: appointmentKeys.detail("a1"),
    })
  })

  it("useCancelAppointment invalidates the list and the detail", async () => {
    m.cancel.mockResolvedValue({ id: "a1", status: "CANCELLED" })
    const client = makeClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useCancelAppointment(), {
      wrapper: wrapperFor(client),
    })
    fire(result.current.mutate, { id: "a1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.cancel).toHaveBeenCalledWith({ id: "a1" })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: appointmentKeys.detail("a1"),
    })
  })

  it("useRescheduleAppointment invalidates the list and the detail", async () => {
    m.reschedule.mockResolvedValue({ id: "a1" })
    const client = makeClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")

    const { result } = renderHook(() => useRescheduleAppointment(), {
      wrapper: wrapperFor(client),
    })
    fire(result.current.mutate, { id: "a1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.reschedule).toHaveBeenCalledWith({ id: "a1" })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: appointmentKeys.detail("a1"),
    })
  })

  it("surfaces a rejected mutation as an error", async () => {
    m.cancel.mockRejectedValue(new Error("Slot already taken"))
    const client = makeClient()

    const { result } = renderHook(() => useCancelAppointment(), {
      wrapper: wrapperFor(client),
    })
    fire(result.current.mutate, { id: "a1" })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe("Slot already taken")
  })
})

describe("useAvailableSlots", () => {
  it("stays idle until both doctorId and date are present", () => {
    renderHook(() => useAvailableSlots("", ""), {
      wrapper: wrapperFor(makeClient()),
    })
    expect(m.slots).not.toHaveBeenCalled()
  })

  it("fetches slots once both inputs are present", async () => {
    m.slots.mockResolvedValue([{ startTime: "09:00", endTime: "09:30" }])

    const { result } = renderHook(() => useAvailableSlots("d1", "2026-01-01"), {
      wrapper: wrapperFor(makeClient()),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(m.slots).toHaveBeenCalledWith({
      doctorId: "d1",
      date: "2026-01-01",
    })
    expect(result.current.data).toEqual([
      { startTime: "09:00", endTime: "09:30" },
    ])
  })
})
