import { NotificationsContent } from "@/components/settings/notifications-content"
import { SettingsLayout } from "@/components/settings-layout"

export default function AdminNotificationsPage() {
  return (
    <SettingsLayout userRole="admin">
      <NotificationsContent />
    </SettingsLayout>
  )
}
