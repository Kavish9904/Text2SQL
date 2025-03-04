from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from sqlalchemy import create_engine, Column, Integer, String
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, Session
# from passlib.context import CryptContext
# from jose import JWTError
# import jwt
# from datetime import datetime, timedelta

from pydantic import BaseModel
from typing import Optional, Literal, List
import mysql.connector
from mysql.connector import Error
import duckdb
import clickhouse_driver
import requests
import json
from script import * # fetch_api_key, fetch_credentials, create_db_connection, fetch_table_metadata, generate_sql_query, execute_query, determine_db_type
import os
from datetime import datetime
import psycopg2
import asyncpg

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
    type: Optional[Literal["postgresql", "mysql", "motherduck", "clickhouse", "cloudflare"]] = None

# Add these models
class Message(BaseModel):
    role: str
    content: str

class ChatSession(BaseModel):
    id: str
    messages: List[Message]
    createdAt: str
    title: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

class DatabaseMetadataRequest(BaseModel):
    host: str
    port: int
    database: str
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
        # connection = psycopg2.connect(
        #     host=connection.host,
        #     user=connection.username,
        #     password=connection.password,
        #     database=connection.database,
        #     port=connection.port,
        #     sslmode="require"
        # )
        
        print("\n=== Connection String ===")
        print(conn_str.replace(connection.password, "****"))
        print("=======================\n")
        
        conn = psycopg2.connect(conn_str)
        # conn.close()
        global global_connstr, global_conn
        global_connstr = conn_str
        global_conn = conn
        return {"success": True, "message": "Connection successful!"}
    
    except Exception as e:
        print(f"Connection error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# def open_connection():
#     return psycopg2.connect(global_connstr)

# session_started = False
# Add this new endpoint
@app.post("/api/v1/query")
async def handle_query(query_request: QueryRequest):
    try:
        query = query_request.query.strip()

        try:
            result = None
            
            # Determine database type from the connection string or configuration
            if '.postgres.database.azure.com' in query_request.host or query_request.port == 5432:
                # PostgreSQL
                conn = await asyncpg.connect(
                    user=query_request.username,
                    password=query_request.password,
                    database=query_request.database,
                    host=query_request.host,
                    port=query_request.port,
                    ssl='require' if '.postgres.database.azure.com' in query_request.host else None
                )
                result = await conn.fetch(query)
                await conn.close()
                formatted_result = [dict(row) for row in result]

            elif '.mysql.database.azure.com' in query_request.host or query_request.port == 3306:
                # MySQL
                config = {
                    'host': query_request.host,
                    'user': query_request.username,
                    'password': query_request.password,
                    'database': query_request.database,
                    'port': query_request.port,
                    'ssl_disabled': True  # Disable SSL for now to test connection
                }
                
                print("Connecting to MySQL with config:", {**config, 'password': '****'})  # Debug log
                
                conn = mysql.connector.connect(**config)
                cursor = conn.cursor(dictionary=True)
                cursor.execute(query)
                formatted_result = cursor.fetchall()
                cursor.close()
                conn.close()

            elif 'motherduck' in query_request.host.lower():
                # MotherDuck
                conn_str = f"md:{query_request.database}?token={query_request.password}"  # Using password field for token
                conn = duckdb.connect(conn_str)
                result = conn.execute(query).fetchall()
                columns = conn.execute(query).description
                formatted_result = [
                    dict(zip([col[0] for col in columns], row))
                    for row in result
                ]
                conn.close()

            elif 'clickhouse' in query_request.host.lower():
                # ClickHouse
                client = clickhouse_driver.Client(
                    host=query_request.host,
                    port=query_request.port,
                    user=query_request.username,
                    password=query_request.password,
                    database=query_request.database,
                    secure=True
                )
                result = client.execute(query)
                columns = client.execute(query, with_column_types=True)[1]
                formatted_result = [
                    dict(zip([col[0] for col in columns], row))
                    for row in result
                ]

            elif 'cloudflare' in query_request.host.lower():
                # Cloudflare D1
                headers = {
                    'Authorization': f'Bearer {query_request.password}',  # Using password field for API token
                    'Content-Type': 'application/json'
                }
                url = f"https://api.cloudflare.com/client/v4/accounts/{query_request.username}/d1/database/{query_request.database}/query"  # Using username field for account_id
                response = requests.post(url, headers=headers, json={"sql": query})
                if response.status_code != 200:
                    raise Exception(f"Cloudflare D1 error: {response.text}")
                formatted_result = response.json()['result']

            else:
                raise Exception("Unknown database type. Please check your connection settings.")

            return {
                "response": "Query executed successfully",
                "sql": query,
                "data": formatted_result
            }

        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            return {
                "response": f"Database error: {str(db_error)}",
                "sql": query,
                "data": None
            }

    except Exception as e:
        print(f"General error: {str(e)}")
        return {
            "response": f"Error: {str(e)}",
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

def generate_chat_title(messages):
    if not messages:
        return "New Chat"
    
    # Get the first user message
    first_message = None
    for msg in messages:
        if isinstance(msg, dict) and msg.get("role") == "user" and msg.get("content"):
            first_message = msg["content"]
            break
    
    if not first_message:
        return "New Chat"
    
    # Generate title from the first message
    title = first_message.strip()
    # Truncate to first 30 characters and add ellipsis if longer
    if len(title) > 30:
        title = title[:27] + "..."
    return title

@app.get("/api/v1/chats")
async def get_chat_history():
    try:
        # Create chats directory if it doesn't exist
        os.makedirs("chats", exist_ok=True)

        # Read all chat files from the chats directory
        chat_files = []
        if os.path.exists("chats"):
            chat_files = [f for f in os.listdir("chats") if f.endswith(".json")]
        
        chats = []
        for file in chat_files:
            try:
                with open(f"chats/{file}", "r") as f:
                    data = json.load(f)
                    
                    # Handle case where file contains a list
                    if isinstance(data, list):
                        chat = {
                            "id": file.replace(".json", ""),
                            "messages": [],
                            "createdAt": datetime.now().isoformat(),
                            "title": "New Chat"
                        }
                        # Convert list items to messages if possible
                        for item in data:
                            if isinstance(item, dict) and "content" in item:
                                chat["messages"].append({
                                    "role": item.get("role", "user"),
                                    "content": item["content"]
                                })
                            elif isinstance(item, str):
                                chat["messages"].append({
                                    "role": "user",
                                    "content": item
                                })
                    else:
                        chat = data if isinstance(data, dict) else {}
                    
                    # Format messages
                    messages = chat.get("messages", [])
                    formatted_messages = []
                    if isinstance(messages, list):
                        for msg in messages:
                            if isinstance(msg, dict):
                                formatted_messages.append({
                                    "role": msg.get("role", "user"),
                                    "content": msg.get("content", "")
                                })
                            elif isinstance(msg, str):
                                formatted_messages.append({
                                    "role": "user",
                                    "content": msg
                                })
                    
                    # Create properly formatted chat object with generated title
                    formatted_chat = {
                        "id": chat.get("id", file.replace(".json", "")),
                        "messages": formatted_messages,
                        "createdAt": chat.get("createdAt", datetime.now().isoformat()),
                        "title": chat.get("title") or generate_chat_title(formatted_messages)
                    }
                    
                    chats.append(formatted_chat)
                    
                    # Update the file with the fixed structure
                    with open(f"chats/{file}", "w") as f:
                        json.dump(formatted_chat, f, indent=2)
                        
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error reading chat file {file}: {str(e)}")
                continue
        
        # Sort chats by createdAt in descending order
        try:
            chats.sort(key=lambda x: x["createdAt"], reverse=True)
        except Exception as e:
            print(f"Error sorting chats: {str(e)}")
            # Return unsorted chats if sorting fails
            return chats
            
        return chats
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chats")
async def save_chat(chat: ChatSession):
    try:
        # Create chats directory if it doesn't exist
        os.makedirs("chats", exist_ok=True)
        
        # Generate title if not provided
        title = chat.title or generate_chat_title(chat.messages)
        
        # Ensure the chat data is properly formatted
        chat_data = {
            "id": chat.id,
            "messages": [{"role": msg.role, "content": msg.content} for msg in chat.messages],
            "createdAt": chat.createdAt,
            "title": title
        }
        
        # Save chat to a file
        with open(f"chats/{chat.id}.json", "w") as f:
            json.dump(chat_data, f, indent=2)
        
        return {"message": "Chat saved successfully"}
    except Exception as e:
        print(f"Error in save_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/chats/{chat_id}")
async def get_chat(chat_id: str):
    try:
        # Check if chat file exists
        chat_path = f"chats/{chat_id}.json"
        if not os.path.exists(chat_path):
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Read chat from file
        try:
            with open(chat_path, "r") as f:
                chat = json.load(f)
            return chat
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading chat file {chat_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error reading chat: {str(e)}")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in get_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/chats/{chat_id}")
async def delete_chat(chat_id: str):
    try:
        # Check if chat file exists
        chat_path = f"chats/{chat_id}.json"
        if not os.path.exists(chat_path):
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Delete chat file
        try:
            os.remove(chat_path)
            return {"message": "Chat deleted successfully"}
        except IOError as e:
            print(f"Error deleting chat file {chat_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in delete_chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/metadata")
async def get_metadata(request: DatabaseMetadataRequest):
    try:
        # Determine database type and establish connection
        if '.postgres.database.azure.com' in request.host or request.port == 5432:
            # PostgreSQL connection
            conn = psycopg2.connect(
                host=request.host,
                user=request.username,
                password=request.password,
                database=request.database,
                port=request.port,
                sslmode='require' if '.postgres.database.azure.com' in request.host else None
            )
            
            # Query to fetch table and column information
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    table_name,
                    array_agg(ARRAY[column_name, data_type]) as columns
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                GROUP BY table_name;
            """)
            
            # Format the results
            metadata = {}
            for table_name, columns in cursor.fetchall():
                metadata[table_name] = columns
            
            cursor.close()
            conn.close()
            
            return metadata

        elif '.mysql.database.azure.com' in request.host or request.port == 3306:
            # MySQL connection
            conn = mysql.connector.connect(
                host=request.host,
                user=request.username,
                password=request.password,
                database=request.database,
                port=request.port,
                ssl_disabled=True
            )
            
            cursor = conn.cursor()
            
            # Get all tables
            cursor.execute("""
                SELECT 
                    TABLE_NAME,
                    GROUP_CONCAT(CONCAT(COLUMN_NAME, ',', DATA_TYPE) SEPARATOR ';') as columns
                FROM information_schema.columns 
                WHERE table_schema = %s
                GROUP BY TABLE_NAME;
            """, (request.database,))
            
            # Format the results
            metadata = {}
            for table_name, columns_str in cursor.fetchall():
                if columns_str:
                    columns = []
                    for col in columns_str.split(';'):
                        name, type_ = col.split(',')
                        columns.append([name, type_])
                    metadata[table_name] = columns
            
            cursor.close()
            conn.close()
            
            return metadata

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported database type. Currently supporting PostgreSQL and MySQL."
            )

    except Exception as e:
        print(f"Error fetching metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))