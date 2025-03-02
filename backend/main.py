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
import psycopg2
import urllib.parse
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

global_conn = None
global_connstr = None
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
        print("QUERY:", query)
        # print("QUERY REQUEST:", query_request)
        api_key = fetch_api_key()
        # print("API KEY:", api_key)

        # Create OpenAI client
        client = OpenAI(api_key=api_key)

        # if not connected to the database, connect to the database
        if not global_conn:
            connection = psycopg2.connect(global_connstr)
        else:
            connection = global_conn
        # print("OPEN AI CLIENT:", connection)
        if not connection:
            raise HTTPException(status_code=500, detail="Failed to connect to the database.")
        # print("CONNECTION:", connection)
        # Fetch metadata
        metadata = fetch_table_metadata(connection)
        # print("METADATA:", metadata)

        # Generate SQL query
        # if chat history is not empty then for the next time, use the chat history
        # global session_started
        # if not session_started:
        #     chat_history = []
        #     session_started = True
        
        query, database_related_query = generate_sql_query(query, metadata, client, determine_db_type(connection))
        
        print("SQL QUERY:", query)
        if not query:
            raise HTTPException(status_code=400, detail="Failed to generate SQL query.")

        if not database_related_query:
            return {
                "response": query,
                "sql": None,
                "results": None
            }
        
        # Execute SQL query
        # results, column_names = execute_query(connection, query)
        results = query
        # print("RESULTS:", results)
        if results is None:
            raise HTTPException(status_code=400, detail="Failed to execute SQL query.")
        
        # Format the response
        # item = results[0]
        # table_html = (
        #     "<table border='1'>"
        #     "<tr><th>item_id</th><th>item_name</th><th>description</th><th>quantity</th><th>unit_price</th><th>supplier</th></tr>"
        #     f"<tr><td>{item['item_id']}</td><td>{item['item_name']}</td><td>{item['description']}</td>"
        #     f"<td>{item['quantity']}</td><td>{item['unit_price']:.2f}</td><td>{item['supplier']}</td></tr>"
        #     "</table>"
        # )
        # print("TABLE HTML:", table_html)
        # response_message = (
        #     f"Query executed successfully. Let me retrieve the most expensive item from your inventory database.<br><br>"
        #     f"{table_html}<br><br>"
        #     f"The most expensive item in your inventory is a {item['description']} {item['item_name']} "
        #     f"priced at <b>${item['unit_price']:.2f}</b>.<br><br>"
        #     f"This {item['item_name']} is supplied by {item['supplier']}, and you currently have "
        #     f"{item['quantity']} units in stock."
        # )
        # print("RESPONSE MESSAGE:", response_message)


        return {
            "response": results,
            "sql": query,
            "results": results
        }

        
        # # Greetings
        # if any(word in query for word in ["hi", "hello", "hey", "greetings"]):
        #     return {
        #         "response": "Hello! I'm your database assistant. How can I help you today?",
        #         "sql": None
        #     }
            
        # # How are you
        # elif any(phrase in query for phrase in ["how are you", "how're you", "how you doing"]):
        #     return {
        #         "response": "I'm doing well, thank you for asking! How can I assist you with your database queries?",
        #         "sql": None
        #     }
            
        # # Thank you
        # elif any(phrase in query for phrase in ["thank you", "thanks", "thx"]):
        #     return {
        #         "response": "You're welcome! Let me know if you need anything else.",
        #         "sql": None
        #     }
            
        # # Help or what can you do
        # elif any(phrase in query for phrase in ["help", "what can you do", "capabilities"]):
        #     return {
        #         "response": """I can help you with several things:
        #                 1. Answer questions about your database
        #                 2. Show available tables and their contents
        #                 3. Help you query specific data
        #                 4. Create visualizations of your data

        #                 What would you like to know more about?""",
        #         "sql": None
        #     }
            
        # # Goodbye
        # elif any(word in query for word in ["bye", "goodbye", "see you", "cya"]):
        #     return {
        #         "response": "Goodbye! Have a great day!",
        #         "sql": None
        #     }
            
        # # Default response
        # else:
        #     return {
        #         "response": "I understand you want to interact with the database. You can start by asking for 'help' to see what I can do.",
        #         "sql": None
        #     }

    except Exception as e:
        print("Error:", e)
        return {
            "response": "I encountered an error processing your request. Please try again.",
            "sql": None
        }

@app.post("/api/v1/execute-query")
async def execute_sql_query(query_request: QueryRequest):
    try:
        # Ensure the global connection is used or establish a new one
        if not global_conn:
            connection = psycopg2.connect(global_connstr)
        else:
            connection = global_conn

        if not connection:
            raise HTTPException(status_code=500, detail="Failed to connect to the database.")

        # Execute the query using the execute_query function from script.py
        results, column_names = execute_query(connection, query_request.query)

        if results is None:
            raise HTTPException(status_code=400, detail="Failed to execute SQL query.")

        return {
            "success": True,
            "results": results,
            "columns": column_names
        }

    except Exception as e:
        print("Error executing query:", e)
        return {
            "success": False,
            "error": str(e)
        }


@app.get("/api/v1/chat-history")
async def get_chat_history():
    try:
        # display names of every file in chats folder
        if not os.path.exists("chats"):
            os.makedirs("chats")
        
        chat_history = os.listdir("chats")
        return {"success": True, "chat_history": chat_history}
    
    except Exception as e:
        print("Error reading chat names:", e)
        raise HTTPException(status_code=500, detail="Failed to get every chat.")


@app.get("/api/v1/chat-history/{chat_name}")
async def get_chat_history_by_name(chat_name: str):
    try:
        if not os.path.exists(f"chats/{chat_name}"):
            raise HTTPException(status_code=404, detail=f"Chat history for {chat_name} not found.")
        
        with open(f"chats/{chat_name}", "r") as file:
            chat_history = json.load(file)
        return {"success": True, "chat_history": chat_history}
    
    except Exception as e:
        print(f"Error reading chat history for {chat_name}:", e)
        raise HTTPException(status_code=500, detail=f"Failed to read chat history for {chat_name}.")
