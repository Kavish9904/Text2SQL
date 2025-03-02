from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal, List
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

# Add these models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

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
        
        # Handle conversational queries first
        if any(word in query for word in ["hi", "hello", "hey", "greetings"]):
            return {
                "response": "Hello! I'm your database assistant. How can I help you today?",
                "sql": None,
                "data": None
            }
            
        # How are you
        elif any(phrase in query for phrase in ["how are you", "how're you", "how you doing"]):
            phrase = query  # or however you want to define the phrase variable
            response = f"I understand you want to {phrase}. Let me help you with that."
            return {
                "response": response,
                "sql": None,
                "data": None
            }
            
        # Thank you
        elif any(phrase in query for phrase in ["thank you", "thanks", "thx"]):
            return {
                "response": "You're welcome! Let me know if you need anything else.",
                "sql": None,
                "data": None
            }
            
        # Help or what can you do
        elif any(phrase in query for word in ["help", "what can you do", "capabilities"]):
            return {
                "response": """I can help you with several things:
1. Answer questions about your database
2. Show available tables and their contents
3. Help you query specific data
4. Create visualizations of your data

What would you like to know more about?""",
                "sql": None,
                "data": None
            }
            
        # Goodbye
        elif any(word in query for word in ["bye", "goodbye", "see you", "cya"]):
            return {
                "response": "Goodbye! Have a great day!",
                "sql": None,
                "data": None
            }

        # If not a conversational query, try to execute the database query
        try:
            # Create PostgreSQL connection
            conn = await asyncpg.connect(
                user=query_request.username,
                password=query_request.password,
                database=query_request.database,
                host=query_request.host,
                port=query_request.port
            )
            
            # Execute the query
            result = await conn.fetch(query)
            await conn.close()
            
            # Convert result to JSON-serializable format
            formatted_result = [dict(row) for row in result]
            
            return {
                "response": "Query executed successfully",
                "sql": query,
                "data": formatted_result
            }
            
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")  # Add logging
            return {
                "response": f"Database error: {str(db_error)}",
                "sql": query,
                "data": None
            }

    except Exception as e:
        print(f"General error: {str(e)}")  # Add logging
        return {
            "response": f"I encountered an error: {str(e)}. Please try again.",
            "sql": None,
            "data": None
        }

# Add this new endpoint
@app.post("/api/v1/chat")
async def chat(request: ChatRequest):
    try:
        message = request.message.lower()
        
        # Handle different types of queries
        if any(word in message for word in ["hi", "hello", "hey"]):
            return {"response": "Hello! I'm your SQL assistant. How can I help you with your database queries today?"}
            
        elif "help" in message or "what can you do" in message:
            return {"response": """I can help you with:
1. Writing SQL queries
2. Explaining database concepts
3. Optimizing your queries
4. Understanding your database structure

What would you like to know more about?"""}
            
        elif any(word in message for word in ["thanks", "thank you"]):
            return {"response": "You're welcome! Let me know if you need anything else."}
            
        elif "bye" in message or "goodbye" in message:
            return {"response": "Goodbye! Feel free to come back if you need more help."}
            
        else:
            # Default response for other queries
            return {"response": "I understand you're asking about databases. Could you please be more specific about what you'd like to know?"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))