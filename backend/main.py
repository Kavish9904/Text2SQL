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

class ChatRequest(BaseModel):
    message: str
    history: List[Message]

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
                }
                if '.mysql.database.azure.com' in query_request.host:
                    config['ssl_disabled'] = False
                
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