import os
import pymysql
import environ
import subprocess
from pathlib import Path
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

class DatabaseConnectionError(Exception):
    pass

class QueryExecutionError(Exception):
    pass

class MySQLConnectionPool:
    """
    A simple singleton for managing the MySQL connection lifecycle.
    """
    _connection = None

    @classmethod
    def get_connection(cls):
        if cls._connection is None or not cls._connection.open:
            try:
                cls._connection = pymysql.connect(
                    host=env('DB_HOST', default='127.0.0.1'),
                    port=env.int('DB_PORT', default=3306),
                    user=env('DB_USER', default='root'),
                    password=env('DB_PASSWORD', default=''),
                    database=env('DB_NAME', default='setup'),
                    charset='utf8mb4',
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=False
                )
            except pymysql.MySQLError as e:
                raise DatabaseConnectionError(f"Failed to connect to MySQL: {e}")
        return cls._connection

    @classmethod
    def close(cls):
        if cls._connection and cls._connection.open:
            cls._connection.close()

@contextmanager
def get_cursor(commit=False):
    """
    Context manager for getting a cursor. Handles commit/rollback.
    """
    conn = MySQLConnectionPool.get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise QueryExecutionError(f"Transaction failed: {e}")
    finally:
        cursor.close()

def execute_query(query, params=None, fetch_all=True, commit=False):
    """
    Query execution helper with automatic error handling.
    """
    with get_cursor(commit=commit) as cursor:
        cursor.execute(query, params or ())
        if query.strip().upper().startswith('SELECT'):
            return cursor.fetchall() if fetch_all else cursor.fetchone()
        return cursor.rowcount

def bootstrap_database():
    """
    Bootstraps the MySQL database using setup.db file via the MySQL CLI.
    This handles statements like DELIMITER perfectly.
    """
    setup_file = BASE_DIR / 'setup.db'
    if not setup_file.exists():
        raise FileNotFoundError("setup.db script not found.")

    host = env('DB_HOST', default='127.0.0.1')
    port = env('DB_PORT', default='3306')
    user = env('DB_USER', default='root')
    password = env('DB_PASSWORD', default='')
    
    # We execute using mysql client because of DELIMITER support which pymysql lacks
    cmd = ['mysql', f'-h{host}', f'-P{port}', f'-u{user}']
    if password:
        cmd.append(f'-p{password}')

    print("Executing setup.db...")
    with open(setup_file, 'rb') as f:
        process = subprocess.run(cmd, stdin=f, capture_output=True, text=True)

    if process.returncode != 0:
        raise QueryExecutionError(f"Failed to bootstrap database.\nStandard Error Details:\n{process.stderr}")

    print("Database bootstrapped successfully!")

if __name__ == '__main__':
    # Easy testing when running script directly
    try:
        bootstrap_database()
    except Exception as e:
        print(e)
