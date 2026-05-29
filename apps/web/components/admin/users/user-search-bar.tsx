"use client"

import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Search } from "lucide-react"

interface UserSearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  totalCount: number
  filteredCount: number
}

export function UserSearchBar({
  searchQuery,
  setSearchQuery,
  totalCount,
  filteredCount,
}: UserSearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border/40 rounded-xl p-4 shadow-sm">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-muted/20"
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
        <span>
          Total users: <strong className="text-foreground">{totalCount}</strong>
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span>
          Filtered: <strong className="text-foreground">{filteredCount}</strong>
        </span>
      </div>
    </div>
  )
}
