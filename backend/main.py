from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from sqlalchemy import create_engine, Column, Integer, String
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, Session
# from passlib.context import CryptContext
# from jose import JWTError
# import jwt
# from datetime import datetime, timedelta

import openai
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
import sqlite3
from openai import OpenAI

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "https://text2sql-frontend.onrender.com",  # Your deployed frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the SQL Assistant API",
        "version": "1.0",
        "endpoints": {
            "/": "Root endpoint (GET)",
            "/api/test-connection": "Test database connection (POST)",
            "/api/v1/query": "Execute SQL queries (POST)",
            "/api/v1/chat": "Chat with SQL assistant (POST)"
        }
    }

class DatabaseConnection(BaseModel):
    display_name: str
    host: str
    port: int
    database: str
    username: str
    password: str

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
    database_credentials: Optional[dict] = None

class DatabaseMetadataRequest(BaseModel):
    host: str
    port: int
    database: str
    username: str
    password: str

@app.post("/api/test-connection")
async def test_connection(connection: DatabaseConnection):
    try:
        print(f"\nTesting connection to: {connection.host}")
        print(f"Port: {connection.port}")
        print(f"Database: {connection.database}")
        print(f"Username: {connection.username}")
        
        if '.mysql.database.azure.com' in connection.host:
            # Format username correctly for Azure
            server_name = connection.host.split('.')[0]  # Gets server name from the host
            full_username = f"{connection.username}"
            
            config = {
                'host': connection.host,
                'user': full_username,
                'password': connection.password,
                'database': connection.database,
                'port': connection.port,
                'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',
                'ssl_verify_cert': True
            }
            
            print("\n=== MySQL Connection Config ===")
            print({**config, 'password': '****'})
            print("=======================\n")
            
            try:
                conn = mysql.connector.connect(**config)
                conn.close()
                return {"success": True, "message": "MySQL connection successful!"}
            except mysql.connector.Error as mysql_error:
                print(f"MySQL connection error: {str(mysql_error)}")
                raise HTTPException(status_code=400, detail=f"MySQL connection error: {str(mysql_error)}")
        
        elif '.postgres.database.azure.com' in connection.host or connection.port == 5432:
            # PostgreSQL
            try:
                print("\n=== PostgreSQL Connection Config ===")
                print(f"Host: {connection.host}")
                print(f"Port: {connection.port}")
                print(f"Database: {connection.database}")
                print(f"Username: {connection.username}")
                print("=======================\n")
                
                conn = await asyncpg.connect(
                    user=connection.username,
                    password=connection.password,
                    database=connection.database,
                    host=connection.host,
                    port=connection.port,
                    ssl='require' if '.postgres.database.azure.com' in connection.host else None
                )
                await conn.close()
                return {"success": True, "message": "PostgreSQL connection successful!"}
            except asyncpg.PostgresError as pg_error:
                print(f"PostgreSQL connection error: {str(pg_error)}")
                raise HTTPException(status_code=400, detail=f"PostgreSQL connection error: {str(pg_error)}")
        
        else:
            error_msg = "Unsupported database type. Currently supporting PostgreSQL and MySQL."
            print(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

    except Exception as e:
        error_msg = f"Connection error: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)

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
                    # 'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',  # Standard CA bundle location
                    # 'ssl_verify_cert': True
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
        print("Starting chat endpoint...")
        message = request.message.lower()
        database_credentials = request.database_credentials
        
        # Extract table references and commands
        references = []
        commands = []
        table_info = ""  # Initialize table_info variable
        
        # Split message into words
        words = message.split()
        
        for word in words:
            # Handle table/column references
            if word.startswith('@'):
                ref = word[1:]  # Remove @ symbol
                if '.' in ref:
                    # Handle @table.* or @table.column format
                    table, col = ref.split('.')
                    references.append({
                        'table': table,
                        'column': '*' if col == '*' else col
                    })
                else:
                    # Handle @table format
                    references.append({
                        'table': ref,
                        'column': '*'
                    })
            
            # Handle commands
            elif word.startswith('/'):
                commands.append(word[1:])  # Remove / symbol
        
        print("References:", references)
        print("Commands:", commands)
        print("DATABASE CREDENTIALS:", database_credentials)
        print("------------PROMPT------------")
        
        # Load OpenAI API key
        load_dotenv()
        api_key = os.getenv("OPENAI_APIKEY")
        # print(f"API Key loaded: {'Yes' if api_key else 'No'}")
        # print(f"API Key length: {len(api_key) if api_key else 'None'}")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        natural_language_query = request.message
        chat_history = request.history
        
        try:
            # print("Initializing OpenAI client...")
            openai.api_key = api_key
            print("OpenAI client initialized successfully")
            
            if database_credentials:
                DB_NAME = database_credentials.get('type')
            else:
                DB_NAME = "PostgreSQL"  # default database

            metadata_description = "No metadata available"  # Default value
            if references and database_credentials:
                # Fetch table information if we have references and credentials
                try:
                    if database_credentials.get('type') == 'postgresql' or '.postgres.database.azure.com' in database_credentials.get('host', ''):
                        print("Connecting to POSTGRESQL...")
                        conn = await asyncpg.connect(
                            user=database_credentials['username'],
                            password=database_credentials['password'],
                            database=database_credentials['database'],
                            host=database_credentials['host'],
                            port=database_credentials['port'],
                            ssl='require' if '.postgres.database.azure.com' in database_credentials['host'] else None
                        )
                        for reference in references:
                            table_name = reference['table']
                            columns = await conn.fetch("""
                                SELECT column_name, data_type
                                FROM information_schema.columns
                                WHERE table_schema = 'public' AND table_name = $1
                            """, table_name)
                            
                            table_info += f"Table '{table_name}' has the following columns:\n"
                            for record in columns:
                                table_info += f"- {record['column_name']} ({record['data_type']})\n"
                            table_info += "\n"
                        await conn.close()
                        metadata_description = table_info if table_info else metadata_description
                    
                    elif database_credentials.get('type') == 'mysql' or '.mysql.database.azure.com' in database_credentials.get('host', ''):
                        print("Connecting to MYSQL...")
                        conn = mysql.connector.connect(
                            host=database_credentials['host'],
                            user=database_credentials['username'],
                            password=database_credentials['password'],
                            database=database_credentials['database'],
                            port=database_credentials['port'],
                            # ssl_ca='/etc/ssl/certs/ca-certificates.crt',
                            # ssl_verify_cert=True
                        )
                        cursor = conn.cursor()
                        # print("MySQL))))))")
                        for reference in references:
                            table_name = reference['table']
                            cursor.execute("""
                                SELECT COLUMN_NAME, DATA_TYPE
                                FROM INFORMATION_SCHEMA.COLUMNS
                                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s
                            """, (database_credentials['database'], table_name))
                        
                            columns = cursor.fetchall()
                            table_info += f"Table '{table_name}' has the following columns:\n"
                            for col_name, data_type in columns:
                                table_info += f"- {col_name} ({data_type})\n"
                            table_info += "\n\n"
                        
                        cursor.close()
                        conn.close()
                        metadata_description = table_info if table_info else metadata_description
                        # print("MySQL))))))")
                        # return {"response": table_info}
                    
                except Exception as db_error:
                    print(f"Error fetching table metadata: {str(db_error)}")
                    # Continue with default metadata description
            # print("METADATA DESCRIPTION:", metadata_description)
            
            prompt2 = f"""You are a helpful {DB_NAME} database agent that takes queries in natural language and converts it into a {DB_NAME} query. The database metadata is as follows- {metadata_description}.
                You must interact with the user as a database ai agent and convert the relevant user queries to {DB_NAME} query."""
            task2 = f"User: {natural_language_query}"
            
            print("Prompt:", prompt2+task2)
            print("--------------INSIDE------------------")
            
            messages = [
                {"role": "system", "content": prompt2}
            ]
            
            # Convert Message objects to dictionaries
            formatted_history = []
            for msg in chat_history:
                if isinstance(msg, Message):
                    formatted_history.append({"role": msg.role, "content": msg.content})
                elif isinstance(msg, dict):
                    formatted_history.append(msg)
            
            formatted_history.append({"role": "user", "content": task2})
            if formatted_history:
                messages.extend(formatted_history)

            print("Making OpenAI API call...")
            try:
                client = OpenAI(api_key=api_key)
                completion = client.chat.completions.create(
                    model="gpt-4o-mini",  # Changed from gpt-4o-mini to gpt-3.5-turbo (NO NEED TO CHANGE)
                    messages=messages,
                    temperature=0
                )
                print("OpenAI API call successful")
                openai_response = completion.choices[0].message.content.strip()
                print("ASSISTANT RESPONSE:")
                print(openai_response)
                chat_history.append({"role": "assistant", "content": openai_response})
                
                if openai_response != "":
                    return {"response": openai_response}
                else:
                    return {"response": "Please rephrase your query to make it more specific and relevant to the database!"}
                    
            except Exception as api_error:
                print(f"OpenAI API error details: {str(api_error)}")
                raise HTTPException(status_code=500, detail=f"Error with OpenAI API: {str(api_error)}")
                
        except Exception as client_error:
            print(f"Error initializing OpenAI client: {str(client_error)}")
            raise HTTPException(status_code=500, detail=f"Error initializing OpenAI client: {str(client_error)}")
            
    except Exception as e:
        print(f"General error in chat endpoint: {str(e)}")
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
        chats_dir = "chats"
        os.makedirs(chats_dir, exist_ok=True)

        # Read all chat files
        chat_files = []
        if os.path.exists(chats_dir):
            chat_files = [f for f in os.listdir(chats_dir) if f.endswith(".json")]
        
        chats = []
        for file in chat_files:
            try:
                with open(f"{chats_dir}/{file}", "r") as f:
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
                    with open(f"{chats_dir}/{file}", "w") as f:
                        json.dump(formatted_chat, f, indent=2)
                        
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error reading chat file {file}: {str(e)}")
                continue
        
        # Sort chats by createdAt in descending order
        try:
            chats.sort(key=lambda x: x["createdAt"], reverse=True)
        except Exception as e:
            print(f"Error sorting chats: {str(e)}")
            return chats
            
        return chats
    except Exception as e:
        print(f"Error in get_chat_history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/chats")
async def save_chat(chat: ChatSession):
    try:
        # Create chats directory if it doesn't exist
        chats_dir = "chats"
        os.makedirs(chats_dir, exist_ok=True)
        
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
        with open(f"{chats_dir}/{chat.id}.json", "w") as f:
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
