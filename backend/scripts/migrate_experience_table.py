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

        # 1. テーブルの作成
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_experience (
                id UUID PRIMARY KEY,
                experience_summary VARCHAR,
                story_detail TEXT,
                emotional_point TEXT,
                source_url VARCHAR,
                is_ng BOOLEAN DEFAULT FALSE,
                embedding vector(1536),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # インデックスの作成 (ベクトル検索用)
        cur.execute("CREATE INDEX IF NOT EXISTS knowledge_experience_embedding_idx ON knowledge_experience USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);")

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
