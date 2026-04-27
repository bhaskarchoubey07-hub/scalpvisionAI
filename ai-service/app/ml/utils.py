import os
import psycopg2
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_db_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

def get_pg_conn():
    db_url = os.environ.get("DATABASE_URL")
    # Replace postgres:// with postgresql:// if needed for psycopg2
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    return psycopg2.connect(db_url)
