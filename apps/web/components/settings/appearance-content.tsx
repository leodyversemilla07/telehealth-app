"use client"

import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Monitor, Moon, Palette, Sun } from "lucide-react"

export function AppearanceContent() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks on your device
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="size-4" />
          <span>Theme preference is saved locally in your browser</span>
        </div>

        <Tabs
          value={theme || "system"}
          onValueChange={(value) => setTheme(value)}
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="light" className="gap-2">
              <Sun className="size-4" />
              Light
            </TabsTrigger>
            <TabsTrigger value="dark" className="gap-2">
              <Moon className="size-4" />
              Dark
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Monitor className="size-4" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background border border-border">
                  <Sun className="size-5 text-foreground" />
                </div>
                <div>
                  <div className="font-medium">Light Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Bright and clean interface, ideal for daytime use
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dark" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background border border-border">
                  <Moon className="size-5 text-foreground" />
                </div>
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">
                    Easy on the eyes in low light environments
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background border border-border">
                  <Monitor className="size-5 text-foreground" />
                </div>
                <div>
                  <div className="font-medium">System</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically match your device&apos;s theme setting
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
