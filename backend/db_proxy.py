import asyncpg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class DatabaseConnection(BaseModel):
    display_name: str
    host: str
    port: int
    database: str
    username: str
    password: str
    ip_whitelist: list[str]

@app.post("/api/test-connection")
async def test_connection(connection: DatabaseConnection):
    try:
        # Format the connection string for Azure PostgreSQL
        conn_str = f"postgres://{connection.username}%40{connection.host.split('.')[0]}:{connection.password}@{connection.host}:{connection.port}/{connection.database}?sslmode=require"
        
        # Try async connection
        conn = await asyncpg.connect(conn_str)
        await conn.close()
        
        return {"success": True, "message": "Connection successful!"}
    except Exception as e:
        print(f"Connection error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 