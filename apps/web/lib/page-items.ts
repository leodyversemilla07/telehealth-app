export type PageItem = number | "start-ellipsis" | "end-ellipsis"

/**
 * Page list for the shadcn Pagination: first + last page always shown,
 * current page with one neighbor on each side, ellipsis for gaps.
 */
export function getPageItems(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const items: PageItem[] = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  if (start > 2) items.push("start-ellipsis")
  for (let p = start; p <= end; p += 1) items.push(p)
  if (end < totalPages - 1) items.push("end-ellipsis")
  items.push(totalPages)
  return items
}
