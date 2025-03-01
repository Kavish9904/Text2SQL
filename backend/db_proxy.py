from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
import mysql.connector
from mysql.connector import Error

app = FastAPI()

class DatabaseConnection(BaseModel):
    type: Literal["postgresql", "mysql", "motherduck"]
    display_name: str
    host: str
    port: int
    database: str
    username: str
    password: str
    token: Optional[str] = None
    ip_whitelist: list[str]

@app.post("/api/test-connection")
async def test_connection(connection: DatabaseConnection):
    print(f"\n=== Testing {connection.type} Connection ===")
    print(f"Host: {connection.host}")
    print(f"Port: {connection.port}")
    print(f"Database: {connection.database}")
    print(f"Username: {connection.username}")
    
    if connection.type == "mysql":
        try:
            # Format username for Azure MySQL
            username = f"{connection.username}@{connection.host.split('.')[0]}"
            
            print(f"Connecting with username: {username}")
            
            # Connect using mysql.connector instead of pymysql
            conn = mysql.connector.connect(
                host=connection.host,
                user=username,
                password=connection.password,
                database=connection.database,
                port=connection.port,
                ssl_verify_cert=True
            )
            
            # Test the connection
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            cursor.close()
            conn.close()
            
            print("MySQL connection successful!")
            return {"status": "success"}
            
        except Error as e:
            print(f"MySQL Error: {str(e)}")
            error_message = str(e)
            if "Access denied" in error_message:
                raise HTTPException(status_code=400, detail="Invalid username or password")
            elif "Unknown database" in error_message:
                raise HTTPException(status_code=400, detail=error_message)
            else:
                raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Database type {connection.type} not yet implemented"
        ) 