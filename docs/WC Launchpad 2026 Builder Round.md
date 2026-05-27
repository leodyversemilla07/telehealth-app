# WC Launchpad Builder Round: BUILD A TELEHEALTH APP

## Objective

Develop a functional prototype of a telehealth application that allows users to register, book consultations, and connect with doctors online. This is an individual activity and each participant is given five days, from May 26 to May 30 to complete the task.

## Task Overview

You are to build a minimal viable product (MVP) for a telehealth web application that includes core features commonly found in modern online healthcare platforms. The goal is to evaluate your technical skills, design decisions, and ability to work independently on a full-stack application.

This exercise is not just about coding. It’s also about system design, product sense, user empathy, trust in healthcare UX, and execution clarity.

---

## Deliverables

The following is the summary of requirements needed to proceed to the next round.

| Deliverable             | Details                                                                                                                                                                 | Requirement (Software Engineer Track) |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Pair Programming        | Complete schedule pair programming schedule                                                                                                                             | Required                              |
| Video Recording         | Maximum 15 minutes<br>- Walkthrough of the application<br>- Overview of the Code<br>- Technical limitations / challenges and how you plan to address them in the future | Required                              |
| URL of the Deployed App | Application must be deployed                                                                                                                                            | Required                              |
| Git Repository          |                                                                                                                                                                         | Required                              |

All deliverables must be sent via email with the following details.

| Item           | Details                                                                                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deadline       | 11:59 PM, May 30, 2026                                                                                                                                                                             |
| Content        | Links to each deliverables<br>- Deployed App<br>- Git Repository<br>- Video Demo<br><br>Please ensure that full access is given. Links that are not accessible will automatically be disqualified. |
| Submission Bin | Submission Bin: https://forms.gle/2QrDQ17KBhHqWqBK9                                                                                                                                                |

## Role Definitions

Your goal is to develop a functional application with two (2) primary modules:

- Patient Module
- Doctor Module

The following are the users of this application:

| Role    | Description                                                                         |
| ------- | ----------------------------------------------------------------------------------- |
| Patient | End-user who books and attends consultations                                        |
| Doctor  | Medical professional who manages schedules, consultations, prescriptions, and notes |

---

## Patient Module

The following are patient-facing features:

| Feature                  | Description                                                                                                                                                                                                                    | Details                                                                                                        | Requirement |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------- |
| Patient Account Creation | Allows patients to securely register and create their own telehealth account. This module serves as the entry point to the platform.                                                                                           | Register using email and password                                                                              | Required    |
|                          | Allow patients to add personal information to their profile                                                                                                                                                                    | Input details such as: Name, Birthday, Weight, Height, Profile Picture, Contact Details, Basic Medical History | Required    |
| Doctor Discovery         | Enables patients to browse available doctors and review their schedules before booking consultations.                                                                                                                          | Browse doctors and view their availability                                                                     | Required    |
|                          |                                                                                                                                                                                                                                | Explore doctors based on medical needs/symptoms                                                                | Required    |
|                          |                                                                                                                                                                                                                                | Filter/search doctors by specialization                                                                        | Required    |
| AI Recommendation        | Allows patients to describe their symptoms or healthcare concerns and receive suggested doctors based on specialization or expertise.                                                                                          | AI recommends doctor based on patient needs                                                                    | Required    |
| Appointment Booking      | Allows patients to schedule online consultations with doctors based on available schedules.                                                                                                                                    | Book consultations online                                                                                      | Required    |
|                          |                                                                                                                                                                                                                                | Reschedule or cancel schedules                                                                                 | Required    |
|                          | Real time push notifications                                                                                                                                                                                                   | Notify users for booked, upcoming appointments, and schedule updates                                           | Required    |
| Consultation Session     | Provides patients access to a virtual consultation experience where they can join their scheduled appointment online.<br><br>Note: The consultation session does not require a fully custom-built video conferencing solution. | Join a consultation session                                                                                    | Required    |
| Medical Records          | Allows patients to review their previous consultations and view records provided by doctors after each session.                                                                                                                | View appointment history                                                                                       | Required    |
|                          |                                                                                                                                                                                                                                | View basic medical records or prescriptions                                                                    | Required    |

---

## Doctor Module

The following are admin-facing features:

| Feature                            | Description                                                                                                                                                                       | Details                                                                              | Requirement |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| Doctor Profile Management          | Allows doctors to securely register and create their own account.                                                                                                                 | Register using email and password                                                    | Required    |
|                                    |                                                                                                                                                                                   | Add profile details, bio, and specialization                                         | Required    |
| Medical Records Access             | Enables doctors to review patient consultation history and previously issued records or prescriptions.                                                                            | View appointment history and medical records/prescriptions                           | Required    |
| Consultation Schedule Management   | Allows doctors to manage their consultation availability and ensure schedules are properly organized.                                                                             | Manage consultation schedules                                                        | Required    |
|                                    |                                                                                                                                                                                   | Restrict unavailable time slots                                                      | Required    |
|                                    |                                                                                                                                                                                   | Real time push notifications for booked, upcoming appointments, and schedule updates | Required    |
| Consultation Notes & Prescriptions | Allows doctors to document findings, recommendations, prescriptions, and consultation summaries after each appointment.                                                           | Add prescriptions and/or medical consultation notes                                  | Required    |
| Consultation Session               | Enables doctors to join and conduct virtual consultations with patients.<br><br>Note: The consultation session does not require a fully custom-built video conferencing solution. | Join consultation session                                                            | Required    |

## Bonus Features

You are encouraged to explore additional features beyond the required scope to elevate the overall telehealth experience. There are no strict limitations for bonus features as long as they remain relevant to the telehealth experience and can be reasonably demonstrated within the given timeframe.

For the bonus features, you are encouraged to build features or improvements that help answer the following questions:

- How does this telehealth application differentiate itself from other similar platforms?
- How does this application elevate the overall patient and doctor journey to create a seamless, intuitive, and engaging experience that encourages long-term user retention?

You are free to design and implement any feature, workflow, AI-powered capability, or user experience enhancement that they believe meaningfully addresses these questions.

## Tips

- We value thoughtful product decisions, clean architecture, strong execution, and polished user experiences over excessive feature quantity.
- A smaller but well-designed and complete solution is preferred over an overly ambitious but unfinished implementation.
- Thoughtful UX decisions, prioritization, and overall product sense will be heavily considered during evaluation.
- Focus on the core functionalities first before moving on to bonus or experimental features.

---

## Technical Expectations

| Category        | Requirements                                                                                                 | Notes                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform        | - Web only<br>- Desktop-oriented (but responsive design)                                                     |                                                                                                                                                                                                                                                                                         |
| Frontend        | Any of the following<br>- Next.js<br>- Flutter<br>- React                                                    | - Prefer to use strongly-type language eg. TypeScript, Dart<br>- Okay to use UI framework eg. Shadcn, Radix, etc                                                                                                                                                                        |
| Backend         | Any of the following<br>- Nest.js<br>- Node.js<br>- SpringBoot                                               | - Avoid using BaaS (e.g., Firebase, Supabase) for databases.<br>- Prefer to use custom APIs for most backend logic;<br>- BaaS may be used selectively eg. Auth, Chat, not primarily.                                                                                                    |
| Database        | Any persistent DB<br>- MongoDB<br>- PostgreSQL<br>- MySQL<br>- MariaDB<br>- Etc                              |                                                                                                                                                                                                                                                                                         |
| Version Control | Any of the following<br>- Github<br>- Gitlab<br>- Bitbucket                                                  |                                                                                                                                                                                                                                                                                         |
| Code Quality    | - Modular<br>- Well-documented<br>- With error handling                                                      |                                                                                                                                                                                                                                                                                         |
| Deployment      | Any of the following<br>- Terraform<br>- Docker<br>- Vercel<br>- Fly.io<br>- Heroku<br>- AWS<br>- CloudFlare | - Prefer to use containerized deployment<br>- Other deployment platforms are acceptable as long as the application output is accessible via a public URL.                                                                                                                               |
| Others          |                                                                                                              | - Use of AI Coding Assistants such as Cursor and Windsurf are highly encouraged.<br>- Vibe coding tools such as Lovable or V0 are allowed, but participants should still be able to explain their implementation and architecture.<br>- Third-party libraries and services are allowed. |

---

## Pair Programming

### Objective

The Pair Programming Evaluation will be conducted in tandem with the Builder Round throughout the 5-day development period.

The goal of this exercise is to evaluate not only the final output of the application, but also how participants:

- think through problems,
- communicate technical decisions,
- adapt to feedback,
- collaborate in real time,
- and approach engineering and product challenges.

This exercise is intended to simulate real-world collaboration scenarios where participants are expected to discuss ideas, implement solutions, explain tradeoffs, and respond to evolving requirements.

### Mechanics

- Participants will join a Google Meet session together with a Whitecloak SME facilitator.
- Each session will run for approximately 1.5 hours.
- Participants are required to keep their cameras on throughout the session.
- Sessions will be recorded for evaluation and documentation purposes.
- The Whitecloak SME will facilitate the session, provide instructions, and guide participants through the activities during the call.
- No prior preparation is required. All activities, expectations, and instructions will be explained during the session itself.
- Completing the Pair Programming Evaluation is required to proceed to the next round of the program.

### Scheduling

- Participants will be provided with a booking link to schedule their Pair Programming Evaluation session. Kindly book ONE (1) session in EITHER links below. Kindly avoid double booking.
  - Booking Link 1: https://calendar.app.google/MUmZhhN2HpjcLBax7
  - Booking Link 2: https://calendar.app.google/gj33tvcLwmgYxpja7
- Note that there is no difference between the two booking links.
- A separate invitation will be sent to you along with your pair programming evaluator and the Google Meet link to be used in the time you booked in the link above.
- Session slots will be available on a first come, first served basis. Please note that pair programming sessions must be scheduled at least one (1) day before your preferred session date.
- Participants are encouraged to book their preferred schedule as early as possible due to limited slot availability.
- For any rescheduling concerns or requests, participants may contact launchpad@whitecloak.com

---

## Criteria

A panel of five experts will grade each participant based on the following scorecard.

Note: This is the most updated Scoring Criteria

| Competency                    | Guide                                                                         | Weight (Software Engineer Track) |
| ----------------------------- | ----------------------------------------------------------------------------- | -------------------------------: |
| Functionality & Scope Covered | How closely did you implement the requirements as described?                  |                              40% |
| Design & Product Sense        | How well was the app designed? Were you able to display a good product sense? |                              40% |
| Adherence & Code Quality      | How closely did you adhere to the technical expectations?                     |                              10% |
| Presentation & Communication  | How well was the video presentation delivered?                                |                              10% |
