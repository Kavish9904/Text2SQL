from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
import mysql.connector
from mysql.connector import Error
import duckdb
import clickhouse_driver
import requests
import asyncpg
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatabaseConnection(BaseModel):
    type: Literal["postgresql", "mysql", "motherduck", "clickhouse", "cloudflare"]
    display_name: str
    host: str
    port: int
    database: str
    username: str
    password: str
    token: Optional[str] = None
    account_id: Optional[str] = None
    database_id: Optional[str] = None
    api_token: Optional[str] = None
    ip_whitelist: list[str]

# Add this class for query requests
class QueryRequest(BaseModel):
    query: str
    database: str
    host: str
    port: int
    username: str
    password: str

@app.post("/api/test-connection")
async def test_connection(connection: DatabaseConnection):
    print(f"\nTesting {connection.type} connection...")
    
    try:
        if connection.type == "postgresql":
            print("Connecting to PostgreSQL...")
            # For Azure PostgreSQL, use the username as is
            conn = await asyncpg.connect(
                user=connection.username,  # Don't modify the username
                password=connection.password,
                database=connection.database,
                host=connection.host,
                port=connection.port,
                ssl='require' if '.postgres.database.azure.com' in connection.host else None
            )
            await conn.execute('SELECT 1')
            await conn.close()
            print("PostgreSQL connection successful!")

        elif connection.type == "mysql":
            config = {
                'host': connection.host,
                'user': connection.username,
                'password': connection.password,
                'database': connection.database,
                'port': connection.port,
            }
            if '.mysql.database.azure.com' in connection.host:
                config['ssl_disabled'] = False
            
            conn = mysql.connector.connect(**config)
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            cursor.fetchone()
            cursor.close()
            conn.close()

        elif connection.type == "motherduck":
            if not connection.token:
                raise ValueError("MotherDuck token is required")
            
            conn_str = f"md:{connection.database}?token={connection.token}"
            conn = duckdb.connect(conn_str)
            conn.execute('SELECT 1')
            conn.close()

        elif connection.type == "clickhouse":
            client = clickhouse_driver.Client(
                host=connection.host,
                port=connection.port,
                user=connection.username,
                password=connection.password,
                database=connection.database,
                secure=True
            )
            client.execute('SELECT 1')

        elif connection.type == "cloudflare":
            if not connection.account_id or not connection.database_id or not connection.api_token:
                raise ValueError("Cloudflare D1 requires account_id, database_id, and api_token")
                
            headers = {
                'Authorization': f'Bearer {connection.api_token}',
                'Content-Type': 'application/json'
            }
            
            url = f"https://api.cloudflare.com/client/v4/accounts/{connection.account_id}/d1/database/{connection.database_id}/query"
            response = requests.post(
                url,
                headers=headers,
                json={"sql": "SELECT 1"}
            )
            
            if response.status_code != 200:
                raise ValueError(f"Cloudflare D1 error: {response.text}")

        else:
            raise ValueError(f"Unsupported database type: {connection.type}")

        print(f"{connection.type} connection successful!")
        return {"status": "success"}

    except asyncpg.InvalidPasswordError:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    except asyncpg.InvalidCatalogNameError:
        raise HTTPException(status_code=400, detail="Database does not exist")
    except Exception as e:
        print(f"Connection error: {str(e)}")
        raise HTTPException(
            status_code=400, 
            detail="Failed to connect to database. Please check your connection details."
        )

# Add this new endpoint
@app.post("/api/v1/query")
async def handle_query(query_request: QueryRequest):
    try:
        query = query_request.query.lower().strip()
        
        # Greetings
        if any(word in query for word in ["hi", "hello", "hey", "greetings"]):
            return {
                "response": "Hello! I'm your database assistant. How can I help you today?",
                "sql": None
            }
            
        # How are you
        elif any(phrase in query for phrase in ["how are you", "how're you", "how you doing"]):
            return {
                "response": "I'm doing well, thank you for asking! How can I assist you with your database queries?",
                "sql": None
            }
            
        # Thank you
        elif any(phrase in query for phrase in ["thank you", "thanks", "thx"]):
            return {
                "response": "You're welcome! Let me know if you need anything else.",
                "sql": None
            }
            
        # Help or what can you do
        elif any(phrase in query for phrase in ["help", "what can you do", "capabilities"]):
            return {
                "response": """I can help you with several things:
1. Answer questions about your database
2. Show available tables and their contents
3. Help you query specific data
4. Create visualizations of your data

What would you like to know more about?""",
                "sql": None
            }
            
        # Goodbye
        elif any(word in query for word in ["bye", "goodbye", "see you", "cya"]):
            return {
                "response": "Goodbye! Have a great day!",
                "sql": None
            }
            
        # Default response
        else:
            return {
                "response": "I understand you want to interact with the database. You can start by asking for 'help' to see what I can do.",
                "sql": None
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "response": "I encountered an error processing your request. Please try again.",
            "sql": None
        }