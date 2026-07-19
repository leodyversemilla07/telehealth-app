import { NotificationsContent } from "@/components/settings/notifications-content"
import { SettingsLayout } from "@/components/settings-layout"

export default function PatientNotificationsPage() {
  return (
    <SettingsLayout userRole="patient">
      <NotificationsContent />
    </SettingsLayout>
  )
}
