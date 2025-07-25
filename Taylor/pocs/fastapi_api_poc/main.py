from typing import List, Optional
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, status, Depends
from pydantic import BaseModel

# --- Database Connection Parameters ---
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "taylor")
DB_USER = os.getenv("DB_USER", "andrei")
DB_PASSWORD = os.getenv("DB_PASSWORD", "mysecretpassword")
DB_PORT = os.getenv("DB_PORT", "5432")

# --- FastAPI App ---
app = FastAPI(
    title="FastAPI CRUD PoC",
    description=(
        "A Proof of Concept for CRUD operations with FastAPI and PostgreSQL."
    ),
    version="0.1.0",
)


def get_db_connection():
    """Establishes and returns a database connection."""
    conn = None
    while conn is None:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                port=DB_PORT,
            )
        except psycopg2.OperationalError as e:
            print(f"Database connection failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)
    return conn


@app.on_event("startup")
def on_startup():
    """Create the 'items' table on application startup if it doesn't exist."""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT
            );
        """
        )
        conn.commit()
    conn.close()
    print("Database table 'items' is ready.")


# --- Pydantic Models ---
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class Item(ItemBase):
    id: int

    class Config:
        orm_mode = True


# --- API Endpoints ---
@app.post("/items/", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate, conn=Depends(get_db_connection)):
    """Create a new item."""
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "INSERT INTO items (name, description) VALUES (%s, %s) RETURNING *;",
            (item.name, item.description),
        )
        new_item = cursor.fetchone()
        conn.commit()
    conn.close()
    return new_item


@app.get("/items/", response_model=List[Item])
def read_items(
    skip: int = 0, limit: int = 100, conn=Depends(get_db_connection)
):
    """Retrieve all items with optional pagination."""
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM items ORDER BY id LIMIT %s OFFSET %s;", (limit, skip)
        )
        items = cursor.fetchall()
    conn.close()
    return items


@app.get("/items/{item_id}", response_model=Item)
def read_item(item_id: int, conn=Depends(get_db_connection)):
    """Retrieve a single item by its ID."""
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM items WHERE id = %s;", (item_id,))
        item = cursor.fetchone()
    conn.close()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}", response_model=Item)
def update_item(
    item_id: int, item: ItemCreate, conn=Depends(get_db_connection)
):
    """Update an existing item."""
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "UPDATE items SET name = %s, description = %s WHERE id = %s "
            "RETURNING *;",
            (item.name, item.description, item_id),
        )
        updated_item = cursor.fetchone()
        conn.commit()
    conn.close()
    if updated_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated_item


@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, conn=Depends(get_db_connection)):
    """Delete an item."""
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "DELETE FROM items WHERE id = %s RETURNING id;", (item_id,)
        )
        deleted_item = cursor.fetchone()
        conn.commit()
    conn.close()
    if deleted_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
