import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# DB接続設定
DATABASE_URL_RAW = os.getenv("DATABASE_URL", "postgresql://ftuser:ftpassword@localhost:5432/fortunetelling")
DATABASE_URL = DATABASE_URL_RAW.replace("+psycopg2", "")

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Successfully connected to the database.")

        # 新しいカラムの追加
        cur.execute("ALTER TABLE knowledge_experience ADD COLUMN IF NOT EXISTS instruction_worry TEXT;")
        cur.execute("ALTER TABLE knowledge_experience ADD COLUMN IF NOT EXISTS ideal_response TEXT;")

        conn.commit()
        print("Migration completed successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrate()
