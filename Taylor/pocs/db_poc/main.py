from fastapi import FastAPI, HTTPException, Depends, status
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import time
import redis
import json
from pydantic import BaseModel

# Database connection settings
DB_NAME = "taylor"
DB_USER = "andrei"
DB_PASSWORD = "mysecretpassword"
DB_HOST = "localhost"
DB_PORT = "5432"

# Redis connection settings
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

# FastAPI app initialization
app = FastAPI()

# Connect to Redis
redis_client = redis.Redis(
    host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
)


def get_db_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )
    return conn


@app.on_event("startup")
def startup_event():
    conn = None
    while conn is None:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # Create Partners table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS Partners (
                    partner_id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    api_key VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE
                        DEFAULT CURRENT_TIMESTAMP
                );
            """
            )
            # Create PredictionRequests table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS PredictionRequests (
                    request_id SERIAL PRIMARY KEY,
                    partner_id INTEGER REFERENCES Partners(partner_id),
                    input_data JSONB,
                    prediction_output JSONB,
                    requested_at TIMESTAMP WITH TIME ZONE
                        DEFAULT CURRENT_TIMESTAMP
                );
            """
            )
            conn.commit()
            cursor.close()
            conn.close()
            print("Database tables are ready.")
        except psycopg2.OperationalError as e:
            print(f"Database connection failed: {e}")
            time.sleep(5)


# Pydantic models
class PartnerCreate(BaseModel):
    name: str


class Partner(BaseModel):
    partner_id: int
    name: str
    api_key: str

    class Config:
        orm_mode = True


class ProfileSummary(BaseModel):
    partner_id: int
    name: str
    total_requests: int
    cache_status: str


# API Endpoints
@app.post(
    "/partners/", response_model=Partner, status_code=status.HTTP_201_CREATED
)
def create_partner(partner: PartnerCreate, conn=Depends(get_db_connection)):
    api_key = str(uuid.uuid4())
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(
            "INSERT INTO Partners (name, api_key) VALUES (%s, %s) RETURNING *;",
            (partner.name, api_key),
        )
        new_partner = cursor.fetchone()
        conn.commit()
        return new_partner
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()


@app.get("/partners/{api_key}", response_model=Partner)
def get_partner_by_api_key(api_key: str, conn=Depends(get_db_connection)):
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM Partners WHERE api_key = %s;", (api_key,))
    db_partner = cursor.fetchone()
    cursor.close()
    conn.close()
    if not db_partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return db_partner


@app.get(
    "/partners/{partner_id}/profile_summary",
    response_model=ProfileSummary,
)
def get_profile_summary(partner_id: int, conn=Depends(get_db_connection)):
    cache_key = f"profile_summary:{partner_id}"

    # Try to get from cache
    cached_summary = redis_client.get(cache_key)

    if cached_summary:
        summary_data = json.loads(cached_summary)
        summary_data["cache_status"] = "hit"
        return summary_data

    # If cache miss, fetch from DB and compute
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Fetch partner details
        cursor.execute(
            "SELECT * FROM Partners WHERE partner_id = %s;", (partner_id,)
        )
        partner_data = cursor.fetchone()
        if not partner_data:
            raise HTTPException(status_code=404, detail="Partner not found")

        # Fetch prediction request count
        cursor.execute(
            "SELECT COUNT(*) as total_requests "
            "FROM PredictionRequests WHERE partner_id = %s;",
            (partner_id,),
        )
        request_count = cursor.fetchone()

        summary = {
            "partner_id": partner_data["partner_id"],
            "name": partner_data["name"],
            "total_requests": request_count["total_requests"],
            "cache_status": "miss",
        }

        # Store in cache with a 60-second TTL
        redis_client.set(cache_key, json.dumps(summary), ex=60)

        return summary

    except psycopg2.Error as e:
        raise HTTPException(
            status_code=500, detail=f"Database error: {e}"
        ) from e
    finally:
        cursor.close()
        conn.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8010)
