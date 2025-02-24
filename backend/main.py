from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import urllib.parse
import requests
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatabaseConnection(BaseModel):
    display_name: str
    host: str
    port: int
    database: str
    username: str
    password: str
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
    try:
        # Format username correctly for Azure
        server_name = connection.host.split('.')[0]  # Gets 'smartquery2' from the host
        full_username = f"{connection.username}"  # Don't append server name here
        
        conn_str = (
            f"host={connection.host} "
            f"port={connection.port} "
            f"dbname={connection.database} "
            f"user={full_username} "
            f"password={connection.password} "
            "sslmode=require"
        )
        
        print("\n=== Connection String ===")
        print(conn_str.replace(connection.password, "****"))
        print("=======================\n")
        
        conn = psycopg2.connect(conn_str)
        conn.close()
        return {"success": True, "message": "Connection successful!"}
    except Exception as e:
        print(f"Connection error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

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