import os
import psycopg2
from openai import OpenAI
from dotenv import load_dotenv

# load_dotenv()

def fetch_api_key():
    load_dotenv()
    api_key = os.getenv("OPENAI_APIKEY")
    if not api_key:
        raise ValueError("API key not found in the environment.")
    return api_key


def fetch_credentials():
    load_dotenv()
    credentials = {
        'PGHOST': os.getenv('PGHOST'),
        'PGUSER': os.getenv('PGUSER'),
        'PGPORT': os.getenv('PGPORT'),
        'PGDATABASE': os.getenv('PGDATABASE'),
        'PGPASSWORD': os.getenv('PGPASSWORD')
    }
    if not all(credentials.values()):
        raise ValueError("Database credentials are incomplete in the environment.")
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
        # for row in results:
        #     row_dict = dict(zip(column_names, row))
        #     rows.append(row_dict)
        for row in results:
            print(row)
        return results
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
    
    # Check if the query is relevant to the database
    if not is_database_query(natural_language_query, metadata_description, client):
        # print("The query does not seem to be related to database operations.")
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": natural_language_query}
                ],
                temperature=0
            )
            response = response.choices[0].message.content.strip()
            response = 'This query does not seem to be related to database operations. Here is the response from the assistant: ' + response
            return response, False
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return None, False

    try:
        prompt = f"You are a helpful assistant that converts natural language queries into {DB_NAME} queries. You must only return the {DB_NAME} query, nothing else. Here is the database schema:\n{metadata_description}"
        task = f"Convert the following natural language query into a valid {DB_NAME} query:\n{natural_language_query}\nEnsure the query is compatible with {DB_NAME} syntax."
        print(prompt+task)
        print("--------------------------------")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": task}
            ],
            temperature=0
        )
        query = response.choices[0].message.content.strip().replace("```sql", "").replace("```", "")
        # delete '\n' from the start of the query
        query = query.lstrip('\n').rstrip('\n')
        return query, True
    
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
            query, is_database_query = generate_sql_query(query, metadata, client, DB_NAME)
            if query:
                if is_database_query:
                    print("\nGenerated SQL Query:", query)
                    print("\nResults:")
                    results = execute_query(connection, query)
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


# if __name__ == "__main__":
#     main()