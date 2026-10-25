// Self-service profile updates edit the individual name parts (the service
// recomputes the canonical `name`). The admin DTO of the same name edits the
// canonical `name` directly — intentionally a different shape.
export { UpdateProfileDto } from "./update-profile.dto.js"
