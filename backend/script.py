import json
import os
from dotenv import load_dotenv
import mysql.connector
import duckdb
import clickhouse_driver
from sqlalchemy import create_engine, text
import pymysql

# Try to load from .env file, but don't fail if it doesn't exist
try:
    load_dotenv()
except Exception:
    pass

def create_db_connection(db_type, credentials):
    try:
        if db_type.lower() == 'mysql':
            connection = mysql.connector.connect(
                host=credentials.get('MYSQL_HOST'),
                user=credentials.get('MYSQL_USER'),
                password=credentials.get('MYSQL_PASSWORD'),
                database=credentials.get('MYSQL_DATABASE')
            )
        elif db_type.lower() == 'duckdb':
            connection = duckdb.connect(database=credentials.get('DUCKDB_PATH', ':memory:'))
        elif db_type.lower() == 'clickhouse':
            connection = clickhouse_driver.connect(
                host=credentials.get('CLICKHOUSE_HOST'),
                user=credentials.get('CLICKHOUSE_USER'),
                password=credentials.get('CLICKHOUSE_PASSWORD'),
                database=credentials.get('CLICKHOUSE_DATABASE')
            )
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
        return connection
    except Exception as e:
        print(f"Error connecting to {db_type} database: {str(e)}")
        return None

def fetch_table_metadata(connection, db_type):
    metadata_info = {}
    try:
        if db_type.lower() == 'mysql':
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            for (table_name,) in tables:
                cursor.execute(f"DESCRIBE {table_name}")
                columns = cursor.fetchall()
                metadata_info[table_name] = [(col[0], col[1]) for col in columns]
        elif db_type.lower() == 'duckdb':
            tables = connection.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'").fetchall()
            for (table_name,) in tables:
                columns = connection.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'").fetchall()
                metadata_info[table_name] = columns
        elif db_type.lower() == 'clickhouse':
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            for (table_name,) in tables:
                cursor.execute(f"DESCRIBE TABLE {table_name}")
                columns = cursor.fetchall()
                metadata_info[table_name] = [(col[0], col[1]) for col in columns]
    except Exception as e:
        print(f"Error fetching table metadata: {str(e)}")
    return metadata_info

def execute_query(connection, query, db_type):
    try:
        if db_type.lower() in ['mysql', 'clickhouse']:
            cursor = connection.cursor()
            cursor.execute(query)
            results = cursor.fetchall()
            column_names = [desc[0] for desc in cursor.description]
        elif db_type.lower() == 'duckdb':
            result = connection.execute(query)
            results = result.fetchall()
            column_names = [desc[0] for desc in result.description]
        
        return results, column_names
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return None, None

def close_connection(connection, db_type):
    try:
        connection.close()
    except Exception as e:
        print(f"Error closing connection: {str(e)}")

def determine_db_type(connection):
    if isinstance(connection, mysql.connector.connection.MySQLConnection):
        return "MySQL"
    elif isinstance(connection, duckdb.DuckDBPyConnection):
        return "DuckDB"
    elif isinstance(connection, clickhouse_driver.connection.Connection):
        return "ClickHouse"
    return "Unknown"

# Main function for testing
def main():
    # Example usage
    db_type = "mysql"  # or "duckdb" or "clickhouse"
    credentials = {
        'MYSQL_HOST': 'localhost',
        'MYSQL_USER': 'user',
        'MYSQL_PASSWORD': 'password',
        'MYSQL_DATABASE': 'test'
    }
    
    connection = create_db_connection(db_type, credentials)
    if connection:
        try:
            metadata = fetch_table_metadata(connection, db_type)
            print("Database Schema:")
            for table, columns in metadata.items():
                print(f"\nTable: {table}")
                for column in columns:
                    print(f"  {column[0]}: {column[1]}")
            
            # Example query
            query = "SELECT * FROM your_table LIMIT 5"
            results, column_names = execute_query(connection, query, db_type)
            if results:
                print("\nQuery Results:")
                print("Columns:", column_names)
                for row in results:
                    print(row)
        
        finally:
            close_connection(connection, db_type)

if __name__ == "__main__":
    main()