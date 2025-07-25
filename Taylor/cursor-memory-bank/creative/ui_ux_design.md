# UI/UX Design

This document outlines the UI/UX design for the two main front-facing components of the EPAI: the UI Embedding SDK and the Admin Panel.

## Part 1: UI Embedding SDK

### Design Principles

1.  **Minimalist & Unobtrusive**: The components should feel like a natural part of the host application, not a jarring third-party element. They should be clean, simple, and information-dense without being cluttered.
2.  **Highly Customizable**: Partners must be able to style the components to match their application's branding. This includes colors, fonts, and spacing.
3.  **Responsive & Accessible**: Components must render correctly across different screen sizes and adhere to WCAG 2.1 AA accessibility standards.
4.  **Actionable**: Where appropriate, the components should guide the end-user towards an action or decision.
5.  **Informative**: The components must clearly display the predictive insight, its confidence, and a brief explanation of the result.

### Customization Strategy

Customization will be enabled via CSS custom properties (variables). We will provide a base stylesheet, and partners can override a well-documented set of variables to apply their own branding.

Example:
```css
:root {
  --epai-font-family: 'Inter', sans-serif;
  --epai-primary-color: #3b82f6;
  --epai-text-color: #1f2937;
  --epai-background-color: #ffffff;
  --epai-border-radius: 0.5rem;
  --epai-card-padding: 1rem;
}
```

### Core Components

#### 1. KPI / Score Widget

-   **Use Case**: Displaying a single, important numeric value, such as a lead score, quality score, or price suggestion.
-   **Data Structure (`insight.type` = `numeric_value` or `score`)**:
    -   `value`: The main number to display (e.g., "88").
    -   `title`: The name of the metric (e.g., "Lead Score").
    -   `unit` (optional): The unit for the value (e.g., "$", "%").
    -   `confidence` (optional): The model's confidence in the value.
    -   `explanation`: Human-readable explanation.
-   **Layout Sketch**:

```
+----------------------------------------+
| LEAD SCORE                             |  <-- Title (Uppercase, smaller font)
|                                        |
|         88                             |  <-- Value (Large, prominent font)
|                                        |
|   Confidence: 85%   [ i ]              |  <-- Confidence & Info Icon
+----------------------------------------+
```
-   **Interactivity**:
    -   Hovering over the `[ i ]` icon will show a tooltip with the `explanation` text.

#### 2. Categorical Risk Widget

-   **Use Case**: Displaying a categorical assessment, like "High", "Medium", "Low" risk.
-   **Data Structure (`insight.type` = `categorical_risk`)**:
    -   `value`: The category (e.g., "High").
    -   `title`: The name of the metric (e.g., "Churn Risk").
    -   `confidence`: The model's confidence.
    -   `explanation`: Human-readable explanation.
-   **Layout Sketch**:

```
+----------------------------------------+
| CHURN RISK           [ i ]             |  <-- Title & Info Icon
|                                        |
|   ( ! )   High                         |  <-- Icon + Value. Color coded.
|                                        |
|   Confidence: 92%                      |  <-- Confidence
+----------------------------------------+
```
-   **Visuals**:
    -   The color of the icon and text for the `value` will be determined by the value itself (e.g., High = red, Medium = orange, Low = green). These colors will be customizable via CSS variables.
-   **Interactivity**:
    -   Hovering over `[ i ]` shows the `explanation`.

#### 3. Timeseries Forecast Widget

-   **Use Case**: Displaying a forecast over a future time period.
-   **Data Structure (`insight.type` = `timeseries_forecast`)**:
    -   `title`: "Event Attendance Forecast"
    -   `series`: An array of data points `[{timestamp, value, confidence_interval}]`.
    -   `summary`: A text summary of the forecast (e.g., "Peak attendance expected on Day 3").
    -   `explanation`: The 'why' behind the forecast.
-   **Layout Sketch**:

```
+----------------------------------------+
| EVENT ATTENDANCE FORECAST      [ i ]   |
|                                        |
|     /|                                 |
|    / |----                             |  <-- Simple line chart of the series
|   /  |    \                            |
|  /___|_____\_                          |
|  D1  D2  D3  D4                        |
|                                        |
| Peak attendance expected on Day 3.     |  <-- Summary text
+----------------------------------------+
```
-   **Interactivity**:
    -   Hovering over the chart can show tooltips for individual data points.
    -   Hovering over `[ i ]` shows the `explanation`.
    -   This component will be more complex and may require a lightweight charting library.

---
## Part 2: Admin Panel

### Information Architecture

The Admin Panel is a single-page application (SPA) built with React. It provides a comprehensive interface for partners to manage their integration with EPAI.

The primary navigation will include the following sections:
-   **Dashboard**: The landing page after login, showing at-a-glance usage and system status.
-   **API Keys**: Section for managing API credentials.
-   **Model Explorer**: A catalog of available predictive models.
-   **Usage Logs**: A detailed view of API requests and predictions.
-   **Settings**: Partner account and notification settings.

### Page Designs & Workflows

#### 1. Dashboard

-   **Purpose**: To provide an immediate overview of the partner's integration health and usage.
-   **Key Components**:
    -   **Statistic Cards**:
        -   "API Requests (24h)": Total number of calls.
        -   "Active Models": Number of models used in the last 30 days.
        -   "Error Rate (24h)": Percentage of requests that resulted in an error.
    -   **Chart**: A bar chart showing API usage over the last 7 days, broken down by model.
    -   **Recent Activity**: A table showing the 5 most recent prediction logs.

#### 2. API Keys Management

-   **Purpose**: To allow partners to securely generate, view, and revoke their API keys.
-   **Key Components**:
    -   A list of current API keys. Each entry shows:
        -   The first 8 characters of the key (e.g., `sk_live_a1b2c3d4...`).
        -   A "Created" date.
        -   A "Last Used" timestamp.
        -   A "Revoke" button.
    -   A "Generate New API Key" button.
-   **Workflow: Generating a new key**:
    1.  User clicks "Generate New API Key".
    2.  A modal appears, warning the user that the key will only be shown once.
    3.  User confirms.
    4.  The modal now displays the new API key with a "Copy" button.
    5.  Once the modal is closed, the key cannot be viewed again.

#### 3. Model Explorer

-   **Purpose**: To provide a catalog of all available models that the partner can use.
-   **Key Components**:
    -   A searchable, filterable list of `model_configs`.
    -   Each model is displayed as a card with:
        -   `model_name`
        -   `model_version`
        -   `description`
        -   Tags for the type of prediction (e.g., "Forecasting", "Scoring").
-   **Workflow: Viewing model details**:
    1.  User clicks on a model card.
    2.  A detail view (modal or separate page) opens, showing:
        -   All the metadata from the card.
        -   The required `payload` schema for the model (from `data_modeling.md`).
        -   An example request payload.
        -   An example response.

#### 4. Usage Logs

-   **Purpose**: To provide a detailed, searchable log of all API requests made by the partner.
-   **Key Components**:
    -   A data table displaying `prediction_logs`.
    -   **Columns**: Timestamp, Model Used, Status (Success/Error), Duration (ms), View Payload.
    -   **Filtering/Searching**:
        -   Filter by date range.
        -   Filter by model name.
        -   Filter by status.
        -   Search by prediction ID.
-   **Workflow: Viewing payload**:
    1.  User clicks the "View Payload" button/icon on a row.
    2.  A modal appears showing the `request_payload` and `prediction_response` JSON for that log entry. 