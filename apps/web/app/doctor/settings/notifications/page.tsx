import { NotificationsContent } from "@/components/settings/notifications-content"
import { SettingsLayout } from "@/components/settings-layout"

export default function DoctorNotificationsPage() {
  return (
    <SettingsLayout userRole="doctor">
      <NotificationsContent />
    </SettingsLayout>
  )
}
