from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="End-to-End Stub API",
    description="A simplified stub demonstrating the conceptual E2E flow.",
    version="0.1.0",
)


# --- Pydantic Models ---
class PredictionRequest(BaseModel):
    event_data: Dict[str, Any]


class PredictionResponse(BaseModel):
    insight_type: str
    value: str
    confidence: float
    model_version: str


# --- Mocked Data ---
# In a real system, this would be a call to a User/Partner Management Service
# that validates the API key against a database.
mock_partners = {
    "partner-key-12345": {"id": 1, "name": "Partner A"},
    "partner-key-67890": {"id": 2, "name": "Partner B"},
}


# --- Health Check ---
@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


# --- Simplified Prediction Endpoint ---
@app.post("/predict/simplified", response_model=PredictionResponse)
async def simplified_predict(
    request: PredictionRequest, x_api_key: Optional[str] = Header(None)
):
    """
    A simplified endpoint that mocks the end-to-end flow of a prediction.
    """
    # 1. Authenticate Partner (mocked)
    if not x_api_key or x_api_key not in mock_partners:
        logger.warning(
            "Authentication failed for API key: %s",
            x_api_key or "None provided",
        )
        raise HTTPException(
            status_code=401, detail="Invalid or missing API Key"
        )

    partner = mock_partners[x_api_key]
    logger.info("Step 1: Partner '%s' authenticated.", partner["name"])

    # 2. Process Data (mocked)
    logger.info("Step 2: Data processing called with: %s", request.event_data)

    # 3. Get Prediction (mocked)
    mocked_prediction = {
        "insight_type": "user_churn_risk",
        "value": "high",
        "confidence": 0.88,
        "model_version": "stub-v0.1.0",
    }
    logger.info("Step 3: Mocked ML inference returned: %s", mocked_prediction)

    # 4. Cache Result (mocked)
    cache_key = (
        f"{partner['id']}:{hash(frozenset(request.event_data.items()))}"
    )
    logger.info("Step 4: Prediction would be cached with key: %s", cache_key)

    # 5. Log Request/Prediction (mocked)
    logger.info(
        "Step 5: Request/Prediction logged for partner ID: %s", partner["id"]
    )

    # 6. Return the prediction
    return mocked_prediction


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8011)
