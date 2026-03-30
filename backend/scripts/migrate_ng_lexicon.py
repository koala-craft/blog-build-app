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

        # 1. 各ナレッジテーブルに is_ng カラムを追加
        tables = [
            "knowledge_spiritual",
            "knowledge_mindfulness",
            "knowledge_persona",
            "knowledge_empathy",
            "knowledge_reframing",
            "knowledge_action",
            "knowledge_copywriting",
            "knowledge_format"
        ]

        for table in tables:
            print(f"Adding is_ng to {table}...")
            cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_ng BOOLEAN DEFAULT FALSE;")

        # 2. knowledge_lexicon テーブルの作成
        print("Creating knowledge_lexicon table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_lexicon (
                id UUID PRIMARY KEY,
                forbidden_word VARCHAR,
                preferred_replacement VARCHAR,
                context_note TEXT,
                is_ng BOOLEAN DEFAULT TRUE,
                embedding VECTOR(1536),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    migrate()
