import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# DB接続設定（環境変数から取得。 SQLAlchemyの形式 +psycopg2 を除去）
DATABASE_URL_RAW = os.getenv("DATABASE_URL", "postgresql://ftuser:ftpassword@localhost:5432/fortunetelling")
DATABASE_URL = DATABASE_URL_RAW.replace("+psycopg2", "")

def migrate():
    print(f"Connecting to database: {DATABASE_URL}")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Successfully connected to the database.")

        # 1. カラム名のリネーム (forbidden_pattern -> style_pattern)
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'knowledge_style' AND column_name = 'forbidden_pattern');")
        if cur.fetchone()[0]:
            print("Renaming forbidden_pattern to style_pattern...")
            cur.execute("ALTER TABLE knowledge_style RENAME COLUMN forbidden_pattern TO style_pattern;")

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
