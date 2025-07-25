# Creative Phase: UI Embedding SDK

**Feature:** [EPAI-COMP-04] UI Embedding SDK
**Status:** [Design]

## 1. Overview & Goal

The purpose of the UI Embedding SDK is to provide a simple, lightweight, and customizable way for partners to embed predictive insights directly into their own web applications. The primary goal is to make integration seamless for developers while ensuring the displayed insights are clear, useful, and stylistically consistent with the host application.

## 2. Developer Experience (DX)

The integration process for a partner developer should be as simple as possible. The proposed method is via a single `<script>` tag and declarative HTML placeholders.

**Example Integration:**

```html
<!-- Step 1: Add the EPAI SDK script to the page -->
<script async src="https://epai.your-domain.com/sdk.js" data-partner-id="partner-uuid-12345"></script>

<!-- Step 2: Place insight components where they are needed -->
<div data-epai-insight="insight-uuid-abcde"></div>

<!-- An insight with custom options -->
<div data-epai-insight="insight-uuid-fghij" data-epai-theme="dark" data-epai-show-confidence="false"></div>
```

## 3. Component API (`data-epai-*` attributes)

The component will be configured via `data-epai-*` attributes on the placeholder `div`. This is a robust method that avoids complex JavaScript initializations on the partner's side.

| Attribute                  | Type    | Required | Default | Description                                                                 |
| -------------------------- | ------- | -------- | ------- | --------------------------------------------------------------------------- |
| `data-epai-insight`        | string  | Yes      | N/A     | The unique ID of the insight to be displayed.                               |
| `data-epai-theme`          | string  | No       | `light` | Sets the color theme. Options: `light`, `dark`.                             |
| `data-epai-show-confidence`| boolean | No       | `true`  | Toggles the visibility of the confidence score.                             |
| `data-epai-show-title`     | boolean | No       | `true`  | Toggles the visibility of the insight title.                                |
| `data-epai-compact`        | boolean | No       | `false` | Renders a smaller, more compact version of the component.                   |

## 4. Default Insight Component Design

The default component should be clean, modern, and information-dense without being cluttered. It will be built using `shadcn/ui` principles to align with the admin panel's aesthetic.

**Visual Concept (ASCII Art):**

```
+------------------------------------------------+
| Lead Score      [Icon]   Confidence: 92%      |  <-- Title, Icon, Confidence
+------------------------------------------------+
|                                                |
|                   +85                          |  <-- Main Value (Large)
|             Predicted score for this lead      |  <-- Description/Subtitle
|                                                |
+------------------------------------------------+
| Generated: June 15, 2025 | Model: v2.1-alpha  |  <-- Footer with metadata
+------------------------------------------------+
```

**Component Breakdown:**
-   **Card:** The main container will be a `Card` component.
-   **Header:** Contains the `CardTitle` (e.g., "Lead Score") and an optional confidence score.
-   **Content:** Displays the primary insight value in a large, prominent font. A `CardDescription` provides context.
-   **Footer:** Contains metadata like the generation timestamp and the model version used.

**Compact Version:**
The compact version will be a single line, suitable for embedding in tables or lists.
`[Icon] Lead Score: +85 (92%)`

## 5. Customization Strategy

Partners need to be able to style the component to match their application's look and feel.

-   **Level 1: Theming (via `data-epai-theme`)**
    -   `light` (default): Light background, dark text.
    -   `dark`: Dark background, light text.
-   **Level 2: CSS Custom Properties (Variables)**
    -   The component's CSS will be built using CSS variables for key properties. Partners can override these variables in their own stylesheets to achieve fine-grained control.
    -   Example variables to expose:
        -   `--epai-bg-color`
        -   `--epai-text-color`
        -   `--epai-primary-color` (for icons, accents)
        -   `--epai-border-radius`
        -   `--epai-font-family`
-   **Level 3: Custom Renderers (Post-MVP)**
    -   For ultimate flexibility, a future version could allow partners to provide their own JavaScript rendering function to build a completely custom UI with the fetched insight data.

## 6. Next Steps

-   [ ] **Review & Approve Design:** Get feedback on this proposed design.
-   [ ] **Task 2: Implement the Frontend SDK:**
    -   [ ] Create the `packages/sdk` monorepo package.
    -   [ ] Build the standard Insight React component based on this design.
-   [ ] **Task 3: Implement the Insight Delivery API:**
    -   [ ] Design and build the `get-public-insight` Edge Function.
-   [ ] **Task 4: Documentation and Examples:**
    -   [ ] Create the "Integration" page in the Admin Panel.

This design provides a clear path forward for building a powerful and flexible UI Embedding SDK. 