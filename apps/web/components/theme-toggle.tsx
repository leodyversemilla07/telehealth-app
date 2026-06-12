"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({
  variant = "ghost",
  size = "default",
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  function cycleTheme() {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  function getIcon() {
    if (theme === "light") return <Sun className="size-4" />
    if (theme === "dark") return <Moon className="size-4" />
    return <Monitor className="size-4" />
  }

  function getLabel() {
    if (theme === "light") return "Light"
    if (theme === "dark") return "Dark"
    return "System"
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={cycleTheme}
      className={cn("gap-2", className)}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </Button>
  )
}

export function ThemeRadioGroup() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="flex gap-2">
      {themes.map((t) => {
        const Icon = t.icon
        const isActive = theme === t.value

        return (
          <Button
            key={t.value}
            variant="outline"
            type="button"
            onClick={() => setTheme(t.value)}
            className={`h-auto flex-col gap-2 rounded-xl border-2 p-4 ${
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{t.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
