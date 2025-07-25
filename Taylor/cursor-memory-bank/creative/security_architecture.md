# Security Architecture Design

This document outlines the security architecture for the Embedded Predictive Analytics Integrator (EPAI). Its purpose is to identify threats and define the controls and mechanisms to protect the system and its data.

## 1. Threat Modeling (STRIDE)

We use the STRIDE model to categorize potential threats.

-   **Spoofing**:
    -   *Threat*: An attacker impersonates a legitimate partner or admin.
    -   *Mitigation*: All access is authenticated via JWTs issued by Supabase Auth. Strong password policies will be enforced for the Admin Panel. Partner API keys must be kept secret and are passed via secure headers.
-   **Tampering**:
    -   *Threat*: An attacker modifies data in transit or at rest (e.g., changing a prediction log or model configuration).
    -   *Mitigation*: All communication uses TLS 1.2+. Database permissions are tightly controlled. Critical data at rest (like API key hashes) is cryptographically hashed, not encrypted, making tampering evident. Row-Level Security (RLS) policies in PostgreSQL will be used to prevent users from accessing or modifying data that doesn't belong to them.
-   **Repudiation**:
    -   *Threat*: A partner denies having made a specific API request.
    -   *Mitigation*: The `prediction_logs` table provides a non-repudiable audit trail. Every single API request is logged with the partner's ID (from the validated JWT), the request payload, and the timestamp.
-   **Information Disclosure**:
    -   *Threat*: An attacker gains access to sensitive data, such as other partners' data, prediction results, or API keys.
    -   *Mitigation*:
        -   **Data in Transit**: Enforced TLS encryption for all API endpoints.
        -   **Data at Rest**: Supabase provides encryption at rest for the database and storage. Sensitive data like API keys are stored as hashes.
        -   **Access Control**: Strict Row-Level Security (RLS) policies in Supabase ensure that a partner can only access their own data (`partners`, `prediction_logs`, etc.). Admin endpoints are protected by role-based access control (RBAC) checks within the JWT claims.
-   **Denial of Service (DoS)**:
    -   *Threat*: An attacker overwhelms the system with requests, making it unavailable to legitimate users.
    -   *Mitigation*: We will rely on Supabase's built-in DoS protection for its infrastructure. We will implement strict rate limiting on all API endpoints, especially the `/predict` endpoint, on a per-partner basis.
-   **Elevation of Privilege**:
    -   *Threat*: A regular partner user gains admin-level access.
    -   *Mitigation*: Admin privileges are managed via custom claims in Supabase Auth JWTs (e.g., `app_metadata.role: 'admin'`). Edge Functions will explicitly check for the presence and validity of this claim on all admin-prefixed endpoints. There is no other pathway to gain administrative access.

## 2. Authentication & Authorization

-   **Authentication**:
    -   **Partners (API)**: Bearer authentication using JWTs. Partners authenticate with Supabase Auth to get a JWT, which is then used for all subsequent API calls. API keys provided to partners are long-lived secrets used to programmatically obtain these JWTs.
    -   **Admins (UI)**: Standard email/password login via the Admin Panel, managed by Supabase Auth. Multi-factor authentication (MFA) will be enforced for all admin accounts.
-   **Authorization**:
    -   **Role-Based Access Control (RBAC)**: Implemented via JWT claims. Functions check for an `admin` role before executing protected logic.
    -   **Row-Level Security (RLS)**: This is the primary mechanism for data segregation. Policies in PostgreSQL will ensure queries are automatically filtered based on the `partner_id` extracted from the JWT. For example: `CREATE POLICY "Partners can only see their own logs." ON prediction_logs FOR SELECT USING (auth.uid() = partner_id);`

## 3. Data Encryption

-   **Data in Transit**: All endpoints exposed by Supabase (Database, Functions, Storage) are protected with TLS 1.2 or higher by default. All external calls from our Edge Functions (e.g., to Hugging Face) must also use HTTPS.
-   **Data at Rest**: All data stored within the Supabase PostgreSQL database and Supabase Storage is encrypted at rest by default, managed by the cloud provider (AWS).

## 4. Secret Management

-   **Partner API Keys**: A unique secret API key is generated for each partner upon creation. The raw key is returned **only once** in the creation response. We store a cryptographically secure hash (`bcrypt` or `sha256`) of the key in the `partners` table for verification.
-   **Third-Party Secrets**: Secrets for connecting to external services like Hugging Face (e.g., API tokens) will be stored as encrypted environment variables within Supabase's Edge Function settings. They will NOT be hardcoded in the function source code.
-   **Supabase Keys**: The Supabase `service_role` key, which bypasses RLS, will be used exclusively in trusted server-side environments (our Edge Functions) and will never be exposed to a client or browser. The `anon` key, which is public, will be used by the Admin Panel frontend and will be restricted by RLS policies. 