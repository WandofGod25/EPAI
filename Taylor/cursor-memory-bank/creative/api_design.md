# API Design

This document specifies the design for the RESTful API of the Embedded Predictive Analytics Integrator (EPAI). All endpoints are served from Supabase Edge Functions.

## Authentication

All requests must include a valid JWT in the `Authorization` header, provided by Supabase Auth. The `partner_id` is extracted from the JWT payload to identify the calling partner.

Admin-level endpoints will require a specific role or claim within the JWT, e.g., `app_metadata.role = 'admin'`.

## Endpoints

### 1. Prediction API

#### `POST /predict`

The core endpoint for retrieving a prediction.

-   **Description**: Submits data to a specified model and returns a predictive insight. The request is logged asynchronously.
-   **Request Body**: Follows the `Generic Prediction Request` schema defined in `data_modeling.md`.
    ```json
    {
      "model_name": "lead-score-predictor",
      "model_version": "1.0.0",
      "payload": {
        "lead_source": "web-form",
        "deal_size": 50000,
        "interaction_count": 2
      }
    }
    ```
-   **Responses**:
    -   `200 OK`: Successful prediction. The body follows the `Standard Prediction Response` schema from `data_modeling.md`.
    -   `400 Bad Request`: Invalid request body or payload that doesn't match the model's schema.
    -   `401 Unauthorized`: Missing or invalid JWT.
    -   `404 Not Found`: The requested `model_name` or `model_version` does not exist or is not active.
    -   `500 Internal Server Error`: An unexpected error occurred during prediction.

---

### 2. Admin API: Partners

Endpoints for managing partner accounts. Requires admin privileges.

#### `POST /admin/partners`

-   **Description**: Creates a new partner account. A new API key is generated and the hashed version is stored. The actual key is returned only once in this response.
-   **Request Body**:
    ```json
    {
      "partner_name": "NewCo Inc.",
      "contact_email": "contact@newco.com"
    }
    ```
-   **Responses**:
    -   `201 Created`: The partner was created successfully.
        ```json
        {
          "partner_id": "uuid-goes-here",
          "partner_name": "NewCo Inc.",
          "contact_email": "contact@newco.com",
          "is_active": true,
          "api_key": "THIS_IS_THE_SECRET_KEY_RETURNED_ONLY_ONCE" 
        }
        ```
    -   `400 Bad Request`: Invalid input data.
    -   `409 Conflict`: A partner with the given `contact_email` already exists.

#### `GET /admin/partners/{partner_id}`

-   **Description**: Retrieves the details of a specific partner. Does not return the API key.
-   **Path Parameters**:
    -   `partner_id` (UUID): The ID of the partner to retrieve.
-   **Responses**:
    -   `200 OK`:
        ```json
        {
          "partner_id": "uuid-goes-here",
          "created_at": "timestamp",
          "partner_name": "NewCo Inc.",
          "contact_email": "contact@newco.com",
          "is_active": true
        }
        ```
    -   `404 Not Found`: Partner with the specified ID not found.

---

### 3. Admin API: Models

Endpoints for managing model configurations. Requires admin privileges.

#### `POST /admin/models`

-   **Description**: Registers a new model configuration in the system.
-   **Request Body**:
    ```json
    {
      "model_name": "event-attendance-forecaster",
      "model_version": "1.0.0",
      "description": "Predicts attendance for events based on historical data.",
      "endpoint_identifier": "org/event-forecaster-v1",
      "metadata": { "input_schema_url": "/schemas/event-forecaster-v1.json" }
    }
    ```
-   **Responses**:
    -   `201 Created`: The model config was created. Response body includes the full object with generated `model_id`.
    -   `400 Bad Request`: Invalid input.
    -   `409 Conflict`: A model with the same `endpoint_identifier` or `model_name` and `model_version` pair already exists.

#### `GET /admin/models`

-   **Description**: Retrieves a list of all available model configurations.
-   **Responses**:
    -   `200 OK`: An array of model configuration objects.

#### `GET /admin/models/{model_id}`

-   **Description**: Retrieves a single model configuration by its ID.
-   **Path Parameters**:
    -   `model_id` (UUID): The ID of the model to retrieve.
-   **Responses**:
    -   `200 OK`: A single model configuration object.
    -   `404 Not Found`: Model with the specified ID not found.

#### `PATCH /admin/models/{model_id}`

-   **Description**: Updates a model configuration. Can be used to activate/deactivate a model or change its description.
-   **Path Parameters**:
    -   `model_id` (UUID): The ID of the model to update.
-   **Request Body**: A partial model configuration object.
    ```json
    {
      "description": "An updated description.",
      "is_active": false
    }
    ```
-   **Responses**:
    -   `200 OK`: The full, updated model configuration object.
    -   `400 Bad Request`: Invalid input fields.
    -   `404 Not Found`: Model with the specified ID not found. 