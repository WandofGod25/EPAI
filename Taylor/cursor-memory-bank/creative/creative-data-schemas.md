# Ingestion Data Schemas

This document defines the detailed payload schemas for different `event_type` values submitted to the Ingestion API. These schemas serve as a contract for partner integrations and are used for data validation.

## Common Principles

*   **Timestamps**: All timestamps should be in ISO 8601 format (e.g., `2023-10-27T10:00:00Z`).
*   **Versioning**: While not implemented in the first version, schemas are designed with future versioning in mind (e.g., adding a `schema_version` field to the payload).
*   **Extensibility**: Payloads can include additional custom fields, which will be stored but not processed by the initial models.

---

## 1. Event Type: `user_profile_update`

This event is sent when a user's or lead's profile information is created or updated in the host system. It's crucial for lead scoring models.

**Payload Schema (`payload` object):**

| Field             | Type      | Required | Description                                                                 | Example                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `userId`          | `string`  | Yes      | The unique identifier for the user in the host system.                      | `"user-12345"`                        |
| `email`           | `string`  | No       | The user's email address.                                                   | `"test@example.com"`                  |
| `firstName`       | `string`  | No       | The user's first name.                                                      | `"Jane"`                              |
| `lastName`        | `string`  | No       | The user's last name.                                                       | `"Doe"`                               |
| `role`            | `string`  | No       | The user's job title or role.                                               | `"Marketing Manager"`                 |
| `company`         | `string`  | No       | The name of the company the user belongs to.                                | `"Acme Inc."`                         |
| `lastSeenAt`      | `string`  | No       | The timestamp of the user's last activity.                                  | `"2023-10-26T15:30:00Z"`              |
| `customAttributes`| `object`  | No       | A key-value store for any other relevant user attributes.                   | `{"lead_source": "webinar"}`           |

---

## 2. Event Type: `event_details_update`

This event is sent when details about a promotional event (like a webinar, conference, etc.) are created or updated. It's used for attendance forecasting.

**Payload Schema (`payload` object):**

| Field             | Type      | Required | Description                                                                 | Example                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `eventId`         | `string`  | Yes      | The unique identifier for the event in the host system.                     | `"evt-abc-987"`                       |
| `eventName`       | `string`  | Yes      | The official name of the event.                                             | `"Q4 Product Launch Webinar"`         |
| `startAt`         | `string`  | Yes      | The event's start timestamp.                                                | `"2023-12-15T14:00:00Z"`              |
| `endAt`           | `string`  | Yes      | The event's end timestamp.                                                  | `"2023-12-15T15:00:00Z"`              |
| `location`        | `string`  | No       | The physical location or URL for the event.                                 | `"https://webinar.example.com/live"`  |
| `capacity`        | `number`  | No       | The maximum number of attendees for the event.                              | `500`                                 |
| `category`        | `string`  | No       | The category or type of the event.                                          | `"Webinar"`                           |

---

## 3. Event Type: `sales_transaction`

This event is sent when a sales transaction occurs, such as a ticket purchase for an event. It's used for revenue forecasting and optimal pricing models.

**Payload Schema (`payload` object):**

| Field             | Type      | Required | Description                                                                 | Example                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `transactionId`   | `string`  | Yes      | The unique identifier for the transaction.                                  | `"txn-a1b2c3d4"`                      |
| `userId`          | `string`  | Yes      | The ID of the user who made the purchase.                                   | `"user-12345"`                        |
| `eventId`         | `string`  | No       | The ID of the event this transaction is associated with.                    | `"evt-abc-987"`                       |
| `productId`       | `string`  | Yes      | The ID of the product or ticket tier that was purchased.                    | `"ticket-general-admission"`          |
| `value`           | `number`  | Yes      | The total value of the transaction.                                         | `49.99`                               |
| `currency`        | `string`  | Yes      | The ISO 4217 currency code.                                                 | `"USD"`                               |
| `quantity`        | `number`  | Yes      | The number of units purchased.                                              | `1`                                   |
| `transactionAt`   | `string`  | Yes      | The timestamp when the transaction occurred.                                | `"2023-10-27T09:12:35Z"`              | 

---

## 4. Event Type: `user_engagement`

This event is sent when a user interacts with content, emails, or the platform. It's crucial for lead scoring and attendance prediction models.

**Payload Schema (`payload` object):**

| Field             | Type      | Required | Description                                                                 | Example                               |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `userId`          | `string`  | Yes      | The unique identifier for the user in the host system.                      | `"user-12345"`                        |
| `engagementType`  | `string`  | Yes      | The type of engagement (e.g., email_open, page_view, content_download).     | `"email_open"`                        |
| `resourceId`      | `string`  | No       | The ID of the resource being engaged with (e.g., email ID, page URL).       | `"email-campaign-123"`                |
| `eventId`         | `string`  | No       | The ID of the event this engagement is related to, if applicable.           | `"evt-abc-987"`                       |
| `engagementAt`    | `string`  | Yes      | The timestamp when the engagement occurred.                                 | `"2023-10-27T08:15:22Z"`              |
| `duration`        | `number`  | No       | The duration of engagement in seconds, if applicable.                       | `45`                                  |
| `metadata`        | `object`  | No       | Additional metadata about the engagement.                                   | `{"referrer": "google.com"}`          |

---

## 5. Event Type: `event_attendance`

This event is sent after an event concludes to record actual attendance data. It's essential for training attendance forecasting models.

**Payload Schema (`payload` object):**

| Field                | Type      | Required | Description                                                                 | Example                               |
| -------------------- | --------- | -------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `eventId`            | `string`  | Yes      | The unique identifier for the event in the host system.                     | `"evt-abc-987"`                       |
| `actualAttendees`    | `number`  | Yes      | The actual number of people who attended the event.                         | `425`                                 |
| `registeredAttendees`| `number`  | Yes      | The number of people who registered for the event.                          | `500`                                 |
| `attendanceRate`     | `number`  | No       | The attendance rate as a decimal (actual/registered).                       | `0.85`                                |
| `recordedAt`         | `string`  | Yes      | The timestamp when this attendance record was created.                      | `"2023-12-15T16:30:00Z"`              |
| `demographicBreakdown`| `object` | No       | Optional breakdown of attendees by demographic categories.                  | `{"industry": {"tech": 250, "finance": 175}}` | 