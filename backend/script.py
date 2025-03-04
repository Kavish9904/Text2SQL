import json
import os
import psycopg2
from openai import OpenAI
from dotenv import load_dotenv

# Try to load from .env file, but don't fail if it doesn't exist
try:
    load_dotenv()
except Exception:
    pass

def fetch_api_key():
    api_key = os.getenv("OPENAI_APIKEY")
    if not api_key:
        raise ValueError("OpenAI API key not found in environment variables. Please set OPENAI_APIKEY.")
    return api_key

def fetch_credentials():
    required_vars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT']
    credentials = {}
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value is None:
            missing_vars.append(var)
        credentials[var] = value
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    return credentials


def create_db_connection(credentials):
    try:
        # Connect to the PostgreSQL database
        connection = psycopg2.connect(
            host=credentials['PGHOST'],
            user=credentials['PGUSER'],
            password=credentials['PGPASSWORD'],
            database=credentials['PGDATABASE'],
            port=credentials['PGPORT']
        )
        return connection
    except Exception as e:
        print(f"Error connecting to the database: {str(e)}")
        return None


def fetch_table_metadata(connection):
    metadata_info = {}
    try:
        cursor = connection.cursor()
        
        # Query to fetch table names
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = cursor.fetchall()
        
        for (table_name,) in tables:
            cursor.execute(f"""
                SELECT 
                    column_name, 
                    data_type 
                FROM 
                    information_schema.columns 
                WHERE 
                    table_name = '{table_name}';
            """)
            columns = cursor.fetchall()
            metadata_info[table_name] = columns
    except Exception as e:
        print(f"Error fetching table metadata: {str(e)}")
    return metadata_info


def determine_db_type(connection):
    # This function determines the database type based on the connection object
    # For now, it checks if the connection is a psycopg2 connection (PostgreSQL)
    if isinstance(connection, psycopg2.extensions.connection):
        return "PostgreSQL"
    # Add more checks here for other database types if needed
    return "MySQL"


def execute_query(connection, query):
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        # Fetch column names
        column_names = [desc[0] for desc in cursor.description]
        # Create a dictionary for each row
        rows = []
        # Attach column names to the results
        # results = [dict(zip(column_names, row)) for row in results]
        # for row in results:
        #     row_dict = dict(zip(column_names, row))
        #     rows.append(row_dict)
        for row in results:
            print(row)
        return results, column_names
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return None


def close_connection(connection):
    connection.close()
    

def is_database_query(natural_language_query, metadata_description, client):
    try:
        prompt = f"""Given the following database schema:
        {metadata_description}
        Determine if this query is related to database operations: "{natural_language_query}"
        Return only "true" if it is database related, or "false" if not."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt}
            ],
            temperature=0
        )
        
        result = response.choices[0].message.content.strip().lower()
        print("DATABASE RELATED:", result)
        return result == "true"

    except Exception as e:
        print(f"Error checking if query is database related: {str(e)}")
        # Fall back to basic keyword matching if API call fails
        # for table, columns in metadata.items():
        #     if table.lower() in natural_language_query.lower():
        #         return True
        #     for column, _ in columns:
        #         if column.lower() in natural_language_query.lower():
        #             return True
        return False


def generate_sql_query(natural_language_query, metadata, client, DB_NAME="PostgreSQL"):
    metadata_description = "\n".join(
        f"Table {table}: " + ", ".join(f"{col[0]} ({col[1]})" for col in columns)
        for table, columns in metadata.items()
    )
    # print(metadata_description)
    # Load chat history from the file if it exists
    try:
        with open("chat_history.json", "r") as f:
            # check for file empty or not
            if os.path.getsize("chat_history.json") == 0:
                chat_history = []
            else:
                chat_history = json.load(f)
    except FileNotFoundError:
        chat_history = []
    
    # # Check if the query is relevant to the database
    # if not is_database_query(natural_language_query, metadata_description, client):
    #     # print("The query does not seem to be related to database operations.")
    #     try:
    #         response = client.chat.completions.create(
    #             model="gpt-4o-mini",
    #             messages=[
    #                 {"role": "system", "content": "You are a helpful assistant."},
    #                 {"role": "user", "content": natural_language_query}
    #             ],
    #             temperature=0
    #         )
    #         response = response.choices[0].message.content.strip()
    #         response = 'This query does not seem to be related to database operations. Here is the response from the assistant: ' + response
    #         return response, False
    #     except Exception as e:
    #         print(f"Error generating response: {str(e)}")
    #         return None, False

    try:
        prompt2 = f"""You are a helpful {DB_NAME} database agent that takes queries in natural language and converts it into a {DB_NAME} query. The database metadata is as follows- {metadata_description}.
                You must interact with the user as a database ai agent and convert the relevant user queries to {DB_NAME} query. Before returning anything you must specify first whether the variable is_related_to_database = True or False. From the next line onwards you can return your response."""
        task2 = f"{natural_language_query}"
        # print(prompt2+task2)
        # prompt = f"You are a helpful assistant that converts natural language queries into {DB_NAME} queries. You must only return the {DB_NAME} query, nothing else. Here is the database schema:\n{metadata_description}"
        # task = f"Convert the following natural language query into a valid {DB_NAME} query:\n{natural_language_query}\nEnsure the query is compatible with {DB_NAME} syntax."
        # print(prompt+task)
        print("--------------------------------")
        messages = [
            {"role": "system", "content": prompt2}
        ]
        chat_history.append({"role": "user", "content": task2})
        if chat_history:
            messages.extend(chat_history)
        
        # max 128,000 tokens context window i.e. max 128,000 * 4 = 512,000 characters.
        # if chat_history has more than 512,000 characters, then truncate it
        count_tokens = 0
        for message in messages:
            count_tokens += len(message["content"])
            if count_tokens > 512000:
                # delete the oldest message if it is not the system message
                if messages[0]["role"] != "system":
                    messages.pop(0)
                    count_tokens -= len(messages[0]["content"])
        print("--------------------------------")
        print("MESSAGES:")
        print(messages)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0
        )
        # query = response.choices[0].message.content.strip().replace("```sql", "").replace("```", "")
        # # delete '\n' from the start of the query
        # query = query.lstrip('\n').rstrip('\n')
        assistant_response = response.choices[0].message.content.strip()
        print("ASSISTANT RESPONSE:")
        print(assistant_response)
        chat_history.append({"role": "assistant", "content": assistant_response})
        print("--------------------------------")
        
        # first line is the is_related_to_database
        is_related_to_database = assistant_response.split("\n")[0].strip().split(" ")[2].lower() == "true"
        sql_query = "\n".join(assistant_response.split("\n")[1:])
        # print(sql_query)
        # print(is_related_to_database)

        # instead of returning chat_history, append it into a json file
        with open("chat_history.json", "w") as f:
            json.dump(chat_history, f)
        
        
        return sql_query, is_related_to_database
    
    except Exception as e:
        print(f"Error generating SQL query: {str(e)}")
        return None, False


def main():
    api_key = fetch_api_key()
    credentials = fetch_credentials()

    client = OpenAI(api_key=api_key)
    connection = create_db_connection(credentials)
    
    if connection:
        metadata = fetch_table_metadata(connection)
        query = "Show me the most expensive item"
        try:
            print(f"Natural Language Query: {query}")
            DB_NAME = determine_db_type(connection)
            # chat_history = []
            query, is_database_query = generate_sql_query(query, metadata, client, DB_NAME)
            if query:
                if is_database_query:
                    print("\nGenerated SQL Query:", query)
                    print("\nResults:")
                    results, column_names = execute_query(connection, query)
                    for row in results:
                        print(row)
                else:
                    print("\nGenerated Response:", query)
            else:
                print("\nNo query generated.")

        except Exception as e:
            print(f"Error: {str(e)}")
        
        finally:
            connection.close()


if __name__ == "__main__":
    main()